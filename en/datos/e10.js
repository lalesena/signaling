// Lesson 10 · Noise Has Colors: new terms and quiz question bank (English version).
// Loaded by en/e10.html (and by the glossary and exam pages) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const num = (x, d) => Curso.num(x, d);
  const hz = v => (v >= 1000 ? num(v / 1000) + 'k' : num(v));

  // A spectrum in decibels, with frequency on an octave scale: a straight line with a little tremble, like that of
  // an averaged noise. The line passes through 0 dB at 1,000 Hz.
  function espectro(ctx, w, h, C, pend, semilla) {
    const esc = Graficas.ejes(ctx, {
      caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [100, 8000], y: [-26, 26], logX: true,
      marcasX: [125, 500, 2000, 8000], formatoX: hz, marcasY: false, rejilla: false, C,
    });
    const az = Senal.azar(semilla || 1), f = [], y = [];
    for (let i = 0; i <= 140; i++) { const fi = 100 * Math.pow(80, i / 140); f.push(fi); y.push(pend * Math.log2(fi / 1000) + 0.7 * az.normal()); }
    Graficas.linea(ctx, esc, f, y, { color: C.espectro, ancho: 2, C });
  }

  // The synthetic response of a sweep, with noise of deviation sigma (in drawing units).
  const respuesta = t => {
    const picos = [[1.5, 0.55], [2.8, 0.3], [3.7, 0.8], [4.8, 0.4], [5.6, 1], [7.4, -0.7]];
    let s = 0;
    for (const [t0, a] of picos) s += a * Math.exp(-Math.pow((t - t0) / (a < 0 ? 0.6 : 0.25), 2));
    return 0.3 * s;
  };
  function barrido(ctx, w, h, C, sigma, semilla) {
    const esc = Graficas.ejes(ctx, {
      caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [0, 12], y: [-1.2, 1.2], marcasX: [0, 6, 12], formatoX: v => num(v) + ' ms',
      marcasY: false, rejilla: false, C,
    });
    const az = Senal.azar(semilla || 3), xs = [], ys = [];
    for (let i = 0; i < 180; i++) { const t = 12 * i / 179; xs.push(t); ys.push(respuesta(t) + sigma * az.normal()); }
    Graficas.linea(ctx, esc, xs, ys, { color: sigma > 0.3 ? C.ruido : C.senal, ancho: 1.6, C });
  }

  Curso.datos('e10', {
    terminos: [
      { termino: 'Random noise', definicion: 'A signal whose next sample can’t be predicted, even though its statistics stay the same.', imagen: 'The coral tangle that never repeats' },
      { termino: 'White noise', definicion: 'The kind with the same power in every hertz of frequency: its spectrum is flat.', imagen: 'The flat line; the shower' },
      { termino: 'Pink noise', definicion: 'The kind with the same energy in every octave: its spectrum drops 3 dB per octave.', imagen: 'The sloped line; the rain' },
      { termino: 'Brown noise (Brownian or red)', definicion: 'A random walk, in which each sample is the previous one plus a random step: its spectrum drops 6 dB per octave.', imagen: 'The steepest line; the waterfall' },
      { termino: 'Blue and violet noise', definicion: 'The kinds that rise 3 and 6 dB per octave: they have more power in the high pitches than in the low ones.', imagen: 'The lines that rise' },
      { termino: 'Power spectral density', definicion: 'How much power a signal has in each hertz of frequency; the power of a band is the area under the curve.', imagen: 'The amber spectrum of a noise' },
      { termino: 'Octave band', definicion: 'The strip of frequencies between one frequency and its double.', imagen: 'The bars of the octave equalizer' },
      { termino: 'Thermal noise', definicion: 'The noise produced by the random motion of the electrons in any conductor simply because it is at some temperature.', imagen: 'The Penzias and Wilson antenna' },
      { termino: 'Noise temperature', definicion: 'A way of measuring a noise: the temperature at which a conductor would have to be to produce that same noise.', imagen: 'The 3.5 K extra' },
      { termino: 'Cosmic microwave background', definicion: 'The radiation left over from the young universe, which arrives almost identical from every direction in the sky.', imagen: 'The excess noise that wouldn’t go away' },
      { termino: 'Periodogram', definicion: 'The power spectrum computed from a single chunk of signal; with noise, it comes out hairy.', imagen: 'The hairy spectrum of one chunk' },
      { termino: 'Welch’s method', definicion: 'Cutting the signal into windowed chunks, computing the spectrum of each one and averaging them to smooth the result.', imagen: 'The spectrum that smooths out as chunks are averaged' },
      { termino: 'Signal-to-noise ratio (SNR)', definicion: 'How many times more power the signal has than the noise, usually in decibels.', imagen: 'The green signal peeking out above the coral noise' },
      { termino: 'Synchronized averaging', definicion: 'Adding up many repetitions aligned at their start so that the signal stays and the noise cancels out.', imagen: 'The average that cleans up sweep by sweep' },
      { termino: 'Evoked potential', definicion: 'The electrical response of the nervous system to a stimulus, such as a click, which only shows up when many repetitions are averaged.', imagen: 'The baby’s brain response' },
    ],

    preguntas: [
      // 1 · Basic: the color is about the spectrum.
      {
        id: 'e10-blanco', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does it mean for a noise to be **white**?',
        opciones: ['It has the same power in every hertz: its spectrum is flat', 'Its values are spread out in a bell shape', 'It sounds equally loud at all frequencies', 'It has no low pitches'],
        correcta: 0,
        explicacion: 'The color of a noise is about its spectrum, about how it spreads its power across the frequencies: white spreads it equally in every hertz. The bell curve is another property, that of Gaussian values, which a white noise may or may not have. “Sounds equally loud at all frequencies” would describe gray noise instead, because the ear isn’t equally sensitive to all of them.',
      },
      // 2 · Why white noise hisses: counted in octaves.
      {
        id: 'e10-siseo', tipo: 'opcion', nivel: 'medio',
        enunciado: 'White noise spreads the same power in every hertz. Why does it sound like a hiss, with so much treble?',
        opciones: ['Because each octave going up has twice as many hertz and therefore twice the energy', 'Because high pitches are louder by nature', 'Because the ear can’t hear the low pitches', 'Because white noise has more power per hertz in the high pitches'],
        correcta: 0,
        explicacion: 'The power per hertz is the same everywhere, but the ear counts notes in octaves, and each octave going up contains twice as many hertz as the one before: with the same power in each one, it carries twice the energy, 3 dB more. Pink noise offsets that by dropping 3 dB per octave.',
      },
      // 3 · Generated: the noise drops with the square root of the number of repetitions.
      {
        id: 'e10-raiz', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const n = azar.elegir([4, 9, 16, 25, 64, 100, 400, 900, 2500, 10000]), r = Math.sqrt(n);
          return {
            enunciado: 'You average ' + num(n) + ' repetitions of a noisy measurement. By how much is the amplitude of the noise divided?',
            respuesta: r, toleranciaRel: 0.01, unidad: 'times', marcador: 'for example, 3',
            explicacion: 'The signal is added up ' + num(n) + ' times, but the noise, which sometimes goes up and sometimes down, is only added up √' + num(n) + ' = ' + num(r) + ' times. That is why the noise ends up divided by ' + num(r) + ', not by ' + num(n) + '.',
          };
        },
      },
      // 4 · Generated and applied: how many sweeps are needed.
      {
        id: 'e10-barridos', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const s0 = azar.elegir([2, 5, 10, 20]), s1 = azar.elegir([0.1, 0.2, 0.5]), n = Math.round(Math.pow(s0 / s1, 2));
          return {
            enunciado: 'In an evoked potential test, each sweep brings a noise of ' + num(s0) + ' µV and you want to bring it down to ' + num(s1, 1) + ' µV. How many sweeps do you have to average?',
            respuesta: n, toleranciaRel: 0.02, unidad: 'sweeps',
            explicacion: 'The remaining noise is ' + num(s0) + '/√N µV. For it to equal ' + num(s1, 1) + ' µV you need √N = ' + num(s0 / s1) + ', that is, N = ' + num(s0 / s1) + '² = ' + num(n) + ' sweeps. To divide the noise by 10 you need 100 sweeps, not 10.',
          };
        },
      },
      // 5 · Generated: 3 dB more for each octave going up, in white noise.
      {
        id: 'e10-octavas', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const k = azar.entero(1, 6);
          return {
            enunciado: 'In white noise, how many more decibels of energy does an octave band have when it is ' + k + (k === 1 ? ' octave' : ' octaves') + ' above another?',
            respuesta: 3.01 * k, tolerancia: 0.2, unidad: 'dB', marcador: 'for example, 6',
            explicacion: 'Each octave going up has twice as many hertz and the same power per hertz: twice the energy, which is 3 dB (3.01 exactly). ' + k + (k === 1 ? ' octave gives' : ' octaves give') + ' 3.01 × ' + k + ' = ' + num(3.01 * k, 1) + ' dB.',
          };
        },
      },
      // 6 · Generated: signal-to-noise ratio in decibels from the amplitude ratio.
      {
        id: 'e10-snr', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const A = azar.elegir([0.1, 0.5, 2, 3, 5, 10]);
          return {
            enunciado: 'The amplitude of a signal is ' + num(A, 1) + ' times that of the noise. What is the signal-to-noise ratio, in decibels?',
            respuesta: 20 * Math.log10(A), tolerancia: 0.2, unidad: 'dB', marcador: 'for example, 6',
            explicacion: 'Power goes with the square of the amplitude, and that is where the 20 instead of 10 comes from: 20 · log₁₀(' + num(A, 1) + ') = ' + num(20 * Math.log10(A), 1) + ' dB.' + (A < 1 ? ' It is negative because the signal is weaker than the noise.' : ''),
          };
        },
      },
      // 7 · Common mistake: the name of brown noise.
      {
        id: 'e10-marron-color', tipo: 'vf', nivel: 'basico',
        enunciado: 'Brown noise is named after its color.',
        correcta: false,
        explicacion: 'It comes from Brownian motion, the random trembling that the botanist Robert Brown observed in 1827 in pollen particles in water. Brown noise is a random walk: each sample is the previous one plus a random step.',
      },
      // 8 · Common mistake: a longer chunk doesn't smooth the spectrum.
      {
        id: 'e10-trozo-largo', tipo: 'vf', nivel: 'medio',
        enunciado: 'If you compute the spectrum of a noise with a longer chunk, it comes out less hairy.',
        correcta: false,
        explicacion: 'A longer chunk gives more resolution, that is, more points closer together on the curve, but each point still jumps just as much. To smooth the spectrum you have to average chunks, as Welch’s method does.',
      },
      // 9 · Visual: the slope of pink.
      {
        id: 'e10-rosa-grafica', tipo: 'grafica', nivel: 'basico',
        enunciado: 'Which is the spectrum of **pink noise**? All three graphs are in decibels, with frequency on an octave scale.',
        opciones: [(ctx, w, h, C) => espectro(ctx, w, h, C, 0, 4), (ctx, w, h, C) => espectro(ctx, w, h, C, -3.01, 5), (ctx, w, h, C) => espectro(ctx, w, h, C, -6.02, 6)],
        correcta: 1,
        explicacion: 'Pink drops 3 dB every time the frequency doubles, and that spreads the same energy across every octave. The flat line is white’s, and the one that falls twice as much is brown’s.',
      },
      // 10 · Visual: what the average of a hundred sweeps leaves.
      {
        id: 'e10-promedio-grafica', tipo: 'grafica', nivel: 'medio',
        enunciado: 'You average **100 repetitions** of a response buried in noise. What do you see?',
        opciones: [(ctx, w, h, C) => barrido(ctx, w, h, C, 0.55, 8), (ctx, w, h, C) => barrido(ctx, w, h, C, 0.055, 9), (ctx, w, h, C) => barrido(ctx, w, h, C, 0.0055, 10)],
        correcta: 1,
        explicacion: 'The noise drops with the square root of the number of repetitions: with 100, to a tenth. The response peeks out, though it doesn’t come out clean. To make the noise a hundred times smaller you would need 10,000 repetitions, and the first graph is that of a single sweep.',
      },
      // 11 · Visual: fitting the slope of brown.
      {
        id: 'e10-pendiente-marron', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Set the purple line to the slope of the spectrum of a **brown noise**.',
        min: -9, max: 3, paso: 0.25, inicial: 0, unidad: 'dB per octave', etiqueta: 'Slope', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => {
          espectro(ctx, w, h, C, -6.02, 12);
          const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [100, 8000], y: [-26, 26], logX: true, soloEscala: true, C });
          Graficas.linea(ctx, esc, [100, 8000], [valor * Math.log2(100 / 1000), valor * Math.log2(8)], { color: C.plantilla, ancho: 2, guiones: [6, 4], C });
        },
        correcto: v => Math.abs(v + 6) <= 0.5, solucion: -6,
        explicacion: 'Brown falls 6 dB every time the frequency doubles: it is a random walk, in which each sample is the previous one plus a random step. Pink falls 3 and white, none.',
      },
      // 12 · Applied (health, only what has been published): what the studies say.
      {
        id: 'e10-estudios', tipo: 'varias', nivel: 'medio',
        enunciado: 'What do the published studies say about noise for sleeping or concentrating? Mark everything that is true.',
        opciones: [
          'A review of 38 studies concluded that the quality of the evidence that continuous noise improves sleep is very low',
          'In a 2026 laboratory study, pink noise reduced REM sleep',
          'In young people with ADHD, white or pink noise gave a small benefit in laboratory tasks',
          'It has been proven that brown noise improves anyone’s concentration',
          'White noise can’t damage the ear, whatever the volume',
        ],
        correctas: [0, 1, 2],
        explicacion: 'They are the review by Riedy et al. (2021), the study by Basner et al. (2026) and the meta-analysis by Nigg et al. (2024). For brown noise not a single study was found, and in people without ADHD the effect was slightly negative. And volume matters: in a study of 14 infant sleep machines, every one exceeded 50 dB at 30 cm at maximum volume, and three went above 85.',
      },
      // 13 · Applied: the pigeons of Penzias and Wilson.
      {
        id: 'e10-palomas', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Penzias and Wilson suspected their antenna, evicted the pigeons and cleaned it thoroughly. What happened to the excess noise?',
        opciones: ['It barely dropped: it came from the sky, the same in every direction', 'It disappeared: it was the pigeons', 'It doubled', 'It changed with the seasons'],
        correcta: 0,
        explicacion: 'The excess, about 3.5 K, was the same in every direction and did not change over the year: it was not from the antenna or the atmosphere. It was the cosmic microwave background, and it earned them half of the 1978 Nobel Prize in Physics.',
      },
      // 14 · Common mistake: the trade-off of Welch's method.
      {
        id: 'e10-welch', tipo: 'opcion', nivel: 'medio',
        enunciado: 'For Welch’s method you cut the recording into more chunks and therefore shorter ones. What happens to the spectrum?',
        opciones: ['It comes out smoother, but with less resolution', 'It comes out smoother and with more resolution', 'It comes out hairier', 'Nothing changes'],
        correcta: 0,
        explicacion: 'More chunks give more spectra to average, and the tremble drops with the square root of their number. But each chunk, being shorter, tells two nearby frequencies apart less well: it is the law of the tuner in lesson 5, now with noise.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
