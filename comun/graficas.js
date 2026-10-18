// Graficas: lienzos y dibujo de gráficas del curso «Señales, de 0 a experto» (Ena en Curso).
// Script clásico (sin módulos): define la global Graficas. No depende de Curso ni de Senal.
//
// Convenios:
//   - Todas las medidas de dibujo van en píxeles CSS; el lienzo ya está escalado a devicePixelRatio.
//   - Los colores salen siempre de Graficas.colores(), que lee los tokens de comun/estilo.css. Así cambian solos
//     con el tema claro (papel) u oscuro (agua). Nada de colores escritos a mano.
//   - En oscuro, la luz se suma: los trazos de señal llevan un halo suave (trazos anchos y translúcidos debajo).
//   - Cada lienzo se redibuja solo al cambiar de tamaño, de tema o al terminar de cargar las fuentes.
(function (raiz) {
  'use strict';

  const TAU = Math.PI * 2;
  const doc = typeof document !== 'undefined' ? document : null;
  // Idioma de la página: <html lang="en…"> → 'en'; si no, 'es' (el idioma por defecto). Graficas.idioma.
  const idioma = (() => { try { return doc && /^en/i.test((doc.documentElement.getAttribute('lang') || '').trim()) ? 'en' : 'es'; } catch (e) { return 'es'; } })();
  const EN = idioma === 'en';
  const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const FUENTE_MONO = '"IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';
  const FUENTE_TEXTO = 'Literata, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

  // ── Colores ──────────────────────────────────────────────────────────────────────────────────────────
  const TOKENS = {
    fondo: '--fondo', superficie: '--superficie', superficie2: '--superficie-2', pantalla: '--pantalla',
    texto: '--texto', suave: '--texto-suave', tenue: '--texto-tenue', eje: '--eje', rejilla: '--rejilla',
    linea: '--linea', acento: '--acento', senal: '--c-senal', respuesta: '--c-respuesta', cuerpo: '--c-cuerpo',
    borde: '--c-borde', espectro: '--c-espectro', ruido: '--c-ruido', plantilla: '--c-plantilla', ok: '--ok', mal: '--mal',
  };
  // Valores de respaldo por si la hoja de estilo no ha cargado (los mismos de estilo.css).
  const RESPALDO = {
    papel: { fondo: '#f6f5fa', superficie: '#ffffff', superficie2: '#efedf6', pantalla: '#fbfaff', texto: '#1e1638',
      suave: '#463f63', tenue: '#645e86', eje: '#8a84a6', rejilla: '#ebe8f3', linea: '#dcd8ea', acento: '#5547a3',
      senal: '#009c6c', respuesta: '#e2531c', cuerpo: '#1e1638', borde: '#2a86a8', espectro: '#b07800', ruido: '#d64545',
      plantilla: '#5b4fd6', ok: '#0b7a54', mal: '#c23b3b' },
    agua: { fondo: '#0b0817', superficie: '#130e24', superficie2: '#1b1532', pantalla: '#0e0a1d', texto: '#eef2f0',
      suave: '#c4cbc8', tenue: '#8d9793', eje: '#5f6a66', rejilla: '#1f1937', linea: '#2b2445', acento: '#a99bff',
      senal: '#00f49f', respuesta: '#ff7a45', cuerpo: '#e4eae8', borde: '#9fe8ff', espectro: '#ffc45c', ruido: '#ff6b6b',
      plantilla: '#8078ff', ok: '#5ee6a8', mal: '#ff8a8a' },
  };

  // «#rgb», «#rrggbb», «rgb(…)» o «rgba(…)» → [r, g, b, a]
  function rgba(color) {
    if (Array.isArray(color)) return [color[0], color[1], color[2], color[3] ?? 1];
    const s = String(color || '').trim();
    if (s[0] === '#') {
      let h = s.slice(1);
      if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h.slice(0, 6), 16);
      const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
    }
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      return [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1];
    }
    return [128, 128, 128, 1];
  }
  // El mismo color con otra opacidad: Graficas.alfa(C.senal, .3) → 'rgba(…, .3)'
  function alfa(color, a) {
    const c = rgba(color);
    return `rgba(${c[0]},${c[1]},${c[2]},${(+limitar(a * c[3])).toFixed(3)})`;
  }
  // Mezcla de dos colores: t = 0 → el primero, t = 1 → el segundo.
  function mezclar(c1, c2, t, a = 1) {
    const p = rgba(c1), q = rgba(c2);
    const v = [0, 1, 2].map(i => Math.round(p[i] + (q[i] - p[i]) * t));
    return `rgba(${v[0]},${v[1]},${v[2]},${(+limitar(a)).toFixed(3)})`;
  }
  function luminancia(color) {
    const c = rgba(color).slice(0, 3).map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  let cache = null;
  // C = { fondo, superficie, superficie2, pantalla, texto, suave, tenue, eje, rejilla, linea, acento, senal,
  //       respuesta, cuerpo, borde, espectro, ruido, plantilla, ok, mal, oscuro }
  function colores() {
    if (cache) return cache;
    let estilo = null;
    try { estilo = doc ? getComputedStyle(doc.documentElement) : null; } catch (e) { estilo = null; }
    const leer = v => (estilo ? estilo.getPropertyValue(v).trim() : '');
    const fondoCss = leer('--fondo');
    let oscuro;
    if (fondoCss) oscuro = luminancia(fondoCss) < 0.35;
    else oscuro = temaDelSistemaOscuro();
    const base = oscuro ? RESPALDO.agua : RESPALDO.papel;
    const C = { oscuro };
    for (const k in TOKENS) C[k] = leer(TOKENS[k]) || base[k];
    cache = C;
    return C;
  }
  function temaDelSistemaOscuro() {
    if (!doc) return false;
    const t = doc.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }

  // ── Registro de lienzos: se redibujan al cambiar el tema, el tamaño o al cargar las fuentes ─────────────
  const lienzos = new Set();
  const oyentesTema = new Set();
  let oscuroAnterior = null;
  function redibujarTodo() { for (const L of lienzos) { try { L.dibujar(); } catch (e) { console.error(e); } } }
  function avisarTema() {
    cache = null;
    const C = colores();
    redibujarTodo();
    if (C.oscuro !== oscuroAnterior) {
      oscuroAnterior = C.oscuro;
      for (const f of oyentesTema) { try { f(C); } catch (e) { console.error(e); } }
    }
  }
  if (doc) {
    try {
      new MutationObserver(avisarTema).observe(doc.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      const mq = matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', avisarTema); else if (mq.addListener) mq.addListener(avisarTema);
    } catch (e) { /* sin matchMedia: el tema no cambia solo */ }
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { cache = null; redibujarTodo(); });
    if (doc.fonts && doc.fonts.addEventListener) doc.fonts.addEventListener('loadingdone', () => redibujarTodo());
  }
  // Avisa cuando cambia el tema (claro u oscuro). Devuelve la función para dejar de escuchar.
  function alCambiarTema(fn) {
    if (oscuroAnterior === null) oscuroAnterior = colores().oscuro;
    oyentesTema.add(fn);
    return () => oyentesTema.delete(fn);
  }

  // ── Lienzo ─────────────────────────────────────────────────────────────────────────────────────────────
  // Graficas.lienzo(contenedor, { alto = 260, aspecto, altoMin, altoMax, etiqueta, dibujar: (ctx, w, h, C) => {} })
  //   alto: número de píxeles CSS o función del ancho: w => (w < 500 ? 220 : 300).
  //   aspecto: ancho / alto (si se da, manda sobre alto), limitado a [altoMin = 140, altoMax = 560].
  // → { canvas, ctx, w, h, dibujar(), fijarDibujo(fn), etiquetar(texto), quitar() }
  const porCanvas = new WeakMap();
  function lienzo(contenedor, o = {}) {
    const cont = typeof contenedor === 'string' ? doc.querySelector(contenedor) : contenedor;
    if (!cont) throw new Error('Graficas.lienzo: no encuentro el contenedor ' + contenedor);
    const canvas = doc.createElement('canvas');
    canvas.className = 'lienzo' + (o.clase ? ' ' + o.clase : '');
    canvas.setAttribute('role', o.rol || 'img');
    if (o.etiqueta) canvas.setAttribute('aria-label', o.etiqueta);
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    if (o.antes) cont.insertBefore(canvas, o.antes); else cont.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const L = { canvas, ctx, w: 0, h: 0, dpr: 1, dibujo: o.dibujar || null };
    porCanvas.set(canvas, L);

    function medir() {
      const ancho = Math.round(canvas.clientWidth || cont.clientWidth || 0);
      if (!ancho) return false;
      let alto;
      if (typeof o.alto === 'function') alto = o.alto(ancho);
      else if (o.aspecto) alto = limitar(ancho / o.aspecto, o.altoMin ?? 140, o.altoMax ?? 560);
      else alto = o.alto ?? 260;
      alto = Math.max(20, Math.round(alto));
      if (canvas.style.height !== alto + 'px') canvas.style.height = alto + 'px';
      const dpr = Math.min(raiz.devicePixelRatio || 1, 3);
      if (ancho !== L.w || alto !== L.h || dpr !== L.dpr) {
        L.w = ancho; L.h = alto; L.dpr = dpr;
        canvas.width = Math.max(1, Math.round(ancho * dpr));
        canvas.height = Math.max(1, Math.round(alto * dpr));
        return true;
      }
      return false;
    }
    L.dibujar = () => {
      if (!L.w) medir();
      if (!L.w || !L.h) return;
      ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
      ctx.clearRect(0, 0, L.w, L.h);
      if (!L.dibujo) return;
      ctx.save();
      try { L.dibujo(ctx, L.w, L.h, colores()); } finally { ctx.restore(); }
    };
    L.fijarDibujo = fn => { L.dibujo = fn; L.dibujar(); };
    L.etiquetar = txt => canvas.setAttribute('aria-label', txt);
    // Vuelve a medir (por ejemplo, si el alto depende del estado de la lección) y redibuja.
    L.ajustar = () => { medir(); L.dibujar(); };
    let pendiente = false;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      // El cambio de alto se hace en el fotograma siguiente: así el observador no entra en bucle.
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; if (medir()) L.dibujar(); });
    }) : null;
    if (ro) ro.observe(cont);
    L.quitar = () => { if (ro) ro.disconnect(); lienzos.delete(L); canvas.remove(); };
    lienzos.add(L);
    medir();
    L.dibujar();
    return L;
  }
  // Medidas CSS de un contexto (sirve también para lienzos que no ha creado Graficas.lienzo).
  function medidas(ctx) {
    const L = porCanvas.get(ctx.canvas);
    if (L) return { w: L.w, h: L.h };
    const t = ctx.getTransform ? ctx.getTransform() : { a: 1 };
    const s = t.a || 1;
    return { w: ctx.canvas.width / s, h: ctx.canvas.height / s };
  }

  // ── Números ────────────────────────────────────────────────────────────────────────────────────────────
  // Formato según el idioma de la página, con signo menos tipográfico:
  //   español: coma decimal y punto de miles (también en cuatro cifras: 3.000);
  //   inglés: punto decimal y coma de miles (3,000).
  function num(x, decimales) {
    if (x == null || !Number.isFinite(+x)) return '—';
    x = +x;
    let d = decimales;
    // Sin decimales pedidos: tres cifras significativas en los números pequeños (0,00227) y pocas en los grandes.
    if (d == null) {
      const a = Math.abs(x);
      d = Number.isInteger(x) ? 0 : a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : Math.min(8, 2 - Math.floor(Math.log10(a)));
    }
    let s = Math.abs(x).toFixed(d);
    if (decimales == null && s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    let [ent, dec] = s.split('.');
    ent = ent.replace(/\B(?=(\d{3})+(?!\d))/g, EN ? ',' : '.');
    const r = dec ? ent + (EN ? '.' : ',') + dec : ent;
    const cero = /^[0.,]*$/.test(r);
    return (x < 0 && !cero ? '−' : '') + r;
  }

  // Marcas «bonitas» (1, 2, 5 × 10ⁿ) entre a y b, unas «cuantas».
  function marcasBonitas(a, b, cuantas = 5) {
    const rango = b - a;
    if (!(rango > 0) || !Number.isFinite(rango)) return Object.assign([a], { paso: 1 });
    const bruto = rango / Math.max(1, cuantas);
    const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const r = bruto / mag;
    const paso = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(a / paso - 1e-9) * paso; v <= b + paso * 1e-9; v += paso) {
      out.push(Math.abs(v) < paso * 1e-9 ? 0 : +v.toPrecision(12));
      if (out.length > 200) break;
    }
    out.paso = paso;
    return out;
  }
  function marcasLog(a, b) {
    const out = [];
    for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
      for (const k of [1, 2, 5]) { const v = k * Math.pow(10, e); if (v >= a * 0.999 && v <= b * 1.001) out.push(v); }
    }
    out.paso = null;
    return out;
  }
  function decimalesPara(marcas) {
    if (!marcas.paso) return v => num(v);
    const d = Math.max(0, -Math.floor(Math.log10(marcas.paso) + 1e-9));
    return v => num(v, Math.min(d, 6));
  }

  // ── Ejes ───────────────────────────────────────────────────────────────────────────────────────────────
  // Graficas.ejes(ctx, { caja | margen, x: [x0, x1], y: [y0, y1], etiquetaX, etiquetaY, marcasX, marcasY,
  //                      formatoX, formatoY, rejilla = true, cero = true, logX, logY, soloEscala, C })
  //   caja: { x, y, w, h } en píxeles; margen: número o { izquierda, derecha, arriba, abajo }.
  //   marcasX / marcasY: lista de valores, número aproximado de marcas o false para ninguna.
  // → esc { x(v), y(v), xi(px), yi(px), caja, C }
  function ejes(ctx, o = {}) {
    const C = o.C || colores();
    const { w: W, h: H } = medidas(ctx);
    let caja = o.caja;
    if (!caja) {
      // Con etiqueta en el eje vertical, se deja sitio arriba para escribirla fuera de la gráfica.
      const d = { izquierda: 44, derecha: 12, arriba: o.etiquetaY ? 24 : 12, abajo: 30 };
      const m = typeof o.margen === 'number' ? { izquierda: o.margen, derecha: o.margen, arriba: o.margen, abajo: o.margen } : Object.assign(d, o.margen || {});
      caja = { x: m.izquierda, y: m.arriba, w: Math.max(10, W - m.izquierda - m.derecha), h: Math.max(10, H - m.arriba - m.abajo) };
    }
    const [x0, x1] = o.x || [0, 1];
    const [y0, y1] = o.y || [-1, 1];
    const fx = o.logX ? v => Math.log10(Math.max(v, 1e-30)) : v => v;
    const fy = o.logY ? v => Math.log10(Math.max(v, 1e-30)) : v => v;
    const ix = o.logX ? u => Math.pow(10, u) : u => u;
    const iy = o.logY ? u => Math.pow(10, u) : u => u;
    const ax0 = fx(x0), ax1 = fx(x1), ay0 = fy(y0), ay1 = fy(y1);
    const esc = {
      caja, C, rango: { x: [x0, x1], y: [y0, y1] },
      x: v => caja.x + (fx(v) - ax0) / (ax1 - ax0 || 1) * caja.w,
      y: v => caja.y + caja.h - (fy(v) - ay0) / (ay1 - ay0 || 1) * caja.h,
      xi: px => ix(ax0 + (px - caja.x) / caja.w * (ax1 - ax0)),
      yi: py => iy(ay0 + (caja.y + caja.h - py) / caja.h * (ay1 - ay0)),
    };
    if (o.soloEscala) return esc;

    const elegir = (m, a, b, cuantas, log) => {
      if (m === false) return Object.assign([], { paso: null });
      if (Array.isArray(m)) return Object.assign(m.slice(), { paso: m.length > 1 ? Math.abs(m[1] - m[0]) : null });
      if (log) return marcasLog(a, b);
      return marcasBonitas(a, b, typeof m === 'number' ? m : cuantas);
    };
    const mx = elegir(o.marcasX, x0, x1, Math.max(2, Math.round(caja.w / 78)), o.logX);
    const my = elegir(o.marcasY, y0, y1, Math.max(2, Math.round(caja.h / 44)), o.logY);
    const fmtX = o.formatoX || decimalesPara(mx);
    const fmtY = o.formatoY || decimalesPara(my);
    const nitido = v => Math.round(v) + 0.5;

    ctx.save();
    ctx.lineWidth = 1;
    if (o.rejilla !== false) {
      ctx.strokeStyle = C.rejilla;
      ctx.beginPath();
      for (const v of mx) { const px = nitido(esc.x(v)); if (px >= caja.x - 0.5 && px <= caja.x + caja.w + 0.5) { ctx.moveTo(px, caja.y); ctx.lineTo(px, caja.y + caja.h); } }
      for (const v of my) { const py = nitido(esc.y(v)); if (py >= caja.y - 0.5 && py <= caja.y + caja.h + 0.5) { ctx.moveTo(caja.x, py); ctx.lineTo(caja.x + caja.w, py); } }
      ctx.stroke();
    }
    ctx.strokeStyle = C.eje;
    ctx.beginPath();
    const cero = o.cero !== false && !o.logY && y0 < 0 && y1 > 0;
    const yEje = nitido(cero ? esc.y(0) : caja.y + caja.h);
    ctx.moveTo(caja.x, yEje); ctx.lineTo(caja.x + caja.w, yEje);
    const xEje = nitido(caja.x);
    ctx.moveTo(xEje, caja.y); ctx.lineTo(xEje, caja.y + caja.h);
    ctx.stroke();

    ctx.fillStyle = C.tenue;
    ctx.font = `400 11px ${FUENTE_MONO}`;
    ctx.textBaseline = 'top';
    for (const v of mx) {
      const px = esc.x(v);
      if (px < caja.x - 1 || px > caja.x + caja.w + 1) continue;
      const t = fmtX(v);
      const ancho = ctx.measureText(t).width;
      ctx.textAlign = 'left';
      ctx.fillText(t, limitar(px - ancho / 2, 1, W - ancho - 1), caja.y + caja.h + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const v of my) {
      const py = esc.y(v);
      if (py < caja.y - 1 || py > caja.y + caja.h + 1) continue;
      ctx.fillText(fmtY(v), caja.x - 6, limitar(py, caja.y + 5, caja.y + caja.h - 5));
    }
    if (o.etiquetaX) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(o.etiquetaX, caja.x + caja.w, Math.min(H - 1, caja.y + caja.h + 30));
    }
    if (o.etiquetaY) {
      if (caja.y >= 18) texto(ctx, Math.max(2, caja.x - 6), caja.y - 8, o.etiquetaY, { color: C.tenue, tam: 11, C });
      else texto(ctx, caja.x + 6, caja.y + 4, o.etiquetaY, { color: C.tenue, tam: 11, base: 'top', fondo: alfa(C.pantalla, 0.82), C });
    }
    ctx.restore();
    return esc;
  }

  // ── Trazos ─────────────────────────────────────────────────────────────────────────────────────────────
  // Camino de una serie (xs puede ser null: entonces x = t0 + i·dt). Si hay muchos puntos por píxel, se
  // dibuja el mínimo y el máximo de cada columna: rápido y sin perder picos.
  function camino(esc, xs, ys, o = {}) {
    const n = xs ? Math.min(xs.length, ys.length) : ys.length;
    const t0 = o.t0 || 0, dt = o.dt || 1;
    const X = xs ? i => xs[i] : i => t0 + i * dt;
    const p = new Path2D();
    if (n < 1) return p;
    const pxA = esc.x(X(0)), pxB = esc.x(X(n - 1));
    const porPixel = n / Math.max(1, Math.abs(pxB - pxA));
    if (porPixel <= 3) {
      let abierto = false;
      for (let i = 0; i < n; i++) {
        const v = ys[i];
        if (v == null || !Number.isFinite(v)) { abierto = false; continue; }
        const px = esc.x(X(i)), py = esc.y(v);
        if (abierto) p.lineTo(px, py); else { p.moveTo(px, py); abierto = true; }
      }
      return p;
    }
    let col = null, mn = 0, mx = 0, primero = true;
    const emitir = () => {
      if (col === null) return;
      const ya = esc.y(mx), yb = esc.y(mn);
      if (primero) { p.moveTo(col + 0.5, ya); primero = false; } else p.lineTo(col + 0.5, ya);
      p.lineTo(col + 0.5, yb + (ya === yb ? 0.01 : 0));
    };
    for (let i = 0; i < n; i++) {
      const v = ys[i];
      if (v == null || !Number.isFinite(v)) continue;
      const c = Math.floor(esc.x(X(i)));
      if (c !== col) { emitir(); col = c; mn = mx = v; } else { if (v < mn) mn = v; if (v > mx) mx = v; }
    }
    emitir();
    return p;
  }
  function recortar(ctx, esc, o) {
    if (o.sinRecorte || !esc.caja) return;
    const c = esc.caja, m = o.holgura ?? 3;
    ctx.beginPath();
    ctx.rect(c.x - m, c.y - m, c.w + 2 * m, c.h + 2 * m);
    ctx.clip();
  }
  // Trazo con halo: en oscuro, dos trazos anchos y translúcidos debajo que se suman a la luz del fondo.
  function trazar(ctx, p, { color, ancho = 2, alfa: a = 1, halo = true, guiones = null, C }) {
    if (halo && C.oscuro) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.setLineDash([]);
      ctx.strokeStyle = alfa(color, 0.07 * a);
      ctx.lineWidth = ancho * 5.5;
      ctx.stroke(p);
      ctx.strokeStyle = alfa(color, 0.16 * a);
      ctx.lineWidth = ancho * 2.6;
      ctx.stroke(p);
      ctx.restore();
    }
    ctx.strokeStyle = typeof color === 'string' && a < 1 ? alfa(color, a) : color;
    ctx.lineWidth = ancho;
    ctx.setLineDash(guiones || []);
    ctx.stroke(p);
    ctx.setLineDash([]);
  }
  // Graficas.linea(ctx, esc, xs, ys, { color, ancho = 2, alfa = 1, halo = true, guiones, t0, dt })
  function linea(ctx, esc, xs, ys, o = {}) {
    const C = o.C || esc.C || colores();
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    recortar(ctx, esc, o);
    trazar(ctx, camino(esc, xs, ys, o), { color: o.color || C.senal, ancho: o.ancho ?? 2, alfa: o.alfa ?? 1, halo: o.halo ?? true, guiones: o.guiones, C });
    ctx.restore();
  }
  // Graficas.curva(ctx, esc, f, { desde, hasta, n = 400, …estilo de linea })
  function curva(ctx, esc, f, o = {}) {
    const a = o.desde ?? esc.rango.x[0], b = o.hasta ?? esc.rango.x[1], n = Math.max(2, o.n ?? 400);
    const xs = new Float64Array(n), ys = new Float64Array(n);
    for (let i = 0; i < n; i++) { const x = a + (b - a) * i / (n - 1); xs[i] = x; ys[i] = f(x); }
    linea(ctx, esc, xs, ys, o);
  }
  // Graficas.puntos(ctx, esc, xs, ys, { color, radio = 3.5, borde })
  function puntos(ctx, esc, xs, ys, o = {}) {
    const C = o.C || esc.C || colores();
    const color = o.color || C.senal, r = o.radio ?? 3.5;
    ctx.save();
    recortar(ctx, esc, { holgura: r + 2, ...o });
    const n = Math.min(xs.length, ys.length);
    if (C.oscuro && o.halo !== false) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = alfa(color, 0.16);
      for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(esc.x(xs[i]), esc.y(ys[i]), r * 2.4, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      if (!Number.isFinite(ys[i])) continue;
      ctx.beginPath(); ctx.arc(esc.x(xs[i]), esc.y(ys[i]), r, 0, TAU); ctx.fill();
      if (o.borde) { ctx.strokeStyle = o.borde; ctx.lineWidth = 1.2; ctx.stroke(); }
    }
    ctx.restore();
  }
  // Graficas.tallos(ctx, esc, xs, ys, { color, radio = 3.5, base = 0 }): muestras, palitos con cabeza.
  function tallos(ctx, esc, xs, ys, o = {}) {
    const C = o.C || esc.C || colores();
    const color = o.color || C.senal, r = o.radio ?? 3.5;
    const y0 = esc.y(o.base ?? 0);
    ctx.save();
    recortar(ctx, esc, { holgura: r + 2, ...o });
    ctx.strokeStyle = alfa(color, o.alfaTallo ?? 0.75);
    ctx.lineWidth = o.ancho ?? 1.5;
    ctx.beginPath();
    const n = Math.min(xs.length, ys.length);
    for (let i = 0; i < n; i++) { if (!Number.isFinite(ys[i])) continue; const px = esc.x(xs[i]); ctx.moveTo(px, y0); ctx.lineTo(px, esc.y(ys[i])); }
    ctx.stroke();
    ctx.restore();
    puntos(ctx, esc, xs, ys, { ...o, color, radio: r, C });
  }
  // Graficas.barras(ctx, esc, xs, ys, { color, ancho (en unidades de x), anchoPx, alfa = 1, base = 0 })
  function barras(ctx, esc, xs, ys, o = {}) {
    const C = o.C || esc.C || colores();
    const n = Math.min(xs.length, ys.length);
    let anchoPx = o.anchoPx;
    if (anchoPx == null) {
      const u = o.ancho ?? (n > 1 ? Math.abs(xs[1] - xs[0]) * 0.8 : 1);
      anchoPx = Math.max(1, Math.abs(esc.x(xs[0] + u) - esc.x(xs[0])));
    }
    const y0 = esc.y(o.base ?? 0);
    ctx.save();
    recortar(ctx, esc, o);
    ctx.fillStyle = alfa(o.color || C.espectro, o.alfa ?? 1);
    for (let i = 0; i < n; i++) {
      if (!Number.isFinite(ys[i])) continue;
      const px = esc.x(xs[i]), py = esc.y(ys[i]);
      ctx.fillRect(px - anchoPx / 2, Math.min(py, y0), anchoPx, Math.abs(y0 - py));
    }
    ctx.restore();
  }
  // Graficas.area(ctx, esc, xs, ys, { colorPos, colorNeg, alfa = .35 }): área con signo respecto a cero.
  function area(ctx, esc, xs, ys, o = {}) {
    const C = o.C || esc.C || colores();
    const n = Math.min(xs.length, ys.length);
    if (n < 2) return;
    const y0 = esc.y(0), c = esc.caja;
    const p = new Path2D();
    p.moveTo(esc.x(xs[0]), y0);
    for (let i = 0; i < n; i++) p.lineTo(esc.x(xs[i]), esc.y(Number.isFinite(ys[i]) ? ys[i] : 0));
    p.lineTo(esc.x(xs[n - 1]), y0);
    p.closePath();
    const a = o.alfa ?? 0.35;
    ctx.save();
    ctx.beginPath(); ctx.rect(c.x, c.y, c.w, Math.max(0, y0 - c.y)); ctx.clip();
    ctx.fillStyle = alfa(o.colorPos || C.senal, a); ctx.fill(p);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(c.x, y0, c.w, Math.max(0, c.y + c.h - y0)); ctx.clip();
    ctx.fillStyle = alfa(o.colorNeg || C.respuesta, a); ctx.fill(p);
    ctx.restore();
  }

  // ── Mapas tiempo-frecuencia ────────────────────────────────────────────────────────────────────────────
  // Escala magma (aproximación polinómica de la de matplotlib), en una tabla de 256 colores.
  const MAGMA = (() => {
    const c = [
      [-0.002136485053939582, -0.000749655052795221, -0.005386127855323933],
      [0.2516605407371642, 0.6775232436837668, 2.494026599312351],
      [8.353717279216625, -3.577719514958484, 0.3144679030132573],
      [-27.66873308576866, 14.26473078096533, -13.64921318813922],
      [52.17613981234068, -27.94360607168351, 12.94416944238394],
      [-50.76852536473588, 29.04658282127291, 4.23415299384598],
      [18.65570506591883, -11.48977351997711, -5.601961508734096],
    ];
    const tabla = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      for (let k = 0; k < 3; k++) {
        let v = c[6][k];
        for (let j = 5; j >= 0; j--) v = v * t + c[j][k];
        tabla[i * 3 + k] = Math.round(limitar(v) * 255);
      }
    }
    return tabla;
  })();
  // Graficas.magma(t) → [r, g, b] con t en [0, 1]
  function magma(t) {
    const i = Math.round(limitar(Number.isFinite(t) ? t : 0) * 255) * 3;
    return [MAGMA[i], MAGMA[i + 1], MAGMA[i + 2]];
  }
  const ESCALAS = { magma };
  const imagenes = new WeakMap();
  // Graficas.mapa(ctx, esc, { datos, nF, nT, t, f, rango: [min, max], escala = 'magma', suave = true })
  //   datos: Float32Array(nF·nT), fila k = frecuencia f[k] (índice k·nT + j). La frecuencia va hacia arriba.
  function mapa(ctx, esc, o) {
    const { datos, nF, nT } = o;
    if (!datos || !nF || !nT) return;
    let [mn, mx] = o.rango || [Infinity, -Infinity];
    if (!o.rango) for (let i = 0; i < datos.length; i++) { const v = datos[i]; if (Number.isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v; } }
    const escala = typeof o.escala === 'function' ? o.escala : ESCALAS[o.escala || 'magma'] || magma;
    const clave = mn + '|' + mx + '|' + (o.escala || 'magma') + '|' + nF + 'x' + nT;
    let guardada = imagenes.get(datos);
    if (!guardada || guardada.clave !== clave) {
      const off = doc.createElement('canvas');
      off.width = nT; off.height = nF;
      const g = off.getContext('2d');
      const img = g.createImageData(nT, nF);
      const d = img.data, rango = (mx - mn) || 1;
      for (let k = 0; k < nF; k++) {
        const fila = nF - 1 - k;
        for (let j = 0; j < nT; j++) {
          const v = datos[k * nT + j];
          const [r, gg, b] = escala(Number.isFinite(v) ? (v - mn) / rango : 0);
          const idx = (fila * nT + j) * 4;
          d[idx] = r; d[idx + 1] = gg; d[idx + 2] = b; d[idx + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
      guardada = { clave, off };
      imagenes.set(datos, guardada);
    }
    const t = o.t, f = o.f;
    const dt = t && t.length > 1 ? (t[t.length - 1] - t[0]) / (t.length - 1) : 1;
    const df = f && f.length > 1 ? (f[f.length - 1] - f[0]) / (f.length - 1) : 1;
    const tA = t ? t[0] - dt / 2 : 0, tB = t ? t[t.length - 1] + dt / 2 : nT;
    const fA = f ? f[0] - df / 2 : 0, fB = f ? f[f.length - 1] + df / 2 : nF;
    const xA = esc.x(tA), xB = esc.x(tB), yA = esc.y(fB), yB = esc.y(fA);
    ctx.save();
    recortar(ctx, esc, { holgura: 0 });
    ctx.imageSmoothingEnabled = o.suave !== false;
    ctx.drawImage(guardada.off, xA, yA, xB - xA, yB - yA);
    ctx.restore();
  }
  // Graficas.leyenda(ctx, { x, y, ancho = 10, alto = 120, rango: [min, max], etiqueta = 'dB', marcas, escala, C })
  //   Barra de color vertical con sus marcas a la derecha; la etiqueta, encima.
  function leyenda(ctx, o) {
    const C = o.C || colores();
    const { x, y } = o, ancho = o.ancho ?? 10, alto = o.alto ?? 120;
    const [mn, mx] = o.rango || [0, 1];
    const escala = typeof o.escala === 'function' ? o.escala : ESCALAS[o.escala || 'magma'] || magma;
    ctx.save();
    for (let i = 0; i < alto; i++) {
      const [r, g, b] = escala(1 - i / Math.max(1, alto - 1));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y + i, ancho, 1.2);
    }
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, ancho - 1, alto - 1);
    const marcas = o.marcas || marcasBonitas(mn, mx, Math.max(2, Math.round(alto / 32)));
    const fmt = o.formato || decimalesPara(marcas);
    ctx.fillStyle = C.tenue;
    ctx.font = `400 10px ${FUENTE_MONO}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    for (const v of marcas) {
      const py = y + (1 - (v - mn) / ((mx - mn) || 1)) * alto;
      if (py < y - 0.5 || py > y + alto + 0.5) continue;
      ctx.fillRect(x + ancho, Math.round(py), 3, 1);
      ctx.fillText(fmt(v), x + ancho + 5, py);
    }
    if (o.etiqueta !== false) {
      ctx.textBaseline = 'bottom';
      ctx.fillText(o.etiqueta ?? 'dB', x, y - 4);
    }
    ctx.restore();
  }

  // ── Texto y flechas ────────────────────────────────────────────────────────────────────────────────────
  // Graficas.texto(ctx, x, y, txt, { color, tam = 12, alinear = 'left', base = 'alphabetic', mono = true, peso = 400,
  //                                  fondo, espaciado, cursiva })
  function texto(ctx, x, y, txt, o = {}) {
    if (txt == null || txt === '') return 0;
    const C = o.C || colores();
    ctx.save();
    ctx.font = `${o.cursiva ? 'italic ' : ''}${o.peso || 400} ${o.tam || 12}px ${o.mono === false ? FUENTE_TEXTO : FUENTE_MONO}`;
    ctx.textAlign = o.alinear || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.espaciado != null && 'letterSpacing' in ctx) ctx.letterSpacing = o.espaciado + 'px';
    const ancho = ctx.measureText(String(txt)).width;
    if (o.fondo) {
      const tam = o.tam || 12, pad = 3;
      const al = ctx.textAlign;
      const xi = al === 'center' ? x - ancho / 2 : al === 'right' || al === 'end' ? x - ancho : x;
      const b = ctx.textBaseline;
      const yi = b === 'top' ? y : b === 'middle' ? y - tam * 0.6 : b === 'bottom' ? y - tam * 1.2 : y - tam * 0.95;
      ctx.fillStyle = o.fondo;
      ctx.fillRect(xi - pad, yi - pad + 1, ancho + 2 * pad, tam * 1.2 + 2 * pad - 2);
    }
    ctx.fillStyle = o.color || C.texto;
    ctx.fillText(String(txt), x, y);
    ctx.restore();
    return ancho;
  }
  // Graficas.flecha(ctx, x0, y0, x1, y1, { color, ancho = 1.5, punta = 8, guiones })
  function flecha(ctx, x0, y0, x1, y1, o = {}) {
    const C = o.C || colores();
    const color = o.color || C.texto, ancho = o.ancho ?? 1.5, punta = o.punta ?? 8;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round';
    if (o.guiones) ctx.setLineDash(o.guiones);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(ang) * punta * 0.6, y1 - Math.sin(ang) * punta * 0.6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - punta * Math.cos(ang - 0.42), y1 - punta * Math.sin(ang - 0.42));
    ctx.lineTo(x1 - punta * Math.cos(ang + 0.42), y1 - punta * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Cuadrícula de puntos de cuaderno, para fondos de escenas sin ejes.
  function cuadricula(ctx, w, h, o = {}) {
    const C = o.C || colores(), paso = o.paso ?? 24;
    ctx.save();
    ctx.fillStyle = alfa(C.eje, o.alfa ?? (C.oscuro ? 0.35 : 0.28));
    for (let y = paso / 2; y < h; y += paso) for (let x = paso / 2; x < w; x += paso) ctx.fillRect(Math.round(x), Math.round(y), 1.2, 1.2);
    ctx.restore();
  }

  // ── La noria de la serie ───────────────────────────────────────────────────────────────────────────────
  // Graficas.noria(ctx, { cx, cy, r, angulo, cabinas: [{ desfase, color }], radios = 8, C,
  //                       yaw = 0.32, colgar, patas = true, neutras = true, alfa = 1, vueltaDots = true })
  //   El ángulo se mide desde las tres en punto y crece en sentido antihorario: la cabina con desfase 0 está en
  //   el ángulo «angulo» y su altura sobre el centro es r·sen(angulo). Las cabinas cuelgan siempre hacia abajo,
  //   como en una noria de feria: lo que gira es la rueda. «colgar» es lo que cuelga cada cabina bajo el aro (px).
  // → { cabinas: [{ x, y, xa, ya, u }], cubo: { x, y }, r, colgar }   (x, y: centro de la cabina; xa, ya: enganche)
  function noria(ctx, o) {
    const C = o.C || colores();
    const { cx, cy } = o;
    const r = Math.max(4, o.r);
    const ang = o.angulo || 0;
    const n = Math.max(3, o.radios ?? 8);
    const yaw = o.yaw ?? 0.32;
    const sx = Math.cos(yaw);
    const prof = Math.max(2, r * 0.13 * Math.sin(yaw));
    const colgar = o.colgar ?? r * 0.14;
    const cuerpo = C.cuerpo;
    const oscuro = C.oscuro;
    const P = (rr, u, dx = 0) => [cx + dx + rr * Math.cos(u) * sx, cy - rr * Math.sin(u)];
    const punto = Math.max(1.3, Math.min(2.2, r * 0.016));
    ctx.save();
    ctx.globalAlpha = o.alfa ?? 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Patas en A y suelo: no giran.
    if (o.patas !== false) {
      const suelo = cy + r * 1.27;
      ctx.strokeStyle = alfa(cuerpo, oscuro ? 0.3 : 0.32);
      ctx.lineWidth = Math.max(1.2, r * 0.02);
      ctx.beginPath();
      for (const s of [-1, 1]) {
        ctx.moveTo(cx + prof * 0.6, cy); ctx.lineTo(cx + prof * 0.6 + s * r * 0.62 * sx, suelo);
        ctx.moveTo(cx - prof * 0.4, cy); ctx.lineTo(cx - prof * 0.4 + s * r * 0.58 * sx, suelo);
      }
      ctx.stroke();
      ctx.strokeStyle = alfa(cuerpo, oscuro ? 0.22 : 0.25);
      ctx.lineWidth = punto;
      ctx.setLineDash([0, punto * 2.2]);
      ctx.beginPath(); ctx.moveTo(cx - r * 1.05 * sx, suelo); ctx.lineTo(cx + r * 1.05 * sx, suelo); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Aro de detrás, más tenue y desplazado: da profundidad.
    const aro = (rr, dx, a, ancho, puntos) => {
      ctx.strokeStyle = alfa(cuerpo, a);
      ctx.lineWidth = ancho;
      ctx.setLineDash(puntos ? [0, puntos] : []);
      ctx.beginPath();
      // El patrón de puntos empieza en la cabina 0 y gira con la rueda.
      ctx.ellipse(cx + dx, cy, rr * sx, rr, 0, -ang, -ang - TAU, true);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    aro(r, prof, oscuro ? 0.16 : 0.14, 1, 0);
    aro(r * 0.88, prof, oscuro ? 0.1 : 0.09, 1, 0);

    // Celosía en zigzag entre las dos llantas de delante: la noria es una estructura, no un aro.
    const zig = n * 4;
    ctx.strokeStyle = alfa(cuerpo, oscuro ? 0.2 : 0.18);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (let s = 0; s <= zig; s++) {
      const u = ang + TAU * s / zig;
      const [px, py] = P(s % 2 ? r * 0.88 : r, u);
      if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Radios: del cubo a la llanta interior, entre cabina y cabina.
    ctx.strokeStyle = alfa(cuerpo, oscuro ? 0.3 : 0.3);
    ctx.lineWidth = Math.max(0.9, r * 0.009);
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const u = ang + TAU * k / n + Math.PI / n;
      const [ax, ay] = P(r * 0.07, u), [bx, by] = P(r * 0.88, u);
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
    }
    ctx.stroke();
    // Llantas de delante: un trazo fino y encima una fila de partículas, como en los vídeos.
    aro(r * 0.88, 0, oscuro ? 0.22 : 0.22, 0.9, 0);
    aro(r, 0, oscuro ? 0.3 : 0.32, 1, 0);
    if (o.vueltaDots !== false) {
      aro(r, 0, oscuro ? 0.7 : 0.62, punto, punto * 2.3);
      aro(r * 0.88, 0, oscuro ? 0.38 : 0.34, punto * 0.8, punto * 2.9);
    }
    // Luz de borde: donde la rueda se ve de canto (a izquierda y derecha) brilla en el color del borde.
    ctx.strokeStyle = alfa(C.borde, oscuro ? 0.5 : 0.35);
    ctx.lineWidth = Math.max(1.2, r * 0.014);
    for (const centro of [0, Math.PI]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * sx, r, 0, -centro - 0.42, -centro + 0.42);
      ctx.stroke();
    }
    // Cubo
    ctx.fillStyle = alfa(cuerpo, oscuro ? 0.75 : 0.7);
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(2.5, r * 0.055), 0, TAU); ctx.fill();
    ctx.fillStyle = C.pantalla;
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, r * 0.022), 0, TAU); ctx.fill();

    // Cabinas
    const cw = Math.max(8, r * 0.19) * Math.max(0.75, sx), ch = Math.max(6, r * 0.14);
    const destacadas = (o.cabinas || [{ desfase: 0 }]).map(c => ({ ...c, u: ang + (c.desfase || 0) }));
    const capsula = (x, y) => {
      const rr = Math.min(ch / 2, cw / 2);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - cw / 2, y - ch / 2, cw, ch, rr);
      else ctx.rect(x - cw / 2, y - ch / 2, cw, ch);
    };
    if (o.neutras !== false) {
      ctx.strokeStyle = alfa(cuerpo, oscuro ? 0.42 : 0.42);
      ctx.fillStyle = alfa(cuerpo, oscuro ? 0.08 : 0.06);
      ctx.lineWidth = 1;
      for (let k = 0; k < n; k++) {
        const u = ang + TAU * k / n;
        if (destacadas.some(d => Math.abs(Math.atan2(Math.sin(u - d.u), Math.cos(u - d.u))) < 0.12)) continue;
        const [xa, ya] = P(r, u);
        ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, ya + colgar - ch / 2); ctx.stroke();
        capsula(xa, ya + colgar); ctx.fill(); ctx.stroke();
      }
    }
    const salida = [];
    for (const d of destacadas) {
      const color = d.color || C.senal;
      const [xa, ya] = P(r, d.u);
      const x = xa, y = ya + colgar;
      if (oscuro && d.brillo !== false) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(x, y, 0, x, y, cw * 1.9);
        g.addColorStop(0, alfa(color, 0.55));
        g.addColorStop(0.4, alfa(color, 0.18));
        g.addColorStop(1, alfa(color, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, cw * 1.9, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, y - ch / 2); ctx.stroke();
      capsula(x, y);
      ctx.fillStyle = color;
      ctx.fill();
      if (oscuro) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; capsula(x, y - ch * 0.12); ctx.save(); ctx.clip(); ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch * 0.3); ctx.restore(); }
      else { ctx.strokeStyle = alfa(cuerpo, 0.55); ctx.lineWidth = 1; ctx.stroke(); }
      salida.push({ x, y, xa, ya, u: d.u, color });
    }
    ctx.restore();
    return { cabinas: salida, cubo: { x: cx, y: cy }, r, colgar };
  }

  // El muelle: un soporte arriba, una hélice vista de lado y una masa que brilla.
  // Graficas.muelle(ctx, { x, arriba, y, ancho = 16, espiras = 10, radioMasa = 12, grosor = 1, color, C, alfa = 1 })
  //   y: altura del centro de la masa; grosor multiplica el alambre (un muelle más duro, más grueso). → { x, y }
  function muelle(ctx, o) {
    const C = o.C || colores();
    const { x, arriba, y } = o;
    const ancho = o.ancho ?? 16, espiras = o.espiras ?? 10, rm = o.radioMasa ?? 12, grosor = o.grosor ?? 1;
    const color = o.color || C.respuesta;
    const cuerpo = C.cuerpo;
    ctx.save();
    ctx.globalAlpha = o.alfa ?? 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Soporte con rayado
    ctx.strokeStyle = alfa(cuerpo, 0.55);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - ancho * 1.5, arriba); ctx.lineTo(x + ancho * 1.5, arriba); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = alfa(cuerpo, 0.3);
    ctx.beginPath();
    for (let i = -3; i <= 3; i++) { const px = x + i * ancho * 0.45; ctx.moveTo(px, arriba); ctx.lineTo(px + 5, arriba - 5); }
    ctx.stroke();
    // Hélice: espiras de delante más marcadas que las de detrás
    const y0 = arriba + 6, y1 = y - rm - 3, largo = Math.max(10, y1 - y0);
    ctx.beginPath(); ctx.moveTo(x, arriba); ctx.lineTo(x, y0); ctx.stroke();
    const pasos = espiras * 24;
    let prev = null;
    for (let i = 0; i <= pasos; i++) {
      const w = i / pasos, u = w * espiras * TAU;
      const px = x + (ancho / 2) * Math.sin(u), py = y0 + largo * w;
      const delante = Math.cos(u) > 0;
      if (prev) {
        ctx.strokeStyle = alfa(cuerpo, delante ? 0.8 : 0.3);
        ctx.lineWidth = (delante ? 1.5 : 1) * grosor;
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(px, py); ctx.stroke();
      }
      prev = [px, py];
    }
    ctx.strokeStyle = alfa(cuerpo, 0.8);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y - rm); ctx.stroke();
    // Masa
    if (C.oscuro) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, rm * 2.4);
      g.addColorStop(0, alfa(color, 0.5)); g.addColorStop(0.45, alfa(color, 0.14)); g.addColorStop(1, alfa(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rm * 2.4, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, rm, 0, TAU); ctx.fill();
    if (!C.oscuro) { ctx.strokeStyle = alfa(cuerpo, 0.5); ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
    return { x, y };
  }

  // ── Historia: lo que va apuntando una cabina (o varias) ───────────────────────────────────────────────
  // Graficas.historia({ segundos = 2, canales = 1 }) → { anotar(t, ...valores), llenar(tAhora, fn, paso),
  //   puntos(canal) → [[edad, valor], …] de lo más reciente a lo más antiguo, vaciar(), ultimo(canal) }
  //   anotar se llama en cada fotograma con el tiempo de la animación; llenar(tAhora, tp => [v0, v1]) rellena los
  //   últimos «segundos» como si la cabina llevara ese rato girando así (sirve para el primer fotograma y para
  //   recalcular la traza en pausa).
  function historia(o = {}) {
    const segundos = o.segundos ?? 2, canales = o.canales ?? 1, max = o.max ?? 4096;
    const T = new Float64Array(max);
    const V = Array.from({ length: canales }, () => new Float64Array(max));
    let inicio = 0, n = 0;
    const H = {
      segundos, canales,
      get n() { return n; },
      get tAhora() { return n ? T[(inicio + n - 1) % max] : 0; },
      anotar(t, ...vals) {
        if (n && t < T[(inicio + n - 1) % max]) H.vaciar();
        if (n === max) { inicio = (inicio + 1) % max; n--; }
        const i = (inicio + n) % max;
        T[i] = t;
        for (let c = 0; c < canales; c++) V[c][i] = vals[c] ?? NaN;
        n++;
        const limite = t - segundos * 1.08;
        while (n > 2 && T[(inicio + 1) % max] < limite) { inicio = (inicio + 1) % max; n--; }
      },
      llenar(tAhora, fn, paso = 1 / 120) {
        H.vaciar();
        const desde = tAhora - segundos * 1.05;
        for (let tp = desde; tp < tAhora; tp += paso) { const v = fn(tp); H.anotar(tp, ...(Array.isArray(v) ? v : [v])); }
        const v = fn(tAhora);
        H.anotar(tAhora, ...(Array.isArray(v) ? v : [v]));
      },
      vaciar() { inicio = 0; n = 0; },
      ultimo(canal = 0) { return n ? V[canal][(inicio + n - 1) % max] : NaN; },
      puntos(canal = 0) {
        const out = [];
        if (!n) return out;
        const ahora = T[(inicio + n - 1) % max];
        for (let k = n - 1; k >= 0; k--) { const i = (inicio + k) % max; out.push([ahora - T[i], V[canal][i]]); }
        return out;
      },
    };
    return H;
  }

  // Traza que se enfría: la punta, recién escrita, en su color; lo ya escrito se apaga hacia el color del cuerpo.
  function trazaEnfriada(ctx, pts, o) {
    const { C, x0, xMax, escX, escY } = o;
    if (!pts || pts.length < 2) return;
    const color = o.color || C.senal, ancho = o.ancho ?? 2.2;
    const p = new Path2D();
    let abierto = false;
    for (const [edad, v] of pts) {
      if (v == null || !Number.isFinite(v)) { abierto = false; continue; }
      const px = escX(edad);
      if (px > xMax + 2) break;
      const py = escY(v);
      if (abierto) p.lineTo(px, py); else { p.moveTo(px, py); abierto = true; }
    }
    const enfriar = o.enfriar !== false;
    const grad = (a) => {
      if (!enfriar) return alfa(color, a);
      const g = ctx.createLinearGradient(x0, 0, xMax, 0);
      g.addColorStop(0, alfa(color, a));
      g.addColorStop(0.16, alfa(color, a));
      g.addColorStop(0.62, mezclar(color, C.cuerpo, 0.55, a * 0.8));
      g.addColorStop(1, mezclar(color, C.cuerpo, 0.78, a * 0.5));
      return g;
    };
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.rect(x0 - 2, -1e4, xMax - x0 + 4, 2e4); ctx.clip();
    if (C.oscuro && o.halo !== false) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = grad(0.08); ctx.lineWidth = ancho * 5.5; ctx.stroke(p);
      ctx.strokeStyle = grad(0.17); ctx.lineWidth = ancho * 2.5; ctx.stroke(p);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.strokeStyle = grad(o.alfa ?? 1);
    ctx.lineWidth = ancho;
    if (o.guiones) ctx.setLineDash(o.guiones);
    ctx.stroke(p);
    ctx.restore();
  }

  // ── La escena de la lección 1: la noria que dibuja la onda ──────────────────────────────────────────────
  // Graficas.escenaNoria(ctx, w, h, { C, angulo, radio = 1, cabinas, trazas, segundos = 2, rotulos = true,
  //                                   proyeccion = true, parteNoria (0,42; 0,48 en lienzos estrechos), radios = 8,
  //                                   yaw, anillo })
  //   Para el alto del lienzo, Graficas.altoNoria(w): el justo para el ancho, sin huecos.
  //   La noria a la izquierda y, a su derecha, lo que ha apuntado la cabina: lo reciente junto a la noria y lo
  //   antiguo a la derecha, rotulado «ahora» y «hace N s» (la excepción a «el tiempo va hacia la derecha»).
  //   radio: tamaño de la noria respecto al máximo (0–1). Las alturas de las trazas van en esas mismas unidades:
  //   una cabina en lo más alto de una noria de radio 0,6 apunta 0,6.
  //   trazas: [{ puntos: [[edad, v], …] | f: edad => v, color, ancho, guiones, alfa, enfriar = true, halo = true }]
  //   anillo: { r (en unidades del máximo), color, guiones }: un aro de referencia (p. ej., una noria objetivo).
  // → { cx, cy, Rmax, r, medio, x0, xMax, escX(edad), escY(v), cabinas, colgar, sx }
  // Alto recomendado para un lienzo con escenaNoria: el justo para que la noria llene el alto que le deja el ancho.
  // Graficas.altoNoria(w, { min = 150, max = 330, parteNoria, rotulos, yaw }) → píxeles CSS
  const IZQ = 1.16;   // sitio a la izquierda del eje de la noria, en radios: patas y arcos dibujados alrededor
  function altoNoria(w, o = {}) {
    const parte = o.parteNoria ?? (w < 520 ? 0.48 : 0.42);
    const sx = Math.cos(o.yaw ?? 0.32);
    const R = (w * parte - 18) / ((IZQ + 1) * sx);
    const pie = o.rotulos === false ? 4 : 22;
    return Math.round(limitar(2.3 * R + 20 + pie - 14, o.min ?? 150, o.max ?? 330));
  }
  function escenaNoria(ctx, w, h, o = {}) {
    const C = o.C || colores();
    const segundos = o.segundos ?? 2;
    const m = 10;
    const yaw = o.yaw ?? 0.32, sx = Math.cos(yaw);
    const pie = o.rotulos === false ? 4 : 22;
    const Rh = (h - 2 * m - pie + 14) / 2.3;
    const Rw = (w * (o.parteNoria ?? (w < 520 ? 0.48 : 0.42)) - m - 8) / ((IZQ + 1) * sx);
    const Rmax = Math.max(16, Math.min(Rh, Rw, o.radioMax ?? 1e9));
    const radio = limitar(o.radio ?? 1, 0.05, 1);
    const cx = m + Rmax * IZQ * sx + 2;
    const cy = m + Rmax + 4;
    const colgar = Rmax * 0.13;
    const medio = cy + colgar;
    const x0 = cx + Rmax * sx + 20;
    const xMax = w - m;
    const escY = v => medio - v * Rmax;
    const escX = edad => x0 + (edad / segundos) * (xMax - x0);

    // Eje del tiempo: la línea de reposo de la cabina y sus rótulos.
    ctx.save();
    ctx.strokeStyle = alfa(C.eje, 0.55);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(x0, Math.round(medio) + 0.5); ctx.lineTo(xMax, Math.round(medio) + 0.5); ctx.stroke();
    ctx.setLineDash([]);
    if (o.rotulos !== false) {
      const yr = Math.min(h - 6, medio + Rmax + 16);
      ctx.strokeStyle = alfa(C.eje, 0.8);
      ctx.beginPath();
      const marcas = segundos <= 4 ? segundos * 2 : segundos;
      for (let i = 0; i <= marcas; i++) {
        const px = Math.round(x0 + (xMax - x0) * i / marcas) + 0.5;
        const largo = i % (segundos <= 4 ? 2 : 1) === 0 ? 5 : 3;
        ctx.moveTo(px, yr - 13); ctx.lineTo(px, yr - 13 + largo);
      }
      ctx.moveTo(x0, Math.round(yr - 13) + 0.5); ctx.lineTo(xMax, Math.round(yr - 13) + 0.5);
      ctx.stroke();
      texto(ctx, x0, yr, EN ? 'now' : 'ahora', { color: C.tenue, tam: 11, alinear: 'left', base: 'alphabetic', C });
      texto(ctx, xMax, yr, (EN ? num(segundos) + ' s ago' : 'hace ' + num(segundos) + ' s'), { color: C.tenue, tam: 11, alinear: 'right', C });
    }
    ctx.restore();

    if (o.anillo) {
      const an = o.anillo;
      ctx.save();
      ctx.strokeStyle = alfa(an.color || C.respuesta, 0.75);
      ctx.lineWidth = 1.3;
      ctx.setLineDash(an.guiones || [4, 4]);
      ctx.beginPath(); ctx.ellipse(cx, cy, an.r * Rmax * sx, an.r * Rmax, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const info = noria(ctx, { C, cx, cy, r: Rmax * radio, angulo: o.angulo || 0, cabinas: o.cabinas, radios: o.radios ?? 8, yaw, colgar });
    // Cabina sobre el aro de referencia (por ejemplo, la de una onda objetivo): cuelga igual que las de la noria.
    if (o.anillo && o.anillo.angulo != null) {
      const an = o.anillo, color = an.color || C.respuesta, rr = an.r * Rmax;
      const xa = cx + rr * Math.cos(an.angulo) * sx, ya = cy - rr * Math.sin(an.angulo);
      const cw = Math.max(8, Rmax * 0.19) * Math.max(0.75, sx), ch = Math.max(6, Rmax * 0.14), y = ya + colgar;
      ctx.save();
      if (C.oscuro) {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(xa, y, 0, xa, y, cw * 1.7);
        g.addColorStop(0, alfa(color, 0.45)); g.addColorStop(1, alfa(color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xa, y, cw * 1.7, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = color; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, y - ch / 2); ctx.stroke();
      ctx.setLineDash([3, 2]);
      ctx.fillStyle = alfa(color, C.oscuro ? 0.3 : 0.18);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(xa - cw / 2, y - ch / 2, cw, ch, Math.min(cw, ch) / 2); else ctx.rect(xa - cw / 2, y - ch / 2, cw, ch);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      info.cabinas.unshift({ x: xa, y, xa, ya, u: an.angulo, color, objetivo: true });
    }

    for (const tr of o.trazas || []) {
      let pts = tr.puntos;
      if (!pts && tr.f) {
        const n = Math.max(60, Math.round((xMax - x0) / 1.5));
        pts = [];
        for (let i = 0; i <= n; i++) { const edad = segundos * i / n; pts.push([edad, tr.f(edad)]); }
      }
      trazaEnfriada(ctx, pts, { ...tr, C, x0, xMax, escX, escY });
    }
    if (o.proyeccion !== false) {
      for (const c of info.cabinas) {
        ctx.save();
        ctx.strokeStyle = alfa(c.color, 0.55);
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(c.x + 8, c.y); ctx.lineTo(x0 - 6, c.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x0, c.y, 4.5, 0, TAU); ctx.stroke();
        ctx.restore();
      }
    }
    return { cx, cy, Rmax, r: Rmax * radio, medio, x0, xMax, escX, escY, cabinas: info.cabinas, colgar, sx, segundos };
  }

  const Graficas = {
    TAU, colores, alfa, mezclar, luminancia, rgba, alCambiarTema, redibujarTodo,
    lienzo, medidas, num, marcasBonitas,
    ejes, linea, curva, puntos, tallos, barras, area,
    mapa, leyenda, magma, texto, flecha, cuadricula,
    noria, muelle, historia, escenaNoria, altoNoria, trazaEnfriada,
    FUENTE_MONO, FUENTE_TEXTO, idioma,
  };
  if (typeof module === 'object' && module.exports) module.exports = Graficas;
  else raiz.Graficas = Graficas;
})(typeof self !== 'undefined' ? self : this);
