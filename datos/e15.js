// Lección 15 · ¿Qué frecuencia tiene una sirena?: términos nuevos y banco de preguntas del examen.
// Lo carga e15.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
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
    const esc = G.ejes(ctx, { caja, x: [0, 1], y: [0, 1], marcasX: false, marcasY: false, rejilla: false, etiquetaX: 'tiempo', C });
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
    const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 30 }, x: [-1, 1], y: [0, 1], marcasX: false, marcasY: false, rejilla: false, etiquetaX: 'tiempo (el paso, en el centro)', C });
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
    G.texto(ctx, w / 2, h - 12, 'aire: ' + num(valor, 1) + ' cm · nota: ' + num(fSilbato(valor), 0) + ' Hz', { alinear: 'center', color: C.suave, tam: 12, peso: 600, C });
  }

  Curso.datos('e15', {
    terminos: [
      { termino: 'Frecuencia instantánea', definicion: 'Lo rápido que gira la noria en este momento: cuántas vueltas daría en un segundo si siguiera a ese ritmo.', imagen: 'El velocímetro de la noria' },
      { termino: 'Fase (acumulada)', definicion: 'El ángulo total que ha recorrido la cabina, contando las vueltas completas.', imagen: 'El cuentavueltas de la noria' },
      { termino: 'Cruce por cero', definicion: 'El instante en que la onda pasa por el centro; dos cruces hacia arriba seguidos encierran una vuelta.', imagen: 'La cabina pasando por la altura del eje' },
      { termino: 'Chirp', definicion: 'Una señal cuya frecuencia sube o baja con el tiempo.', imagen: 'La noria que acelera; una línea inclinada en el espectrograma' },
      { termino: 'Chirp lineal', definicion: 'Un chirp que sube los mismos hercios cada segundo.', imagen: 'Una recta en el espectrograma con eje lineal' },
      { termino: 'Chirp exponencial', definicion: 'Un chirp que sube las mismas octavas cada segundo; al oído suena uniforme.', imagen: 'Una curva hacia arriba en el espectrograma con eje lineal' },
      { termino: 'Modulación de amplitud (AM)', definicion: 'Llevar un mensaje cambiando el tamaño de una onda.', imagen: 'La noria que crece y encoge' },
      { termino: 'Modulación de frecuencia (FM)', definicion: 'Llevar un mensaje cambiando la velocidad de una onda.', imagen: 'La noria que acelera y frena' },
      { termino: 'Portadora', definicion: 'La onda de fondo, de velocidad fija, sobre la que viaja el mensaje.', imagen: 'La noria antes de modularla' },
      { termino: 'Desviación de frecuencia', definicion: 'Cuánto se aparta la frecuencia de la portadora, arriba o abajo, en una FM.', imagen: 'Lo que acelera y frena la noria' },
      { termino: 'Efecto Doppler', definicion: 'El cambio de frecuencia que oyes cuando la fuente o tú os movéis.', imagen: 'Las crestas apelotonadas delante de la ambulancia' },
    ],

    preguntas: [
      // 1 · Básica: qué es la frecuencia instantánea.
      {
        id: 'e15-definicion', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué es la frecuencia instantánea?',
        opciones: ['Lo rápido que gira la noria en este momento, el ritmo al que avanza su ángulo', 'La altura de la onda en este instante', 'El pico más alto del espectro de toda la señal', 'La frecuencia media de la señal entera'],
        correcta: 0,
        explicacion: 'Es la velocidad del giro ahora mismo. La altura de la onda es su amplitud en ese instante, y el pico del espectro y la frecuencia media miran la señal entera, no un momento concreto.',
      },
      // 2 · Generada y visual: cruces por cero.
      {
        id: 'e15-cruces', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const dt = Math.round(azar.real(0.5, 5) * 100) / 100;
          return {
            figura: (ctx, w, h, C) => dosCruces(ctx, w, h, C, dt), altoFigura: 120, textoFigura: 'Una onda con dos cruces por cero hacia arriba separados ' + num(dt, 2) + ' milisegundos',
            enunciado: 'Entre dos cruces por cero hacia arriba seguidos de un silbido pasan ' + num(dt, 2) + ' milisegundos. ¿Qué frecuencia tiene en ese momento?',
            respuesta: 1000 / dt, toleranciaRel: 0.01, unidad: 'Hz', marcador: 'por ejemplo, 400',
            explicacion: 'Entre dos cruces hacia arriba seguidos cabe una vuelta entera, y la frecuencia es la inversa de lo que dura: 1.000 / ' + num(dt, 2) + ' = ' + num(1000 / dt, 0) + ' Hz.',
          };
        },
      },
      // 3 · Generada y de reto: vueltas de un chirp lineal.
      {
        id: 'e15-vueltas', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const f0 = azar.entero(10, 50) * 10, k = azar.entero(1, 10) * 100, T = azar.elegir([0.5, 1, 1.5, 2]);
          return {
            enunciado: 'Un chirp lineal empieza en ' + num(f0) + ' Hz y sube ' + num(k) + ' hercios cada segundo. ¿Cuántas vueltas completas da en los primeros ' + num(T, 1) + ' segundos?',
            respuesta: f0 * T + k * T * T / 2, toleranciaRel: 0.02, marcador: 'por ejemplo, 350',
            explicacion: 'Las vueltas son lo acumulado: la frecuencia media, ' + num(f0 + k * T / 2) + ' Hz, por el tiempo, ' + num(T, 1) + ' s, da ' + num(f0 * T + k * T * T / 2) + ' vueltas. Multiplicar la frecuencia final por el tiempo contaría de más.',
          };
        },
      },
      // 4 · Generada y aplicada: Doppler al acercarse.
      {
        id: 'e15-doppler-acerca', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.entero(40, 120) * 10, v = azar.entero(10, 40);
          return {
            enunciado: 'Una ambulancia con una sirena de ' + num(f) + ' Hz se acerca hacia ti a ' + v + ' metros por segundo. ¿Qué frecuencia oyes, con el sonido a 343 m/s?',
            respuesta: f * 343 / (343 - v), toleranciaRel: 0.01, unidad: 'Hz', marcador: 'por ejemplo, 650',
            explicacion: 'Las crestas salen de una fuente que avanza hacia ti y te llegan más juntas: ' + num(f) + ' × 343 / (343 − ' + v + ') = ' + num(f * 343 / (343 - v), 0) + ' Hz. Al alejarse sería ' + num(f * 343 / (343 + v), 0) + ' Hz.',
          };
        },
      },
      // 5 · Error típico: la sirena que se acerca.
      {
        id: 'e15-acerca-sube', tipo: 'vf', nivel: 'medio',
        enunciado: 'Mientras una ambulancia se acerca a velocidad constante por la carretera en la que estás, su sirena suena cada vez más aguda.',
        correcta: false,
        explicacion: 'Suena más aguda que la sirena real, pero con una frecuencia fija; cuando te pasa, cae de golpe. El «cada vez más aguda» es una confusión con el volumen, que sí crece mientras se acerca.',
      },
      // 6 · FM: qué lleva el mensaje.
      {
        id: 'e15-fm', tipo: 'opcion', nivel: 'basico',
        enunciado: 'En una emisora de FM, ¿qué lleva el mensaje?',
        opciones: ['La velocidad de giro de la noria, su frecuencia', 'Su tamaño, su amplitud', 'El punto en que empieza a girar', 'El volumen del altavoz'],
        correcta: 0,
        explicacion: 'En FM la noria acelera y frena con el mensaje y su tamaño no cambia. Si cambiara el tamaño, sería AM.',
      },
      // 7 · Visual: el espectrograma de una sirena.
      {
        id: 'e15-grafica-sirena', tipo: 'grafica', nivel: 'basico', altoOpcion: 104,
        enunciado: '¿Cuál es el espectrograma de una sirena que sube y baja? El tiempo va hacia la derecha y la frecuencia hacia arriba.',
        opciones: [
          (ctx, w, h, C) => plano(ctx, w, h, C, t => 0.5 + 0.28 * Math.sin(TAU * 2 * t)),
          (ctx, w, h, C) => plano(ctx, w, h, C, () => 0.5),
          (ctx, w, h, C) => plano(ctx, w, h, C, null, 5, true),
        ],
        correcta: 0,
        explicacion: 'Una sirena es una noria que acelera y frena, así que su frecuencia sube y baja con el tiempo y deja una línea que ondula. La línea horizontal sería una nota fija, y un golpe, que reparte su energía por todas las frecuencias a la vez, sería una franja vertical.',
      },
      // 8 · Visual: la frecuencia que oyes al pasar una ambulancia.
      {
        id: 'e15-grafica-paso', tipo: 'grafica', nivel: 'medio', altoOpcion: 112,
        enunciado: 'Una ambulancia con una sirena de un solo tono pasa por delante de ti. ¿Cuál es la frecuencia que oyes a lo largo del tiempo?',
        opciones: [
          (ctx, w, h, C) => curvaPaso(ctx, w, h, C, t => 0.52 - 0.2 * Math.tanh(4 * t)),
          (ctx, w, h, C) => curvaPaso(ctx, w, h, C, t => 0.3 + 0.2 * (t + 1)),
          (ctx, w, h, C) => curvaPaso(ctx, w, h, C, t => 0.3 + 0.6 * Math.exp(-Math.pow(t * 7, 2))),
        ],
        correcta: 0,
        explicacion: 'Al acercarse oyes una nota más aguda que la real y casi fija; al pasar, cae a otra más grave y casi fija. El pico estrecho es un error habitual: lo que sube y baja al pasar es el volumen, no la frecuencia.',
      },
      // 9 · Visual con deslizador: el silbato de émbolo.
      {
        id: 'e15-silbato', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Mueve el émbolo del silbato hasta que suene a 440 Hz, la nota del diapasón.',
        min: 3, max: 25, paso: 0.05, inicial: 12, unidad: 'cm', decimales: 1, etiqueta: 'Longitud del aire', alto: 110,
        dibujar: (ctx, w, h, valor, C) => tubo(ctx, w, h, valor, C),
        correcto: v => Math.abs(fSilbato(v) - 440) <= 6, solucion: 19.1,
        explicacion: 'La nota va con la inversa de la longitud del aire, f = 343 / (4 · (L + 0,0036 m)): para bajar de unos 700 Hz a 440 Hz hay que alargar el tubo, hasta unos 19 cm.',
      },
      // 10 · Aplicada: el murciélago de herradura.
      {
        id: 'e15-herradura', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué el murciélago grande de herradura baja su nota cuando vuela más deprisa?',
        opciones: ['Para que el eco, más agudo por el efecto Doppler, le vuelva a la frecuencia que mejor oye', 'Para gastar menos energía', 'Para que las polillas no lo oigan', 'Porque se cansa al volar'],
        correcta: 0,
        explicacion: 'El eco le llega subido de tono por su propio movimiento, y baja su grito lo justo para compensarlo (Schuller y Suga, 1976).',
      },
      // 11 · Varias: la onda gravitacional.
      {
        id: 'e15-ligo', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué es cierto sobre la onda gravitacional GW150914? Marca todo lo que lo sea.',
        opciones: ['Su frecuencia subió de unos 35 a unos 250 Hz', 'Dentro de la banda de los detectores duró unas dos décimas de segundo', 'La captaron los micrófonos de los detectores', 'Para escucharla se suele subir de tono', 'Su frecuencia subía a ritmo constante'],
        correctas: [0, 1, 3],
        explicacion: 'Lo dice el artículo del descubrimiento. Los detectores miden deformaciones del espacio con láseres, no sonido, y la frecuencia subía cada vez más deprisa, no a ritmo constante. Tal cual es grave y breve, y por eso GWOSC la sube 400 Hz para oírla.',
      },
      // 12 · Error típico: el chirp lineal.
      {
        id: 'e15-lineal-uniforme', tipo: 'vf', nivel: 'medio',
        enunciado: 'Un chirp lineal de 200 a 3.200 Hz suena como una subida uniforme.',
        correcta: false,
        explicacion: 'El oído cuenta octavas. El lineal hace más de tres octavas en el primer segundo y menos de una en el segundo, así que parece que frena. Suena uniforme el exponencial, que dobla su frecuencia cada mismo tiempo.',
      },
      // 13 · Error típico: la fórmula del chirp.
      {
        id: 'e15-formula-chirp', tipo: 'opcion', nivel: 'reto',
        enunciado: 'Para fabricar un chirp lineal escribes seno de 2π · (f0 + k · t) · t. ¿Qué pasa?',
        opciones: ['La frecuencia sube el doble de deprisa de lo que querías, porque la fase tiene que ser lo acumulado', 'Funciona perfectamente', 'La frecuencia baja en vez de subir', 'Solo cambia el volumen'],
        correcta: 0,
        explicacion: 'La fase es la suma de lo girado en cada instante: 2π · (f0 · t + k · t² / 2). Con la fórmula de la pregunta, su ritmo de cambio es f0 + 2 · k · t, el doble de lo pedido.',
      },
      // 14 · Generada y aplicada: semitonos que cae una sirena.
      {
        id: 'e15-semitonos', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const v = azar.entero(10, 40), c = 12 * Math.log2((343 + v) / (343 - v));
          return {
            enunciado: 'Una ambulancia pasa por delante de ti a ' + v + ' metros por segundo. ¿Cuántos semitonos baja su sirena, con el sonido a 343 m/s?',
            respuesta: c, tolerancia: 0.05, decimales: 2, unidad: 'semitonos', marcador: 'por ejemplo, 1,5',
            explicacion: 'La razón entre la nota al acercarse y al alejarse es (343 + ' + v + ') / (343 − ' + v + ') = ' + num((343 + v) / (343 - v), 3) + ', y un semitono es multiplicar por 2^(1/12), así que son 12 · log₂ de esa razón: ' + num(c, 2) + ' semitonos. No depende de la nota de la sirena.',
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
