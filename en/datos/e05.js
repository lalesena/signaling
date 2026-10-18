// Lección 5 · Por qué tu afinador necesita tiempo: términos nuevos y banco de preguntas del examen.
// Lo carga e05.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = () => Graficas;

  // Dos tonos de la misma altura que coinciden en fase en el centro del trozo (como en los retos de la lección).
  function dosTonos(T, f1, f2, fs) {
    const N = Math.max(8, Math.round(T * fs)), x = new Float64Array(N);
    for (let i = 0; i < N; i++) { const t = i / fs - T / 2; x[i] = Math.cos(TAU * f1 * t) + Math.cos(TAU * f2 * t); }
    return x;
  }
  // Espectro de Hann con relleno con ceros (solo para dibujar suave): { f, mag }.
  function espectroHann(T, f1, f2, fs) {
    const x = dosTonos(T, f1, f2, fs);
    return Senal.espectro(x, fs, { ventana: 'hann', nfft: Senal.siguientePotencia2(x.length * 8) });
  }
  // Cuántos decibelios se hunde el valle entre los dos picos más altos del entorno (0 si no hay dos picos).
  function profundidad(E, f1, f2) {
    const df = E.f[1] - E.f[0], D = f2 - f1;
    const a = Math.max(1, Math.round((f1 - D) / df)), b = Math.min(E.mag.length - 2, Math.round((f2 + D) / df));
    const mx = [];
    for (let k = a + 1; k < b; k++) if (E.mag[k] > E.mag[k - 1] && E.mag[k] >= E.mag[k + 1]) mx.push(k);
    if (mx.length < 2) return 0;
    mx.sort((p, q) => E.mag[q] - E.mag[p]);
    const i = Math.min(mx[0], mx[1]), j = Math.max(mx[0], mx[1]);
    let v = Infinity;
    for (let k = i; k <= j; k++) v = Math.min(v, E.mag[k]);
    return 20 * Math.log10(Math.min(E.mag[i], E.mag[j]) / Math.max(v, 1e-12));
  }
  // El espectro de un trozo de dos tonos (440 y 446 Hz) para la duración T, dibujado en dB entre 430 y 456 Hz.
  function dibujoDosPicos(ctx, w, h, T, C, f2 = 446, x1 = 456) {
    const E = espectroHann(T, 440, f2, 2000);
    const esc = G().ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 36 }, x: [430, x1], y: [-40, 2], marcasX: [430, 440, f2, x1], marcasY: false, formatoX: v => num(v), etiquetaX: 'frequency (Hz)', rejilla: false, C });
    const xs = [], ys = [];
    for (let k = 0; k < E.f.length; k++) if (E.f[k] >= 430 && E.f[k] <= x1) { xs.push(E.f[k]); ys.push(Math.max(-40, 20 * Math.log10(Math.max(E.mag[k], 1e-12) / 1))); }
    G().linea(ctx, esc, xs, ys, { color: C.espectro, ancho: 2, C });
    G().texto(ctx, 16, 20, 'piece of ' + num(T, 3) + ' s', { color: C.tenue, tam: 11, C });
  }
  // Barras de un espectro en dB (con un suelo en −60 dB), de la barra a a la barra b.
  function barrasDb(ctx, w, h, C, lista, a, b) {
    const esc = G().ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 30 }, x: [a - 0.5, b + 0.5], y: [-60, 3], marcasX: [a, Math.round((a + b) / 2), b], marcasY: false, formatoX: v => num(v), rejilla: false, C });
    G().barras(ctx, esc, lista.map(p => p[0]), lista.map(p => Math.max(-60, p[1])), { color: C.espectro, anchoPx: Math.max(3, (w - 24) / (b - a + 1) * 0.55), base: -60, C });
  }
  // Los espectros de la pregunta de la fuga: un seno de f vueltas en un trozo de 64 muestras, ventana rectangular, en dB.
  function seno64(f) {
    const x = Float64Array.from({ length: 64 }, (_, i) => Math.sin(TAU * f * i / 64));
    const S = Senal.espectro(x, 64, { ventana: 'rect' });
    let mx = 1e-12;
    for (const v of S.mag) mx = Math.max(mx, v);
    return Array.from(S.f, (fr, k) => [Math.round(fr), 20 * Math.log10(Math.max(S.mag[k], 1e-12) / mx)]).filter(p => p[0] >= 12 && p[0] <= 29);
  }

  Curso.datos('e05', {
    terminos: [
      { termino: 'Beats', definicion: 'The swell in volume you hear when two nearly equal notes sound together; it pulses as many times per second as the number of hertz they differ by.', imagen: 'The two Ferris wheels drifting out of step: the wah-wah-wah' },
      { termino: 'Discrete Fourier transform (DFT)', definicion: 'The spectrum of a piece of signal computed with a finite row of test wheels: the ones that make a whole number of turns in the piece.', imagen: 'The row of test wheels and the area of each one' },
      { termino: 'Fast Fourier transform (FFT)', definicion: 'A way of computing exactly the same DFT with far fewer operations, by splitting the work into halves.', imagen: 'Splitting the calculation into small piles and joining them back together' },
      { termino: 'Frequency resolution', definicion: 'The smallest spacing between two frequencies for them to show up as two peaks; it is on the order of one divided by the duration of the piece.', imagen: 'Two Ferris wheels you can tell apart only when one has gained a turn on the other' },
      { termino: 'Spectral leakage', definicion: 'The energy of one frequency spilling over into the neighboring bars when the piece doesn’t contain a whole number of turns.', imagen: 'The seam with a jump' },
      { termino: 'Window (Hann)', definicion: 'A bell the piece is multiplied by so that it starts and ends at zero and there is no jump at the seam.', imagen: 'The smoothed edges of the piece, in purple' },
      { termino: 'Zero padding', definicion: 'Adding zeros to the end of the piece so the spectrum is drawn with more points, without adding information.', imagen: 'The same mountain drawn with more points' },
      { termino: 'Decibel (dB)', definicion: 'A scale that counts how many times a factor of ten fits: every 20 dB, the amplitude is divided by ten.', imagen: 'The spectrum in dB, where the small things show up' },
    ],

    preguntas: [
      // 1 · Resolución ≈ 1/T.
      {
        id: 'e05-resolucion', tipo: 'opcion', nivel: 'basico', fijas: true,
        enunciado: 'Your tuner analyzes pieces of 0.1 s. Starting from roughly what spacing can it tell two notes apart?',
        opciones: ['0.1 Hz', '1 Hz', '10 Hz', '100 Hz'], correcta: 2,
        explicacion: 'The resolution is on the order of 1/T = 1/0.1 s = 10 Hz. Whoever answers 0.1 Hz confuses duration with resolution, and 100 Hz reverses the relationship: the shorter the piece, the worse the notes separate.',
      },
      // 2 · Generada: latidos por segundo.
      {
        id: 'e05-latidos', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const d = azar.elegir([0.5, 1, 1.5, 2, 3, 4]), f2 = 440 + (azar.real() < 0.5 ? -d : d);
          return {
            enunciado: 'One string sounds at 440 Hz and another at **' + num(f2, 1) + ' Hz**. How many beats per second do you hear when they sound together?',
            respuesta: d, tolerancia: 0.05, unidad: 'beats/s', decimales: 1, marcador: 'for example, 2',
            explicacion: 'The beat has the frequency of the difference: |' + num(f2, 1) + ' − 440| = ' + num(d, 1) + ' Hz. The two wheels drift apart by a whole turn every 1/' + num(d, 1) + ' s, and the volume rises and falls at the rhythm of those turns.',
          };
        },
      },
      // 3 · Generada: separación entre barras.
      {
        id: 'e05-barras', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 22050, 44100, 48000]), N = azar.elegir([256, 512, 1024, 2048, 4096]);
          return {
            enunciado: 'You do an FFT of **' + num(N) + '** samples recorded at **' + num(fs) + ' Hz**. How many hertz separate two bars of the spectrum?',
            respuesta: fs / N, toleranciaRel: 0.01, unidad: 'Hz', decimales: 2, marcador: 'for example, 31.25',
            explicacion: 'The piece lasts T = N/fs = ' + num(N / fs, 4) + ' s, and the test wheels go in steps of 1/T: fs/N = ' + num(fs) + '/' + num(N) + ' = ' + num(fs / N, 2) + ' Hz.',
          };
        },
      },
      // 4 · Error típico: el relleno con ceros.
      {
        id: 'e05-ceros', tipo: 'vf', nivel: 'medio', altoFigura: 130,
        figura: (ctx, w, h, C) => dibujoDosPicos(ctx, w, h, 0.1, C, 442, 452),
        textoFigura: 'The Hann spectrum of a 0.1 s piece with two notes of 440 and 442 Hz: a single mountain',
        enunciado: 'If you pad a 0.1 s piece with zeros up to 1 s, you can separate two notes that differ by 2 Hz.',
        correcta: false,
        explicacion: 'The zeros draw more points of the same mountain, which is about 10 Hz wide. To separate 2 Hz you need real signal of at least on the order of half a second.',
      },
      // 5 · La ventana de Hann.
      {
        id: 'e05-hann', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does the Hann window do?',
        opciones: ['It reduces leakage in exchange for widening the peak a little', 'It increases the resolution of the spectrum', 'It removes noise from the signal', 'It changes the sampling rate'],
        correcta: 0,
        explicacion: 'It smooths the edges of the piece, removes the jump at the seam and lowers the skirt of the peak. The price is a somewhat wider peak: it neither removes noise nor increases resolution.',
      },
      // 6 · Gráfica: la fuga.
      {
        id: 'e05-fuga', tipo: 'grafica', nivel: 'medio', altoOpcion: 120,
        enunciado: 'A sine makes **20.3 turns** in the piece and is analyzed without smoothing the edges. The plots are in decibels. Which spectrum comes out?',
        opciones: [
          (ctx, w, h, C) => barrasDb(ctx, w, h, C, seno64(20), 12, 29),
          (ctx, w, h, C) => barrasDb(ctx, w, h, C, seno64(20.3), 12, 29),
          (ctx, w, h, C) => barrasDb(ctx, w, h, C, [[17, 0], [24, 0]], 12, 29),
        ],
        correcta: 1,
        explicacion: 'A fraction of a turn is left over, so the seam has a jump and the energy spills over into the neighboring bars: that is leakage, with one tall bar and skirts that drop off gradually. A single bar would mean a whole number of turns, and two equal bars would mistake leakage for two notes.',
      },
      // 7 · Varias: qué ayuda a separar dos frecuencias.
      {
        id: 'e05-separar', tipo: 'varias', nivel: 'medio',
        enunciado: 'What helps separate two very close frequencies? Mark everything that works.',
        opciones: [
          'Listening for longer',
          'Raising the sampling rate while keeping the duration',
          'Padding with zeros',
          'Using the FFT instead of the DFT',
          'Waiting for the note to be steady and analyzing a long piece of it',
        ],
        correctas: [0, 4],
        explicacion: 'Only the duration of real signal counts. The sampling rate sets the ceiling of frequencies, zeros interpolate and the FFT gives the same result, only faster.',
      },
      // 8 · Generada: decibelios.
      {
        id: 'e05-db', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const r = azar.elegir([2, 10, 100, 1000]), db = 20 * Math.log10(r);
          return {
            enunciado: 'A harmonic has an amplitude **' + num(r) + ' times smaller** than the peak. How many decibels below it is it?',
            respuesta: db, tolerancia: 0.5, unidad: 'dB', decimales: 1, marcador: 'for example, 20',
            explicacion: 'With amplitudes you use 20·log₁₀: 20·log₁₀(' + num(r) + ') = ' + num(db, 1) + ' dB below. Each factor of 10 is 20 dB, and that is why a harmonic a thousand times smaller is at 60 dB.',
          };
        },
      },
      // 9 · Aplicada: por qué duda más con la sexta cuerda.
      {
        id: 'e05-sexta', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why does a tuner need more time for the sixth string of the guitar (E, 82 Hz) than for the first (E, 330 Hz)?',
        opciones: [
          'Because a semitone above is about 5 Hz on the low string and about 20 on the high one, and separating 5 Hz takes listening about four times longer',
          'Because low pitches travel more slowly through the air',
          'Because the FFT is slower with low notes',
          'Because the phone’s microphone doesn’t pick up low pitches',
        ],
        correcta: 0,
        explicacion: 'It is the 1/T law applied to semitones: a semitone is 6% of the frequency, so in hertz it is smaller for low notes. Sound travels equally fast at any frequency and the FFT takes the same time.',
      },
      // 10 · Error típico: FFT aproximada.
      {
        id: 'e05-fft-exacta', tipo: 'vf', nivel: 'basico',
        enunciado: 'The FFT gives a more approximate result than the DFT computed directly.',
        correcta: false,
        explicacion: 'The FFT arranges the same calculations in a different way: the result is the same, apart from rounding, and almost always with less accumulated error, because it does far fewer operations.',
      },
      // 11 · Generada: cuánto gana la FFT.
      {
        id: 'e05-ahorro', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const N = azar.elegir([256, 1024, 4096, 65536]), ahorro = N / Math.log2(N);
          return {
            enunciado: 'Roughly how many times fewer operations does an FFT of **' + num(N) + '** points do than the DFT computed directly?',
            respuesta: ahorro, toleranciaRel: 0.05, unidad: 'times', decimales: 0, marcador: 'for example, 100',
            explicacion: 'The direct DFT does on the order of N² operations and the FFT, N·log₂N; the ratio is N/log₂N = ' + num(N) + '/' + num(Math.log2(N)) + ' ≈ ' + num(ahorro, 0) + '. The advantage grows with N.',
          };
        },
      },
      // 12 · Deslizador: cuánto hay que escuchar.
      {
        id: 'e05-duracion', tipo: 'deslizador', nivel: 'reto', alto: 150,
        enunciado: 'Two notes of 440 and 446 Hz sound together. Move the duration of the piece until the Hann spectrum shows two separate peaks.',
        min: 0.02, max: 0.8, paso: 0.01, inicial: 0.05, unidad: 's', etiqueta: 'Length of the piece', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => dibujoDosPicos(ctx, w, h, valor, C),
        correcto: v => profundidad(espectroHann(v, 440, 446, 2000), 440, 446) >= 3, solucion: 0.6,
        explicacion: 'They differ by 6 Hz, so you have to look for at least on the order of 1/6 s for one wheel to gain a turn on the other. With the Hann window and a crossing in phase, a clear separation arrives at somewhat more than double that: about 0.4 s.',
      },
      // 13 · Historia: Gauss.
      {
        id: 'e05-gauss', tipo: 'opcion', nivel: 'basico', fijas: true,
        enunciado: 'Who was the first, as far as we know, to use a method equivalent to the FFT?',
        opciones: ['Gauss, around 1805', 'Fourier, in 1807', 'Cooley and Tukey, in 1965', 'Shannon, in 1949'], correcta: 0,
        explicacion: 'Gauss most likely wrote it down in 1805, to compute orbits of asteroids, but he didn’t publish it and it appeared in his collected works in 1866. Cooley and Tukey brought it to light again in 1965, this time with computers.',
      },
      // 14 · Error típico: la frecuencia de muestreo.
      {
        id: 'e05-fs', tipo: 'vf', nivel: 'medio',
        enunciado: 'With the same duration, recording at 48,000 Hz instead of 8,000 Hz separates two close notes better.',
        correcta: false,
        explicacion: 'The spacing between bars is 1/T and depends only on the duration. More samples per second let you see higher frequencies, the ceiling fs/2, but they don’t separate close ones any better.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
