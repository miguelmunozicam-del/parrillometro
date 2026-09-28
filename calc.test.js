// Ejecutar con: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const cfg = require('./config.js');
const { calcular, redondearArriba, proponerCarnes } = require('./calc.js');

const carnesDefecto = proponerCarnes(cfg.ejemplo, cfg);
const linea = (r, id) => r.lineas.find((l) => l.id === id);

// Caso de referencia: la hoja de cálculo original (23 adultos, 6 adolescentes,
// 12 niños, barbacoa de 8 horas).
const excel = {
  ...cfg.ejemplo, tiempo: 'agradable', carnes: carnesDefecto,
};

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
  const p = proponerCarnes({ estilo: 'espanola', presupuesto: 'premium', extras: ['iberico'] }, cfg);
  assert.equal(p.filter((id) => id === 'secreto').length, 1);
  assert.ok(p.includes('presa'));
});

test('el premium sale más caro que el económico', () => {
  const eco = calcular({ ...excel, carnes: proponerCarnes({ estilo: 'mixta', presupuesto: 'economico' }, cfg) }, cfg);
  const pre = calcular({ ...excel, carnes: proponerCarnes({ estilo: 'mixta', presupuesto: 'premium' }, cfg) }, cfg);
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
    if (r.avisos.length) combos.push(`${sed.id}/${dur.id}`);
  }
  assert.deepEqual(combos, ['pueblo/larga']);
});
