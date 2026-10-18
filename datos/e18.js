// Lección 18 · Mover la energía a su sitio: la fase y la reasignación. Términos nuevos y banco de preguntas del examen.
// Lo carga e18.html (y glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Un recuadro negro con borde, para dibujar «imágenes» en las opciones de las preguntas gráficas.
  function recuadro(ctx, w, h, C) {
    const lado = Math.min(w - 12, h - 12), x = (w - lado) / 2, y = (h - lado) / 2;
    ctx.fillStyle = '#05030c'; ctx.fillRect(x, y, lado, lado);
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, lado - 1, lado - 1);
    return { x, y, lado };
  }
  // Las tres imágenes posibles al cruzar los tamaños de la noria con la fase de las letras.
  function imagenNoria(ctx, w, h, C) {
    const r = recuadro(ctx, w, h, C), cx = r.x + r.lado / 2, cy = r.y + r.lado / 2, R = r.lado * 0.36;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.4; ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); } ctx.stroke();
  }
  function imagenLetras(ctx, w, h, C) {
    const r = recuadro(ctx, w, h, C);
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.lado, r.lado); ctx.clip();
    const az = Senal.azar(3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 160; i++) ctx.fillRect(r.x + az.real() * r.lado, r.y + az.real() * r.lado, 2, 2);
    ctx.font = '700 ' + Math.round(r.lado * 0.3) + 'px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.strokeText('FASE', r.x + r.lado / 2, r.y + r.lado / 2);
    ctx.restore();
  }
  function imagenMancha(ctx, w, h, C) {
    const r = recuadro(ctx, w, h, C), cx = r.x + r.lado / 2, cy = r.y + r.lado / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r.lado * 0.28);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.lado, r.lado);
  }
  // Un golpe y un chirp en el plano tiempo-frecuencia, gruesos o finos.
  function golpeYChirp(ctx, w, h, C, estilo) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 26 }, x: [0, 1], y: [0, 1], marcasX: [0, 1], marcasY: false, formatoX: v => num(v) + ' s', rejilla: false, C });
    const fino = estilo === 'fino';
    if (estilo === 'horizontal') {
      for (const y of [0.25, 0.5, 0.75]) Graficas.linea(ctx, esc, [0.05, 0.95], [y, y], { color: C.espectro, ancho: 2, halo: false, C });
      return;
    }
    const gr = fino ? 1.6 : 9;
    Graficas.linea(ctx, esc, [0.5, 0.5], [0.04, 0.96], { color: C.espectro, ancho: gr * (fino ? 1 : 1.3), alfa: fino ? 1 : 0.55, halo: false, C });
    Graficas.linea(ctx, esc, [0.15, 0.85], [0.15, 0.85], { color: C.senal, ancho: gr, alfa: fino ? 1 : 0.55, halo: false, C });
  }
  // Dos notas y la anchura de la mancha que cada una deja con una ventana gaussiana de σ ms.
  function dosManchas(ctx, w, h, valor, C) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 38 }, x: [940, 1100], y: [0, 1.1], marcasX: [1000, 1040], marcasY: false, formatoX: v => num(v), rejilla: false, C });
    const s = 1 / (TAU * valor / 1000), amp = f => Math.exp(-0.5 * Math.pow((f - 1000) / s, 2)), amp2 = f => Math.exp(-0.5 * Math.pow((f - 1040) / s, 2));
    Graficas.curva(ctx, esc, amp, { color: C.espectro, ancho: 1.6, halo: false, alfa: 0.7, desde: 940, hasta: 1100, C });
    Graficas.curva(ctx, esc, amp2, { color: C.espectro, ancho: 1.6, halo: false, alfa: 0.7, desde: 940, hasta: 1100, C });
    Graficas.curva(ctx, esc, f => Math.min(1.05, amp(f) + amp2(f)), { color: C.respuesta, ancho: 2.2, desde: 940, hasta: 1100, C });
    Graficas.texto(ctx, w / 2, h - 4, 'mancha de una nota: ' + num(Math.sqrt(2 * Math.LN2) / (Math.PI * valor / 1000), 0) + ' Hz · separación: 40 Hz', { alinear: 'center', color: C.suave, tam: 10.5, C });
  }

  Curso.datos('e18', {
    terminos: [
      { termino: 'Fase de la STFT', definicion: 'El punto de partida de cada casilla del espectrograma, que el espectrograma tira.', imagen: 'La flecha de cada noria de prueba' },
      { termino: 'Intercambio de fase', definicion: 'Combinar los tamaños de una imagen o un sonido con la fase de otro.', imagen: 'La noria con los puntos de partida de las letras, que se lee como letras' },
      { termino: 'Frecuencia instantánea local', definicion: 'La velocidad real de la noria que domina una casilla, leída de lo que gira su fase entre dos fotos.', imagen: 'La flecha que gira de más' },
      { termino: 'Retraso de grupo local', definicion: 'El instante real de la energía de una casilla, leído de cómo cambia su fase de una fila a otra.', imagen: 'La mancha que sabe cuándo pasó' },
      { termino: 'Centro de gravedad (centroide)', definicion: 'El punto donde se equilibra la energía que cae dentro de una baldosa.', imagen: 'La balanza que se cuelga de su punto de equilibrio' },
      { termino: 'Reasignación', definicion: 'Mover cada valor del espectrograma a su centro de gravedad, calculado con la fase.', imagen: 'Las nubes de energía que se contraen hacia líneas' },
      { termino: 'Espectrograma reasignado', definicion: 'La imagen que resulta de reasignar todos los puntos de un espectrograma.', imagen: 'La partitura con trazos finos en lugar de manchas' },
      { termino: 'Distribución de Wigner-Ville', definicion: 'Una imagen tiempo-frecuencia que clava un chirp pero dibuja fantasmas entre componentes.', imagen: 'La foto nítida con dobles imágenes en medio' },
      { termino: 'Término cruzado (interferencia)', definicion: 'El fantasma que la Wigner-Ville dibuja a medio camino entre dos componentes, oscilando entre positivo y negativo.', imagen: 'La tercera nota que nadie tocó' },
      { termino: 'Umbral de energía', definicion: 'El nivel por debajo del cual no se reasigna, para no mover el ruido.', imagen: 'El colador que deja fuera las motas' },
    ],

    preguntas: [
      // 1 · Básica: qué guarda el espectrograma.
      {
        id: 'e18-que-guarda', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué se pinta de cada casilla de un espectrograma?',
        opciones: ['Solo su tamaño, la energía; la fase se tira', 'Solo su fase', 'El tamaño y la fase, en dos colores'],
        correcta: 0,
        explicacion: 'Se dibuja el tamaño al cuadrado de cada casilla y la fase se descarta. Es justo en esa mitad donde está la información que usa la reasignación para saber dónde está de verdad la energía.',
      },
      // 2 · Gráfica: intercambio de fase.
      {
        id: 'e18-intercambio', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Combinas los **tamaños de la noria** con los **puntos de partida de las letras** FASE. ¿Qué imagen sale?',
        opciones: [imagenNoria, imagenLetras, imagenMancha],
        correcta: 1,
        explicacion: 'Sale la palabra, algo sucia: la fase coloca los bordes y las posiciones, y los tamaños solo dicen cuánto hay de cada raya. La mancha brillante en el centro es lo que queda con los tamaños solos.',
      },
      // 3 · Generada: la flecha que gira de más.
      {
        id: 'e18-flecha', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fk = azar.elegir([500, 1000, 2000]), dt = azar.elegir([1, 2, 4]);
          let g = azar.entero(-9, 9) * 10;
          if (g === 0) g = 30;
          const f = fk + g / (360 * dt / 1000);
          return {
            enunciado: 'La flecha de la casilla de la fila de ' + num(fk) + ' Hz gira ' + (g > 0 ? num(g) + '° de más' : num(-g) + '° de menos') + ' entre dos fotos separadas ' + num(dt) + ' ms. ¿A qué frecuencia va la noria que lleva dentro?',
            respuesta: f, tolerancia: 1, unidad: 'Hz',
            explicacion: num(Math.abs(g)) + '° son ' + num(Math.abs(g) / 360, 3) + ' vueltas, y en ' + num(dt) + ' ms eso son ' + num(Math.abs(g) / 360 / (dt / 1000), 1) + ' vueltas por segundo ' + (g > 0 ? 'más' : 'menos') + ' que su fila: ' + num(fk) + (g > 0 ? ' + ' : ' − ') + num(Math.abs(g) / 360 / (dt / 1000), 1) + ' = ' + num(f, 1) + ' Hz.',
          };
        },
      },
      // 4 · Generada: un chirp lineal queda sobre su recta.
      {
        id: 'e18-chirp', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f0 = azar.entero(200, 800), al = azar.entero(5, 50) * 100, T = azar.entero(1, 9) / 10;
          const f = f0 + al * T;
          return {
            enunciado: 'Un chirp lineal empieza en ' + num(f0) + ' Hz y sube ' + num(al) + ' Hz cada segundo. La reasignación lleva uno de sus puntos al instante ' + num(T, 1) + ' s. ¿A qué frecuencia lo lleva?',
            respuesta: f, toleranciaRel: 0.005, unidad: 'Hz',
            explicacion: 'La reasignación localiza a la perfección los chirps lineales: cada punto cae sobre la recta del chirp, así que su frecuencia es ' + num(f0) + ' + ' + num(al) + ' · ' + num(T, 1) + ' = ' + num(f) + ' Hz.',
          };
        },
      },
      // 5 · Generada: el fantasma está en el punto medio.
      {
        id: 'e18-fantasma', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f1 = azar.entero(2, 9) * 100, f2 = azar.entero(12, 30) * 100, t1 = azar.entero(1, 4) / 10, t2 = azar.entero(5, 9) / 10;
          return {
            enunciado: 'Dos notas cortas suenan en (' + num(t1, 1) + ' s; ' + num(f1) + ' Hz) y en (' + num(t2, 1) + ' s; ' + num(f2) + ' Hz). ¿A qué frecuencia dibuja la distribución de Wigner-Ville su fantasma?',
            respuesta: (f1 + f2) / 2, tolerancia: 1, unidad: 'Hz',
            explicacion: 'El fantasma cae justo en el punto medio de las dos notas, tanto en el tiempo como en la frecuencia: (' + num(f1) + ' + ' + num(f2) + ') / 2 = ' + num((f1 + f2) / 2) + ' Hz, en el instante ' + num((t1 + t2) / 2, 2) + ' s.',
          };
        },
      },
      // 6 · Error típico: la reasignación no se queda en su columna.
      {
        id: 'e18-columna', tipo: 'vf', nivel: 'medio',
        enunciado: 'La reasignación mueve cada punto sin salir de su columna, hasta el máximo de esa columna.',
        correcta: false,
        explicacion: 'Lo mueve a su centro de gravedad, calculado con la fase, y ese centro puede estar en otro instante: en un chirp, los puntos viajan en diagonal hasta la recta, y por eso queda tan fina. Moverse solo en vertical, dentro de su columna, es lo que hará el sincrosqueezing de la lección siguiente.',
      },
      // 7 · Error típico: volver desde la reasignada.
      {
        id: 'e18-volver', tipo: 'vf', nivel: 'basico',
        enunciado: 'Desde el espectrograma reasignado se puede volver a oír la señal original.',
        correcta: false,
        explicacion: 'No: ha tirado la fase, ha movido valores de instante y ha apilado en un mismo punto valores que venían de sitios distintos. La transformada completa sí se puede deshacer; la imagen reasignada, no.',
      },
      // 8 · Varias: por qué no hay camino de vuelta.
      {
        id: 'e18-no-vuelta', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Por qué no hay camino de vuelta desde la reasignación? Marca todo lo que sea cierto.',
        opciones: ['Se queda solo con la energía, sin la fase', 'Mueve valores también en el tiempo, y cada columna deja de sumar lo que sumaba', 'Varios puntos acaban amontonados en el mismo sitio', 'Porque la transformada de Fourier no se puede invertir', 'Porque usa una ventana gaussiana'],
        correctas: [0, 1, 2],
        explicacion: 'Las tres primeras son pérdidas reales. La transformada de Fourier sí se invierte, y la ventana gaussiana no tiene nada que ver: lo que se pierde es la fase y el orden de los instantes.',
      },
      // 9 · Gráfica: golpe y chirp reasignados.
      {
        id: 'e18-golpe-chirp', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Un golpe y un chirp, con una ventana de 7 ms. ¿Cuál es el espectrograma **reasignado**?',
        opciones: [(ctx, w, h, C) => golpeYChirp(ctx, w, h, C, 'grueso'), (ctx, w, h, C) => golpeYChirp(ctx, w, h, C, 'fino'), (ctx, w, h, C) => golpeYChirp(ctx, w, h, C, 'horizontal')],
        correcta: 1,
        explicacion: 'Reasignados, el golpe es una raya vertical fina y el chirp, una diagonal fina: son justo los casos que la reasignación localiza a la perfección. La primera imagen, con bandas gruesas, es el espectrograma sin reasignar.',
      },
      // 10 · Deslizador: separar dos notas.
      {
        id: 'e18-dos-notas', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Mueve la ventana hasta que las notas de **1.000 y 1.040 Hz** salgan separadas en el reasignado: la mancha de una nota tiene que medir menos que su separación, y con algo de margen.',
        min: 2, max: 30, paso: 0.5, inicial: 4, unidad: 'ms', etiqueta: 'Anchura de la ventana (σ)',
        dibujar: (ctx, w, h, valor, C) => dosManchas(ctx, w, h, valor, C),
        correcto: v => v >= 12, solucion: 14,
        explicacion: 'Para que la reasignación afine las dos notas, la separación tiene que superar la anchura a media altura de la mancha de una nota sola, √(2 ln 2)/(π σ): con 12 ms son unos 31 Hz, menos de los 40 que las separan. Con una ventana más corta, las dos manchas se solapan y se estorban.',
      },
      // 11 · Aplicada: el umbral.
      {
        id: 'e18-umbral', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Para qué sirve el umbral de energía en un espectrograma reasignado?',
        opciones: ['Para no mover el ruido, que si no se convertiría en motas brillantes', 'Para que la imagen pese menos', 'Para que las líneas salgan más gruesas'],
        correcta: 0,
        explicacion: 'La reasignación mueve cualquier energía, también la del ruido, y la amontona en motas. Fijar un umbral deja quieto lo que casi no tiene energía, a costa de no mover lo que esté por debajo: la nota débil tiene que quedar por encima.',
      },
      // 12 · Aplicada: voz grave.
      {
        id: 'e18-voz-grave', tipo: 'opcion', nivel: 'reto',
        enunciado: 'Cantas una nota grave cuyos armónicos están separados 100 Hz. ¿Con qué ventana gaussiana sale cada armónico en su propia línea?',
        opciones: ['σ = 1 ms: así el trozo es muy corto y se ve todo en el instante exacto', 'σ = 10 ms: la mancha de un armónico mide unos 37 Hz', 'Con cualquiera: la reasignación separa todo lo que quiera'],
        correcta: 1,
        explicacion: 'Con 10 ms, la mancha de una nota mide unos 37 Hz, bastante menos que los 100 Hz que separan los armónicos. Con 1 ms mide unos 375 Hz y los armónicos se mezclan; y la reasignación no rompe la incertidumbre, solo afina lo que la ventana ya separa.',
      },
      // 13 · Historia.
      {
        id: 'e18-historia', tipo: 'opcion', nivel: 'basico', temporada: false,
        enunciado: '¿Quién propuso primero usar la fase para recolocar la energía del espectrograma?',
        opciones: ['Kodera, Gendrin y de Villedary, a finales de los años setenta', 'Auger y Flandrin, en 1995', 'Wigner, en 1932'],
        correcta: 0,
        explicacion: 'Kodera, Gendrin y de Villedary la propusieron con el nombre de método de la ventana móvil modificado. Auger y Flandrin le dieron en 1995 el nombre de reasignación y una receta con tres transformadas, y Wigner definió otra imagen, sin borrón pero con fantasmas.',
      },
      // 14 · Wigner-Ville y espectrograma.
      {
        id: 'e18-wigner-espectro', tipo: 'opcion', nivel: 'reto', temporada: false,
        enunciado: '¿Qué relación hay entre el espectrograma y la distribución de Wigner-Ville?',
        opciones: ['El espectrograma es la Wigner-Ville de la señal suavizada con la de la ventana', 'Son la misma imagen con otra escala de color', 'La Wigner-Ville es el espectrograma con la ventana más larga'],
        correcta: 0,
        explicacion: 'Suavizar borra los fantasmas, pero emborrona todo lo demás: por eso el espectrograma no tiene interferencias y sí tiene borrón. La reasignación intenta recuperar la nitidez sin traer de vuelta los fantasmas.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
