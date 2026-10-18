// Lesson 17 · When several wheels sound at once: new terms and the quiz question bank.
// Loaded by e17.html (and by glosario.html and examenes.html) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // A curve on a small canvas, with its zero line.
  function curva(ctx, w, h, C, f, opciones) {
    const o = Object.assign({ y: [-1.3, 1.3], color: C.senal, ancho: 1.8 }, opciones || {});
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 24 }, x: [0, 1], y: o.y, marcasY: false, marcasX: [0, 1], formatoX: v => num(v) + ' s', rejilla: false, C });
    ctx.save();
    ctx.strokeStyle = G.alfa(C.eje, 0.7); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(esc.caja.x, Math.round(esc.y(0)) + 0.5); ctx.lineTo(esc.caja.x + esc.caja.w, Math.round(esc.y(0)) + 0.5); ctx.stroke();
    ctx.restore();
    G.curva(ctx, esc, f, { color: o.color, ancho: o.ancho, n: 700, C });
    return esc;
  }

  // The two envelopes and the value of the signal at one instant, for the sifting question.
  function tamiz(ctx, w, h, C, U, L, X) {
    const esc = G.ejes(ctx, { caja: { x: 40, y: 10, w: w - 56, h: h - 20 }, x: [0, 1], y: [-2.4, 2.4], marcasX: false, marcasY: [-2, -1, 0, 1, 2], formatoY: v => num(v), rejilla: false, C });
    for (const [v, tx] of [[U, 'U'], [L, 'L']]) {
      G.curva(ctx, esc, () => v, { color: C.cuerpo, ancho: 1.4, guiones: [5, 4], halo: false, n: 4, C });
      G.texto(ctx, esc.x(1) - 4, esc.y(v) + (v > 0 ? -5 : 13), tx + ' = ' + num(v, 2), { alinear: 'right', color: C.suave, tam: 10, peso: 600, C });
    }
    G.puntos(ctx, esc, [0.45], [X], { color: C.senal, radio: 6, C });
    G.texto(ctx, esc.x(0.45) + 10, esc.y(X) + 4, 'X = ' + num(X, 2), { color: C.texto, tam: 10, peso: 600, C });
  }

  // Two sinusoids and the bar of their ratio, for the slider question.
  function dosYCociente(ctx, w, h, C, valor) {
    const mitad = Math.round(w * 0.62);
    const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: mitad - 16, h: h - 30 }, x: [0, 0.01], y: [-2.3, 2.3], marcasY: false, marcasX: [0, 0.005, 0.01], formatoX: v => num(v * 1000) + ' ms', rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * 1000 * t) + Math.sin(TAU * valor * t + 0.5), { color: C.senal, ancho: 1.6, n: 500, C });
    const bx = mitad + 14, bw = w - bx - 14, by = h / 2 - 6, k = bw / 1;
    ctx.save();
    ctx.fillStyle = G.alfa(C.cuerpo, 0.12); ctx.fillRect(bx, by, bw, 12);
    ctx.fillStyle = C.respuesta; ctx.fillRect(bx, by, Math.min(bw, valor / 1000 * k), 12);
    ctx.restore();
    G.texto(ctx, bx, by - 8, 'slow / fast', { color: C.suave, tam: 10, C });
    G.texto(ctx, bx, by + 30, num(valor / 1000, 2), { color: C.texto, tam: 12, peso: 600, C });
  }

  // Three possible layers for the mode-mixing question: a slow wave with two beeps.
  const lenta = t => 0.9 * Math.sin(TAU * 1.5 * t);
  const pitido = t => ((t >= 0.18 && t < 0.4) || (t >= 0.62 && t < 0.84) ? 0.28 * Math.sin(TAU * 24 * t) : 0);
  const dentro = t => (t >= 0.18 && t < 0.4) || (t >= 0.62 && t < 0.84);

  Curso.datos('e17', {
    terminos: [
      { termino: 'Mode (component)', definicion: 'An oscillation that goes up and down around zero and whose size and rhythm change slowly.', imagen: 'A wheel from the series, with a radius that breathes and a speed that accelerates' },
      { termino: 'Multicomponent signal', definicion: 'A signal made of several modes sounding at once.', imagen: 'Several wheels turning together, each at its own pace' },
      { termino: 'Empirical mode decomposition (EMD)', definicion: 'A method that peels the signal into layers, from the fastest to the slowest, using only its peaks and valleys.', imagen: 'Peeling an onion' },
      { termino: 'Intrinsic mode function (IMF)', definicion: 'The technical name for a clean layer: it oscillates symmetrically around zero, with as many zero crossings as extrema, or one more or less.', imagen: 'The layer with no ripples riding on top of it' },
      { termino: 'Sifting', definicion: 'Joining the peaks with one curve, the valleys with another, subtracting the average of the two, and repeating.', imagen: 'A sieve that lets the slow part through and holds back the fast part' },
      { termino: 'Peak and valley envelopes', definicion: 'The two smooth curves that touch the maxima and the minima of the signal.', imagen: 'Two taut ropes above and below the wave' },
      { termino: 'Residue', definicion: 'What is left when no more layers can be pulled out: the trend.', imagen: 'The heart of the onion' },
      { termino: 'Stopping criterion', definicion: 'The rule that decides when a layer is already clean and sifting stops.', imagen: 'Stop peeling when the middle line no longer moves' },
      { termino: 'Mode mixing', definicion: 'When a layer mixes oscillations of very different rhythms, or a single oscillation gets split among several layers.', imagen: 'Two layers of the onion stuck together' },
      { termino: 'Hilbert–Huang transform', definicion: 'Empirical decomposition followed by the analytic signal of each layer, to draw its energy in time and frequency.', imagen: 'Each wheel peeled, with its radius and its speed at every instant' },
      { termino: 'Hilbert spectrum', definicion: 'The time–frequency map that draws the instantaneous frequency of each layer, with its energy.', imagen: 'One line per wheel on the sheet music' },
      { termino: 'EEMD', definicion: 'Repeating the decomposition on many copies of the signal with different noise and averaging the layers.', imagen: 'Many onions peeled at once and stacked on top of each other' },
      { termino: 'VMD', definicion: 'A method that looks for all the layers at once, each one narrow around its central frequency, and that has to be told how many.', imagen: 'Several filters that move on their own until they fit the mountains of the spectrum' },
    ],

    preguntas: [
      // 1 · Basic: what a sifting pass does.
      {
        id: 'e17-tamizado', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does a sifting pass do?',
        opciones: [
          'It subtracts from the signal the average of the curve joining the maxima and the one joining the minima',
          'It removes all frequencies above a fixed cutoff',
          'It averages the signal with a sliding window',
        ],
        correcta: 0,
        explicacion: 'The method uses no fixed cutoffs or windows: the two envelopes come from the peaks and valleys of the signal itself, which is why it adapts to each one.',
      },
      // 2 · True or false: the sum identity.
      {
        id: 'e17-suma', tipo: 'vf', nivel: 'basico',
        enunciado: 'Adding up all the layers and the residue recovers the signal exactly.',
        correcta: true,
        explicacion: 'Each layer is subtracted from what is left, so the sum is an identity, as Huang already pointed out in 1998. What is not guaranteed is that each layer means anything.',
      },
      // 3 · Common mistake: separating any pair of notes.
      {
        id: 'e17-cualquier-par', tipo: 'vf', nivel: 'medio',
        enunciado: 'Empirical decomposition separates any two notes, however close they are.',
        correcta: false,
        explicacion: 'With ten sifting passes, it never separates two tones whose frequency ratio is above about 0.67, and in practice the comfortable margin is around 0.5 (Rilling and Flandrin, 2008). Closer than that, it sees one wheel that throbs.',
      },
      // 4 · Generated, with a figure: one sifting pass.
      {
        id: 'e17-resta-media', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const U = Math.round(azar.real(0.6, 2) * 10) / 10, L = -Math.round(azar.real(0.4, 2) * 10) / 10;
          const X = Math.round(azar.real(L + 0.2, U - 0.2) * 10) / 10, r = X - (U + L) / 2;
          return {
            enunciado: 'At one instant, the signal is X, the envelope of the maxima is U and that of the minima is L. What is the value of the signal at that instant after one sifting pass?',
            figura: (ctx, w, h, C) => tamiz(ctx, w, h, C, U, L, X), altoFigura: 130, textoFigura: 'The signal at one instant, between its two envelopes',
            respuesta: r, tolerancia: 0.011, decimales: 2, marcador: 'can be negative',
            explicacion: 'One pass subtracts the average of the two envelopes: (' + num(U, 1) + ' + (' + num(L, 1) + ')) / 2 = ' + num((U + L) / 2, 2) + '. Then X − ' + num((U + L) / 2, 2) + ' = ' + num(r, 2) + '.',
          };
        },
      },
      // 5 · Generated: average frequency from the zero crossings.
      {
        id: 'e17-cruces', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const N = azar.entero(20, 200), T = azar.elegir([0.5, 1, 2, 4]);
          return {
            enunciado: 'A layer crosses zero ' + N + ' times in ' + num(T) + ' s. What is its average frequency?',
            respuesta: N / (2 * T), toleranciaRel: 0.02, unidad: 'Hz', decimales: 1,
            explicacion: 'Each turn of the wheel crosses zero twice, once going up and once going down: ' + N + ' crossings are ' + num(N / 2, 1) + ' turns, and in ' + num(T) + ' s that is ' + num(N / (2 * T), 1) + ' turns per second.',
          };
        },
      },
      // 6 · Applied and generated: the speed ratio of the synthetic chest.
      {
        id: 'e17-latido-respiracion', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const r = azar.entero(12, 20), c = azar.entero(55, 100);
          return {
            enunciado: 'In a synthetic example, the chest breathes ' + r + ' times per minute and the heart beats ' + c + ' times per minute. How many times faster does it beat than it breathes?',
            respuesta: c / r, toleranciaRel: 0.02, decimales: 1, marcador: 'for example, 4.5',
            explicacion: 'Divide ' + c + ' by ' + r + ': ' + num(c / r, 1) + ' times. The speed ratio, ' + num(r / c, 2) + ', is below the octave, so the problem with the heartbeat is not speed: it is that the breathing is much bigger.',
          };
        },
      },
      // 7 · Slider: the octave boundary.
      {
        id: 'e17-frontera', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Move the slow wheel up to the limit beyond which the decomposition no longer separates it from a fast 1,000 Hz wheel of the same size.',
        min: 300, max: 950, paso: 10, inicial: 400, unidad: 'Hz', etiqueta: 'Frequency of the slow wheel',
        dibujar: dosYCociente, correcto: v => v >= 550 && v <= 680, solucion: 600,
        explicacion: 'The boundary lies between a ratio of 0.5 and 0.67 (Rilling and Flandrin, 2008). Here, at 600 Hz the error of mode 1 is already around 26% and at 670 Hz it is 62%: beyond that, the sum is a single wheel that throbs.',
      },
      // 8 · Graph: which one is already a mode.
      {
        id: 'e17-es-modo', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Which of these curves is already a mode, a clean layer?',
        opciones: [
          (ctx, w, h, C) => curva(ctx, w, h, C, t => 0.3 * Math.sin(TAU * 8 * t) + 0.3 + 1.2 * t, { y: [-0.4, 2.2] }),
          (ctx, w, h, C) => curva(ctx, w, h, C, t => Math.sin(TAU * 8 * t) * (0.65 + 0.35 * Math.sin(TAU * 1.5 * t))),
          (ctx, w, h, C) => curva(ctx, w, h, C, t => -0.6 + 0.5 * Math.sin(TAU * 1.5 * t) + 0.14 * Math.sin(TAU * 14 * t)),
        ],
        correcta: 1,
        explicacion: 'In a mode every maximum is positive, every minimum is negative and the two envelopes are symmetric; it can change its volume, like the middle one. The first carries a trend underneath, and the third has ripples riding on a slow wave that does not even cross zero.',
      },
      // 9 · Graph, common mistake: the first layer with mode mixing.
      {
        id: 'e17-mezcla', tipo: 'grafica', nivel: 'medio',
        enunciado: 'A slow wave carries two fast beeps that only sound now and then. What first layer does the classic decomposition give?',
        figura: (ctx, w, h, C) => curva(ctx, w, h, C, t => lenta(t) + pitido(t)), altoFigura: 110, textoFigura: 'The signal: a slow wave with two beeps',
        opciones: [
          (ctx, w, h, C) => curva(ctx, w, h, C, pitido, { color: C.respuesta }),
          (ctx, w, h, C) => curva(ctx, w, h, C, t => pitido(t) + (dentro(t) ? 0 : lenta(t)), { color: C.respuesta }),
          (ctx, w, h, C) => curva(ctx, w, h, C, lenta, { color: C.respuesta }),
        ],
        correcta: 1,
        explicacion: 'This is mode mixing: while the beep sounds, the first layer carries it, and when it goes quiet, that same layer picks up the next fastest thing it finds, which is the slow wave.',
      },
      // 10 · Multiple answers: problems of classic EMD.
      {
        id: 'e17-problemas', tipo: 'varias', nivel: 'medio',
        enunciado: 'What problems does classic empirical decomposition have? Select all that are true.',
        opciones: [
          'Mode mixing',
          'The edges of the signal come out bent',
          'The result depends on the stopping criterion',
          'You cannot get back to the original signal',
          'You have to tell it beforehand which frequencies you are looking for',
        ],
        correctas: [0, 1, 2],
        explicacion: 'The sum of the layers and the residue gives back the exact signal, and the method needs no prior frequencies: those are its two strong points. The first three are its known flaws, which is why EEMD and other alternatives exist (VMD, on the other hand, does need the number of modes).',
      },
      // 11 · Applied: breathing and heartbeat.
      {
        id: 'e17-radar', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Breathing moves the chest about twenty times more than the heartbeat. What happens to the classic decomposition?',
        opciones: [
          'The first layer stops being the heartbeat, because it barely sees its maxima',
          'It separates better, because breathing is much slower',
          'The heartbeat ends up in the residue',
        ],
        correcta: 0,
        explicacion: 'When the slow wheel is much bigger, almost all the maxima of the sum are its own and those of the heartbeat get lost among them. Speed is not the problem, size is, which is why variants such as EEMD or VMD, or prefilters, are used in this field.',
      },
      // 12 · Option: what EEMD does.
      {
        id: 'e17-eemd', tipo: 'opcion', nivel: 'medio',
        enunciado: 'What does EEMD do?',
        opciones: [
          'It repeats the decomposition on many copies with different white noise and averages the layers',
          'It applies a Hann window before sifting',
          'It sifts only once so as not to overdo it',
        ],
        correcta: 0,
        explicacion: 'The noise gives each scale a place to settle and cancels out when averaged, just as averaging lowered the noise of a spectrum in lesson 10.',
      },
      // 13 · Applied: separating the voice from a song.
      {
        id: 'e17-voz-cancion', tipo: 'vf', nivel: 'medio',
        enunciado: 'The apps that separate the voice from a song today do it with empirical mode decomposition.',
        correcta: false,
        explicacion: 'The decomposition does not know what a voice or a piano is: it only sees layers of oscillation. Today’s tools are trained on many songs to learn how each instrument sounds.',
      },
      // 14 · Applied: two close whistles.
      {
        id: 'e17-silbidos', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Two people whistle at once, one at 1,000 Hz and the other at 1,300 Hz. Will empirical decomposition separate them?',
        opciones: [
          'No: the ratio is 0.77, above the limit of about 0.67',
          'Yes, because they are two different people',
          'Yes, if you sift many more times',
        ],
        correcta: 0,
        explicacion: 'The method knows nothing about people: it only sees an oscillation that throbs. Sifting more does not fix the limit, which stays below about 0.7 even with a hundred passes (Rilling and Flandrin, 2008).',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
