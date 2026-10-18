// Lesson 11 · Fourier Doesn’t Know When: The Spectrogram: new terms and quiz question bank (English version).
// Loaded by en/e11.html (and by the glossary and exam pages) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // A schematic spectrogram (time to the right, frequency upward) with the magma scale colors.
  function esquema(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 26 }, fondo = G.magma(0);
    const col = (t, a = 1) => { const c = G.magma(t); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    const X = f => caja.x + caja.w * f, Y = f => caja.y + caja.h * (1 - f);
    ctx.save();
    ctx.fillStyle = 'rgb(' + fondo.join(',') + ')';
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const raya = (x0, y0, x1, y1, ancho, t) => { ctx.strokeStyle = col(t); ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); };
    if (tipo === 'diagonalSube') raya(0.1, 0.15, 0.9, 0.85, 3, 0.85);
    else if (tipo === 'diagonalBaja') raya(0.1, 0.85, 0.9, 0.15, 3, 0.85);
    else if (tipo === 'rayas') for (const p of [0.2, 0.5, 0.8]) raya(p, 0.02, p, 0.98, 3, 0.88);
    else if (tipo === 'pila') for (let i = 0; i < 6; i++) raya(0.1, 0.12 + i * 0.14, 0.9, 0.12 + i * 0.14, 2.4, 0.9 - i * 0.07);
    else if (tipo === 'nube') { const az = Senal.azar(4); for (let i = 0; i < 160; i++) { ctx.fillStyle = col(0.35 + 0.4 * az.real(), 0.8); ctx.fillRect(X(0.12 + 0.76 * az.real()), Y(0.55 + 0.4 * az.real()), 3, 3); } }
    else if (tipo === 'linea') raya(0.1, 0.5, 0.9, 0.5, 3, 0.88);
    else if (tipo === 'trinoBaja') for (let i = 0; i < 7; i++) raya(0.1 + i * 0.12, 0.8, 0.17 + i * 0.12, 0.35, 2.4, 0.85);
    else if (tipo === 'zumbido') for (const f of [0.22, 0.44, 0.66]) raya(0.03, f, 0.97, f, 1.2, 0.8);
    else if (tipo === 'zumbidoYvoz') { for (const f of [0.22, 0.44, 0.66]) raya(0.03, f, 0.97, f, 1.2, 0.8); raya(0.25, 0.8, 0.75, 0.8, 4, 0.6); }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'time', { color: C.tenue, tam: 10, alinear: 'right', C });
    G.texto(ctx, caja.x + 2, h - 4, 'frequency ↑', { color: C.tenue, tam: 10, C });
  }
  const dib = tipo => (ctx, w, h, C) => esquema(ctx, w, h, C, tipo);

  // Spectrum, in amber, of the chunk covered by a 64 ms Hann window (for the slider question).
  function espectroTrozo(x, fs, c, ancho) {
    const n = Math.round(ancho * fs), i0 = Math.round(c * fs) - n / 2, y = new Float64Array(n), w = Senal.ventana('hann', n);
    for (let i = 0; i < n; i++) y[i] = (x[i0 + i] || 0) * w[i];
    const nfft = 4096, X = Senal.fftReal(y, nfft), df = fs / nfft, K = Math.ceil(1000 / df), f = [], m = [];
    for (let k = 0; k <= K; k++) { f.push(k * df); m.push(Math.hypot(X.re[k], X.im[k])); }
    return { f, m };
  }

  Curso.datos('e11', {
    terminos: [
      { termino: 'Nonstationary signal', definicion: 'A signal whose frequency content changes over time, like voice or music.', imagen: 'The score, where each note has its own instant' },
      { termino: 'Short-time Fourier transform (STFT)', definicion: 'Fourier applied to short chunks of the signal, one after another, to find out which frequencies are present at each instant.', imagen: 'The purple window sliding over the wave' },
      { termino: 'Spectrogram', definicion: 'The map that puts time across, frequency up and energy as color.', imagen: 'Stacked columns of spectrum: the score that the sound draws' },
      { termino: 'Hop', definicion: 'The distance between the start of one window and the start of the next; it decides how many columns there are per second.', imagen: 'The steps of the sliding window' },
      { termino: 'Wideband and narrowband', definicion: 'Spectrograms made with a short window (wideband: bangs and formants show up) or with a long window (narrowband: harmonics show up).', imagen: 'The two filters of the first spectrograph' },
      { termino: 'Formant', definicion: 'A zone of frequencies that the mouth and throat reinforce, and that sets one vowel apart from another.', imagen: 'The brighter bands inside the stack of harmonics' },
      { termino: 'Sonagram (sonogram)', definicion: 'The name that ornithologists and some other fields give to the spectrogram; it comes from the Sona-Graph, a machine sold in the 1950s.', imagen: 'A bird’s song drawn as strokes' },
      { termino: 'Audio fingerprint', definicion: 'A compact summary of a sound that lets you recognize it even when it is degraded, like Shazam’s constellation of peaks.', imagen: 'The starry sky of the spectrogram' },
      { termino: 'Logarithmic frequency scale', definicion: 'An axis on which each octave takes up the same space, as on a piano keyboard.', imagen: 'The hidden word, which can only be read with this axis' },
    ],
    preguntas: [
      { id: 'e11-reves', tipo: 'opcion', nivel: 'basico', enunciado: 'You reverse a recording. What happens to its amplitude spectrum?',
        opciones: ['It doesn’t change', 'The low pitches become high pitches', 'It shifts to negative frequencies', 'It becomes noisier'], correcta: 0,
        explicacion: 'Reversing a signal in time only changes the sign of its phase: the size of each Ferris wheel is the same. That is why the spectrum of a whole recording doesn’t know when.' },
      { id: 'e11-espejo', tipo: 'vf', nivel: 'medio', enunciado: 'The spectrogram of a song played backwards is the same as that of the song played forward.', correcta: false,
        explicacion: 'It is the same picture seen in a mirror, with time turned around. Only the amplitude spectrum of the whole recording is identical.' },
      { id: 'e11-silbido', tipo: 'grafica', nivel: 'basico', enunciado: 'Which is the spectrogram of a whistle that rises?',
        opciones: [dib('diagonalSube'), dib('rayas'), dib('pila')], correcta: 0,
        explicacion: 'A tone that changes draws a line that curves; the vertical lines are bangs and the stack of lines is a sound with harmonics.' },
      { id: 'e11-palmadas', tipo: 'grafica', nivel: 'basico', enunciado: 'Which is the spectrogram of three claps?',
        opciones: [dib('nube'), dib('linea'), dib('rayas')], correcta: 2,
        explicacion: 'A bang lasts an instant and sounds at many frequencies at once, so it draws a vertical line.' },
      { id: 'e11-aaa', tipo: 'varias', nivel: 'medio', enunciado: 'What do you see in the spectrogram of a sustained, sung “aah”? Mark everything that applies.',
        opciones: ['A stack of horizontal lines at the same distance from each other', 'Brighter bands inside the stack, the formants', 'A cloud of noise at the very top', 'A single thin line'], correctas: [0, 1],
        explicacion: 'A sung vowel is a stack of harmonics with some bands lit up. The cloud at the top would be an “s,” and a single thin line, a whistle.' },
      { id: 'e11-trozo', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 22050]), N = azar.elegir([256, 512, 1024, 2048]);
          return { enunciado: 'You analyze at ' + num(fs) + ' Hz with a window of ' + num(N) + ' samples. How long does each chunk last?', respuesta: 1000 * N / fs, toleranciaRel: 0.01, unidad: 'ms',
            explicacion: 'The chunk lasts as long as it takes N samples to go by: ' + num(N) + ' divided by ' + num(fs) + ' is ' + num(N / fs, 4) + ' s, that is, ' + num(1000 * N / fs, 1) + ' ms.' };
        } },
      { id: 'e11-filas', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 22050]), N = azar.elegir([256, 512, 1024, 2048]);
          return { enunciado: 'You analyze at ' + num(fs) + ' Hz with a window of ' + num(N) + ' samples, without zero padding. How many hertz apart are the rows of the spectrogram?', respuesta: fs / N, toleranciaRel: 0.01, unidad: 'Hz',
            explicacion: 'The spacing between rows is the inverse of the chunk duration: ' + num(fs) + ' divided by ' + num(N) + ' is ' + num(fs / N, 1) + ' Hz. That is why a short chunk gives coarse rows.' };
        } },
      { id: 'e11-columnas', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const fs = azar.elegir([8000, 16000]), H = azar.elegir([64, 128, 256, 512]);
          return { enunciado: 'With a hop of ' + num(H) + ' samples at ' + num(fs) + ' Hz, how many columns does each second of the spectrogram have?', respuesta: fs / H, toleranciaRel: 0.01, unidad: 'columns',
            explicacion: 'The hop decides how many times per second you look: ' + num(fs) + ' divided by ' + num(H) + ' is ' + num(fs / H) + ' columns. It doesn’t decide the sharpness, which depends on the duration of the window.' };
        } },
      { id: 'e11-nitidez', tipo: 'opcion', nivel: 'medio', enunciado: 'You want the notes of a melody to look sharper in the spectrogram. What do you change?',
        opciones: ['I lengthen the window', 'I reduce the hop', 'I pad with zeros', 'I raise the sampling rate'], correcta: 0,
        explicacion: 'Only the duration of the window sharpens the frequency. The hop adds columns, zeros interpolate the same curve, and more samples per second add frequencies at the top, not detail.' },
      { id: 'e11-shazam', tipo: 'opcion', nivel: 'medio', enunciado: 'According to the method Shazam published in 2003, what does it compare to recognize a song?',
        opciones: ['The position of the peaks of its spectrogram and the distances between them', 'The waveform, sample by sample', 'The average volume of the song', 'The spectrum of the whole song'], correcta: 0,
        explicacion: 'Peaks survive noise, and pairs of peaks, with two frequencies and a time difference, form fingerprints that can be searched very quickly.' },
      { id: 'e11-aphex', tipo: 'vf', nivel: 'basico', enunciado: 'To see properly the face that Aphex Twin hid in one of his songs, the frequency axis of the spectrogram has to be on a logarithmic scale.', correcta: true,
        explicacion: 'The image was drawn with a logarithmic axis in mind, with the rows spread out by octaves; on a linear one it comes out distorted.' },
      { id: 'e11-ventana', tipo: 'deslizador', nivel: 'basico', temporada: false,
        generar: azar => {
          const FS = 4000, orden = azar.barajar([300, 500, 800]), idx = orden.indexOf(800);
          const x = new Float64Array(Math.round(1.5 * FS));
          orden.forEach((f, i) => { for (let k = 0; k < 0.5 * FS; k++) x[Math.round(i * 0.5 * FS) + k] = Math.sin(TAU * f * k / FS); });
          return { enunciado: 'Three notes sound in a row, 0.5 s each. Move the window to the instant when the highest one sounds: the spectrum of the chunk tells you which note is there.',
            min: 0, max: 1.5, paso: 0.01, inicial: 0.1, unidad: 's', etiqueta: 'Center of the window',
            dibujar: (ctx, w, h, v, C) => {
              const alto1 = Math.round(h * 0.38);
              const e1 = G.ejes(ctx, { caja: { x: 10, y: 6, w: w - 20, h: alto1 }, x: [0, 1.5], y: [-1.2, 1.2], marcasY: false, marcasX: [0, 0.5, 1, 1.5], formatoX: t => num(t, 1), rejilla: false, C });
              const mitad = 0.032;
              ctx.save(); ctx.fillStyle = G.alfa(C.plantilla, 0.3); ctx.fillRect(e1.x(v - mitad), e1.caja.y, e1.x(v + mitad) - e1.x(v - mitad), e1.caja.h); ctx.restore();
              G.linea(ctx, e1, null, x, { t0: 0, dt: 1 / FS, color: C.senal, ancho: 1, alfa: 0.7, halo: false, C });
              const y2 = 6 + alto1 + 28, e2 = G.ejes(ctx, { caja: { x: 10, y: y2, w: w - 20, h: h - y2 - 26 }, x: [0, 1000], y: [0, 1.1], marcasY: false, marcasX: [0, 250, 500, 750, 1000], formatoX: t => num(t), etiquetaX: 'Hz', C });
              const r = espectroTrozo(x, FS, v, 0.064);
              let mx = 0; for (const a of r.m) mx = Math.max(mx, a);
              if (mx > 1e-6) G.linea(ctx, e2, r.f, r.m.map(a => a / 20), { color: C.espectro, ancho: 2, C });
            },
            correcto: v => v > idx * 0.5 + 0.05 && v < idx * 0.5 + 0.45, solucion: idx * 0.5 + 0.25,
            explicacion: 'The spectrum of the chunk says what sounds there: the peak farthest to the right, around 800 Hz, is on the highest note. That is the idea of the sliding window.' };
        } },
      { id: 'e11-trino', tipo: 'opcion', nivel: 'medio', figura: dib('trinoBaja'), textoFigura: 'A piece of a sonagram',
        enunciado: 'An ornithologist sees in the sonagram a series of short marks, diagonal and downward, one right after another. What is the bird singing?',
        opciones: ['A trill of falling notes', 'A constant low hum', 'A sharp bang', 'The wind'], correcta: 0,
        explicacion: 'Each mark is a brief note whose pitch falls, and many in a row make a trill. A constant hum would be a horizontal line; a bang, a vertical line; the wind, a cloud.' },
      { id: 'e11-red', tipo: 'opcion', nivel: 'medio', figura: dib('zumbido'), textoFigura: 'Thin, constant lines, even in the silence',
        enunciado: 'In your recording, thin, constant horizontal lines show up at 50, 100 and 150 Hz, even in the silences. What is the most likely cause?',
        opciones: ['The hum of the power line', 'Your note, with its harmonics', 'A formant of your voice', 'Aliasing'], correcta: 0,
        explicacion: 'They also show up in the silence and sit at 50 Hz and its multiples, which is the frequency of the power line in Europe. Your note is only there where you speak.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
