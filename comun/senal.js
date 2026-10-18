// Senal: biblioteca de procesamiento de señales del curso «Señales, de 0 a experto» (Ena en Curso).
// Script clásico y sin dependencias: en el navegador define la global Senal; en Node, module.exports.
// Convenios (detalle y ejemplos en SENAL.md):
//   - señales en Float64Array; fs en Hz, tiempos en s y frecuencias en Hz;
//   - complejos como { re, im }, con dos arrays;
//   - mapas tiempo-frecuencia (TF): { t, f, nT, nF, re, im }, con re e im en Float32Array(nF * nT) y
//     el índice k * nT + j (fila k = frecuencia, columna j = tiempo).
(function (raiz) {
  'use strict';
  const Senal = {};
  const PI = Math.PI, DOS_PI = 2 * Math.PI, SUELO_DB = -300;
  const f64 = n => new Float64Array(n);
  const f32 = n => new Float32Array(n);
  const esPot2 = n => n > 0 && (n & (n - 1)) === 0;
  const limitarA = (v, a, b) => (v < a ? a : v > b ? b : v);
  const muestras = (fs, dur) => Math.max(0, Math.round(dur * fs));
  function fallo(msg) { throw new Error('Senal: ' + msg); }
  function sinc(x) { if (Math.abs(x) < 1e-12) return 1; const p = PI * x; return Math.sin(p) / p; }

  // ═══════════════════════════════════════════════════════════ Azar y señales básicas

  // Generador pseudoaleatorio con semilla (mulberry32): misma semilla (número o texto), misma secuencia.
  // → { real(a, b) en [a, b) (sin argumentos, en [0, 1)), normal(media, desv), entero(a, b) con los dos
  //     extremos incluidos, elegir(lista), barajar(lista) → copia barajada }.
  Senal.azar = function (semilla = 1) {
    let s;
    if (typeof semilla === 'number') s = Math.floor(semilla) >>> 0;
    else { s = 2166136261; for (const c of String(semilla)) s = Math.imul(s ^ c.codePointAt(0), 16777619); s >>>= 0; }
    let reserva = null;
    function u() {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      real(a, b) { const v = u(); return a === undefined ? v : b === undefined ? v * a : a + (b - a) * v; },
      normal(media = 0, desv = 1) {
        let z;
        if (reserva !== null) { z = reserva; reserva = null; } else {
          const r = Math.sqrt(-2 * Math.log(1 - u())), a = DOS_PI * u();
          z = r * Math.cos(a); reserva = r * Math.sin(a);
        }
        return media + desv * z;
      },
      entero(a, b) { return a + Math.floor(u() * (b - a + 1)); },
      elegir(l) { return l[Math.floor(u() * l.length)]; },
      barajar(l) {
        const c = Array.from(l);
        for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)), t = c[i]; c[i] = c[j]; c[j] = t; }
        return c;
      },
    };
  };
  // Acepta un generador de Senal.azar, una semilla o nada (semilla por defecto).
  function comoAzar(azar, def) { return azar && typeof azar.normal === 'function' ? azar : Senal.azar(azar === undefined ? def : azar); }

  // Instantes de muestreo i/fs (s), con n = round(dur·fs).
  Senal.tiempo = function (fs, dur) { const n = muestras(fs, dur), t = f64(n); for (let i = 0; i < n; i++) t[i] = i / fs; return t; };
  function onda(fn, { f = 1, fs = 8000, dur = 1, amp = 1, fase = 0 } = {}) {
    const n = muestras(fs, dur), x = f64(n), w = DOS_PI * f / fs;
    for (let i = 0; i < n; i++) x[i] = amp * fn(w * i + fase);
    return x;
  }
  // Seno amp·sin(2π·f·t + fase): f en Hz, fs en Hz, dur en s, fase en rad. → Float64Array.
  Senal.seno = o => onda(Math.sin, o);
  // Coseno amp·cos(2π·f·t + fase). → Float64Array.
  Senal.coseno = o => onda(Math.cos, o);

  // Suma muestra a muestra (la más corta se completa con ceros). Acepta varias señales o una lista de señales.
  Senal.suma = function (...xs) {
    if (xs.length === 1 && xs[0] && xs[0].length && typeof xs[0][0] === 'object') xs = Array.from(xs[0]);
    let n = 0; for (const x of xs) n = Math.max(n, x.length);
    const y = f64(n);
    for (const x of xs) for (let i = 0; i < x.length; i++) y[i] += x[i];
    return y;
  };
  // Multiplica por k. → copia.
  Senal.escalar = function (x, k) { const y = f64(x.length); for (let i = 0; i < x.length; i++) y[i] = x[i] * k; return y; };
  // Valor absoluto máximo.
  Senal.pico = function (x) { let m = 0; for (let i = 0; i < x.length; i++) { const v = Math.abs(x[i]); if (v > m) m = v; } return m; };
  // Raíz del valor cuadrático medio.
  Senal.rms = function (x) { if (!x.length) return 0; let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / x.length); };
  // Escala para que el pico valga «pico». Una señal nula se queda nula. → copia.
  Senal.normalizar = function (x, pico = 1) { const m = Senal.pico(x); return Senal.escalar(x, m > 0 ? pico / m : 0); };
  // Recorta la amplitud a ±limite (saturación). → copia.
  Senal.limitar = function (x, limite = 1) { const y = f64(x.length); for (let i = 0; i < x.length; i++) y[i] = limitarA(x[i], -limite, limite); return y; };
  // Media (valor de continua).
  Senal.media = function (x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i]; return x.length ? s / x.length : 0; };
  // Correlación de Pearson entre dos señales (−1 … 1), sobre la longitud común.
  Senal.correlacionPearson = function (a, b) {
    const n = Math.min(a.length, b.length); let ma = 0, mb = 0;
    for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n; let sab = 0, saa = 0, sbb = 0;
    for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
    return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0;
  };
  // Relación señal-ruido en dB de una estimación frente a la señal limpia: 10·log10(Σ limpia² / Σ (estimada − limpia)²).
  Senal.snr = function (limpia, estimada) {
    const n = Math.min(limpia.length, estimada.length); let s = 0, e = 0;
    for (let i = 0; i < n; i++) { s += limpia[i] * limpia[i]; const d = estimada[i] - limpia[i]; e += d * d; }
    return e > 0 ? 10 * Math.log10(s / e) : Infinity;
  };

  function vectorizar(v, fn) {
    if (typeof v === 'number') return fn(v);
    const y = v instanceof Float32Array ? f32(v.length) : f64(v.length);
    for (let i = 0; i < v.length; i++) y[i] = fn(v[i]);
    return y;
  }
  const dbDe = (r, k) => (r > 0 ? Math.max(SUELO_DB, k * Math.log10(r)) : SUELO_DB);
  // Amplitud → dB: 20·log10(|v| / ref). El cero da −300 dB. Acepta un número o un array.
  Senal.aDb = (v, ref = 1) => vectorizar(v, a => dbDe(Math.abs(a) / ref, 20));
  // Potencia → dB: 10·log10(p / ref). Acepta un número o un array.
  Senal.potenciaADb = (p, ref = 1) => vectorizar(p, a => dbDe(Math.abs(a) / ref, 10));
  // dB → amplitud: 10^(dB/20).
  Senal.deDb = db => vectorizar(db, d => Math.pow(10, d / 20));

  // ═══════════════════════════════════════════════════════════ Muestreo, cuantización y armónicos

  // Frecuencia aparente (Hz) de un tono de f Hz muestreado a fs Hz: siempre en [0, fs/2].
  Senal.alias = function (f, fs) { let r = Math.abs(f) % fs; if (r > fs / 2) r = fs - r; return r; };
  // Frecuencia aparente con signo, en (−fs/2, fs/2]: f − fs·round(f/fs). El signo es el sentido de giro aparente
  // (negativo: la rueda o la noria parece girar hacia atrás). Su valor absoluto es Senal.alias(f, fs).
  Senal.aliasConSigno = function (f, fs) {
    let r = f - fs * Math.round(f / fs);
    if (r <= -fs / 2) r += fs; else if (r > fs / 2) r -= fs;
    return r;
  };

  // Cuantiza con 2^bits escalones en [−rango, rango]. Por defecto, escalones simétricos (sin el cero:
  // con 1 bit, ±rango/2); con { modo: 'pcm' }, como un conversor real (el cero existe y el escalón más alto
  // queda un paso por debajo de rango). → copia.
  Senal.cuantizar = function (x, bits, rango = 1, { modo = 'simetrico' } = {}) {
    const mitad = Math.pow(2, bits) / 2, y = f64(x.length);
    if (modo === 'pcm') { const q = rango / mitad; for (let i = 0; i < x.length; i++) y[i] = limitarA(Math.round(x[i] / q), -mitad, mitad - 1) * q; }
    else { const q = rango / mitad; for (let i = 0; i < x.length; i++) y[i] = (limitarA(Math.floor(x[i] / q), -mitad, mitad - 1) + 0.5) * q; }
    return y;
  };

  // Reconstrucción ideal de Whittaker-Shannon: y(t) = Σ x[n]·sinc(fs·(t − t0) − n), con la muestra n en t0 + n/fs.
  // tFino: tiempos en s (array o número). Coste: muestras × puntos.
  Senal.reconstruirSinc = function (muestrasX, fs, tFino, { t0 = 0 } = {}) {
    const unico = typeof tFino === 'number', ts = unico ? [tFino] : tFino, N = muestrasX.length, y = f64(ts.length);
    for (let m = 0; m < ts.length; m++) {
      const u = (ts[m] - t0) * fs, ui = Math.round(u);
      if (Math.abs(u - ui) < 1e-9) { y[m] = ui >= 0 && ui < N ? muestrasX[ui] : 0; continue; }
      let s = 0;  // sin(π(u − n)) = (−1)^n·sin(πu)
      for (let n = 0; n < N; n++) s += ((n & 1) ? -muestrasX[n] : muestrasX[n]) / (u - n);
      y[m] = s * Math.sin(PI * u) / PI;
    }
    return unico ? y[0] : y;
  };

  // Suma de armónicos: Σ amplitudes[k]·sin(2π·(k+1)·f0·t + fases[k]). Con sinAlias (por defecto) se omiten
  // los que pasan de fs/2. → Float64Array.
  Senal.sumaArmonicos = function ({ f0 = 220, amplitudes = [1], fases = [], fs = 8000, dur = 1, sinAlias = true } = {}) {
    const n = muestras(fs, dur), x = f64(n);
    amplitudes.forEach((a, k) => {
      const f = (k + 1) * f0;
      if (!a || (sinAlias && f >= fs / 2)) return;
      const w = DOS_PI * f / fs, ph = fases[k] || 0;
      for (let i = 0; i < n; i++) x[i] += a * Math.sin(w * i + ph);
    });
    return x;
  };
  // Armónicos de la serie de Fourier de una forma ideal de amplitud 1: n norias (términos no nulos).
  // → [{ k, amp, fase }], cada término amp·sin(2π·k·f·t + fase).
  Senal.armonicosForma = function (forma, n) {
    const l = [];
    for (let m = 0; m < n; m++) {
      if (forma === 'cuadrada') { const k = 2 * m + 1; l.push({ k, amp: 4 / (PI * k), fase: 0 }); }
      else if (forma === 'sierra') { const k = m + 1; l.push({ k, amp: 2 / (PI * k), fase: k % 2 ? 0 : PI }); }
      else if (forma === 'triangular') { const k = 2 * m + 1; l.push({ k, amp: 8 / (PI * PI * k * k), fase: m % 2 ? PI : 0 }); }
      else fallo('forma desconocida: ' + forma + ' (cuadrada, sierra o triangular)');
    }
    return l;
  };
  // Serie de Fourier truncada con n norias (cuadrada, sierra o triangular), con amplitud amp. → Float64Array.
  Senal.serieFourier = function ({ forma = 'cuadrada', n = 5, f = 1, fs = 8000, dur = 1, amp = 1, sinAlias = true } = {}) {
    const N = muestras(fs, dur), x = f64(N);
    for (const a of Senal.armonicosForma(forma, n)) {
      if (sinAlias && a.k * f >= fs / 2) continue;
      const w = DOS_PI * a.k * f / fs;
      for (let i = 0; i < N; i++) x[i] += amp * a.amp * Math.sin(w * i + a.fase);
    }
    return x;
  };
  // La forma ideal (sin truncar), en fase con serieFourier: cuadrada, sierra o triangular. → Float64Array.
  Senal.ondaIdeal = function ({ forma = 'cuadrada', f = 1, fs = 8000, dur = 1, amp = 1 } = {}) {
    const n = muestras(fs, dur), x = f64(n);
    for (let i = 0; i < n; i++) {
      const u = ((f * i / fs) % 1 + 1) % 1;
      let v;
      if (forma === 'cuadrada') v = u === 0 || u === 0.5 ? 0 : u < 0.5 ? 1 : -1;
      else if (forma === 'sierra') v = u === 0.5 ? 0 : 2 * ((u + 0.5) % 1) - 1;
      else v = u < 0.25 ? 4 * u : u < 0.75 ? 2 - 4 * u : 4 * u - 4;
      x[i] = amp * v;
    }
    return x;
  };

  // ═══════════════════════════════════════════════════════════ FFT

  const cacheFFT = new Map();
  function tablas(n) {
    let t = cacheFFT.get(n);
    if (t) return t;
    let bits = 0; while ((1 << bits) < n) bits++;
    const rev = new Uint32Array(n);
    for (let i = 1; i < n; i++) rev[i] = (rev[i >> 1] >> 1) | ((i & 1) << (bits - 1));
    const m = n >> 1, cos = f64(m), sin = f64(m);
    for (let i = 0; i < m; i++) { cos[i] = Math.cos(DOS_PI * i / n); sin[i] = Math.sin(DOS_PI * i / n); }
    t = { rev, cos, sin, bits };
    if (cacheFFT.size > 24) cacheFFT.clear();
    cacheFFT.set(n, t);
    return t;
  }
  // Radix 4 (con una etapa radix 2 si log2(n) es impar), en el sitio y sin escalar. inversa: exponente positivo.
  function fftPot2(re, im, inversa) {
    const n = re.length;
    if (n <= 1) return;
    const { rev, cos, sin, bits } = tablas(n), s = inversa ? 1 : -1, h = n >> 1;
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    let tam = 1;
    if (bits & 1) {
      for (let i = 0; i < n; i += 2) {
        const ar = re[i], ai = im[i], br = re[i + 1], bi = im[i + 1];
        re[i] = ar + br; im[i] = ai + bi; re[i + 1] = ar - br; im[i + 1] = ai - bi;
      }
      tam = 2;
    }
    for (; tam < n; tam <<= 2) {
      const t4 = tam << 2, paso = n / t4;
      for (let i = 0; i < n; i += t4) {
        for (let j = 0; j < tam; j++) {
          const k1 = j * paso, k2 = 2 * k1, k3 = 3 * k1;
          const w1r = cos[k1], w1i = s * sin[k1];
          const w2r = k2 < h ? cos[k2] : -cos[k2 - h], w2i = k2 < h ? s * sin[k2] : -s * sin[k2 - h];
          const w3r = k3 < h ? cos[k3] : -cos[k3 - h], w3i = k3 < h ? s * sin[k3] : -s * sin[k3 - h];
          const a0 = i + j, a1 = a0 + tam, a2 = a1 + tam, a3 = a2 + tam;
          const p2r = re[a1], p2i = im[a1], p1r = re[a2], p1i = im[a2], p3r = re[a3], p3i = im[a3];
          const x2r = p2r * w2r - p2i * w2i, x2i = p2r * w2i + p2i * w2r;
          const x1r = p1r * w1r - p1i * w1i, x1i = p1r * w1i + p1i * w1r;
          const x3r = p3r * w3r - p3i * w3i, x3i = p3r * w3i + p3i * w3r;
          const s0r = re[a0] + x2r, s0i = im[a0] + x2i, d0r = re[a0] - x2r, d0i = im[a0] - x2i;
          const s1r = x1r + x3r, s1i = x1i + x3i, d1r = x1r - x3r, d1i = x1i - x3i;
          re[a0] = s0r + s1r; im[a0] = s0i + s1i;
          re[a2] = s0r - s1r; im[a2] = s0i - s1i;
          re[a1] = d0r - s * d1i; im[a1] = d0i + s * d1r;
          re[a3] = d0r + s * d1i; im[a3] = d0i - s * d1r;
        }
      }
    }
  }
  // Bluestein (chirp-z): cualquier tamaño con FFT de potencia de 2. La parte que solo depende de n se guarda.
  const cacheBluestein = new Map();
  function chirpBluestein(n, s) {
    const clave = n * s;
    let c = cacheBluestein.get(clave);
    if (c) return c;
    const m = Senal.siguientePotencia2(2 * n - 1), cr = f64(n), ci = f64(n), br = f64(m), bi = f64(m);
    for (let k = 0; k < n; k++) { const a = PI * ((k * k) % (2 * n)) / n; cr[k] = Math.cos(a); ci[k] = s * Math.sin(a); }
    br[0] = cr[0]; bi[0] = -ci[0];
    for (let k = 1; k < n; k++) { br[k] = br[m - k] = cr[k]; bi[k] = bi[m - k] = -ci[k]; }
    fftPot2(br, bi, false);
    c = { m, cr, ci, br, bi };
    if (cacheBluestein.size > 6) cacheBluestein.clear();
    cacheBluestein.set(clave, c);
    return c;
  }
  function bluestein(re, im, inversa) {
    const n = re.length, { m, cr, ci, br, bi } = chirpBluestein(n, inversa ? 1 : -1);
    const ar = f64(m), ai = f64(m);
    for (let k = 0; k < n; k++) { ar[k] = re[k] * cr[k] - im[k] * ci[k]; ai[k] = re[k] * ci[k] + im[k] * cr[k]; }
    fftPot2(ar, ai, false);
    for (let k = 0; k < m; k++) { const r = ar[k] * br[k] - ai[k] * bi[k]; ai[k] = ar[k] * bi[k] + ai[k] * br[k]; ar[k] = r; }
    fftPot2(ar, ai, true);
    for (let k = 0; k < n; k++) { const r = ar[k] / m, i = ai[k] / m; re[k] = r * cr[k] - i * ci[k]; im[k] = r * ci[k] + i * cr[k]; }
  }
  function fftGeneral(re, im, inversa) {
    const n = re.length;
    if (n <= 1) return;
    if (esPot2(n)) fftPot2(re, im, inversa); else bluestein(re, im, inversa);
  }
  // FFT en el sitio: X[k] = Σ x[n]·e^(−2πi·k·n/N), sin escalar. Rápida con potencias de 2; con otros tamaños
  // usa Bluestein (unas 4 veces más lenta). → { re, im } (los mismos arrays).
  Senal.fft = function (re, im) { fftGeneral(re, im, false); return { re, im }; };
  // FFT inversa en el sitio, escalada por 1/N. → { re, im }.
  Senal.ifft = function (re, im) {
    fftGeneral(re, im, true);
    const n = re.length;
    for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
    return { re, im };
  };
  // Potencia de 2 más pequeña ≥ n.
  Senal.siguientePotencia2 = function (n) { let p = 1; while (p < n) p *= 2; return p; };
  // FFT de una señal real con nfft puntos (rellena con ceros o recorta; por defecto, x.length).
  // → { re, im } completos (nfft valores; el bin nfft − k es el conjugado del k).
  Senal.fftReal = function (x, nfft) {
    const N = Math.max(1, nfft || x.length), re = f64(N), im = f64(N);
    for (let i = 0, m = Math.min(N, x.length); i < m; i++) re[i] = x[i];
    fftGeneral(re, im, false);
    return { re, im };
  };

  // ═══════════════════════════════════════════════════════════ Ventanas y espectro

  const COSENOS = { hann: [0.5, 0.5], hamming: [0.54, 0.46], blackman: [0.42, 0.5, 0.08] };
  const ALIAS_VENTANA = { rectangular: 'rect', hanning: 'hann', gaussiana: 'gauss', gaussian: 'gauss', bartlett: 'triangular' };
  function nombreVentana(n) { const v = String(n || 'hann').toLowerCase(); return ALIAS_VENTANA[v] || v; }
  function besselI0(x) {
    let s = 1, t = 1; const y = x * x / 4;
    for (let k = 1; k < 80; k++) { t *= y / (k * k); s += t; if (t < 1e-17 * s) break; }
    return s;
  }
  // Valor de la ventana a o muestras de su centro; D es su longitud nominal.
  function valorVentana(tipo, o, D, sigma, beta) {
    switch (tipo) {
      case 'rect': return 1;
      case 'gauss': return Math.exp(-0.5 * (o / sigma) * (o / sigma));
      case 'kaiser': { const r2 = Math.min(1, (2 * o / D) * (2 * o / D)); return besselI0(beta * Math.sqrt(1 - r2)) / besselI0(beta); }
      case 'triangular': return Math.max(0, 1 - Math.abs(2 * o / D));
      default: {
        const a = COSENOS[tipo];
        if (!a) fallo('ventana desconocida: ' + tipo + " ('rect', 'hann', 'hamming', 'blackman', 'gauss', 'kaiser' o 'triangular')");
        let v = 0;
        for (let m = 0; m < a.length; m++) v += a[m] * Math.cos(DOS_PI * m * o / D);
        return v;
      }
    }
  }
  // Ventana de n muestras: 'rect', 'hann', 'hamming', 'blackman', 'gauss' (sigma en muestras; n/6 por defecto),
  // 'kaiser' (beta, 8,6 por defecto) o 'triangular'. Periódica por defecto (la del análisis espectral: centro
  // en n/2 con valor 1); { simetrica: true } da la simétrica, la del diseño de filtros FIR. → Float64Array.
  Senal.ventana = function (nombre = 'hann', n = 512, { sigma, simetrica = false, beta = 8.6 } = {}) {
    const tipo = nombreVentana(nombre), w = f64(n);
    if (n === 1) { w[0] = 1; return w; }
    const D = simetrica ? n - 1 : n, c = D / 2, s = sigma || n / 6;
    for (let i = 0; i < n; i++) w[i] = valorVentana(tipo, i - c, D, s, beta);
    return w;
  };
  // Ventana para tramas centradas: el índice i corresponde a i − floor(n/2) muestras del centro.
  function ventanaTF(nombre, n, sigma) {
    const tipo = nombreVentana(nombre), h = n >> 1, w = f64(n), s = sigma || n / 6;
    for (let i = 0; i < n; i++) w[i] = valorVentana(tipo, i - h, n, s, 8.6);
    return w;
  }
  // Ventana, su derivada (por muestra) y la ventana por el tiempo (en muestras), para reasignar y comprimir.
  function ventanasDerivadas(nombre, n, sigma) {
    const tipo = nombreVentana(nombre), h = n >> 1, s = sigma || n / 6, a = COSENOS[tipo];
    if (tipo !== 'gauss' && !a) fallo("la reasignación y el sincrosqueezing necesitan una ventana suave: 'gauss', 'hann', 'hamming' o 'blackman'");
    const g = f64(n), dg = f64(n), tg = f64(n);
    for (let i = 0; i < n; i++) {
      const o = i - h;
      if (tipo === 'gauss') { g[i] = Math.exp(-0.5 * (o / s) * (o / s)); dg[i] = -o / (s * s) * g[i]; }
      else {
        let v = 0, d = 0;
        for (let m = 0; m < a.length; m++) { const w = DOS_PI * m / n; v += a[m] * Math.cos(w * o); d -= a[m] * w * Math.sin(w * o); }
        g[i] = v; dg[i] = d;
      }
      tg[i] = o * g[i];
    }
    return { g, dg, tg, sigma: s };
  }

  // Espectro de una cara. Con la ventana periódica y sin relleno (nfft = x.length), un seno de amplitud A con la
  // frecuencia en un bin da un pico ≈ A (corrección 2/Σw). nfft > x.length rellena con ceros: más puntos, no más
  // información. escala: 'amplitud', 'potencia' (amplitud²) o 'dB' (20·log10 de la amplitud), solo para mag.
  // → { f (Hz), mag, fase (rad, desde la primera muestra), re, im (corregidos como mag), nfft, df }.
  Senal.espectro = function (x, fs, { ventana = 'hann', nfft, escala = 'amplitud', sigma } = {}) {
    const N = Math.max(1, nfft || x.length), Lu = Math.min(x.length, N), w = Senal.ventana(ventana, Lu, { sigma });
    const re = f64(N), im = f64(N);
    let sw = 0;
    for (let i = 0; i < Lu; i++) { sw += w[i]; re[i] = x[i] * w[i]; }
    fftGeneral(re, im, false);
    const nF = Math.floor(N / 2) + 1, f = f64(nF), mag = f64(nF), fase = f64(nF), R = f64(nF), I = f64(nF);
    for (let k = 0; k < nF; k++) {
      const c = (k === 0 || 2 * k === N ? 1 : 2) / (sw || 1);
      R[k] = re[k] * c; I[k] = im[k] * c;
      const m = Math.sqrt(R[k] * R[k] + I[k] * I[k]);
      mag[k] = escala === 'potencia' ? m * m : escala === 'dB' ? dbDe(m, 20) : m;
      fase[k] = Math.atan2(I[k], R[k]);
      f[k] = k * fs / N;
    }
    return { f, mag, fase, re: R, im: I, nfft: N, df: fs / N };
  };

  // Correlación directa con norias de prueba (lección 4): para cada frecuencia f (Hz), re = (2/N)·Σ x·cos(2πft) e
  // im = −(2/N)·Σ x·sin(2πft) (1/N en 0 Hz y fs/2). Un coseno de amplitud A y fase φ que encaja da mag ≈ A y fase ≈ φ.
  // → [{ f, re, im, mag, fase }] (un objeto si frecuencias es un número). Coste: N × frecuencias.
  Senal.dft = function (x, fs, frecuencias) {
    const N = x.length, unico = typeof frecuencias === 'number', fr = unico ? [frecuencias] : frecuencias, sal = [];
    for (const f of fr) {
      const w = DOS_PI * f / fs, cw = Math.cos(w), sw = Math.sin(w);
      let sr = 0, si = 0, c = 1, s = 0;
      for (let n = 0; n < N; n++) {
        sr += x[n] * c; si -= x[n] * s;
        const c2 = c * cw - s * sw; s = s * cw + c * sw; c = c2;
        if ((n & 1023) === 1023) { const r = Math.sqrt(c * c + s * s); c /= r; s /= r; }
      }
      const k = (f === 0 || Math.abs(f - fs / 2) < 1e-9) ? 1 / N : 2 / N, re = sr * k, im = si * k;
      sal.push({ f, re, im, mag: Math.sqrt(re * re + im * im), fase: Math.atan2(im, re) });
    }
    return unico ? sal[0] : sal;
  };

  // Parecido entre una señal y una plantilla: producto punto a punto y su suma (el «área»).
  // → { producto, suma, media, normalizada (suma / (‖x‖·‖plantilla‖), entre −1 y 1) }.
  Senal.parecido = function (x, plantilla) {
    const n = Math.min(x.length, plantilla.length), producto = f64(n);
    let suma = 0, ex = 0, ep = 0;
    for (let i = 0; i < n; i++) { const p = x[i] * plantilla[i]; producto[i] = p; suma += p; ex += x[i] * x[i]; ep += plantilla[i] * plantilla[i]; }
    return { producto, suma, media: n ? suma / n : 0, normalizada: ex > 0 && ep > 0 ? suma / Math.sqrt(ex * ep) : 0 };
  };

  // ═══════════════════════════════════════════════════════════ STFT y espectrograma

  const tiemposTF = (nT, salto, fs) => { const t = f64(nT); for (let j = 0; j < nT; j++) t[j] = j * salto / fs; return t; };
  const frecuenciasTF = (nF, fs, nfft) => { const f = f64(nF); for (let k = 0; k < nF; k++) f[k] = k * fs / nfft; return f; };
  // Copia en buf la trama centrada en la muestra c, multiplicada por w, con el centro en el índice 0
  // (la fase se mide desde el centro de la ventana). Fuera de la señal, ceros.
  function cargarTrama(x, c, w, buf, nfft) {
    const n = w.length, h = n >> 1, L = x.length;
    if (nfft > n) buf.fill(0);
    if (c - h >= 0 && c - h + n <= L) {
      for (let o = 0; o < n - h; o++) buf[o] = x[c + o] * w[h + o];
      for (let o = -h; o < 0; o++) buf[nfft + o] = x[c + o] * w[h + o];
    } else {
      for (let i = 0; i < n; i++) { const o = i - h, s = c + o; buf[o >= 0 ? o : nfft + o] = s >= 0 && s < L ? x[s] * w[i] : 0; }
    }
  }
  // Misma trama con dos ventanas: w1 a la parte real y w2 a la imaginaria (dos FFT reales en una).
  function cargarTrama2(x, c, w1, w2, bre, bim, nfft) {
    const n = w1.length, h = n >> 1, L = x.length;
    if (nfft > n) { bre.fill(0); bim.fill(0); }
    for (let i = 0; i < n; i++) {
      const o = i - h, s = c + o, k = o >= 0 ? o : nfft + o, v = s >= 0 && s < L ? x[s] : 0;
      bre[k] = v * w1[i]; bim[k] = v * w2[i];
    }
  }
  // Separa las FFT de dos señales reales a partir de la de z = a + i·b. Devuelve en o: ar, ai, br, bi del bin k.
  function separar(re, im, k, nfft, o) {
    const k2 = (nfft - k) & (nfft - 1), zr = re[k], zi = im[k], wr = re[k2], wi = im[k2];
    o.ar = (zr + wr) / 2; o.ai = (zi - wi) / 2; o.br = (zi + wi) / 2; o.bi = (wr - zr) / 2;
  }
  function prepararTF(n, salto, nfft, porDefectoSalto) {
    n = Math.max(2, Math.round(n));
    salto = Math.max(1, Math.round(salto || porDefectoSalto(n)));
    nfft = nfft || Senal.siguientePotencia2(n);
    if (!esPot2(nfft) || nfft < n) fallo('nfft tiene que ser una potencia de 2 mayor o igual que n');
    return { n, salto, nfft };
  }

  // Transformada de Fourier de tiempo corto. Tramas centradas en j·salto (s = j·salto/fs), con ceros fuera de la
  // señal; fase medida desde el centro de cada ventana. n y salto en muestras; sigma (solo 'gauss') en muestras.
  // → TF { t, f, nT, nF, re, im } (suma tal cual, sin normalizar) más fs, n, salto, nfft, ventana, sigma, longitud,
  //   escala (2/Σw: pasa a amplitud), gc y tipo: 'stft'.
  Senal.stft = function (x, fs, opts = {}) {
    const { n, salto, nfft } = prepararTF(opts.n || 512, opts.salto, opts.nfft, m => m / 4);
    const L = x.length, nT = Math.max(1, Math.ceil(L / salto)), nF = nfft / 2 + 1, nombre = nombreVentana(opts.ventana || 'hann');
    const g = ventanaTF(nombre, n, opts.sigma), re = f32(nF * nT), im = f32(nF * nT), bre = f64(nfft), bim = f64(nfft), o = {};
    for (let j = 0; j < nT; j += 2) {
      const dos = j + 1 < nT;
      cargarTrama(x, j * salto, g, bre, nfft);
      if (dos) cargarTrama(x, (j + 1) * salto, g, bim, nfft); else bim.fill(0);
      fftPot2(bre, bim, false);
      for (let k = 0; k < nF; k++) {
        separar(bre, bim, k, nfft, o);
        const p = k * nT + j;
        re[p] = o.ar; im[p] = o.ai;
        if (dos) { re[p + 1] = o.br; im[p + 1] = o.bi; }
      }
    }
    let sg = 0; for (let i = 0; i < n; i++) sg += g[i];
    return { t: tiemposTF(nT, salto, fs), f: frecuenciasTF(nF, fs, nfft), nT, nF, re, im, fs, n, salto, nfft, ventana: nombre,
      sigma: opts.sigma || n / 6, longitud: L, escala: 2 / sg, gc: g[n >> 1], tipo: 'stft' };
  };

  // Inversa de la STFT por solapamiento y suma ponderada (mínimos cuadrados). Usa los parámetros guardados en el TF;
  // vale también para un TF modificado (enmascarado). → Float64Array de longitud T.longitud (o «longitud»).
  Senal.istft = function (T, { longitud } = {}) {
    const { n, salto, nfft, nT, nF } = T, L = longitud || T.longitud || (nT - 1) * salto + 1;
    const g = ventanaTF(T.ventana, n, T.sigma), h = n >> 1, y = f64(L), ws = f64(L), bre = f64(nfft), bim = f64(nfft);
    for (let j = 0; j < nT; j += 2) {
      const dos = j + 1 < nT;
      for (let k = 0; k < nF; k++) {
        const p = k * nT + j, ar = T.re[p], ai = T.im[p], br = dos ? T.re[p + 1] : 0, bi = dos ? T.im[p + 1] : 0;
        bre[k] = ar - bi; bim[k] = ai + br;  // A + i·B
        if (k > 0 && k < nfft - k) { bre[nfft - k] = ar + bi; bim[nfft - k] = br - ai; }  // conj(A) + i·conj(B)
      }
      fftPot2(bre, bim, true);
      for (let i = 0; i < n; i++) {
        const o = i - h, idx = o >= 0 ? o : nfft + o, gi = g[i];
        let s = j * salto + o;
        if (s >= 0 && s < L) { y[s] += bre[idx] / nfft * gi; ws[s] += gi * gi; }
        if (dos) { s += salto; if (s >= 0 && s < L) { y[s] += bim[idx] / nfft * gi; ws[s] += gi * gi; } }
      }
    }
    for (let i = 0; i < L; i++) y[i] = ws[i] > 1e-10 ? y[i] / ws[i] : 0;
    return y;
  };

  function escalaFila(T, k) { const e = T.escala || 1; return T.tipo === 'stft' && (k === 0 || k === T.nF - 1) ? e / 2 : e; }
  // Potencia de cada casilla de un TF, en amplitud² (aplica T.escala: un seno de amplitud A da ≈ A² en su pico
  // de la STFT, de la CWT y del sincrosqueezing). → Float32Array(nF·nT), mismo índice que el TF.
  Senal.potencia = function (T) {
    const { nF, nT } = T, p = f32(nF * nT);
    for (let k = 0; k < nF; k++) {
      const e = escalaFila(T, k), e2 = e * e;
      for (let j = 0, q = k * nT; j < nT; j++, q++) p[q] = (T.re[q] * T.re[q] + T.im[q] * T.im[q]) * e2;
    }
    return p;
  };
  // Mapa en dB de un TF: 20·log10(amplitud / ref), con un suelo. → { t, f, nT, nF, db (Float32Array), max }.
  Senal.mapaDb = function (T, { suelo = -120, ref = 1 } = {}) {
    const p = Senal.potencia(T), db = f32(p.length), r2 = ref * ref;
    let max = -Infinity;
    for (let i = 0; i < p.length; i++) {
      const v = p[i] > 0 ? 10 * Math.log10(p[i] / r2) : suelo;
      db[i] = v < suelo ? suelo : v;
      if (db[i] > max) max = db[i];
    }
    return { t: T.t, f: T.f, nT: T.nT, nF: T.nF, db, max };
  };
  // Espectrograma en dB (las mismas opciones que stft, más suelo y ref). Un seno de amplitud 1 da ≈ 0 dB.
  // → { t, f, nT, nF, db, max }.
  Senal.espectrograma = (x, fs, opts = {}) => Senal.mapaDb(Senal.stft(x, fs, opts), opts);

  // ═══════════════════════════════════════════════════════════ Filtros

  // Biquad del «Audio EQ Cookbook» (R. Bristow-Johnson). tipo: 'pasoBajo', 'pasoAlto', 'pasoBanda' (0 dB en f0),
  // 'banda' (banda eliminada), 'pico' (ganancia en dB), 'estanteBajo', 'estanteAlto' o 'todoPaso'.
  // f0 y fs en Hz. Con Q = 0,7071, el paso bajo y el paso alto están a −3 dB en f0. → { b: [3], a: [3] } con a[0] = 1.
  Senal.biquad = function (tipo, f0, fs, { Q = Math.SQRT1_2, ganancia = 0 } = {}) {
    const w0 = DOS_PI * f0 / fs, cw = Math.cos(w0), sw = Math.sin(w0), al = sw / (2 * Q), A = Math.pow(10, ganancia / 40);
    let b, a = [1 + al, -2 * cw, 1 - al];
    switch (tipo) {
      case 'pasoBajo': b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]; break;
      case 'pasoAlto': b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]; break;
      case 'pasoBanda': b = [al, 0, -al]; break;
      case 'banda': b = [1, -2 * cw, 1]; break;
      case 'todoPaso': b = [1 - al, -2 * cw, 1 + al]; break;
      case 'pico': b = [1 + al * A, -2 * cw, 1 - al * A]; a = [1 + al / A, -2 * cw, 1 - al / A]; break;
      case 'estanteBajo': {
        const r = 2 * Math.sqrt(A) * al;
        b = [A * ((A + 1) - (A - 1) * cw + r), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - r)];
        a = [(A + 1) + (A - 1) * cw + r, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - r]; break;
      }
      case 'estanteAlto': {
        const r = 2 * Math.sqrt(A) * al;
        b = [A * ((A + 1) + (A - 1) * cw + r), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - r)];
        a = [(A + 1) - (A - 1) * cw + r, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - r]; break;
      }
      default: fallo('tipo de biquad desconocido: ' + tipo);
    }
    const a0 = a[0];
    return { b: b.map(v => v / a0), a: a.map(v => v / a0) };
  };

  // Butterworth de orden «orden» como cascada de secciones (bilineal con predistorsión: −3 dB exactos en fc).
  // tipo: 'pasoBajo', 'pasoAlto' o 'pasoBanda' (fc = [f1, f2]: paso alto en f1 seguido de paso bajo en f2).
  // → secciones: [{ b, a }] para filtrarSecciones, filtrar, filtfilt o respuesta.
  Senal.butterworth = function (orden, fc, fs, tipo = 'pasoBajo') {
    if (tipo === 'pasoBanda') return Senal.butterworth(orden, fc[0], fs, 'pasoAlto').concat(Senal.butterworth(orden, fc[1], fs, 'pasoBajo'));
    if (tipo !== 'pasoBajo' && tipo !== 'pasoAlto') fallo('butterworth: tipo ' + tipo + " no válido ('pasoBajo', 'pasoAlto' o 'pasoBanda')");
    const sec = [];
    for (let k = 1; k <= Math.floor(orden / 2); k++) sec.push(Senal.biquad(tipo, fc, fs, { Q: 1 / (2 * Math.sin((2 * k - 1) * PI / (2 * orden))) }));
    if (orden % 2) {
      const K = Math.tan(PI * fc / fs), a1 = (K - 1) / (K + 1);
      sec.push(tipo === 'pasoAlto' ? { b: [1 / (1 + K), -1 / (1 + K)], a: [1, a1] } : { b: [K / (1 + K), K / (1 + K)], a: [1, a1] });
    }
    return sec;
  };

  // FIR por el método de la ventana (sinc enventanada, fase lineal). fc en Hz (en 'pasoBanda' y 'banda',
  // [f1, f2]); coeficientes: número de coeficientes (se hace impar en 'pasoAlto' y 'banda'). El paso bajo tiene
  // ganancia 1 exacta en continua. → b (Float64Array); úsalo como { b } o directamente.
  Senal.firVentana = function (fc, fs, coeficientes = 101, tipo = 'pasoBajo', ventana = 'hamming') {
    let N = Math.max(1, Math.round(coeficientes));
    if ((tipo === 'pasoAlto' || tipo === 'banda') && N % 2 === 0) N++;
    const w = Senal.ventana(ventana, N, { simetrica: true }), M = (N - 1) / 2;
    const pb = c => { const h = f64(N), r = 2 * c / fs; let s = 0; for (let i = 0; i < N; i++) { h[i] = r * sinc(r * (i - M)) * w[i]; s += h[i]; } for (let i = 0; i < N; i++) h[i] /= s; return h; };
    const invertir = h => { for (let i = 0; i < N; i++) h[i] = -h[i]; h[M] += 1; return h; };
    if (tipo === 'pasoBajo') return pb(fc);
    if (tipo === 'pasoAlto') return invertir(pb(fc));
    if (tipo !== 'pasoBanda' && tipo !== 'banda') fallo('tipo de FIR desconocido: ' + tipo);
    const h1 = pb(fc[0]), h2 = pb(fc[1]), h = f64(N);
    for (let i = 0; i < N; i++) h[i] = h2[i] - h1[i];
    return tipo === 'banda' ? invertir(h) : h;
  };

  // Ecuación en diferencias en forma directa II traspuesta, con estado inicial opcional.
  function lfilter(b, a, x, zi) {
    const m = Math.max(b.length, a.length), a0 = a[0], L = x.length, y = f64(L), B = f64(m), A = f64(m);
    for (let i = 0; i < b.length; i++) B[i] = b[i] / a0;
    for (let i = 0; i < a.length; i++) A[i] = a[i] / a0;
    if (m === 1) { for (let i = 0; i < L; i++) y[i] = B[0] * x[i]; return y; }
    const z = f64(m - 1); if (zi) for (let i = 0; i < m - 1; i++) z[i] = zi[i] || 0;
    if (m === 2) {
      let z0 = z[0]; const b0 = B[0], b1 = B[1], a1 = A[1];
      for (let i = 0; i < L; i++) { const xi = x[i], yi = b0 * xi + z0; z0 = b1 * xi - a1 * yi; y[i] = yi; }
      return y;
    }
    if (m === 3) {
      let z0 = z[0], z1 = z[1]; const b0 = B[0], b1 = B[1], b2 = B[2], a1 = A[1], a2 = A[2];
      for (let i = 0; i < L; i++) { const xi = x[i], yi = b0 * xi + z0; z0 = b1 * xi - a1 * yi + z1; z1 = b2 * xi - a2 * yi; y[i] = yi; }
      return y;
    }
    for (let i = 0; i < L; i++) {
      const xi = x[i], yi = B[0] * xi + z[0];
      for (let k = 0; k < m - 2; k++) z[k] = B[k + 1] * xi - A[k + 1] * yi + z[k + 1];
      z[m - 2] = B[m - 1] * xi - A[m - 1] * yi;
      y[i] = yi;
    }
    return y;
  }
  // Estado inicial que deja el filtro en régimen ante una entrada constante 1 (como lfilter_zi de SciPy).
  function ziRegimen(b, a) {
    const m = Math.max(b.length, a.length), a0 = a[0], z = f64(Math.max(0, m - 1));
    let sb = 0, sa = 0;
    for (let i = 0; i < m; i++) { sb += (b[i] || 0) / a0; sa += (a[i] || 0) / a0; }
    if (Math.abs(sa) < 1e-12) return z;
    const yss = sb / sa;
    let acc = 0;
    for (let k = m - 2; k >= 0; k--) { acc += (b[k + 1] || 0) / a0 - ((a[k + 1] || 0) / a0) * yss; z[k] = acc; }
    return z;
  }
  function gananciaDC(b, a) { let sb = 0, sa = 0; for (const v of b) sb += v; for (const v of a) sa += v; return Math.abs(sa) > 1e-12 ? sb / sa : 0; }
  function esSecciones(fl) { return Array.isArray(fl) && fl.length > 0 && fl[0] !== null && typeof fl[0] === 'object' && 'b' in fl[0]; }
  function partes(filtro) { const b = filtro.b || filtro, a = filtro.a || [1]; return { b, a }; }

  // Aplica un filtro: { b, a }, solo b (FIR) o una lista de secciones. Causal (llega tarde: retraso de grupo).
  // Los FIR largos (más de 64 coeficientes) se aplican por FFT. → Float64Array de la misma longitud.
  Senal.filtrar = function (filtro, x) {
    if (esSecciones(filtro)) return Senal.filtrarSecciones(filtro, x);
    const { b, a } = partes(filtro);
    if (a.length === 1 && b.length > 64 && x.length > 256) {
      const c = Senal.convolucion(x, b), y = f64(x.length);
      for (let i = 0; i < x.length; i++) y[i] = c[i] / a[0];
      return y;
    }
    return lfilter(b, a, x);
  };
  // Filtra en cascada con una lista de secciones { b, a } (por ejemplo, la de butterworth). → Float64Array.
  Senal.filtrarSecciones = function (secciones, x) { let y = x; for (const s of secciones) y = lfilter(s.b, s.a || [1], y); return y === x ? Float64Array.from(x) : y; };
  // Una pasada con el filtro ya en régimen para el primer valor (evita el transitorio de arranque).
  function pasadaEnRegimen(filtro, x) {
    if (esSecciones(filtro)) {
      let y = x, nivel = x[0];
      for (const s of filtro) {
        const a = s.a || [1], zi = ziRegimen(s.b, a);
        for (let i = 0; i < zi.length; i++) zi[i] *= nivel;
        y = lfilter(s.b, a, y, zi); nivel *= gananciaDC(s.b, a);
      }
      return y;
    }
    const { b, a } = partes(filtro);
    if (a.length === 1 && b.length > 64) {
      const nb = b.length, e = f64(x.length + nb - 1);
      e.fill(x[0], 0, nb - 1); e.set(x, nb - 1);
      const c = Senal.convolucion(e, b), y = f64(x.length);
      for (let i = 0; i < x.length; i++) y[i] = c[nb - 1 + i] / a[0];
      return y;
    }
    const zi = ziRegimen(b, a);
    for (let i = 0; i < zi.length; i++) zi[i] *= x[0];
    return lfilter(b, a, x, zi);
  }
  // Filtrado hacia delante y hacia atrás: fase cero (no retrasa) y ganancia al cuadrado. Extiende la señal con
  // su reflejo impar en los bordes y arranca en régimen, como filtfilt de SciPy. No sirve en tiempo real.
  Senal.filtfilt = function (filtro, x) {
    const L = x.length;
    if (L < 2) return Float64Array.from(x);
    let orden;
    if (esSecciones(filtro)) orden = 2 * filtro.length + 1;
    else { const { b, a } = partes(filtro); orden = Math.max(b.length, a.length); }
    const p = Math.min(3 * orden, L - 1), e = f64(L + 2 * p);
    for (let i = 0; i < p; i++) { e[i] = 2 * x[0] - x[p - i]; e[p + L + i] = 2 * x[L - 1] - x[L - 2 - i]; }
    e.set(x, p);
    const y1 = pasadaEnRegimen(filtro, e).reverse(), y2 = pasadaEnRegimen(filtro, y1).reverse();
    return y2.slice(p, p + L);
  };
  // Media móvil de n muestras (ceros antes del principio). Causal por defecto (retrasa (n − 1)/2 muestras);
  // { centrada: true } la centra. → Float64Array.
  Senal.mediaMovil = function (x, n, { centrada = false } = {}) {
    n = Math.max(1, Math.round(n));
    const L = x.length, y = f64(L), d = centrada ? Math.floor((n - 1) / 2) : 0, c = f64(L + 1);
    for (let i = 0; i < L; i++) c[i + 1] = c[i] + x[i];
    for (let i = 0; i < L; i++) { const hi = Math.min(L, i + d + 1), lo = Math.max(0, i + d - n + 1); y[i] = hi > lo ? (c[hi] - c[lo]) / n : 0; }
    return y;
  };

  // Polinomio en e^(−iω): valor y retraso de grupo parcial Re(Σ m·c_m·e^(−iωm) / Σ c_m·e^(−iωm)).
  function evaluarPolinomio(c, w) {
    let re = 0, im = 0, rr = 0, ri = 0;
    for (let m = 0; m < c.length; m++) { const cr = Math.cos(w * m), ci = -Math.sin(w * m); re += c[m] * cr; im += c[m] * ci; rr += m * c[m] * cr; ri += m * c[m] * ci; }
    const d = re * re + im * im;
    return { re, im, tau: d > 1e-300 ? (rr * re + ri * im) / d : 0 };
  }
  // Respuesta en frecuencia de { b, a }, de b o de una lista de secciones. n: número de puntos de 0 a fs/2 (con los
  // dos extremos) o un array de frecuencias en Hz. → { f, mag, magDb, fase (rad, desenrollada),
  // retrasoGrupo (s), retrasoGrupoMuestras }.
  Senal.respuesta = function (filtro, fs, n = 512) {
    let fr;
    if (typeof n === 'number') { fr = f64(n); for (let i = 0; i < n; i++) fr[i] = n > 1 ? i * fs / 2 / (n - 1) : 0; }
    else fr = Float64Array.from(n);
    const secs = esSecciones(filtro) ? filtro : [partes(filtro)], N = fr.length;
    const mag = f64(N), magDb = f64(N), fase = f64(N), rgm = f64(N), rg = f64(N);
    for (let i = 0; i < N; i++) {
      const w = DOS_PI * fr[i] / fs;
      let hr = 1, hi = 0, tau = 0;
      for (const s of secs) {
        const B = evaluarPolinomio(s.b, w), A = evaluarPolinomio(s.a || [1], w), den = A.re * A.re + A.im * A.im;
        const qr = (B.re * A.re + B.im * A.im) / den, qi = (B.im * A.re - B.re * A.im) / den, nr = hr * qr - hi * qi;
        hi = hr * qi + hi * qr; hr = nr; tau += B.tau - A.tau;
      }
      mag[i] = Math.sqrt(hr * hr + hi * hi); magDb[i] = dbDe(mag[i], 20); fase[i] = Math.atan2(hi, hr);
      rgm[i] = tau; rg[i] = tau / fs;
    }
    return { f: fr, mag, magDb, fase: Senal.desenrollar(fase), retrasoGrupo: rg, retrasoGrupoMuestras: rgm };
  };

  // Raíces de un polinomio de coeficientes en potencias decrecientes (Durand-Kerner). → [{ re, im }].
  Senal.raices = function (coef) {
    let c = Array.from(coef);
    while (c.length > 1 && c[0] === 0) c.shift();
    let ceros0 = 0;
    while (c.length > 1 && c[c.length - 1] === 0) { c.pop(); ceros0++; }
    const n = c.length - 1, sal = [];
    for (let i = 0; i < ceros0; i++) sal.push({ re: 0, im: 0 });
    if (n < 1) return sal;
    const a = c.map(v => v / c[0]);
    let R = 0; for (let i = 1; i <= n; i++) R = Math.max(R, Math.abs(a[i]));
    R = 1 + R;
    const zr = f64(n), zi = f64(n);
    for (let k = 0; k < n; k++) { const ang = DOS_PI * k / n + 0.4; zr[k] = 0.5 * R * Math.cos(ang); zi[k] = 0.5 * R * Math.sin(ang); }
    for (let it = 0; it < 1000; it++) {
      let cambio = 0;
      for (let i = 0; i < n; i++) {
        let pr = 1, pi = 0;  // Horner
        for (let k = 1; k <= n; k++) { const t = pr * zr[i] - pi * zi[i] + a[k]; pi = pr * zi[i] + pi * zr[i]; pr = t; }
        let dr = 1, di = 0;
        for (let j = 0; j < n; j++) if (j !== i) { const ur = zr[i] - zr[j], ui = zi[i] - zi[j], t = dr * ur - di * ui; di = dr * ui + di * ur; dr = t; }
        const den = dr * dr + di * di || 1e-300, qr = (pr * dr + pi * di) / den, qi = (pi * dr - pr * di) / den;
        zr[i] -= qr; zi[i] -= qi; cambio = Math.max(cambio, Math.abs(qr) + Math.abs(qi));
      }
      if (cambio < 1e-14 * R) break;
    }
    for (let k = 0; k < n; k++) sal.push({ re: zr[k], im: Math.abs(zi[k]) < 1e-12 * R ? 0 : zi[k] });
    return sal;
  };
  // Polos y ceros (en el plano z) de { b, a } o de una lista de secciones. → { ceros, polos, estable }.
  Senal.polosCeros = function (filtro) {
    const secs = esSecciones(filtro) ? filtro : [partes(filtro)], ceros = [], polos = [];
    for (const s of secs) {
      const b = Array.from(s.b), a = Array.from(s.a || [1]);
      while (b.length < a.length) b.push(0);
      while (a.length < b.length) a.push(0);
      ceros.push(...Senal.raices(b)); polos.push(...Senal.raices(a));
    }
    return { ceros, polos, estable: polos.every(p => Math.hypot(p.re, p.im) < 1 - 1e-12) };
  };

  // Eco con realimentación (peine IIR, lección 8): y[n] = x[n] + ganancia·w[n − D], con w[n] = x[n] + realimentacion·w[n − D].
  // Ecos de ganancia g, g·r, g·r²… cada D muestras. Con |realimentacion| ≥ 1 es inestable: crece sin límite
  // (usa Senal.limitar antes de reproducirlo). La salida tiene la longitud de x: añade ceros para oír la cola.
  Senal.eco = function (x, retrasoMuestras, ganancia = 0.5, realimentacion = 0) {
    const D = Math.max(1, Math.round(retrasoMuestras)), L = x.length, w = f64(L), y = f64(L);
    for (let i = 0; i < L; i++) {
      const prev = i >= D ? w[i - D] : 0;
      w[i] = x[i] + realimentacion * prev;
      y[i] = x[i] + ganancia * prev;
    }
    return y;
  };

  // ═══════════════════════════════════════════════════════════ Convolución y correlación

  // Convolución. modo: 'completa' (nx + nh − 1), 'misma' (nx, centrada, como numpy 'same') o 'valida'.
  // { metodo: 'auto' | 'directa' | 'fft' }: 'auto' usa la directa si el núcleo es corto (≤ 48) y la FFT si no.
  Senal.convolucion = function (x, h, modo = 'completa', { metodo = 'auto' } = {}) {
    const nx = x.length, nh = h.length;
    if (!nx || !nh) return f64(0);
    const nc = nx + nh - 1;
    let c;
    if (metodo === 'directa' || (metodo === 'auto' && Math.min(nx, nh) <= 48)) {
      c = f64(nc);
      for (let i = 0; i < nx; i++) { const xi = x[i]; if (xi === 0) continue; for (let k = 0; k < nh; k++) c[i + k] += xi * h[k]; }
    } else {
      const N = Senal.siguientePotencia2(nc), re = f64(N), im = f64(N), cr = f64(N), ci = f64(N);
      for (let i = 0; i < nx; i++) re[i] = x[i];
      for (let i = 0; i < nh; i++) im[i] = h[i];
      fftPot2(re, im, false);
      for (let k = 0; k < N; k++) {  // X·H = (a² − b²)/(4i), con a = Z[k] y b = conj(Z[N − k])
        const k2 = (N - k) & (N - 1), ar = re[k], ai = im[k], br = re[k2], bi = -im[k2];
        const dr = (ar * ar - ai * ai) - (br * br - bi * bi), di = 2 * (ar * ai - br * bi);
        cr[k] = di / 4; ci[k] = -dr / 4;
      }
      fftPot2(cr, ci, true);
      c = f64(nc);
      for (let i = 0; i < nc; i++) c[i] = cr[i] / N;
    }
    if (modo === 'misma') { const a = Math.floor((nh - 1) / 2); return c.slice(a, a + nx); }
    if (modo === 'valida') return nx >= nh ? c.slice(nh - 1, nx) : f64(0);
    return c;
  };

  // Correlación cruzada r[l] = Σ x[n + l]·y[n], por FFT. Si x es y retrasada D muestras, el pico sale en l = +D.
  // { normalizada } divide por √(Σx²·Σy²) (entre −1 y 1); { maxRetraso } limita |l|.
  // → { retrasos (muestras), valores, mejor: { retraso, valor } } (mejor = máximo positivo).
  Senal.correlacion = function (x, y, { normalizada = false, maxRetraso } = {}) {
    const nx = x.length, ny = y.length, N = Senal.siguientePotencia2(nx + ny - 1), re = f64(N), im = f64(N);
    for (let i = 0; i < nx; i++) re[i] = x[i];
    for (let i = 0; i < ny; i++) im[i] = y[i];
    fftPot2(re, im, false);
    const rr = f64(N), ri = f64(N);
    for (let k = 0; k < N; k++) {
      const k2 = (N - k) & (N - 1), ar = re[k], ai = im[k], br = re[k2], bi = -im[k2];
      const Xr = (ar + br) / 2, Xi = (ai + bi) / 2, Yr = (ai - bi) / 2, Yi = -(ar - br) / 2;
      rr[k] = Xr * Yr + Xi * Yi; ri[k] = Xi * Yr - Xr * Yi;  // X·conj(Y)
    }
    fftPot2(rr, ri, true);
    let norma = N;
    if (normalizada) { let ex = 0, ey = 0; for (let i = 0; i < nx; i++) ex += x[i] * x[i]; for (let i = 0; i < ny; i++) ey += y[i] * y[i]; norma = N * (Math.sqrt(ex * ey) || 1); }
    const lmin = Math.max(-(ny - 1), maxRetraso === undefined ? -Infinity : -maxRetraso), lmax = Math.min(nx - 1, maxRetraso === undefined ? Infinity : maxRetraso);
    const n = Math.max(0, lmax - lmin + 1), retrasos = f64(n), valores = f64(n);
    let mejor = { retraso: 0, valor: -Infinity };
    for (let i = 0; i < n; i++) {
      const l = lmin + i, v = rr[(l + N) % N] / norma;
      retrasos[i] = l; valores[i] = v;
      if (v > mejor.valor) mejor = { retraso: l, valor: v };
    }
    return { retrasos, valores, mejor };
  };
  // Autocorrelación r[l] = Σ x[n]·x[n + l] (sesgada, sin quitar la media), para l = 0…maxRetraso, por FFT.
  // normalizada (por defecto): r[0] = 1. → Float64Array(maxRetraso + 1).
  Senal.autocorrelacion = function (x, maxRetraso, normalizada = true) {
    const L = x.length;
    if (!L) return f64(0);
    const M = Math.max(0, Math.min(L - 1, maxRetraso === undefined ? L - 1 : Math.round(maxRetraso)));
    const N = Senal.siguientePotencia2(L + M + 1), re = f64(N), im = f64(N);
    for (let i = 0; i < L; i++) re[i] = x[i];
    fftPot2(re, im, false);
    for (let k = 0; k < N; k++) { re[k] = re[k] * re[k] + im[k] * im[k]; im[k] = 0; }
    fftPot2(re, im, true);
    const r = f64(M + 1), d = normalizada ? re[0] || 1 : N;
    for (let l = 0; l <= M; l++) r[l] = re[l] / d;
    return r;
  };

  // ═══════════════════════════════════════════════════════════ Ruido y Welch

  const EXPONENTE_RUIDO = { blanco: 0, rosa: 1, marron: 2, 'marrón': 2, azul: -1, violeta: -2 };
  // Ruido gaussiano de n muestras con RMS 1. tipo: 'blanco' (espectro plano), 'rosa' (−10 dB por década),
  // 'marron' (−20 dB por década), 'azul' (+10) o 'violeta' (+20). azar: generador de Senal.azar o semilla.
  // Los de color se modelan en frecuencia (exactos en todo el ancho de banda; el trozo es periódico).
  Senal.ruido = function (tipo = 'blanco', n = 16000, azar) {
    const alfa = EXPONENTE_RUIDO[tipo];
    if (alfa === undefined) fallo('ruido desconocido: ' + tipo + " ('blanco', 'rosa' o 'marron')");
    const r = comoAzar(azar, 7);
    let x;
    if (alfa === 0) { x = f64(n); for (let i = 0; i < n; i++) x[i] = r.normal(); }
    else {
      const N = Senal.siguientePotencia2(Math.max(2, n)), re = f64(N), im = f64(N);
      for (let i = 0; i < N; i++) re[i] = r.normal();
      fftPot2(re, im, false);
      re[0] = 0; im[0] = 0;
      for (let k = 1; k < N; k++) { const g = Math.pow(Math.min(k, N - k), -alfa / 2); re[k] *= g; im[k] *= g; }
      fftPot2(re, im, true);
      x = re.slice(0, n);
      const m = Senal.media(x);
      for (let i = 0; i < n; i++) x[i] -= m;
    }
    const v = Senal.rms(x);
    if (v > 0) for (let i = 0; i < n; i++) x[i] /= v;
    return x;
  };

  // Densidad espectral de potencia por el método de Welch: trozos de n muestras con solape, ventana, media de
  // los |FFT|². Quita la media de cada trozo. escala: 'densidad' (unidades²/Hz; ruido blanco de varianza σ²
  // → 2σ²/fs) o 'espectro' (un seno de amplitud A → A²/2). → { f, psd, psdDb, segmentos, n, df }.
  Senal.welch = function (x, fs, { n = 256, solape = 0.5, ventana = 'hann', nfft, escala = 'densidad', quitarMedia = true } = {}) {
    const L = x.length;
    n = Math.max(1, Math.min(Math.round(n), L));
    const salto = Math.max(1, Math.round(n * (1 - solape))), N = Math.max(n, nfft || n), w = Senal.ventana(ventana, n);
    let s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) { s1 += w[i]; s2 += w[i] * w[i]; }
    const nF = Math.floor(N / 2) + 1, acc = f64(nF), re = f64(N), im = f64(N);
    let K = 0;
    for (let s = 0; s + n <= L; s += salto, K++) {
      let m = 0;
      if (quitarMedia) { for (let i = 0; i < n; i++) m += x[s + i]; m /= n; }
      re.fill(0); im.fill(0);
      for (let i = 0; i < n; i++) re[i] = (x[s + i] - m) * w[i];
      fftGeneral(re, im, false);
      for (let k = 0; k < nF; k++) acc[k] += re[k] * re[k] + im[k] * im[k];
    }
    const f = f64(nF), psd = f64(nF), psdDb = f64(nF), norma = escala === 'espectro' ? s1 * s1 : fs * s2;
    for (let k = 0; k < nF; k++) {
      psd[k] = K ? (k === 0 || 2 * k === N ? 1 : 2) * acc[k] / (K * norma) : 0;
      psdDb[k] = dbDe(psd[k], 10);
      f[k] = k * fs / N;
    }
    return { f, psd, psdDb, segmentos: K, n, df: fs / N };
  };

  // ═══════════════════════════════════════════════════════════ Señal analítica y frecuencia instantánea

  // Señal analítica z = x + i·H{x} por FFT de la longitud de x (como scipy.signal.hilbert): re ≈ x, im = la sombra que
  // falta (de un coseno sale un seno). Los bordes sufren si la señal no cierra un número entero de ciclos.
  Senal.hilbert = function (x, { nfft } = {}) {
    const L = x.length, N = Math.max(1, nfft || L), re = f64(N), im = f64(N);
    for (let i = 0, m = Math.min(L, N); i < m; i++) re[i] = x[i];
    fftGeneral(re, im, false);
    for (let k = 1; k < N; k++) { const h = 2 * k < N ? 2 : 2 * k === N ? 1 : 0; re[k] *= h; im[k] *= h; }
    Senal.ifft(re, im);
    return { re: re.slice(0, L), im: im.slice(0, L) };
  };
  // Envolvente: módulo de la señal analítica (el radio de la noria). → Float64Array.
  Senal.envolvente = function (x) { const { re, im } = Senal.hilbert(x), y = f64(re.length); for (let i = 0; i < y.length; i++) y[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]); return y; };
  // Desenrolla una fase (rad): quita los saltos de 2π, como numpy.unwrap. → Float64Array.
  Senal.desenrollar = function (fase) {
    const n = fase.length, y = f64(n);
    if (!n) return y;
    y[0] = fase[0];
    let acc = 0;
    for (let i = 1; i < n; i++) {
      const dd = fase[i] - fase[i - 1];
      let dm = ((dd + PI) % DOS_PI + DOS_PI) % DOS_PI - PI;
      if (dm === -PI && dd > 0) dm = PI;
      if (Math.abs(dd) >= PI) acc += dm - dd;
      y[i] = fase[i] + acc;
    }
    return y;
  };
  // Fase instantánea (rad) de la señal analítica: desenrollada por defecto, o entre −π y π con { desenrollada: false }.
  Senal.faseInstantanea = function (x, { desenrollada = true } = {}) {
    const { re, im } = Senal.hilbert(x), f = f64(re.length);
    for (let i = 0; i < f.length; i++) f[i] = Math.atan2(im[i], re[i]);
    return desenrollada ? Senal.desenrollar(f) : f;
  };
  // Frecuencia instantánea (Hz) en cada muestra: ritmo de giro de la fase, media de las diferencias hacia delante y
  // hacia atrás (vale hasta fs/2 sin desenrollar). Con varias componentes pierde el sentido y puede salir negativa.
  Senal.frecuenciaInstantanea = function (x, fs) {
    const { re, im } = Senal.hilbert(x), n = re.length, f = f64(n);
    if (n < 2) return f;
    const k = fs / DOS_PI, paso = i => Math.atan2(im[i + 1] * re[i] - re[i + 1] * im[i], re[i + 1] * re[i] + im[i + 1] * im[i]);
    let prev = paso(0);
    f[0] = prev * k;
    for (let i = 1; i < n - 1; i++) { const d = paso(i); f[i] = (prev + d) / 2 * k; prev = d; }
    f[n - 1] = prev * k;
    return f;
  };

  // Ley de frecuencia de un chirp: función t (s) → Hz, con los mismos parámetros que Senal.chirp.
  Senal.chirpFi = function ({ f0 = 100, f1 = 1000, dur = 1, tipo = 'lineal' } = {}) {
    if (tipo === 'lineal') return t => f0 + (f1 - f0) * t / dur;
    if (tipo === 'cuadratico') return t => f0 + (f1 - f0) * (t / dur) * (t / dur);
    if (tipo === 'exponencial') return t => f0 * Math.pow(f1 / f0, t / dur);
    fallo('tipo de chirp desconocido: ' + tipo);
  };
  // Chirp amp·cos(fase): la frecuencia va de f0 a f1 Hz en dur s ('lineal', 'cuadratico' o 'exponencial').
  Senal.chirp = function ({ f0 = 100, f1 = 1000, fs = 8000, dur = 1, tipo = 'lineal', amp = 1, fase = 0 } = {}) {
    const n = muestras(fs, dur), x = f64(n), T = dur, k = f1 / f0, lk = Math.log(k);
    if (!['lineal', 'cuadratico', 'exponencial'].includes(tipo)) fallo('tipo de chirp desconocido: ' + tipo);
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      let c;
      if (tipo === 'lineal') c = f0 * t + (f1 - f0) * t * t / (2 * T);
      else if (tipo === 'cuadratico') c = f0 * t + (f1 - f0) * t * t * t / (3 * T * T);
      else c = Math.abs(k - 1) < 1e-12 ? f0 * t : f0 * T * (Math.pow(k, t / T) - 1) / lk;
      x[i] = amp * Math.cos(DOS_PI * c + fase);
    }
    return x;
  };
  // Señal modulada amp(t)·cos(fase(t)), con fase(t) = fase0 + 2π∫fi (trapecios). fi y amp: funciones de t (s) o
  // números. Sirve para AM, FM, sirenas, vibratos… → Float64Array.
  Senal.modulada = function ({ fs = 8000, dur = 1, fi = 440, amp = 1, fase0 = 0 } = {}) {
    const n = muestras(fs, dur), x = f64(n), F = typeof fi === 'function' ? fi : () => fi, A = typeof amp === 'function' ? amp : () => amp;
    let ph = fase0, fa = F(0);
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      if (i > 0) { const fc = F(t); ph += PI * (fa + fc) / fs; fa = fc; }
      x[i] = A(t) * Math.cos(ph);
    }
    return x;
  };
  // Onda gravitacional SINTÉTICA (chirp newtoniano): f(t) = f0·(tc/(tc − t))^(3/8) y amplitud ∝ f^(2/3) hasta fmax,
  // y después un final amortiguado (amortiguamiento en s). No son datos de LIGO: rotúlala «sintética».
  // → Float64Array, con x.verdad.fi (Hz por muestra).
  Senal.ondaGravitacional = function ({ fs = 4096, dur = 1, tc, f0 = 35, fmax = 300, amortiguamiento = 0.004, amp = 1 } = {}) {
    tc = tc === undefined ? 0.75 * dur : tc;
    const n = muestras(fs, dur), x = f64(n), fi = f64(n), tFin = tc * (1 - Math.pow(Math.min(1, f0 / fmax), 8 / 3));
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      let f, a;
      if (t < tFin) { f = f0 * Math.pow(tc / (tc - t), 3 / 8); a = Math.pow(f / fmax, 2 / 3); }
      else { f = fmax; a = Math.exp(-(t - tFin) / amortiguamiento); }
      if (i > 0) ph += PI * (fi[i - 1] + f) / fs;
      fi[i] = f; x[i] = amp * a * Math.cos(ph);
    }
    x.verdad = { fi: [fi] };
    return x;
  };

  // ═══════════════════════════════════════════════════════════ Wavelets continuas (Morlet)

  // n frecuencias espaciadas en escala logarítmica (como las octavas) o lineal. → Float64Array.
  Senal.frecuenciasLog = function (fmin, fmax, n) { const v = f64(n), r = n > 1 ? Math.log(fmax / fmin) / (n - 1) : 0; for (let i = 0; i < n; i++) v[i] = fmin * Math.exp(r * i); return v; };
  Senal.frecuenciasLineal = function (fmin, fmax, n) { const v = f64(n); for (let i = 0; i < n; i++) v[i] = n > 1 ? fmin + (fmax - fmin) * i / (n - 1) : fmin; return v; };
  function rejillaCwt(x, fs, frecuencias) {
    if (frecuencias) return Float64Array.from(frecuencias);
    const fmax = 0.45 * fs, fmin = Math.min(fmax / 4, Math.max(fs / 400, 20 * fs / Math.max(1, x.length)));
    return Senal.frecuenciasLog(fmin, fmax, 96);
  }
  // CWT con wavelet de Morlet analítica, por FFT. Con la wavelet en frecuencia 2·e^(−(s·ω − w0)²/2) y s = w0/(2πf),
  // un seno de amplitud A da |W| ≈ A en su fila. Opcionalmente, la derivada temporal (para el sincrosqueezing).
  function nucleoCwt(x, fs, opts, conDerivada) {
    const w0 = opts.w0 || 6, L = x.length, fr = rejillaCwt(x, fs, opts.frecuencias), nF = fr.length;
    let fmin = Infinity;
    for (const f of fr) if (f > 0 && f < fmin) fmin = f;
    if (!isFinite(fmin)) fallo('cwt: las frecuencias tienen que ser positivas');
    const pad = Math.ceil(4 * w0 / (DOS_PI * fmin) * fs) + 1, N = Senal.siguientePotencia2(L + Math.min(pad, 8 * L + 64));
    const Xr = f64(N), Xi = f64(N);
    for (let i = 0; i < L; i++) Xr[i] = x[i];
    fftPot2(Xr, Xi, false);
    const s = Math.max(1, Math.round(opts.salto || 1)), S = esPot2(s) && s < N ? s : 1, M = N / S, nT = Math.max(1, Math.ceil(L / s));
    const re = f32(nF * nT), im = f32(nF * nT), dre = conDerivada ? f32(nF * nT) : null, dim = conDerivada ? f32(nF * nT) : null;
    const yr = f64(M), yi = f64(M), dr = f64(conDerivada ? M : 0), di = f64(conDerivada ? M : 0), dw = DOS_PI * fs / N;
    for (let k = 0; k < nF; k++) {
      const esc = w0 / (DOS_PI * fr[k]);
      yr.fill(0); yi.fill(0);
      if (conDerivada) { dr.fill(0); di.fill(0); }
      const b0 = Math.max(1, Math.floor((w0 - 9) / esc / dw)), b1 = Math.min(N / 2, Math.ceil((w0 + 9) / esc / dw));
      for (let b = b0; b <= b1; b++) {
        const om = b * dw, u = esc * om - w0, g = 2 * Math.exp(-0.5 * u * u), q = b % M, pr = Xr[b] * g, pi = Xi[b] * g;
        yr[q] += pr; yi[q] += pi;
        if (conDerivada) { dr[q] -= om * pi; di[q] += om * pr; }  // por i·ω: derivada en el tiempo
      }
      fftPot2(yr, yi, true);
      if (conDerivada) fftPot2(dr, di, true);
      for (let j = 0, p = k * nT; j < nT; j++, p++) {
        const q = S > 1 ? j : j * s;
        re[p] = yr[q] / N; im[p] = yi[q] / N;
        if (conDerivada) { dre[p] = dr[q] / N; dim[p] = di[q] / N; }
      }
    }
    return { t: tiemposTF(nT, s, fs), f: fr, nT, nF, re, im, dre, dim, fs, w0, salto: s, longitud: L, escala: 1, tipo: 'cwt' };
  }
  // Transformada wavelet continua (Morlet, por FFT). frecuencias en Hz (por defecto, 96 en escala logarítmica hasta
  // 0,45·fs); w0: ciclos de la wavelet (6 por defecto; más, más finura en frecuencia). salto en muestras.
  // → TF { t, f, nT, nF, re, im } (fila k = frecuencias[k]); un seno de amplitud A da |W| ≈ A en su fila.
  Senal.cwt = function (x, fs, opts = {}) { const W = nucleoCwt(x, fs, opts, false); delete W.dre; delete W.dim; return W; };
  // Escalograma en dB (opciones de cwt, más suelo y ref). → { t, f, nT, nF, db, max }.
  Senal.escalograma = (x, fs, opts = {}) => Senal.mapaDb(Senal.cwt(x, fs, opts), opts);

  const cacheCpsi = new Map();
  function cPsi(w0) {  // ∫ ψ̂(ξ) dξ/ξ de la Morlet (constante de reconstrucción en escala logarítmica)
    if (cacheCpsi.has(w0)) return cacheCpsi.get(w0);
    let s = 0; const h = 0.001;
    for (let xi = h / 2; xi < w0 + 12; xi += h) s += Math.exp(-0.5 * (xi - w0) * (xi - w0)) / xi * h;
    cacheCpsi.set(w0, s);
    return s;
  }
  function pesosLog(fr) {  // paso logarítmico de cada fila
    const n = fr.length, d = f64(n);
    if (n === 1) { d[0] = 1; return d; }
    for (let k = 0; k < n; k++) {
      const a = Math.log(fr[Math.max(0, k - 1)]), b = Math.log(fr[Math.min(n - 1, k + 1)]);
      d[k] = Math.abs(b - a) / (k > 0 && k < n - 1 ? 2 : 1);
    }
    return d;
  }
  // Busca la fila más cercana de una rejilla creciente (lineal, logarítmica o cualquiera); −1 si cae fuera.
  function buscadorRejilla(fr) {
    const n = fr.length;
    if (n === 1) return () => 0;
    const d = (fr[n - 1] - fr[0]) / (n - 1);
    if (Math.abs(fr[1] - fr[0] - d) < 1e-9 * Math.abs(fr[n - 1]) && Math.abs(fr[n - 1] - fr[n - 2] - d) < 1e-9 * Math.abs(fr[n - 1])) {
      return f => { const k = Math.round((f - fr[0]) / d); return k >= 0 && k < n ? k : -1; };
    }
    if (fr[0] > 0) {
      const l0 = Math.log(fr[0]), dl = Math.log(fr[n - 1] / fr[0]) / (n - 1);
      if (Math.abs(Math.log(fr[1] / fr[0]) - dl) < 1e-9 && Math.abs(Math.log(fr[n - 1] / fr[n - 2]) - dl) < 1e-9) {
        return f => { if (!(f > 0)) return -1; const k = Math.round((Math.log(f) - l0) / dl); return k >= 0 && k < n ? k : -1; };
      }
    }
    return f => {
      if (!(f >= fr[0] - (fr[1] - fr[0]) / 2 && f <= fr[n - 1] + (fr[n - 1] - fr[n - 2]) / 2)) return -1;
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (fr[m] <= f) lo = m; else hi = m; }
      return f - fr[lo] <= fr[hi] - f ? lo : hi;
    };
  }

  // ═══════════════════════════════════════════════════════════ Wavelets discretas

  const WAVELETS = {
    haar: [Math.SQRT1_2, Math.SQRT1_2],
    db2: [0.48296291314469025, 0.836516303737469, 0.22414386804185735, -0.12940952255092145],
    db4: [0.23037781330885523, 0.7148465705525415, 0.6308807679295904, -0.02798376941698385,
      -0.18703481171888114, 0.030841381835986965, 0.032883011666982945, -0.010597401784997278],
  };
  function filtrosWavelet(nombre) {
    const h = WAVELETS[nombre];
    if (!h) fallo('wavelet desconocida: ' + nombre + " ('haar', 'db2' o 'db4')");
    const L = h.length;
    return { h, g: h.map((_, n) => (n % 2 ? -1 : 1) * h[L - 1 - n]) };
  }
  function pasoDwt(x, h, g) {
    const N = x.length, L = h.length, M = N / 2, a = f64(M), d = f64(M);
    for (let k = 0; k < M; k++) {
      let sa = 0, sd = 0;
      for (let j = 0; j < L; j++) { const v = x[(2 * k + j) % N]; sa += h[j] * v; sd += g[j] * v; }
      a[k] = sa; d[k] = sd;
    }
    return { a, d };
  }
  function pasoIdwt(a, d, h, g) {
    const M = a.length, N = 2 * M, L = h.length, x = f64(N);
    for (let k = 0; k < M; k++) for (let j = 0; j < L; j++) { const i = (2 * k + j) % N; x[i] += h[j] * a[k] + g[j] * d[k]; }
    return x;
  }
  // Transformada wavelet discreta (Mallat, periódica y ortogonal): 'haar', 'db2' o 'db4' (8 coeficientes, como en
  // PyWavelets). Si la longitud no es múltiplo de 2^niveles, se completa con el reflejo de la señal.
  // → { aprox, detalles: [nivel 1 (el más fino, la mitad de muestras), …, nivel «niveles»], wavelet, longitud, niveles }.
  Senal.dwt = function (x, niveles = 4, wavelet = 'haar') {
    const { h, g } = filtrosWavelet(wavelet), L0 = x.length;
    niveles = Math.max(0, Math.min(Math.round(niveles), Math.floor(Math.log2(Math.max(1, L0)))));
    const bloque = Math.pow(2, niveles), Lp = Math.ceil(L0 / bloque) * bloque;
    let a = f64(Lp);
    for (let i = 0; i < Lp; i++) a[i] = i < L0 ? x[i] : x[Math.max(0, 2 * L0 - 1 - i)];
    const detalles = [];
    for (let j = 0; j < niveles; j++) { const r = pasoDwt(a, h, g); detalles.push(r.d); a = r.a; }
    return { aprox: a, detalles, wavelet, longitud: L0, niveles };
  };
  // Inversa de dwt (reconstrucción perfecta). → Float64Array de la longitud original.
  Senal.idwt = function (coefs, wavelet) {
    const { h, g } = filtrosWavelet(wavelet || coefs.wavelet || 'haar');
    let a = coefs.aprox;
    for (let j = coefs.detalles.length - 1; j >= 0; j--) a = pasoIdwt(a, coefs.detalles[j], h, g);
    return coefs.longitud !== undefined ? a.slice(0, coefs.longitud) : Float64Array.from(a);
  };
  // Umbral: 'suave' (encoge hacia cero en t) o 'duro' (pone a cero lo que no pasa de t). → copia.
  Senal.umbral = function (c, t, modo = 'suave') {
    const y = f64(c.length);
    for (let i = 0; i < c.length; i++) { const v = c[i], a = Math.abs(v); y[i] = a <= t ? 0 : modo === 'duro' ? v : Math.sign(v) * (a - t); }
    return y;
  };
  // Umbral universal de Donoho y Johnstone: σ·√(2·ln N), con σ = mediana(|detalles del nivel 1|)/0,6745 y N el
  // número de muestras (por defecto, el doble de los detalles finos). Acepta la lista de detalles o un array.
  Senal.umbralUniversal = function (detalles, n) {
    const d1 = detalles && detalles.length && typeof detalles[0] === 'object' ? detalles[0] : detalles;
    const abs = Array.from(d1, Math.abs).sort((a, b) => a - b), m = abs.length;
    if (!m) return 0;
    const med = m % 2 ? abs[(m - 1) / 2] : (abs[m / 2 - 1] + abs[m / 2]) / 2;
    return med / 0.6745 * Math.sqrt(2 * Math.log(Math.max(2, n || 2 * m)));
  };
  // Limpieza por umbral wavelet: dwt, umbral universal (por factor) a todos los detalles e idwt. → Float64Array.
  Senal.limpiarWavelet = function (x, { wavelet = 'db4', niveles = 5, modo = 'suave', factor = 1 } = {}) {
    const c = Senal.dwt(x, niveles, wavelet), t = Senal.umbralUniversal(c.detalles, x.length) * factor;
    c.detalles = c.detalles.map(d => Senal.umbral(d, t, modo));
    return Senal.idwt(c);
  };

  // ═══════════════════════════════════════════════════════════ EMD

  // Spline cúbico natural por los puntos (xs crecientes, ys), evaluado en xq (número o array). → número o Float64Array.
  Senal.spline = function (xs, ys, xq) {
    const sp = prepararSpline(xs, ys), unico = typeof xq === 'number', q = unico ? [xq] : xq, y = f64(q.length);
    let ordenado = true;
    for (let i = 1; i < q.length; i++) if (q[i] < q[i - 1]) { ordenado = false; break; }
    if (ordenado) evaluarSplineOrdenado(sp, q, y);
    else for (let i = 0; i < q.length; i++) y[i] = evaluarSpline(sp, q[i], buscarIntervalo(sp.xs, q[i]));
    return unico ? y[0] : y;
  };
  function prepararSpline(xs, ys) {
    const n = xs.length, M = f64(n);
    if (n >= 3) {
      const m = n - 2, cp = f64(m), dp = f64(m);
      for (let r = 0; r < m; r++) {
        const h0 = xs[r + 1] - xs[r], h1 = xs[r + 2] - xs[r + 1];
        const diag = 2 * (h0 + h1), rhs = 6 * ((ys[r + 2] - ys[r + 1]) / h1 - (ys[r + 1] - ys[r]) / h0);
        if (r === 0) { cp[0] = h1 / diag; dp[0] = rhs / diag; }
        else { const den = diag - h0 * cp[r - 1]; cp[r] = h1 / den; dp[r] = (rhs - h0 * dp[r - 1]) / den; }
      }
      M[m] = dp[m - 1];
      for (let r = m - 2; r >= 0; r--) M[r + 1] = dp[r] - cp[r] * M[r + 2];
    }
    return { xs, ys, M, n };
  }
  function buscarIntervalo(xs, x) {
    let lo = 0, hi = xs.length - 1;
    if (x <= xs[0]) return 0;
    if (x >= xs[hi]) return Math.max(0, hi - 1);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    return lo;
  }
  function evaluarSpline(sp, x, i) {
    const { xs, ys, M, n } = sp;
    if (n === 0) return 0;
    if (n === 1) return ys[0];
    const h = xs[i + 1] - xs[i], A = (xs[i + 1] - x) / h, B = (x - xs[i]) / h;
    return A * ys[i] + B * ys[i + 1] + ((A * A * A - A) * M[i] + (B * B * B - B) * M[i + 1]) * h * h / 6;
  }
  function evaluarSplineOrdenado(sp, q, y) {
    const n = sp.n;
    let i = n > 1 ? buscarIntervalo(sp.xs, q[0]) : 0;
    for (let k = 0; k < q.length; k++) {
      while (i < n - 2 && q[k] > sp.xs[i + 1]) i++;
      y[k] = evaluarSpline(sp, q[k], i);
    }
  }
  // Extremos locales (con mesetas, el punto medio). → { maximos: [índices], minimos: [índices] }.
  Senal.extremos = function (x) {
    const maximos = [], minimos = [], n = x.length;
    let i = 1;
    while (i < n - 1) {
      if (x[i] !== x[i - 1]) {
        const sube = x[i] > x[i - 1];
        let j = i;
        while (j < n - 1 && x[j + 1] === x[i]) j++;
        if (j < n - 1 && (sube ? x[j + 1] < x[i] : x[j + 1] > x[i])) (sube ? maximos : minimos).push((i + j) >> 1);
        i = j + 1;
      } else i++;
    }
    return { maximos, minimos };
  };
  // Condiciones de borde de Rilling, Flandrin y Gonçalvès (2003): refleja nsim extremos en cada extremo.
  function bordesEmd(x, imax, imin, nsim) {
    const n = x.length, lx = n - 1, rev = a => a.slice().reverse(), tr = (a, i0, i1) => a.slice(Math.max(0, i0), Math.max(0, Math.min(a.length, i1)));
    let lmax, lmin, lsim;
    if (imax[0] < imin[0]) {
      if (x[0] > x[imin[0]]) { lmax = rev(tr(imax, 1, nsim + 1)); lmin = rev(tr(imin, 0, nsim)); lsim = imax[0]; }
      else { lmax = rev(tr(imax, 0, nsim)); lmin = rev(tr(imin, 0, nsim - 1)).concat([0]); lsim = 0; }
    } else if (x[0] < x[imax[0]]) { lmax = rev(tr(imax, 0, nsim)); lmin = rev(tr(imin, 1, nsim + 1)); lsim = imin[0]; }
    else { lmax = rev(tr(imax, 0, nsim - 1)).concat([0]); lmin = rev(tr(imin, 0, nsim)); lsim = 0; }
    let tlmin = lmin.map(p => 2 * lsim - p), tlmax = lmax.map(p => 2 * lsim - p);
    if ((tlmin.length && tlmin[0] > 0) || (tlmax.length && tlmax[0] > 0)) {
      if (lsim === imax[0]) lmax = rev(tr(imax, 0, nsim)); else lmin = rev(tr(imin, 0, nsim));
      lsim = 0; tlmin = lmin.map(p => -p); tlmax = lmax.map(p => -p);
    }
    const em = imax.length, en = imin.length;
    let rmax, rmin, rsim;
    if (imax[em - 1] < imin[en - 1]) {
      if (x[lx] < x[imax[em - 1]]) { rmax = rev(tr(imax, em - nsim, em)); rmin = rev(tr(imin, en - nsim - 1, en - 1)); rsim = imin[en - 1]; }
      else { rmax = [lx].concat(rev(tr(imax, em - nsim + 1, em))); rmin = rev(tr(imin, en - nsim, en)); rsim = lx; }
    } else if (x[lx] > x[imin[en - 1]]) { rmax = rev(tr(imax, em - nsim - 1, em - 1)); rmin = rev(tr(imin, en - nsim, en)); rsim = imax[em - 1]; }
    else { rmax = rev(tr(imax, em - nsim, em)); rmin = [lx].concat(rev(tr(imin, en - nsim + 1, en))); rsim = lx; }
    let trmin = rmin.map(p => 2 * rsim - p), trmax = rmax.map(p => 2 * rsim - p);
    if ((trmin.length && trmin[trmin.length - 1] < lx) || (trmax.length && trmax[trmax.length - 1] < lx)) {
      if (rsim === imax[em - 1]) rmax = rev(tr(imax, em - nsim, em)); else rmin = rev(tr(imin, en - nsim, en));
      rsim = lx; trmin = rmin.map(p => 2 * lx - p); trmax = rmax.map(p => 2 * lx - p);
    }
    const unir = (tl, l, idx, trr, r) => {
      const xs = [], ys = [];
      const meter = (p, v) => { if (!xs.length || p > xs[xs.length - 1]) { xs.push(p); ys.push(v); } };
      tl.forEach((p, i) => meter(p, x[l[i]])); idx.forEach(p => meter(p, x[p])); trr.forEach((p, i) => meter(p, x[r[i]]));
      return { xs, ys };
    };
    return { max: unir(tlmax, lmax, imax, trmax, rmax), min: unir(tlmin, lmin, imin, trmin, rmin) };
  }
  function envolventeSpline(pts, n) {
    const sp = prepararSpline(pts.xs, pts.ys), q = f64(n), y = f64(n);
    for (let i = 0; i < n; i++) q[i] = i;
    evaluarSplineOrdenado(sp, q, y);
    return y;
  }
  // Un paso de tamizado de la EMD: envolventes superior e inferior (splines por máximos y mínimos, con bordes
  // reflejados), su media y lo que queda al restarla. Con menos de tres extremos, valido = false y resto = x.
  // → { sup, inf, media, resto, maximos, minimos, valido }.
  Senal.tamizado = function (x) {
    const n = x.length, { maximos, minimos } = Senal.extremos(x);
    if (!maximos.length || !minimos.length || maximos.length + minimos.length < 3) {
      return { sup: Float64Array.from(x), inf: Float64Array.from(x), media: f64(n), resto: Float64Array.from(x), maximos, minimos, valido: false };
    }
    const b = bordesEmd(x, maximos, minimos, 2), sup = envolventeSpline(b.max, n), inf = envolventeSpline(b.min, n), media = f64(n), resto = f64(n);
    for (let i = 0; i < n; i++) { media[i] = (sup[i] + inf[i]) / 2; resto[i] = x[i] - media[i]; }
    return { sup, inf, media, resto, maximos, minimos, valido: true };
  };
  // Descomposición empírica en modos (Huang et al., 1998), con el criterio de parada de Rilling et al. (2003):
  // umbrales [θ1, θ2, α] = [0,05, 0,5, 0,05]. → { modos: [Float64Array] (del más rápido al más lento), residuo }.
  Senal.emd = function (x, { maxModos = 6, maxIter = 50, umbrales = [0.05, 0.5, 0.05] } = {}) {
    const n = x.length, modos = [], [th1, th2, alfa] = umbrales;
    let r = Float64Array.from(x);
    while (modos.length < maxModos) {
      const ex = Senal.extremos(r);
      if (ex.maximos.length + ex.minimos.length < 3 || !ex.maximos.length || !ex.minimos.length) break;
      let h = r;
      for (let it = 0; it < maxIter; it++) {
        const s = Senal.tamizado(h);
        if (!s.valido) break;
        let malos = 0, parar = true;
        for (let i = 0; i < n; i++) {
          const a = Math.abs(s.sup[i] - s.inf[i]) / 2, sg = a > 0 ? Math.abs(s.media[i]) / a : 0;
          if (sg > th1) malos++;
          if (sg > th2) { parar = false; break; }
        }
        if (parar && malos / n <= alfa) break;
        h = s.resto;
      }
      const m = Float64Array.from(h);
      modos.push(m);
      for (let i = 0; i < n; i++) r[i] -= m[i];
    }
    return { modos, residuo: r };
  };

  // ═══════════════════════════════════════════════════════════ Reasignación y sincrosqueezing

  // Espectrograma reasignado (Kodera, Gendrin y de Villedary; Auger y Flandrin, 1995). Cada casilla lleva su
  // energía a su centro de gravedad: t̂ = t + Re(X_tg/X_g)/fs y f̂ = f − (fs/2π)·Im(X_dg/X_g). Ventana 'gauss'
  // (sigma en muestras, n/6) o 'hann'. → { t, f, nT, nF, potencia (espectrograma, amplitud²), reasignada,
  //   tHat (s), fHat (Hz) } (Float32Array con el índice de los TF; donde no hay energía, tHat y fHat son los de su casilla).
  Senal.reasignacion = function (x, fs, opts = {}) {
    const { n, salto, nfft } = prepararTF(opts.n || 512, opts.salto, opts.nfft, m => m / 8);
    const L = x.length, nT = Math.max(1, Math.ceil(L / salto)), nF = nfft / 2 + 1, df = fs / nfft, nombre = nombreVentana(opts.ventana || 'gauss');
    const { g, dg, tg, sigma } = ventanasDerivadas(nombre, n, opts.sigma);
    let sg = 0; for (let i = 0; i < n; i++) sg += g[i];
    const e2 = (2 / sg) * (2 / sg), umbral = opts.umbral === undefined ? 1e-6 : opts.umbral, thr2 = Math.pow(umbral * Senal.pico(x) * sg / 2, 2);
    const potencia = f32(nF * nT), reasignada = f32(nF * nT), tHat = f32(nF * nT), fHat = f32(nF * nT);
    const bre = f64(nfft), bim = f64(nfft), cre = f64(nfft), cim = f64(nfft), o = {}, q = {}, kf = fs / DOS_PI;
    for (let j = 0; j < nT; j++) {
      const c = j * salto;
      cargarTrama2(x, c, g, dg, bre, bim, nfft);
      cargarTrama(x, c, tg, cre, nfft); cim.fill(0);
      fftPot2(bre, bim, false); fftPot2(cre, cim, false);
      for (let k = 0; k < nF; k++) {
        separar(bre, bim, k, nfft, o);
        const p = k * nT + j, Xr = o.ar, Xi = o.ai, m2 = Xr * Xr + Xi * Xi;
        potencia[p] = m2 * e2;
        if (m2 <= thr2 || m2 === 0) { tHat[p] = c / fs; fHat[p] = k * df; continue; }
        separar(cre, cim, k, nfft, q);
        const fh = k * df - kf * (o.bi * Xr - o.br * Xi) / m2, th = c + (q.ar * Xr + q.ai * Xi) / m2;
        tHat[p] = th / fs; fHat[p] = fh;
        const kk = Math.round(fh / df), jj = Math.round(th / salto);
        if (kk >= 0 && kk < nF && jj >= 0 && jj < nT) reasignada[kk * nT + jj] += m2 * e2;
      }
    }
    return { t: tiemposTF(nT, salto, fs), f: frecuenciasTF(nF, fs, nfft), nT, nF, potencia, reasignada, tHat, fHat,
      fs, n, salto, nfft, ventana: nombre, sigma, tipo: 'reasignacion' };
  };

  // Sincrosqueezing sobre la STFT (Thakur y Wu, 2011; Oberlin, Meignen y Perrier, 2014): cada casilla se mueve solo
  // en vertical, a la fila de su frecuencia instantánea f̂ = f − (fs/2π)·Im(X_dg/X_g), con su valor complejo.
  // Se normaliza para que un seno de amplitud A dé |T| ≈ A y para que reconstruirSst sea una suma.
  // Ventana 'gauss' (sigma en muestras; n/6) o 'hann'. umbral: relativo a lo que daría un seno con el pico de la señal;
  // lo que queda por debajo no se mueve ni entra en T. { fHat: false } ahorra memoria.
  // → TF { t, f, nT, nF, re, im, fHat (Hz, Float32Array; la propia frecuencia donde no se mueve) } con tipo 'sst'.
  Senal.sst = function (x, fs, opts = {}) {
    const { n, salto, nfft } = prepararTF(opts.n || 512, opts.salto || 1, opts.nfft, () => 1);
    const L = x.length, nT = Math.max(1, Math.ceil(L / salto)), nF = nfft / 2 + 1, df = fs / nfft, nombre = nombreVentana(opts.ventana || 'gauss');
    const { g, dg, sigma } = ventanasDerivadas(nombre, n, opts.sigma), gc = g[n >> 1];
    let sg = 0; for (let i = 0; i < n; i++) sg += g[i];
    const umbral = opts.umbral === undefined ? 1e-4 : opts.umbral, thr2 = Math.pow(umbral * Senal.pico(x) * sg / 2, 2);
    const re = f32(nF * nT), im = f32(nF * nT), FH = opts.fHat === false ? null : f32(nF * nT);
    const bre = f64(nfft), bim = f64(nfft), cMed = 2 / (nfft * gc), cExt = 1 / (nfft * gc), kf = fs / DOS_PI, mask = nfft - 1;
    for (let j = 0; j < nT; j++) {
      cargarTrama2(x, j * salto, g, dg, bre, bim, nfft);
      fftPot2(bre, bim, false);
      for (let k = 0; k < nF; k++) {
        const k2 = (nfft - k) & mask, zr = bre[k], zi = bim[k], wr = bre[k2], wi = bim[k2];
        const Xr = (zr + wr) / 2, Xi = (zi - wi) / 2, m2 = Xr * Xr + Xi * Xi, p = k * nT + j;
        if (m2 <= thr2 || m2 === 0) { if (FH) FH[p] = k * df; continue; }
        const Dr = (zi + wi) / 2, Di = (wr - zr) / 2, fh = k * df - kf * (Di * Xr - Dr * Xi) / m2;
        if (FH) FH[p] = fh;
        const kk = Math.round(fh / df);
        if (kk < 0 || kk >= nF) continue;
        const c = k === 0 || k === nF - 1 ? cExt : cMed, q = kk * nT + j;
        re[q] += c * Xr; im[q] += c * Xi;
      }
    }
    return { t: tiemposTF(nT, salto, fs), f: frecuenciasTF(nF, fs, nfft), nT, nF, re, im, fHat: FH, fs, n, salto, nfft,
      ventana: nombre, sigma, longitud: L, escala: 1, tipo: 'sst' };
  };

  // Sincrosqueezing sobre wavelets de Morlet (Daubechies, Lu y Wu, 2011): f̂ = Im(∂_t W / W)/2π y cada casilla va a la
  // frecuencia más cercana de la rejilla (las mismas «frecuencias» de cwt). Para reconstruir bien una componente, la
  // rejilla tiene que cubrir de ~0,7× a ~1,8× su frecuencia (con w0 = 6). → TF con tipo 'sstCwt' (y fHat).
  Senal.sstCwt = function (x, fs, opts = {}) {
    const W = nucleoCwt(x, fs, opts, true), { nF, nT, f: fr } = W, re = f32(nF * nT), im = f32(nF * nT), FH = f32(nF * nT);
    const du = pesosLog(fr), C = cPsi(W.w0), umbral = opts.umbral === undefined ? 1e-4 : opts.umbral, thr2 = Math.pow(umbral * Senal.pico(x), 2), buscar = buscadorRejilla(fr);
    for (let k = 0; k < nF; k++) {
      const c = du[k] / C;
      for (let j = 0, p = k * nT; j < nT; j++, p++) {
        const wr = W.re[p], wi = W.im[p], m2 = wr * wr + wi * wi;
        if (m2 <= thr2 || m2 === 0) { FH[p] = fr[k]; continue; }
        const fh = (W.dim[p] * wr - W.dre[p] * wi) / m2 / DOS_PI;
        FH[p] = fh;
        const l = buscar(fh);
        if (l < 0) continue;
        const q = l * nT + j;
        re[q] += c * wr; im[q] += c * wi;
      }
    }
    return { t: W.t, f: fr, nT, nF, re, im, fHat: FH, fs, w0: W.w0, salto: W.salto, longitud: W.longitud, escala: 1, tipo: 'sstCwt' };
  };

  // Reconstruye la parte de la señal que hay en una banda de un TF de sincrosqueezing (sst o sstCwt); también vale
  // para una STFT (sin comprimir) y para una CWT (fórmula de Morlet). banda: [f1, f2] en Hz, { cresta, ancho }
  // (filas de una cresta, ± ancho filas; 2 por defecto) o nada (todo). → Float64Array, una muestra por columna
  // (con salto 1, la señal a su fs original).
  Senal.reconstruirSst = function (T, banda) {
    const { nF, nT } = T, y = f64(nT), peso = f64(nF);
    if (T.tipo === 'stft') { for (let k = 0; k < nF; k++) peso[k] = (k === 0 || k === nF - 1 ? 1 : 2) / (T.nfft * (T.gc || 1)); }
    else if (T.tipo === 'cwt') { const du = pesosLog(T.f), C = cPsi(T.w0 || 6); for (let k = 0; k < nF; k++) peso[k] = du[k] / C; }
    else peso.fill(1);
    let desde = () => 0, hasta = () => nF - 1;
    if (Array.isArray(banda) || (banda && banda.length === 2 && !banda.cresta)) {
      let k1 = 0; while (k1 < nF && T.f[k1] < banda[0]) k1++;
      let k2 = nF - 1; while (k2 >= 0 && T.f[k2] > banda[1]) k2--;
      desde = () => k1; hasta = () => k2;
    } else if (banda && banda.cresta) {
      const a = banda.ancho === undefined ? 2 : banda.ancho, c = banda.cresta;
      desde = j => Math.max(0, c[j] - a); hasta = j => Math.min(nF - 1, c[j] + a);
    }
    for (let j = 0; j < nT; j++) { let s = 0; for (let k = desde(j), k2 = hasta(j); k <= k2; k++) s += peso[k] * T.re[k * nT + j]; y[j] = s; }
    return y;
  };
  // Inversa de una CWT de Morlet (fórmula de un solo sumatorio); mismo uso que reconstruirSst. → Float64Array.
  Senal.icwt = (W, banda) => Senal.reconstruirSst(W, banda);

  // Distribución de Wigner-Ville seudosuavizada en el retardo (ventana de n), sobre la señal analítica: nítida para un
  // chirp, con fantasmas entre componentes. re ≈ A² en un tono de amplitud A (puede ser negativa); im = 0.
  // → TF { t, f, nT, nF, re, im } con nF = n, de 0 a fs/2 en pasos de fs/(2n); tipo 'wigner'. Coste: nT FFT de n.
  Senal.wignerVille = function (x, fs, { n = 256, salto, ventana = 'hann' } = {}) {
    n = Senal.siguientePotencia2(Math.max(4, n)); salto = Math.max(1, Math.round(salto || n / 8));
    const z = Senal.hilbert(x), L = x.length, nT = Math.max(1, Math.ceil(L / salto)), h = ventanaTF(ventana, n), half = n / 2;
    let sh = 0; for (let i = 0; i < n; i++) sh += h[i];
    const W = f32(n * nT), br = f64(n), bi = f64(n);
    for (let j = 0; j < nT; j++) {
      const t = j * salto;
      br.fill(0); bi.fill(0);
      for (let m = -half + 1; m < half; m++) {
        const a = t + m, b = t - m;
        if (a < 0 || a >= L || b < 0 || b >= L) continue;
        const w = h[m + half] / sh, idx = m >= 0 ? m : n + m;
        br[idx] = (z.re[a] * z.re[b] + z.im[a] * z.im[b]) * w; bi[idx] = (z.im[a] * z.re[b] - z.re[a] * z.im[b]) * w;
      }
      fftPot2(br, bi, false);
      for (let k = 0; k < n; k++) W[k * nT + j] = br[k];
    }
    const f = f64(n); for (let k = 0; k < n; k++) f[k] = k * fs / (2 * n);
    return { t: tiemposTF(nT, salto, fs), f, nT, nF: n, re: W, im: f32(n * nT), fs, n, salto, escala: 1, tipo: 'wigner' };
  };

  // ═══════════════════════════════════════════════════════════ Crestas y tono

  // Mínimo de f[q] + λ·(k − q)² para cada k en O(n) (transformada de distancia de Felzenszwalb y Huttenlocher).
  function minConvolucion(f, n, lam, d, arg, v, z) {
    if (!(lam > 0)) {
      let m = 0; for (let q = 1; q < n; q++) if (f[q] < f[m]) m = q;
      for (let q = 0; q < n; q++) { d[q] = f[m]; arg[q] = m; }
      return;
    }
    let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + lam * q * q) - (f[v[k]] + lam * v[k] * v[k])) / (2 * lam * (q - v[k]));
      while (s <= z[k]) { k--; s = ((f[q] + lam * q * q) - (f[v[k]] + lam * v[k] * v[k])) / (2 * lam * (q - v[k])); }
      k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const dq = q - v[k]; d[q] = lam * dq * dq + f[v[k]]; arg[q] = v[k]; }
  }
  // Cresta por programación dinámica: el camino (una fila por columna) que minimiza Σ −ln(energía/máx) +
  // penalizacion·Σ (salto de filas)². Penalización baja: sigue cambios rápidos pero salta al ruido; alta: no salta.
  // energia: Float32Array(nF·nT) con el índice de los TF (por ejemplo, Senal.potencia(T)). { log: false } usa la
  // energía normalizada en lineal. → Int32Array(nT) con la fila de cada columna.
  Senal.cresta = function (energia, nF, nT, { penalizacion = 1, log = true, piso = 1e-10 } = {}) {
    let emax = 0;
    for (let i = 0; i < nF * nT; i++) if (energia[i] > emax) emax = energia[i];
    const coste = f64(nF), D = f64(nF), Dn = f64(nF), arg = new Int32Array(nF), v = new Int32Array(nF), z = f64(nF + 1);
    const atras = nF < 65536 ? new Uint16Array(nF * nT) : new Int32Array(nF * nT), c = new Int32Array(nT);
    const llenar = j => { for (let k = 0; k < nF; k++) { const e = emax > 0 ? energia[k * nT + j] / emax : 0; coste[k] = log ? -Math.log(e + piso) : -e; } };
    if (!nT || !nF) return c;
    llenar(0); D.set(coste);
    for (let j = 1; j < nT; j++) {
      minConvolucion(D, nF, penalizacion, Dn, arg, v, z);
      llenar(j);
      for (let k = 0; k < nF; k++) { D[k] = Dn[k] + coste[k]; atras[k * nT + j] = arg[k]; }
    }
    let kb = 0;
    for (let k = 1; k < nF; k++) if (D[k] < D[kb]) kb = k;
    c[nT - 1] = kb;
    for (let j = nT - 1; j > 0; j--) c[j - 1] = atras[c[j] * nT + j];
    return c;
  };
  // Cresta voraz: arranca en el máximo global y, columna a columna, toma el máximo a ±maxSalto filas de la anterior.
  // Barata y miope: se pierde en cruces y huecos. → Int32Array(nT).
  Senal.crestaVoraz = function (energia, nF, nT, { maxSalto = 2 } = {}) {
    const c = new Int32Array(nT);
    if (!nT || !nF) return c;
    let im = 0;
    for (let i = 1; i < nF * nT; i++) if (energia[i] > energia[im]) im = i;
    const k0 = Math.floor(im / nT), j0 = im % nT;
    c[j0] = k0;
    const paso = (j, k) => { let b = k; for (let q = Math.max(0, k - maxSalto); q <= Math.min(nF - 1, k + maxSalto); q++) if (energia[q * nT + j] > energia[b * nT + j]) b = q; return b; };
    for (let j = j0 + 1; j < nT; j++) c[j] = paso(j, c[j - 1]);
    for (let j = j0 - 1; j >= 0; j--) c[j] = paso(j, c[j + 1]);
    return c;
  };
  // Varias crestas: saca la mejor, borra ±anchoBorrado filas a su alrededor y repite n veces. → [Int32Array].
  Senal.crestas = function (energia, nF, nT, opts = {}, n = 2, anchoBorrado = 3) {
    if (opts.n !== undefined) n = opts.n;
    if (opts.anchoBorrado !== undefined) anchoBorrado = opts.anchoBorrado;
    const e = Float32Array.from(energia), lista = [];
    for (let r = 0; r < n; r++) {
      const c = Senal.cresta(e, nF, nT, opts);
      lista.push(c);
      for (let j = 0; j < nT; j++) for (let k = Math.max(0, c[j] - anchoBorrado); k <= Math.min(nF - 1, c[j] + anchoBorrado); k++) e[k * nT + j] = 0;
    }
    return lista;
  };
  // Filas de una cresta → valores de un eje (normalmente T.f, en Hz). → Float64Array.
  Senal.crestaFrecuencias = function (cresta, f) { const y = f64(cresta.length); for (let j = 0; j < cresta.length; j++) y[j] = f[cresta[j]]; return y; };

  // YIN (de Cheveigné y Kawahara, 2002): diferencia cuadrática, normalización por la media acumulada, primer mínimo
  // por debajo del umbral e interpolación parabólica. n: ventana de integración (muestras; ≥ un periodo de fmin,
  // 25 ms por defecto); salto en muestras (10 ms). → { t (centro de la ventana, s), f0 (Hz; NaN si no hay tono),
  // confianza (1 − d′, entre 0 y 1), candidato (el mínimo global aunque no pase el umbral) }.
  // Un umbral alto con un segundo armónico fuerte da el error de octava (la mitad del periodo: una octava arriba).
  Senal.yin = function (x, fs, { fmin = 60, fmax = 1000, umbral = 0.1, n, salto } = {}) {
    const L = x.length, tauMax = Math.max(3, Math.min(Math.ceil(fs / fmin), L - 2)), tauMin = Math.max(2, Math.floor(fs / fmax));
    const W = Math.round(n || Math.max(tauMax, Math.round(0.025 * fs))), hop = Math.max(1, Math.round(salto || 0.01 * fs));
    const nFr = L >= W + tauMax ? Math.floor((L - W - tauMax) / hop) + 1 : 0;
    const t = f64(nFr), f0 = f64(nFr), confianza = f64(nFr), candidato = f64(nFr), d = f64(tauMax + 2), dp = f64(tauMax + 2);
    for (let j = 0; j < nFr; j++) {
      const s = j * hop;
      t[j] = (s + W / 2) / fs;
      let e = 0;
      for (let i = 0; i < W; i++) e += x[s + i] * x[s + i];
      if (e < 1e-10 * W) { f0[j] = NaN; candidato[j] = NaN; continue; }
      for (let tau = 1; tau <= tauMax; tau++) { let acc = 0; for (let i = 0; i < W; i++) { const df = x[s + i] - x[s + i + tau]; acc += df * df; } d[tau] = acc; }
      dp[0] = 1;
      let cum = 0;
      for (let tau = 1; tau <= tauMax; tau++) { cum += d[tau]; dp[tau] = cum > 0 ? d[tau] * tau / cum : 1; }
      let tau = -1;
      for (let k = tauMin; k <= tauMax; k++) if (dp[k] < umbral) { while (k + 1 <= tauMax && dp[k + 1] < dp[k]) k++; tau = k; break; }
      const sonoro = tau > 0;
      if (!sonoro) { tau = tauMin; for (let k = tauMin + 1; k <= tauMax; k++) if (dp[k] < dp[tau]) tau = k; }
      let tf = tau;
      if (tau > 1 && tau < tauMax) { const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a - 2 * b + c; if (den > 0) tf = tau + 0.5 * (a - c) / den; }
      candidato[j] = fs / tf; f0[j] = sonoro ? fs / tf : NaN; confianza[j] = limitarA(1 - dp[tau], 0, 1);
    }
    return { t, f0, confianza, candidato };
  };
  // Tono de toda la señal por autocorrelación: el pico más alto entre los retrasos de fmax y fmin (criterio 'maximo') o
  // el primero que llega al 90 % de ese máximo ('primero'). → { f0 (Hz), periodo (s), retraso (muestras), valor (r normalizada) }.
  Senal.tonoAutocorrelacion = function (x, fs, { fmin = 60, fmax = 1000, criterio = 'maximo' } = {}) {
    const lmax = Math.min(x.length - 2, Math.ceil(fs / fmin)), lmin = Math.max(1, Math.floor(fs / fmax));
    const r = Senal.autocorrelacion(x, lmax + 1, true), picos = [];
    for (let l = Math.max(1, lmin); l <= lmax; l++) if (r[l] >= r[l - 1] && r[l] > r[l + 1]) picos.push(l);
    if (!picos.length) return { f0: NaN, periodo: NaN, retraso: NaN, valor: 0 };
    let best = picos[0];
    for (const l of picos) if (r[l] > r[best]) best = l;
    if (criterio === 'primero') { const umbralP = 0.9 * r[best]; for (const l of picos) if (r[l] >= umbralP) { best = l; break; } }
    const p = Senal.interpolarPico(r, best);
    return { f0: fs / p.x, periodo: p.x / fs, retraso: p.x, valor: p.y };
  };

  // Máximos locales de y (índices, de izquierda a derecha). { umbral } mínimo; { minDistancia } en muestras (gana el más
  // alto); { max } se queda con los más altos. → [índices].
  Senal.picos = function (y, { umbral = -Infinity, minDistancia = 1, max = Infinity } = {}) {
    let c = [];
    for (let i = 1; i < y.length - 1; i++) if (y[i] > umbral && y[i] >= y[i - 1] && y[i] > y[i + 1]) c.push(i);
    if (minDistancia > 1 || max < c.length) {
      const orden = c.slice().sort((a, b) => y[b] - y[a]), elegidos = [];
      for (const i of orden) {
        if (elegidos.length >= max) break;
        if (elegidos.every(j => Math.abs(i - j) >= minDistancia)) elegidos.push(i);
      }
      c = elegidos.sort((a, b) => a - b);
    }
    return c;
  };
  // Afina la posición de un pico con una parábola por tres puntos. → { x (índice fraccionario), y }.
  Senal.interpolarPico = function (y, i) {
    if (i <= 0 || i >= y.length - 1) return { x: i, y: y[i] };
    const a = y[i - 1], b = y[i], c = y[i + 1], den = a - 2 * b + c;
    if (den === 0) return { x: i, y: b };
    const d = 0.5 * (a - c) / den;
    return { x: i + d, y: b - 0.25 * (a - c) * d };
  };

  // ═══════════════════════════════════════════════════════════ 2D, remuestreo y recortes

  function fft2d(re, im, ancho, alto, inversa) {
    const fr = f64(ancho), fi = f64(ancho), cr = f64(alto), ci = f64(alto);
    for (let y = 0; y < alto; y++) {
      const o = y * ancho;
      for (let x = 0; x < ancho; x++) { fr[x] = re[o + x]; fi[x] = im[o + x]; }
      fftGeneral(fr, fi, inversa);
      for (let x = 0; x < ancho; x++) { re[o + x] = fr[x]; im[o + x] = fi[x]; }
    }
    for (let x = 0; x < ancho; x++) {
      for (let y = 0; y < alto; y++) { cr[y] = re[y * ancho + x]; ci[y] = im[y * ancho + x]; }
      fftGeneral(cr, ci, inversa);
      for (let y = 0; y < alto; y++) { re[y * ancho + x] = cr[y]; im[y * ancho + x] = ci[y]; }
    }
    if (inversa) { const k = ancho * alto; for (let i = 0; i < k; i++) { re[i] /= k; im[i] /= k; } }
    return { re, im };
  }
  // FFT 2D en el sitio de una imagen por filas (índice y·ancho + x). → { re, im }.
  Senal.fft2 = (re, im, ancho, alto) => fft2d(re, im, ancho, alto, false);
  // FFT 2D inversa en el sitio, escalada por 1/(ancho·alto).
  Senal.ifft2 = (re, im, ancho, alto) => fft2d(re, im, ancho, alto, true);
  // Convolución 2D directa del mismo tamaño que la imagen (núcleo de kAncho × kAlto por filas, centrado). Bordes:
  // 'repetir' (por defecto, sin oscurecer los bordes) o 'cero'. Coste: píxeles × núcleo. → Float64Array.
  Senal.convolucion2 = function (img, ancho, alto, nucleo, kAncho, kAlto, { borde = 'repetir' } = {}) {
    const out = f64(ancho * alto), cx = kAncho >> 1, cy = kAlto >> 1, cero = borde === 'cero';
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
      let s = 0;
      for (let j = 0; j < kAlto; j++) {
        let yy = y + cy - j;
        if (yy < 0 || yy >= alto) { if (cero) continue; yy = yy < 0 ? 0 : alto - 1; }
        for (let i = 0; i < kAncho; i++) {
          let xx = x + cx - i;
          if (xx < 0 || xx >= ancho) { if (cero) continue; xx = xx < 0 ? 0 : ancho - 1; }
          s += img[yy * ancho + xx] * nucleo[j * kAncho + i];
        }
      }
      out[y * ancho + x] = s;
    }
    return out;
  };

  // Cambia la frecuencia de muestreo de fsDe a fsA (Hz) con interpolación de banda limitada (sinc con ventana de
  // Kaiser, corte en el 95 % de la Nyquist menor). { filtro: false } interpola sin filtro antialias (para OÍR el
  // aliasing). Ojo: el navegador no reproduce por debajo de 3.000 Hz; vuelve a subir la señal antes de oírla.
  Senal.remuestrear = function (x, fsDe, fsA, { filtro = true, ceros = 16 } = {}) {
    const L = x.length, nOut = Math.max(0, Math.round(L * fsA / fsDe)), y = f64(nOut), paso = fsDe / fsA;
    if (fsDe === fsA) return Float64Array.from(x);
    if (!L) return y;
    if (!filtro) {
      for (let m = 0; m < nOut; m++) { const u = m * paso, i = Math.floor(u), fr = u - i, a = x[Math.min(i, L - 1)], b = x[Math.min(i + 1, L - 1)]; y[m] = a + (b - a) * fr; }
      return y;
    }
    const rho = Math.min(1, fsA / fsDe) * 0.95, Z = ceros, RES = 128, beta = 8, I0b = besselI0(beta), tab = f64(Z * RES + 2), ancho = Z / rho;
    for (let i = 0; i < tab.length; i++) { const v = i / RES, r = v / Z; tab[i] = r >= 1 ? 0 : sinc(v) * besselI0(beta * Math.sqrt(1 - r * r)) / I0b; }
    for (let m = 0; m < nOut; m++) {
      const u = m * paso, i0 = Math.max(0, Math.ceil(u - ancho)), i1 = Math.min(L - 1, Math.floor(u + ancho));
      let s = 0, ws = 0;
      for (let i = i0; i <= i1; i++) {
        const v = Math.abs(u - i) * rho * RES, k = Math.floor(v);
        if (k >= tab.length - 1) continue;
        const w = tab[k] + (tab[k + 1] - tab[k]) * (v - k);
        s += x[i] * w; ws += w;
      }
      y[m] = ws > 0 ? s / ws : 0;
    }
    return y;
  };
  // Trozo de una señal: desde y hasta en muestras (como slice) o, si das fs, en segundos. → copia.
  Senal.recortar = function (x, desde = 0, hasta, fs) {
    const k = fs ? fs : 1;
    let a = Math.round(desde * k), b = hasta === undefined ? x.length : Math.round(hasta * k);
    a = limitarA(a, 0, x.length); b = limitarA(b, a, x.length);
    const y = f64(b - a);
    for (let i = a; i < b; i++) y[i - a] = x[i];
    return y;
  };

  // ═══════════════════════════════════════════════════════════ Notas musicales

  const NOTAS = { do: 0, c: 0, re: 2, d: 2, mi: 4, e: 4, fa: 5, f: 5, sol: 7, g: 7, la: 9, a: 9, si: 11, b: 11 };
  const NOMBRES_NOTA = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const NOMBRES_NOTA_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  // Idioma de la página (<html lang="en…"> → inglés). Senal también corre en Node, donde no hay document: español.
  const enIngles = () => { try { return typeof document !== 'undefined' && !!document.documentElement && /^en/i.test((document.documentElement.getAttribute('lang') || '').trim()); } catch (e) { return false; } };
  // Frecuencia (Hz) de una nota: 'La4' = 'A4' = 440 Hz, 'Do4' = 261,63 Hz, 'Sib3', 'F#5'… (un número pasa tal cual).
  Senal.nota = function (nombre) {
    if (typeof nombre === 'number') return nombre;
    const m = /^\s*(do|re|mi|fa|sol|la|si|[a-g])\s*([#♯b♭]?)\s*(-?\d+)\s*$/i.exec(String(nombre));
    if (!m) fallo('nota no reconocida: ' + nombre + " (por ejemplo, 'La4', 'Do#5' o 'A4')");
    let st = NOTAS[m[1].toLowerCase()];
    if (m[2] === '#' || m[2] === '♯') st++; else if (m[2] === 'b' || m[2] === '♭') st--;
    return 440 * Math.pow(2, (12 * (parseInt(m[3], 10) + 1) + st - 69) / 12);
  };
  // Nota más cercana a una frecuencia. → { nombre ('La4'), midi, cents (desviación, de −50 a 50), frecuencia (la exacta) }.
  Senal.nombreNota = function (f) {
    const v = 69 + 12 * Math.log2(f / 440), midi = Math.round(v);
    return { nombre: (enIngles() ? NOMBRES_NOTA_EN : NOMBRES_NOTA)[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1), midi, cents: 100 * (v - midi), frecuencia: 440 * Math.pow(2, (midi - 69) / 12) };
  };

  // ═══════════════════════════════════════════════════════════ Ejemplos sintéticos

  // Todos son deterministas (opción semilla), devuelven Float64Array con pico ≤ 1 y aceptan (fs, opciones), con
  // fs = 16.000 Hz por defecto. Los que tienen tono llevan x.verdad = { fi: [Hz por muestra, NaN en silencio] } y, si
  // son varias componentes, también x.verdad.componentes (cada una por separado, a la misma escala que x).
  const EJ = {}, FS_DEF = 16000;
  function terminar(x, pico, verdad) {
    const m = Senal.pico(x), k = m > 0 ? pico / m : 1;
    for (let i = 0; i < x.length; i++) x[i] *= k;
    if (verdad) { if (verdad.componentes) verdad.componentes = verdad.componentes.map(c => Senal.escalar(c, k)); x.verdad = verdad; }
    return x;
  }
  function fundido(env, fs, ataque, caida) {  // fundidos de coseno alzado, en el sitio
    const n = env.length, na = Math.min(n, Math.round(ataque * fs)), nc = Math.min(n, Math.round(caida * fs));
    for (let i = 0; i < na; i++) env[i] *= 0.5 - 0.5 * Math.cos(PI * i / na);
    for (let i = 0; i < nc; i++) env[n - 1 - i] *= 0.5 - 0.5 * Math.cos(PI * i / nc);
    return env;
  }
  function ruidoLento(n, fs, fc, az) {  // ruido gaussiano suavizado (paso bajo de un polo en fc), RMS ≈ 1
    const y = f64(n), a = Math.exp(-DOS_PI * fc / fs), g = Math.sqrt(1 - a * a);
    let v = az.normal();
    for (let i = 0; i < n; i++) { v = a * v + g * az.normal(); y[i] = v; }
    return y;
  }
  function ruidoBanda(n, fs, fc, Q, az) {
    const w = f64(n);
    for (let i = 0; i < n; i++) w[i] = az.normal();
    const bq = Senal.biquad('pasoBanda', Math.min(fc, 0.42 * fs), fs, { Q });
    return lfilter(bq.b, bq.a, w);
  }
  // Silbido: casi un seno puro (segundo armónico a −32 dB) con pequeñas fluctuaciones de amplitud. El soplo es sobre
  // todo ruido estrecho alrededor del tono (la boca resuena en esa nota; unos 26 dB por debajo) y un siseo ancho débil
  // (unos 41 dB por debajo). Ojo: ese siseo basta para ensuciar la frecuencia instantánea por Hilbert; filtra antes.
  function silbar(fs, fi, amp, az, { soplo = 0.035, siseo = 0.006, armonico = 0.025 } = {}) {
    const n = fi.length, x = f64(n), jit = ruidoLento(n, fs, 18, az), ancho = ruidoBanda(n, fs, 0.3 * fs, 0.6, az), ra = Senal.rms(ancho) || 1, Q = 8;
    let ph = az.real(0, DOS_PI), bq = null, g = 1, z0 = 0, z1 = 0;
    for (let i = 0; i < n; i++) {
      if ((i & 31) === 0) { const fc = limitarA(fi[i], 50, 0.45 * fs); bq = Senal.biquad('pasoBanda', fc, fs, { Q }); g = Math.sqrt(fs * Q / (PI * fc)); }
      const w = az.normal(), o = bq.b[0] * w + z0;
      z0 = bq.b[1] * w - bq.a[1] * o + z1; z1 = bq.b[2] * w - bq.a[2] * o;
      ph += DOS_PI * fi[i] / fs;
      if (ph > DOS_PI) ph -= DOS_PI;
      const a = amp[i] * (1 + 0.04 * jit[i]);
      x[i] = a * (Math.sin(ph) + (2 * fi[i] < 0.45 * fs ? armonico * Math.sin(2 * ph + 0.5) : 0)) + amp[i] * (soplo * g * o + siseo * ancho[i] / ra);
    }
    return x;
  }
  function verdadFi(fi, amp, minimo = 0.05) { const v = Float64Array.from(fi); for (let i = 0; i < v.length; i++) if (amp[i] < minimo) v[i] = NaN; return v; }

  // Silencio de la habitación: ruido de fondo de color (rosa y marrón), soplido del micrófono y, si zumbido, la red
  // eléctrica (red = 50 Hz, con armónicos 100, 150 y 250). Nivel bajo y realista: no se normaliza.
  EJ.silencio = function (fs = FS_DEF, { dur = 3, zumbido = true, red = 50, semilla = 101 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), rosa = Senal.ruido('rosa', n, az), marron = Senal.ruido('marron', n, az), x = f64(n);
    const tonos = zumbido ? [[1, 0.004, 0], [2, 0.0012, 1], [3, 0.002, 2], [5, 0.0007, 0.5]] : [];
    for (let i = 0; i < n; i++) {
      let v = 0.003 * rosa[i] + 0.002 * marron[i] + 0.0008 * az.normal();
      for (const [h, a, ph] of tonos) if (h * red < fs / 2) v += a * Math.sin(DOS_PI * h * red * i / fs + ph);
      x[i] = v;
    }
    return fundido(x, fs, 0.01, 0.01);
  };
  // Silbido sostenido en una nota (f = 880 Hz, La5): casi senoidal, con vibrato leve (±0,5 %) y soplo.
  EJ.silbido = function (fs = FS_DEF, { f = 880, dur = 3, vibrato = 0.005, semilla = 11 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), fi = f64(n), amp = f64(n), der = ruidoLento(n, fs, 1.5, az), fv = 5.2 + az.real(-0.3, 0.3);
    for (let i = 0; i < n; i++) { const t = i / fs; fi[i] = f * (1 + vibrato * Math.sin(DOS_PI * fv * t) * Math.min(1, t / 0.4) + 0.002 * der[i]); amp[i] = 1; }
    fundido(amp, fs, 0.08, 0.15);
    return terminar(silbar(fs, fi, amp, az), 0.8, { fi: [verdadFi(fi, amp)] });
  };
  // Silbido que sube y baja despacio, de fMin a fMax y vuelta (escala logarítmica).
  EJ.silbidoQueSube = function (fs = FS_DEF, { dur = 4, fMin = 700, fMax = 1400, semilla = 91 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), fi = f64(n), amp = f64(n), der = ruidoLento(n, fs, 2, az);
    for (let i = 0; i < n; i++) { const t = i / fs; fi[i] = fMin * Math.pow(fMax / fMin, (1 - Math.cos(DOS_PI * t / dur)) / 2) * (1 + 0.002 * der[i] + 0.003 * Math.sin(DOS_PI * 5.5 * t)); amp[i] = 1; }
    fundido(amp, fs, 0.08, 0.15);
    return terminar(silbar(fs, fi, amp, az), 0.8, { fi: [verdadFi(fi, amp)] });
  };

  // Formantes aproximados de las vocales del español (voz masculina, Hz) y sus anchos de banda.
  const FORMANTES = {
    a: [[700, 1250, 2600, 3500], [90, 100, 140, 200]],
    e: [[450, 1850, 2550, 3500], [70, 100, 140, 200]],
    i: [[290, 2250, 2950, 3600], [60, 100, 150, 200]],
    o: [[470, 950, 2500, 3500], [80, 90, 140, 200]],
    u: [[320, 780, 2400, 3500], [70, 90, 140, 200]],
  };
  function pistasVoz(n) { return { f0: f64(n), av: f64(n), asp: f64(n), F: [f64(n), f64(n), f64(n), f64(n)], B: [f64(n), f64(n), f64(n), f64(n)], fric: f64(n), fricFc: f64(n), fricQ: f64(n) }; }
  // Sintetizador de formantes: fuente glotal aditiva (armónicos con caída de 6 dB por octava, sin alias) por una
  // cascada de resonadores de Klatt, más ruido de fricción en paralelo (filtro paso banda por tramos).
  function sintetizarVoz(fs, p, az) {
    const n = p.f0.length, y = f64(n), nf = p.F.length, e1 = f64(nf), e2 = f64(nf);
    let ph = 0, fcAct = -1, qAct = -1, bb = null, z0 = 0, z1 = 0;
    for (let i = 0; i < n; i++) {
      const f0 = Math.max(40, p.f0[i]);
      ph += DOS_PI * f0 / fs;
      if (ph > DOS_PI) ph -= DOS_PI;
      let fuente = 0;
      if (p.av[i] > 1e-4) {
        const K = Math.floor(0.45 * fs / f0), kT = 0.33 * fs / f0, c2 = 2 * Math.cos(ph);
        let sp = 0, sc = Math.sin(ph);
        for (let k = 1; k <= K; k++) {
          fuente += (k <= kT ? 1 : (K + 1 - k) / (K + 1 - kT)) * sc / k;
          const sn = c2 * sc - sp; sp = sc; sc = sn;
        }
        fuente *= p.av[i];
      }
      if (p.asp[i] > 0) fuente += p.asp[i] * az.normal();
      let v = fuente;
      for (let m = 0; m < nf; m++) {
        const F = p.F[m][i];
        if (F >= 0.46 * fs) continue;
        const r = Math.exp(-PI * p.B[m][i] / fs), C = -r * r, B = 2 * r * Math.cos(DOS_PI * F / fs), o = (1 - B - C) * v + B * e1[m] + C * e2[m];
        e2[m] = e1[m]; e1[m] = o; v = o;
      }
      let fr = 0;
      if (p.fric[i] > 1e-5) {
        const fc = Math.min(p.fricFc[i], 0.42 * fs), Q = p.fricQ[i] || 1;
        if (fc !== fcAct || Q !== qAct) { bb = Senal.biquad('pasoBanda', fc, fs, { Q }); fcAct = fc; qAct = Q; }
        const w = az.normal(), o = bb.b[0] * w + z0;
        z0 = bb.b[1] * w - bb.a[1] * o + z1; z1 = bb.b[2] * w - bb.a[2] * o;
        fr = p.fric[i] * o;
      }
      y[i] = v + fr;
    }
    return y;
  }
  function suavizar(v, fs, tau) {  // paso bajo de un polo hacia delante y hacia atrás (sin retraso)
    const a = Math.exp(-1 / (tau * fs)), n = v.length;
    for (let i = 1; i < n; i++) v[i] = a * v[i - 1] + (1 - a) * v[i];
    for (let i = n - 2; i >= 0; i--) v[i] = a * v[i + 1] + (1 - a) * v[i];
    return v;
  }
  // Vocal sostenida: vocal 'a', 'e', 'i', 'o' o 'u' (también vale vocal(fs, 'a')), f0 en Hz (120 por defecto).
  EJ.vocal = function (fs = FS_DEF, opts = {}) {
    if (typeof opts === 'string') opts = { vocal: opts };
    const { vocal = 'a', f0 = 120, dur = 2, semilla = 21 } = opts, V = FORMANTES[vocal];
    if (!V) fallo("vocal desconocida: " + vocal + " ('a', 'e', 'i', 'o' o 'u')");
    const az = Senal.azar(semilla * 7 + vocal.charCodeAt(0)), n = muestras(fs, dur), p = pistasVoz(n), der = ruidoLento(n, fs, 2, az), jit = ruidoLento(n, fs, 40, az);
    for (let i = 0; i < n; i++) {
      p.f0[i] = f0 * (1 + 0.005 * der[i] + 0.0015 * jit[i]); p.av[i] = 1;
      for (let m = 0; m < 4; m++) { p.F[m][i] = V[0][m]; p.B[m][i] = V[1][m]; }
    }
    fundido(p.av, fs, 0.06, 0.12);
    for (let i = 0; i < n; i++) p.asp[i] = 0.015 * p.av[i];
    return terminar(sintetizarVoz(fs, p, az), 0.8, { fi: [verdadFi(p.f0, p.av)] });
  };
  EJ.aaa = (fs = FS_DEF, o = {}) => EJ.vocal(fs, Object.assign({}, o, { vocal: 'a' }));
  EJ.eee = (fs = FS_DEF, o = {}) => EJ.vocal(fs, Object.assign({}, o, { vocal: 'e' }));
  EJ.iii = (fs = FS_DEF, o = {}) => EJ.vocal(fs, Object.assign({}, o, { vocal: 'i' }));
  EJ.ooo = (fs = FS_DEF, o = {}) => EJ.vocal(fs, Object.assign({}, o, { vocal: 'o' }));
  EJ.uuu = (fs = FS_DEF, o = {}) => EJ.vocal(fs, Object.assign({}, o, { vocal: 'u' }));
  // «Aaa» y luego «iii» en la misma nota: los armónicos se quedan y los formantes cambian a mitad.
  EJ.aaaIii = function (fs = FS_DEF, { f0 = 120, dur = 4, semilla = 23 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), p = pistasVoz(n), der = ruidoLento(n, fs, 2, az), jit = ruidoLento(n, fs, 40, az), A = FORMANTES.a, I = FORMANTES.i;
    for (let i = 0; i < n; i++) {
      const t = i / fs, u = limitarA((t - dur / 2 + 0.08) / 0.16, 0, 1), s = 0.5 - 0.5 * Math.cos(PI * u);
      p.f0[i] = f0 * (1 + 0.005 * der[i] + 0.0015 * jit[i]); p.av[i] = 1;
      for (let m = 0; m < 4; m++) { p.F[m][i] = A[0][m] + (I[0][m] - A[0][m]) * s; p.B[m][i] = A[1][m] + (I[1][m] - A[1][m]) * s; }
    }
    fundido(p.av, fs, 0.06, 0.12);
    for (let i = 0; i < n; i++) p.asp[i] = 0.015 * p.av[i];
    return terminar(sintetizarVoz(fs, p, az), 0.8, { fi: [verdadFi(p.f0, p.av)] });
  };

  // Frase SINTÉTICA «Hola, esto es una señal sintética»: vocales con formantes, /l/ y nasales sonoras, /s/ con ruido
  // agudo, /t/ y /k/ con cierre y explosión, y una entonación que baja con acentos. Se parece a una frase en lo
  // esencial (sílabas, consonantes ruidosas, entonación), no es inteligible del todo.
  const FRASE = [['_', 0.10], ['o', 0.12, 1], ['l', 0.06], ['a', 0.15, 0, 1], ['_', 0.14],
    ['e', 0.08], ['s', 0.10], ['t', 0.07], ['o', 0.09], ['e', 0.07], ['s', 0.09], ['u', 0.07], ['n', 0.05], ['a', 0.09],
    ['s', 0.10], ['e', 0.07], ['ñ', 0.07], ['a', 0.13, 1], ['l', 0.07],
    ['s', 0.10], ['i', 0.07], ['n', 0.05], ['t', 0.07], ['e', 0.11, 1], ['t', 0.07], ['i', 0.06], ['k', 0.08], ['a', 0.16, 0, -1], ['_', 0.15]];
  const CONSONANTES = {
    l: { av: 0.5, F: [360, 1300, 2700, 3500], B: [80, 150, 200, 250] },
    n: { av: 0.35, F: [250, 1450, 2500, 3500], B: [100, 300, 400, 400] },
    'ñ': { av: 0.35, F: [250, 2100, 2800, 3500], B: [100, 300, 400, 400] },
    s: { fric: 0.6, fc: 5500, q: 2.5 },
    t: { oclusiva: 1, fc: 3800, q: 1.2 },
    k: { oclusiva: 1, fc: 1900, q: 1.5 },
    _: {},
  };
  EJ.frase = function (fs = FS_DEF, { dur = 3, f0 = 125, semilla = 33 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), p = pistasVoz(n), total = FRASE.reduce((s, e) => s + e[1], 0), k = dur / total;
    const marcas = [];
    let t0 = 0;
    for (const e of FRASE) { marcas.push({ s: e[0], t0, t1: t0 + e[1] * k, acento: e[2], tono: e[3] }); t0 += e[1] * k; }
    const sonora = s => FORMANTES[s] || (CONSONANTES[s] && CONSONANTES[s].av);
    for (let m = 0; m < marcas.length; m++) {  // formantes de cada tramo (los sordos toman los de la siguiente sonora)
      let r = m; while (r < marcas.length && !sonora(marcas[r].s)) r++;
      if (r === marcas.length) { r = m; while (r > 0 && !sonora(marcas[r].s)) r--; }
      const s = marcas[r].s, V = FORMANTES[s] || [CONSONANTES[s].F, CONSONANTES[s].B];
      marcas[m].F = V[0]; marcas[m].B = V[1];
    }
    let m = 0;
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      while (m < marcas.length - 1 && t >= marcas[m].t1) m++;
      const M = marcas[m], c = CONSONANTES[M.s] || {}, u = (t - M.t0) / (M.t1 - M.t0);
      for (let q = 0; q < 4; q++) { p.F[q][i] = M.F[q]; p.B[q][i] = M.B[q]; }
      p.av[i] = FORMANTES[M.s] ? 1 : c.av || 0;
      if (c.fric) { p.fric[i] = c.fric * Math.min(1, u / 0.25, (1 - u) / 0.25); p.fricFc[i] = c.fc; p.fricQ[i] = c.q; }
      if (c.oclusiva && u > 0.65) { const tb = (u - 0.65) * (M.t1 - M.t0); p.fric[i] = 0.9 * Math.exp(-tb / 0.008); p.fricFc[i] = c.fc; p.fricQ[i] = c.q; p.asp[i] = 0.08 * Math.exp(-tb / 0.02); }
      let f = f0 * (1.05 - 0.25 * t / dur);  // declinación
      for (const A of marcas) if (A.acento) f += 0.2 * f0 * Math.exp(-Math.pow((t - (A.t0 + A.t1) / 2) / 0.09, 2));
      if (M.tono) f += M.tono * 0.12 * f0 * limitarA(u, 0, 1);
      p.f0[i] = f;
    }
    suavizar(p.av, fs, 0.008); suavizar(p.f0, fs, 0.02);
    for (let q = 0; q < 4; q++) { suavizar(p.F[q], fs, 0.012); suavizar(p.B[q], fs, 0.012); }
    const jit = ruidoLento(n, fs, 40, az);
    for (let i = 0; i < n; i++) { p.f0[i] *= 1 + 0.003 * jit[i]; p.asp[i] += 0.02 * p.av[i]; }
    return terminar(sintetizarVoz(fs, p, az), 0.8, { fi: [verdadFi(p.f0, p.av, 0.3)] });
  };

  // Respuesta al impulso de una sala SINTÉTICA: sonido directo (1), primeras reflexiones dispersas (2–25 ms) y una cola
  // difusa de ruido con caída exponencial (−60 dB en t60 s). La energía de la cola crece con t60.
  EJ.respuestaSala = function (fs = FS_DEF, { t60 = 0.4, dur, semilla = 31, reverberacion } = {}) {
    dur = dur === undefined ? 1.1 * t60 + 0.05 : dur;
    const az = Senal.azar(semilla), n = Math.max(1, muestras(fs, dur)), h = f64(n), k = 6.9078 / t60;
    h[0] = 1;
    for (let r = 0; r < 8; r++) {
      const tr = az.real(0.002, 0.025), i = Math.round(tr * fs);
      if (i > 0 && i < n) h[i] += (az.real() < 0.5 ? -1 : 1) * az.real(0.25, 0.6) * Math.exp(-k * tr);
    }
    const R = reverberacion === undefined ? 0.6 * Math.sqrt(t60 / 0.3) : reverberacion, a0 = Math.sqrt(R * 2 * k / fs), lp = Math.exp(-DOS_PI * 6000 / fs);
    let v = 0;
    for (let i = 1; i < n; i++) {
      const t = i / fs;
      v = lp * v + (1 - lp) * az.normal() * 1.6;
      h[i] += a0 * Math.min(1, t / 0.01) * Math.exp(-k * t) * v;
    }
    return h;
  };
  // Palmadas con la respuesta de la sala: sala 'habitacion' (T60 ≈ 0,3 s), 'bano' (T60 ≈ 1,2 s) o 'ambas' (tres en
  // cada una, como en la grabación de referencia).
  EJ.palmadas = function (fs = FS_DEF, { sala = 'ambas', dur, semilla = 41 } = {}) {
    const s = sala === 'baño' ? 'bano' : sala, T60 = { habitacion: 0.3, bano: 1.2 };
    if (s !== 'ambas' && !T60[s]) fallo("sala desconocida: " + sala + " ('habitacion', 'bano' o 'ambas')");
    const base = s === 'ambas' ? { d: 7.5, t: [0.3, 1.0, 1.7, 3.4, 4.6, 5.8], s: ['habitacion', 'habitacion', 'habitacion', 'bano', 'bano', 'bano'] }
      : s === 'bano' ? { d: 4.5, t: [0.3, 1.5, 2.7], s: [s, s, s] } : { d: 3, t: [0.3, 1.0, 1.7], s: [s, s, s] };
    dur = dur === undefined ? base.d : dur;
    const az = Senal.azar(semilla), n = muestras(fs, dur), x = f64(n), k = dur / base.d, rir = {};
    for (const nombre of new Set(base.s)) rir[nombre] = EJ.respuestaSala(fs, { t60: T60[nombre], semilla: semilla + nombre.length });
    base.t.forEach((t, c) => {
      const nb = Math.round(0.03 * fs), w = ruidoBanda(nb, fs, az.real(1100, 1600), 0.9, az), alta = ruidoBanda(nb, fs, 4000, 0.7, az), g = az.real(0.8, 1);
      const golpe = f64(nb);
      for (let i = 0; i < nb; i++) { const tt = i / fs; golpe[i] = g * (1 - Math.exp(-tt / 0.0005)) * Math.exp(-tt / 0.005) * (w[i] + 0.4 * alta[i]); }
      const y = Senal.convolucion(golpe, rir[base.s[c]]), i0 = Math.round(t * k * fs);
      for (let i = 0; i < y.length && i0 + i < n; i++) x[i0 + i] += y[i];
    });
    return terminar(fundido(x, fs, 0.002, 0.05), 0.9);
  };

  // Melodía corta silbada (inventada para el curso), con portamentos entre notas, vibrato en las largas y respiraciones.
  EJ.melodia = function (fs = FS_DEF, { dur = 6.5, semilla = 71, notas } = {}) {
    const N = notas || [['La5', 0.4], ['Si5', 0.4], ['Do#6', 0.4], ['Mi6', 0.8], ['Do#6', 0.4], ['Si5', 0.4], ['La5', 0.8], [null, 0.3],
      ['Fa#5', 0.4], ['La5', 0.4], ['Si5', 0.6], ['La5', 0.9]];
    const total = N.reduce((s, e) => s + e[1], 0) + 0.5, k = dur / total, az = Senal.azar(semilla), n = muestras(fs, dur);
    const fi = f64(n), amp = f64(n), der = ruidoLento(n, fs, 2, az), tramos = [];
    let t0 = 0.25 * k, fAnt = null;
    for (const [nota, d] of N) { const f = nota ? Senal.nota(nota) : null; tramos.push({ f, t0, t1: t0 + d * k, fAnt }); if (f) fAnt = f; else fAnt = null; t0 += d * k; }
    let m = 0, fUlt = Senal.nota(N.find(e => e[0])[0]);
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      while (m < tramos.length - 1 && t >= tramos[m].t1) m++;
      const T = tramos[m], dentro = t >= T.t0 && t < T.t1;
      if (!dentro || !T.f) { fi[i] = fUlt; amp[i] = 0; continue; }
      const tl = t - T.t0, d = T.t1 - T.t0;
      let f = T.f;
      if (T.fAnt) { const g = Math.min(0.09, 0.3 * d); if (tl < g) f = T.fAnt * Math.pow(T.f / T.fAnt, 0.5 - 0.5 * Math.cos(PI * tl / g)); }
      else if (tl < 0.05) f = T.f * Math.pow(0.97, 1 - tl / 0.05);
      if (d >= 0.55 * k && tl > 0.25) f *= 1 + 0.008 * Math.sin(DOS_PI * 5.5 * (tl - 0.25)) * Math.min(1, (tl - 0.25) / 0.15);
      fi[i] = f * (1 + 0.0015 * der[i]); fUlt = fi[i];
      const fin = T.t1 - t, sigueNota = m + 1 < tramos.length && tramos[m + 1].f;
      amp[i] = (T.fAnt ? 1 : Math.min(1, tl / 0.04)) * (sigueNota ? 1 - 0.25 * Math.exp(-fin / 0.015) : Math.min(1, fin / 0.05));
    }
    suavizar(amp, fs, 0.004);
    return terminar(silbar(fs, fi, amp, az), 0.8, { fi: [verdadFi(fi, amp)] });
  };
  // Dos silbidos que se cruzan: uno sube de fBaja a fAlta mientras el otro baja (se cruzan a mitad, en √(fBaja·fAlta)).
  EJ.dosSilbidos = function (fs = FS_DEF, { dur = 4, fBaja = 700, fAlta = 1500, semilla = 81 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), fa = f64(n), fb = f64(n), aa = f64(n), ab = f64(n), da = ruidoLento(n, fs, 2, az), db = ruidoLento(n, fs, 2, az);
    for (let i = 0; i < n; i++) {
      const t = i / fs, s = t / dur;
      fa[i] = fBaja * Math.pow(fAlta / fBaja, s) * (1 + 0.004 * Math.sin(DOS_PI * 5.0 * t) + 0.0015 * da[i]);
      fb[i] = fAlta * Math.pow(fBaja / fAlta, s) * (1 + 0.005 * Math.sin(DOS_PI * 6.1 * t + 1) + 0.0015 * db[i]);
      aa[i] = t > 0.1 ? 0.55 : 0; ab[i] = t > 0.25 ? 0.45 : 0;
    }
    suavizar(aa, fs, 0.02); suavizar(ab, fs, 0.02);
    fundido(aa, fs, 0, 0.12); fundido(ab, fs, 0, 0.18);
    const xa = silbar(fs, fa, aa, az), xb = silbar(fs, fb, ab, az, { soplo: 0.045 }), x = Senal.suma(xa, xb);
    return terminar(x, 0.8, { fi: [verdadFi(fa, aa, 0.03), verdadFi(fb, ab, 0.03)], componentes: [xa, xb] });
  };
  // Acorde de notas ('Do4', 'Mi4', 'Sol4' por defecto; nombres o Hz), cada una con sus armónicos (amplitudes relativas).
  // decaimiento (s): 0 = sostenido (órgano); 1–2 s, como un piano.
  EJ.acorde = function (fs = FS_DEF, { notas = ['Do4', 'Mi4', 'Sol4'], dur = 2, armonicos = [1, 0.5, 0.25, 0.12], decaimiento = 0, semilla = 61 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), x = f64(n), comps = [], fis = [];
    for (const nota of notas) {
      const f = Senal.nota(nota), c = f64(n);
      armonicos.forEach((a, h) => {
        const fh = (h + 1) * f; if (!a || fh >= 0.45 * fs) return;
        const w = DOS_PI * fh / fs, ph = az.real(0, DOS_PI), tau = decaimiento > 0 ? decaimiento / (1 + 0.5 * h) : 0;
        for (let i = 0; i < n; i++) c[i] += a * Math.sin(w * i + ph) * (tau ? Math.exp(-i / fs / tau) : 1);
      });
      fundido(c, fs, 0.015, 0.08);
      for (let i = 0; i < n; i++) x[i] += c[i];
      comps.push(c); fis.push(new Float64Array(n).fill(f));
    }
    return terminar(x, 0.8, { fi: fis, componentes: comps });
  };
  // Diapasón: f (440 Hz) que se apaga despacio y un «clang» agudo que muere en unas décimas de segundo, más el golpe.
  // La razón del clang por defecto (6,07 × f) sale de un diapasón medido por D. Russell (Penn State): 426 Hz con el
  // clang en 2.585 Hz. Depende de la forma de cada diapasón: tómalo como un parcial agudo genérico. Los tiempos de
  // caída (3,5 s y 0,07 s) son valores elegidos, no medidos.
  EJ.diapason = function (fs = FS_DEF, { f = 440, dur = 3, clang = 6.07, semilla = 51 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), x = f64(n), fc = clang * f, ph = az.real(0, DOS_PI), golpe = ruidoBanda(Math.round(0.004 * fs), fs, 3000, 0.7, az);
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      x[i] = Math.exp(-t / 3.5) * Math.sin(DOS_PI * f * t) + (fc < 0.45 * fs ? 0.6 * Math.exp(-t / 0.07) * Math.sin(DOS_PI * fc * t + ph) : 0);
      if (i < golpe.length) x[i] += 0.5 * golpe[i] * (1 - i / golpe.length);
    }
    return terminar(fundido(x, fs, 0.001, 0.05), 0.8, { fi: [new Float64Array(n).fill(f)] });
  };
  // Sirena de ululato: sube y baja entre fMin y fMax cada «periodo» s, con timbre de onda casi cuadrada. Con
  // velocidad (m/s) > 0 pasa por delante a «distancia» m en el instante tPaso (efecto Doppler y cambio de volumen).
  EJ.sirena = function (fs = FS_DEF, { dur = 4, fMin = 650, fMax = 1450, periodo = 2, velocidad = 0, distancia = 10, tPaso, semilla = 111 } = {}) {
    const az = Senal.azar(semilla), n = muestras(fs, dur), c = 343, tp = tPaso === undefined ? dur / 2 : tPaso;
    const fsrc = t => fMin * Math.pow(fMax / fMin, (1 - Math.cos(DOS_PI * t / periodo)) / 2);
    const extra = velocidad > 0 ? Math.ceil((Math.hypot(distancia, velocidad * dur) / c + 0.05) * fs) : 0;
    const m0 = extra, total = n + extra, fase = f64(total);  // fase de la fuente desde −extra/fs
    let ph = az.real(0, DOS_PI), fa = fsrc(-m0 / fs);
    for (let i = 0; i < total; i++) { const t = (i - m0) / fs, fc = fsrc(t); if (i > 0) ph += PI * (fa + fc) / fs; fa = fc; fase[i] = ph; }
    const x = f64(n), fi = f64(n), phr = f64(n), arm = [[1, 1], [2, 0.18], [3, 0.33], [5, 0.2], [7, 0.12]], faseEn = u => {
      const p = u * fs + m0, i = Math.floor(p), r = p - i;
      return i < 0 ? fase[0] : i >= total - 1 ? fase[total - 1] : fase[i] + (fase[i + 1] - fase[i]) * r;
    };
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      let te = t, g = 1;
      if (velocidad > 0) { const r = Math.hypot(distancia, velocidad * (t - tp)); te = t - r / c; g = distancia / r; }
      const phs = faseEn(te), fInst = fsrc(te);
      let v = 0;
      for (const [h, a] of arm) v += a * limitarA((0.45 * fs - h * fInst * 1.07) / (0.05 * fs), 0, 1) * Math.sin(h * phs);
      x[i] = g * v; phr[i] = phs;
    }
    for (let i = 0; i < n - 1; i++) fi[i] = (phr[i + 1] - phr[i]) * fs / DOS_PI;
    if (n > 1) fi[n - 1] = fi[n - 2];
    return terminar(fundido(x, fs, 0.05, 0.1), 0.8, { fi: [fi] });
  };

  // Catálogo para los laboratorios «En tu voz»: los tramos de la grabación de referencia y algunos extra.
  const TITULOS_EN = {
    silencio: 'Silence in the room', silbido: 'Sustained whistle', aaaIii: '“Aah” and then “eee”, on the same note',
    aaa: 'Sustained “aah”', iii: 'Sustained “eee”', silbidoQueSube: 'Whistle that rises and falls',
    frase: 'Synthetic phrase: “Hello, this is a synthetic signal”', palmadas: 'Three claps in the room and three in the bathroom',
    melodia: 'Whistled melody', dosSilbidos: 'Two whistles that cross', acorde: 'C major chord', diapason: 'A 440 Hz tuning fork',
    sirena: 'Siren that rises and falls',
  };
  EJ.lista = [
    { id: 'silencio', titulo: 'Silencio de la habitación', dur: 3, tramo: 1 },
    { id: 'silbido', titulo: 'Silbido sostenido', dur: 3, tramo: 2 },
    { id: 'aaaIii', titulo: '«Aaa» y luego «iii», en la misma nota', dur: 4, tramo: 3 },
    { id: 'aaa', titulo: '«Aaa» sostenida', dur: 2, tramo: 3 },
    { id: 'iii', titulo: '«Iii» sostenida', dur: 2, tramo: 3 },
    { id: 'silbidoQueSube', titulo: 'Silbido que sube y baja', dur: 4, tramo: 4 },
    { id: 'frase', titulo: 'Frase sintética: «Hola, esto es una señal sintética»', dur: 3, tramo: 5 },
    { id: 'palmadas', titulo: 'Tres palmadas en la habitación y tres en el baño', dur: 7.5, tramo: 6 },
    { id: 'melodia', titulo: 'Melodía silbada', dur: 6.5, tramo: 7 },
    { id: 'dosSilbidos', titulo: 'Dos silbidos que se cruzan', dur: 4, tramo: 8 },
    { id: 'acorde', titulo: 'Acorde de Do mayor', dur: 2 },
    { id: 'diapason', titulo: 'Diapasón de 440 Hz', dur: 3 },
    { id: 'sirena', titulo: 'Sirena que sube y baja', dur: 4 },
  ];
  if (enIngles()) for (const e of EJ.lista) if (TITULOS_EN[e.id]) e.titulo = TITULOS_EN[e.id];
  // Genera un ejemplo por su id (los de lista y los demás: vocal, eee, ooo, uuu, respuestaSala). → Float64Array.
  EJ.generar = function (id, fs = FS_DEF, opts = {}) {
    const fn = EJ[id];
    if (typeof fn !== 'function' || id === 'generar') fallo('ejemplo desconocido: ' + id);
    return fn(fs, opts);
  };
  Senal.ejemplos = EJ;

  if (typeof module === 'object' && module.exports) module.exports = Senal; else raiz.Senal = Senal;
})(typeof self !== 'undefined' ? self : this);
