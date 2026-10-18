// Lesson 14 · Detour: wavelets for compressing and cleaning: new terms and quiz question bank.
// Loaded by en/e14.html (and, later, glosario.html and examenes.html) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una pareja de muestras vecinas, como dos tallos.
  function pareja(ctx, w, h, C, a, b) {
    const esc = G.ejes(ctx, { caja: { x: 30, y: 14, w: w - 44, h: h - 32 }, x: [0, 3], y: [0, 22], marcasX: false, marcasY: [0, 10, 20], rejilla: false, C });
    G.tallos(ctx, esc, [1, 2], [a, b], { color: C.senal, radio: 5, C });
    G.texto(ctx, esc.x(1), esc.y(a) - 10, num(a), { alinear: 'center', color: C.texto, tam: 11, peso: 600, C });
    G.texto(ctx, esc.x(2), esc.y(b) - 10, num(b), { alinear: 'center', color: C.texto, tam: 11, peso: 600, C });
  }

  // Una huella sintética diminuta (48 × 48) con tres aspectos: «bloques» (cada cuadrito de 6 × 6 con su tono medio, como JPEG
  // muy apretado), «borroso» (la pirámide de wavelets, que emborrona) y «ruido» (la imagen entera con granos sueltos).
  function huellaMini(ctx, w, h, C, modo) {
    const n = 48, lado = Math.min(w - 8, h - 8), px = lado / n, x0 = (w - lado) / 2, y0 = (h - lado) / 2;
    let v = new Float64Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dx = (i - 23.5) / 24, dy = (j - 23.5) / 24 * 1.12;
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const fase = r * 24 / 4.3 + 0.28 * Math.sin(2 * a + 3 * r);
      const env = 1 / (1 + Math.exp((r - 0.85) / 0.07));
      v[j * n + i] = 1 - env * (0.5 - 0.5 * Math.cos(TAU * fase));     // 1 = papel, 0 = tinta
    }
    if (modo === 'bloques') {
      const b = new Float64Array(n * n);
      for (let by = 0; by < n; by += 6) for (let bx = 0; bx < n; bx += 6) {
        let s = 0;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) s += v[(by + j) * n + bx + i];
        s /= 36;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) b[(by + j) * n + bx + i] = s;
      }
      v = b;
    } else if (modo === 'borroso') {
      for (let pasada = 0; pasada < 2; pasada++) {
        const b = new Float64Array(n * n);
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          let s = 0, k = 0;
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
            const jj = j + dj, ii = i + di;
            if (jj >= 0 && jj < n && ii >= 0 && ii < n) { s += v[jj * n + ii]; k++; }
          }
          b[j * n + i] = s / k;
        }
        v = b;
      }
    } else if (modo === 'ruido') {
      const az = Senal.azar(31);
      for (let i = 0; i < v.length; i++) v[i] = Math.min(1, Math.max(0, v[i] + 0.22 * az.normal()));
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      ctx.fillStyle = G.mezclar(C.cuerpo, C.pantalla, Math.min(1, Math.max(0, v[j * n + i])));
      ctx.fillRect(x0 + i * px, y0 + j * px, px + 0.5, px + 0.5);
    }
  }

  // Tres señales de 200 muestras para la pregunta de «¿cuál se guarda con pocos coeficientes de Haar?».
  function senalMini(ctx, w, h, C, tipo) {
    const n = 200, ys = new Float64Array(n);
    const az = Senal.azar(8);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      if (tipo === 'escalones') ys[i] = u < 0.18 ? 0.3 : u < 0.39 ? -0.7 : u < 0.55 ? 0.8 : u < 0.77 ? -0.2 : 0.55;
      else if (tipo === 'seno') ys[i] = 0.8 * Math.sin(TAU * 2.2 * u);
      else ys[i] = 0.55 * az.normal();
    }
    const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 20 }, x: [0, 1], y: [-1.2, 1.2], marcasX: false, marcasY: false, rejilla: false, C });
    G.linea(ctx, esc, null, ys, { t0: 0, dt: 1 / n, color: C.senal, ancho: 1.8, C });
  }

  // Los detalles de la pregunta del deslizador: 61 de ruido (desviación 1) y tres grandes de la señal.
  const az14 = Senal.azar(14);
  const ruido = Array.from({ length: 61 }, () => az14.normal());
  const maxRuido = Math.max(...ruido.map(Math.abs));
  const detalles = ruido.slice();
  detalles.splice(9, 0, 7);
  detalles.splice(30, 0, -9);
  detalles.splice(47, 0, 6);
  const solucionUmbral = Math.round((maxRuido + 6) / 2 * 10) / 10;

  Curso.datos('e14', {
    terminos: [
      { termino: 'Discrete wavelet transform (DWT)', definicion: 'Splitting a signal into a blurred version and details at scales that keep doubling, with as many numbers as it had samples.', imagen: 'The pyramid' },
      { termino: 'Blurred version (approximation)', definicion: 'The signal seen with less detail: in the simplest step, the average of each pair of samples.', imagen: 'The top level of the pyramid' },
      { termino: 'Detail (detail coefficient)', definicion: 'What you have to add to the blurred version to recover the sharp signal at that scale.', imagen: 'The steps the blurred version is missing' },
      { termino: 'Multiresolution', definicion: 'Seeing the same signal at several scales, each with half the detail of the previous one.', imagen: 'The levels of the pyramid, like octaves' },
      { termino: 'Haar wavelet', definicion: 'The simplest wavelet: a step up followed by a step down.', imagen: 'The average and the half-difference of each pair' },
      { termino: 'Daubechies wavelet', definicion: 'A short, smooth wavelet with which the pyramid can be undone without error and which stores curves well.', imagen: 'A short wave that stretches, made for curves' },
      { termino: 'Filter bank', definicion: 'A pair of filters, low-pass and high-pass, that splits the signal into two halves of frequency and keeps every other sample in each half.', imagen: 'The equalizer split in two' },
      { termino: 'Lossy compression', definicion: 'Storing only what matters in a signal and accepting a small error in exchange.', imagen: 'Throwing away the small details of the pyramid' },
      { termino: 'Threshold', definicion: 'Setting to zero the coefficients that don’t reach a certain height.', imagen: 'The purple line over the details' },
      { termino: 'Hard and soft thresholding', definicion: 'Hard thresholding erases what doesn’t reach it and leaves everything else untouched; soft thresholding also pulls what it keeps closer to zero.', imagen: 'Cutting versus cutting and shrinking' },
      { termino: 'Universal threshold', definicion: 'A threshold height that depends on the noise level and grows very slowly with the length of the signal.', imagen: 'The line just above the highest noise' },
      { termino: 'Tiles (blocking artifacts)', definicion: 'The seams that appear between blocks when an image is heavily compressed piece by piece.', imagen: 'The gridded fingerprint' },
      { termino: 'WSQ', definicion: 'The FBI standard for compressing fingerprints with a pyramid of wavelets.', imagen: 'The fingerprint that blurs without tiles' },
      { termino: 'JPEG 2000', definicion: 'An image compression standard based on a pyramid of wavelets, with no blocks.', imagen: 'The photo that blurs as you squeeze' },
    ],

    preguntas: [
      // 1 · Básica: qué guarda la versión borrosa.
      {
        id: 'e14-borrosa-pareja', tipo: 'opcion', nivel: 'basico',
        enunciado: 'In one step of the Haar pyramid, what does the blurred version of each pair of samples store?',
        opciones: ['Their average', 'Their difference', 'The larger of the two', 'Only the first one'],
        correcta: 0,
        explicacion: 'The average summarizes the pair in a single height. What is missing to recover the two samples is the detail, the half-difference. Keeping the larger one or the first one would lose information with no way of getting it back.',
      },
      // 2 · Generada y visual: el detalle de una pareja.
      {
        id: 'e14-detalle', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const a = azar.entero(2, 20);
          let b = azar.entero(2, 20);
          if (b === a) b = a + 3;
          const m = (a + b) / 2, d = (a - b) / 2;
          return {
            figura: (ctx, w, h, C) => pareja(ctx, w, h, C, a, b), altoFigura: 120, textoFigura: 'A pair of neighboring samples, with heights ' + a + ' and ' + b,
            enunciado: 'A pair of samples has values ' + a + ' and ' + b + '. What is its detail, the half-difference: the first minus the second, divided by two?',
            respuesta: d, tolerancia: 0.01, marcador: 'for example, 2.5',
            explicacion: 'With the average m = ' + num(m) + ' and the detail d = ' + num(d) + ' you recover the two samples: the first is m + d = ' + num(m + d) + ' and the second, m − d = ' + num(m - d) + '.' + (d < 0 ? ' The detail comes out negative because the first sample is the smaller one.' : ''),
          };
        },
      },
      // 3 · Generada: cuántas muestras quedan arriba de la pirámide.
      {
        id: 'e14-pisos', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const k = azar.entero(9, 14), L = azar.entero(2, 6), N = Math.pow(2, k);
          return {
            enunciado: 'A signal has ' + num(N) + ' samples and you climb ' + L + ' levels of the pyramid. How many samples does the blurred version of the last level have?',
            respuesta: N / Math.pow(2, L), tolerancia: 0.01,
            explicacion: 'Each level cuts the blurred version in half: ' + num(N) + ' / 2' + ['', '', '²', '³', '⁴', '⁵', '⁶'][L] + ' = ' + num(N / Math.pow(2, L)) + '. The total number of values, the blurred version plus the details of all the levels, is still ' + num(N) + '.',
          };
        },
      },
      // 4 · Error típico: la transformada ya comprime.
      {
        id: 'e14-no-comprime', tipo: 'vf', nivel: 'basico',
        enunciado: 'The discrete wavelet transform of 1,024 samples gives more than 1,024 numbers.',
        correcta: false,
        explicacion: 'It gives exactly 1,024, not one more and not one less, and from them you recover the signal without error. What compresses is not the transform but what you do afterward: throw away the small details and keep only the big ones.',
      },
      // 5 · Error típico: qué hace un compresor wavelet.
      {
        id: 'e14-que-tira', tipo: 'opcion', nivel: 'medio',
        enunciado: 'What does a lossy wavelet compressor do?',
        opciones: ['It keeps the big details and throws away or rounds the small ones', 'It throws away all the high frequencies', 'It keeps one in every two samples', 'It keeps only the blurred version of the last level'],
        correcta: 0,
        explicacion: 'It keeps what weighs the most, whether low or high. The edge of an image is high-frequency and is kept, because its detail is big. Throwing away the highs is what a low-pass does, and keeping only the blurred version of the last level would blur everything.',
      },
      // 6 · Visual: las baldosas.
      {
        id: 'e14-baldosas', tipo: 'grafica', nivel: 'medio', altoOpcion: 116,
        enunciado: 'The same synthetic fingerprint, heavily compressed. Which one is the block version, the JPEG one?',
        opciones: [(ctx, w, h, C) => huellaMini(ctx, w, h, C, 'bloques'), (ctx, w, h, C) => huellaMini(ctx, w, h, C, 'borroso'), (ctx, w, h, C) => huellaMini(ctx, w, h, C, 'ruido')],
        correcta: 0,
        explicacion: 'JPEG summarizes each block on its own and, when you squeeze, the seams between blocks show: the grid in the first one. The second is what a pyramid of wavelets does, which blurs without seams, and the third would be the whole image with noise, uncompressed.',
      },
      // 7 · Visual con deslizador: el hueco entre el ruido y los saltos.
      {
        id: 'e14-umbral-hueco', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'These are the 64 details of a noisy signal: almost all of them are noise and three are real jumps. Move the threshold until it erases all the noise and keeps the three jumps.',
        min: 0, max: 10, paso: 0.1, inicial: 1, unidad: '', decimales: 1, etiqueta: 'Threshold height', alto: 170,
        dibujar: (ctx, w, h, valor, C) => {
          const esc = G.ejes(ctx, { caja: { x: 30, y: 10, w: w - 42, h: h - 22 }, x: [0, 65], y: [-11, 11], marcasX: false, marcasY: [-10, 0, 10], rejilla: false, C });
          ctx.save();
          ctx.fillStyle = G.alfa(C.plantilla, C.oscuro ? 0.16 : 0.1);
          ctx.fillRect(esc.caja.x, esc.y(valor), esc.caja.w, esc.y(-valor) - esc.y(valor));
          ctx.restore();
          detalles.forEach((d, i) => {
            const queda = Math.abs(d) > valor;
            G.tallos(ctx, esc, [i + 1], [d], { color: queda ? C.senal : G.alfa(C.cuerpo, 0.4), radio: 2.2, ancho: 1.3, C });
          });
          for (const s of [1, -1]) G.linea(ctx, esc, [0, 65], [s * valor, s * valor], { color: C.plantilla, ancho: 1.8, halo: false, guiones: [5, 3], C });
        },
        correcto: v => v > maxRuido + 0.05 && v < 6, solucion: solucionUmbral,
        explicacion: 'Noise leaves many small details and jumps leave few, big ones, and there is a gap between the two: the noise doesn’t go above ' + num(maxRuido, 1) + ' and the smallest of the jumps measures 6. The threshold has to sit inside that gap, like the line you see.',
      },
      // 8 · Generada: el umbral universal.
      {
        id: 'e14-umbral-universal', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const s = azar.entero(1, 10) / 100, N = azar.elegir([1024, 4096, 16384, 65536]);
          const T = s * Math.sqrt(2 * Math.log(N));
          return {
            enunciado: 'The noise in a recording has a standard deviation of ' + num(s, 2) + ' and the pyramid has ' + num(N) + ' coefficients. What is the universal threshold of Donoho and Johnstone, that is, the noise level times the square root of 2 · ln N?',
            respuesta: T, toleranciaRel: 0.02, decimales: 3, marcador: 'for example, 0.125',
            explicacion: 'It is ' + num(s, 2) + ' × √(2 · ln ' + num(N) + ') = ' + num(s, 2) + ' × ' + num(Math.sqrt(2 * Math.log(N)), 2) + ' = ' + num(T, 3) + ', almost the height of the largest of ' + num(N) + ' noise values: below it, almost everything is noise. It grows very slowly with N.',
          };
        },
      },
      // 9 · Aplicada: por qué el FBI no usó JPEG.
      {
        id: 'e14-fbi-jpeg', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why didn’t the FBI use JPEG to compress its fingerprints?',
        opciones: ['At high compression, JPEG formed 8-pixel tiles, almost the size of the ridges, that confused the programs that look for minutiae', 'JPEG doesn’t support grayscale images', 'JPEG only compresses 2 to 1', 'JPEG was slower than wavelets'],
        correcta: 0,
        explicacion: 'JPEG’s 8-pixel blocks are almost the same size as the spacing between ridges at 500 dots per inch. Above about 10 to 1, tiles were unavoidable and fooled the programs that look for minutiae, the endings and bifurcations of the ridges (Brislawn, 1995).',
      },
      // 10 · Generada y aplicada: el tamaño de una ficha.
      {
        id: 'e14-ficha', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const M = azar.entero(8, 12), R = azar.elegir([10, 15, 20]);
          return {
            enunciado: 'A scanned fingerprint card takes up ' + M + ' megabytes. With WSQ at a compression of ' + R + ' to 1, how many megabytes does it take up?',
            respuesta: M / R, toleranciaRel: 0.03, unidad: 'MB', decimales: 2, marcador: 'for example, 0.7',
            explicacion: 'Compressing ' + R + ' to 1 means dividing the size by ' + R + ': ' + M + ' / ' + R + ' = ' + num(M / R, 2) + ' MB. The FBI worked at about 15 to 1, so about 10 MB came down to less than 1 MB.',
          };
        },
      },
      // 11 · Varias: ventajas de la pirámide frente a los bloques.
      {
        id: 'e14-ventajas', tipo: 'varias', nivel: 'medio',
        enunciado: 'What advantages does a pyramid of wavelets have over JPEG’s blocks? Check all that apply.',
        opciones: ['No tiles appear', 'When you squeeze, the image blurs little by little', 'You can get a small version of the image without decompressing everything', 'It always compresses without losing anything', 'All browsers display it'],
        correctas: [0, 1, 2],
        explicacion: 'The first three come from the pyramid: with no blocks there are no seams, the fine details are lost little by little, and the top levels are already the image in small (digital cinema gets the 2K version from a 4K copy by dropping the details of the fine levels). Lossy compression loses information, and almost no browser displays JPEG 2000.',
      },
      // 12 · Error típico: el zumbido.
      {
        id: 'e14-zumbido', tipo: 'vf', nivel: 'medio',
        enunciado: 'A wavelet threshold removes the 50 Hz hum from a recording well.',
        correcta: false,
        explicacion: 'The hum is big and constant: its coefficients are big and the threshold takes them for signal, so it leaves them in. To remove it you use the band-stop filter from lesson 6, which decides by frequency, not by size.',
      },
      // 13 · Visual: qué se guarda bien con Haar.
      {
        id: 'e14-haar-escalones', tipo: 'grafica', nivel: 'basico', altoOpcion: 104,
        enunciado: 'Which of these signals is stored almost perfectly with very few details of the Haar wavelet?',
        opciones: [(ctx, w, h, C) => senalMini(ctx, w, h, C, 'escalones'), (ctx, w, h, C) => senalMini(ctx, w, h, C, 'seno'), (ctx, w, h, C) => senalMini(ctx, w, h, C, 'ruido')],
        correcta: 0,
        explicacion: 'Steps leave big details only at the jumps, and everywhere else the average explains everything. The sine needs many medium details, and it is stored better with a smooth wavelet, and noise spreads its energy over all the details and can’t be summarized.',
      },
      // 14 · El umbral duro y el suave.
      {
        id: 'e14-duro-suave', tipo: 'opcion', nivel: 'medio',
        enunciado: 'You compare hard and soft thresholding. Which one also shrinks the details that survive?',
        opciones: ['Soft thresholding', 'Hard thresholding', 'Both', 'Neither'],
        correcta: 0,
        explicacion: 'Hard thresholding leaves untouched the details that exceed the threshold and erases the rest. Soft thresholding also subtracts the threshold from the ones it keeps. That is why the soft one gives a smoother result, but it also flattens the jumps a little.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
