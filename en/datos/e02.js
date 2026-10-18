// Lección 2 · Fotos de una noria: términos nuevos y banco de preguntas del examen.
// Lo carga e02.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una sinusoide de un segundo con sus muestras como tallos verdes: «vueltas» ciclos y «fotos» muestras.
  function ondaConFotos(ctx, w, h, C, { vueltas, fotos, fase = 0.35 }) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 30 }, x: [0, 1], y: [-1.2, 1.2], marcasX: false, marcasY: false, rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * vueltas * t + fase), { color: C.cuerpo, ancho: 1.3, alfa: 0.6, halo: false, n: 700, C });
    const ts = Array.from({ length: fotos }, (_, n) => n / fotos);
    G.tallos(ctx, esc, ts, ts.map(t => Math.sin(TAU * vueltas * t + fase)), { color: C.senal, radio: 3.6, C });
    G.texto(ctx, w / 2, h - 7, vueltas + ' turns, ' + fotos + ' photos', { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  // La noria con las últimas seis fotos de un flash de «fs» fotos por segundo: la noria da f vueltas por segundo.
  function noriaConFotos(ctx, w, h, C, f, fs) {
    const r = Math.max(24, Math.min((h - 22) / 2.3, w * 0.22)), cx = w * 0.28, cy = 10 + r;
    const cabinas = [];
    for (let i = 0; i < 6; i++) cabinas.push({ desfase: 0.9 + TAU * f * i / fs, color: G.alfa(C.senal, 0.3 + 0.7 * (i + 1) / 6), brillo: false });
    G.noria(ctx, { C, cx, cy, r, angulo: 0, cabinas, radios: 8, neutras: false });
    G.texto(ctx, w * 0.54, h / 2 - 8, 'the wheel makes ' + num(f) + ' turns/s', { color: C.suave, tam: 11, C });
    G.texto(ctx, w * 0.54, h / 2 + 10, 'the last six photos are shown', { color: C.tenue, tam: 11, C });
  }

  // Una rueda de coche con N radios iguales, quieta.
  function ruedaConRadios(ctx, w, h, C, N) {
    const R = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.9); ctx.lineWidth = R * 0.16;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.92, 0, TAU); ctx.stroke();
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.45); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, 0, TAU); ctx.stroke();
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.9); ctx.lineWidth = Math.max(2, R * 0.06);
    ctx.beginPath();
    for (let k = 0; k < N; k++) { const a = 0.3 + TAU * k / N; ctx.moveTo(cx, cy); ctx.lineTo(cx + R * 0.74 * Math.cos(a), cy + R * 0.74 * Math.sin(a)); }
    ctx.stroke();
    ctx.fillStyle = C.cuerpo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  Curso.datos('e02', {
    terminos: [
      { termino: 'Sampling', definicion: 'Taking the value of a signal at regular intervals.', imagen: 'Photographing the Ferris wheel with a flash' },
      { termino: 'Sample', definicion: 'Each one of those values: a number, the height of the signal at one instant.', imagen: 'A green stem: the height of the cabin in one photo' },
      { termino: 'Sampling rate', definicion: 'How many samples are taken per second; it is measured in hertz.', imagen: 'The strobe’s flashes per second' },
      { termino: 'Sampling period', definicion: 'The time between one sample and the next; the inverse of the sampling rate.', imagen: 'The dark gap between two flashes' },
      { termino: 'Stroboscopic effect (wagon-wheel effect)', definicion: 'What you see when something spinning is lit by flashes: it seems to go slower, stop, or go backward.', imagen: 'The Ferris wheel under the flash' },
      { termino: 'Aliasing', definicion: 'The disguise of a frequency that is too high, which shows up in the samples as a lower one; on a Ferris wheel, slower, still, or reversed.', imagen: 'The wagon wheel' },
      { termino: 'Nyquist rule', definicion: 'To avoid being fooled, the sampling rate has to be greater than twice the highest frequency in the signal.', imagen: 'More than two photos per turn of the fastest Ferris wheel' },
      { termino: 'Nyquist frequency', definicion: 'Half the sampling rate: the fastest thing the samples can count without disguising it.', imagen: 'The mirror where the whistle bounces' },
      { termino: 'Reconstruction', definicion: 'Recovering the continuous curve from the samples; if the rule was met, only one curve fits with nothing above the Nyquist frequency.', imagen: 'The smooth curve that passes through the stems' },
      { termino: 'Anti-aliasing filter', definicion: 'A filter that removes, before sampling, whatever is too fast for the samples that will be taken.', imagen: 'A strainer in front of the camera' },
      { termino: 'Quantization', definicion: 'Rounding each sample to the nearest step of a ladder of heights.', imagen: 'The staircase' },
      { termino: 'Bit', definicion: 'Each binary digit of a sample: each extra bit doubles the steps of the staircase.', imagen: 'Steps that split in two' },
      { termino: 'Quantization noise', definicion: 'The small error from rounding each sample, which sounds like a faint hiss.', imagen: 'The difference between the curve and the step' },
    ],

    preguntas: [
      // 1 · Básica: qué es la frecuencia de muestreo.
      {
        id: 'e02-frecuencia-muestreo', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What is the **sampling rate**?',
        opciones: ['How many samples, or photos, are taken per second', 'The highest frequency the signal contains', 'How many bits each sample has', 'How fast the Ferris wheel being measured turns'],
        correcta: 0,
        explicacion: 'It is the rhythm of the flash, not something about the Ferris wheel: it counts how many photos are taken per second, which is why it is measured in hertz. The highest frequency of the signal is something else, and the bits tell you how much detail each photo is stored with.',
      },
      // 2 · Generada: la regla de Nyquist.
      {
        id: 'e02-limite-nyquist', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const F = azar.elegir([1000, 3400, 4000, 8000, 10000, 20000]);
          return {
            enunciado: 'A signal has components up to **' + num(F) + ' Hz**. What value, in hertz, does the sampling rate have to exceed so that you are not fooled?',
            respuesta: 2 * F, toleranciaRel: 0.01, unidad: 'Hz',
            explicacion: 'You need more than two samples per turn of the fastest Ferris wheel: the sampling rate has to be greater than 2 × ' + num(F) + ' = ' + num(2 * F) + ' Hz. Exactly double is not enough, which is why the question says “exceed.”',
          };
        },
      },
      // 3 · Generada: la frecuencia en que suena un tono doblado.
      {
        id: 'e02-alias-tono', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 10000, 16000]);
          const lo = Math.ceil(0.55 * fs / 100), hi = Math.floor(1.45 * fs / 100);
          let f;
          do { f = 100 * azar.entero(lo, hi); } while (Math.abs(f - fs) < 100);
          const fa = Math.abs(f - fs * Math.round(f / fs));
          return {
            enunciado: 'A tone of **' + num(f) + ' Hz** is sampled at **' + num(fs) + ' samples per second**, with no filter beforehand. At what frequency does it sound when played back?',
            respuesta: fa, tolerancia: 10, unidad: 'Hz',
            explicacion: f < fs
              ? 'Whatever goes past half the sampling rate, ' + num(fs / 2) + ' Hz, is reflected as in a mirror: ' + num(fs) + ' − ' + num(f) + ' = ' + num(fa) + ' Hz.'
              : 'A tone faster than the sampling rate itself makes extra whole turns between one photo and the next, and those go unnoticed: what is left is ' + num(f) + ' − ' + num(fs) + ' = ' + num(fa) + ' Hz.',
          };
        },
      },
      // 4 · Error típico: «con el doble exacto basta».
      {
        id: 'e02-doble-exacto', tipo: 'vf', nivel: 'medio',
        enunciado: 'Exactly two samples per turn is always enough to avoid losing the Ferris wheel.',
        correcta: false,
        explicacion: 'With exactly two photos per turn, the photos can always land when the cabin passes through the middle height, and every sample would be zero: the wave would look flat. The rule asks for more than two samples per turn, not two.',
      },
      // 5 · Error típico: el audio digital no es una escalera.
      {
        id: 'e02-escalera-digital', tipo: 'vf', nivel: 'basico',
        enunciado: 'Digital audio sounds “staircase-like” because each sample is held as a step until the next one.',
        correcta: false,
        explicacion: 'The steps are only in drawings that join the samples with horizontal segments. If the Nyquist rule was met, the converter delivers the smooth curve that passes through all the samples, with no steps.',
      },
      // 6 · Aplicada: por qué 44.100.
      {
        id: 'e02-cd', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why does the CD use 44,100 samples per second?',
        opciones: [
          'It needed a bit more than double what we hear, about 20,000 Hz, with margin for the filter, and that figure fit the video recorders that digital audio was stored on',
          'Because it is exactly double what we hear',
          'Because that way Beethoven’s Ninth fit in full',
          'Because it is the fastest the laser could read',
        ],
        correcta: 0,
        explicacion: 'To store up to about 20,000 Hz you need more than double, and it is wise to leave margin for the anti-aliasing filter. The exact figure came from the adapters that stored digital audio on videotape, where 44,100 fit both European and American television. Exactly double would be 40,000 Hz, and the story of Beethoven’s Ninth is about the length of the disc, not about samples per second.',
      },
      // 7 · Visual: en qué dibujo bastan las muestras.
      {
        id: 'e02-bastan-las-muestras', tipo: 'grafica', nivel: 'medio', altoOpcion: 124,
        enunciado: 'In which of these drawings are the samples enough to recover the wave?',
        opciones: [
          (ctx, w, h, C) => ondaConFotos(ctx, w, h, C, { vueltas: 2, fotos: 16 }),
          (ctx, w, h, C) => ondaConFotos(ctx, w, h, C, { vueltas: 9, fotos: 10 }),
          (ctx, w, h, C) => ondaConFotos(ctx, w, h, C, { vueltas: 5, fotos: 10, fase: 0 }),
        ],
        correcta: 0,
        explicacion: 'The first has 8 photos per turn, well above two. The second has a little more than one photo per turn: the points would draw a slow wave that does not exist. The third has exactly two per turn, and in this case they all land on the zero crossings: the samples are zero and the wave looks flat.',
      },
      // 8 · Visual con deslizador: parar la noria con el flash.
      {
        id: 'e02-flash-quieta', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'A Ferris wheel makes 3 turns per second. Move the flash rate until it looks still.',
        min: 0.5, max: 6, paso: 0.05, inicial: 4, unidad: 'photos/s', etiqueta: 'Flash rate', alto: 150,
        dibujar: (ctx, w, h, valor, C) => noriaConFotos(ctx, w, h, C, 3, valor),
        correcto: v => { const k = 3 / v; return Math.round(k) >= 1 && Math.abs(k - Math.round(k)) < 0.02; },
        solucion: 3,
        explicacion: 'If the Ferris wheel makes one or several whole turns between two flashes, the cabin always shows up in the same place and looks still: with 3 photos per second, one turn per photo. 1.5, 1, 0.75, 0.6, or 0.5 photos per second also work, which are two, three, four, five, or six turns per photo.',
      },
      // 9 · Aplicada, visual y generada: la rueda de un coche a 24 fotos por segundo.
      {
        id: 'e02-rueda-coche', tipo: 'opcion', nivel: 'medio', altoFigura: 130,
        generar: azar => {
          const N = azar.elegir([4, 5, 6, 8]), k = azar.elegir([1, 2]), d = azar.elegir([-0.1, 0, 0.1]);
          const f = +(24 / N * (k + d)).toFixed(3), nf = N * f, a = nf - 24 * Math.round(nf / 24);
          const clave = Math.abs(a) < 0.01 ? 0 : a < 0 ? 1 : 2;
          const razon = clave === 0
            ? 'It is exactly ' + (k === 1 ? 'the rate' : 'double the rate') + ' of 24 photos per second: between one photo and the next, the wheel turns exactly the distance between ' + (k === 1 ? 'two spokes' : 'two spokes, twice over') + ', every photo is the same, and the wheel looks still.'
            : clave === 1
              ? 'That falls a little below ' + 24 * k + ': in each photo the wheel has turned almost the distance between two spokes, but not quite, and it seems to go backward slowly.'
              : 'That falls a little above ' + 24 * k + ': in each photo the wheel has turned a bit more than the distance between two spokes, and it seems to move forward slowly.';
          return {
            figura: (ctx, w, h, C) => ruedaConRadios(ctx, w, h, C, N),
            textoFigura: 'A wheel with ' + N + ' identical spokes',
            enunciado: 'A car is filmed at **24 photos per second**. Its wheels have **' + N + ' identical spokes** and turn at **' + num(f, 2) + ' turns per second**. What do you see in the video?',
            opciones: ['It looks still', 'It seems to turn slowly backward', 'It seems to turn slowly forward', 'It is seen turning as it really is, at ' + num(f, 2) + ' turns per second'],
            correcta: clave,
            explicacion: 'With ' + N + ' identical spokes, the wheel looks the same every 1/' + N + ' of a turn, so the camera samples ' + N + ' × ' + num(f, 2) + ' = ' + num(nf, 1) + ' times per second. ' + razon,
          };
        },
      },
      // 10 · Generada: los peldaños de la escalera.
      {
        id: 'e02-peldanos', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const N = azar.elegir([3, 4, 8, 12, 16]);
          return {
            enunciado: 'How many different steps, that is, how many different heights, can a sample of **' + N + ' bits** store?',
            respuesta: Math.pow(2, N), tolerancia: 0,
            explicacion: 'Each bit doubles the steps: with 1 bit there are 2, with 2 bits 4, with 3 bits 8, and so on up to ' + num(Math.pow(2, N)) + ' with ' + N + ' bits.' + (N === 16 ? ' That is the staircase of a CD.' : ''),
          };
        },
      },
      // 11 · Aplicada y generada: el caudal del audio sin comprimir.
      {
        id: 'e02-caudal', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 44100, 48000]), N = azar.elegir([8, 16, 24]), C = azar.elegir([1, 2]);
          return {
            enunciado: 'Uncompressed audio is stored at **' + num(fs) + ' samples per second**, with **' + N + ' bits** per sample and **' + (C === 1 ? 'one channel' : 'two channels') + '**. How many bits does each second of audio take up?',
            respuesta: fs * N * C, toleranciaRel: 0.001, unidad: 'bit/s',
            explicacion: 'Each second there are ' + num(fs) + ' samples per channel, and each one takes up ' + N + ' bits: ' + num(fs) + ' × ' + N + (C === 2 ? ' × 2' : '') + ' = ' + num(fs * N * C) + ' bit/s. The CD, with 44,100 samples, 16 bits, and two channels, gives 1,411,200.',
          };
        },
      },
      // 12 · Aplicada: qué es aliasing y qué no.
      {
        id: 'e02-cuales-aliasing', tipo: 'varias', nivel: 'medio',
        enunciado: 'Which of these situations are aliasing? Select all that are.',
        opciones: [
          'The wheel that turns backward in a video',
          'A whistle that rises and “bounces” downward when recorded with few samples per second',
          'A saw blade that looks still under a flickering light',
          'The hiss of an old tape',
          'The muffled voice on the phone',
        ],
        correctas: [0, 1, 2],
        explicacion: 'The first three are something fast disguised as something slow when looked at in intervals. Tape hiss is noise, and the phone sounds muffled because a filter removes the high frequencies, not because it disguises frequencies.',
      },
      // 13 · Error típico: el filtro va antes.
      {
        id: 'e02-filtro-antes', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why does the anti-aliasing filter come before sampling and not after?',
        opciones: [
          'Because, after sampling, the folded part occupies the same frequencies as the good part and can no longer be separated',
          'Because afterward it would use more battery',
          'It does not matter where it goes: the result is the same',
          'Because after sampling there are no frequencies anymore',
        ],
        correcta: 0,
        explicacion: 'Once the photos are taken, the fast Ferris wheel and the slow one it passes for leave exactly the same samples, and the numbers do not remember which was which. The fast part has to be removed while it can still be told apart.',
      },
      // 14 · Generada: lo que gana cada bit.
      {
        id: 'e02-snr-bits', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const N = azar.elegir([8, 12, 16, 24]);
          return {
            enunciado: 'A tone that fills the whole range is stored with **' + N + ' bits**. About how many decibels are there between the tone and the rounding noise?',
            respuesta: 6.02 * N + 1.76, tolerancia: 1.5, unidad: 'dB',
            explicacion: 'Each bit splits the steps in two and lowers the noise by about 6 dB, and about 1.8 dB is added on top: with ' + N + ' bits, 6.02 × ' + N + ' + 1.76 ≈ ' + num(6.02 * N + 1.76, 0) + ' dB.' + (N === 16 ? ' That is the margin of a CD.' : ''),
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
