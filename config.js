/*
 * Parrillómetro — configuración
 * ------------------------------------------------------------
 * Todos los ratios, productos y precios viven aquí.
 * Si quieres adaptar la calculadora a tu realidad, este es el
 * único fichero que necesitas tocar.
 *
 * Valores de partida tomados de una hoja de cálculo real de una
 * barbacoa de 41 personas (junio 2024) y ajustados con criterio.
 * Los precios son ORIENTATIVOS: el usuario puede editarlos en la app.
 */
(function (root) {
  const CONFIG = {
    // Cuánto "come" cada tipo de invitado respecto a un adulto.
    factorComensal: { adultos: 1, adolescentes: 0.75, ninos: 0.4 },

    // Carne cruda por adulto (kg) en una barbacoa de tarde entera con apetito normal.
    kgCarnePorAdulto: 0.4,
    // La carne al peso se redondea al cuarto de kilo más cercano (el carnicero
    // no corta exacto y el total ya lleva margen). Pon false para redondear siempre hacia arriba.
    carneAlPesoRedondeoCercano: true,

    // Consumiciones con alcohol por adulto que bebe (1 caña = 1 lata 33 cl,
    // 1 copa de vino = 15 cl) en una tarde normal con sed normal.
    consumicionesBase: 5,
    copasPorBotella: 5,
    // Por encima de estas consumiciones por adulto que bebe, la lista muestra un aviso.
    avisoConsumicionesPorAdulto: 10,

    // Refrescos (latas) por persona sin alcohol en una tarde normal.
    latasRefrescoPor: { adultoSinAlcohol: 2.5, adolescente: 2.5, nino: 1.5, adultoConAlcohol: 0.3 },
    cuotaCola: 0.55, // parte de los refrescos que son de cola

    litrosAguaPorPersona: 0.5,
    kgHieloPorPersona: 0.25,
    kgCarbonPorKgCarne: 0.8,

    // Pan y acompañamientos
    barrasPorComensal: 0.3,
    lonchasQuesoPorHamburguesa: 0.75,
    kgTomatePorComensal: 0.03,
    comensalesPorBoteSalsa: 20,

    // Vegetarianos
    kgVerduraPorVegetariano: 0.3,
    hamburguesasVegPorVegetariano: 1.5,

    // Menaje por persona
    platosPorPersona: 2,
    vasosPorPersona: 3,
    servilletasPorPersona: 4,

    // ----- Preguntas -----
    duracion: [
      { id: 'rato', label: 'Un rato', detalle: '2–3 horas', comida: 0.75, bebida: 0.6 },
      { id: 'tarde', label: 'La tarde entera', detalle: '4–6 horas', comida: 1, bebida: 1 },
      { id: 'larga', label: 'Hasta que nos echen', detalle: '7 horas o más', comida: 1.25, bebida: 1.4 },
    ],
    apetito: [
      { id: 'poco', label: 'Picotean', detalle: 'Comen como pajaritos', f: 0.8 },
      { id: 'normal', label: 'Normal', detalle: 'Lo de siempre', f: 1 },
      { id: 'mucho', label: 'Vienen sin desayunar', detalle: 'Que sobre antes que falte', f: 1.25 },
    ],
    sed: [
      { id: 'tranquilos', label: 'Tranquilos', detalle: 'Una o dos y a casa', f: 0.6 },
      { id: 'normal', label: 'Normal', detalle: 'Ni mucho ni poco', f: 1 },
      { id: 'celebracion', label: 'De celebración', detalle: 'Hay algo que brindar', f: 1.4 },
      { id: 'pueblo', label: 'Fiestas del pueblo', detalle: 'Mejor que sobre', f: 1.8 },
    ],
    sinAlcohol: [
      { id: 'nadie', label: 'Nadie', f: 0 },
      { id: 'pocos', label: 'Unos pocos', f: 0.15 },
      { id: 'bastantes', label: 'Bastantes', f: 0.35 },
    ],
    tiempo: [
      { id: 'fresco', label: 'Fresquito', detalle: 'Chaqueta a mano', refresco: 0.8, agua: 0.8, hielo: 0.5, cerveza: 0.9 },
      { id: 'agradable', label: 'Agradable', detalle: 'Ni frío ni calor', refresco: 1, agua: 1, hielo: 1, cerveza: 1 },
      { id: 'calor', label: 'Calor de verdad', detalle: 'Se busca sombra', refresco: 1.25, agua: 1.4, hielo: 1.5, cerveza: 1.1 },
    ],

    // ----- Carne: propuesta guiada -----
    presupuesto: [
      { id: 'economico', label: 'Económico', detalle: 'Lo de toda la vida' },
      { id: 'medio', label: 'Medio', detalle: 'Buena relación calidad-precio' },
      { id: 'premium', label: 'Premium', detalle: 'Para quedar como un rey' },
    ],
    estilo: [
      { id: 'espanola', label: 'Parrillada española', detalle: 'Panceta, chorizo, costillas…' },
      { id: 'americana', label: 'Americana', detalle: 'Hamburguesas, perritos, alitas' },
      { id: 'mixta', label: 'Un poco de todo', detalle: 'Para que cada uno elija' },
    ],
    extras: [
      { id: 'iberico', label: 'Ibéricos', carnes: ['secreto', 'presa'] },
      { id: 'vacuno', label: 'Vacuno a la brasa', carnes: ['entrecot', 'picana'] },
      { id: 'pollo', label: 'Pollo', carnes: ['muslos', 'alitas'] },
      { id: 'brochetas', label: 'Brochetas y pinchos', carnes: ['pinchos', 'brochetaPollo'] },
      { id: 'cordero', label: 'Cordero', carnes: ['chuletillas'] },
      { id: 'mar', label: 'Algo de mar', carnes: ['langostinos'] },
    ],
    // Qué se propone según estilo y presupuesto (ids del catálogo de carnes).
    propuestas: {
      espanola: {
        economico: ['panceta', 'chorizo', 'morcilla', 'chuletasCerdo', 'costillas'],
        medio: ['panceta', 'costillas', 'lomo', 'chorizo', 'morcilla', 'pinchos'],
        premium: ['secreto', 'presa', 'costillas', 'chorizo', 'morcilla', 'chuletillas'],
      },
      americana: {
        economico: ['hamburguesa', 'frankfurt', 'alitas', 'costillas'],
        medio: ['hamburguesa', 'frankfurt', 'costillasBBQ', 'alitas', 'muslos'],
        premium: ['hambPremium', 'costillasBBQ', 'picana', 'alitas', 'frankfurt'],
      },
      mixta: {
        economico: ['panceta', 'chorizo', 'morcilla', 'hamburguesa', 'salchichas', 'alitas'],
        medio: ['panceta', 'costillas', 'hamburguesa', 'morcilla', 'chorizo', 'lomo', 'salchichas'],
        premium: ['secreto', 'costillas', 'hambPremium', 'chorizo', 'morcilla', 'entrecot', 'salchichas'],
      },
    },
    // Catálogo de carnes. 'peso' = cuánto pesa en el reparto (se normaliza
    // con las elegidas): 1 es una pieza principal, menos para embutidos y picoteo.
    categoriasCarne: [
      { id: 'cerdo', nombre: 'Cerdo' },
      { id: 'iberico', nombre: 'Ibérico' },
      { id: 'embutido', nombre: 'Embutido y salchichas' },
      { id: 'vacuno', nombre: 'Vacuno' },
      { id: 'pollo', nombre: 'Pollo' },
      { id: 'otros', nombre: 'Cordero y mar' },
    ],
    carnes: [
      { id: 'panceta', cat: 'cerdo', peso: 1.2 },
      { id: 'costillas', cat: 'cerdo', peso: 1 },
      { id: 'costillasBBQ', cat: 'cerdo', peso: 1 },
      { id: 'lomo', cat: 'cerdo', peso: 0.6 },
      { id: 'chuletasCerdo', cat: 'cerdo', peso: 0.8 },
      { id: 'pinchos', cat: 'cerdo', peso: 0.6 },
      { id: 'secreto', cat: 'iberico', peso: 0.7 },
      { id: 'presa', cat: 'iberico', peso: 0.7 },
      { id: 'pluma', cat: 'iberico', peso: 0.6 },
      { id: 'chorizo', cat: 'embutido', peso: 0.6 },
      { id: 'morcilla', cat: 'embutido', peso: 0.6 },
      { id: 'salchichas', cat: 'embutido', peso: 0.4 },
      { id: 'frankfurt', cat: 'embutido', peso: 0.5 },
      { id: 'chistorra', cat: 'embutido', peso: 0.4 },
      { id: 'butifarra', cat: 'embutido', peso: 0.5 },
      { id: 'hamburguesa', cat: 'vacuno', peso: 0.65 },
      { id: 'hambPremium', cat: 'vacuno', peso: 0.7 },
      { id: 'entrecot', cat: 'vacuno', peso: 0.8 },
      { id: 'picana', cat: 'vacuno', peso: 0.8 },
      { id: 'chuleton', cat: 'vacuno', peso: 0.9 },
      { id: 'muslos', cat: 'pollo', peso: 0.8 },
      { id: 'alitas', cat: 'pollo', peso: 0.7 },
      { id: 'brochetaPollo', cat: 'pollo', peso: 0.6 },
      { id: 'chuletillas', cat: 'otros', peso: 0.7 },
      { id: 'langostinos', cat: 'otros', peso: 0.4 },
    ],

    // ----- Catálogo -----
    // unidad: en qué se calcula la necesidad ('kg' o 'ud')
    // paso: cómo se compra (se redondea hacia arriba a múltiplos de paso)
    // formato: nombre del envase (si existe, se muestra "N × formato")
    // precio / precioPor: precio orientativo por 'precioPor' unidades
    // kgPorUd: para carnes que se compran por unidades
    // buscar: texto para buscar el producto en las tiendas
    productos: {
      // Carnicería (precios orientativos por kg salvo que se indique envase)
      panceta: { nombre: 'Panceta', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 6.5, precioPor: 1, buscar: 'panceta cerdo' },
      costillas: { nombre: 'Costillas de cerdo', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 8.5, precioPor: 1, buscar: 'costillas cerdo' },
      costillasBBQ: { nombre: 'Costillas barbacoa (adobadas)', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 10, precioPor: 1, buscar: 'costillas barbacoa' },
      lomo: { nombre: 'Cabecero de lomo', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 7.5, precioPor: 1, buscar: 'cabecero lomo' },
      chuletasCerdo: { nombre: 'Chuletas de cerdo', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 6.5, precioPor: 1, buscar: 'chuletas cerdo' },
      pinchos: { nombre: 'Pinchos morunos', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 9, precioPor: 1, buscar: 'pinchos morunos' },
      secreto: { nombre: 'Secreto ibérico', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 17, precioPor: 1, buscar: 'secreto iberico' },
      presa: { nombre: 'Presa ibérica', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 22, precioPor: 1, buscar: 'presa iberica' },
      pluma: { nombre: 'Pluma ibérica', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 20, precioPor: 1, buscar: 'pluma iberica' },
      chorizo: { nombre: 'Chorizo fresco', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 7, precioPor: 1, buscar: 'chorizo fresco barbacoa' },
      morcilla: { nombre: 'Morcilla', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 9, precioPor: 1, buscar: 'morcilla' },
      salchichas: { nombre: 'Salchichas frescas', grupo: 'carniceria', unidad: 'ud', kgPorUd: 0.05, paso: 6, formato: 'paquete de 6', precio: 3, precioPor: 6, pan: 'perrito', buscar: 'salchichas frescas cerdo' },
      frankfurt: { nombre: 'Salchichas Frankfurt', grupo: 'carniceria', unidad: 'ud', kgPorUd: 0.05, paso: 8, formato: 'paquete de 8', precio: 2.8, precioPor: 8, pan: 'perrito', buscar: 'salchichas frankfurt' },
      chistorra: { nombre: 'Chistorra', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 9, precioPor: 1, buscar: 'chistorra' },
      butifarra: { nombre: 'Butifarra', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 9, precioPor: 1, buscar: 'butifarra' },
      hamburguesa: { nombre: 'Hamburguesas de vacuno', grupo: 'carniceria', unidad: 'ud', kgPorUd: 0.1, paso: 4, formato: 'bandeja de 4', precio: 4, precioPor: 4, pan: 'hamburguesa', buscar: 'hamburguesa vacuno' },
      hambPremium: { nombre: 'Hamburguesas premium (180 g)', grupo: 'carniceria', unidad: 'ud', kgPorUd: 0.18, paso: 2, formato: 'bandeja de 2', precio: 6, precioPor: 2, pan: 'hamburguesa', buscar: 'hamburguesa angus' },
      entrecot: { nombre: 'Entrecot de vacuno', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 25, precioPor: 1, buscar: 'entrecot vacuno' },
      picana: { nombre: 'Picaña', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 20, precioPor: 1, buscar: 'picaña' },
      chuleton: { nombre: 'Chuletón', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 30, precioPor: 1, buscar: 'chuleton vacuno' },
      muslos: { nombre: 'Muslos de pollo', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 4.5, precioPor: 1, buscar: 'muslos pollo' },
      alitas: { nombre: 'Alitas de pollo', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 5, precioPor: 1, buscar: 'alitas pollo' },
      brochetaPollo: { nombre: 'Brochetas de pollo', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 10, precioPor: 1, buscar: 'brochetas pollo' },
      chuletillas: { nombre: 'Chuletillas de cordero', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 20, precioPor: 1, buscar: 'chuletillas cordero' },
      langostinos: { nombre: 'Langostinos para brocheta', grupo: 'carniceria', unidad: 'kg', paso: 0.25, precio: 14, precioPor: 1, buscar: 'langostino' },

      verduras: { nombre: 'Verduras para la parrilla', grupo: 'verdura', unidad: 'kg', paso: 0.5, precio: 3, precioPor: 1, buscar: 'pimiento calabacin' },
      hambVeg: { nombre: 'Hamburguesas vegetales', grupo: 'verdura', unidad: 'ud', paso: 2, formato: 'paquete de 2', precio: 3.5, precioPor: 2, pan: 'hamburguesa', buscar: 'hamburguesa vegetal' },
      tomate: { nombre: 'Tomates', grupo: 'verdura', unidad: 'kg', paso: 0.5, precio: 2.5, precioPor: 1, buscar: 'tomate' },

      barras: { nombre: 'Barras de pan', grupo: 'panaderia', unidad: 'ud', paso: 1, precio: 0.8, precioPor: 1, buscar: 'barra pan' },
      panHamb: { nombre: 'Pan de hamburguesa', grupo: 'panaderia', unidad: 'ud', paso: 4, formato: 'bolsa de 4', precio: 1.6, precioPor: 4, buscar: 'pan hamburguesa' },
      panPerrito: { nombre: 'Pan de perrito', grupo: 'panaderia', unidad: 'ud', paso: 6, formato: 'bolsa de 6', precio: 1.5, precioPor: 6, buscar: 'pan perrito' },
      queso: { nombre: 'Queso en lonchas', grupo: 'panaderia', unidad: 'ud', paso: 10, formato: 'paquete de 10 lonchas', precio: 2.2, precioPor: 10, buscar: 'queso lonchas hamburguesa' },
      salsas: { nombre: 'Ketchup y mostaza', grupo: 'panaderia', unidad: 'ud', paso: 1, formato: 'bote', precio: 2.5, precioPor: 1, buscar: 'ketchup' },

      cerveza: { nombre: 'Cerveza (latas 33 cl)', grupo: 'bebida', unidad: 'ud', paso: 24, formato: 'pack de 24 latas', precio: 15, precioPor: 24, buscar: 'cerveza lata pack 24' },
      vino: { nombre: 'Vino', grupo: 'bebida', unidad: 'ud', paso: 1, formato: 'botella', precio: 5, precioPor: 1, buscar: 'vino tinto' },
      cola: { nombre: 'Refresco de cola', grupo: 'bebida', unidad: 'ud', paso: 12, formato: 'pack de 12 latas', precio: 9, precioPor: 12, buscar: 'coca cola lata pack 12' },
      refrescos: { nombre: 'Otros refrescos', grupo: 'bebida', unidad: 'ud', paso: 12, formato: 'pack de 12 latas', precio: 8, precioPor: 12, buscar: 'refresco naranja lata pack' },
      agua: { nombre: 'Agua (1,5 L)', grupo: 'bebida', unidad: 'ud', paso: 6, formato: 'pack de 6 botellas', precio: 3, precioPor: 6, buscar: 'agua mineral 1,5 l pack 6' },
      hielo: { nombre: 'Hielo', grupo: 'bebida', unidad: 'kg', paso: 2, formato: 'bolsa de 2 kg', precio: 1.5, precioPor: 2, buscar: 'bolsa hielo' },

      carbon: { nombre: 'Carbón vegetal', grupo: 'varios', unidad: 'kg', paso: 5, formato: 'saco de 5 kg', precio: 8, precioPor: 5, buscar: 'carbon vegetal barbacoa' },
      platos: { nombre: 'Platos', grupo: 'varios', unidad: 'ud', paso: 25, formato: 'paquete de 25', precio: 2.5, precioPor: 25, buscar: 'platos compostables' },
      vasos: { nombre: 'Vasos', grupo: 'varios', unidad: 'ud', paso: 50, formato: 'paquete de 50', precio: 2.5, precioPor: 50, buscar: 'vasos desechables' },
      servilletas: { nombre: 'Servilletas', grupo: 'varios', unidad: 'ud', paso: 100, formato: 'paquete de 100', precio: 1.5, precioPor: 100, buscar: 'servilletas papel' },
    },

    grupos: [
      { id: 'carniceria', nombre: 'Carnicería y pescadería' },
      { id: 'verdura', nombre: 'Frutería' },
      { id: 'panaderia', nombre: 'Pan y acompañamientos' },
      { id: 'bebida', nombre: 'Bebida' },
      { id: 'varios', nombre: 'Varios' },
    ],

    // Tiendas para comparar precios: se abre su buscador con el producto.
    tiendas: [
      { id: 'mercadona', nombre: 'Mercadona', url: 'https://tienda.mercadona.es/search-results?query={q}' },
      { id: 'carrefour', nombre: 'Carrefour', url: 'https://www.carrefour.es/?q={q}' },
      { id: 'alcampo', nombre: 'Alcampo', url: 'https://www.compraonline.alcampo.es/search?q={q}' },
      { id: 'amazon', nombre: 'Amazon Fresh', url: 'https://www.amazon.es/s?k={q}&i=amazonfresh' },
      { id: 'dia', nombre: 'Dia', url: 'https://www.dia.es/search?q={q}' },
    ],

    // Evento de ejemplo con el que se abre la app (la barbacoa original).
    ejemplo: {
      adultos: 23, adolescentes: 6, ninos: 12, vegetarianos: 0,
      duracion: 'larga', apetito: 'normal', sed: 'normal', sinAlcohol: 'nadie',
      tiempo: 'calor', pctCerveza: 85, carbon: true, menaje: true,
      presupuesto: 'medio', estilo: 'mixta', extras: [],
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.PARRILLOMETRO_CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
