// Lección 5 · Por qué tu afinador necesita tiempo: términos nuevos y banco de preguntas del examen.
// Lo carga e05.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = () => Graficas;

  // Dos tonos de la misma altura que coinciden en fase en el centro del trozo (como en los retos de la lección).
  function dosTonos(T, f1, f2, fs) {
    const N = Math.max(8, Math.round(T * fs)), x = new Float64Array(N);
    for (let i = 0; i < N; i++) { const t = i / fs - T / 2; x[i] = Math.cos(TAU * f1 * t) + Math.cos(TAU * f2 * t); }
    return x;
  }
  // Espectro de Hann con relleno con ceros (solo para dibujar suave): { f, mag }.
  function espectroHann(T, f1, f2, fs) {
    const x = dosTonos(T, f1, f2, fs);
    return Senal.espectro(x, fs, { ventana: 'hann', nfft: Senal.siguientePotencia2(x.length * 8) });
  }
  // Cuántos decibelios se hunde el valle entre los dos picos más altos del entorno (0 si no hay dos picos).
  function profundidad(E, f1, f2) {
    const df = E.f[1] - E.f[0], D = f2 - f1;
    const a = Math.max(1, Math.round((f1 - D) / df)), b = Math.min(E.mag.length - 2, Math.round((f2 + D) / df));
    const mx = [];
    for (let k = a + 1; k < b; k++) if (E.mag[k] > E.mag[k - 1] && E.mag[k] >= E.mag[k + 1]) mx.push(k);
    if (mx.length < 2) return 0;
    mx.sort((p, q) => E.mag[q] - E.mag[p]);
    const i = Math.min(mx[0], mx[1]), j = Math.max(mx[0], mx[1]);
    let v = Infinity;
    for (let k = i; k <= j; k++) v = Math.min(v, E.mag[k]);
    return 20 * Math.log10(Math.min(E.mag[i], E.mag[j]) / Math.max(v, 1e-12));
  }
  // El espectro de un trozo de dos tonos (440 y 446 Hz) para la duración T, dibujado en dB entre 430 y 456 Hz.
  function dibujoDosPicos(ctx, w, h, T, C, f2 = 446, x1 = 456) {
    const E = espectroHann(T, 440, f2, 2000);
    const esc = G().ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 36 }, x: [430, x1], y: [-40, 2], marcasX: [430, 440, f2, x1], marcasY: false, formatoX: v => num(v), etiquetaX: 'frecuencia (Hz)', rejilla: false, C });
    const xs = [], ys = [];
    for (let k = 0; k < E.f.length; k++) if (E.f[k] >= 430 && E.f[k] <= x1) { xs.push(E.f[k]); ys.push(Math.max(-40, 20 * Math.log10(Math.max(E.mag[k], 1e-12) / 1))); }
    G().linea(ctx, esc, xs, ys, { color: C.espectro, ancho: 2, C });
    G().texto(ctx, 16, 20, 'trozo de ' + num(T, 3) + ' s', { color: C.tenue, tam: 11, C });
  }
  // Barras de un espectro en dB (con un suelo en −60 dB), de la barra a a la barra b.
  function barrasDb(ctx, w, h, C, lista, a, b) {
    const esc = G().ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 30 }, x: [a - 0.5, b + 0.5], y: [-60, 3], marcasX: [a, Math.round((a + b) / 2), b], marcasY: false, formatoX: v => num(v), rejilla: false, C });
    G().barras(ctx, esc, lista.map(p => p[0]), lista.map(p => Math.max(-60, p[1])), { color: C.espectro, anchoPx: Math.max(3, (w - 24) / (b - a + 1) * 0.55), base: -60, C });
  }
  // Los espectros de la pregunta de la fuga: un seno de f vueltas en un trozo de 64 muestras, ventana rectangular, en dB.
  function seno64(f) {
    const x = Float64Array.from({ length: 64 }, (_, i) => Math.sin(TAU * f * i / 64));
    const S = Senal.espectro(x, 64, { ventana: 'rect' });
    let mx = 1e-12;
    for (const v of S.mag) mx = Math.max(mx, v);
    return Array.from(S.f, (fr, k) => [Math.round(fr), 20 * Math.log10(Math.max(S.mag[k], 1e-12) / mx)]).filter(p => p[0] >= 12 && p[0] <= 29);
  }

  Curso.datos('e05', {
    terminos: [
      { termino: 'Batido', definicion: 'El vaivén de volumen que se oye cuando suenan juntas dos notas casi iguales; late tantas veces por segundo como hercios se llevan.', imagen: 'Las dos norias que se desfasan: el ua-ua-ua' },
      { termino: 'Transformada discreta de Fourier (DFT)', definicion: 'El espectro de un trozo de señal calculado con una fila finita de norias de prueba: las que dan un número entero de vueltas en el trozo.', imagen: 'La fila de norias de prueba y el área de cada una' },
      { termino: 'Transformada rápida de Fourier (FFT)', definicion: 'Una forma de calcular exactamente la misma DFT con muchísimas menos operaciones, partiendo el trabajo en mitades.', imagen: 'Repartir la cuenta en montones pequeños y juntarlos' },
      { termino: 'Resolución en frecuencia', definicion: 'La separación mínima entre dos frecuencias para verlas como dos picos; es del orden de uno partido por la duración del trozo.', imagen: 'Dos norias que solo se distinguen cuando una le saca una vuelta a la otra' },
      { termino: 'Fuga espectral', definicion: 'La energía de una frecuencia que se derrama por las barras vecinas cuando el trozo no contiene un número entero de vueltas.', imagen: 'La costura con un salto' },
      { termino: 'Ventana (de Hann)', definicion: 'Una campana por la que se multiplica el trozo para que empiece y acabe en cero y no haya salto en la costura.', imagen: 'Los bordes del trozo suavizados, en púrpura' },
      { termino: 'Relleno con ceros', definicion: 'Añadir ceros al final del trozo para que el espectro salga dibujado con más puntos, sin añadir información.', imagen: 'La misma montaña dibujada con más puntos' },
      { termino: 'Decibelio (dB)', definicion: 'Una escala que cuenta cuántas veces cabe un factor diez: cada 20 dB, la amplitud se divide por diez.', imagen: 'El espectro en dB, donde lo pequeño asoma' },
    ],

    preguntas: [
      // 1 · Resolución ≈ 1/T.
      {
        id: 'e05-resolucion', tipo: 'opcion', nivel: 'basico', fijas: true,
        enunciado: 'Tu afinador analiza trozos de 0,1 s. ¿A partir de qué separación, más o menos, puede distinguir dos notas?',
        opciones: ['0,1 Hz', '1 Hz', '10 Hz', '100 Hz'], correcta: 2,
        explicacion: 'La resolución es del orden de 1/T = 1/0,1 s = 10 Hz. Quien responde 0,1 Hz confunde la duración con la resolución, y 100 Hz invierte la relación: cuanto más corto es el trozo, peor se separan las notas.',
      },
      // 2 · Generada: latidos por segundo.
      {
        id: 'e05-latidos', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const d = azar.elegir([0.5, 1, 1.5, 2, 3, 4]), f2 = 440 + (azar.real() < 0.5 ? -d : d);
          return {
            enunciado: 'Una cuerda suena a 440 Hz y otra, a **' + num(f2, 1) + ' Hz**. ¿Cuántos latidos por segundo oyes cuando suenan juntas?',
            respuesta: d, tolerancia: 0.05, unidad: 'latidos/s', decimales: 1, marcador: 'por ejemplo, 2',
            explicacion: 'El batido tiene la frecuencia de la diferencia: |' + num(f2, 1) + ' − 440| = ' + num(d, 1) + ' Hz. Las dos norias se desfasan una vuelta entera cada 1/' + num(d, 1) + ' s, y el volumen sube y baja al ritmo de esas vueltas.',
          };
        },
      },
      // 3 · Generada: separación entre barras.
      {
        id: 'e05-barras', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 22050, 44100, 48000]), N = azar.elegir([256, 512, 1024, 2048, 4096]);
          return {
            enunciado: 'Haces una FFT de **' + num(N) + '** muestras grabadas a **' + num(fs) + ' Hz**. ¿Cuántos hercios separan dos barras del espectro?',
            respuesta: fs / N, toleranciaRel: 0.01, unidad: 'Hz', decimales: 2, marcador: 'por ejemplo, 31,25',
            explicacion: 'El trozo dura T = N/fs = ' + num(N / fs, 4) + ' s, y las norias de prueba van de 1/T en 1/T: fs/N = ' + num(fs) + '/' + num(N) + ' = ' + num(fs / N, 2) + ' Hz.',
          };
        },
      },
      // 4 · Error típico: el relleno con ceros.
      {
        id: 'e05-ceros', tipo: 'vf', nivel: 'medio', altoFigura: 130,
        figura: (ctx, w, h, C) => dibujoDosPicos(ctx, w, h, 0.1, C, 442, 452),
        textoFigura: 'El espectro de Hann de un trozo de 0,1 s con dos notas de 440 y 442 Hz: una sola montaña',
        enunciado: 'Si rellenas con ceros un trozo de 0,1 s hasta llegar a 1 s, puedes separar dos notas que se llevan 2 Hz.',
        correcta: false,
        explicacion: 'Los ceros dibujan más puntos de la misma montaña, que mide unos 10 Hz de ancho. Para separar 2 Hz hace falta señal real de, como poco, del orden de medio segundo.',
      },
      // 5 · La ventana de Hann.
      {
        id: 'e05-hann', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué hace la ventana de Hann?',
        opciones: ['Reduce la fuga a cambio de ensanchar un poco el pico', 'Aumenta la resolución del espectro', 'Quita el ruido de la señal', 'Cambia la frecuencia de muestreo'],
        correcta: 0,
        explicacion: 'Suaviza los bordes del trozo, quita el salto de la costura y baja la falda del pico. El precio es un pico algo más ancho: ni quita ruido ni aumenta la resolución.',
      },
      // 6 · Gráfica: la fuga.
      {
        id: 'e05-fuga', tipo: 'grafica', nivel: 'medio', altoOpcion: 120,
        enunciado: 'Un seno da **20,3 vueltas** en el trozo y se analiza sin suavizar los bordes. Los dibujos están en decibelios. ¿Qué espectro sale?',
        opciones: [
          (ctx, w, h, C) => barrasDb(ctx, w, h, C, seno64(20), 12, 29),
          (ctx, w, h, C) => barrasDb(ctx, w, h, C, seno64(20.3), 12, 29),
          (ctx, w, h, C) => barrasDb(ctx, w, h, C, [[17, 0], [24, 0]], 12, 29),
        ],
        correcta: 1,
        explicacion: 'Sobra un pedazo de vuelta, así que la costura tiene un salto y la energía se derrama por las barras vecinas: es la fuga, con una barra alta y faldas que bajan poco a poco. Una sola barra sería con un número entero de vueltas, y dos barras iguales confundirían la fuga con dos notas.',
      },
      // 7 · Varias: qué ayuda a separar dos frecuencias.
      {
        id: 'e05-separar', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué ayuda a separar dos frecuencias muy cercanas? Marca todo lo que sirva.',
        opciones: [
          'Escuchar más tiempo',
          'Subir la frecuencia de muestreo manteniendo la duración',
          'Rellenar con ceros',
          'Usar la FFT en lugar de la DFT',
          'Esperar a que la nota sea estable y analizar un trozo largo de ella',
        ],
        correctas: [0, 4],
        explicacion: 'Solo cuenta la duración de señal real. La frecuencia de muestreo fija el techo de frecuencias, los ceros interpolan y la FFT da el mismo resultado, solo que más deprisa.',
      },
      // 8 · Generada: decibelios.
      {
        id: 'e05-db', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const r = azar.elegir([2, 10, 100, 1000]), db = 20 * Math.log10(r);
          return {
            enunciado: 'Un armónico tiene una amplitud **' + num(r) + ' veces menor** que la del pico. ¿Cuántos decibelios por debajo está?',
            respuesta: db, tolerancia: 0.5, unidad: 'dB', decimales: 1, marcador: 'por ejemplo, 20',
            explicacion: 'Con amplitudes se usa 20·log₁₀: 20·log₁₀(' + num(r) + ') = ' + num(db, 1) + ' dB por debajo. Cada factor 10 son 20 dB, y por eso un armónico mil veces menor está a 60 dB.',
          };
        },
      },
      // 9 · Aplicada: por qué duda más con la sexta cuerda.
      {
        id: 'e05-sexta', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué un afinador necesita más tiempo para la sexta cuerda de la guitarra (Mi, 82 Hz) que para la primera (Mi, 330 Hz)?',
        opciones: [
          'Porque un semitono por encima son unos 5 Hz en la grave y unos 20 en la aguda, y separar 5 Hz exige escuchar unas cuatro veces más',
          'Porque los graves viajan más despacio por el aire',
          'Porque la FFT es más lenta con notas graves',
          'Porque el micrófono del móvil no capta los graves',
        ],
        correcta: 0,
        explicacion: 'Es la ley de 1/T aplicada a semitonos: un semitono es un 6 % de la frecuencia, así que en hercios es más pequeño en las notas graves. El sonido viaja igual de deprisa a cualquier frecuencia y la FFT tarda lo mismo.',
      },
      // 10 · Error típico: FFT aproximada.
      {
        id: 'e05-fft-exacta', tipo: 'vf', nivel: 'basico',
        enunciado: 'La FFT da un resultado más aproximado que la DFT calculada directamente.',
        correcta: false,
        explicacion: 'La FFT ordena las mismas cuentas de otra manera: el resultado es el mismo, salvo redondeos, y casi siempre con menos error acumulado, porque hace muchas menos operaciones.',
      },
      // 11 · Generada: cuánto gana la FFT.
      {
        id: 'e05-ahorro', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const N = azar.elegir([256, 1024, 4096, 65536]), ahorro = N / Math.log2(N);
          return {
            enunciado: '¿Cuántas veces menos operaciones, más o menos, hace una FFT de **' + num(N) + '** puntos que la DFT calculada directamente?',
            respuesta: ahorro, toleranciaRel: 0.05, unidad: 'veces', decimales: 0, marcador: 'por ejemplo, 100',
            explicacion: 'La DFT directa hace del orden de N² operaciones y la FFT, de N·log₂N; el cociente es N/log₂N = ' + num(N) + '/' + num(Math.log2(N)) + ' ≈ ' + num(ahorro, 0) + '. La ventaja crece con N.',
          };
        },
      },
      // 12 · Deslizador: cuánto hay que escuchar.
      {
        id: 'e05-duracion', tipo: 'deslizador', nivel: 'reto', alto: 150,
        enunciado: 'Dos notas de 440 y 446 Hz suenan juntas. Mueve la duración del trozo hasta que el espectro de Hann enseñe dos picos separados.',
        min: 0.02, max: 0.8, paso: 0.01, inicial: 0.05, unidad: 's', etiqueta: 'Duración del trozo', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => dibujoDosPicos(ctx, w, h, valor, C),
        correcto: v => profundidad(espectroHann(v, 440, 446, 2000), 440, 446) >= 3, solucion: 0.6,
        explicacion: 'Se llevan 6 Hz, así que hay que mirar como mínimo del orden de 1/6 s para que una noria saque una vuelta a la otra. Con la ventana de Hann y un cruce en fase, la separación clara llega con algo más del doble: unos 0,4 s.',
      },
      // 13 · Historia: Gauss.
      {
        id: 'e05-gauss', tipo: 'opcion', nivel: 'basico', fijas: true,
        enunciado: '¿Quién usó por primera vez, que se sepa, un método equivalente a la FFT?',
        opciones: ['Gauss, hacia 1805', 'Fourier, en 1807', 'Cooley y Tukey, en 1965', 'Shannon, en 1949'], correcta: 0,
        explicacion: 'Gauss lo escribió, muy probablemente, en 1805, para calcular órbitas de asteroides, pero no lo publicó y apareció en sus obras completas en 1866. Cooley y Tukey lo dieron a conocer de nuevo en 1965, ya con ordenadores.',
      },
      // 14 · Error típico: la frecuencia de muestreo.
      {
        id: 'e05-fs', tipo: 'vf', nivel: 'medio',
        enunciado: 'Con la misma duración, grabar a 48.000 Hz en vez de a 8.000 Hz separa mejor dos notas cercanas.',
        correcta: false,
        explicacion: 'La separación entre barras es 1/T y solo depende de la duración. Más muestras por segundo permiten ver frecuencias más altas, el techo fs/2, pero no separan mejor las cercanas.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
