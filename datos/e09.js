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
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [0, n - 1], y: [-1.15, 1.15], marcasY: false, marcasX: [0, 30, 60], formatoX: v => String(v), etiquetaX: 'desplazamiento', rejilla: false, C });
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
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [0, n - 1], y: [-0.55, 1.15], marcasY: false, marcasX: [0, 50, 99], formatoX: v => String(v), etiquetaX: 'retardo', rejilla: false, C });
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
    const escB = Graficas.ejes(ctx, { caja: { x: 10, y: 6 + hA + 14, w: w - 20, h: hB }, x: [0, N], y: [-1, 1], marcasX: [0, 40, 80, 120, 160], formatoX: v => String(v), etiquetaX: 'producto, punto a punto', rejilla: false, marcasY: false, C });
    Graficas.area(ctx, escB, Array.from({ length: N }, (_, i) => i), Array.from(prod), { C });
  }

  Curso.datos('e09', {
    terminos: [
      { termino: 'Plantilla', definicion: 'La forma conocida que se busca dentro de una señal.', imagen: 'La forma púrpura que se desliza' },
      { termino: 'Correlación cruzada', definicion: 'La curva que dice, para cada desplazamiento, cuánto se parece una señal a una plantilla.', imagen: 'La plantilla deslizante y su curva naranja' },
      { termino: 'Retardo', definicion: 'Cuántas muestras, o cuánto tiempo, se ha movido la plantilla respecto de la señal.', imagen: 'La plantilla corrida hacia la derecha' },
      { termino: 'Ganancia de procesado', definicion: 'Cuánto mejora la relación señal-ruido al sumar a favor muchos puntos de una plantilla larga.', imagen: 'El pico que sobresale más cuanto más larga es la plantilla' },
      { termino: 'Filtro adaptado', definicion: 'Usar como plantilla la forma exacta que se busca: la mejor manera de encontrarla en ruido blanco.', imagen: 'El radar que busca su propio pulso' },
      { termino: 'Lóbulo lateral', definicion: 'Un pico secundario de la correlación, al lado del principal.', imagen: 'Los picos pequeños junto al grande' },
      { termino: 'Compresión de pulsos', definicion: 'Codificar un pulso largo para que su correlación sea un pico estrecho.', imagen: 'El pulso de Barker frente al pulso de tono plano' },
      { termino: 'Autocorrelación', definicion: 'La correlación de una señal consigo misma: dice a qué distancias se parece a sí misma.', imagen: 'La vocal deslizada sobre su copia' },
      { termino: 'Chip', definicion: 'Cada uno de los elementos, un uno o un menos uno, de un código pseudoaleatorio.', imagen: 'Uno de los 1.023 escalones del código de un satélite' },
      { termino: 'Código pseudoaleatorio', definicion: 'Una ristra de unos y menos unos que parece azar, pero que el emisor y el receptor conocen.', imagen: 'El código de cada satélite GPS' },
    ],

    preguntas: [
      // 1 · Básica: qué hace la correlación cruzada.
      {
        id: 'e09-que-es', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué hace la correlación cruzada?',
        opciones: [
          'Desliza una plantilla sobre la señal y, en cada posición, multiplica punto a punto y suma',
          'Suma la plantilla a la señal para reforzarla',
          'Calcula la frecuencia más alta de la señal',
          'Quita el ruido de la señal',
        ],
        correcta: 0, fijas: true,
        explicacion: 'El resultado es una curva de parecido: alta donde la plantilla encaja. Es la misma operación que la noria de prueba de Fourier, pero con cualquier forma.',
      },
      // 2 · Generada y aplicada: la distancia de un sonar.
      {
        id: 'e09-sonar', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const t = azar.entero(2, 20) * 0.05;
          return {
            enunciado: 'Un sonar oye el eco ' + num(t, 2) + ' s después de su chirrido. Si el sonido viaja a 1.500 m/s en el agua, ¿a cuántos metros está el objeto?',
            respuesta: 750 * t, toleranciaRel: 0.02, unidad: 'm', decimales: 0, marcador: 'por ejemplo, 300',
            explicacion: 'El sonido va y vuelve, así que el objeto está a la mitad de lo recorrido: 1.500 · ' + num(t, 2) + ' / 2 = ' + num(750 * t, 1) + ' m. El error típico es dar 1.500 · ' + num(t, 2) + ' = ' + num(1500 * t, 0) + ' m, olvidando la vuelta.',
          };
        },
      },
      // 3 · Generada: la nota que sale de un pico de autocorrelación.
      {
        id: 'e09-nota', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([16000, 22050, 44100]), f = azar.entero(80, 400), L = Math.round(fs / f), real = fs / L;
          return {
            enunciado: 'La autocorrelación de una vocal grabada a ' + num(fs) + ' muestras por segundo tiene su primer gran pico a ' + L + ' muestras de desplazamiento. ¿Qué frecuencia fundamental tiene la vocal, en hercios?',
            respuesta: real, toleranciaRel: 0.01, unidad: 'Hz', decimales: 1, marcador: 'por ejemplo, 120',
            explicacion: 'El primer gran pico es el periodo, ' + L + ' muestras, que son ' + L + ' / ' + num(fs) + ' = ' + num(L / fs * 1000, 2) + ' ms. La frecuencia es su inversa: ' + num(fs) + ' / ' + L + ' = ' + num(real, 1) + ' Hz.',
          };
        },
      },
      // 4 · Generada: la ganancia del código del GPS.
      {
        id: 'e09-gps-db', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const x = azar.entero(16, 20);
          return {
            enunciado: 'La señal del GPS llega ' + x + ' dB por debajo del ruido de su banda. Correlacionar un milisegundo de su código gana unos 30 dB. ¿Cuántos decibelios por encima del ruido queda la señal?',
            respuesta: 30 - x, tolerancia: 0.5, unidad: 'dB', decimales: 1, marcador: 'por ejemplo, 12',
            explicacion: 'La ganancia de procesado, 10 · log₁₀ 1.023, que son unos 30 dB, se suma en decibelios a la relación de partida: 30 − ' + x + ' = ' + (30 - x) + ' dB. Es un caso ideal: un receptor real añade su propio ruido.',
          };
        },
      },
      // 5 · Verdadero o falso: más débil que el ruido.
      {
        id: 'e09-bajo-ruido', tipo: 'vf', nivel: 'basico',
        enunciado: 'Con la correlación se puede encontrar una señal más débil que el ruido.',
        correcta: true,
        explicacion: 'La señal suma siempre a favor y el ruido se anula a medias: con una plantilla larga, la señal sale aunque empiece por debajo del ruido, como la del GPS.',
      },
      // 6 · Error típico: el pico no copia la forma.
      {
        id: 'e09-forma-pico', tipo: 'vf', nivel: 'medio',
        enunciado: 'El pico de la correlación tiene la misma forma que la señal que buscas.',
        correcta: false,
        explicacion: 'El pico mide el parecido en cada posición, no copia la forma: es simétrico aunque la forma buscada no lo sea, y dura el doble que ella.',
      },
      // 7 · Error típico: el error de octava.
      {
        id: 'e09-octava', tipo: 'opcion', nivel: 'medio',
        enunciado: 'En la autocorrelación de una «aaa», los picos a una, dos y tres vibraciones son casi igual de altos. ¿Cuál marca la nota?',
        opciones: ['El primero', 'El más alto de los tres, sea cual sea', 'El tercero, porque promedia más', 'El del desplazamiento cero'],
        correcta: 0, fijas: true,
        explicacion: 'Todos repiten la misma información, pero solo el primero es una vibración. Quedarse con el segundo da una nota una octava por debajo: es el error de octava. El del desplazamiento cero vale siempre lo máximo y no dice nada del periodo.',
      },
      // 8 · Gráfica: la autocorrelación del ruido blanco.
      {
        id: 'e09-grafica-ruido', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Cuál es la autocorrelación del **ruido blanco**?',
        opciones: [(ctx, w, h, C) => autocorrelacion(ctx, w, h, C, 'blanco'), (ctx, w, h, C) => autocorrelacion(ctx, w, h, C, 'tono'), (ctx, w, h, C) => autocorrelacion(ctx, w, h, C, 'lento')],
        correcta: 0,
        explicacion: 'El ruido blanco no se parece a sí mismo en cuanto se desplaza una muestra, solo en cero. La segunda, con picos regulares, es la de un tono, y la tercera, con una caída lenta y suave, la de un ruido grave.',
      },
      // 9 · Gráfica: la salida que separa dos aviones.
      {
        id: 'e09-grafica-aviones', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Dos aviones vuelan muy juntos. ¿Con qué salida de la correlación los distinguirías?',
        opciones: [(ctx, w, h, C) => dosEcos(ctx, w, h, C, 'plano'), (ctx, w, h, C) => dosEcos(ctx, w, h, C, 'barker'), (ctx, w, h, C) => dosEcos(ctx, w, h, C, 'azar')],
        correcta: 1,
        explicacion: 'Hacen falta picos estrechos para separar y lóbulos bajos para no confundir un lóbulo con otro avión. La primera es un solo bulto ancho, y la tercera tiene los dos picos, pero con lóbulos casi tan altos como un eco.',
      },
      // 10 · Deslizador: poner la plantilla donde encaja.
      {
        id: 'e09-deslizador', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'La forma púrpura es la plantilla. Desplázala hasta donde más se parece a la señal verde y mira cuánto suma el producto de abajo.',
        min: 0, max: 100, paso: 1, inicial: 0, unidad: ' muestras', etiqueta: 'Posición de la plantilla',
        dibujar: (ctx, w, h, valor, C) => deslizar(ctx, w, h, valor, C),
        correcto: v => Math.abs(v - ESCONDIDA) <= 2, solucion: ESCONDIDA,
        explicacion: 'En la posición correcta, casi todos los productos son positivos y el área verde es la mayor. Fuera de ella, el producto cambia de signo y las áreas se compensan.',
      },
      // 11 · Aplicada: qué permite encontrar al satélite.
      {
        id: 'e09-gps-claves', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué permite a un receptor GPS encontrar la señal de un satélite? Marca todo lo que ayude.',
        opciones: [
          'Conoce de antemano el código de cada satélite',
          'Suma la correlación durante varios milisegundos',
          'Los códigos de satélites distintos se parecen muy poco entre sí',
          'Cada satélite emite en una frecuencia distinta',
          'La señal llega más fuerte que el ruido',
        ],
        correctas: [0, 1, 2],
        explicacion: 'Todos emiten en la misma frecuencia y por debajo del ruido. Lo que permite encontrarlos es una plantilla conocida y larga, y que no se confunde con las demás.',
      },
      // 12 · Aplicada: doblar el tiempo de correlación.
      {
        id: 'e09-doblar', tipo: 'opcion', nivel: 'reto',
        enunciado: 'Si un receptor GPS dobla el tiempo durante el que correlaciona, ¿cuánto mejora la relación señal-ruido?',
        opciones: ['Unos 3 dB', 'Unos 6 dB', 'El doble de decibelios', 'Nada'],
        correcta: 0, fijas: true,
        explicacion: 'La señal suma el doble y el ruido, raíz de dos veces más: la ventaja en potencia se duplica, que son 3 dB.',
      },
      // 13 · Aplicada: sincronizar dos audios.
      {
        id: 'e09-sincronizar', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Grabas un vídeo con el audio de la cámara y, a la vez, con un micrófono aparte. ¿Cómo sincronizas los dos sonidos?',
        opciones: [
          'Buscando el desplazamiento en el que la correlación de los dos audios es máxima',
          'Igualando el volumen de los dos',
          'Buscando la frecuencia más alta de cada uno',
          'Cortándolos para que empiecen en el mismo segundo del archivo',
        ],
        correcta: 0,
        explicacion: 'Los dos audios contienen el mismo sonido con un retraso. El pico de la correlación es ese retraso, el mismo truco que con el eco del sonar.',
      },
      // 14 · La mejor plantilla.
      {
        id: 'e09-adaptado', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Para detectar una forma conocida en ruido blanco, ¿qué plantilla da el pico más alto por encima del ruido?',
        opciones: ['La propia forma que buscas', 'Un seno de la frecuencia media de la forma', 'Una plantilla más corta, para que haya menos ruido', 'Un único impulso'],
        correcta: 0, fijas: true,
        explicacion: 'Es el filtro adaptado, la técnica óptima para ruido blanco: cada punto de la plantilla pesa justo lo que aporta la señal en ese punto. Una plantilla más corta recoge menos señal, y un impulso solo mira un punto.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
