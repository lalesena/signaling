// Lesson 13 · Wavelets: a microscope for signals: new terms and quiz question bank.
// Loaded by en/e13.html (and, later, glosario.html and examenes.html) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // El reparto de baldosas en el plano (tiempo hacia la derecha, frecuencia hacia arriba): tres franjas de baldosas.
  // tipo 'wavelet': estrechas y altas arriba, anchas y bajas abajo; 'fija': todas iguales; 'revés': al contrario.
  function baldosas(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 24 };
    ctx.save();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
    // Alturas relativas de las tres franjas (de abajo arriba) y número de baldosas por franja.
    const alt = tipo === 'wavelet' ? [0.2, 0.3, 0.5] : tipo === 'fija' ? [0.333, 0.333, 0.334] : [0.5, 0.3, 0.2];
    const cuantas = tipo === 'wavelet' ? [2, 4, 8] : tipo === 'fija' ? [4, 4, 4] : [8, 4, 2];
    let y = caja.y + caja.h;
    for (let b = 0; b < 3; b++) {
      const hb = caja.h * alt[b], n = cuantas[b], wb = caja.w / n;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = G.alfa(C.plantilla, (i + b) % 2 ? 0.14 : 0.3);
        ctx.fillRect(caja.x + i * wb + 1, y - hb + 1, wb - 2, hb - 2);
      }
      y -= hb;
    }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'time', { color: C.tenue, tam: 10, alinear: 'right', C });
    G.texto(ctx, caja.x + 2, h - 4, 'frequency ↑', { color: C.tenue, tam: 10, C });
  }

  // Un escalograma esquemático de un chasquido: raya fina arriba que se ensancha hacia abajo (cono), una línea horizontal o una nube.
  function escalograma(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 24 }, fondo = G.magma(0);
    const col = (t, a = 1) => { const c = G.magma(t); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    ctx.save();
    ctx.fillStyle = 'rgb(' + fondo.join(',') + ')'; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const cx = caja.x + caja.w / 2;
    if (tipo === 'cono') {
      for (let i = 0; i < 30; i++) {
        const f = 1 - i / 30, yy = caja.y + caja.h * (1 - f) + 0, anch = 1.5 + 22 * (i / 30);
        const g = ctx.createLinearGradient(cx - anch, 0, cx + anch, 0);
        g.addColorStop(0, col(0.3, 0)); g.addColorStop(0.5, col(0.9 - 0.4 * (i / 30), 0.95)); g.addColorStop(1, col(0.3, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - anch, caja.y + caja.h * (i / 30), anch * 2, caja.h / 30 + 1);
      }
    } else if (tipo === 'linea') { ctx.fillStyle = col(0.9); ctx.fillRect(caja.x + 4, caja.y + caja.h * 0.45, caja.w - 8, 3); }
    else { const az = Senal.azar(5); for (let i = 0; i < 220; i++) { ctx.fillStyle = col(0.3 + 0.35 * az.real(), 0.75); ctx.fillRect(caja.x + az.real() * (caja.w - 3), caja.y + az.real() * (caja.h - 3), 3, 3); } }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'time', { color: C.tenue, tam: 10, alinear: 'right', C });
    G.texto(ctx, caja.x + 2, h - 4, 'frequency ↑', { color: C.tenue, tam: 10, C });
  }
  const dibB = tipo => (ctx, w, h, C) => baldosas(ctx, w, h, C, tipo);
  const dibE = tipo => (ctx, w, h, C) => escalograma(ctx, w, h, C, tipo);

  // Una nota de 440 Hz con una wavelet de Morlet que busca una frecuencia (para la pregunta del deslizador).
  function senoYWavelet(ctx, w, h, C, f) {
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 34 }, x: [0, 30], y: [-1.2, 1.2], marcasY: false, marcasX: [0, 10, 20, 30], formatoX: v => num(v), etiquetaX: 'ms', rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * 440 * t / 1000), { color: C.senal, ancho: 1.8, n: 700, C });
    const s = 6 / (TAU * f);
    G.curva(ctx, esc, t => Math.exp(-(t - 15) * (t - 15) / 1e6 / (2 * s * s)) * Math.cos(TAU * f * (t - 15) / 1000), { color: C.plantilla, ancho: 2.2, n: 1200, C });
  }

  Curso.datos('e13', {
    terminos: [
      { termino: 'Wavelet', definicion: 'A short wave (a “little wave”), a few turns long and with zero average, used as a template to measure how much it resembles the signal.', imagen: 'A few turns of a Ferris wheel inside a bell' },
      { termino: 'Mother wavelet', definicion: 'The shape all the copies in the analysis come from, stretched or shrunk and shifted.', imagen: 'The purple wavelet before stretching it' },
      { termino: 'Scale', definicion: 'How stretched or shrunk a copy of the wavelet is; the larger it is, the lower the note it looks for.', imagen: 'The zoom of the stretching wavelet' },
      { termino: 'Octave', definicion: 'The interval between a note and the one at double its frequency; on the piano, from one A to the next A.', imagen: 'The seven A notes of the keyboard, at the same distance' },
      { termino: 'Morlet wavelet', definicion: 'The most widely used with sounds: a Ferris wheel inside a Gaussian bell, whose setting w0 says how many turns it has.', imagen: 'The Gabor atom that keeps its shape as it stretches' },
      { termino: 'Constant relative resolution (constant Q)', definicion: 'Each frequency is looked at with a width proportional to itself, so that all octaves have the same relative sharpness.', imagen: 'The octaves of the piano, all equally wide on the keyboard' },
      { termino: 'Continuous wavelet transform (CWT)', definicion: 'The resemblance of the signal to all the copies of a wavelet, at all scales and at all instants.', imagen: 'The wavelet that stretches and slides, and the map it leaves' },
      { termino: 'Scalogram', definicion: 'The map of the wavelet transform: time across, frequency up (by octaves) and energy as color.', imagen: 'Narrow tiles at the top and wide ones at the bottom' },
      { termino: 'Cone of influence', definicion: 'The zone near the edges where long wavelets spill out of the signal and the scalogram is not reliable.', imagen: 'The shading that widens toward the lows at the ends' },
      { termino: 'P and S waves', definicion: 'The two waves an earthquake sends: the P wave, faster, arrives first; the S wave arrives later and shakes more.', imagen: 'The two arrivals on a seismogram' },
    ],
    preguntas: [
      { id: 'e13-copias', tipo: 'opcion', nivel: 'basico', enunciado: 'What changes between the copies of a mother wavelet?',
        opciones: ['Their size (the scale) and their position in time', 'Their shape', 'Their number of oscillations', 'Their average'], correcta: 0,
        explicacion: 'They are all the same wave, stretched or shrunk and shifted, and that is why Morlet called them “waves of constant shape.”' },
      { id: 'e13-reparto', tipo: 'grafica', nivel: 'medio', enunciado: 'How are the tiles distributed in a wavelet transform?',
        opciones: [dibB('wavelet'), dibB('fija'), dibB('reves')], correcta: 0,
        explicacion: 'At the top the wavelet is short (it knows when well) and at the bottom it is long (it knows which note well). The distribution of equal tiles is that of the spectrogram, with a fixed window.' },
      { id: 'e13-chasquido', tipo: 'grafica', nivel: 'medio', enunciado: 'Which one is the scalogram of a click?',
        opciones: [dibE('linea'), dibE('cono'), dibE('nube')], correcta: 1,
        explicacion: 'The hit lights up all the scales at once: the short wavelets at the top locate it precisely and the long ones at the bottom smear it, and that is why a cone appears.' },
      { id: 'e13-duracion', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.elegir([50, 100, 200, 440, 1000, 4000]);
          return { enunciado: 'The envelope of a Morlet wavelet with w0 = 6 that looks for ' + num(f) + ' Hz is a bell with a standard deviation of 6 divided by 2π times the frequency. How many milliseconds is it?',
            respuesta: 6000 / (TAU * f), toleranciaRel: 0.03, unidad: 'ms',
            explicacion: 'It is 6000 divided by (2π times ' + num(f) + ') = ' + num(6000 / (TAU * f), 2) + ' ms. The wavelet lasts less the higher the note it looks for, and it always fits the same number of turns.' };
        } },
      { id: 'e13-semitono', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const f = azar.elegir([27.5, 55, 110, 440, 1760, 3951]);
          return { enunciado: 'On the piano, going up one semitone multiplies the frequency by 1.0595. How many hertz are there between a note of ' + num(f, f % 1 ? 1 : 0) + ' Hz and the next one?',
            respuesta: f * 0.0595, toleranciaRel: 0.02, unidad: 'Hz',
            explicacion: 'A semitone is always the same proportion, 5.95%, so in hertz it grows with the note: ' + num(f * 0.0595, 1) + ' Hz here, from 1.6 Hz at the lowest note to about 235 Hz at the highest.' };
        } },
      { id: 'e13-octava', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const X = azar.elegir([8, 10, 16, 20]), k = azar.elegir([1, 2, 3, 4]);
          return { enunciado: 'At 100 Hz, a wavelet lasts ' + X + ' ms. How long does the same wavelet last when it looks for ' + num(100 * Math.pow(2, k)) + ' Hz?',
            respuesta: X / Math.pow(2, k), toleranciaRel: 0.02, unidad: 'ms',
            explicacion: 'Duration and frequency go in opposite directions: each octave up, half as long. ' + num(100 * Math.pow(2, k)) + ' Hz is ' + k + (k === 1 ? ' octave' : ' octaves') + ' above, and ' + X + ' divided by ' + num(Math.pow(2, k)) + ' is ' + num(X / Math.pow(2, k), 2) + ' ms.' };
        } },
      { id: 'e13-armonicos', tipo: 'opcion', nivel: 'medio', enunciado: 'In the scalogram of an “aah,” the harmonics melt together at the top. Why?',
        opciones: ['Because the tiles are tall at the top: the wavelet is short and its note, blurry', 'Because there is noise', 'Because the voice has no high harmonics', 'Because the microphone cuts the highs'], correcta: 0,
        explicacion: 'The harmonics are at the same distance in hertz, but the width of the wavelet grows with frequency, and at the top one tile covers several harmonics.' },
      { id: 'e13-gabor', tipo: 'vf', nivel: 'basico', enunciado: 'Wavelets break the Gabor limit.', correcta: false,
        explicacion: 'Each tile has the minimum area; wavelets only change its shape depending on pitch.' },
      { id: 'e13-p', tipo: 'opcion', nivel: 'basico', enunciado: 'On a seismogram, which wave arrives first?',
        opciones: ['The P wave', 'The S wave', 'They arrive at the same time', 'It depends on the day'], correcta: 0,
        explicacion: 'P waves are the fastest, and S waves travel at roughly 60% of their speed, so they always arrive later.' },
      { id: 'e13-distancia', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const dt = azar.elegir([3, 5, 8, 12, 20]);
          return { enunciado: 'Between the arrival of the P wave and that of the S wave, ' + dt + ' s go by. If P waves travel at 6 km/s and S waves at 3.5 km/s, how many kilometers away is the earthquake?',
            respuesta: dt * 6 * 3.5 / (6 - 3.5), toleranciaRel: 0.03, unidad: 'km',
            explicacion: 'Both leave at the same time and the arrival difference grows with distance: Δt times 6 times 3.5 divided by (6 − 3.5) comes to about 8.4 km for every second of difference, that is, ' + num(dt * 8.4, 1) + ' km.' };
        } },
      { id: 'e13-petroleo', tipo: 'opcion', nivel: 'basico', enunciado: 'Morlet wavelets were born to…',
        opciones: ['…analyze seismic echoes in the search for oil', '…compress photos', '…recognize voices', '…predict earthquakes'], correcta: 0,
        explicacion: 'Morlet worked for Elf Aquitaine and wanted to read the echoes from layers of rock better. Compression came later.' },
      { id: 'e13-ajuste', tipo: 'deslizador', nivel: 'basico', enunciado: 'Adjust the wavelet until it fits the green wave, which is a 440 Hz note.',
        min: 100, max: 2000, paso: 1, inicial: 150, unidad: 'Hz', etiqueta: 'Frequency it looks for',
        dibujar: (ctx, w, h, v, C) => senoYWavelet(ctx, w, h, C, v), correcto: v => v >= 427 && v <= 453, solucion: 440,
        explicacion: 'The resemblance is highest when the turns of the wavelet coincide with those of the wave: at 440 Hz.' },
      { id: 'e13-oido', tipo: 'opcion', nivel: 'medio', enunciado: 'Which statement about the ear is correct?',
        opciones: ['Its filters widen with frequency, similar to wavelets above about 1,000 Hz, but it doesn’t compute a wavelet transform', 'It computes exactly a wavelet transform', 'It works like a fixed-window spectrogram', 'It doesn’t separate frequencies'], correcta: 0,
        explicacion: 'The width of its filters is almost proportional to frequency above 1 kHz, but the ear is nonlinear and its response depends on loudness.' },
      { id: 'e13-piano', tipo: 'varias', nivel: 'medio', enunciado: 'What do the scalogram and the piano keyboard have in common? Check everything that applies.',
        opciones: ['Equal intervals take up equal distances (logarithmic axis)', 'The relative resolution is the same in all octaves', 'Each octave has the same number of hertz', 'The highs look finer in frequency'], correctas: [0, 1],
        explicacion: 'The piano and the wavelet think in proportions; in hertz, each octave is twice as wide as the previous one, and the highs look blurrier in frequency.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
