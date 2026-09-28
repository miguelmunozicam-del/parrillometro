/* Parrillómetro — interfaz */
(function () {
  const cfg = window.PARRILLOMETRO_CONFIG;
  const { calcular, proponerCarnes, sugerirMezcla, maxProtagonistas } = window.Parrillometro;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const KEY = 'parrillometro.v1';               // barbacoa en curso
  const KEY_HIST = 'parrillometro.historial.v1';  // barbacoas guardadas

  const fechaHoyISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

  // ---------- Estado ----------
  const inicial = () => {
    const s = JSON.parse(JSON.stringify(cfg.ejemplo));
    s.carnes = proponerCarnes(s, cfg);
    s.precios = {};
    s.fecha = s.fecha || fechaHoyISO();
    s.protagonistas = null;   // null = la app elige
    s.guarniciones = null;    // null = la app propone
    s.carnesManual = false;   // true cuando el usuario toca la lista de carnes
    s.pctManual = false;      // true cuando el usuario mueve el deslizador
    return s;
  };
  // Todo se guarda solo en el navegador de quien usa la app (localStorage).
  // No caduca: solo se borra cuando el usuario lo pide.
  const leer = (k, def) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : def; } catch (e) { return def; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const quitar = (k) => { try { localStorage.removeItem(k); } catch (e) { /* nada */ } };

  let state = inicial();
  let origenId = null; // barbacoa del historial de la que viene la actual, si la hay
  let desdeGuardado = false;
  const g = leer(KEY, null);
  if (g && typeof g === 'object') {
    const estado = g.estado || g; // admite el formato antiguo
    if (estado && estado.adultos != null) {
      state = Object.assign(inicial(), estado); origenId = g.origen || null; desdeGuardado = true;
    }
  }
  const guardar = () => escribir(KEY, { t: Date.now(), estado: state, origen: origenId });
  let historial = leer(KEY_HIST, []);
  if (!Array.isArray(historial)) historial = [];

  let abierta = null; // línea del ticket desplegada
  let ultimo = null;  // último resultado

  // ---------- Formato ----------
  const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  const num = (n, d = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: d }).format(n);
  const plural = (formato, n) => {
    if (n === 1) return formato;
    const [primera, ...resto] = formato.split(' ');
    return [primera + 's', ...resto].join(' ');
  };
  function textoCantidad(l) {
    let t;
    if (l.formato) t = `${l.envases} ${plural(l.formato, l.envases)}`;
    else if (l.unidad === 'kg') t = `${num(l.cantidad)} kg`;
    else t = `${num(l.cantidad, 0)} ud.`;
    if (l.kgAprox) t += ` · ${num(l.cantidad, 0)} uds, ≈${num(l.kgAprox, 1)} kg`;
    return t;
  }
  function textoPrecioPor(id) {
    const p = cfg.productos[id];
    if (p.formato) return `€ / ${p.formato}`;
    return p.unidad === 'kg' ? '€ / kg' : '€ / ud.';
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Preguntas: chips ----------
  const opcionesDe = { duracion: cfg.duracion, apetito: cfg.apetito, sed: cfg.sed, sinAlcohol: cfg.sinAlcohol, tiempo: cfg.tiempo, presupuesto: cfg.presupuesto, estilo: cfg.estilo };
  $$('.chips[data-field]').forEach((box) => {
    const field = box.dataset.field;
    box.innerHTML = opcionesDe[field].map((o) =>
      `<button type="button" class="chip" role="radio" data-v="${o.id}" aria-checked="false"><b>${esc(o.label)}</b>${o.detalle ? `<span>${esc(o.detalle)}</span>` : ''}</button>`
    ).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      state[field] = b.dataset.v;
      if (field === 'presupuesto' || field === 'estilo') rehacerPropuesta();
      if (field === 'duracion') { state.carnesManual = false; }
      syncChips(); actualizar();
    });
    // Flechas para moverse dentro del grupo
    box.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const bs = $$('.chip', box); const i = bs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      const j = (i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length;
      bs[j].focus(); bs[j].click();
    });
  });
  function syncChips() {
    $$('.chips[data-field]').forEach((box) => {
      $$('.chip', box).forEach((b) => {
        const on = state[box.dataset.field] === b.dataset.v;
        b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
      });
    });
  }

  // ---------- Personas ----------
  $$('.stepper').forEach((st) => {
    const field = st.dataset.field; const input = $('input', st);
    const set = (v) => { state[field] = Math.max(0, Math.min(500, Math.round(Number(v) || 0))); input.value = state[field]; actualizar(); };
    st.addEventListener('click', (e) => { const b = e.target.closest('.st-btn'); if (b) set(state[field] + Number(b.dataset.d)); });
    input.addEventListener('input', () => { if (input.value !== '') set(input.value); });
    input.addEventListener('blur', () => set(input.value));
  });

  // ---------- Mezcla cerveza / vino ----------
  const slider = $('#pctVino');
  slider.addEventListener('input', () => { state.pctCerveza = 100 - Number(slider.value); state.pctManual = true; actualizar(); });
  $('#btnMezcla').addEventListener('click', () => { state.pctManual = false; actualizar(); });
  function pintarMezcla() {
    const c = state.pctCerveza;
    slider.value = 100 - c;
    const sug = sugerirMezcla(state, cfg);
    $('#mixRead').textContent = (c === 100 ? 'Solo cerveza' : c === 0 ? 'Solo vino' : `${c} % cerveza · ${100 - c} % vino`) +
      (c === sug ? ' · sugerido para este menú' : '');
    const b = $('#btnMezcla');
    b.hidden = c === sug;
    b.textContent = `Usar la sugerencia (${sug} % cerveza)`;
  }

  // ---------- Checks ----------
  ['carbon', 'menaje', 'aperitivo'].forEach((id) => {
    $('#' + id).addEventListener('change', (e) => { state[id] = e.target.checked; actualizar(); });
  });

  // ---------- Fecha ----------
  $('#fecha').addEventListener('change', (e) => { state.fecha = e.target.value || fechaHoyISO(); actualizar(); });
  function pintarFecha(r) {
    const t = cfg.temporadas.find((x) => x.id === r.temporada);
    $('#temporadaRead').innerHTML = `Temporada: <b>${esc(t ? t.nombre : '')}</b>. La usamos para proponer la verdura.`;
  }

  // ---------- Guarniciones ----------
  $('#guarn').innerHTML = cfg.guarniciones.map((g) =>
    `<button type="button" class="toggle" data-v="${g.id}" aria-pressed="false">${esc(cfg.productos[g.id].nombre)}<small data-gq="${g.id}"></small></button>`).join('');
  $('#guarn').addEventListener('click', (e) => {
    const b = e.target.closest('.toggle'); if (!b) return;
    const actual = new Set(ultimo.guarniciones);
    actual.has(b.dataset.v) ? actual.delete(b.dataset.v) : actual.add(b.dataset.v);
    state.guarniciones = cfg.guarniciones.map((g) => g.id).filter((id) => actual.has(id));
    actualizar();
  });
  function pintarGuarniciones(r) {
    const porId = Object.fromEntries(r.lineas.map((l) => [l.id, l]));
    $$('#guarn .toggle').forEach((b) => b.setAttribute('aria-pressed', r.guarniciones.includes(b.dataset.v)));
    $$('#guarn [data-gq]').forEach((sm) => { const l = porId[sm.dataset.gq]; sm.textContent = l ? textoCantidad(l) : ''; });
    const t = cfg.temporadas.find((x) => x.id === r.temporada);
    const est = cfg.estilo.find((x) => x.id === state.estilo);
    $('#guarnNote').textContent = state.guarniciones
      ? 'Tu selección. Con dos o más de brasa, la carne baja un 10 % y cada guarnición se ajusta.'
      : `Propuesta para ${est ? est.label.toLowerCase() : 'tu barbacoa'} en ${t ? t.nombre : 'esta época'}. Marca o desmarca lo que quieras.`;
  }

  // ---------- Carne: extras, propuesta y catálogo ----------
  $('#extras').innerHTML = cfg.extras.map((x) =>
    `<button type="button" class="toggle" data-v="${x.id}" aria-pressed="false">${esc(x.label)}</button>`).join('');
  $('#extras').addEventListener('click', (e) => {
    const b = e.target.closest('.toggle'); if (!b) return;
    const set = new Set(state.extras || []);
    set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v);
    state.extras = [...set];
    rehacerPropuesta(); syncExtras(); actualizar();
  });
  function syncExtras() {
    $$('#extras .toggle').forEach((b) => b.setAttribute('aria-pressed', (state.extras || []).includes(b.dataset.v)));
  }
  function rehacerPropuesta() {
    state.carnesManual = false; state.protagonistas = null; state.guarniciones = null;
  }

  function precioCorto(id) {
    const p = cfg.productos[id];
    const precio = state.precios[id] ?? p.precio;
    return p.formato ? `${num(precio)} €/${p.formato.split(' ')[0]}` : `${num(precio)} €/kg`;
  }
  $('#catalog').innerHTML = cfg.categoriasCarne.map((cat) => {
    const items = cfg.carnes.filter((c) => c.cat === cat.id);
    return `<div><h4>${esc(cat.nombre)}</h4><div class="toggles">${items.map((c) =>
      `<button type="button" class="toggle" data-v="${c.id}" aria-pressed="false">${esc(cfg.productos[c.id].nombre)}<span class="cat-price" data-price="${c.id}"></span></button>`
    ).join('')}</div></div>`;
  }).join('');
  $('#catalog').addEventListener('click', (e) => {
    const b = e.target.closest('.toggle'); if (!b) return;
    const id = b.dataset.v;
    state.carnes = state.carnes.includes(id) ? state.carnes.filter((x) => x !== id) : [...state.carnes, id];
    state.carnesManual = true;
    actualizar();
  });
  $('#btnCatalog').addEventListener('click', () => {
    const cat = $('#catalog'); cat.hidden = !cat.hidden;
    $('#btnCatalog').setAttribute('aria-expanded', String(!cat.hidden));
    $('#btnCatalog').textContent = cat.hidden ? 'Añadir del catálogo' : 'Cerrar catálogo';
  });
  $('#picked').addEventListener('click', (e) => {
    const star = e.target.closest('.pk-star');
    if (star) {
      const id = star.dataset.v;
      let prot = [...ultimo.protagonistas];
      if (prot.includes(id)) prot = prot.filter((x) => x !== id);
      else {
        prot.push(id);
        while (prot.length > maxProtagonistas(state, cfg)) prot.shift();
      }
      state.protagonistas = prot;
      state.carnesManual = true;
      actualizar();
      return;
    }
    const b = e.target.closest('.pk-remove'); if (!b) return;
    state.carnes = state.carnes.filter((x) => x !== b.dataset.v);
    state.carnesManual = true;
    actualizar();
  });

  const ETIQUETA = { protagonista: 'Principal', secundario: '', picoteo: 'Picoteo', mar: 'Picoteo' };
  const ORDEN = { protagonista: 0, secundario: 1, picoteo: 2, mar: 3 };
  function pintarCarnes(r) {
    const porId = Object.fromEntries(r.lineas.map((l) => [l.id, l]));
    const info = Object.fromEntries(r.carne.map((c) => [c.id, c]));
    const list = $('#picked');
    if (!state.carnes.length) {
      list.innerHTML = '<li class="picked-empty">Sin carne. Añade algo del catálogo o cambia el estilo.</li>';
    } else {
      const ids = [...state.carnes].sort((a, b) => (ORDEN[(info[a] || {}).papel] ?? 9) - (ORDEN[(info[b] || {}).papel] ?? 9));
      list.innerHTML = ids.map((id) => {
        const l = porId[id]; const c = info[id] || {};
        const kg = l ? (l.kgAprox ?? l.cantidad) : 0;
        const det = l ? (l.kgAprox ? `${num(l.cantidad, 0)} uds · ≈${num(kg, 1)} kg` : `${num(kg)} kg`) : '—';
        const main = c.papel === 'protagonista';
        const tag = ETIQUETA[c.papel] ? `<span class="pk-tag${main ? ' main' : ''}">${ETIQUETA[c.papel]}</span>` : '';
        const pct = c.pct ? ` · ${Math.round(c.pct * 100)} %` : '';
        const nombre = esc(cfg.productos[id].nombre);
        const esMar = cfg.carnes.find((x) => x.id === id).papel === 'mar';
        const estrella = esMar ? '' : `<button type="button" class="pk-star" data-v="${id}" aria-pressed="${main}" aria-label="${main ? 'Quitar como plato principal' : 'Marcar como plato principal'}: ${nombre}" title="${main ? 'Plato principal' : 'Marcar como plato principal'}">${main ? '★' : '☆'}</button>`;
        return `<li class="${main ? 'is-main' : ''}">${estrella}<span class="pk-body"><span class="pk-name">${nombre}</span>${tag}<span class="pk-kg">${det}${pct}</span></span>` +
          `<button type="button" class="pk-remove" data-v="${id}" aria-label="Quitar ${nombre}">×</button></li>`;
      }).join('');
    }
    $('#pickedKg').textContent = r.resumen.kgCarneCompra ? `${num(r.resumen.kgCarneCompra, 1)} kg en total` : '';
    $$('#catalog .toggle').forEach((b) => b.setAttribute('aria-pressed', state.carnes.includes(b.dataset.v)));
    $$('#catalog [data-price]').forEach((s) => { s.textContent = precioCorto(s.dataset.price); });
  }

  // ---------- Ticket ----------
  const fechaCorta = (iso) => { try { return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T12:00:00')); } catch (e) { return iso; } };
  function pintarTicket(r) {
    const R = r.resumen;
    $('#tSub').textContent = `Barbacoa · ${R.personas} ${R.personas === 1 ? 'persona' : 'personas'} · ${fechaCorta(state.fecha)}`;
    $('#tKpis').innerHTML = [
      [`${num(R.kgCarneCompra, 1)}`, 'kg de carne'],
      [`${num(R.latasCerveza, 0)}`, 'latas cerveza'],
      [`${num(R.botellasVino, 0)}`, 'botellas vino'],
    ].map(([v, k]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');

    if (!r.lineas.length) {
      $('#tBody').innerHTML = '<p class="t-empty">Añade invitados para ver la lista.</p>';
    } else {
      $('#tBody').innerHTML = cfg.grupos.map((g) => {
        let ls = r.lineas.filter((l) => l.grupo === g.id);
        if (!ls.length) return '';
        if (g.id === 'carniceria') {
          const papel = Object.fromEntries(r.carne.map((c) => [c.id, c.papel]));
          ls = [...ls].sort((a, b) => (ORDEN[papel[a.id]] ?? 9) - (ORDEN[papel[b.id]] ?? 9));
        }
        return `<div class="t-group"><h4>${esc(g.nombre.toUpperCase())}</h4>${ls.map(lineaHTML).join('')}</div>`;
      }).join('');
    }
    $('#tTotal').textContent = eur.format(R.total);
    $('#tPorLabel').textContent = R.adultos ? 'Por adulto (los peques no pagan)' : 'Por persona';
    $('#tPor').textContent = eur.format(R.adultos ? R.porAdulto : R.porPersona);
    const av = r.avisos.find((a) => a.tipo === 'exceso-alcohol');
    const caja = $('#tAviso');
    caja.hidden = !av;
    if (av) {
      caja.innerHTML = `<b>OJO CON LA BEBIDA</b><p>Con estas respuestas salen unas ${num(av.consumicionesPorAdulto, 0)} consumiciones por adulto ` +
        `(≈${num(av.litrosPorAdulto, 1)} L de cerveza cada uno). Es mucho: compra una parte y deja el resto para una segunda ronda si hace falta. ` +
        `Y quien conduzca, cero alcohol.</p>`;
    }
    const dp = r.avisos.find((a) => a.tipo === 'dos-parrillas');
    const cons = $('#tConsejo');
    cons.hidden = !dp;
    if (dp) cons.innerHTML = `<b>CONSEJO</b><p>Con ${dp.personas} personas, mejor dos parrillas o asar por turnos: una parrilla normal da para unas 12 personas por tanda.</p>`;
    $('#mbTotal').textContent = `Total ${eur.format(R.total)}`;
    $('#btnWa').href = 'https://wa.me/?text=' + encodeURIComponent(textoLista(r));
  }
  function lineaHTML(l) {
    const open = abierta === l.id;
    const q = encodeURIComponent(l.buscar);
    const detalle = open ? `<div class="t-detail" id="det-${l.id}">
        <label class="t-price">Precio <input type="number" inputmode="decimal" step="0.05" min="0" id="precio-${l.id}" data-precio="${l.id}" value="${l.precio}"> ${textoPrecioPor(l.id)}</label>
        <div class="t-stores">${cfg.tiendas.map((t) => `<a href="${t.url.replace('{q}', q)}" target="_blank" rel="noopener">${esc(t.nombre)} ↗</a>`).join('')}</div>
      </div>` : '';
    return `<div class="t-line"><button type="button" data-line="${l.id}" aria-expanded="${open}"${open ? ` aria-controls="det-${l.id}"` : ''}>
        <span class="t-name">${esc(l.nombre)}</span><span class="t-qty">${esc(textoCantidad(l))}</span>
        <span class="t-cost${l.precioEditado ? ' edited' : ''}">${eur.format(l.coste)}</span>
      </button>${detalle}</div>`;
  }
  $('#tBody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-line]'); if (!b) return;
    abierta = abierta === b.dataset.line ? null : b.dataset.line;
    pintarTicket(ultimo);
    if (abierta) { const inp = $('#precio-' + abierta); if (inp) inp.focus({ preventScroll: true }); }
  });
  $('#tBody').addEventListener('change', (e) => {
    const inp = e.target.closest('[data-precio]'); if (!inp) return;
    const id = inp.dataset.precio; const v = parseFloat(String(inp.value).replace(',', '.'));
    if (isFinite(v) && v >= 0 && v !== cfg.productos[id].precio) state.precios[id] = v; else delete state.precios[id];
    actualizar();
  });

  function textoLista(r) {
    const R = r.resumen;
    const out = [`🛒 Parrillómetro · Barbacoa para ${R.personas} · ${fechaCorta(state.fecha)}`, ''];
    if (r.protagonistas.length) out.push(`Plato principal: ${r.protagonistas.map((id) => cfg.productos[id].nombre).join(' y ')}`, '');
    cfg.grupos.forEach((g) => {
      const ls = r.lineas.filter((l) => l.grupo === g.id); if (!ls.length) return;
      out.push(`*${g.nombre}*`);
      ls.forEach((l) => out.push(`- ${l.nombre}: ${textoCantidad(l)}`));
      out.push('');
    });
    out.push(`Total estimado: ${eur.format(R.total)}${R.adultos ? ` (${eur.format(R.porAdulto)} por adulto)` : ''}`);
    if (r.avisos.some((a) => a.tipo === 'exceso-alcohol')) out.push('', '⚠️ Mucha bebida por persona: mejor comprar una parte y reponer si hace falta. Quien conduzca, cero alcohol.');
    return out.join('\n');
  }

  // ---------- Acciones ----------
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; clearTimeout(toast.t); toast.t = setTimeout(() => { t.textContent = ''; }, 3500); };
  $('#btnCopy').addEventListener('click', () => {
    const txt = textoLista(ultimo);
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* nada */ }
      ta.remove(); toast(ok ? 'Lista copiada' : 'No se pudo copiar automáticamente');
    };
    try { navigator.clipboard.writeText(txt).then(() => toast('Lista copiada'), fallback); } catch (e) { fallback(); }
  });
  let enMarco = false; try { enMarco = window.self !== window.top; } catch (e) { enMarco = true; }
  if (enMarco) $('#btnPrint').hidden = true;
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#btnReset').addEventListener('click', () => { state.precios = {}; actualizar(); toast('Precios orientativos restablecidos'); });
  // Botones de borrado con confirmación en dos pulsaciones (sin diálogos del navegador).
  function confirmar(btn, texto, accion) {
    if (btn.dataset.armado) {
      clearTimeout(btn._t); btn.textContent = btn.dataset.orig; delete btn.dataset.armado; btn.classList.remove('danger');
      accion(); return;
    }
    btn.dataset.orig = btn.textContent; btn.dataset.armado = '1'; btn.textContent = texto; btn.classList.add('danger');
    btn._t = setTimeout(() => { btn.textContent = btn.dataset.orig; delete btn.dataset.armado; btn.classList.remove('danger'); }, 4000);
  }
  $('#btnNuevo').addEventListener('click', (e) => confirmar(e.currentTarget, '¿Seguro? Pulsa otra vez para borrar', () => {
    state = inicial(); origenId = null; abierta = null; quitar(KEY); desdeGuardado = false;
    init(); cerrarGuardar(); toast('Barbacoa en curso borrada. Vuelves al ejemplo.');
    window.scrollTo({ top: 0 });
  }));

  // ---------- Historial ----------
  const fechaLarga = (iso) => { try { return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T12:00:00')); } catch (e) { return iso; } };
  const guardarHist = () => { if (!escribir(KEY_HIST, historial)) toast('Este navegador no permite guardar datos'); };

  function abrirGuardar() {
    const orig = historial.find((h) => h.id === origenId);
    $('#gNombre').value = orig ? orig.nombre : `Barbacoa de ${ultimo.resumen.personas}`;
    $('#gFecha').value = orig ? orig.fecha : (state.fecha || fechaHoyISO());
    $('#gNotas').value = orig ? (orig.notas || '') : '';
    $('#gActualizar').hidden = !orig;
    if (orig) $('#gActualizar').textContent = `Actualizar «${orig.nombre}»`;
    $('#gNueva').textContent = orig ? 'Guardar como nueva' : 'Guardar';
    $('#guardarForm').hidden = false; $('#btnGuardar').setAttribute('aria-expanded', 'true');
    $('#gNombre').focus(); $('#gNombre').select();
  }
  function cerrarGuardar() { $('#guardarForm').hidden = true; $('#btnGuardar').setAttribute('aria-expanded', 'false'); }
  $('#btnGuardar').addEventListener('click', () => ($('#guardarForm').hidden ? abrirGuardar() : cerrarGuardar()));
  $('#gCancelar').addEventListener('click', cerrarGuardar);

  function entradaActual(id) {
    return {
      id, nombre: $('#gNombre').value.trim() || `Barbacoa de ${ultimo.resumen.personas}`,
      fecha: $('#gFecha').value || fechaHoyISO(), notas: $('#gNotas').value.trim(),
      guardada: Date.now(), estado: JSON.parse(JSON.stringify(state)),
      personas: ultimo.resumen.personas, total: ultimo.resumen.total,
    };
  }
  $('#guardarForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const actualizar = e.submitter && e.submitter.id === 'gActualizar';
    if (actualizar && origenId) {
      const i = historial.findIndex((h) => h.id === origenId);
      if (i >= 0) historial[i] = entradaActual(origenId);
    } else {
      origenId = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      historial.unshift(entradaActual(origenId));
    }
    guardarHist(); guardar(); cerrarGuardar(); pintarHistorial();
    toast(actualizar ? 'Barbacoa actualizada en tu historial' : 'Barbacoa guardada en tu historial');
  });

  function pintarHistorial() {
    const lista = [...historial].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.guardada - a.guardada);
    $('#histCount').textContent = historial.length ? `(${historial.length})` : '';
    $('#histVacio').hidden = historial.length > 0;
    $('#btnBorrarHist').hidden = historial.length === 0;
    $('#histList').innerHTML = lista.map((h) => `<li class="h-item${h.id === origenId ? ' current' : ''}">
        <div class="h-main"><b>${esc(h.nombre)}</b>
          <span class="h-meta">${esc(fechaLarga(h.fecha))} · ${h.personas} personas · ${eur.format(h.total)}</span>
          ${h.notas ? `<span class="h-notas">${esc(h.notas)}</span>` : ''}</div>
        <div class="h-acts">
          <button type="button" class="btn small" data-cargar="${h.id}"${h.id === origenId ? " disabled" : ""}>${h.id === origenId ? "Abierta" : "Abrir"}</button>
          <button type="button" class="btn small ghost" data-borrar="${h.id}" aria-label="Borrar ${esc(h.nombre)}">Borrar</button>
        </div></li>`).join('');
  }
  $('#histList').addEventListener('click', (e) => {
    const c = e.target.closest('[data-cargar]');
    if (c) {
      const h = historial.find((x) => x.id === c.dataset.cargar); if (!h) return;
      state = Object.assign(inicial(), JSON.parse(JSON.stringify(h.estado)));
      origenId = h.id; abierta = null; desdeGuardado = true;
      init(); guardar(); cerrarGuardar();
      $('#sampleNote').textContent = `Estás viendo «${h.nombre}». Si la cambias, pulsa «Guardar barbacoa» para actualizarla.`;
      toast(`Abierta «${h.nombre}»`); window.scrollTo({ top: 0 });
      return;
    }
    const d = e.target.closest('[data-borrar]');
    if (d) confirmar(d, '¿Seguro?', () => {
      historial = historial.filter((x) => x.id !== d.dataset.borrar);
      if (origenId === d.dataset.borrar) { origenId = null; guardar(); }
      guardarHist(); pintarHistorial(); toast('Barbacoa borrada del historial');
    });
  });
  $('#btnBorrarHist').addEventListener('click', (e) => confirmar(e.currentTarget, '¿Seguro? Pulsa otra vez para borrar todo', () => {
    historial = []; origenId = null; quitar(KEY_HIST); guardar(); pintarHistorial(); toast('Historial borrado');
  }));

  // ---------- Ciclo ----------
  const NOTA_EJEMPLO = $('#sampleNote').textContent;
  function actualizar(guardarCambios = true) {
    // Propuestas automáticas mientras el usuario no las toque.
    if (!state.carnesManual) state.carnes = proponerCarnes(state, cfg);
    if (!state.pctManual) state.pctCerveza = sugerirMezcla(state, cfg);
    ultimo = calcular(state, cfg);
    pintarMezcla();
    pintarFecha(ultimo);
    pintarCarnes(ultimo);
    pintarGuarniciones(ultimo);
    pintarTicket(ultimo);
    $('#btnReset').hidden = !Object.keys(state.precios).length;
    if (guardarCambios) guardar();
  }
  function init() {
    ['adultos', 'adolescentes', 'ninos', 'vegetarianos'].forEach((f) => { $('#' + f).value = state[f]; });
    $('#fecha').value = state.fecha || fechaHoyISO();
    $('#carbon').checked = state.carbon !== false; $('#menaje').checked = state.menaje !== false;
    $('#aperitivo').checked = state.aperitivo !== false;
    $('#sampleNote').textContent = desdeGuardado
      ? 'Hemos recuperado tu última barbacoa. Se queda guardada en este navegador hasta que la borres.'
      : NOTA_EJEMPLO;
    syncChips(); syncExtras(); actualizar(false); pintarHistorial();
  }
  init();
})();
