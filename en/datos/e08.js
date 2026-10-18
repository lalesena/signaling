// Lección 8 · El filtro que se vuelve loco: términos nuevos y banco de preguntas del examen.
// Lo carga e08.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Respuesta a una palmada de tres filtros distintos, en tallos (muestras): termina, se apaga o crece.
  function palmada(ctx, w, h, C, tipo) {
    const n = 24, ks = [], vs = [];
    for (let k = 0; k < n; k++) {
      let v;
      if (tipo === 'fir') v = k < 9 ? 0.55 : 0;
      else if (tipo === 'estable') v = Math.pow(0.88, k) * Math.cos(0.7 * k);
      else v = 0.06 * Math.pow(1.17, k) * Math.cos(0.7 * k);
      ks.push(k); vs.push(v);
    }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 24 }, x: [-1, n], y: [-1.1, 1.1], marcasY: false, marcasX: [0, 12, 24], formatoX: v => String(v), rejilla: false, C });
    Graficas.tallos(ctx, esc, ks, vs, { color: C.respuesta, radio: 2.6, C });
  }

  // El plano de los polos: el círculo de radio 1 y dos polos (un par conjugado) a una distancia r del centro.
  function plano(ctx, w, h, C, r) {
    const cx = w / 2, cy = h / 2, R = Math.min(h / 2 - 6, 50), ang = 0.7;
    ctx.save();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - R * 1.35, cy); ctx.lineTo(cx + R * 1.35, cy); ctx.moveTo(cx, cy - R * 1.2); ctx.lineTo(cx, cy + R * 1.2); ctx.stroke();
    ctx.strokeStyle = C.cuerpo; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = C.respuesta; ctx.lineWidth = 2.2;
    for (const s of [1, -1]) {
      const x = cx + R * r * Math.cos(ang), y = cy - s * R * r * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(x - 4.5, y - 4.5); ctx.lineTo(x + 4.5, y + 4.5); ctx.moveTo(x + 4.5, y - 4.5); ctx.lineTo(x - 4.5, y + 4.5); ctx.stroke();
    }
    ctx.restore();
  }

  // Los ecos de un eco que se alimenta: el primero vale 1 y cada uno, g veces el anterior.
  function ecos(ctx, w, h, C, g) {
    const ks = [], vs = [];
    for (let k = 0; k <= 8; k++) { ks.push(k); vs.push(Math.min(1.4, Math.pow(g, k))); }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [-0.5, 8.5], y: [0, 1.5], marcasY: false, marcasX: [0, 4, 8], formatoX: v => String(v), etiquetaX: 'round trips', rejilla: false, C });
    Graficas.tallos(ctx, esc, ks, vs, { color: C.respuesta, radio: 3.2, C });
    const ref = Math.round(esc.y(1)) + 0.5;
    ctx.save(); ctx.strokeStyle = Graficas.alfa(C.eje, 0.8); ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(esc.caja.x, ref); ctx.lineTo(esc.caja.x + esc.caja.w, ref); ctx.stroke(); ctx.restore();
  }

  Curso.datos('e08', {
    terminos: [
      { termino: 'Feedback', definicion: 'A system using what it has just produced itself.', imagen: 'The arrow that goes back from the output to the input' },
      { termino: 'Acoustic feedback (howl)', definicion: 'The whistle that appears when what comes out of the loudspeaker goes back into the microphone just as strong or stronger, and on time; in many countries it is also called the Larsen effect.', imagen: 'The echo that feeds on itself' },
      { termino: 'Loop gain', definicion: 'The part of the sound that comes back after going once around the whole circle.', imagen: 'The pulse that gets fatter or thinner on each round trip' },
      { termino: 'FIR filter', definicion: 'One that only uses recent inputs; its response to a clap ends.', imagen: 'A stamp of finite length' },
      { termino: 'IIR filter', definicion: 'One that also uses its own previous outputs; its response to a clap never ends.', imagen: 'The echo that feeds on itself' },
      { termino: 'Stability', definicion: 'That the response to something brief ends up dying out instead of growing; in a filter, that all its poles are inside the circle.', imagen: 'Echoes that get smaller and smaller' },
      { termino: 'Pole', definicion: 'A point of the plane where the filter resonates; the closer to the edge of the circle, the narrower and taller the peak.', imagen: 'A tent pole that lifts the canvas' },
      { termino: 'Zero', definicion: 'A point of the plane where the filter cancels a frequency.', imagen: 'A thumbtack that pins down the canvas' },
      { termino: 'Group delay', definicion: 'How long the envelope of a group of nearby frequencies takes to come out of the filter.', imagen: 'The filtered clap that arrives late' },
      { termino: 'Linear phase', definicion: 'When all frequencies come out with the same delay and the shape of the wave is not distorted.', imagen: 'The symmetric FIR, with its two equal edges' },
      { termino: 'Causal filter', definicion: 'One that only uses the present and the past; the only one possible live.', imagen: 'A window that only looks backward' },
      { termino: 'Zero-phase filtering', definicion: 'Filtering forward and backward so that the delays cancel out; it can only be done with the whole recording.', imagen: 'The clap that goes back to its place' },
      { termino: 'Maximum stable gain', definicion: 'The highest possible volume before the loop starts to howl.', imagen: 'The line at 1 that you must not touch' },
    ],

    preguntas: [
      // 1 · Básica: la condición del acople.
      {
        id: 'e08-acople', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What two things are needed for a microphone to howl?',
        opciones: [
          'That at some frequency the sound comes back just as strong or stronger, and that it arrives on time, with the wave in the right place',
          'That the volume goes over 100 dB and that the microphone is cheap',
          'That the voice has high pitches and that the room is small',
          'That the microphone points at the audience and the loudspeaker, at the stage',
        ],
        correcta: 0, fijas: true,
        explicacion: 'The loop becomes unstable when its gain reaches 1 at a frequency at which, in addition, the phase completes a whole turn. Volume is only part of that gain: the distance, where the equipment points and the room also count.',
      },
      // 2 · Error típico: un FIR no se dispara.
      {
        id: 'e08-fir-loco', tipo: 'vf', nivel: 'medio',
        enunciado: 'An FIR filter can become unstable and grow without restraint.',
        correcta: false,
        explicacion: 'Without feedback, its response to a clap ends when the weights run out, so nothing can grow without restraint. It can amplify one frequency a lot, but it cannot blow up. What goes haywire is what listens to its own output.',
      },
      // 3 · Aplicada: el truco de ida y vuelta necesita el futuro.
      {
        id: 'e08-directo', tipo: 'vf', nivel: 'medio',
        enunciado: 'Forward-and-backward filtering can be used in noise-cancelling headphones.',
        correcta: false,
        explicacion: 'The backward pass needs the end of the signal, that is, the future, and live it does not exist yet. Headphones have to live with the delay of the causal filter.',
      },
      // 4 · Generada: la semivida de la media que olvida.
      {
        id: 'e08-semivida', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const x = azar.elegir([0.9, 0.95, 0.98, 0.99, 0.995]), fs = azar.elegir([8000, 16000]);
          const ms = 1000 * Math.log(0.5) / (Math.log(x) * fs);
          return {
            enunciado: 'A forgetful filter keeps in each sample a fraction ' + num(x, 3) + ' of its previous output. With ' + num(fs) + ' samples per second, how many milliseconds does its response to a clap take to fall to half?',
            respuesta: ms, toleranciaRel: 0.05, unidad: 'ms', decimales: 2, marcador: 'for example, 4.3',
            explicacion: 'Each sample keeps ' + num(x, 3) + ' of the previous one, so after n samples what is left is ' + num(x, 3) + ' to the power n, which is half when n = ln 0.5 / ln ' + num(x, 3) + ' = ' + num(Math.log(0.5) / Math.log(x), 1) + ' samples. At ' + num(fs) + ' samples per second that is ' + num(ms, 2) + ' ms.',
          };
        },
      },
      // 5 · Generada y error típico: cuánto llega tarde un FIR simétrico.
      {
        id: 'e08-retraso-fir', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const n = azar.elegir([101, 201, 401, 641, 801, 1601]), fs = azar.elegir([16000, 48000]);
          const ms = (n - 1) / 2 / fs * 1000;
          return {
            enunciado: 'A symmetric FIR filter of ' + num(n) + ' coefficients works at ' + num(fs) + ' samples per second. How many milliseconds late does it arrive?',
            respuesta: ms, toleranciaRel: 0.02, unidad: 'ms', decimales: 2, marcador: 'for example, 5',
            explicacion: 'A symmetric FIR delays all frequencies by the same amount: half its length, (' + num(n) + ' − 1) / 2 = ' + num((n - 1) / 2) + ' samples, which at ' + num(fs) + ' samples per second is ' + num(ms, 2) + ' ms. The typical mistake is giving the whole length.',
          };
        },
      },
      // 6 · Generada: los picos del eco que se alimenta.
      {
        id: 'e08-peine', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const d = azar.elegir([80, 160, 320, 400, 800]);
          return {
            enunciado: 'A self-feeding echo returns every ' + num(d) + ' samples, with 16,000 samples per second. How many hertz apart are the peaks of its frequency response?',
            respuesta: 16000 / d, toleranciaRel: 0.01, unidad: 'Hz', decimales: 1, marcador: 'for example, 100',
            explicacion: 'The echo reinforces the frequencies at which a whole number of waves fits in its delay, and that happens every fs / D = 16,000 / ' + num(d) + ' = ' + num(16000 / d) + ' Hz. It is the same thing that happens in the loop of a microphone with the frequencies that arrive in phase.',
          };
        },
      },
      // 7 · Generada y aplicada: las frecuencias que llegan en fase con el micro a d metros.
      {
        id: 'e08-distancia', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const d = azar.elegir([0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4]);
          return {
            enunciado: 'The microphone is ' + num(d, 2) + ' meters from the loudspeaker and only the direct path of the sound counts, at 343 meters per second. How many hertz apart are the frequencies that arrive in phase?',
            respuesta: 343 / d, toleranciaRel: 0.03, unidad: 'Hz', decimales: 0, marcador: 'for example, 100',
            explicacion: 'The sound takes ' + num(d / 343 * 1000, 2) + ' ms to travel the path. The phase returns to its place each time one more wave fits in that time, and that happens every 343 / ' + num(d, 2) + ' = ' + num(343 / d, 0) + ' Hz: the spacing is the inverse of the delay.',
          };
        },
      },
      // 8 · Gráfica: cómo se ve un filtro que se vuelve loco.
      {
        id: 'e08-grafica-loco', tipo: 'grafica', nivel: 'basico',
        enunciado: 'What is the response to a clap of a filter that **has gone haywire**?',
        opciones: [(ctx, w, h, C) => palmada(ctx, w, h, C, 'fir'), (ctx, w, h, C) => palmada(ctx, w, h, C, 'estable'), (ctx, w, h, C) => palmada(ctx, w, h, C, 'loco')],
        correcta: 2,
        explicacion: 'Unstable means that the response to something brief grows instead of dying out. The first one ends because it is an FIR, and the second one dies out because it is a stable IIR.',
      },
      // 9 · Gráfica: el plano de los polos.
      {
        id: 'e08-grafica-polos', tipo: 'grafica', nivel: 'medio',
        enunciado: 'The poles of a filter appear as crosses on the plane. Which of these filters is **stable**?',
        opciones: [(ctx, w, h, C) => plano(ctx, w, h, C, 0.9), (ctx, w, h, C) => plano(ctx, w, h, C, 1), (ctx, w, h, C) => plano(ctx, w, h, C, 1.1)],
        correcta: 0, altoOpcion: 130,
        explicacion: 'A filter is stable if all its poles are inside the circle. With the poles inside, each round trip returns less and everything dies out; on the edge, the tone never dies out, and outside, it grows without restraint.',
      },
      // 10 · Deslizador: cada vuelta devuelve la mitad.
      {
        id: 'e08-realimentacion', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Adjust what the echo returns on each round trip so that **each echo is worth half the previous one**. The dotted line is the size of the first one.',
        min: 0, max: 1.2, paso: 0.01, inicial: 0.9, unidad: '', etiqueta: 'What each round trip returns',
        dibujar: (ctx, w, h, valor, C) => ecos(ctx, w, h, C, valor),
        correcto: v => Math.abs(v - 0.5) <= 0.02, solucion: 0.5,
        explicacion: 'With 0.5, each echo is half as tall as the previous one, which is about 6 dB less per round trip. With 1, they are all worth the same, and above 1 they grow.',
      },
      // 11 · Aplicada: cómo no pita el micrófono.
      {
        id: 'e08-domar', tipo: 'varias', nivel: 'medio',
        enunciado: 'What helps keep the microphone **from howling**? Mark everything that helps.',
        opciones: [
          'Moving the microphone away from the loudspeaker',
          'Cutting, with the equalizer, the frequency that howls',
          'Using a directional microphone that does not point at the loudspeaker',
          'Bringing the microphone closer to the loudspeaker so it “hears it sooner”',
          'Boosting the highs with the equalizer',
        ],
        correctas: [0, 1, 2],
        explicacion: 'Anything that lowers the loop gain at the dangerous frequency pushes the howl away. Bringing the microphone closer raises it, and boosting the highs can create a new peak where there was none before.',
      },
      // 12 · Aplicada: filtrar un electrocardiograma ya grabado.
      {
        id: 'e08-ecg', tipo: 'opcion', nivel: 'reto',
        enunciado: 'In an electrocardiogram that is **already recorded**, you want to see the exact instant of each heartbeat, and first you have to remove the noise. What do you do?',
        opciones: [
          'Filter forward and backward',
          'Pass it through a live IIR, because it is cheaper',
          'Never filter, because every filter delays',
          'A very high-order IIR written as a single block',
        ],
        correcta: 0,
        explicacion: 'The forward-and-backward pass leaves the beats in place, because with the whole recording you can flip the signal. A live IIR would delay and distort them, differently depending on the frequency. A symmetric FIR would also work if you subtract its delay.',
      },
      // 13 · Error típico: la magnitud no lo es todo.
      {
        id: 'e08-fase', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Which of these statements is **correct**?',
        opciones: [
          'If two filters attenuate each frequency equally, they leave the signal the same',
          'Two filters with the same attenuation can distort a clap differently, because they do not delay it equally at each frequency',
          'Delay only matters in expensive filters',
        ],
        correcta: 1,
        explicacion: 'The frequency response has magnitude and phase. A symmetric FIR and an IIR with the same magnitude delay each frequency differently, and that is why the second one distorts the edges of a bang.',
      },
      // 14 · Los filtros finos llegan tarde.
      {
        id: 'e08-finos', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why does a filter that separates very close frequencies arrive **later**?',
        opciones: [
          'Because to tell close frequencies apart it has to look at more time of signal, like the tuner',
          'Because the computer takes longer to do the calculations',
          'Because it amplifies more',
          'Because high pitches travel more slowly',
        ],
        correcta: 0, fijas: true,
        explicacion: 'Frequency resolution is paid for with duration. In a window-based FIR, the length grows as the inverse of the width of the transition and the delay is half the length: about 2 ms if the transition is 1,000 Hz wide and 200 ms if it is 10 Hz.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
