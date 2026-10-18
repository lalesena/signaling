// Lesson 21 · The frontier: what we still don’t know. Terms and quiz question bank (English version).
// Lo carga e21.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = 2 * Math.PI;
  const num = (x, d) => Curso.num(x, d);

  // ── Dibujos pequeños ──
  // Un mapa de juguete con la línea de un chirp que sube, con el grosor que da cada método.
  function lineaChirp(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 16 };
    ctx.save();
    ctx.fillStyle = C.pantalla; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const X = u => caja.x + u * caja.w, Y = v => caja.y + (1 - v) * caja.h, linea = u => 0.15 + 0.7 * u * u;
    const rgb = (t, a) => { const [r, g, b] = Graficas.magma(t); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
    ctx.lineCap = 'round';
    const N = 60;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, centro = 1 - Math.pow(2 * ((u0 + u1) / 2) - 1, 2);   // 1 en el centro del chirp
      const grosor = tipo === 'esp' ? 0.2 : tipo === 'sst' ? 0.03 + 0.17 * centro : 0.014;
      const px = grosor * caja.h;
      for (const [f, a, t] of [[1, 0.45, 0.45], [0.55, 0.8, 0.7], [0.2, 1, 0.95]]) {
        ctx.strokeStyle = rgb(t, a * (tipo === 'esp' ? 0.9 : 1)); ctx.lineWidth = Math.max(1.2, px * f);
        ctx.beginPath(); ctx.moveTo(X(u0), Y(linea(u0))); ctx.lineTo(X(u1), Y(linea(u1))); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
  }
  // Una «aaa» en un mapa de juguete: según el modo, una pila de líneas, solo la de abajo o solo una alta y brillante.
  function pilaDeLineas(ctx, w, h, C, modo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 16 };
    ctx.save();
    ctx.fillStyle = C.pantalla; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const Y = v => caja.y + (1 - v) * caja.h, rgb = (t, a) => { const [r, g, b] = Graficas.magma(t); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
    ctx.lineCap = 'round';
    const niveles = modo === 'pila' ? [0.14, 0.28, 0.42, 0.56, 0.7, 0.84] : modo === 'abajo' ? [0.14] : [0.56];
    niveles.forEach((v, i) => {
      const brillo = modo === 'pila' ? [0.75, 0.85, 1, 0.8, 0.6, 0.45][i] : 0.95;
      ctx.strokeStyle = rgb(brillo * 0.6, 0.5); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(caja.x, Y(v)); ctx.lineTo(caja.x + caja.w, Y(v)); ctx.stroke();
      ctx.strokeStyle = rgb(brillo, 1); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(caja.x, Y(v)); ctx.lineTo(caja.x + caja.w, Y(v)); ctx.stroke();
    });
    ctx.restore();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
  }
  // Los picos que ve el espectro de dos tonos de 1.000 y 1.000 + delta Hz con una ventana de Hann de 64 ms; el peor caso entre cuatro fases.
  function dosPicos(delta) {
    const fs = 8000, n = 512; let minimo = Infinity, vista = null;
    for (let q = 0; q < 4; q++) {
      const x = new Float64Array(n);
      for (let i = 0; i < n; i++) { const t = i / fs; x[i] = 0.5 * Math.cos(TAU * 1000 * t) + 0.5 * Math.cos(TAU * (1000 + delta) * t + q * Math.PI / 2); }
      const E = Senal.espectro(x, fs, { ventana: 'hann', nfft: 8192, escala: 'amplitud' });
      let m = 0, picos = 0; for (let i = 0; i < E.mag.length; i++) m = Math.max(m, E.mag[i]);
      for (let i = 1; i < E.mag.length - 1; i++) if (E.f[i] > 800 && E.f[i] < 1300 && E.mag[i] > E.mag[i - 1] && E.mag[i] >= E.mag[i + 1] && E.mag[i] > 0.5 * m) picos++;
      if (picos < minimo) { minimo = picos; vista = E; }
    }
    return { picos: minimo, f: vista.f, mag: vista.mag };
  }
  let dMin = null;
  const deltaMinimo = () => { if (dMin == null) { dMin = 100; for (let d = 1; d <= 100; d++) if (dosPicos(d).picos >= 2) { dMin = d; break; } } return dMin; };
  function espectroDosTonos(ctx, w, h, valor, C) {
    const r = dosPicos(valor), f = [], v = [];
    for (let i = 0; i < r.f.length; i++) if (r.f[i] >= 900 && r.f[i] <= 1200) { f.push(r.f[i]); v.push(r.mag[i]); }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 30 }, x: [900, 1200], y: [0, 1.1], marcasY: false, marcasX: [900, 1000, 1100, 1200], formatoX: x => num(x), rejilla: false, C });
    Graficas.linea(ctx, esc, f, v, { color: C.espectro, ancho: 2, C });
    Graficas.texto(ctx, w - 12, 18, r.picos >= 2 ? 'two peaks' : 'one peak', { alinear: 'right', color: C.suave, tam: 11, C });
  }
  // Una onda gravitacional sintética: la frecuencia sube cada vez más deprisa hasta el choque.
  function chirpGravitacional(ctx, w, h, C) {
    const x = Senal.ondaGravitacional({ fs: 1000, dur: 1, tc: 0.75, f0: 35 }), fi = x.verdad.fi[0], ts = [], fs = [];
    for (let i = 0; i < 740; i += 5) { ts.push(i / 1000); fs.push(fi[i]); }
    const esc = Graficas.ejes(ctx, { caja: { x: 38, y: 8, w: w - 48, h: h - 30 }, x: [0, 0.75], y: [0, 300], marcasY: [0, 100, 200, 300], marcasX: [0, 0.25, 0.5, 0.75], formatoX: v => num(v, 2) + ' s', formatoY: v => num(v), rejilla: false, C });
    Graficas.linea(ctx, esc, ts, fs, { color: C.senal, ancho: 2.2, C });
    Graficas.texto(ctx, 4, h - 22, 'Hz', { color: C.tenue, tam: 10, C });
    Graficas.texto(ctx, esc.x(0.02), esc.y(250), 'synthetic', { color: C.tenue, tam: 10, C });
  }

  Curso.datos('e21', {
    terminos: [
      { termino: 'Second-order synchrosqueezing', definicion: 'A synchrosqueezing that also estimates how much each component accelerates and uses that to correct its frequency.', imagen: 'The Ferris wheel with a second gauge, the acceleration one' },
      { termino: 'Higher-order synchrosqueezing', definicion: 'The same idea with more terms, for components whose acceleration also changes.', imagen: 'The gravitational-wave Ferris wheel, which accelerates more and more' },
      { termino: 'Chirp rate', definicion: 'How many hertz the frequency goes up or down each second.', imagen: 'The acceleration needle of the Ferris wheel' },
      { termino: 'Synchroextracting transform', definicion: 'A variant that keeps only the coefficients that are already in the row of their estimated frequency and discards the rest.', imagen: 'The cabins outside their row, switched off' },
      { termino: 'Multisynchrosqueezing', definicion: 'A variant that applies the synchrosqueezing push several times in a row, according to its abstract, without losing the reconstruction.', imagen: 'Squeezing the same lemon two and three times' },
      { termino: 'Wave shape', definicion: 'The drawing of a single cycle of an oscillation that is not a sine wave, like that of a vowel or a heartbeat.', imagen: 'A Ferris wheel that is not round' },
      { termino: 'Cepstrum', definicion: 'A measure of the rhythm at which the lines of a spectrum repeat, which gives away the period of a family of harmonics.', imagen: 'The rungs of a ladder of lines, counted' },
      { termino: 'De-shape', definicion: 'A method that, using the cepstrum, leaves on the map only the fundamental of each family of harmonics.', imagen: 'The epicycles with only the big wheel switched on' },
      { termino: 'Chirplet transform', definicion: 'An analysis with windows that also accelerate, to sharpen the components that rise or fall.', imagen: 'A template that accelerates alongside the Ferris wheel' },
      { termino: 'Time–frequency–chirp-rate representation', definicion: 'A map with a third axis, the chirp rate, in which components that cross get separated.', imagen: 'Two lines passing over one another in three dimensions' },
      { termino: 'ConceFT (averaging over windows)', definicion: 'Averaging synchrosqueezings made with different windows so that the lines stay and the noise dilutes.', imagen: 'The Ferris wheel in fog, seen through many windows' },
      { termino: 'Spectrogram zeros', definicion: 'The points on the map where the energy is exactly zero; those of white noise are spread out regularly.', imagen: 'The dark gaps between the bubbles' },
      { termino: 'Neural network', definicion: 'A program that learns from examples to turn an input, a few milliseconds of audio, into an answer, a note, without hand-written rules.', imagen: 'Someone who has seen thousands of Ferris wheels and guesses their speed at a glance' },
      { termino: 'Generalization', definicion: 'How well a learned method works on what it never saw during training.', imagen: 'The odd flute that the network does not recognize' },
    ],

    preguntas: [
      // 1 · Básica: la suposición de 2011.
      {
        id: 'e21-suposicion', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does the 2011 synchrosqueezing assume about the signal?',
        opciones: ['That it is a sum of a few Ferris wheels that change slowly and are kept apart', 'That it has no noise at all', 'That it always repeats exactly the same'],
        correcta: 0,
        explicacion: 'That assumption is what lets it place each bit of energy in its row. It tolerates some noise and does not require the signal to be periodic; what it does not tolerate is wheels that accelerate a lot, cross, or cannot be told apart.',
      },
      // 2 · Error típico: romper la incertidumbre.
      {
        id: 'e21-incertidumbre', tipo: 'vf', nivel: 'basico',
        enunciado: 'The methods that came after 2011 break the uncertainty principle.',
        correcta: false,
        explicacion: 'None of them breaks it: they get around it by assuming something about the signal. If the signal does not meet the assumption, the sharp image can be wrong.',
      },
      // 3 · Opción: el segundo orden.
      {
        id: 'e21-segundo-orden', tipo: 'opcion', nivel: 'medio',
        enunciado: 'What does second-order synchrosqueezing add?',
        opciones: ['It also estimates how much the frequency accelerates and corrects for it', 'It uses a longer window', 'It erases the noise before computing'],
        correcta: 0,
        explicacion: 'Besides the speed of each wheel, it measures its acceleration. For a linear chirp with a Gaussian envelope it is exactly right, and it costs five transforms instead of one.',
      },
      // 4 · Gráfica generada: qué mapa da cada método.
      {
        id: 'e21-mapas', tipo: 'grafica', nivel: 'medio',
        generar: azar => {
          const clave = azar.elegir(['esp', 'sst', 'sst2']);
          const nombre = { esp: 'the spectrogram', sst: 'first-order synchrosqueezing', sst2: 'second-order synchrosqueezing' }[clave];
          return {
            enunciado: 'These are three maps of the same very fast chirp. Which one is the map of ' + nombre + '?',
            opciones: [(ctx, w, h, C) => lineaChirp(ctx, w, h, C, 'esp'), (ctx, w, h, C) => lineaChirp(ctx, w, h, C, 'sst'), (ctx, w, h, C) => lineaChirp(ctx, w, h, C, 'sst2')],
            correcta: { esp: 0, sst: 1, sst2: 2 }[clave],
            explicacion: 'The spectrogram has the thickness of the tile. First order widens when the frequency changes a lot inside the window, especially in the middle of the chirp. Second order corrects for the acceleration and leaves the line thin.',
          };
        },
      },
      // 5 · Numérica generada: cuánto cambia la frecuencia en la ventana.
      {
        id: 'e21-ventana', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const c = azar.elegir([500, 1000, 2000, 4000, 8000]), T = azar.elegir([16, 32, 64, 128]);
          return {
            enunciado: 'A window lasts ' + T + ' ms and the frequency of a chirp rises ' + num(c) + ' Hz every second. How many hertz does the frequency change inside the window?',
            respuesta: c * T / 1000, toleranciaRel: 0.01, unidad: 'Hz', decimales: 2,
            explicacion: 'You multiply the acceleration by the duration: ' + num(c) + ' × ' + num(T / 1000, 3) + ' = ' + num(c * T / 1000, 2) + ' Hz. If that change is comparable to the width of the tile, on the order of 1/T, the first-order assumption fails and the line blurs. That is why long windows suffer more with fast chirps.',
          };
        },
      },
      // 6 · Opción: el synchroextracting.
      {
        id: 'e21-extraer', tipo: 'opcion', nivel: 'medio',
        enunciado: 'What does synchroextracting do?',
        opciones: ['It keeps only the coefficients that are already in the row of their estimated frequency and discards the rest', 'It repeats the synchrosqueezing several times', 'It adds an acceleration axis'],
        correcta: 0,
        explicacion: 'That is why its lines are extremely thin but throw away energy, and with strong accelerations they can drift. Repeating the push is multisynchrosqueezing, and the acceleration axis is the chirplet.',
      },
      // 7 · Aplicada: la sonata K.304.
      {
        id: 'e21-mozart', tipo: 'opcion', nivel: 'medio',
        enunciado: 'In Mozart’s sonata K.304, the piano plays a B3 (246.9 Hz) while the violin plays a B4 (493.88 Hz). Why is it hard to separate them in a spectrogram?',
        opciones: ['Because every harmonic of the violin falls on a harmonic of the piano', 'Because the piano has no harmonics', 'Because the violin sounds lower than the piano'],
        correcta: 0,
        explicacion: '493.88 Hz is double 246.9 Hz, so the violin’s multiples coincide with the even multiples of the piano. The de-shape switches on only the fundamental of each family and separates the two notes.',
      },
      // 8 · Gráfica: qué dibuja el de-shape.
      {
        id: 'e21-deshape', tipo: 'grafica', nivel: 'medio',
        enunciado: 'A voice sings “aah.” What does the de-shape draw?',
        opciones: [(ctx, w, h, C) => pilaDeLineas(ctx, w, h, C, 'pila'), (ctx, w, h, C) => pilaDeLineas(ctx, w, h, C, 'abajo'), (ctx, w, h, C) => pilaDeLineas(ctx, w, h, C, 'arriba')],
        correcta: 1,
        explicacion: 'The de-shape multiplies the map by another one that votes for the frequency whose family of multiples is present, the fundamental. Keeping the brightest line, which is sometimes a harmonic, would bring back the octave error.',
      },
      // 9 · Verdadero o falso: CREPE trozo a trozo.
      {
        id: 'e21-crepe-trozos', tipo: 'vf', nivel: 'medio',
        enunciado: 'CREPE estimates the note of each chunk of audio separately, without looking at the neighboring chunks.',
        correcta: true,
        explicacion: 'Its authors say so and propose adding temporal tracking; pYIN, by contrast, uses Viterbi. The path from lesson 20 is still useful with a network.',
      },
      // 10 · Aplicada, error típico: la dizi.
      {
        id: 'e21-dizi', tipo: 'opcion', nivel: 'medio',
        enunciado: 'CREPE did worse with the dizi, a Chinese flute. Why?',
        opciones: ['In that part of the test there was no dizi among its training examples', 'The dizi has no fundamental frequency', 'The network does not support wind instruments'],
        correcta: 0,
        explicacion: 'All the dizi tracks were by the same performer and ended up together in the test split. A network learns from what it sees, and faced with a new timbre it can fail.',
      },
      // 11 · Numérica generada: casillas de una red.
      {
        id: 'e21-casillas', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const c = azar.elegir([10, 20, 25, 50]), n = azar.elegir([4, 5, 6, 7]);
          return {
            enunciado: 'A network divides pitches into bins of ' + c + ' cents across ' + n + ' octaves. How many bins does it have?',
            respuesta: n * 1200 / c, tolerancia: 0.01, unidad: 'bins', decimales: 0,
            explicacion: 'An octave is 1,200 cents, so ' + n + ' octaves are ' + num(n * 1200) + ' cents, and divided by ' + c + ' that gives ' + num(n * 1200 / c) + ' bins. CREPE uses bins of 20 cents over 6 octaves, from C1 to B7: 360 bins.',
          };
        },
      },
      // 12 · Deslizador: una noria o dos.
      {
        id: 'e21-una-o-dos', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Separate two equal tones just enough for the spectrum, with a 64 ms Hann window, to show two peaks.',
        min: 1, max: 100, paso: 1, inicial: 5, unidad: 'Hz', etiqueta: 'Separation',
        dibujar: (ctx, w, h, valor, C) => espectroDosTonos(ctx, w, h, valor, C),
        correcto: v => dosPicos(v).picos >= 2 && v <= deltaMinimo() + 4, get solucion() { return deltaMinimo(); },
        explicacion: 'Below that separation, the spectrum sees a single wheel that pulses. Whether there are one or two is a modeling decision, and synchrosqueezing requires, by hypothesis, a minimum separation between components.',
      },
      // 13 · Numérica generada, aplicada y con figura: las octavas de GW150914.
      {
        id: 'e21-octavas', tipo: 'numero', nivel: 'reto', temporada: false,
        figura: chirpGravitacional, textoFigura: 'A synthetic gravitational wave: the frequency rises faster and faster',
        generar: azar => {
          const f1 = azar.elegir([30, 35, 40]), f2 = azar.elegir([150, 200, 250]);
          return {
            enunciado: 'The signal of the first gravitational wave ever detected rose from ' + f1 + ' to ' + f2 + ' Hz. How many octaves did it rise?',
            respuesta: Math.log2(f2 / f1), tolerancia: 0.02, unidad: 'octaves', decimales: 2,
            explicacion: 'Each octave doubles the frequency, so the number of octaves is log₂(' + f2 + '/' + f1 + ') = ' + num(Math.log2(f2 / f1), 2) + '. In the LIGO paper, the signal rises from 35 to 250 Hz and, in about 0.2 s, makes about 8 cycles between 35 and 150 Hz: a Ferris wheel that accelerates more and more.',
          };
        },
      },
      // 14 · Varias, aplicada: usos publicados.
      {
        id: 'e21-usos', tipo: 'varias', nivel: 'medio',
        enunciado: 'In which of these uses are there published studies with time–frequency maps like the ones in this course?',
        opciones: ['Tracking electroencephalogram rhythms during anesthesia', 'Detecting faults in machine bearings', 'Seeing the gravitational wave from two black holes', 'Knowing what a person is thinking from their voice'],
        correctas: [0, 1, 2],
        explicacion: 'The first three are published: Purdon and colleagues (2013) with electroencephalogram spectrograms, industrial engineering studies on bearings, and the LIGO paper (2016). All of it is research. Reading thoughts from the voice has no basis.',
      },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
