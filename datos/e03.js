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
    G.texto(ctx, xm + 4, esc.caja.y + 11, '1/40 de periodo', { color: C.plantilla, tam: 10, C });
    G.texto(ctx, w / 2, h - 7, n + (n === 1 ? ' armónico impar' : ' armónicos impares'), { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  // Un espectro de barras de una receta para la misma nota (pregunta con figura).
  function dibujoReceta(ctx, w, h, C, amps) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 30 }, x: [0.4, amps.length + 0.6], y: [0, 1.1], marcasX: false, marcasY: false, rejilla: false, C });
    G.barras(ctx, esc, amps.map((_, i) => i + 1), amps, { color: C.espectro, anchoPx: Math.max(3, (w - 20) / amps.length * 0.6), C });
    G.texto(ctx, w / 2, h - 7, 'armónicos 1, 2, 3…', { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  Curso.datos('e03', {
    terminos: [
      { termino: 'Superposición', definicion: 'Sumar ondas sumando sus alturas instante a instante.', imagen: 'Apilar las alturas de dos cabinas' },
      { termino: 'Interferencia', definicion: 'Lo que pasa al sumar dos ondas de la misma velocidad: se refuerzan si van a la par y se anulan si una sube justo cuando la otra baja.', imagen: 'Dos cabinas a la misma altura, o en lados opuestos' },
      { termino: 'Epiciclo', definicion: 'Una noria montada sobre la cabina de otra: al girar juntas, la última dibuja flores, estrellas y bucles.', imagen: 'La cadena de norias que dibuja una flor' },
      { termino: 'Fundamental', definicion: 'La noria más lenta de un sonido que se repite; marca cada cuánto se repite y fija la nota.', imagen: 'La noria grande de la base' },
      { termino: 'Armónico', definicion: 'Una noria que da un número entero de vueltas por cada vuelta de la fundamental.', imagen: 'Las norias de 2, 3 y 4 vueltas montadas encima' },
      { termino: 'Serie armónica', definicion: 'La lista de frecuencias de la fundamental y sus armónicos: una vez, dos, tres veces la fundamental…', imagen: 'Una escalera de norias cada vez más rápidas' },
      { termino: 'Timbre', definicion: 'Lo que distingue dos sonidos con la misma nota y el mismo volumen; depende sobre todo de la receta de armónicos y de cómo arranca el sonido.', imagen: 'Dos recetas de barras distintas para la misma nota' },
      { termino: 'Serie de Fourier', definicion: 'La receta completa de una onda que se repite: qué norias lleva, de qué tamaño y con qué punto de partida.', imagen: 'La pila de epiciclos' },
      { termino: 'Onda cuadrada', definicion: 'La que salta entre dos valores; su receta solo lleva armónicos impares, cada vez más pequeños.', imagen: 'La suma de impares que endereza los lados' },
      { termino: 'Fenómeno de Gibbs', definicion: 'Los flecos que quedan junto a un salto al sumar norias: se estrechan al añadir más, pero su altura se queda en torno al 9 % del salto.', imagen: 'El fleco pegado al escalón' },
      { termino: 'Fundamental ausente', definicion: 'Oír la nota de la fundamental aunque esa noria falte en el sonido.', imagen: 'La pila de norias sin su noria grande' },
    ],
    preguntas: [
      { id: 'e03-superposicion', tipo: 'opcion', nivel: 'basico', enunciado: 'Sumar dos ondas es…',
        opciones: ['sumar sus alturas instante a instante', 'sumar sus frecuencias', 'multiplicar sus alturas', 'quedarse con la más grande'], correcta: 0,
        explicacion: 'La superposición apila las alturas de las dos cabinas en cada instante. Una noria de 100 Hz y otra de 300 Hz no dan una de 400 Hz: dan una curva que contiene las dos.' },

      { id: 'e03-armonico', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const f0 = azar.elegir([110, 196, 220, 261.63, 440]), k = azar.entero(2, 8);
          return { enunciado: 'Una nota tiene una fundamental de ' + num(f0, f0 % 1 ? 2 : 0) + ' Hz. ¿A qué frecuencia está su armónico número ' + k + '?',
            respuesta: k * f0, tolerancia: 0.5, unidad: 'Hz',
            explicacion: 'Un armónico da un número entero de vueltas por cada vuelta de la fundamental: el número ' + k + ' gira ' + k + ' veces más rápido, así que ' + k + ' × ' + num(f0, f0 % 1 ? 2 : 0) + ' = ' + num(k * f0, 2) + ' Hz.' };
        } },

      { id: 'e03-desfase', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const A = azar.elegir([0.5, 1, 2]), fi = azar.elegir([0, 60, 90, 120, 180]);
          return { enunciado: 'Dos norias de la misma velocidad y de tamaño ' + num(A, 1) + ' tienen sus cabinas separadas ' + fi + '°. ¿Qué tamaño tiene la noria suma?',
            respuesta: 2 * A * Math.abs(Math.cos(fi * Math.PI / 360)), tolerancia: 0.02,
            explicacion: 'Con las cabinas a la par, los tamaños se suman (2 × ' + num(A, 1) + '); con media vuelta de diferencia se anulan (0); con un cuarto de vuelta, la suma mide ' + num(A, 1) + ' × 1,41. Con ' + fi + '°, el tamaño es 2 × ' + num(A, 1) + ' × cos(' + fi / 2 + '°) = ' + num(2 * A * Math.abs(Math.cos(fi * Math.PI / 360)), 2) + '.' };
        } },

      { id: 'e03-cuadrada', tipo: 'opcion', nivel: 'basico', enunciado: '¿Qué armónicos forman una onda cuadrada?',
        opciones: ['Solo los impares (1.º, 3.º, 5.º…), cada uno más pequeño: 1, 1/3, 1/5…', 'Todos, con el mismo tamaño', 'Solo los pares', 'Solo los impares, todos del mismo tamaño'], correcta: 0,
        explicacion: 'La mitad de arriba de la onda cuadrada es el reflejo de la de abajo, y esa simetría anula los armónicos pares. Los impares bajan como 1, 1/3, 1/5…: cuanto más rápidos, más pequeños.' },

      { id: 'e03-suma-grafica', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Cuál de estos dibujos es la suma de una noria de 1 vuelta (tamaño 1) y otra de 3 vueltas (tamaño 1/3), las dos empezando en el centro y subiendo?',
        opciones: [
          (ctx, w, h, C) => dibujoSuma(ctx, w, h, C, u => Math.sin(u) + Math.sin(3 * u) / 3),
          (ctx, w, h, C) => dibujoSuma(ctx, w, h, C, u => Math.sin(u) - Math.sin(3 * u) / 3),
          (ctx, w, h, C) => dibujoSuma(ctx, w, h, C, u => Math.sin(u) + Math.sin(2 * u) / 2),
        ], correcta: 0,
        explicacion: 'El tercer armónico, en fase, aplana la cresta y la empuja hacia los lados, camino de la onda cuadrada. Con el signo cambiado, la cresta se afila. Y una noria de 2 vueltas rompe la simetría entre la mitad de arriba y la de abajo.' },

      { id: 'e03-gibbs-porcentaje', tipo: 'numero', nivel: 'basico',
        enunciado: 'Al sumar muchísimos armónicos de una onda cuadrada, ¿qué porcentaje del salto sobresale el pico que queda junto a cada salto?',
        respuesta: 9, tolerancia: 1, unidad: '%',
        explicacion: 'Es el fenómeno de Gibbs: el exceso tiende a un 8,95 % del salto y no baja al añadir armónicos, solo se estrecha.' },

      { id: 'e03-gibbs-desaparece', tipo: 'vf', nivel: 'medio',
        enunciado: 'Si sumas suficientes armónicos, los flecos junto a los saltos de una onda cuadrada acaban desapareciendo.', correcta: false,
        explicacion: 'Los flecos se estrechan y se pegan al salto, pero su altura se queda en torno al 9 % del salto. Lo que tiende a cero es la energía del error, porque los flecos ocupan cada vez menos sitio.' },

      { id: 'e03-gibbs-deslizador', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Mueve el número de armónicos impares hasta que el primer fleco quede a menos de 1/40 de periodo del salto, la línea púrpura.',
        min: 1, max: 40, paso: 1, inicial: 2, unidad: 'impares', etiqueta: 'Armónicos',
        dibujar: (ctx, w, h, valor, C) => dibujoGibbs(ctx, w, h, C, valor),
        correcto: v => v >= 11, solucion: 11,
        explicacion: 'El primer fleco está a un periodo dividido entre cuatro veces el número de armónicos. Eso es menos de 1/40 de periodo cuando hay más de 10 armónicos impares, así que sirve el 11. Fíjate en que la altura del fleco apenas cambia.' },

      { id: 'e03-violin-flauta', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Un violín y una flauta tocan el mismo La de 440 Hz. ¿Qué cambia entre los dos sonidos?',
        opciones: ['Los tamaños de sus armónicos (la receta) y cómo arranca cada nota', 'La frecuencia fundamental', 'La velocidad del sonido', 'Nada: solo el volumen'], correcta: 0,
        explicacion: 'Misma nota es misma fundamental. Lo que cambia es el timbre: la receta de armónicos (la flauta suave es casi una noria sola; la cuerda frotada lleva muchos armónicos fuertes) y el arranque de la nota.' },

      { id: 'e03-telefono', tipo: 'vf', nivel: 'medio',
        enunciado: 'Por teléfono, la voz de un hombre suena más aguda porque el teléfono no deja pasar su fundamental.', correcta: false,
        explicacion: 'El teléfono apenas deja pasar nada por debajo de unos 300 Hz, y la fundamental de una voz grave suele estar entre 90 y 155 Hz. Aun así, el oído reconstruye la nota a partir de los armónicos que sí llegan. La voz suena más fina, no más aguda: es la fundamental ausente.' },

      { id: 'e03-fundamental', tipo: 'opcion', nivel: 'medio',
        generar: azar => {
          const f0 = azar.elegir([100, 110, 125, 150, 200]), k = azar.elegir([2, 3]);
          const p = [k * f0, (k + 1) * f0, (k + 2) * f0];
          const lista = p.map(v => num(v)).join(', ').replace(/, ([^,]*)$/, ' y $1');
          const ops = [num(f0) + ' Hz', num(p[0]) + ' Hz', num(p[1]) + ' Hz', num((p[0] + p[1] + p[2]) / 3) + ' Hz'];
          return { enunciado: 'Un sonido tiene sus tres picos más fuertes en ' + lista + ' Hz. ¿Qué nota (fundamental) oyes?',
            opciones: ops, correcta: 0,
            explicacion: 'Los picos están separados ' + num(f0) + ' Hz, y esa es la separación entre armónicos: la onda se repite ' + num(f0) + ' veces por segundo aunque la noria de ' + num(f0) + ' Hz no esté. La nota la marca el ritmo al que se repite la onda, no el pico más bajo ni el más fuerte.' };
        } },

      { id: 'e03-epiciclos-varias', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué afirmaciones sobre los epiciclos son correctas?',
        opciones: ['Una noria montada sobre otra dibuja curvas que un solo círculo no puede dibujar', 'Con suficientes norias se puede aproximar cualquier contorno cerrado', 'Los astrónomos medievales añadían epiciclos sin parar hasta tener decenas por planeta', 'Una esquina se dibuja exacta con pocas norias'],
        correctas: [0, 1],
        explicacion: 'Lo primero y lo segundo son ciertos. Lo tercero es un mito que desmontan los historiadores: en los libros de astronomía ptolemaica no hay rastro de varios epiciclos por planeta. Y lo cuarto choca con Gibbs: las esquinas necesitan muchas norias rápidas.' },

      { id: 'e03-flor', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Qué dibuja una noria de radio 1 que lleva encima otra de radio 0,5, la cual gira tres veces más rápido y en sentido contrario?',
        opciones: [
          (ctx, w, h, C) => dibujoEpiciclos(ctx, w, h, C, 1, 0.01),
          (ctx, w, h, C) => dibujoEpiciclos(ctx, w, h, C, -3, 0.5),
          (ctx, w, h, C) => dibujoEpiciclos(ctx, w, h, C, -2, 0.5),
        ], correcta: 1,
        explicacion: 'El número de lóbulos es la diferencia entre las dos velocidades: con 1 y −3, son 4. Es un error típico pensar «tres veces, tres pétalos»: la de tres pétalos es la de velocidad −2, porque |−2 − 1| = 3.' },

      { id: 'e03-mareas', tipo: 'opcion', nivel: 'reto',
        enunciado: '¿Por qué hay mareas vivas cada unos 15 días?',
        opciones: ['Porque la marea suma dos norias de periodos casi iguales, 12 h por el Sol y 12 h 25 min por la Luna, que se refuerzan y se contrarrestan por turnos', 'Porque la Luna da una vuelta a la Tierra cada 15 días', 'Porque el viento cambia cada 15 días', 'Porque el mar tarda 15 días en llenarse'], correcta: 0,
        explicacion: 'Dos norias de 12 h y de 12,42 h se alinean cada 1 / (1/12 − 1/12,42) ≈ 354 h, unos 14,8 días. Cuando van a la par, mareas vivas; a destiempo, mareas muertas.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
