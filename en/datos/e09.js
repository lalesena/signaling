// Lección 9 · Una aguja en un pajar: términos nuevos y banco de preguntas del examen.
// Lo carga e09.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Un ruido determinista y barato (para que los dibujos sean siempre los mismos).
  function azarFijo(semilla) { let s = semilla >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 - 0.5; }; }

  // Tres autocorrelaciones, con el desplazamiento hacia la derecha: ruido blanco, un tono y un ruido grave.
  function autocorrelacion(ctx, w, h, C, tipo) {
    const n = 61, ks = [], vs = [], az = azarFijo(7);
    for (let l = 0; l < n; l++) {
      ks.push(l);
      if (tipo === 'blanco') vs.push(l === 0 ? 1 : 0.16 * az());
      else if (tipo === 'tono') vs.push(Math.cos(TAU * l / 15) * (1 - l / 140));
      else vs.push(Math.exp(-l / 14));
    }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [0, n - 1], y: [-1.15, 1.15], marcasY: false, marcasX: [0, 30, 60], formatoX: v => String(v), etiquetaX: 'shift', rejilla: false, C });
    if (tipo === 'blanco') Graficas.tallos(ctx, esc, ks, vs, { color: C.respuesta, radio: 2.2, C });
    else Graficas.linea(ctx, esc, ks, vs, { color: C.respuesta, ancho: 2, C });
  }

  // La salida de la correlación con dos ecos a 40 y 52 muestras, según el pulso.
  function dosEcos(ctx, w, h, C, tipo) {
    const n = 100, xs = [], ys = [], az = azarFijo(11);
    for (let i = 0; i < n; i++) {
      xs.push(i);
      const t = (c, a, ancho) => a * Math.max(0, 1 - Math.abs(i - c) / ancho);
      if (tipo === 'plano') ys.push(t(40, 1, 26) + t(52, 0.8, 26));
      else if (tipo === 'barker') ys.push(t(40, 1, 3) + t(52, 0.8, 3) + (Math.abs(i - 40) > 3 && Math.abs(i - 52) > 3 ? 0.07 * Math.sin(i * 2.1) : 0));
      else ys.push(t(40, 1, 3) + t(52, 0.8, 3) + (Math.abs(i - 40) > 3 && Math.abs(i - 52) > 3 ? 0.55 * az() : 0));
    }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [0, n - 1], y: [-0.55, 1.15], marcasY: false, marcasX: [0, 50, 99], formatoX: v => String(v), etiquetaX: 'lag', rejilla: false, C });
    Graficas.linea(ctx, esc, xs, ys, { color: C.respuesta, ancho: 2, C });
  }

  // Una forma corta (un chirrido con ventana) y su producto con la señal, para el deslizador.
  const FORMA = (() => { const n = 40, f = new Float64Array(n); for (let i = 0; i < n; i++) f[i] = Math.sin(TAU * (i / 8 + 0.004 * i * i / 4)) * (0.5 - 0.5 * Math.cos(TAU * i / (n - 1))); return f; })();
  const RUIDO = (() => { const az = azarFijo(3), r = new Float64Array(160); for (let i = 0; i < 160; i++) r[i] = 0.3 * az(); return r; })();
  const ESCONDIDA = 37;
  function deslizar(ctx, w, h, valor, C) {
    const N = 160, sig = new Float64Array(N), prod = new Float64Array(N), pos = Math.round(valor);
    for (let i = 0; i < N; i++) sig[i] = RUIDO[i] + (i >= ESCONDIDA && i < ESCONDIDA + FORMA.length ? FORMA[i - ESCONDIDA] : 0);
    for (let i = 0; i < FORMA.length; i++) if (pos + i < N) prod[pos + i] = sig[pos + i] * FORMA[i];
    const hA = Math.round((h - 40) * 0.55), hB = h - 40 - hA;
    const escA = Graficas.ejes(ctx, { caja: { x: 10, y: 6, w: w - 20, h: hA }, x: [0, N], y: [-1.2, 1.2], marcasX: false, marcasY: false, rejilla: false, C });
    Graficas.linea(ctx, escA, null, sig, { t0: 0, dt: 1, color: C.senal, ancho: 1.6, C });
    Graficas.linea(ctx, escA, null, FORMA, { t0: pos, dt: 1, color: C.plantilla, ancho: 2, C });
    const escB = Graficas.ejes(ctx, { caja: { x: 10, y: 6 + hA + 14, w: w - 20, h: hB }, x: [0, N], y: [-1, 1], marcasX: [0, 40, 80, 120, 160], formatoX: v => String(v), etiquetaX: 'product, point by point', rejilla: false, marcasY: false, C });
    Graficas.area(ctx, escB, Array.from({ length: N }, (_, i) => i), Array.from(prod), { C });
  }

  Curso.datos('e09', {
    terminos: [
      { termino: 'Template', definicion: 'The known shape you are looking for inside a signal.', imagen: 'The purple shape that slides' },
      { termino: 'Cross-correlation', definicion: 'The curve that says, for each shift, how much a signal resembles a template.', imagen: 'The sliding template and its orange curve' },
      { termino: 'Lag', definicion: 'How many samples, or how much time, the template has moved relative to the signal.', imagen: 'The template moved to the right' },
      { termino: 'Processing gain', definicion: 'How much the signal-to-noise ratio improves by adding up in favor many points of a long template.', imagen: 'The peak that stands out more the longer the template is' },
      { termino: 'Matched filter', definicion: 'Using as the template the exact shape you are looking for: the best way to find it in white noise.', imagen: 'The radar that looks for its own pulse' },
      { termino: 'Sidelobe', definicion: 'A secondary peak of the correlation, next to the main one.', imagen: 'The small peaks next to the big one' },
      { termino: 'Pulse compression', definicion: 'Encoding a long pulse so that its correlation is a narrow peak.', imagen: 'The Barker pulse versus the flat-tone pulse' },
      { termino: 'Autocorrelation', definicion: 'The correlation of a signal with itself: it says at which distances it resembles itself.', imagen: 'The vowel slid over its own copy' },
      { termino: 'Chip', definicion: 'Each of the elements, a one or a minus one, of a pseudorandom code.', imagen: 'One of the 1,023 steps of the code of a satellite' },
      { termino: 'Pseudorandom code', definicion: 'A string of ones and minus ones that looks like chance, but that the transmitter and the receiver know.', imagen: 'The code of each GPS satellite' },
    ],

    preguntas: [
      // 1 · Básica: qué hace la correlación cruzada.
      {
        id: 'e09-que-es', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does cross-correlation do?',
        opciones: [
          'It slides a template over the signal and, at each position, multiplies point by point and adds up',
          'It adds the template to the signal to reinforce it',
          'It calculates the highest frequency of the signal',
          'It removes the noise from the signal',
        ],
        correcta: 0, fijas: true,
        explicacion: 'The result is a resemblance curve: high where the template fits. It is the same operation as the test Ferris wheel of Fourier, but with any shape.',
      },
      // 2 · Generada y aplicada: la distancia de un sonar.
      {
        id: 'e09-sonar', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const t = azar.entero(2, 20) * 0.05;
          return {
            enunciado: 'A sonar hears the echo ' + num(t, 2) + ' s after its chirp. If sound travels at 1,500 m/s in water, how many meters away is the object?',
            respuesta: 750 * t, toleranciaRel: 0.02, unidad: 'm', decimales: 0, marcador: 'for example, 300',
            explicacion: 'The sound goes and comes back, so the object is at half of the distance traveled: 1,500 · ' + num(t, 2) + ' / 2 = ' + num(750 * t, 1) + ' m. The typical mistake is giving 1,500 · ' + num(t, 2) + ' = ' + num(1500 * t, 0) + ' m, forgetting the way back.',
          };
        },
      },
      // 3 · Generada: la nota que sale de un pico de autocorrelación.
      {
        id: 'e09-nota', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([16000, 22050, 44100]), f = azar.entero(80, 400), L = Math.round(fs / f), real = fs / L;
          return {
            enunciado: 'The autocorrelation of a vowel recorded at ' + num(fs) + ' samples per second has its first big peak at a shift of ' + L + ' samples. What is the fundamental frequency of the vowel, in hertz?',
            respuesta: real, toleranciaRel: 0.01, unidad: 'Hz', decimales: 1, marcador: 'for example, 120',
            explicacion: 'The first big peak is the period, ' + L + ' samples, which is ' + L + ' / ' + num(fs) + ' = ' + num(L / fs * 1000, 2) + ' ms. The frequency is its inverse: ' + num(fs) + ' / ' + L + ' = ' + num(real, 1) + ' Hz.',
          };
        },
      },
      // 4 · Generada: la ganancia del código del GPS.
      {
        id: 'e09-gps-db', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const x = azar.entero(16, 20);
          return {
            enunciado: 'The GPS signal arrives ' + x + ' dB below the noise of its band. Correlating one millisecond of its code gains about 30 dB. How many decibels above the noise does the signal end up?',
            respuesta: 30 - x, tolerancia: 0.5, unidad: 'dB', decimales: 1, marcador: 'for example, 12',
            explicacion: 'The processing gain, 10 · log₁₀ 1,023, which is about 30 dB, is added in decibels to the starting ratio: 30 − ' + x + ' = ' + (30 - x) + ' dB. It is an ideal case: a real receiver adds its own noise.',
          };
        },
      },
      // 5 · Verdadero o falso: más débil que el ruido.
      {
        id: 'e09-bajo-ruido', tipo: 'vf', nivel: 'basico',
        enunciado: 'With correlation you can find a signal weaker than the noise.',
        correcta: true,
        explicacion: 'The signal always adds up in favor and the noise half cancels out: with a long template, the signal comes out even if it starts below the noise, like the GPS one.',
      },
      // 6 · Error típico: el pico no copia la forma.
      {
        id: 'e09-forma-pico', tipo: 'vf', nivel: 'medio',
        enunciado: 'The peak of the correlation has the same shape as the signal you are looking for.',
        correcta: false,
        explicacion: 'The peak measures the resemblance at each position, it does not copy the shape: it is symmetric even if the shape you are looking for is not, and it lasts twice as long as it.',
      },
      // 7 · Error típico: el error de octava.
      {
        id: 'e09-octava', tipo: 'opcion', nivel: 'medio',
        enunciado: 'In the autocorrelation of an “aah,” the peaks at one, two and three vibrations are almost equally tall. Which one marks the note?',
        opciones: ['The first', 'The tallest of the three, whichever it is', 'The third, because it averages more', 'The one at zero shift'],
        correcta: 0, fijas: true,
        explicacion: 'They all repeat the same information, but only the first is one vibration. Choosing the second gives a note an octave lower: it is the octave error. The one at zero shift is always the maximum and says nothing about the period.',
      },
      // 8 · Gráfica: la autocorrelación del ruido blanco.
      {
        id: 'e09-grafica-ruido', tipo: 'grafica', nivel: 'medio',
        enunciado: 'What is the autocorrelation of **white noise**?',
        opciones: [(ctx, w, h, C) => autocorrelacion(ctx, w, h, C, 'blanco'), (ctx, w, h, C) => autocorrelacion(ctx, w, h, C, 'tono'), (ctx, w, h, C) => autocorrelacion(ctx, w, h, C, 'lento')],
        correcta: 0,
        explicacion: 'White noise does not resemble itself as soon as it is shifted by one sample, only at zero. The second one, with regular peaks, is that of a tone, and the third one, with a slow, smooth fall, that of a low-pitched noise.',
      },
      // 9 · Gráfica: la salida que separa dos aviones.
      {
        id: 'e09-grafica-aviones', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Two airplanes fly very close together. With which output of the correlation would you tell them apart?',
        opciones: [(ctx, w, h, C) => dosEcos(ctx, w, h, C, 'plano'), (ctx, w, h, C) => dosEcos(ctx, w, h, C, 'barker'), (ctx, w, h, C) => dosEcos(ctx, w, h, C, 'azar')],
        correcta: 1,
        explicacion: 'You need narrow peaks to separate them and low sidelobes so as not to mistake a lobe for another airplane. The first one is a single wide blob, and the third one has the two peaks, but with sidelobes almost as tall as an echo.',
      },
      // 10 · Deslizador: poner la plantilla donde encaja.
      {
        id: 'e09-deslizador', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'The purple shape is the template. Shift it to where it most resembles the green signal and see how much the product below adds up to.',
        min: 0, max: 100, paso: 1, inicial: 0, unidad: ' samples', etiqueta: 'Template position',
        dibujar: (ctx, w, h, valor, C) => deslizar(ctx, w, h, valor, C),
        correcto: v => Math.abs(v - ESCONDIDA) <= 2, solucion: ESCONDIDA,
        explicacion: 'At the right position, almost all the products are positive and the green area is the largest. Away from it, the product changes sign and the areas offset each other.',
      },
      // 11 · Aplicada: qué permite encontrar al satélite.
      {
        id: 'e09-gps-claves', tipo: 'varias', nivel: 'medio',
        enunciado: 'What lets a GPS receiver find the signal of a satellite? Mark everything that helps.',
        opciones: [
          'It knows the code of each satellite in advance',
          'It adds up the correlation over several milliseconds',
          'The codes of different satellites resemble each other very little',
          'Each satellite transmits on a different frequency',
          'The signal arrives stronger than the noise',
        ],
        correctas: [0, 1, 2],
        explicacion: 'They all transmit on the same frequency and below the noise. What makes it possible to find them is a known, long template that is not confused with the others.',
      },
      // 12 · Aplicada: doblar el tiempo de correlación.
      {
        id: 'e09-doblar', tipo: 'opcion', nivel: 'reto',
        enunciado: 'If a GPS receiver doubles the time over which it correlates, how much does the signal-to-noise ratio improve?',
        opciones: ['About 3 dB', 'About 6 dB', 'Twice the decibels', 'Not at all'],
        correcta: 0, fijas: true,
        explicacion: 'The signal adds up twice as much and the noise, the square root of two times as much: the advantage in power doubles, which is 3 dB.',
      },
      // 13 · Aplicada: sincronizar dos audios.
      {
        id: 'e09-sincronizar', tipo: 'opcion', nivel: 'medio',
        enunciado: 'You record a video with the camera audio and, at the same time, with a separate microphone. How do you synchronize the two sounds?',
        opciones: [
          'By looking for the shift at which the correlation of the two audios is maximum',
          'By matching the volume of the two',
          'By looking for the highest frequency of each',
          'By cutting them so they start at the same second of the file',
        ],
        correcta: 0,
        explicacion: 'The two audios contain the same sound with a delay. The peak of the correlation is that delay, the same trick as with the echo of the sonar.',
      },
      // 14 · La mejor plantilla.
      {
        id: 'e09-adaptado', tipo: 'opcion', nivel: 'medio',
        enunciado: 'To detect a known shape in white noise, which template gives the highest peak above the noise?',
        opciones: ['The very shape you are looking for', 'A sine at the mean frequency of the shape', 'A shorter template, so there is less noise', 'A single impulse'],
        correcta: 0, fijas: true,
        explicacion: 'It is the matched filter, the optimal technique for white noise: each point of the template weighs exactly what the signal contributes at that point. A shorter template picks up less signal, and an impulse looks at only one point.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
