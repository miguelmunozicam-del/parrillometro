// Ejecutar con: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const cfg = require('./config.js');
const { calcular, redondearArriba, proponerCarnes, proponerGuarniciones, sugerirMezcla, temporadaDe } = require('./calc.js');

const carnesDefecto = proponerCarnes(cfg.ejemplo, cfg);
const linea = (r, id) => r.lineas.find((l) => l.id === id);

// Caso de referencia: la hoja de cálculo original (23 adultos, 6 adolescentes,
// 12 niños, barbacoa de 8 horas).
// Sin guarniciones, para comparar con la hoja (que no las tenía).
const excel = {
  ...cfg.ejemplo, tiempo: 'agradable', carnes: carnesDefecto,
  guarniciones: [], fecha: '2026-06-20', pctCerveza: 85,
};
const kgDe = (r, id) => { const c = r.carne.find((x) => x.id === id); return c ? c.kg : 0; };

test('reproduce los kilos de carne de la hoja original (12,92 kg con duración de referencia)', () => {
  const r = calcular({ ...excel, duracion: 'tarde' }, cfg);
  assert.equal(r.resumen.comensales.toFixed(2), '32.30');
  assert.equal(r.resumen.kgCarne.toFixed(2), '12.92');
});

test('cerveza: ~2 L por adulto → 6 packs de 24, como en la hoja', () => {
  const r = calcular(excel, cfg);
  assert.equal(linea(r, 'cerveza').envases, 6);
});

test('vino: 5 botellas, como en la hoja', () => {
  const r = calcular(excel, cfg);
  assert.equal(linea(r, 'vino').cantidad, 5);
});

test('pan: 10 barras, como en la hoja', () => {
  const r = calcular(excel, cfg);
  assert.equal(linea(r, 'barras').cantidad, 10);
});

test('una barbacoa larga lleva un 25 % más de carne que una de tarde', () => {
  const tarde = calcular({ ...excel, duracion: 'tarde' }, cfg).resumen.kgCarne;
  const larga = calcular({ ...excel, duracion: 'larga' }, cfg).resumen.kgCarne;
  assert.equal((larga / tarde).toFixed(2), '1.25');
});

test('la carne comprada no se desvía más de un 10 % de la calculada', () => {
  const r = calcular(excel, cfg);
  const desvio = r.resumen.kgCarneCompra / r.resumen.kgCarne - 1;
  assert.ok(Math.abs(desvio) < 0.1, `desvío ${desvio}`);
});

test('pan de hamburguesa y de perrito cuadran con las unidades compradas', () => {
  const r = calcular(excel, cfg);
  assert.ok(linea(r, 'panHamb').cantidad >= linea(r, 'hamburguesa').cantidad);
  assert.ok(linea(r, 'panPerrito').cantidad >= linea(r, 'salchichas').cantidad);
});

test('todo cerveza o todo vino', () => {
  const soloCerveza = calcular({ ...excel, pctCerveza: 100 }, cfg);
  assert.equal(linea(soloCerveza, 'vino'), undefined);
  const soloVino = calcular({ ...excel, pctCerveza: 0 }, cfg);
  assert.equal(linea(soloVino, 'cerveza'), undefined);
});

test('sin adultos no hay alcohol', () => {
  const r = calcular({ ...excel, adultos: 0 }, cfg);
  assert.equal(linea(r, 'cerveza'), undefined);
  assert.equal(linea(r, 'vino'), undefined);
});

test('todos vegetarianos: sin carne ni carbón de más, con verduras', () => {
  const r = calcular({ ...excel, vegetarianos: 41 }, cfg);
  assert.equal(r.lineas.filter((l) => l.grupo === 'carniceria').length, 0);
  assert.ok(linea(r, 'verduras'));
  assert.ok(linea(r, 'hambVeg'));
});

test('sin invitados, lista vacía y total 0', () => {
  const r = calcular({ ...excel, adultos: 0, adolescentes: 0, ninos: 0 }, cfg);
  assert.equal(r.lineas.length, 0);
  assert.equal(r.resumen.total, 0);
});

test('más sed y más duración nunca reducen la bebida', () => {
  const a = calcular({ ...excel, sed: 'normal', duracion: 'tarde' }, cfg);
  const b = calcular({ ...excel, sed: 'pueblo', duracion: 'larga' }, cfg);
  assert.ok(linea(b, 'cerveza').cantidad >= linea(a, 'cerveza').cantidad);
});

test('los precios editados se aplican', () => {
  const r = calcular({ ...excel, precios: { cerveza: 20 } }, cfg);
  assert.equal(linea(r, 'cerveza').coste, 6 * 20);
});

test('sin carbón ni menaje si se desmarcan', () => {
  const r = calcular({ ...excel, carbon: false, menaje: false }, cfg);
  ['carbon', 'platos', 'vasos', 'servilletas'].forEach((id) => assert.equal(linea(r, id), undefined));
});

test('redondeo hacia arriba tolera decimales', () => {
  assert.equal(redondearArriba(0.75, 0.25), 0.75);
  assert.equal(redondearArriba(24, 24), 24);
  assert.equal(redondearArriba(24.01, 24), 48);
  assert.equal(redondearArriba(0, 6), 0);
});

test('todas las propuestas usan carnes que existen en el catálogo', () => {
  const ids = new Set(cfg.carnes.map((c) => c.id));
  for (const est of Object.values(cfg.propuestas)) {
    for (const lista of Object.values(est)) lista.forEach((id) => assert.ok(ids.has(id), id));
  }
  cfg.extras.forEach((e) => e.carnes.forEach((id) => assert.ok(ids.has(id), id)));
  cfg.carnes.forEach((c) => assert.ok(cfg.productos[c.id], `falta producto ${c.id}`));
});

test('la propuesta mixta-media coincide con las carnes de la hoja original', () => {
  assert.deepEqual(
    [...carnesDefecto].sort(),
    ['chorizo', 'costillas', 'hamburguesa', 'lomo', 'morcilla', 'panceta', 'salchichas'],
  );
});

test('los extras se añaden sin duplicar', () => {
  const p = proponerCarnes({ adultos: 20, estilo: 'espanola', presupuesto: 'premium', extras: ['iberico'] }, cfg);
  assert.equal(p.filter((id) => id === 'secreto').length, 1);
  assert.ok(p.includes('presa'));
});

test('el premium sale más caro que el económico', () => {
  const eco = calcular({ ...excel, carnes: proponerCarnes({ ...excel, estilo: 'mixta', presupuesto: 'economico' }, cfg) }, cfg);
  const pre = calcular({ ...excel, carnes: proponerCarnes({ ...excel, estilo: 'mixta', presupuesto: 'premium' }, cfg) }, cfg);
  const carne = (r) => r.lineas.filter((l) => l.grupo === 'carniceria').reduce((s, l) => s + l.coste, 0);
  assert.ok(carne(pre) > carne(eco) * 1.3);
});

test('los perritos Frankfurt llevan su pan', () => {
  const r = calcular({ ...excel, carnes: ['frankfurt'] }, cfg);
  assert.ok(linea(r, 'panPerrito').cantidad >= linea(r, 'frankfurt').cantidad);
});

test('aviso solo con fiestas del pueblo y hasta que nos echen', () => {
  const combos = [];
  for (const sed of cfg.sed) for (const dur of cfg.duracion) {
    const r = calcular({ ...excel, sed: sed.id, duracion: dur.id }, cfg);
    if (r.avisos.some((a) => a.tipo === 'exceso-alcohol')) combos.push(`${sed.id}/${dur.id}`);
  }
  assert.deepEqual(combos, ['pueblo/larga']);
});

// ---------- v2: reglas del Manual del Parrillómetro ----------
const cena10 = { ...excel, adultos: 8, adolescentes: 0, ninos: 0, presupuesto: 'premium', estilo: 'mixta', duracion: 'tarde' };

test('premium: el protagonista (chuletón) se lleva al menos el 40 % de la carne', () => {
  const carnes = proponerCarnes(cena10, cfg);
  const r = calcular({ ...cena10, carnes }, cfg);
  assert.deepEqual(r.protagonistas, ['chuleton']);
  const c = r.carne.find((x) => x.id === 'chuleton');
  assert.ok(c.pct >= 0.4, `chuletón ${c.pct}`);
});

test('sin protagonista (económico o medio) nadie pasa del 35 %', () => {
  const r = calcular(excel, cfg);
  assert.deepEqual(r.protagonistas, []);
  r.carne.forEach((c) => assert.ok(c.pct < 0.35, `${c.id} ${c.pct}`));
});

test('el usuario puede elegir el protagonista o quitarlo', () => {
  const carnes = proponerCarnes(cena10, cfg);
  const elegido = calcular({ ...cena10, carnes, protagonistas: ['costillas'] }, cfg);
  assert.deepEqual(elegido.protagonistas, ['costillas']);
  assert.equal(elegido.carne.find((x) => x.id === 'costillas').papel, 'protagonista');
  assert.equal(elegido.carne.find((x) => x.id === 'chuleton').papel, 'secundario');
  const ninguno = calcular({ ...cena10, carnes, protagonistas: [] }, cfg);
  assert.deepEqual(ninguno.protagonistas, []);
});

test('los niños no cuentan para el protagonista', () => {
  const carnes = ['chuleton', 'costillas', 'chorizo'];
  const sin = calcular({ ...cena10, carnes }, cfg);
  const con = calcular({ ...cena10, ninos: 10, carnes }, cfg);
  assert.ok(Math.abs(kgDe(con, 'chuleton') - kgDe(sin, 'chuleton')) <= 0.25);
  assert.ok(kgDe(con, 'costillas') > kgDe(sin, 'costillas'));
});

test('hasta 25 personas un protagonista; en grupos grandes, dos si son de categoría', () => {
  const carnes = ['chuleton', 'chuletillas', 'secreto', 'chorizo'];
  assert.equal(calcular({ ...cena10, carnes }, cfg).protagonistas.length, 1);
  const grande = calcular({ ...excel, carnes }, cfg);
  assert.deepEqual([...grande.protagonistas].sort(), ['chuletillas', 'chuleton']);
});

test('el rendimiento se nota: el chuletón pide más crudo que un entrecot', () => {
  const a = calcular({ ...cena10, carnes: ['chuleton', 'chorizo'] }, cfg);
  const b = calcular({ ...cena10, carnes: ['entrecot', 'chorizo'] }, cfg);
  assert.ok(kgDe(a, 'chuleton') > kgDe(b, 'entrecot'));
});

test('grupos pequeños: como mucho 4 cortes y 1 embutido', () => {
  const p = proponerCarnes({ ...cena10, estilo: 'espanola', presupuesto: 'medio' }, cfg);
  assert.ok(p.length <= 4, p.join());
  assert.equal(p.filter((id) => cfg.carnes.find((c) => c.id === id).papel === 'picoteo').length, 1);
});

test('barbacoa corta: fuera lo que tarda más de media hora', () => {
  const p = proponerCarnes({ ...excel, duracion: 'rato' }, cfg);
  p.forEach((id) => assert.ok(!cfg.carnes.find((c) => c.id === id).lento, id));
});

test('con muchos niños se asegura algo fácil para ellos', () => {
  const p = proponerCarnes({ ...excel, estilo: 'espanola', presupuesto: 'premium' }, cfg);
  assert.ok(p.some((id) => cfg.carnes.find((c) => c.id === id).infantil));
});

test('temporada deducida de la fecha', () => {
  assert.equal(temporadaDe('2026-07-15', cfg), 'verano');
  assert.equal(temporadaDe('2026-10-01', cfg), 'otono');
  assert.equal(temporadaDe('2027-01-10', cfg), 'invierno');
  assert.ok(proponerGuarniciones({ estilo: 'mixta', fecha: '2026-07-15' }, cfg).includes('padron'));
  assert.ok(!proponerGuarniciones({ estilo: 'mixta', fecha: '2026-11-15' }, cfg).includes('padron'));
});

test('dos o más guarniciones de brasa: la carne baja un 10 % y cada guarnición al 70 %', () => {
  const sin = calcular(excel, cfg).resumen.kgCarne;
  const una = calcular({ ...excel, guarniciones: ['patatas'] }, cfg);
  const dos = calcular({ ...excel, guarniciones: ['patatas', 'pimientosRojos'] }, cfg);
  assert.equal(una.resumen.kgCarne.toFixed(2), sin.toFixed(2));
  assert.equal((dos.resumen.kgCarne / sin).toFixed(2), '0.90');
  const patUna = una.lineas.find((l) => l.id === 'patatas').necesidad;
  const patDos = dos.lineas.find((l) => l.id === 'patatas').necesidad;
  assert.equal((patDos / patUna).toFixed(2), '0.70');
});

test('la ensalada no reduce la carne ni se reduce', () => {
  const r = calcular({ ...excel, guarniciones: ['patatas', 'ensalada'] }, cfg);
  assert.equal(r.resumen.kgCarne.toFixed(2), calcular(excel, cfg).resumen.kgCarne.toFixed(2));
});

test('aperitivo opcional', () => {
  assert.ok(calcular(excel, cfg).lineas.find((l) => l.id === 'patatasFritas'));
  assert.equal(calcular({ ...excel, aperitivo: false }, cfg).lineas.find((l) => l.id === 'patatasFritas'), undefined);
});

test('salsas según el menú', () => {
  const vac = calcular({ ...cena10, carnes: ['chuleton', 'chorizo'] }, cfg);
  assert.ok(vac.lineas.find((l) => l.id === 'chimichurri'));
  assert.ok(vac.lineas.find((l) => l.id === 'alioli'));
  const ame = calcular({ ...cena10, estilo: 'americana', carnes: ['hamburguesa'] }, cfg);
  assert.ok(ame.lineas.find((l) => l.id === 'salsasAmericanas'));
  assert.equal(ame.lineas.find((l) => l.id === 'alioli'), undefined);
});

test('carbón: al menos 1 kg por kg de carne', () => {
  const r = calcular(excel, cfg);
  assert.ok(r.lineas.find((l) => l.id === 'carbon').cantidad >= r.resumen.kgCarneCompra);
});

test('más de 25 personas: consejo de dos parrillas', () => {
  assert.ok(calcular(excel, cfg).avisos.some((a) => a.tipo === 'dos-parrillas'));
  assert.ok(!calcular(cena10, cfg).avisos.some((a) => a.tipo === 'dos-parrillas'));
});

test('mezcla de bebida sugerida según el menú', () => {
  assert.equal(sugerirMezcla({ ...cena10, carnes: ['chuleton'] }, cfg), 55);
  assert.equal(sugerirMezcla({ ...cena10, carnes: ['presa'] }, cfg), 65);
  assert.equal(sugerirMezcla({ ...cena10, estilo: 'americana', carnes: ['hamburguesa'] }, cfg), 90);
  assert.equal(sugerirMezcla({ ...excel }, cfg), 80);
});

test('algo de mar va fuera del reparto', () => {
  const sin = calcular({ ...cena10, carnes: ['chuleton', 'chorizo'] }, cfg);
  const con = calcular({ ...cena10, carnes: ['chuleton', 'chorizo', 'langostinos'] }, cfg);
  assert.equal(kgDe(con, 'chuleton'), kgDe(sin, 'chuleton'));
  assert.ok(kgDe(con, 'langostinos') > 0);
});

test('la app propone como mucho dos guarniciones', () => {
  for (const estilo of ['espanola', 'americana', 'mixta']) for (const presupuesto of ['economico', 'medio', 'premium'])
    for (const fecha of ['2026-01-10', '2026-04-10', '2026-07-10', '2026-10-10']) for (const vegetarianos of [0, 3]) {
      const g = proponerGuarniciones({ estilo, presupuesto, fecha, vegetarianos }, cfg);
      assert.ok(g.length >= 1 && g.length <= 2, `${estilo}/${presupuesto}/${fecha}: ${g}`);
    }
  assert.deepEqual(proponerGuarniciones({ estilo: 'espanola', presupuesto: 'medio', fecha: '2026-07-10' }, cfg), ['pimientosRojos', 'patatas']);
  assert.ok(proponerGuarniciones({ estilo: 'espanola', vegetarianos: 2, fecha: '2026-07-10' }, cfg).includes('rodajas'));
});
