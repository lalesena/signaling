// Lesson 19 · Synchrosqueezing: squeezing the spectrogram. New terms and the quiz question bank. (English version.)
// Loaded by en/e19.html after comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Un golpe (una columna) en el plano tiempo-frecuencia, de tres maneras.
  function columna(ctx, w, h, C, estilo) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 26 }, x: [0, 1], y: [0, 1], marcasX: [0, 1], marcasY: false, formatoX: v => num(v) + ' s', rejilla: false, C });
    if (estilo === 'ancha') {
      ctx.fillStyle = Graficas.alfa(C.espectro, 0.55);
      ctx.fillRect(esc.x(0.44), esc.y(0.96), esc.x(0.56) - esc.x(0.44), esc.y(0.04) - esc.y(0.96));
    } else if (estilo === 'fina') Graficas.linea(ctx, esc, [0.5, 0.5], [0.04, 0.96], { color: C.espectro, ancho: 1.6, halo: false, C });
    else Graficas.linea(ctx, esc, [0.05, 0.95], [0.5, 0.5], { color: C.espectro, ancho: 1.8, halo: false, C });
  }
  // How badly a whistle is recovered over time, depending on where the error is concentrated.
  function errorEnElTiempo(ctx, w, h, C, estilo) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 26 }, x: [0, 2], y: [0, 1.1], marcasX: [0, 1, 2], marcasY: false, formatoX: v => num(v) + ' s', rejilla: false, C });
    const f = { cruce: t => 0.04 + 0.95 * Math.exp(-Math.pow((t - 1) / 0.12, 2)), plano: () => 0.45, bordes: t => 0.04 + 0.9 * (Math.exp(-Math.pow(t / 0.2, 2)) + Math.exp(-Math.pow((t - 2) / 0.2, 2))) }[estilo];
    Graficas.curva(ctx, esc, t => Math.min(1.05, f(t)), { color: C.ruido, ancho: 2.2, desde: 0, hasta: 2, n: 200, C });
    Graficas.texto(ctx, esc.caja.x + 4, esc.caja.y + 12, 'error', { color: C.tenue, tam: 10, C });
  }
  // Para el deslizador de la ventana: la mancha de una nota frente a su separación, y lo que queda del borrón del chirp.
  function dosMedidores(ctx, w, h, valor, C) {
    const mancha = Math.sqrt(2 * Math.LN2) / (Math.PI * valor / 1000), q = TAU * 1500 * Math.pow(valor / 1000, 2), kappa = q * q / (1 + q * q);
    const x0 = 12, ancho = w - 24;
    const barra = (y, texto, frac, color) => {
      Graficas.texto(ctx, x0, y - 5, texto, { color: C.suave, tam: 10.5, C });
      ctx.fillStyle = Graficas.alfa(C.eje, 0.25); ctx.fillRect(x0, y, ancho, 9);
      ctx.fillStyle = color; ctx.fillRect(x0, y, Math.max(2, ancho * Math.min(1, frac)), 9);
    };
    barra(24, 'blob of one note: ' + num(Math.round(mancha)) + ' Hz (the notes are 80 Hz apart)', mancha / 160, mancha < 80 ? C.ok : C.mal);
    ctx.strokeStyle = C.texto; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + ancho * 0.5, 20); ctx.lineTo(x0 + ancho * 0.5, 36); ctx.stroke();
    barra(64, 'leftover blur of the chirp (κ): ' + num(Math.round(100 * kappa)) + '%', kappa, kappa < 0.3 ? C.ok : C.mal);
  }

  Curso.datos('e19', {
    terminos: [
      { termino: 'Synchrosqueezing', definicion: 'Tightening each column of a spectrogram by moving every little piece, with its phase, to the row of its true frequency.', imagen: 'Wringing out a cloth vertically' },
      { termino: 'Frequency label', definicion: 'The real speed of the Ferris wheel in a cell, read from how its phase turns.', imagen: 'The label hanging from each little piece of energy' },
      { termino: 'Fourier-based synchrosqueezing (FSST)', definicion: 'Synchrosqueezing done on the short-time Fourier transform.', imagen: 'The sliding window with its blobs squeezed' },
      { termino: 'Wavelet synchrosqueezing', definicion: 'Synchrosqueezing done on the continuous wavelet transform, which separates notes well when they are far apart in proportion.', imagen: 'The stretching wavelet, with its blobs squeezed' },
      { termino: 'Column-wise inversion', definicion: 'Recovering each sample of the signal by adding up all the cells in its column.', imagen: 'The column that, added up, gives back one point of the wave' },
      { termino: 'Reconstruction band', definicion: 'The narrow band around a line that is added up to recover just that component.', imagen: 'A lane around the line' },
      { termino: 'Separation condition', definicion: 'Components must be farther apart in frequency than the width of the blob of one note.', imagen: 'Two lines that do not fit in the same tile' },
      { termino: 'Slow modulation', definicion: 'The size and speed of each Ferris wheel change little while the window lasts.', imagen: 'The Ferris wheel that speeds up so slowly that in a snapshot it looks like it goes at a fixed speed' },
      { termino: 'Leftover blur (κ)', definicion: 'The fraction of the blob width that survives squeezing a chirp; a name specific to this lesson, not a standard term.', imagen: 'The cloth that, soaked too much, does not wring out completely' },
    ],

    preguntas: [
      // 1 · Basic: the difference from reassignment.
      {
        id: 'e19-diferencia', tipo: 'opcion', nivel: 'basico',
        enunciado: 'How does synchrosqueezing differ from reassignment?',
        opciones: ['It only moves each little piece in frequency, within its instant, and it moves it with its phase', 'It moves in time and in frequency, like reassignment, but with another window', 'It only moves in time'],
        correcta: 0,
        explicacion: 'Because it does not change instant and it moves whole complex numbers, the sum of each column is preserved and you can go back to the signal. Reassignment also moves in time and keeps only energy.',
      },
      // 2 · Common mistake: it breaks the uncertainty principle.
      {
        id: 'e19-incertidumbre', tipo: 'vf', nivel: 'basico',
        enunciado: 'Synchrosqueezing breaks the uncertainty principle.',
        correcta: false,
        explicacion: 'It sharpens because it assumes the signal is a sum of separated components that change slowly. For signals that do not meet that assumption, the blob does not squeeze.',
      },
      // 3 · Generated: which row a little piece goes to.
      {
        id: 'e19-fila', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 16000]), nfft = azar.elegir([256, 512, 1024]), fe = azar.real(100, 3000), fila = Math.round(fe * nfft / fs);
          return {
            enunciado: 'The label of a little piece says ' + num(fe, 1) + ' Hz. With a sampling rate of ' + num(fs) + ' Hz and a transform of ' + num(nfft) + ' points, the rows are ' + num(fs / nfft, 2) + ' Hz apart and row 0 is 0 Hz. Which row does it go to?',
            respuesta: fila, tolerancia: 0.5,
            explicacion: 'Synchrosqueezing puts each little piece in the row closest to its label: ' + num(fe, 1) + ' / ' + num(fs / nfft, 2) + ' = ' + num(fe * nfft / fs, 2) + ', which rounded is row ' + num(fila) + '.',
          };
        },
      },
      // 4 · Generated: the leftover blur.
      {
        id: 'e19-kappa', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const al = azar.entero(2, 50) * 100, s = azar.entero(2, 16), q = TAU * al * Math.pow(s / 1000, 2), kappa = 100 * q * q / (1 + q * q);
          return {
            enunciado: 'A chirp rises ' + num(al) + ' Hz every second and the Gaussian window has σ = ' + num(s) + ' ms. With q = 2π · α · σ², what percentage of the width of the spectrogram blob is still there after squeezing? It is 100 · q² / (1 + q²).',
            respuesta: kappa, tolerancia: 2, unidad: '%',
            explicacion: 'With σ = ' + num(s / 1000, 3) + ' s, q = 2π · ' + num(al) + ' · ' + num(Math.pow(s / 1000, 2), 6) + ' = ' + num(q, 2) + ', and 100 · q² / (1 + q²) = ' + num(kappa, 0) + '%. The larger q is, the less gets squeezed.',
          };
        },
      },
      // 5 · Generated: minimum separation.
      {
        id: 'e19-separacion', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const s = azar.elegir([4, 6, 8, 10, 12, 16, 20]), sep = Math.sqrt(2 * Math.LN2) / (Math.PI * s / 1000);
          return {
            enunciado: 'With a Gaussian window of σ = ' + num(s) + ' ms, what minimum separation, in hertz, do two notes need for synchrosqueezing to separate them? (Twice the half-height width of the blob of one note.)',
            respuesta: sep, toleranciaRel: 0.03, unidad: 'Hz',
            explicacion: 'The separation condition is the square root of 2 ln 2, divided by π and by σ in seconds: ' + num(sep, 1) + ' Hz. The longer the window, the narrower the blob and the closer the notes can be.',
          };
        },
      },
      // 6 · Slider: the window for two notes and a chirp.
      {
        id: 'e19-ventana', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Choose the window that leaves both **two notes 80 Hz apart** and **a chirp of 1,500 Hz per second** thin at once: the blob of a note has to be smaller than their separation, and the chirp must keep little blur.',
        min: 2, max: 20, paso: 0.5, inicial: 3, unidad: 'ms', etiqueta: 'Window width (σ)',
        dibujar: (ctx, w, h, valor, C) => dosMedidores(ctx, w, h, valor, C),
        correcto: v => v >= 5 && v <= 8, solucion: 6.5,
        explicacion: 'The notes call for a long window, so that the blob is well under 80 Hz wide, and the chirp calls for a short one, so that it barely changes inside it. Between 5 and 8 ms both are met; with 3 ms the notes get mixed, and with 12 ms the chirp keeps more than half of its blur.',
      },
      // 7 · Graph: the clap.
      {
        id: 'e19-palmada', tipo: 'grafica', nivel: 'medio',
        enunciado: 'What does a clap look like after synchrosqueezing?',
        opciones: [(ctx, w, h, C) => columna(ctx, w, h, C, 'ancha'), (ctx, w, h, C) => columna(ctx, w, h, C, 'fina'), (ctx, w, h, C) => columna(ctx, w, h, C, 'horizontal')],
        correcta: 0,
        explicacion: 'A column as wide as the window, just like in the spectrogram: for a knock, the label of each cell is its own row, nothing moves, and synchrosqueezing does not move in time. The thin streak is what reassignment gives.',
      },
      // 8 · Graph: where the error is at a crossing.
      {
        id: 'e19-cruce', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Two whistles cross and you reconstruct one with its band. Where is the error?',
        opciones: [(ctx, w, h, C) => errorEnElTiempo(ctx, w, h, C, 'cruce'), (ctx, w, h, C) => errorEnElTiempo(ctx, w, h, C, 'plano'), (ctx, w, h, C) => errorEnElTiempo(ctx, w, h, C, 'bordes')],
        correcta: 0,
        explicacion: 'Concentrated around the crossing: away from it, each line has its own band and is recovered almost perfectly, and at the crossing the two share a band and the label cannot say which little piece belongs to whom.',
      },
      // 9 · Multiple: conditions.
      {
        id: 'e19-condiciones', tipo: 'varias', nivel: 'medio',
        enunciado: 'What does the signal need for synchrosqueezing to work well? Mark everything that is true.',
        opciones: ['Components separated in frequency by more than the width of the blob of one note', 'Size and frequency that change slowly compared with the window', 'That it is periodic', 'That it has no noise at all', 'That it has a single component'],
        correctas: [0, 1],
        explicacion: 'Those are the two conditions of Daubechies, Lu and Wu (2011) and of Auger and coauthors (2013). It does not require the signal to be periodic, it tolerates moderate noise and it is designed precisely for several components.',
      },
      // 10 · Why you can go back.
      {
        id: 'e19-vuelta', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why can you go back to the signal after squeezing?',
        opciones: ['Because the sum of each column returns the sample at the center of the window, and squeezing only rearranges within the column', 'Because it keeps a copy of the original spectrogram', 'Because the window is Gaussian'],
        correcta: 0,
        explicacion: 'The column-wise inversion formula still holds if the coefficients change row but not instant. That is exactly what reassignment breaks when it also moves in time.',
      },
      // 11 · History.
      {
        id: 'e19-historia', tipo: 'opcion', nivel: 'basico', temporada: false,
        enunciado: 'Where did the idea of synchrosqueezing come from?',
        opciones: ['From analyzing sound with ideas taken from models of the auditory nerve (Daubechies and Maes, 1996)', 'From military radar of the 1950s', 'From oil prospecting with wavelets'],
        correcta: 0,
        explicacion: 'That is how Daubechies, Lu and Wu (2011) and Thakur (2014) tell it. Wavelets and oil are the story of the wavelet transform, which is a different one.',
      },
      // 12 · Applied: the fundamental.
      {
        id: 'e19-fundamental', tipo: 'vf', nivel: 'medio',
        enunciado: 'To hear your fundamental alone, it is enough to add up a narrow band, about 15 Hz on each side, around its line in the synchrosqueezed image, if the line is well located.',
        correcta: true,
        explicacion: 'Once squeezed, the energy of the fundamental fits in the band, and it is recovered with good quality. In the unsqueezed spectrogram, the same band leaves half the blob outside and you need one twice as wide to reach the same quality.',
      },
      // 13 · Noise.
      {
        id: 'e19-ruido', tipo: 'opcion', nivel: 'medio',
        enunciado: 'You record with a lot of background noise. What does synchrosqueezing do?',
        opciones: ['It squeezes the noise into specks too; if the noise is comparable to the signal in the band, the line is lost', 'It removes the noise, because it only squeezes what is signal', 'It turns the noise into a horizontal line in the center'],
        correcta: 0,
        explicacion: 'The method does not know what is noise: it moves all the energy according to its label. It has been proved to be robust to Gaussian white noise, but it does not work miracles.',
      },
      // 14 · Wavelets or Fourier.
      {
        id: 'e19-versiones', tipo: 'opcion', nivel: 'reto',
        enunciado: 'You want to separate harmonics 10 and 11 of a low voice. Which version do you choose?',
        opciones: ['The short-time Fourier transform one: it asks for the same separation in hertz at all frequencies', 'The wavelet one, because it sees high frequencies better', 'It makes no difference, they are the same'],
        correcta: 0,
        explicacion: 'The harmonics are a fixed distance apart, the frequency of the fundamental. With wavelets, the separation asked for is relative to the frequency, and the high harmonics end up relatively very close together.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
