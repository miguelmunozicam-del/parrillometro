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

    // ----- Reparto de la carne por papel (ver el Manual del Parrillómetro) -----
    // Con protagonista (chuletón, cordero, ibérico…), la pieza principal se lleva la mitad.
    repartoConProtagonista: { protagonista: 0.5, secundario: 0.35, picoteo: 0.15 },
    repartoSinProtagonista: { secundario: 0.78, picoteo: 0.22 },
    // Hasta cuántas personas hay un solo protagonista (a partir de ahí, dos).
    maxPersonasUnProtagonista: 25,
    // Nivel mínimo para que la app proponga un protagonista por su cuenta.
    nivelMinimoProtagonista: 2,
    // En grupos grandes, el segundo protagonista solo si es de este nivel o más (chuletón, cordero, presa…).
    nivelSegundoProtagonista: 3,
    // Rendimiento medio de la parrillada de referencia (hoja original): sirve para
    // pasar de "carne a servir" a "carne cruda a comprar" corte a corte.
    rendimientoReferencia: 1.17,
    // Número máximo de cortes y de embutidos que propone la app según el grupo.
    limitesCortes: [
      { hasta: 10, cortes: 4, picoteo: 1 },
      { hasta: 25, cortes: 6, picoteo: 2 },
      { hasta: Infinity, cortes: 8, picoteo: 3 },
    ],
    // Si más de esta parte de los invitados son niños, se asegura un corte infantil.
    cuotaNinosParaCorteInfantil: 0.2,
    corteInfantilPorDefecto: 'hamburguesa',
    // Marisco del extra "Algo de mar": fijo por adulto, fuera del reparto (kg a servir).
    kgMarPorAdulto: 0.06,
    // Si hay dos o más guarniciones de brasa, la carne baja este factor.
    ahorroCarneConGuarnicion: 0.9,
    // Cantidad de cada guarnición de brasa según cuántas se elijan (1, 2, 3, 4 o más).
    reduccionPorGuarniciones: [1, 0.7, 0.55, 0.45],
    // Más personas que esto: consejo de usar dos parrillas o turnos.
    personasParaDosParrillas: 25,

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
    // Carbón: 1 kg por kg de carne, más 1 kg por cada 5 kg de verdura entera
    // (patatas, pimientos, escalivada), que ocupa brasa mucho rato.
    kgCarbonPorKgCarne: 1,
    kgCarbonPorKgVerduraEntera: 0.2,

    // Pan y acompañamientos
    barrasPorComensal: 0.3,
    lonchasQuesoPorHamburguesa: 0.75,
    kgTomatePorComensal: 0.03,
    // Salsas: un bote por cada N comensales
    comensalesPorBote: { alioli: 15, chimichurri: 15, salsasAmericanas: 20 },
    // Aperitivo para la espera: una bolsa de patatas y una lata de aceitunas por cada N comensales
    comensalesPorAperitivo: 6,

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
    // Manual del Parrillómetro, "Reglas de composición".
    propuestas: {
      espanola: {
        economico: ['panceta', 'costillas', 'chuletasCerdo', 'chorizo', 'morcilla'],
        medio: ['costillas', 'lomo', 'panceta', 'pinchos', 'chorizo', 'morcilla'],
        premium: ['chuletillas', 'secreto', 'costillas', 'chorizo'],
      },
      americana: {
        economico: ['hamburguesa', 'alitas', 'costillas', 'frankfurt'],
        medio: ['hamburguesa', 'costillasBBQ', 'alitas', 'frankfurt'],
        premium: ['hambPremium', 'costillasBBQ', 'frankfurt'],
      },
      mixta: {
        economico: ['panceta', 'hamburguesa', 'alitas', 'chorizo', 'morcilla', 'salchichas'],
        medio: ['panceta', 'costillas', 'lomo', 'hamburguesa', 'chorizo', 'morcilla', 'salchichas'],
        premium: ['chuleton', 'secreto', 'costillas', 'chorizo', 'morcilla'],
      },
    },
    // Al añadir un extra, estos cortes salen de la propuesta (se solapan).
    extrasSustituyen: { pollo: ['chuletasCerdo'] },

    categoriasCarne: [
      { id: 'cerdo', nombre: 'Cerdo' },
      { id: 'iberico', nombre: 'Ibérico' },
      { id: 'embutido', nombre: 'Embutido y salchichas' },
      { id: 'vacuno', nombre: 'Vacuno' },
      { id: 'pollo', nombre: 'Pollo' },
      { id: 'otros', nombre: 'Cordero y mar' },
    ],
    // Catálogo de carnes (Manual del Parrillómetro, "Catálogo razonado de cortes"):
    // papel: protagonista | secundario | picoteo | mar
    // nivel: 1 económico · 2 medio · 3 premium (decide qué protagonista gana)
    // peso: reparto relativo dentro de su papel
    // rendimiento: kg crudos para servir lo mismo que 1 kg sin hueso
    // lento: tarda más de 30 min (fuera en barbacoas cortas) · infantil: fácil para niños
    carnes: [
      { id: 'panceta', cat: 'cerdo', papel: 'secundario', nivel: 1, peso: 1.2, rendimiento: 1.2 },
      { id: 'costillas', cat: 'cerdo', papel: 'secundario', nivel: 1, peso: 1, rendimiento: 1.5, lento: true },
      { id: 'costillasBBQ', cat: 'cerdo', papel: 'secundario', nivel: 2, peso: 1, rendimiento: 1.5, lento: true },
      { id: 'lomo', cat: 'cerdo', papel: 'secundario', nivel: 2, peso: 0.6, rendimiento: 1 },
      { id: 'chuletasCerdo', cat: 'cerdo', papel: 'secundario', nivel: 1, peso: 0.8, rendimiento: 1.3 },
      { id: 'pinchos', cat: 'cerdo', papel: 'secundario', nivel: 2, peso: 0.6, rendimiento: 1 },
      { id: 'secreto', cat: 'iberico', papel: 'protagonista', nivel: 2, peso: 0.8, rendimiento: 1, tipo: 'iberico' },
      { id: 'presa', cat: 'iberico', papel: 'protagonista', nivel: 3, peso: 0.8, rendimiento: 1, tipo: 'iberico' },
      { id: 'pluma', cat: 'iberico', papel: 'secundario', nivel: 3, peso: 0.6, rendimiento: 1, tipo: 'iberico' },
      { id: 'chorizo', cat: 'embutido', papel: 'picoteo', nivel: 1, peso: 1.1, rendimiento: 1 },
      { id: 'morcilla', cat: 'embutido', papel: 'picoteo', nivel: 1, peso: 1, rendimiento: 1 },
      { id: 'salchichas', cat: 'embutido', papel: 'picoteo', nivel: 1, peso: 0.7, rendimiento: 1, infantil: true },
      { id: 'frankfurt', cat: 'embutido', papel: 'picoteo', nivel: 1, peso: 0.8, rendimiento: 1, infantil: true },
      { id: 'chistorra', cat: 'embutido', papel: 'picoteo', nivel: 1, peso: 0.7, rendimiento: 1 },
      { id: 'butifarra', cat: 'embutido', papel: 'picoteo', nivel: 2, peso: 0.9, rendimiento: 1 },
      { id: 'hamburguesa', cat: 'vacuno', papel: 'secundario', nivel: 1, peso: 0.65, rendimiento: 1, infantil: true },
      { id: 'hambPremium', cat: 'vacuno', papel: 'protagonista', nivel: 2.5, peso: 0.8, rendimiento: 1, infantil: true },
      { id: 'entrecot', cat: 'vacuno', papel: 'protagonista', nivel: 3, peso: 0.9, rendimiento: 1, tipo: 'vacuno' },
      { id: 'picana', cat: 'vacuno', papel: 'protagonista', nivel: 3, peso: 0.9, rendimiento: 1, tipo: 'vacuno', lento: true },
      { id: 'chuleton', cat: 'vacuno', papel: 'protagonista', nivel: 3.2, peso: 1, rendimiento: 1.3, tipo: 'vacuno' },
      { id: 'muslos', cat: 'pollo', papel: 'secundario', nivel: 1, peso: 0.8, rendimiento: 1.4, lento: true },
      { id: 'alitas', cat: 'pollo', papel: 'secundario', nivel: 1, peso: 0.7, rendimiento: 1.4, infantil: true },
      { id: 'brochetaPollo', cat: 'pollo', papel: 'secundario', nivel: 2, peso: 0.6, rendimiento: 1, infantil: true },
      { id: 'chuletillas', cat: 'otros', papel: 'protagonista', nivel: 3.1, peso: 1, rendimiento: 1.3, tipo: 'cordero' },
      { id: 'langostinos', cat: 'otros', papel: 'mar', nivel: 3, peso: 0, rendimiento: 1.6 },
    ],

    // ----- Guarniciones (Manual del Parrillómetro, "Verduras y acompañamientos") -----
    // kgPorComensal o udPorComensal: cantidad cuando va sola · brasa: cuenta como guarnición de brasa
    // entera: ocupa brasa mucho rato (suma carbón) · temporadas: cuándo se propone por defecto
    guarniciones: [
      { id: 'patatas', kgPorComensal: 0.2, brasa: true, entera: true },
      { id: 'pimientosRojos', kgPorComensal: 0.1, brasa: true, entera: true },
      { id: 'padron', kgPorComensal: 0.05, brasa: true },
      { id: 'escalivada', kgPorComensal: 0.2, brasa: true, entera: true },
      { id: 'rodajas', kgPorComensal: 0.12, brasa: true },
      { id: 'champis', kgPorComensal: 0.08, brasa: true },
      { id: 'mazorcas', udPorComensal: 0.5, brasa: true },
      { id: 'trigueros', kgPorComensal: 0.06, brasa: true },
      { id: 'cebolletas', udPorComensal: 1, brasa: true },
      { id: 'ensalada', kgPorComensal: 0.12, brasa: false },
      { id: 'coleslaw', kgPorComensal: 0.1, brasa: false },
    ],
    // Propuesta de guarnición por estilo y temporada (se deduce de la fecha del evento).
    guarnicionPropuesta: {
      espanola: { base: ['pimientosRojos', 'patatas', 'ensalada'], verano: ['padron'], invierno: ['cebolletas'], primavera: ['cebolletas'] },
      americana: { base: ['patatas', 'mazorcas', 'coleslaw'] },
      mixta: { base: ['patatas', 'ensalada'], verano: ['padron'], otono: ['pimientosRojos'], invierno: ['pimientosRojos'], primavera: ['pimientosRojos'] },
      premium: { primavera: ['trigueros'], verano: ['champis'], otono: ['champis'], invierno: ['champis'] },
      vegetarianos: ['rodajas', 'champis'],
    },
    temporadas: [
      { id: 'invierno', nombre: 'invierno', meses: [12, 1, 2] },
      { id: 'primavera', nombre: 'primavera', meses: [3, 4, 5] },
      { id: 'verano', nombre: 'verano', meses: [6, 7, 8] },
      { id: 'otono', nombre: 'otoño', meses: [9, 10, 11] },
    ],

    // Mezcla cerveza/vino sugerida según el menú (% de cerveza); el usuario puede moverla.
    mezclaSugerida: { americana: 90, base: 80, iberico: 65, vacuno: 55, cordero: 55 },

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
      patatas: { nombre: 'Patatas para asar', grupo: 'verdura', unidad: 'kg', paso: 2, formato: 'malla de 2 kg', precio: 2.8, precioPor: 2, buscar: 'patatas malla' },
      pimientosRojos: { nombre: 'Pimientos rojos para asar', grupo: 'verdura', unidad: 'kg', paso: 0.25, precio: 2.8, precioPor: 1, buscar: 'pimiento rojo' },
      padron: { nombre: 'Pimientos de Padrón', grupo: 'verdura', unidad: 'kg', paso: 0.2, formato: 'bolsa de 200 g', precio: 1.9, precioPor: 0.2, buscar: 'pimientos padron' },
      escalivada: { nombre: 'Escalivada (pimiento, berenjena y cebolla)', grupo: 'verdura', unidad: 'kg', paso: 0.5, precio: 2.5, precioPor: 1, buscar: 'berenjena' },
      rodajas: { nombre: 'Calabacín y berenjena', grupo: 'verdura', unidad: 'kg', paso: 0.5, precio: 2.2, precioPor: 1, buscar: 'calabacin' },
      champis: { nombre: 'Champiñones para brocheta', grupo: 'verdura', unidad: 'kg', paso: 0.25, formato: 'bandeja de 250 g', precio: 1.5, precioPor: 0.25, buscar: 'champiñon' },
      mazorcas: { nombre: 'Mazorcas de maíz', grupo: 'verdura', unidad: 'ud', paso: 2, formato: 'pack de 2', precio: 2, precioPor: 2, buscar: 'mazorca maiz' },
      trigueros: { nombre: 'Espárragos trigueros', grupo: 'verdura', unidad: 'kg', paso: 0.25, formato: 'manojo de 250 g', precio: 2.2, precioPor: 0.25, buscar: 'esparragos trigueros' },
      cebolletas: { nombre: 'Cebolletas', grupo: 'verdura', unidad: 'ud', paso: 6, formato: 'manojo de 6', precio: 1.5, precioPor: 6, buscar: 'cebolleta' },
      ensalada: { nombre: 'Ensalada (lechuga y tomate)', grupo: 'verdura', unidad: 'kg', paso: 0.5, precio: 2.4, precioPor: 1, buscar: 'lechuga' },
      coleslaw: { nombre: 'Col y zanahoria (coleslaw)', grupo: 'verdura', unidad: 'kg', paso: 0.5, precio: 1.6, precioPor: 1, buscar: 'col repollo' },

      barras: { nombre: 'Barras de pan', grupo: 'panaderia', unidad: 'ud', paso: 1, precio: 0.8, precioPor: 1, buscar: 'barra pan' },
      panHamb: { nombre: 'Pan de hamburguesa', grupo: 'panaderia', unidad: 'ud', paso: 4, formato: 'bolsa de 4', precio: 1.6, precioPor: 4, buscar: 'pan hamburguesa' },
      panPerrito: { nombre: 'Pan de perrito', grupo: 'panaderia', unidad: 'ud', paso: 6, formato: 'bolsa de 6', precio: 1.5, precioPor: 6, buscar: 'pan perrito' },
      queso: { nombre: 'Queso en lonchas', grupo: 'panaderia', unidad: 'ud', paso: 10, formato: 'paquete de 10 lonchas', precio: 2.2, precioPor: 10, buscar: 'queso lonchas hamburguesa' },
      alioli: { nombre: 'Alioli', grupo: 'panaderia', unidad: 'ud', paso: 1, formato: 'bote', precio: 2.2, precioPor: 1, buscar: 'alioli' },
      chimichurri: { nombre: 'Chimichurri', grupo: 'panaderia', unidad: 'ud', paso: 1, formato: 'bote', precio: 2.8, precioPor: 1, buscar: 'chimichurri' },
      salsasAmericanas: { nombre: 'Ketchup, mostaza y salsa barbacoa', grupo: 'panaderia', unidad: 'ud', paso: 3, formato: 'juego de 3 botes', precio: 6.5, precioPor: 3, buscar: 'salsa barbacoa' },
      patatasFritas: { nombre: 'Patatas fritas de bolsa', grupo: 'panaderia', unidad: 'ud', paso: 1, formato: 'bolsa de 150 g', precio: 1.8, precioPor: 1, buscar: 'patatas fritas bolsa' },
      aceitunas: { nombre: 'Aceitunas', grupo: 'panaderia', unidad: 'ud', paso: 1, formato: 'lata', precio: 1.6, precioPor: 1, buscar: 'aceitunas' },

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
      { id: 'verdura', nombre: 'Frutería y guarnición' },
      { id: 'panaderia', nombre: 'Pan, salsas y aperitivo' },
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
      tiempo: 'calor', pctCerveza: 80, carbon: true, menaje: true, aperitivo: true,
      presupuesto: 'medio', estilo: 'mixta', extras: [],
      fecha: null, // null = hoy
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.PARRILLOMETRO_CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
