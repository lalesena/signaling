// Lección 1 · Toda onda es una noria: términos nuevos y banco de preguntas del examen.
// Lo carga e01.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Una sinusoide de «dur» segundos en un lienzo pequeño, con el tiempo hacia la derecha.
  function onda(ctx, w, h, C, { f = 2, A = 1, fase = 0, dur = 1, color } = {}) {
    const esc = Graficas.ejes(ctx, {
      caja: { x: 10, y: 10, w: w - 20, h: h - 28 }, x: [0, dur], y: [-1.15, 1.15],
      marcasY: false, marcasX: [0, dur], formatoX: v => num(v) + ' s', rejilla: false, C,
    });
    Graficas.curva(ctx, esc, t => A * Math.sin(TAU * f * t + fase), { color: color || C.senal, ancho: 2, n: 600, C });
    return esc;
  }

  Curso.datos('e01', {
    terminos: [
      { termino: 'Signal', definicion: 'Something that changes and can be measured; for a machine, a list of numbers in order.', imagen: 'The trace the cabin leaves behind' },
      { termino: 'Sinusoid (sine wave)', definicion: 'The curve drawn by the height of something that spins at a constant speed.', imagen: 'The shadow of the Ferris wheel' },
      { termino: 'Amplitude', definicion: 'The largest distance from the center; in sound, you hear it as loudness.', imagen: 'The size of the Ferris wheel' },
      { termino: 'Frequency', definicion: 'Turns (cycles) per second; in sound, you hear it as the note.', imagen: 'The speed of the Ferris wheel' },
      { termino: 'Hertz (Hz)', definicion: 'Unit of frequency: one cycle per second.', imagen: 'One turn of the Ferris wheel every second' },
      { termino: 'Period', definicion: 'How long one cycle lasts; the inverse of the frequency.', imagen: 'How long one turn takes' },
      { termino: 'Phase', definicion: 'The starting point of a wave; it shifts the curve without changing its shape.', imagen: 'Two cabins set apart on the same Ferris wheel' },
      { termino: 'Simple harmonic motion', definicion: 'The motion of anything pulled back to rest by a force proportional to its displacement; it is the shadow of a uniform spin.', imagen: 'The spring next to the Ferris wheel' },
    ],

    preguntas: [
      // 1 · Error típico: confundir la nota con el volumen.
      {
        id: 'e01-noria-pequena', tipo: 'opcion', nivel: 'basico',
        enunciado: 'You turn the cabin height of a **small** Ferris wheel spinning **very fast** into sound. What does it sound like?',
        opciones: ['High-pitched and quiet', 'Low-pitched and quiet', 'High-pitched and loud', 'Low-pitched and loud'],
        correcta: 0,
        explicacion: 'The speed of the spin, the frequency, sets the note: the faster it goes, the higher the pitch. The size, the amplitude, sets the loudness, and a small wheel sounds quiet. They are two independent things, and mixing them up is the most common mistake when starting out.',
      },
      // 2 · Aplicada y generada: pasar de vueltas por minuto a hercios.
      {
        id: 'e01-ventilador', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const rpm = azar.elegir([60, 90, 120, 150, 180, 240]);
          return {
            enunciado: 'A ceiling fan makes ' + rpm + ' turns per minute. What is its spin frequency, in hertz?',
            respuesta: rpm / 60, tolerancia: 0.01, unidad: 'Hz',
            explicacion: 'One hertz is one turn per second, so you have to go from minutes to seconds: ' + rpm + ' turns in 60 seconds are ' + num(rpm / 60) + ' turns per second, that is, ' + num(rpm / 60) + ' Hz.',
          };
        },
      },
      // 3 · Generada: el periodo es la inversa de la frecuencia.
      {
        id: 'e01-periodo', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.elegir([2, 4, 5, 8, 10, 20, 25, 50]);
          return {
            enunciado: 'A wave has a frequency of ' + f + ' Hz. How long does each turn last, its period, in seconds?',
            respuesta: 1 / f, toleranciaRel: 0.03, unidad: 's', unidades: { s: 1, ms: 0.001 }, marcador: 'for example, 0.5',
            explicacion: 'The period is the inverse of the frequency: if ' + f + ' turns fit in one second, each one lasts 1/' + f + ' = ' + num(1 / f) + ' s.' + (f === 50 ? ' That is the case of the wall outlet in Spain and most of Europe: 20 thousandths of a second per turn.' : ''),
          };
        },
      },
      // 4 · Visual y generada, con trampa: la más alta no es la de más frecuencia.
      {
        id: 'e01-mas-frecuencia', tipo: 'grafica', nivel: 'basico',
        generar: azar => {
          const fs = azar.barajar([1.5, 3, 5]);
          const otras = azar.barajar([0.72, 1]);
          const amps = fs.map(f => (f === 5 ? 0.38 : otras.pop()));
          return {
            enunciado: 'Which of these three waves has the **highest frequency**? All three last one second.',
            opciones: fs.map((f, i) => (ctx, w, h, C) => onda(ctx, w, h, C, { f, A: amps[i] })),
            correcta: fs.indexOf(5),
            explicacion: 'Frequency shows in how tightly packed the waves are, not in their height: the right one makes 5 turns in the second, even though it is the shortest. The tallest is the one with the most amplitude, which in a sound would be the loudest, not the highest-pitched.',
          };
        },
      },
      // 5 · Visual con deslizador y generada.
      {
        id: 'e01-deslizador-vueltas', tipo: 'deslizador', nivel: 'medio',
        generar: azar => {
          const n = azar.entero(2, 5);
          return {
            enunciado: 'Move the slider until the wave makes exactly ' + n + ' turns in the second you can see.',
            min: 0.5, max: 6, paso: 0.5, inicial: 1, unidad: 'Hz', etiqueta: 'Frequency',
            dibujar: (ctx, w, h, valor, C) => onda(ctx, w, h, C, { f: valor }),
            correcto: v => Math.abs(v - n) < 0.01, solucion: n,
            explicacion: n + ' turns in one second are ' + n + ' Hz: frequency counts turns per second, and each turn shows up as one crest and one trough.',
          };
        },
      },
      // 6 · Error típico: el ordenador no guarda la curva.
      {
        id: 'e01-guarda-curva', tipo: 'vf', nivel: 'basico',
        enunciado: 'When you record audio, your phone stores the whole curve, with all of its points.',
        correcta: false,
        explicacion: 'It stores separate numbers, one every so often: tens of thousands per second in an audio recording, but separate. It does not look between one and the next, and whoever draws the curve reconstructs it. How many numbers you need so as not to lose anything is the question of lesson 2.',
      },
      // 7 · Aplicada: la red eléctrica.
      {
        id: 'e01-enchufe', tipo: 'vf', nivel: 'basico',
        enunciado: 'The voltage at a wall outlet in Spain goes up and down 50 times per second.',
        correcta: true,
        explicacion: 'The European grid runs at 50 Hz. A typical generator in a thermal power plant has two poles and makes 3,000 turns per minute, which is 50 per second, and each turn pushes the voltage up and down once. Much of the Americas uses 60 Hz.',
      },
      // 8 · Varias respuestas: qué se mueve como la sombra de una noria.
      {
        id: 'e01-armonico', tipo: 'varias', nivel: 'medio',
        enunciado: 'Which of these things move, at least approximately, like the shadow of a Ferris wheel? Select all that do.',
        opciones: ['A tuning fork’s prong, after it is struck', 'A mass hanging from a spring', 'A swing with a small push', 'A ball bouncing on the floor', 'A few claps'],
        correctas: [0, 1, 2],
        explicacion: 'The first three return to their place with a force proportional to how far they have moved away, and that is enough for simple harmonic motion, the shadow of a Ferris wheel. The ball falls pulled by its weight, which does not grow as it moves away, and it traces parabolic arcs; claps are short hits, not something that goes back and forth at its own pace.',
      },
      // 9 · Visual con figura: dos cabinas en la misma noria.
      {
        id: 'e01-dos-cabinas', tipo: 'opcion', nivel: 'medio', altoFigura: 160,
        figura: (ctx, w, h, C) => Graficas.escenaNoria(ctx, w, h, {
          C, angulo: 0.5, radio: 0.9, segundos: 2,
          cabinas: [{ desfase: 0, color: C.senal }, { desfase: Math.PI / 2, color: C.respuesta }],
          trazas: [
            { f: e => 0.9 * Math.sin(0.5 + Math.PI / 2 - TAU * 0.5 * e), color: C.respuesta },
            { f: e => 0.9 * Math.sin(0.5 - TAU * 0.5 * e), color: C.senal },
          ],
        }),
        textoFigura: 'A Ferris wheel with a green cabin and an orange one a quarter of a turn apart, and the wave each one draws',
        enunciado: 'The two cabins in the figure are on the same Ferris wheel. How do their waves differ?',
        opciones: ['In phase: one is a quarter of a turn ahead', 'In frequency: one spins faster', 'In amplitude: one rises higher than the other', 'In nothing: they are the same wave at the same instant'],
        correcta: 0,
        explicacion: 'They are on the same Ferris wheel, so they have the same size (amplitude) and the same speed (frequency). Only the starting point changes: the orange one is a quarter of a turn, 90°, ahead. That is the phase.',
      },
      // 10 · Aplicada, con sonido: el La de 440 Hz.
      {
        id: 'e01-la-440', tipo: 'numero', nivel: 'medio',
        audio: () => ({ f: 440, dur: 1.5, volumen: 0.4 }), textoAudio: 'Listen to the A',
        enunciado: 'This tone is the 440 Hz A that an orchestra tunes to. How long does each of its vibrations last, in milliseconds?',
        respuesta: 1000 / 440, toleranciaRel: 0.02, unidad: 'ms', unidades: { ms: 1, s: 1000 }, decimales: 2,
        explicacion: 'The period is the inverse of the frequency: 1/440 of a second is about 0.00227 s, that is, 2.27 milliseconds. Each second holds 440 vibrations, each one very short.',
      },
      // 11 · Error típico: «la fase da igual».
      {
        id: 'e01-fase-importa', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Someone says: “phase doesn’t matter, it only changes where the wave starts.” When does it stop not mattering?',
        opciones: ['When two waves are added: depending on their phase, they reinforce or cancel each other', 'Never: phase can be neither heard nor seen', 'Only when the wave is very high-pitched', 'Only when the wave is very large'],
        correcta: 0,
        explicacion: 'With a single wave, phase only shifts the curve. If you add two equal waves, with the same phase they reinforce each other, and half a turn apart they cancel at every instant. Noise-canceling headphones rely on this.',
      },
      // 12 · Visual y generada: contar hercios en una figura.
      {
        id: 'e01-cuenta-hercios', tipo: 'numero', nivel: 'basico', altoFigura: 130,
        generar: azar => {
          const f = azar.entero(3, 9), A = azar.elegir([0.55, 0.8, 1]);
          return {
            figura: (ctx, w, h, C) => onda(ctx, w, h, C, { f, A }),
            textoFigura: 'A wave that lasts one second',
            enunciado: 'The wave in the figure lasts exactly one second. What is its frequency, in hertz?',
            respuesta: f, tolerancia: 0.01, unidad: 'Hz',
            explicacion: 'You count the crests that fit in the second: there are ' + f + ', so the wave has ' + f + ' Hz. Its height does not matter here, because that is the amplitude.',
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
