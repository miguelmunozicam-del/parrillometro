/*
 * Parrillómetro — motor de cálculo
 * Función pura: recibe las respuestas y la configuración y devuelve
 * la lista de la compra. Sin DOM, para poder probarla con Node.
 */
(function (root) {
  const EPS = 1e-9;

  function buscar(lista, id) {
    return lista.find((x) => x.id === id) || lista[0];
  }

  // Redondea hacia arriba al múltiplo de 'paso' (con tolerancia a decimales).
  function redondearArriba(cantidad, paso) {
    if (cantidad <= EPS) return 0;
    return Math.ceil(cantidad / paso - EPS) * paso;
  }

  function calcular(input, cfg) {
    const adultos = Math.max(0, input.adultos | 0);
    const adolescentes = Math.max(0, input.adolescentes | 0);
    const ninos = Math.max(0, input.ninos | 0);
    const personas = adultos + adolescentes + ninos;
    const vegetarianos = Math.min(Math.max(0, input.vegetarianos | 0), personas);

    const dur = buscar(cfg.duracion, input.duracion);
    const ape = buscar(cfg.apetito, input.apetito);
    const sed = buscar(cfg.sed, input.sed);
    const sinAlc = buscar(cfg.sinAlcohol, input.sinAlcohol);
    const tiempo = buscar(cfg.tiempo, input.tiempo);
    const pctCerveza = Math.min(100, Math.max(0, Number(input.pctCerveza ?? 80))) / 100;
    const precios = input.precios || {};

    const fc = cfg.factorComensal;
    const comensales = adultos * fc.adultos + adolescentes * fc.adolescentes + ninos * fc.ninos;
    // Los vegetarianos se descuentan como adultos (sin bajar de cero).
    const comensalesCarne = Math.max(0, comensales - vegetarianos * fc.adultos);

    const necesidades = {}; // id -> cantidad necesaria en la unidad del producto
    const add = (id, cant) => { necesidades[id] = (necesidades[id] || 0) + cant; };

    // ---------- Carne ----------
    const kgCarne = comensalesCarne * cfg.kgCarnePorAdulto * ape.f * dur.comida;
    const elegidas = cfg.carnes.filter((c) => (input.carnes || []).includes(c.id));
    const pesoTotal = elegidas.reduce((s, c) => s + c.peso, 0);
    elegidas.forEach((c) => {
      const kg = kgCarne * (c.peso / pesoTotal);
      const p = cfg.productos[c.id];
      add(c.id, p.unidad === 'ud' ? kg / p.kgPorUd : kg);
    });

    // ---------- Vegetarianos ----------
    if (vegetarianos > 0) {
      add('verduras', vegetarianos * cfg.kgVerduraPorVegetariano * ape.f);
      add('hambVeg', vegetarianos * cfg.hamburguesasVegPorVegetariano * ape.f);
    }

    // ---------- Bebida ----------
    const adultosConAlcohol = adultos * (1 - sinAlc.f);
    const adultosSinAlcohol = adultos - adultosConAlcohol;
    const consumiciones = adultosConAlcohol * cfg.consumicionesBase * sed.f * dur.bebida;
    add('cerveza', consumiciones * pctCerveza * tiempo.cerveza);
    add('vino', (consumiciones * (1 - pctCerveza)) / cfg.copasPorBotella);

    const lr = cfg.latasRefrescoPor;
    const latasRefresco =
      (adultosSinAlcohol * lr.adultoSinAlcohol + adolescentes * lr.adolescente + ninos * lr.nino) *
        dur.bebida * tiempo.refresco +
      adultosConAlcohol * lr.adultoConAlcohol * dur.bebida;
    add('cola', latasRefresco * cfg.cuotaCola);
    add('refrescos', latasRefresco * (1 - cfg.cuotaCola));
    add('agua', (personas * cfg.litrosAguaPorPersona * dur.bebida * tiempo.agua) / 1.5);
    add('hielo', personas * cfg.kgHieloPorPersona * dur.bebida * tiempo.hielo);

    // ---------- Primer redondeo: lo que depende de otros productos ----------
    const comprado = {};
    const fijar = (id) => {
      const p = cfg.productos[id];
      const nec = necesidades[id] || 0;
      comprado[id] = cfg.carneAlPesoRedondeoCercano && p.grupo === 'carniceria' && p.unidad === 'kg'
        ? Math.max(p.paso, Math.round(nec / p.paso) * p.paso)
        : redondearArriba(nec, p.paso);
      return comprado[id];
    };
    const conPan = (tipo) => Object.keys(necesidades)
      .filter((id) => cfg.productos[id].pan === tipo)
      .reduce((s, id) => s + fijar(id), 0);
    const hamburguesas = conPan('hamburguesa');
    const perritos = conPan('perrito');

    // ---------- Pan y acompañamientos ----------
    add('barras', comensales * cfg.barrasPorComensal * ape.f);
    if (hamburguesas) {
      add('panHamb', hamburguesas);
      add('queso', hamburguesas * cfg.lonchasQuesoPorHamburguesa);
    }
    if (perritos) add('panPerrito', perritos);
    add('tomate', comensales * cfg.kgTomatePorComensal);
    add('salsas', comensales / cfg.comensalesPorBoteSalsa);

    // ---------- Varios ----------
    if (input.carbon !== false) add('carbon', (kgCarne + (necesidades.verduras || 0)) * cfg.kgCarbonPorKgCarne);
    if (input.menaje !== false) {
      add('platos', personas * cfg.platosPorPersona);
      add('vasos', personas * cfg.vasosPorPersona);
      add('servilletas', personas * cfg.servilletasPorPersona);
    }

    // ---------- Construir líneas ----------
    const lineas = [];
    Object.keys(cfg.productos).forEach((id) => {
      const nec = necesidades[id];
      if (!nec || nec <= EPS || personas === 0) return;
      const p = cfg.productos[id];
      const cant = comprado[id] ?? fijar(id);
      const precio = precios[id] != null && isFinite(precios[id]) ? Number(precios[id]) : p.precio;
      const coste = (cant / p.precioPor) * precio;
      lineas.push({
        id, nombre: p.nombre, grupo: p.grupo, unidad: p.unidad,
        necesidad: nec, cantidad: cant,
        envases: p.formato ? Math.round(cant / p.paso) : null,
        formato: p.formato || null,
        kgAprox: p.kgPorUd ? cant * p.kgPorUd : null,
        precio, precioPor: p.precioPor, precioEditado: precios[id] != null,
        coste, buscar: p.buscar,
      });
    });

    const consumicionesPorAdulto = adultosConAlcohol ? consumiciones / adultosConAlcohol : 0;
    const avisos = [];
    if (consumicionesPorAdulto > cfg.avisoConsumicionesPorAdulto) {
      avisos.push({ tipo: 'exceso-alcohol', consumicionesPorAdulto, litrosPorAdulto: consumicionesPorAdulto * 0.33 });
    }

    const total = lineas.reduce((s, l) => s + l.coste, 0);
    const kgCarneCompra = lineas
      .filter((l) => l.grupo === 'carniceria')
      .reduce((s, l) => s + (l.kgAprox ?? l.cantidad), 0);
    const pagan = adultos || personas || 1;

    return {
      lineas,
      resumen: {
        personas, adultos, adolescentes, ninos, vegetarianos,
        comensales, kgCarne, kgCarneCompra,
        latasCerveza: comprado.cerveza || 0,
        botellasVino: comprado.vino || 0,
        total, porAdulto: total / pagan, porPersona: personas ? total / personas : 0,
        consumicionesPorAdulto,
      },
      avisos,
    };
  }

  // Propuesta de carnes a partir de presupuesto, estilo y extras.
  function proponerCarnes(input, cfg) {
    const est = cfg.propuestas[input.estilo] || cfg.propuestas.mixta;
    const base = est[input.presupuesto] || est.medio;
    const extra = (input.extras || []).flatMap((id) => (cfg.extras.find((e) => e.id === id) || { carnes: [] }).carnes);
    return [...new Set([...base, ...extra])];
  }

  const api = { calcular, redondearArriba, proponerCarnes };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Parrillometro = api;
})(typeof window !== 'undefined' ? window : globalThis);
