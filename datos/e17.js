// Lección 17 · Cuando suenan varias norias a la vez: términos nuevos y banco de preguntas del examen.
// Lo carga e17.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una curva en un lienzo pequeño, con su línea del cero.
  function curva(ctx, w, h, C, f, opciones) {
    const o = Object.assign({ y: [-1.3, 1.3], color: C.senal, ancho: 1.8 }, opciones || {});
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 24 }, x: [0, 1], y: o.y, marcasY: false, marcasX: [0, 1], formatoX: v => num(v) + ' s', rejilla: false, C });
    ctx.save();
    ctx.strokeStyle = G.alfa(C.eje, 0.7); ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(esc.caja.x, Math.round(esc.y(0)) + 0.5); ctx.lineTo(esc.caja.x + esc.caja.w, Math.round(esc.y(0)) + 0.5); ctx.stroke();
    ctx.restore();
    G.curva(ctx, esc, f, { color: o.color, ancho: o.ancho, n: 700, C });
    return esc;
  }

  // Las dos envolventes y el valor de la señal en un instante, para la pregunta del tamizado.
  function tamiz(ctx, w, h, C, U, L, X) {
    const esc = G.ejes(ctx, { caja: { x: 40, y: 10, w: w - 56, h: h - 20 }, x: [0, 1], y: [-2.4, 2.4], marcasX: false, marcasY: [-2, -1, 0, 1, 2], formatoY: v => num(v), rejilla: false, C });
    for (const [v, tx] of [[U, 'U'], [L, 'L']]) {
      G.curva(ctx, esc, () => v, { color: C.cuerpo, ancho: 1.4, guiones: [5, 4], halo: false, n: 4, C });
      G.texto(ctx, esc.x(1) - 4, esc.y(v) + (v > 0 ? -5 : 13), tx + ' = ' + num(v, 2), { alinear: 'right', color: C.suave, tam: 10, peso: 600, C });
    }
    G.puntos(ctx, esc, [0.45], [X], { color: C.senal, radio: 6, C });
    G.texto(ctx, esc.x(0.45) + 10, esc.y(X) + 4, 'X = ' + num(X, 2), { color: C.texto, tam: 10, peso: 600, C });
  }

  // Dos sinusoides y la barra de su cociente, para la pregunta del deslizador.
  function dosYCociente(ctx, w, h, C, valor) {
    const mitad = Math.round(w * 0.62);
    const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: mitad - 16, h: h - 30 }, x: [0, 0.01], y: [-2.3, 2.3], marcasY: false, marcasX: [0, 0.005, 0.01], formatoX: v => num(v * 1000) + ' ms', rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * 1000 * t) + Math.sin(TAU * valor * t + 0.5), { color: C.senal, ancho: 1.6, n: 500, C });
    const bx = mitad + 14, bw = w - bx - 14, by = h / 2 - 6, k = bw / 1;
    ctx.save();
    ctx.fillStyle = G.alfa(C.cuerpo, 0.12); ctx.fillRect(bx, by, bw, 12);
    ctx.fillStyle = C.respuesta; ctx.fillRect(bx, by, Math.min(bw, valor / 1000 * k), 12);
    ctx.restore();
    G.texto(ctx, bx, by - 8, 'lenta / rápida', { color: C.suave, tam: 10, C });
    G.texto(ctx, bx, by + 30, num(valor / 1000, 2), { color: C.texto, tam: 12, peso: 600, C });
  }

  // Tres capas posibles para la pregunta de la mezcla de modos: onda lenta con dos pitidos.
  const lenta = t => 0.9 * Math.sin(TAU * 1.5 * t);
  const pitido = t => ((t >= 0.18 && t < 0.4) || (t >= 0.62 && t < 0.84) ? 0.28 * Math.sin(TAU * 24 * t) : 0);
  const dentro = t => (t >= 0.18 && t < 0.4) || (t >= 0.62 && t < 0.84);

  Curso.datos('e17', {
    terminos: [
      { termino: 'Modo (componente)', definicion: 'Una oscilación que sube y baja alrededor del cero y cuyo tamaño y ritmo cambian despacio.', imagen: 'Una noria de la serie con el radio que respira y la velocidad que acelera' },
      { termino: 'Señal multicomponente', definicion: 'Una señal hecha de varios modos que suenan a la vez.', imagen: 'Varias norias girando juntas, cada una a su ritmo' },
      { termino: 'Descomposición empírica en modos (EMD)', definicion: 'Un método que pela la señal en capas, de la más rápida a la más lenta, usando solo sus picos y sus valles.', imagen: 'Pelar una cebolla' },
      { termino: 'Función de modo intrínseco (IMF)', definicion: 'El nombre técnico de una capa limpia: oscila simétrica alrededor del cero, con tantos cruces por el cero como extremos, o uno de diferencia.', imagen: 'La capa que ya no tiene ondulaciones montadas encima' },
      { termino: 'Tamizado', definicion: 'Unir los picos con una curva, los valles con otra, restar la media de las dos y repetir.', imagen: 'Un tamiz que deja pasar lo lento y retiene lo rápido' },
      { termino: 'Envolventes de picos y valles', definicion: 'Las dos curvas suaves que tocan los máximos y los mínimos de la señal.', imagen: 'Dos cuerdas tensas por encima y por debajo de la onda' },
      { termino: 'Residuo', definicion: 'Lo que queda cuando ya no se pueden sacar más capas: la tendencia.', imagen: 'El corazón de la cebolla' },
      { termino: 'Criterio de parada', definicion: 'La regla que decide cuándo una capa ya está limpia y se deja de tamizar.', imagen: 'Dejar de pelar cuando la línea del medio ya no se mueve' },
      { termino: 'Mezcla de modos', definicion: 'Cuando una capa mezcla oscilaciones de ritmos muy distintos, o una misma oscilación se reparte entre varias capas.', imagen: 'Dos capas de la cebolla pegadas' },
      { termino: 'Transformada de Hilbert-Huang', definicion: 'La descomposición empírica seguida de la señal analítica de cada capa, para dibujar su energía en el tiempo y la frecuencia.', imagen: 'Cada noria pelada, con su radio y su velocidad en cada instante' },
      { termino: 'Espectro de Hilbert', definicion: 'El mapa de tiempo y frecuencia que dibuja la frecuencia instantánea de cada capa, con su energía.', imagen: 'Una línea por noria sobre la partitura' },
      { termino: 'EEMD', definicion: 'Repetir la descomposición sobre muchas copias de la señal con ruido distinto y promediar las capas.', imagen: 'Muchas cebollas peladas a la vez y superpuestas' },
      { termino: 'VMD', definicion: 'Un método que busca todas las capas a la vez, cada una estrecha alrededor de su frecuencia central, y al que hay que decir cuántas.', imagen: 'Varios filtros que se mueven solos hasta encajar en las montañas del espectro' },
    ],

    preguntas: [
      // 1 · Básica: qué hace una pasada de tamizado.
      {
        id: 'e17-tamizado', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué hace una pasada de tamizado?',
        opciones: [
          'Resta a la señal la media de la curva que une los máximos y la que une los mínimos',
          'Quita todas las frecuencias por encima de un corte fijo',
          'Promedia la señal con una ventana deslizante',
        ],
        correcta: 0,
        explicacion: 'El método no usa cortes ni ventanas fijas: las dos envolventes salen de los picos y los valles de la propia señal, y por eso se adapta a cada una.',
      },
      // 2 · Verdadero o falso: la identidad de la suma.
      {
        id: 'e17-suma', tipo: 'vf', nivel: 'basico',
        enunciado: 'Sumando todas las capas y el residuo se recupera exactamente la señal.',
        correcta: true,
        explicacion: 'Cada capa se resta de lo que queda, así que la suma es una identidad, como ya señalaba Huang en 1998. Lo que no se garantiza es que cada capa signifique algo.',
      },
      // 3 · Error típico: separar cualquier par de notas.
      {
        id: 'e17-cualquier-par', tipo: 'vf', nivel: 'medio',
        enunciado: 'La descomposición empírica separa dos notas cualesquiera, por cerca que estén.',
        correcta: false,
        explicacion: 'Con diez pasadas de tamizado, no separa nunca dos tonos cuyo cociente de frecuencias supere unos 0,67, y en la práctica el margen cómodo ronda 0,5 (Rilling y Flandrin, 2008). Más cerca, ve una noria que late.',
      },
      // 4 · Generada, con figura: una pasada de tamizado.
      {
        id: 'e17-resta-media', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const U = Math.round(azar.real(0.6, 2) * 10) / 10, L = -Math.round(azar.real(0.4, 2) * 10) / 10;
          const X = Math.round(azar.real(L + 0.2, U - 0.2) * 10) / 10, r = X - (U + L) / 2;
          return {
            enunciado: 'En un instante, la señal vale X, la envolvente de los máximos vale U y la de los mínimos vale L. ¿Cuánto vale la señal en ese instante tras una pasada de tamizado?',
            figura: (ctx, w, h, C) => tamiz(ctx, w, h, C, U, L, X), altoFigura: 130, textoFigura: 'La señal en un instante, entre sus dos envolventes',
            respuesta: r, tolerancia: 0.011, decimales: 2, marcador: 'puede ser negativo',
            explicacion: 'Una pasada resta la media de las dos envolventes: (' + num(U, 1) + ' + (' + num(L, 1) + ')) / 2 = ' + num((U + L) / 2, 2) + '. Entonces X − ' + num((U + L) / 2, 2) + ' = ' + num(r, 2) + '.',
          };
        },
      },
      // 5 · Generada: frecuencia media a partir de los cruces por cero.
      {
        id: 'e17-cruces', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const N = azar.entero(20, 200), T = azar.elegir([0.5, 1, 2, 4]);
          return {
            enunciado: 'Una capa cruza el cero ' + N + ' veces en ' + num(T) + ' s. ¿Cuál es su frecuencia media?',
            respuesta: N / (2 * T), toleranciaRel: 0.02, unidad: 'Hz', decimales: 1,
            explicacion: 'Cada vuelta de la noria cruza el cero dos veces, una subiendo y otra bajando: ' + N + ' cruces son ' + num(N / 2, 1) + ' vueltas, y en ' + num(T) + ' s son ' + num(N / (2 * T), 1) + ' vueltas por segundo.',
          };
        },
      },
      // 6 · Aplicada y generada: el cociente de velocidades del pecho sintético.
      {
        id: 'e17-latido-respiracion', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const r = azar.entero(12, 20), c = azar.entero(55, 100);
          return {
            enunciado: 'En un ejemplo sintético, el pecho respira ' + r + ' veces por minuto y el corazón late ' + c + ' veces por minuto. ¿Cuántas veces más deprisa late que respira?',
            respuesta: c / r, toleranciaRel: 0.02, decimales: 1, marcador: 'por ejemplo, 4,5',
            explicacion: 'Se divide ' + c + ' entre ' + r + ': ' + num(c / r, 1) + ' veces. El cociente de velocidades, ' + num(r / c, 2) + ', queda por debajo de la octava, así que el problema del latido no es la velocidad: es que la respiración es mucho más grande.',
          };
        },
      },
      // 7 · Deslizador: la frontera de la octava.
      {
        id: 'e17-frontera', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Mueve la noria lenta hasta el límite a partir del cual la descomposición ya no la separa de una noria rápida de 1.000 Hz del mismo tamaño.',
        min: 300, max: 950, paso: 10, inicial: 400, unidad: 'Hz', etiqueta: 'Frecuencia de la noria lenta',
        dibujar: dosYCociente, correcto: v => v >= 550 && v <= 680, solucion: 600,
        explicacion: 'La frontera está entre 0,5 y 0,67 de cociente (Rilling y Flandrin, 2008). Aquí, con 600 Hz el error del modo 1 ya ronda el 26 % y con 670 Hz, el 62 %: por encima, la suma es una sola noria que late.',
      },
      // 8 · Gráfica: cuál es ya un modo.
      {
        id: 'e17-es-modo', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Cuál de estas curvas es ya un modo, una capa limpia?',
        opciones: [
          (ctx, w, h, C) => curva(ctx, w, h, C, t => 0.3 * Math.sin(TAU * 8 * t) + 0.3 + 1.2 * t, { y: [-0.4, 2.2] }),
          (ctx, w, h, C) => curva(ctx, w, h, C, t => Math.sin(TAU * 8 * t) * (0.65 + 0.35 * Math.sin(TAU * 1.5 * t))),
          (ctx, w, h, C) => curva(ctx, w, h, C, t => -0.6 + 0.5 * Math.sin(TAU * 1.5 * t) + 0.14 * Math.sin(TAU * 14 * t)),
        ],
        correcta: 1,
        explicacion: 'En un modo cada máximo es positivo, cada mínimo es negativo y las dos envolventes son simétricas; puede cambiar de volumen, como el de en medio. La primera lleva una tendencia debajo y la tercera, ondulaciones montadas sobre una onda lenta que ni siquiera cruza el cero.',
      },
      // 9 · Gráfica, error típico: la primera capa con mezcla de modos.
      {
        id: 'e17-mezcla', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Una onda lenta lleva dos pitidos rápidos que solo suenan de vez en cuando. ¿Qué primera capa da la descomposición clásica?',
        figura: (ctx, w, h, C) => curva(ctx, w, h, C, t => lenta(t) + pitido(t)), altoFigura: 110, textoFigura: 'La señal: una onda lenta con dos pitidos',
        opciones: [
          (ctx, w, h, C) => curva(ctx, w, h, C, pitido, { color: C.respuesta }),
          (ctx, w, h, C) => curva(ctx, w, h, C, t => pitido(t) + (dentro(t) ? 0 : lenta(t)), { color: C.respuesta }),
          (ctx, w, h, C) => curva(ctx, w, h, C, lenta, { color: C.respuesta }),
        ],
        correcta: 1,
        explicacion: 'Es la mezcla de modos: mientras suena el pitido, la primera capa lo lleva, y cuando calla, esa misma capa recoge lo siguiente más rápido que encuentra, que es la onda lenta.',
      },
      // 10 · Varias: problemas de la EMD clásica.
      {
        id: 'e17-problemas', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué problemas tiene la descomposición empírica clásica? Marca todos los que sean ciertos.',
        opciones: [
          'La mezcla de modos',
          'Los bordes de la señal salen torcidos',
          'El resultado depende del criterio de parada',
          'No se puede volver a la señal original',
          'Hay que decirle de antemano las frecuencias que buscas',
        ],
        correctas: [0, 1, 2],
        explicacion: 'La suma de las capas y el residuo devuelve la señal exacta, y el método no necesita frecuencias previas: son los dos puntos fuertes. Los tres primeros son sus defectos conocidos, y por eso existen la EEMD y otras alternativas (la VMD, en cambio, sí necesita el número de modos).',
      },
      // 11 · Aplicada: respiración y latido.
      {
        id: 'e17-radar', tipo: 'opcion', nivel: 'medio',
        enunciado: 'La respiración mueve el pecho unas veinte veces más que el latido. ¿Qué le pasa a la descomposición clásica?',
        opciones: [
          'La primera capa deja de ser el latido, porque apenas ve sus máximos',
          'Separa mejor, porque la respiración es mucho más lenta',
          'El latido sale en el residuo',
        ],
        correcta: 0,
        explicacion: 'Cuando la noria lenta es mucho más grande, casi todos los máximos de la suma son suyos y los del latido se pierden entre ellos. La velocidad no es el problema, el tamaño sí, y por eso en este campo se usan variantes como la EEMD o la VMD, o filtros previos.',
      },
      // 12 · Opción: qué hace la EEMD.
      {
        id: 'e17-eemd', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Qué hace la EEMD?',
        opciones: [
          'Repite la descomposición sobre muchas copias con ruido blanco distinto y promedia las capas',
          'Aplica una ventana de Hann antes de tamizar',
          'Tamiza una sola vez para no pasarse',
        ],
        correcta: 0,
        explicacion: 'El ruido da a cada escala un sitio donde quedarse y se anula al promediar, igual que promediar bajaba el ruido de un espectro en la lección 10.',
      },
      // 13 · Aplicada: separar la voz de una canción.
      {
        id: 'e17-voz-cancion', tipo: 'vf', nivel: 'medio',
        enunciado: 'Las aplicaciones que hoy separan la voz de una canción lo hacen con la descomposición empírica en modos.',
        correcta: false,
        explicacion: 'La descomposición no sabe qué es una voz ni un piano: solo ve capas de oscilación. Las herramientas actuales se entrenan con muchas canciones para aprender cómo suena cada instrumento.',
      },
      // 14 · Aplicada: dos silbidos cercanos.
      {
        id: 'e17-silbidos', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Dos personas silban a la vez, una a 1.000 Hz y otra a 1.300 Hz. ¿Las separará la descomposición empírica?',
        opciones: [
          'No: el cociente es 0,77, por encima del límite de unos 0,67',
          'Sí, porque son dos personas distintas',
          'Sí, si se tamiza muchas más veces',
        ],
        correcta: 0,
        explicacion: 'El método no sabe de personas: solo ve una oscilación que late. Tamizar más no arregla el límite, que sigue por debajo de unos 0,7 incluso con cien pasadas (Rilling y Flandrin, 2008).',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
