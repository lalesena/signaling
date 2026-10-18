// Lección 3 · La receta de un sonido: sumar norias. Términos nuevos y banco de preguntas del examen.
// Lo carga e03.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una onda suma de armónicos dibujada en dos periodos: f(t) con t en vueltas del primero.
  function dibujoSuma(ctx, w, h, C, f, etiqueta) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 28 }, x: [0, 2], y: [-1.45, 1.45], marcasX: false, marcasY: false, rejilla: false, C });
    G.curva(ctx, esc, t => f(TAU * t), { color: C.senal, ancho: 2, n: 500, C });
    if (etiqueta) G.texto(ctx, w / 2, h - 7, etiqueta, { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  // El dibujo de una noria de radio 1 con otra de radio r montada en su cabina, que da k vueltas por cada vuelta de la primera.
  function dibujoEpiciclos(ctx, w, h, C, k, r) {
    const R = Math.min(w, h) * 0.5 - 8, esc = R / (1 + Math.abs(r));
    const cx = w / 2, cy = h / 2 - 4;
    ctx.save();
    ctx.strokeStyle = C.senal; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 600; i++) {
      const t = TAU * i / 600;
      const x = cx + esc * (Math.cos(t) + r * Math.cos(k * t)), y = cy - esc * (Math.sin(t) + r * Math.sin(k * t));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Zoom a un salto de la onda cuadrada con n armónicos impares: la suma parcial y el tope de la cuadrada.
  function dibujoGibbs(ctx, w, h, C, n) {
    const T = 1, x1 = 0.12;
    const esc = G.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 30 }, x: [-0.03, x1], y: [0.7, 1.3], marcasX: false, marcasY: false, rejilla: false, C });
    G.curva(ctx, esc, t => 1 + 0 * t, { color: C.cuerpo, guiones: [4, 4], alfa: 0.6, halo: false, ancho: 1.2, C });
    const f = t => {
      if (t <= 0) return -1;
      let s = 0;
      for (let m = 0; m < n; m++) { const k = 2 * m + 1; s += Math.sin(TAU * k * t) / k; }
      return 4 / Math.PI * s;
    };
    G.curva(ctx, esc, f, { color: C.senal, ancho: 1.8, desde: 0.0005, hasta: x1, n: 700, C });
    // marca en 1/40 de periodo
    ctx.save();
    ctx.strokeStyle = C.plantilla; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
    const xm = Math.round(esc.x(T / 40)) + 0.5;
    ctx.beginPath(); ctx.moveTo(xm, esc.caja.y); ctx.lineTo(xm, esc.caja.y + esc.caja.h); ctx.stroke();
    ctx.restore();
    G.texto(ctx, xm + 4, esc.caja.y + 11, '1/40 of a period', { color: C.plantilla, tam: 10, C });
    G.texto(ctx, w / 2, h - 7, n + (n === 1 ? ' odd harmonic' : ' odd harmonics'), { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  // Un espectro de barras de una receta para la misma nota (pregunta con figura).
  function dibujoReceta(ctx, w, h, C, amps) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 30 }, x: [0.4, amps.length + 0.6], y: [0, 1.1], marcasX: false, marcasY: false, rejilla: false, C });
    G.barras(ctx, esc, amps.map((_, i) => i + 1), amps, { color: C.espectro, anchoPx: Math.max(3, (w - 20) / amps.length * 0.6), C });
    G.texto(ctx, w / 2, h - 7, 'harmonics 1, 2, 3…', { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  Curso.datos('e03', {
    terminos: [
      { termino: 'Superposition', definicion: 'Adding waves by adding their heights instant by instant.', imagen: 'Stacking the heights of two cabins' },
      { termino: 'Interference', definicion: 'What happens when two waves of the same speed are added: they reinforce each other if they are in step and cancel if one rises just when the other falls.', imagen: 'Two cabins at the same height, or on opposite sides' },
      { termino: 'Epicycle', definicion: 'A Ferris wheel mounted on the cabin of another: as they turn together, the last one draws flowers, stars, and loops.', imagen: 'The chain of Ferris wheels that draws a flower' },
      { termino: 'Fundamental', definicion: 'The slowest Ferris wheel in a repeating sound; it sets how often the sound repeats and fixes the note.', imagen: 'The big Ferris wheel at the base' },
      { termino: 'Harmonic', definicion: 'A Ferris wheel that makes a whole number of turns for each turn of the fundamental.', imagen: 'The Ferris wheels of 2, 3, and 4 turns mounted on top' },
      { termino: 'Harmonic series', definicion: 'The list of frequencies of the fundamental and its harmonics: once, twice, three times the fundamental…', imagen: 'A ladder of ever faster Ferris wheels' },
      { termino: 'Timbre', definicion: 'What tells apart two sounds with the same note and the same loudness; it depends mostly on the recipe of harmonics and on how the sound starts.', imagen: 'Two different bar recipes for the same note' },
      { termino: 'Fourier series', definicion: 'The complete recipe of a repeating wave: which Ferris wheels it has, of what size, and with what starting point.', imagen: 'The stack of epicycles' },
      { termino: 'Square wave', definicion: 'The one that jumps between two values; its recipe has only odd harmonics, each one smaller.', imagen: 'The sum of odd harmonics that straightens the sides' },
      { termino: 'Gibbs phenomenon', definicion: 'The fringes left next to a jump when adding Ferris wheels: they get narrower as more are added, but their height stays around 9% of the jump.', imagen: 'The fringe stuck to the step' },
      { termino: 'Missing fundamental', definicion: 'Hearing the note of the fundamental even though that Ferris wheel is absent from the sound.', imagen: 'The stack of Ferris wheels without its big wheel' },
    ],
    preguntas: [
      { id: 'e03-superposicion', tipo: 'opcion', nivel: 'basico', enunciado: 'Adding two waves means…',
        opciones: ['adding their heights instant by instant', 'adding their frequencies', 'multiplying their heights', 'keeping the larger one'], correcta: 0,
        explicacion: 'Superposition stacks the heights of the two cabins at every instant. A 100 Hz Ferris wheel and a 300 Hz one do not give a 400 Hz one: they give a curve that contains both.' },

      { id: 'e03-armonico', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const f0 = azar.elegir([110, 196, 220, 261.63, 440]), k = azar.entero(2, 8);
          return { enunciado: 'A note has a fundamental of ' + num(f0, f0 % 1 ? 2 : 0) + ' Hz. At what frequency is its harmonic number ' + k + '?',
            respuesta: k * f0, tolerancia: 0.5, unidad: 'Hz',
            explicacion: 'A harmonic makes a whole number of turns for each turn of the fundamental: number ' + k + ' turns ' + k + ' times faster, so ' + k + ' × ' + num(f0, f0 % 1 ? 2 : 0) + ' = ' + num(k * f0, 2) + ' Hz.' };
        } },

      { id: 'e03-desfase', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const A = azar.elegir([0.5, 1, 2]), fi = azar.elegir([0, 60, 90, 120, 180]);
          return { enunciado: 'Two Ferris wheels of the same speed and of size ' + num(A, 1) + ' have their cabins ' + fi + '° apart. What size is the sum Ferris wheel?',
            respuesta: 2 * A * Math.abs(Math.cos(fi * Math.PI / 360)), tolerancia: 0.02,
            explicacion: 'With the cabins in step, the sizes add up (2 × ' + num(A, 1) + '); with half a turn of difference they cancel (0); with a quarter of a turn, the sum measures ' + num(A, 1) + ' × 1.41. With ' + fi + '°, the size is 2 × ' + num(A, 1) + ' × cos(' + fi / 2 + '°) = ' + num(2 * A * Math.abs(Math.cos(fi * Math.PI / 360)), 2) + '.' };
        } },

      { id: 'e03-cuadrada', tipo: 'opcion', nivel: 'basico', enunciado: 'Which harmonics make up a square wave?',
        opciones: ['Only the odd ones (1st, 3rd, 5th…), each one smaller: 1, 1/3, 1/5…', 'All of them, with the same size', 'Only the even ones', 'Only the odd ones, all of the same size'], correcta: 0,
        explicacion: 'The top half of the square wave is the mirror image of the bottom half, and that symmetry cancels the even harmonics. The odd ones drop as 1, 1/3, 1/5…: the faster they are, the smaller they are.' },

      { id: 'e03-suma-grafica', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Which of these drawings is the sum of a Ferris wheel of 1 turn (size 1) and another of 3 turns (size 1/3), both starting at the center and going up?',
        opciones: [
          (ctx, w, h, C) => dibujoSuma(ctx, w, h, C, u => Math.sin(u) + Math.sin(3 * u) / 3),
          (ctx, w, h, C) => dibujoSuma(ctx, w, h, C, u => Math.sin(u) - Math.sin(3 * u) / 3),
          (ctx, w, h, C) => dibujoSuma(ctx, w, h, C, u => Math.sin(u) + Math.sin(2 * u) / 2),
        ], correcta: 0,
        explicacion: 'The third harmonic, in phase, flattens the crest and pushes it toward the sides, on the way to the square wave. With the sign flipped, the crest gets sharper. And a Ferris wheel of 2 turns breaks the symmetry between the top half and the bottom half.' },

      { id: 'e03-gibbs-porcentaje', tipo: 'numero', nivel: 'basico',
        enunciado: 'When adding a great many harmonics of a square wave, what percentage of the jump does the peak next to each jump stick out?',
        respuesta: 9, tolerancia: 1, unidad: '%',
        explicacion: 'This is the Gibbs phenomenon: the overshoot approaches 8.95% of the jump and does not drop as harmonics are added, it only gets narrower.' },

      { id: 'e03-gibbs-desaparece', tipo: 'vf', nivel: 'medio',
        enunciado: 'If you add enough harmonics, the fringes next to the jumps of a square wave end up disappearing.', correcta: false,
        explicacion: 'The fringes get narrower and stick to the jump, but their height stays around 9% of the jump. What goes to zero is the energy of the error, because the fringes take up less and less room.' },

      { id: 'e03-gibbs-deslizador', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Move the number of odd harmonics until the first fringe is less than 1/40 of a period from the jump, the purple line.',
        min: 1, max: 40, paso: 1, inicial: 2, unidad: 'odd', etiqueta: 'Harmonics',
        dibujar: (ctx, w, h, valor, C) => dibujoGibbs(ctx, w, h, C, valor),
        correcto: v => v >= 11, solucion: 11,
        explicacion: 'The first fringe is at one period divided by four times the number of harmonics. That is less than 1/40 of a period when there are more than 10 odd harmonics, so 11 works. Notice that the height of the fringe hardly changes.' },

      { id: 'e03-violin-flauta', tipo: 'opcion', nivel: 'medio',
        enunciado: 'A violin and a flute play the same 440 Hz A. What changes between the two sounds?',
        opciones: ['The sizes of their harmonics (the recipe) and how each note starts', 'The fundamental frequency', 'The speed of sound', 'Nothing: only the loudness'], correcta: 0,
        explicacion: 'Same note means same fundamental. What changes is the timbre: the recipe of harmonics (a soft flute is almost a single Ferris wheel; a bowed string carries many strong harmonics) and the start of the note.' },

      { id: 'e03-telefono', tipo: 'vf', nivel: 'medio',
        enunciado: 'On the phone, a man’s voice sounds higher-pitched because the phone does not let his fundamental through.', correcta: false,
        explicacion: 'The phone lets almost nothing through below about 300 Hz, and the fundamental of a low voice is usually between 90 and 155 Hz. Even so, the ear reconstructs the note from the harmonics that do arrive. The voice sounds thinner, not higher-pitched: it is the missing fundamental.' },

      { id: 'e03-fundamental', tipo: 'opcion', nivel: 'medio',
        generar: azar => {
          const f0 = azar.elegir([100, 110, 125, 150, 200]), k = azar.elegir([2, 3]);
          const p = [k * f0, (k + 1) * f0, (k + 2) * f0];
          const lista = p.map(v => num(v)).join(', ').replace(/, ([^,]*)$/, ', and $1');
          const ops = [num(f0) + ' Hz', num(p[0]) + ' Hz', num(p[1]) + ' Hz', num((p[0] + p[1] + p[2]) / 3) + ' Hz'];
          return { enunciado: 'A sound has its three strongest peaks at ' + lista + ' Hz. What note (fundamental) do you hear?',
            opciones: ops, correcta: 0,
            explicacion: 'The peaks are ' + num(f0) + ' Hz apart, and that is the spacing between harmonics: the wave repeats ' + num(f0) + ' times per second even though the ' + num(f0) + ' Hz Ferris wheel is not there. The note is set by the rate at which the wave repeats, not by the lowest peak or the strongest.' };
        } },

      { id: 'e03-epiciclos-varias', tipo: 'varias', nivel: 'medio',
        enunciado: 'Which statements about epicycles are correct?',
        opciones: ['A Ferris wheel mounted on another draws curves that a single circle cannot draw', 'With enough Ferris wheels you can approximate any closed outline', 'Medieval astronomers kept adding epicycles until they had dozens per planet', 'A corner can be drawn exactly with a few Ferris wheels'],
        correctas: [0, 1],
        explicacion: 'The first and the second are true. The third is a myth that historians have taken apart: in the books of Ptolemaic astronomy there is no trace of several epicycles per planet. And the fourth clashes with Gibbs: corners need many fast Ferris wheels.' },

      { id: 'e03-flor', tipo: 'grafica', nivel: 'medio',
        enunciado: 'What does a Ferris wheel of radius 1 draw if it carries on top another of radius 0.5, which turns three times faster and in the opposite direction?',
        opciones: [
          (ctx, w, h, C) => dibujoEpiciclos(ctx, w, h, C, 1, 0.01),
          (ctx, w, h, C) => dibujoEpiciclos(ctx, w, h, C, -3, 0.5),
          (ctx, w, h, C) => dibujoEpiciclos(ctx, w, h, C, -2, 0.5),
        ], correcta: 1,
        explicacion: 'The number of lobes is the difference between the two speeds: with 1 and −3, it is 4. A common mistake is to think “three times, three petals”: the three-petal one is the one with speed −2, because |−2 − 1| = 3.' },

      { id: 'e03-mareas', tipo: 'opcion', nivel: 'reto',
        enunciado: 'Why are there spring tides about every 15 days?',
        opciones: ['Because the tide adds two Ferris wheels of nearly equal periods, 12 h from the Sun and 12 h 25 min from the Moon, which reinforce and offset each other in turns', 'Because the Moon goes around the Earth every 15 days', 'Because the wind changes every 15 days', 'Because the sea takes 15 days to fill up'], correcta: 0,
        explicacion: 'Two Ferris wheels of 12 h and 12.42 h line up every 1 / (1/12 − 1/12.42) ≈ 354 h, about 14.8 days. When they are in step, spring tides; out of step, neap tides.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
