// Lesson 12 · The Uncertainty Principle Isn’t Just Quantum: new terms and quiz question bank (English version).
// Loaded by en/e12.html (and by the glossary and exam pages) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // A tile on its plane (time to the right, frequency upward): width and height relative to the box.
  function baldosa(ctx, w, h, C, ancho, alto, { etiqueta } = {}) {
    const caja = { x: 22, y: 8, w: w - 34, h: h - 28 };
    ctx.save();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(caja.x + 0.5, caja.y); ctx.lineTo(caja.x + 0.5, caja.y + caja.h + 0.5); ctx.lineTo(caja.x + caja.w, caja.y + caja.h + 0.5); ctx.stroke();
    const bw = caja.w * ancho, bh = caja.h * alto, bx = caja.x + (caja.w - bw) / 2, by = caja.y + (caja.h - bh) / 2;
    ctx.fillStyle = G.alfa(C.plantilla, 0.3);
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = C.plantilla; ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
    G.texto(ctx, caja.x + 3, caja.y + 9, 'f', { color: C.tenue, tam: 10, C });
    G.texto(ctx, caja.x + caja.w, caja.y + caja.h + 14, 't', { color: C.tenue, tam: 10, alinear: 'right', C });
    if (etiqueta) G.texto(ctx, caja.x + caja.w - 2, caja.y + 10, etiqueta, { color: C.tenue, tam: 10, alinear: 'right', C });
  }

  // A schematic spectrogram of three claps followed by an “aah”: with the short window, with the long one, or with an
  // impossible one that had everything sharp.
  function esquema(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 26 }, fondo = G.magma(0);
    const col = (t, a = 1) => { const c = G.magma(t); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    const X = f => caja.x + caja.w * f, Y = f => caja.y + caja.h * (1 - f);
    ctx.save();
    ctx.fillStyle = 'rgb(' + fondo.join(',') + ')';
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const palmadas = [0.1, 0.24, 0.38];
    if (tipo === 'corta' || tipo === 'nitido') {
      ctx.fillStyle = col(0.88);
      for (const p of palmadas) ctx.fillRect(X(p) - 1, caja.y, 2.2, caja.h);
    } else {
      for (const p of palmadas) {
        const g = ctx.createLinearGradient(X(p - 0.05), 0, X(p + 0.05), 0);
        g.addColorStop(0, col(0.35, 0)); g.addColorStop(0.35, col(0.62, 0.9)); g.addColorStop(1, col(0.3, 0));
        ctx.fillStyle = g;
        ctx.fillRect(X(p - 0.05), caja.y, X(p + 0.05) - X(p - 0.05), caja.h);
      }
    }
    if (tipo === 'corta') {
      ctx.fillStyle = col(0.42, 0.9);
      ctx.fillRect(X(0.52), Y(0.62), X(0.97) - X(0.52), Y(0.25) - Y(0.62));
      ctx.fillStyle = col(0.72, 0.9);
      for (let x = X(0.52); x < X(0.97); x += 4.5) ctx.fillRect(x, Y(0.62), 1.4, Y(0.25) - Y(0.62));
    } else {
      ctx.fillStyle = col(0.8, 0.95);
      for (let i = 0; i < 7; i++) ctx.fillRect(X(0.52), Y(0.12 + i * 0.1) - 0.8, X(0.97) - X(0.52), 1.8);
    }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'time', { color: C.tenue, tam: 10, alinear: 'right', C });
  }

  // The spectrum of two notes, 440 and 440 + Δf Hz, sounding for T seconds with a Hann window.
  function dosNotas(ctx, w, h, C, df, T) {
    const FA = 2000, n = Math.max(8, Math.round(T * FA)), x = new Float64Array(n);
    for (let i = 0; i < n; i++) { const t = i / FA - T / 2; x[i] = Math.cos(TAU * 440 * t) + Math.cos(TAU * (440 + df) * t + Math.PI / 2); }
    const e = Senal.espectro(x, FA, { ventana: 'hann', nfft: Senal.siguientePotencia2(n * 16) });
    const esc = G.ejes(ctx, { caja: { x: 12, y: 10, w: w - 24, h: h - 38 }, x: [440 - 8, 440 + df + 8], y: [0, 1.6], marcasY: false, marcasX: [440, 440 + df], formatoX: v => num(v) + ' Hz', rejilla: false, C });
    for (const f of [440, 440 + df]) G.linea(ctx, esc, [f, f], [0, 1.6], { color: C.eje, ancho: 1.2, guiones: [4, 4], alfa: 0.8, halo: false, C });
    G.linea(ctx, esc, e.f, e.mag, { color: C.espectro, ancho: 2.2, C });
  }

  Curso.datos('e12', {
    terminos: [
      { termino: 'Uncertainty principle (time–frequency)', definicion: 'A signal can’t be both highly concentrated in time and highly concentrated in frequency at once.', imagen: 'The tile that stretches or flattens, but doesn’t shrink' },
      { termino: 'Gabor limit', definicion: 'The minimum area a signal can occupy in the time–frequency plane, measured with standard deviations.', imagen: 'The “1.00 times the minimum” reading, which doesn’t drop' },
      { termino: 'Tile (Heisenberg box)', definicion: 'The rectangle of time and frequency that each measurement of an analysis occupies.', imagen: 'The cells of the spectrogram, seen up close' },
      { termino: 'Gabor atom (elementary signal)', definicion: 'A Ferris wheel trimmed by a Gaussian bell curve: the signal that occupies the smallest possible tile.', imagen: 'The green wave with its purple bell curve' },
      { termino: 'Gaussian window', definicion: 'A window shaped like a Gaussian bell curve, the only one whose tile reaches the Gabor limit.', imagen: 'The purple bell curve whose spectrum is another bell curve' },
      { termino: 'Time resolution', definicion: 'How close two events can be and still show up separate.', imagen: 'Two claps that merge or don’t' },
      { termino: 'Frequency resolution', definicion: 'How close two notes can be and still show up separate.', imagen: 'The two peaks of the tuner' },
      { termino: 'Time–frequency trade-off', definicion: 'The choice between seeing when well or seeing which one well that any window forces on you.', imagen: 'The same audio with a short window and with a long window' },
    ],

    preguntas: [
      // 1 · Basic: what the principle says.
      {
        id: 'e12-que-dice', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does the uncertainty principle for signals say?',
        opciones: ['A signal can’t be both very brief and have a very precise frequency', 'Measuring a signal disturbs it', 'Noise prevents you from knowing the frequency', 'It only applies to particles'],
        correcta: 0,
        explicacion: 'It is a property of any wave: what is concentrated in time is spread out in frequency, and the other way around. It has nothing to do with measurement disturbing the signal, with noise or with particles.',
      },
      // 2 · Generated numeric: the minimum width in frequency.
      {
        id: 'e12-anchura', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const x = azar.elegir([2, 4, 5, 8, 10, 16, 20, 25, 40]);
          return {
            enunciado: 'A Gaussian window has a width in time of **' + x + ' ms**, measured as the standard deviation of its energy. What is the smallest possible width in frequency, measured the same way, in hertz?',
            respuesta: 1000 / (4 * Math.PI * x), toleranciaRel: 0.03, unidad: 'Hz', decimales: 1,
            explicacion: 'With standard deviations, the product of the two widths doesn’t drop below 1/(4π), about 0.08 turns, and the Gaussian bell curve reaches it exactly. So the width in frequency is 1/(4π · ' + num(x / 1000) + ' s) = ' + num(1000 / (4 * Math.PI * x), 1) + ' Hz.',
          };
        },
      },
      // 3 · Generated numeric and applied: how long you have to listen.
      {
        id: 'e12-afinador-ms', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const df = azar.elegir([2, 4, 5, 8, 10, 20, 40]);
          return {
            enunciado: 'With a Hann window, separating two notes that are **' + df + ' Hz** apart takes a window of at least twice one divided by that difference. How many milliseconds are needed?',
            respuesta: 2000 / df, toleranciaRel: 0.03, unidad: 'ms', unidades: { ms: 1, s: 1000 },
            explicacion: 'Twice one divided by ' + df + ' Hz is ' + num(2 / df) + ' s, that is, ' + num(2000 / df) + ' ms. The more alike two notes are, the longer you have to listen for them to drift far enough out of phase for the difference to show.',
          };
        },
      },
      // 4 · Generated true or false: does a window exist that serves both things?
      {
        id: 'e12-posible', tipo: 'vf', nivel: 'reto',
        generar: azar => {
          let d, df, p;
          do { d = azar.elegir([5, 10, 20, 40]); df = azar.elegir([10, 20, 50, 100, 200]); p = d * df / 1000; } while (p >= 0.8 && p <= 1.25);
          return {
            enunciado: 'There are two bangs **' + d + ' ms** apart and two notes **' + df + ' Hz** apart. A Hann window exists that separates the two bangs and the two notes at the same time.',
            correcta: p > 1,
            explicacion: 'The bangs ask for a window shorter than ' + num(2 * d) + ' ms, twice their spacing, and the notes for one longer than ' + num(2000 / df) + ' ms, twice one divided by their difference. ' + (p > 1 ? 'Both requirements fit because the product of the spacing (' + num(d / 1000) + ' s) and the difference (' + df + ' Hz) is ' + num(p) + ', greater than one.' : 'They don’t both fit because the product of the spacing (' + num(d / 1000) + ' s) and the difference (' + df + ' Hz) is ' + num(p) + ', less than one.'),
          };
        },
      },
      // 5 · Which window reaches the minimum.
      {
        id: 'e12-mejor-ventana', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Which window shape reaches exactly the minimum tile area?',
        opciones: ['The Gaussian bell curve', 'The Hann window', 'The rectangular window', 'The Hamming window'],
        correcta: 0,
        explicacion: 'The Gaussian bell curve has another bell curve as its spectrum, with no edges or leakage. Hann stays within 2.6% of the minimum, Hamming quite a bit farther because of the step at its edges, and the rectangular window far more, because of its jumps.',
      },
      // 6 · Visual: the tile of a clap.
      {
        id: 'e12-baldosa-palmada', tipo: 'grafica', nivel: 'basico',
        enunciado: 'Which is the tile of a **clap**?',
        opciones: [
          (ctx, w, h, C) => baldosa(ctx, w, h, C, 0.14, 0.82),
          (ctx, w, h, C) => baldosa(ctx, w, h, C, 0.82, 0.14),
          (ctx, w, h, C) => baldosa(ctx, w, h, C, 0.1, 0.1),
        ],
        correcta: 0,
        explicacion: 'A bang is very localized in time and spread over many frequencies: a narrow, tall tile. The low, wide one is that of a long note, and the tiny one is impossible, because the area of a tile has a minimum.',
      },
      // 7 · Visual: what you see with the short window.
      {
        id: 'e12-espectrograma-corta', tipo: 'grafica', nivel: 'medio',
        enunciado: 'The same sound, three claps and an “aah,” is analyzed with two windows. Which is the spectrogram with the **short window**?',
        opciones: [
          (ctx, w, h, C) => esquema(ctx, w, h, C, 'larga'),
          (ctx, w, h, C) => esquema(ctx, w, h, C, 'corta'),
          (ctx, w, h, C) => esquema(ctx, w, h, C, 'nitido'),
        ],
        correcta: 1,
        explicacion: 'The short window locates the bangs well, which come out as thin vertical lines, and merges the harmonics of the “aah” into a band with little vertical lines. The first is the long window’s, and the third, with everything sharp at once, doesn’t exist.',
      },
      // 8 · Common mistake: more samples per second.
      {
        id: 'e12-mas-muestras', tipo: 'vf', nivel: 'basico',
        enunciado: 'If I record with more samples per second, the limit between time and frequency disappears.',
        correcta: false,
        explicacion: 'The limit depends on how long the window lasts, not on the number of samples. More samples per second add frequencies at the top, but they don’t sharpen the ones that were already there.',
      },
      // 9 · Common mistake: is it quantum?
      {
        id: 'e12-cuantico', tipo: 'vf', nivel: 'medio',
        enunciado: 'The uncertainty principle for signals is a quantum effect.',
        correcta: false,
        explicacion: 'It is the same mathematical inequality, because in quantum mechanics position and momentum are a Fourier pair, like time and frequency. But in a sound there is nothing quantum: no particles, and nobody disturbing it when you measure.',
      },
      // 10 · Applied: the bass and the violin.
      {
        id: 'e12-bajo-violin', tipo: 'opcion', nivel: 'medio',
        enunciado: 'To recognize a note, a tuner needs to see several cycles of the wave. Why will it take longer with the lowest string of a bass, about 41 Hz, than with the highest string of a violin, about 659 Hz?',
        opciones: ['Because each cycle of a low wave lasts longer, and several are needed', 'Because low pitches have less energy', 'Because the microphone doesn’t pick up low pitches', 'Because the phone processes low pitches more slowly'],
        correcta: 0,
        explicacion: 'One cycle at 41 Hz lasts about 24 ms, and one at 659 Hz, about 1.5 ms. Several cycles of the low note add up to tenths of a second; those of the high one, a few thousandths. It is not a problem of energy, microphone or phone speed.',
      },
      // 11 · Visual with slider: the minimum time to separate 440 and 444 Hz.
      {
        id: 'e12-deslizador-afinador', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'With a Hann window, two notes show up separate when the window lasts at least twice one divided by their difference. Set the shortest listening time that separates **440 and 444 Hz** sounding together.',
        min: 0.05, max: 2, paso: 0.05, inicial: 0.2, unidad: 's', etiqueta: 'Listening time', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => dosNotas(ctx, w, h, C, 4, valor),
        correcto: v => v >= 0.5 - 1e-9 && v <= 0.6 + 1e-9, solucion: 0.55,
        explicacion: 'Twice one divided by 4 Hz is 0.5 s. With less, the two peaks merge into a single mountain; from there on a gap appears between them and grows the longer you listen.',
      },
      // 12 · Several answers: what the limit does (and doesn't) say.
      {
        id: 'e12-varias', tipo: 'varias', nivel: 'reto',
        enunciado: 'Which of these statements about the limit are true? Mark all that are.',
        opciones: ['The exact value of the minimum depends on how the width is measured', 'Measured with standard deviations, the product of the two widths doesn’t drop below about 0.08 turns', 'With the rectangular window you can get below that minimum', 'It only affects sounds'],
        correctas: [0, 1],
        explicacion: 'The minimum changes with the measure (with Gabor’s effective duration it is one half), but with standard deviations it is 1/(4π), about 0.08 turns. The rectangular window is among those that stray farthest from it, and the limit holds for any signal, whether sound, radio or light.',
      },
      // 13 · Applied: the equalizer.
      {
        id: 'e12-ecualizador', tipo: 'opcion', nivel: 'medio',
        enunciado: 'In an equalizer, a very narrow band, a few hertz wide...',
        opciones: ['...is slow to react and, when the sound cuts off, keeps ringing a little', '...responds instantly, because it is very precise', '...doesn’t affect time, only frequency', '...removes all the other frequencies'],
        correcta: 0,
        explicacion: 'Response time and width go together: Gabor already summed it up by saying that the time a resonator takes to die out, multiplied by its tuning width, gives a number of the order of one.',
      },
      // 14 · Generated numeric: the best window for a rising whistle.
      {
        id: 'e12-silbido', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const c = azar.elegir([500, 1000, 2000, 4000, 8000]);
          return {
            enunciado: 'A whistle rises **' + num(c) + ' Hz every second**. How many milliseconds should the standard deviation of the Gaussian window, measured in its amplitude, be to leave its line as thin as possible in the spectrogram?',
            respuesta: 1000 / Math.sqrt(TAU * c), toleranciaRel: 0.05, unidad: 'ms', decimales: 1,
            explicacion: 'If the window is long, the note changes inside it and the line gets thicker; if it is short, it gets thicker because of the uncertainty. The balance is one divided by the square root of 2π times the rate of rise: 1/√(2π · ' + num(c) + ') = ' + num(1000 / Math.sqrt(TAU * c), 1) + ' ms.',
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
