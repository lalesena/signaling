// Lección 4 · La transformada de Fourier, sin ecuaciones: términos nuevos y banco de preguntas del examen.
// Lo carga e04.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = () => Graficas;

  // Un espectro pequeño: barras ámbar en las frecuencias dadas, [[f, tamaño], …], con el eje hasta fmax.
  function espectro(ctx, w, h, C, lista, fmax, marcas) {
    const esc = G().ejes(ctx, {
      caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [0, fmax], y: [0, 1.2], marcasY: false,
      marcasX: marcas || [0, fmax / 2, fmax], formatoX: v => num(v) + ' Hz', rejilla: false, C,
    });
    G().barras(ctx, esc, lista.map(p => p[0]), lista.map(p => p[1]), { color: C.espectro, anchoPx: 7, C });
    return esc;
  }
  // Una señal de «dur» segundos como suma de senos [[f, A], …].
  function suma(ctx, w, h, C, comps, dur, color) {
    const pico = comps.reduce((s, c) => s + c[1], 0);
    const esc = G().ejes(ctx, {
      caja: { x: 10, y: 10, w: w - 20, h: h - 28 }, x: [0, dur], y: [-pico * 1.15, pico * 1.15],
      marcasY: false, marcasX: [0, dur], formatoX: v => num(v * 1000) + ' ms', rejilla: false, C,
    });
    G().curva(ctx, esc, t => comps.reduce((s, c) => s + c[1] * Math.sin(TAU * c[0] * t), 0), { color: color || C.senal, ancho: 2, n: 500, C });
    return esc;
  }
  // Tres señales de 3 Hz: seno, cuadrada y ruido, de un segundo.
  function tres(ctx, w, h, C, tipo) {
    const esc = G().ejes(ctx, {
      caja: { x: 10, y: 10, w: w - 20, h: h - 28 }, x: [0, 1], y: [-1.3, 1.3], marcasY: false,
      marcasX: [0, 1], formatoX: v => num(v) + ' s', rejilla: false, C,
    });
    if (tipo === 'seno') G().curva(ctx, esc, t => Math.sin(TAU * 3 * t), { color: C.senal, ancho: 2, n: 400, C });
    else if (tipo === 'cuadrada') G().curva(ctx, esc, t => (Math.sin(TAU * 3 * t) >= 0 ? 0.9 : -0.9), { color: C.senal, ancho: 2, n: 1200, C });
    else {
      // ruido repetible: suma de muchos senos desordenados
      const az = Senal.azar(5), xs = [], ys = [];
      for (let i = 0; i <= 160; i++) { xs.push(i / 160); ys.push(az.real(-0.9, 0.9)); }
      G().linea(ctx, esc, xs, ys, { color: C.senal, ancho: 1.6, C });
    }
  }
  // El plano de las dos áreas: (área con el seno, área con el coseno) y su triángulo.
  function plano(ctx, w, h, C, S, Co) {
    const R = 1.5, k = (Math.min(w, h) / 2 - 20) / R, cx = w / 2, cy = h / 2;
    const X = v => cx + v * k, Y = v => cy - v * k;
    ctx.save();
    ctx.strokeStyle = C.rejilla; ctx.lineWidth = 1;
    ctx.beginPath(); for (const r of [0.5, 1, 1.5]) { ctx.moveTo(cx + r * k, cy); ctx.arc(cx, cy, r * k, 0, TAU); } ctx.stroke();
    ctx.strokeStyle = C.eje; ctx.beginPath();
    ctx.moveTo(X(-R), cy); ctx.lineTo(X(R), cy); ctx.moveTo(cx, Y(-R)); ctx.lineTo(cx, Y(R)); ctx.stroke();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = G().alfa(C.tenue, 0.9);
    ctx.beginPath(); ctx.moveTo(X(S), cy); ctx.lineTo(X(S), Y(Co)); ctx.moveTo(cx, Y(Co)); ctx.lineTo(X(S), Y(Co)); ctx.stroke();
    ctx.setLineDash([]); ctx.strokeStyle = C.cuerpo; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(X(S), Y(Co)); ctx.stroke();
    ctx.restore();
    G().puntos(ctx, { x: X, y: Y, caja: { x: 0, y: 0, w, h }, C }, [S], [Co], { color: C.respuesta, radio: 6, C });
    G().texto(ctx, X(S), cy + (Co >= 0 ? 15 : -7), 'S = ' + num(S, 2), { alinear: 'center', color: C.suave, tam: 11, fondo: G().alfa(C.superficie, 0.85), C });
    G().texto(ctx, cx + (S >= 0 ? -6 : 6), Y(Co) + 4, 'C = ' + num(Co, 2), { alinear: S >= 0 ? 'right' : 'left', color: C.suave, tam: 11, fondo: G().alfa(C.superficie, 0.85), C });
  }
  // La señal del deslizador de barrido: la escondida, la noria de prueba y su producto con el área (T = 2 s).
  function barrido(ctx, w, h, valor, fs, C) {
    const T = 2, ym = 1.25;
    const h1 = Math.round(h * 0.5) - 6, h2 = h - h1 - 36;
    const c1 = { x: 12, y: 6, w: w - 24, h: h1 }, c2 = { x: 12, y: 6 + h1 + 8, w: w - 24, h: h2 };
    const e1 = G().ejes(ctx, { caja: c1, x: [0, T], y: [-ym, ym], soloEscala: true, C });
    const e2 = G().ejes(ctx, { caja: c2, x: [0, T], y: [-ym, ym], soloEscala: true, C });
    ctx.save();
    ctx.fillStyle = G().alfa(C.cuerpo, C.oscuro ? 0.04 : 0.035);
    ctx.fillRect(c1.x, c1.y, c1.w, c1.h); ctx.fillRect(c2.x, c2.y, c2.w, c2.h);
    ctx.restore();
    G().curva(ctx, e1, t => Math.sin(TAU * fs * t), { color: C.senal, ancho: 2, n: 500, C });
    G().curva(ctx, e1, t => Math.sin(TAU * valor * t), { color: C.plantilla, ancho: 1.6, guiones: [5, 3], halo: false, n: 500, C });
    const n = 400, ts = [], pr = [];
    let suma = 0;
    for (let i = 0; i <= n; i++) { const t = T * i / n, p = Math.sin(TAU * fs * t) * Math.sin(TAU * valor * t); ts.push(t); pr.push(p); if (i < n) suma += p; }
    const area = 2 * suma / n;
    G().area(ctx, e2, ts, pr, { alfa: 0.4, C });
    G().linea(ctx, e2, ts, pr, { color: C.cuerpo, ancho: 1.2, alfa: 0.85, halo: false, C });
    G().texto(ctx, c2.x + c2.w - 6, c2.y + 14, 'area ' + (Math.abs(area) < 0.005 ? '0.00' : (area > 0 ? '+' : '') + num(area, 2)), { alinear: 'right', color: C.texto, tam: 12, peso: 600, fondo: G().alfa(C.pantalla, 0.9), C });
    G().texto(ctx, c1.x, c2.y + c2.h + 14, '0 s', { color: C.tenue, tam: 10, C });
    G().texto(ctx, c1.x + c1.w, c2.y + c2.h + 14, '2 s', { alinear: 'right', color: C.tenue, tam: 10, C });
  }

  Curso.datos('e04', {
    terminos: [
      { termino: 'Correlation (resemblance)', definicion: 'Measuring how much two signals resemble each other by multiplying them point by point and adding up the result.', imagen: 'The area of the product of the signal and the test wheel' },
      { termino: 'Orthogonality', definicion: 'Two wheels of different speeds that complete whole turns in the piece give zero area when multiplied.', imagen: 'The positive and the negative parts of the product, which cancel each other' },
      { termino: 'Magnitude', definicion: 'The size of each wheel in the spectrum.', imagen: 'The distance from the cabin to the center: the hypotenuse of the two shadows' },
      { termino: 'Phase spectrum', definicion: 'The list of the starting points of the wheels in a signal.', imagen: 'Where the cabin of each wheel is at the start' },
      { termino: 'Spectrum', definicion: 'The list of wheels that make up a signal, with the size of each one; it is drawn with frequency on the horizontal axis.', imagen: 'The amber bars that appear as you sweep the test wheel' },
      { termino: 'Time domain', definicion: 'Describing a signal by how it changes instant by instant.', imagen: 'The green curve' },
      { termino: 'Frequency domain', definicion: 'Describing the same signal by the wheels that make it up.', imagen: 'The spectrum' },
      { termino: 'Fourier transform', definicion: 'The method that compares the signal with test wheels of every speed and obtains its spectrum.', imagen: 'The test wheel and the area, for each speed' },
      { termino: 'Sympathetic resonance', definicion: 'A string that starts vibrating on its own when a sound arrives with one of its frequencies.', imagen: 'The piano with the pedal pressed' },
      { termino: 'Cochlea', definicion: 'The snail-shaped part of the inner ear, where the vibration of sound is turned into nerve impulses.', imagen: 'A snail with a membrane inside' },
      { termino: 'Basilar membrane', definicion: 'The strip that runs along the inside of the cochlea and vibrates at one place or another depending on the frequency of the sound.', imagen: 'The strip that vibrates nearer the entrance for high pitches and at the far end for low ones' },
      { termino: 'Tonotopy', definicion: 'The ordering by frequency in the cochlea: each zone responds best to one frequency, with high pitches at the entrance and low pitches at the far end.', imagen: 'The cochlea unrolled like a keyboard' },
    ],

    preguntas: [
      // 1 · Qué es el espectro.
      {
        id: 'e04-espectro', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What is the **spectrum** of a signal?',
        opciones: ['The list of wheels that make it up, with the size of each one', 'The shape of the wave over time', 'The highest frequency it contains', 'The average of all its values'],
        correcta: 0,
        explicacion: 'It is the same signal told by ingredients instead of instant by instant: which wheels it contains and how big each one is. The shape of the wave over time is the other description, the time domain one.',
      },
      // 2 · La pregunta a la noria de prueba.
      {
        id: 'e04-pregunta-noria', tipo: 'opcion', nivel: 'basico',
        enunciado: 'How does the Fourier transform find out whether a signal contains a 5 Hz Ferris wheel?',
        opciones: ['It multiplies the signal, point by point, by a 5 Hz test wheel and looks at the area of the product', 'It counts how many times the signal crosses zero', 'It measures the maximum height of the signal', 'It divides the signal by 5'],
        correcta: 0,
        explicacion: 'To transform is to measure resemblance. If the signal contains that wheel, the two rise and fall together, the product stays above zero almost all the time and the area grows; if not, what adds is canceled by what subtracts.',
      },
      // 3 · Error típico: el área siempre es exactamente cero.
      {
        id: 'e04-area-cero', tipo: 'vf', nivel: 'medio',
        enunciado: 'If the test wheel doesn’t turn at the same speed as any wheel in the signal, the area is always exactly zero.',
        correcta: false,
        explicacion: 'It only vanishes completely if whole turns of both fit in the piece you are looking at. If a fraction of a turn is left over, a remainder is left, and lesson 5 deals with it.',
      },
      // 4 · Por qué dos sombras.
      {
        id: 'e04-dos-sombras', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why is each test wheel looked at with two shadows, the sine one and the cosine one?',
        opciones: ['So that a wheel that starts at a point of its turn where a single test would give zero area doesn’t escape, and to find out that starting point', 'To measure frequencies twice as fast', 'Because one shadow measures the low pitches and the other the high pitches', 'To remove the noise from the signal'],
        correcta: 0,
        explicacion: 'A cosine against a sine of the same speed gives zero area even though the wheel is there. With both areas none escapes and, besides, from them come its size and its starting point.',
      },
      // 5 · Generada y visual: el tamaño a partir de las dos áreas.
      {
        id: 'e04-tamano', tipo: 'numero', nivel: 'medio', altoFigura: 190,
        generar: azar => {
          let S, Co;
          do { S = Math.round(azar.real(-1, 1) * 100) / 100; Co = Math.round(azar.real(-1, 1) * 100) / 100; } while (Math.hypot(S, Co) < 0.3);
          const A = Math.hypot(S, Co);
          return {
            figura: (ctx, w, h, C) => plano(ctx, w, h, C, S, Co),
            textoFigura: 'The plane of the two areas: a hidden wheel for which we know the area with the test sine, S = ' + num(S, 2) + ', and the area with the cosine, C = ' + num(Co, 2),
            enunciado: 'When you try a speed with the two shadows you get two areas: S = **' + num(S, 2) + '** with the test sine and C = **' + num(Co, 2) + '** with the cosine. What size is the hidden wheel?',
            respuesta: A, tolerancia: 0.02, marcador: 'for example, 0.75', decimales: 2,
            explicacion: 'The two areas are the legs of a right triangle and the size of the wheel is its hypotenuse: √(' + num(S, 2) + '² + ' + num(Co, 2) + '²) = ' + num(A, 2) + '. The angle of that triangle is its starting point.',
          };
        },
      },
      // 6 · Gráfica: el espectro de una suma de dos senos.
      {
        id: 'e04-espectro-suma', tipo: 'grafica', nivel: 'medio', altoFigura: 130,
        figura: (ctx, w, h, C) => suma(ctx, w, h, C, [[100, 1], [300, 0.5]], 0.03),
        textoFigura: 'A 30-millisecond signal that is the sum of a 100 Hz sine and a 300 Hz one',
        enunciado: 'The signal in the figure is the sum of a 100 Hz sine, of size 1, and a 300 Hz one, of size 0.5. What is its spectrum?',
        opciones: [
          (ctx, w, h, C) => espectro(ctx, w, h, C, [[100, 1], [300, 0.5]], 400, [0, 100, 200, 300, 400]),
          (ctx, w, h, C) => espectro(ctx, w, h, C, [[100, 1], [200, 0.5]], 400, [0, 100, 200, 300, 400]),
          (ctx, w, h, C) => espectro(ctx, w, h, C, [[200, 0.75]], 400, [0, 100, 200, 300, 400]),
        ],
        correcta: 0,
        explicacion: 'The spectrum lists the ingredients, each with its size, and does not average them: one bar of height 1 at 100 Hz and another of height 0.5 at 300 Hz. A single bar at 200 Hz would be the “average” of the two frequencies, which doesn’t exist as a wheel.',
      },
      // 7 · Gráfica: de un espectro a su señal.
      {
        id: 'e04-una-barra', tipo: 'grafica', nivel: 'basico', altoFigura: 120,
        figura: (ctx, w, h, C) => espectro(ctx, w, h, C, [[3, 1]], 12, [0, 3, 6, 9, 12]),
        textoFigura: 'A spectrum with a single bar, at 3 Hz',
        enunciado: 'This spectrum has a single bar, at 3 Hz. What one-second signal is it?',
        opciones: [(ctx, w, h, C) => tres(ctx, w, h, C, 'seno'), (ctx, w, h, C) => tres(ctx, w, h, C, 'cuadrada'), (ctx, w, h, C) => tres(ctx, w, h, C, 'ruido')],
        correcta: 0,
        explicacion: 'A bar is a single wheel, that is, a pure sine. A 3 Hz square wave would have bars at 3, 9, 15 Hz and so on, getting smaller each time, and noise would have a bit of everything.',
      },
      // 8 · Generada, aplicada y visual: la nota se lee en la separación entre picos.
      {
        id: 'e04-nota-falta', tipo: 'numero', nivel: 'medio', altoFigura: 120,
        generar: azar => {
          const f0 = azar.entero(100, 300), picos = [2, 3, 4, 5].map(k => k * f0);
          return {
            figura: (ctx, w, h, C) => espectro(ctx, w, h, C, picos.map((f, i) => [f, 1 / (i + 2) * 2]), 6 * f0, [0, 2 * f0, 4 * f0, 6 * f0]),
            textoFigura: 'A spectrum with four equally spaced peaks, at ' + picos.join(', ') + ' Hz',
            enunciado: 'The spectrum of a note has four peaks, at **' + picos.map(f => num(f)).join(', ') + ' Hz**, and none below them. What is its note, that is, its fundamental frequency?',
            respuesta: f0, tolerancia: 1, unidad: 'Hz',
            explicacion: 'The note is the rate at which the wave repeats, and that rate is the spacing between neighboring peaks: ' + num(f0) + ' Hz. That the ' + num(f0) + ' Hz peak is missing doesn’t change the note, just as happens over the phone with low voices.',
          };
        },
      },
      // 9 · Deslizador generado: barrer hasta encontrar la noria.
      {
        id: 'e04-barre', tipo: 'deslizador', nivel: 'basico',
        generar: azar => {
          const f = azar.entero(2, 9);
          return {
            enunciado: 'The green signal contains a hidden wheel. Move the speed of the test wheel until the area is as large as possible.',
            min: 1, max: 10, paso: 0.5, inicial: 1, unidad: 'Hz', etiqueta: 'Test wheel speed', decimales: 1, alto: 190,
            dibujar: (ctx, w, h, valor, C) => barrido(ctx, w, h, valor, f, C),
            correcto: v => Math.abs(v - f) < 0.25, solucion: f,
            explicacion: 'Only when the test wheel turns at the same speed as the one in the signal do they rise and fall together, the product stays above zero almost all the time and the area reaches its maximum. Here it was ' + f + ' Hz; at any other speed, what adds is canceled by what subtracts.',
          };
        },
      },
      // 10 · Aplicada: el piano con el pedal pisado.
      {
        id: 'e04-piano', tipo: 'opcion', nivel: 'medio',
        enunciado: 'You lift the dampers of a piano with the pedal and sing a loud “aah” toward the strings. When you stop, the piano sends back something like your “aah.” Why?',
        opciones: ['The strings whose frequencies match wheels in your voice vibrate: the piano splits your sound into wheels and adds them back up', 'It is the echo of the wooden case, which repeats what it hears', 'All the strings vibrate equally and the whole thing sounds like your voice', 'Only the string of the note you sing vibrates'],
        correcta: 0,
        explicacion: 'Helmholtz described it in 1863: with the dampers lifted, only the strings that match some of the wheels in the voice start to vibrate, and that is why the echo recalls the vowel. It is not just the string of your note, because those of its harmonics respond too. The echo is imperfect, as his own translator said.',
      },
      // 11 · Aplicada, varias respuestas: el oído interno.
      {
        id: 'e04-oido', tipo: 'varias', nivel: 'medio',
        enunciado: 'Which of these is correct about the inner ear? Mark everything that is.',
        opciones: [
          'Each zone of the cochlear membrane responds best to one frequency: high pitches near the entrance and low pitches at the far end',
          'Békésy described, in cadavers’ ears, a wave that travels along the membrane and peaks at a place that depends on the frequency',
          'In a living ear, some cells amplify and sharpen the response',
          'It does exactly a Fourier transform, with the same resolution at all frequencies',
          'To know the note, all that matters is which zone vibrates most',
        ],
        correctas: [0, 1, 2],
        explicacion: 'The split by places, the traveling wave and the active amplification are correct. It is not an exact Fourier transform, because the ear’s filters overlap and widen toward high pitches, and the note is also read in the rhythm of the nerve impulses (Robles and Ruggero, 2001; Oxenham, 2012).',
      },
      // 12 · Error típico: la fase.
      {
        id: 'e04-misma-magnitud', tipo: 'vf', nivel: 'medio',
        enunciado: 'Two sounds with the same spectrum of sizes can have very different waveforms.',
        correcta: true,
        explicacion: 'The shape of the wave also depends on the phases: with the same sizes and other starting points, the same wheels draw a different wave. The challenge of flattening the wave showed it.',
      },
      // 13 · Error típico: la transformada no dice cuándo.
      {
        id: 'e04-cuando', tipo: 'vf', nivel: 'basico',
        enunciado: 'The Fourier transform of a song tells you at what moment each note sounds.',
        correcta: false,
        explicacion: 'It tells you which wheels are in the piece being analyzed, as a whole. The when is hidden in the phases, and to see it at a glance you need the spectrogram of lesson 11.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
