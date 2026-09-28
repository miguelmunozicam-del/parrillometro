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

    // ---------- Guarniciones (deciden si la carne baja) ----------
    const guarniciones = Array.isArray(input.guarniciones) ? input.guarniciones : proponerGuarniciones(input, cfg);
    const guarnSel = cfg.guarniciones.filter((g) => guarniciones.includes(g.id));
    const nBrasa = guarnSel.filter((g) => g.brasa).length;

    // ---------- Carne ----------
    // kgCarne = carne "de referencia" (400 g por adulto en una parrillada normal);
    // luego cada corte se ajusta por su rendimiento (hueso y merma).
    const kgCarne = comensalesCarne * cfg.kgCarnePorAdulto * ape.f * dur.comida *
      (nBrasa >= 2 ? cfg.ahorroCarneConGuarnicion : 1);
    const seleccion = cfg.carnes.filter((c) => (input.carnes || []).includes(c.id));
    const elegidas = seleccion.filter((c) => c.papel !== 'mar');
    const protagonistas = resolverProtagonistas(input, cfg, elegidas.map((c) => c.id));
    const papelDe = (c) => (protagonistas.includes(c.id) ? 'protagonista'
      : c.papel === 'protagonista' ? 'secundario' : c.papel);
    const porPapel = {};
    elegidas.forEach((c) => { (porPapel[papelDe(c)] = porPapel[papelDe(c)] || []).push(c); });
    const reparto = protagonistas.length ? cfg.repartoConProtagonista : cfg.repartoSinProtagonista;
    const papeles = Object.keys(reparto).filter((k) => porPapel[k]);
    const kgPorPapel = {};
    if (papeles.length) {
      // Los niños no cuentan para el protagonista: su parte va a los demás papeles.
      const kgNinos = comensalesCarne ? kgCarne * Math.min(1, (ninos * fc.ninos) / comensalesCarne) : 0;
      const sumaShares = papeles.reduce((s, k) => s + reparto[k], 0);
      if (porPapel.protagonista) {
        const otros = papeles.filter((k) => k !== 'protagonista');
        const sumaOtros = otros.reduce((s, k) => s + reparto[k], 0);
        kgPorPapel.protagonista = otros.length
          ? (reparto.protagonista / sumaShares) * (kgCarne - kgNinos)
          : kgCarne;
        const resto = kgCarne - kgPorPapel.protagonista;
        otros.forEach((k) => { kgPorPapel[k] = resto * (reparto[k] / sumaOtros); });
      } else {
        papeles.forEach((k) => { kgPorPapel[k] = kgCarne * (reparto[k] / sumaShares); });
      }
    }
    const carneDetalle = [];
    Object.keys(kgPorPapel).forEach((papel) => {
      const grupo = porPapel[papel];
      const pesoGrupo = grupo.reduce((s, c) => s + c.peso, 0);
      grupo.forEach((c) => {
        const kgServir = kgPorPapel[papel] * (c.peso / pesoGrupo);
        const kg = (kgServir * c.rendimiento) / cfg.rendimientoReferencia;
        const p = cfg.productos[c.id];
        add(c.id, p.unidad === 'ud' ? kg / p.kgPorUd : kg);
        carneDetalle.push({ id: c.id, papel, kgNecesarios: kg });
      });
    });
    seleccion.filter((c) => c.papel === 'mar').forEach((c) => {
      const kg = comensalesCarne * cfg.kgMarPorAdulto * ape.f * c.rendimiento;
      add(c.id, kg);
      carneDetalle.push({ id: c.id, papel: 'mar', kgNecesarios: kg });
    });

    // ---------- Vegetarianos ----------
    if (vegetarianos > 0) {
      add('verduras', vegetarianos * cfg.kgVerduraPorVegetariano * ape.f);
      add('hambVeg', vegetarianos * cfg.hamburguesasVegPorVegetariano * ape.f);
    }

    // ---------- Guarniciones: cantidades ----------
    const reduccion = cfg.reduccionPorGuarniciones.at(Math.min(Math.max(nBrasa, 1), cfg.reduccionPorGuarniciones.length) - 1);
    let kgVerduraEntera = 0;
    guarnSel.forEach((g) => {
      const f = g.brasa ? reduccion : 1;
      const cant = comensales * (g.kgPorComensal ?? g.udPorComensal) * f;
      add(g.id, cant);
      if (g.entera) kgVerduraEntera += cant;
    });

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
    if (hamburguesas) add('tomate', comensales * cfg.kgTomatePorComensal);
    const cb = cfg.comensalesPorBote;
    if (elegidas.length || vegetarianos) {
      if (input.estilo !== 'americana') add('alioli', comensales / cb.alioli);
      if (elegidas.some((c) => c.tipo === 'vacuno')) add('chimichurri', comensales / cb.chimichurri);
      if (input.estilo === 'americana' || hamburguesas || perritos) add('salsasAmericanas', (3 * comensales) / cb.salsasAmericanas);
    }
    if (input.aperitivo !== false) {
      add('patatasFritas', comensales / cfg.comensalesPorAperitivo);
      add('aceitunas', comensales / cfg.comensalesPorAperitivo);
    }

    // ---------- Varios ----------
    const kgCarneCruda = carneDetalle.reduce((s, d) => s + d.kgNecesarios, 0);
    if (input.carbon !== false) {
      add('carbon', (kgCarneCruda + (necesidades.verduras || 0)) * cfg.kgCarbonPorKgCarne +
        kgVerduraEntera * cfg.kgCarbonPorKgVerduraEntera);
    }
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

    if (personas > cfg.personasParaDosParrillas) avisos.push({ tipo: 'dos-parrillas', personas });

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
      carne: carneDetalle.map((d) => {
        const l = lineas.find((x) => x.id === d.id);
        const kg = l ? (l.kgAprox ?? l.cantidad) : 0;
        return { id: d.id, papel: d.papel, kg, pct: kgCarneCompra ? kg / kgCarneCompra : 0 };
      }),
      protagonistas,
      guarniciones,
      temporada: temporadaDe(input.fecha, cfg),
      mezclaSugerida: sugerirMezcla(input, cfg, protagonistas),
    };
  }

  const carne = (cfg, id) => cfg.carnes.find((c) => c.id === id);
  const personasDe = (i) => Math.max(0, i.adultos | 0) + Math.max(0, i.adolescentes | 0) + Math.max(0, i.ninos | 0);

  // Temporada a partir de la fecha del evento ('AAAA-MM-DD'); sin fecha, hoy.
  function temporadaDe(fecha, cfg) {
    const m = /^\d{4}-(\d{2})-\d{2}$/.exec(fecha || '');
    const mes = m ? Number(m[1]) : new Date().getMonth() + 1;
    return (cfg.temporadas.find((t) => t.meses.includes(mes)) || cfg.temporadas[0]).id;
  }

  // Propuesta de carnes: presupuesto + estilo + extras, con las reglas del manual.
  function proponerCarnes(input, cfg) {
    const est = cfg.propuestas[input.estilo] || cfg.propuestas.mixta;
    let lista = [...(est[input.presupuesto] || est.medio)];
    (input.extras || []).forEach((id) => {
      const ex = cfg.extras.find((e) => e.id === id);
      if (!ex) return;
      const fuera = (cfg.extrasSustituyen || {})[id] || [];
      lista = lista.filter((c) => !fuera.includes(c)).concat(ex.carnes);
    });
    lista = [...new Set(lista)].filter((id) => carne(cfg, id));

    // Barbacoa corta: fuera lo que tarda más de 30 minutos.
    if (input.duracion === 'rato') lista = lista.filter((id) => !carne(cfg, id).lento);

    // Muchos niños: que haya algo fácil para ellos.
    const personas = personasDe(input);
    const ninos = Math.max(0, input.ninos | 0);
    if (personas && ninos / personas > cfg.cuotaNinosParaCorteInfantil &&
        !lista.some((id) => carne(cfg, id).infantil)) lista.push(cfg.corteInfantilPorDefecto);

    // Límite de cortes según el tamaño del grupo (nunca se quita el protagonista).
    const lim = cfg.limitesCortes.find((l) => personas <= l.hasta) || cfg.limitesCortes.at(-1);
    const prot = resolverProtagonistas({ ...input, protagonistas: null }, cfg, lista);
    const quitarMenosPesados = (ids, n) => {
      const orden = [...ids].sort((a, b) => carne(cfg, a).peso - carne(cfg, b).peso);
      return new Set(orden.slice(0, Math.max(0, ids.length - n)));
    };
    const picoteo = lista.filter((id) => carne(cfg, id).papel === 'picoteo');
    const sobranPicoteo = quitarMenosPesados(picoteo, lim.picoteo);
    lista = lista.filter((id) => !sobranPicoteo.has(id));
    const cuentan = lista.filter((id) => carne(cfg, id).papel !== 'mar');
    if (cuentan.length > lim.cortes) {
      const quitables = cuentan.filter((id) => !prot.includes(id) && carne(cfg, id).papel !== 'picoteo');
      const sobran = quitarMenosPesados(quitables, quitables.length - (cuentan.length - lim.cortes));
      lista = lista.filter((id) => !sobran.has(id));
    }
    return lista;
  }

  // Protagonistas: los que marque el usuario, o los de más nivel (1, o 2 en grupos grandes).
  function resolverProtagonistas(input, cfg, ids) {
    if (Array.isArray(input.protagonistas)) return input.protagonistas.filter((id) => ids.includes(id));
    const max = personasDe(input) > cfg.maxPersonasUnProtagonista ? 2 : 1;
    return ids.map((id) => carne(cfg, id))
      .filter((c) => c && c.papel === 'protagonista' && c.nivel >= cfg.nivelMinimoProtagonista)
      .sort((a, b) => b.nivel - a.nivel)
      .filter((c, i) => i === 0 || c.nivel >= cfg.nivelSegundoProtagonista) // el segundo, solo si es de categoría
      .slice(0, max)
      .map((c) => c.id);
  }
  function maxProtagonistas(input, cfg) {
    return personasDe(input) > cfg.maxPersonasUnProtagonista ? 2 : 1;
  }

  // Guarniciones por estilo, temporada, presupuesto y vegetarianos.
  function proponerGuarniciones(input, cfg) {
    const t = temporadaDe(input.fecha, cfg);
    const gp = cfg.guarnicionPropuesta;
    const est = gp[input.estilo] || gp.mixta;
    let lista = [...(est.base || []), ...(est[t] || [])];
    if (input.presupuesto === 'premium') lista = lista.concat(gp.premium[t] || []);
    if ((input.vegetarianos | 0) > 0) lista = lista.concat(gp.vegetarianos);
    return [...new Set(lista)];
  }

  // Mezcla cerveza/vino sugerida según el menú.
  function sugerirMezcla(input, cfg, protagonistas) {
    const m = cfg.mezclaSugerida;
    if (input.estilo === 'americana') return m.americana;
    const prot = protagonistas || resolverProtagonistas(input, cfg, input.carnes || []);
    const tipos = prot.map((id) => carne(cfg, id) && carne(cfg, id).tipo);
    if (tipos.includes('vacuno') || tipos.includes('cordero')) return Math.min(m.vacuno, m.cordero);
    if (tipos.includes('iberico')) return m.iberico;
    return m.base;
  }

  const api = { calcular, redondearArriba, proponerCarnes, proponerGuarniciones, resolverProtagonistas, maxProtagonistas, sugerirMezcla, temporadaDe };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Parrillometro = api;
})(typeof window !== 'undefined' ? window : globalThis);
