// Lesson 15 · What frequency does a siren have?: new terms and quiz question bank.
// Loaded by en/e15.html (and, later, glosario.html and examenes.html) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Dos vueltas de una onda, con los dos cruces por cero hacia arriba que las encierran y el tiempo entre ellos.
  function dosCruces(ctx, w, h, C, dt) {
    const esc = G.ejes(ctx, { caja: { x: 14, y: 14, w: w - 28, h: h - 38 }, x: [0, 2.6], y: [-1.3, 1.3], marcasX: false, marcasY: false, rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * t), { color: C.senal, desde: 0, hasta: 2.6, n: 220, C });
    G.puntos(ctx, esc, [0, 1], [0, 0], { color: C.respuesta, radio: 5.5, C });
    G.flecha(ctx, esc.x(0.04), esc.y(-0.95), esc.x(0.96), esc.y(-0.95), { color: C.respuesta, C });
    G.texto(ctx, esc.x(0.5), esc.y(-1.1), 'Δt = ' + num(dt, 2) + ' ms', { alinear: 'center', base: 'top', color: C.respuesta, tam: 11, peso: 600, C });
  }
  // Un plano tiempo-frecuencia con una línea, para las preguntas de «cuál es el espectrograma».
  function plano(ctx, w, h, C, f, ancho, vertical) {
    const caja = { x: 10, y: 8, w: w - 20, h: h - 24 };
    const esc = G.ejes(ctx, { caja, x: [0, 1], y: [0, 1], marcasX: false, marcasY: false, rejilla: false, etiquetaX: 'time', C });
    ctx.save();
    ctx.fillStyle = G.mezclar(C.cuerpo, C.pantalla, C.oscuro ? 0.9 : 0.15);
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.strokeStyle = C.espectro; ctx.lineWidth = ancho || 3; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (vertical) { ctx.moveTo(esc.x(0.55), esc.y(0.02)); ctx.lineTo(esc.x(0.55), esc.y(0.98)); }
    else for (let i = 0; i <= 120; i++) { const t = i / 120, p = f(t), px = esc.x(t), py = esc.y(p); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.restore();
  }
  // Una curva de la frecuencia que oye alguien al pasar una ambulancia, entre −1 y 1 (el paso es en 0).
  function curvaPaso(ctx, w, h, C, f) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 30 }, x: [-1, 1], y: [0, 1], marcasX: false, marcasY: false, rejilla: false, etiquetaX: 'time (the pass, in the center)', C });
    G.curva(ctx, esc, f, { color: C.respuesta, ancho: 2.6, desde: -1, hasta: 1, n: 200, C });
    G.linea(ctx, esc, [0, 0], [0, 1], { color: C.cuerpo, guiones: [4, 4], alfa: 0.5, ancho: 1, halo: false, C });
  }
  const fSilbato = L => 343 / (4 * (L / 100 + 0.0036));
  function tubo(ctx, w, h, valor, C) {
    const x0 = 24, x1 = w - 24, ym = h / 2 - 8, alto = 26, escala = (x1 - x0) / 25, xp = x0 + valor * escala;
    ctx.save();
    ctx.strokeStyle = C.cuerpo; ctx.lineWidth = 2; ctx.strokeRect(x0, ym - alto / 2, x1 - x0, alto);
    ctx.fillStyle = G.alfa(C.senal, 0.28); ctx.fillRect(x0 + 1, ym - alto / 2 + 1, xp - x0 - 1, alto - 2);
    ctx.fillStyle = C.plantilla; ctx.fillRect(xp, ym - alto / 2 - 4, 7, alto + 8);
    ctx.restore();
    G.texto(ctx, w / 2, h - 12, 'air: ' + num(valor, 1) + ' cm · note: ' + num(fSilbato(valor), 0) + ' Hz', { alinear: 'center', color: C.suave, tam: 12, peso: 600, C });
  }

  Curso.datos('e15', {
    terminos: [
      { termino: 'Instantaneous frequency', definicion: 'How fast the wheel is turning at this moment: how many turns it would make in one second if it kept up that pace.', imagen: 'The wheel’s speedometer' },
      { termino: 'Phase (accumulated)', definicion: 'The total angle the cabin has traveled, counting the full turns.', imagen: 'The wheel’s turn counter' },
      { termino: 'Zero crossing', definicion: 'The instant when the wave passes through the center line; two upward crossings in a row enclose one turn.', imagen: 'The cabin passing through the height of the axis' },
      { termino: 'Chirp', definicion: 'A signal whose frequency rises or falls over time.', imagen: 'The wheel that speeds up; a slanted line on the spectrogram' },
      { termino: 'Linear chirp', definicion: 'A chirp that rises the same number of hertz each second.', imagen: 'A straight line on the spectrogram with a linear axis' },
      { termino: 'Exponential chirp', definicion: 'A chirp that rises the same number of octaves each second; to the ear it sounds uniform.', imagen: 'An upward curve on the spectrogram with a linear axis' },
      { termino: 'Amplitude modulation (AM)', definicion: 'Carrying a message by changing the size of a wave.', imagen: 'The wheel that grows and shrinks' },
      { termino: 'Frequency modulation (FM)', definicion: 'Carrying a message by changing the speed of a wave.', imagen: 'The wheel that speeds up and slows down' },
      { termino: 'Carrier', definicion: 'The background wave, of fixed speed, on which the message travels.', imagen: 'The wheel before modulating it' },
      { termino: 'Frequency deviation', definicion: 'How far the frequency strays from the carrier, up or down, in an FM signal.', imagen: 'How much the wheel speeds up and slows down' },
      { termino: 'Doppler effect', definicion: 'The change of frequency you hear when the source or you are moving.', imagen: 'The crests bunched up in front of the ambulance' },
    ],

    preguntas: [
      // 1 · Básica: qué es la frecuencia instantánea.
      {
        id: 'e15-definicion', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What is the instantaneous frequency?',
        opciones: ['How fast the wheel is turning at this moment, the rate at which its angle advances', 'The height of the wave at this instant', 'The highest peak of the spectrum of the whole signal', 'The average frequency of the whole signal'],
        correcta: 0,
        explicacion: 'It is the speed of the spin right now. The height of the wave is its amplitude at that instant, and the spectrum peak and the average frequency look at the whole signal, not at one particular moment.',
      },
      // 2 · Generada y visual: cruces por cero.
      {
        id: 'e15-cruces', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const dt = Math.round(azar.real(0.5, 5) * 100) / 100;
          return {
            figura: (ctx, w, h, C) => dosCruces(ctx, w, h, C, dt), altoFigura: 120, textoFigura: 'A wave with two upward zero crossings ' + num(dt, 2) + ' milliseconds apart',
            enunciado: 'Between two upward zero crossings in a row of a whistle, ' + num(dt, 2) + ' milliseconds go by. What frequency does it have at that moment?',
            respuesta: 1000 / dt, toleranciaRel: 0.01, unidad: 'Hz', marcador: 'for example, 400',
            explicacion: 'Between two upward crossings in a row there is one full turn, and the frequency is the inverse of how long it lasts: 1,000 / ' + num(dt, 2) + ' = ' + num(1000 / dt, 0) + ' Hz.',
          };
        },
      },
      // 3 · Generada y de reto: vueltas de un chirp lineal.
      {
        id: 'e15-vueltas', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const f0 = azar.entero(10, 50) * 10, k = azar.entero(1, 10) * 100, T = azar.elegir([0.5, 1, 1.5, 2]);
          return {
            enunciado: 'A linear chirp starts at ' + num(f0) + ' Hz and rises ' + num(k) + ' hertz every second. How many full turns does it make in the first ' + num(T, 1) + ' seconds?',
            respuesta: f0 * T + k * T * T / 2, toleranciaRel: 0.02, marcador: 'for example, 350',
            explicacion: 'The turns are what has accumulated: the average frequency, ' + num(f0 + k * T / 2) + ' Hz, times the time, ' + num(T, 1) + ' s, gives ' + num(f0 * T + k * T * T / 2) + ' turns. Multiplying the final frequency by the time would overcount.',
          };
        },
      },
      // 4 · Generada y aplicada: Doppler al acercarse.
      {
        id: 'e15-doppler-acerca', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.entero(40, 120) * 10, v = azar.entero(10, 40);
          return {
            enunciado: 'An ambulance with a ' + num(f) + ' Hz siren is coming toward you at ' + v + ' meters per second. What frequency do you hear, with sound at 343 m/s?',
            respuesta: f * 343 / (343 - v), toleranciaRel: 0.01, unidad: 'Hz', marcador: 'for example, 650',
            explicacion: 'The crests leave a source that is advancing toward you and reach you closer together: ' + num(f) + ' × 343 / (343 − ' + v + ') = ' + num(f * 343 / (343 - v), 0) + ' Hz. Moving away it would be ' + num(f * 343 / (343 + v), 0) + ' Hz.',
          };
        },
      },
      // 5 · Error típico: la sirena que se acerca.
      {
        id: 'e15-acerca-sube', tipo: 'vf', nivel: 'medio',
        enunciado: 'While an ambulance approaches at constant speed along the road you are standing on, its siren sounds higher and higher.',
        correcta: false,
        explicacion: 'It sounds higher than the real siren, but at a steady frequency; when it passes you, it drops suddenly. The “higher and higher” is a confusion with the volume, which does grow as it approaches.',
      },
      // 6 · FM: qué lleva el mensaje.
      {
        id: 'e15-fm', tipo: 'opcion', nivel: 'basico',
        enunciado: 'In an FM radio station, what carries the message?',
        opciones: ['The turning speed of the wheel, its frequency', 'Its size, its amplitude', 'The point where it starts turning', 'The speaker volume'],
        correcta: 0,
        explicacion: 'In FM the wheel speeds up and slows down with the message and its size doesn’t change. If the size changed, it would be AM.',
      },
      // 7 · Visual: el espectrograma de una sirena.
      {
        id: 'e15-grafica-sirena', tipo: 'grafica', nivel: 'basico', altoOpcion: 104,
        enunciado: 'Which one is the spectrogram of a siren that rises and falls? Time goes to the right and frequency goes up.',
        opciones: [
          (ctx, w, h, C) => plano(ctx, w, h, C, t => 0.5 + 0.28 * Math.sin(TAU * 2 * t)),
          (ctx, w, h, C) => plano(ctx, w, h, C, () => 0.5),
          (ctx, w, h, C) => plano(ctx, w, h, C, null, 5, true),
        ],
        correcta: 0,
        explicacion: 'A siren is a wheel that speeds up and slows down, so its frequency rises and falls over time and leaves a line that undulates. The horizontal line would be a steady note, and a hit, which spreads its energy over all frequencies at once, would be a vertical band.',
      },
      // 8 · Visual: la frecuencia que oyes al pasar una ambulancia.
      {
        id: 'e15-grafica-paso', tipo: 'grafica', nivel: 'medio', altoOpcion: 112,
        enunciado: 'An ambulance with a single-tone siren goes past you. Which one is the frequency you hear over time?',
        opciones: [
          (ctx, w, h, C) => curvaPaso(ctx, w, h, C, t => 0.52 - 0.2 * Math.tanh(4 * t)),
          (ctx, w, h, C) => curvaPaso(ctx, w, h, C, t => 0.3 + 0.2 * (t + 1)),
          (ctx, w, h, C) => curvaPaso(ctx, w, h, C, t => 0.3 + 0.6 * Math.exp(-Math.pow(t * 7, 2))),
        ],
        correcta: 0,
        explicacion: 'As it approaches you hear a note higher than the real one and almost steady; as it passes, it drops to another, lower and almost steady. The narrow peak is a common mistake: what rises and falls as it passes is the volume, not the frequency.',
      },
      // 9 · Visual con deslizador: el silbato de émbolo.
      {
        id: 'e15-silbato', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Move the slide whistle’s piston until it sounds at 440 Hz, the tuning fork’s note.',
        min: 3, max: 25, paso: 0.05, inicial: 12, unidad: 'cm', decimales: 1, etiqueta: 'Length of the air column', alto: 110,
        dibujar: (ctx, w, h, valor, C) => tubo(ctx, w, h, valor, C),
        correcto: v => Math.abs(fSilbato(v) - 440) <= 6, solucion: 19.1,
        explicacion: 'The note goes with the inverse of the length of the air column, f = 343 / (4 · (L + 0.0036 m)): to go down from about 700 Hz to 440 Hz you have to lengthen the tube, to about 19 cm.',
      },
      // 10 · Aplicada: el murciélago de herradura.
      {
        id: 'e15-herradura', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why does the greater horseshoe bat lower its note when it flies faster?',
        opciones: ['So that the echo, higher because of the Doppler effect, comes back at the frequency it hears best', 'To spend less energy', 'So that moths can’t hear it', 'Because it gets tired from flying'],
        correcta: 0,
        explicacion: 'The echo reaches it raised in pitch by its own motion, and it lowers its scream just enough to compensate (Schuller and Suga, 1976).',
      },
      // 11 · Varias: la onda gravitacional.
      {
        id: 'e15-ligo', tipo: 'varias', nivel: 'medio',
        enunciado: 'What is true about the gravitational wave GW150914? Check everything that applies.',
        opciones: ['Its frequency rose from about 35 to about 250 Hz', 'Within the detectors’ band it lasted about two tenths of a second', 'It was picked up by the detectors’ microphones', 'To listen to it, it is usually raised in pitch', 'Its frequency rose at a constant rate'],
        correctas: [0, 1, 3],
        explicacion: 'The discovery paper says so. The detectors measure distortions of space with lasers, not sound, and the frequency rose faster and faster, not at a constant rate. As it is, it is low and brief, and that is why GWOSC raises it 400 Hz so you can hear it.',
      },
      // 12 · Error típico: el chirp lineal.
      {
        id: 'e15-lineal-uniforme', tipo: 'vf', nivel: 'medio',
        enunciado: 'A linear chirp from 200 to 3,200 Hz sounds like a uniform rise.',
        correcta: false,
        explicacion: 'The ear counts octaves. The linear one covers more than three octaves in the first second and less than one in the second, so it seems to slow down. The exponential one sounds uniform, because it doubles its frequency every equal amount of time.',
      },
      // 13 · Error típico: la fórmula del chirp.
      {
        id: 'e15-formula-chirp', tipo: 'opcion', nivel: 'reto',
        enunciado: 'To make a linear chirp you write sin(2π · (f0 + k · t) · t). What happens?',
        opciones: ['The frequency rises twice as fast as you wanted, because the phase has to be what has accumulated', 'It works perfectly', 'The frequency drops instead of rising', 'Only the volume changes'],
        correcta: 0,
        explicacion: 'The phase is the sum of what has turned at each instant: 2π · (f0 · t + k · t² / 2). With the formula in the question, its rate of change is f0 + 2 · k · t, double what was asked for.',
      },
      // 14 · Generada y aplicada: semitonos que cae una sirena.
      {
        id: 'e15-semitonos', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const v = azar.entero(10, 40), c = 12 * Math.log2((343 + v) / (343 - v));
          return {
            enunciado: 'An ambulance goes past you at ' + v + ' meters per second. How many semitones does its siren drop, with sound at 343 m/s?',
            respuesta: c, tolerancia: 0.05, decimales: 2, unidad: 'semitones', marcador: 'for example, 1.5',
            explicacion: 'The ratio between the note while approaching and while moving away is (343 + ' + v + ') / (343 − ' + v + ') = ' + num((343 + v) / (343 - v), 3) + ', and a semitone means multiplying by 2^(1/12), so it is 12 · log₂ of that ratio: ' + num(c, 2) + ' semitones. It doesn’t depend on the siren’s note.',
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
