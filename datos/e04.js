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
    G().texto(ctx, c2.x + c2.w - 6, c2.y + 14, 'área ' + (Math.abs(area) < 0.005 ? '0,00' : (area > 0 ? '+' : '') + num(area, 2)), { alinear: 'right', color: C.texto, tam: 12, peso: 600, fondo: G().alfa(C.pantalla, 0.9), C });
    G().texto(ctx, c1.x, c2.y + c2.h + 14, '0 s', { color: C.tenue, tam: 10, C });
    G().texto(ctx, c1.x + c1.w, c2.y + c2.h + 14, '2 s', { alinear: 'right', color: C.tenue, tam: 10, C });
  }

  Curso.datos('e04', {
    terminos: [
      { termino: 'Correlación (parecido)', definicion: 'Medir cuánto se parecen dos señales multiplicándolas punto a punto y sumando el resultado.', imagen: 'El área del producto de la señal por la noria de prueba' },
      { termino: 'Ortogonalidad', definicion: 'Dos norias de velocidades distintas que dan vueltas completas en el trozo dan área cero al multiplicarlas.', imagen: 'Lo positivo y lo negativo del producto, que se compensan' },
      { termino: 'Magnitud', definicion: 'El tamaño de cada noria en el espectro.', imagen: 'La distancia de la cabina al centro: la hipotenusa de las dos sombras' },
      { termino: 'Espectro de fase', definicion: 'La lista de los puntos de partida de las norias de una señal.', imagen: 'Dónde está la cabina de cada noria al empezar' },
      { termino: 'Espectro', definicion: 'La lista de norias que forman una señal, con el tamaño de cada una; se dibuja con la frecuencia en horizontal.', imagen: 'Las barras ámbar que salen al barrer la noria de prueba' },
      { termino: 'Dominio del tiempo', definicion: 'Describir una señal por cómo cambia instante a instante.', imagen: 'La curva verde' },
      { termino: 'Dominio de la frecuencia', definicion: 'Describir la misma señal por las norias que la forman.', imagen: 'El espectro' },
      { termino: 'Transformada de Fourier', definicion: 'El método que compara la señal con norias de prueba de todas las velocidades y obtiene su espectro.', imagen: 'La noria de prueba y el área, para cada velocidad' },
      { termino: 'Resonancia por simpatía', definicion: 'Una cuerda que se pone a vibrar sola cuando le llega un sonido con una de sus frecuencias.', imagen: 'El piano con el pedal pisado' },
      { termino: 'Cóclea', definicion: 'El caracol del oído interno, donde la vibración del sonido se convierte en impulsos nerviosos.', imagen: 'Un caracol con una membrana por dentro' },
      { termino: 'Membrana basilar', definicion: 'La tira que recorre la cóclea por dentro y vibra en un sitio u otro según la frecuencia del sonido.', imagen: 'La tira que vibra más cerca de la entrada con los agudos y al fondo con los graves' },
      { termino: 'Tonotopía', definicion: 'El orden por frecuencias de la cóclea: cada zona responde mejor a una frecuencia, con los agudos a la entrada y los graves al fondo.', imagen: 'La cóclea desenrollada como un teclado' },
    ],

    preguntas: [
      // 1 · Qué es el espectro.
      {
        id: 'e04-espectro', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué es el **espectro** de una señal?',
        opciones: ['La lista de norias que la forman, con el tamaño de cada una', 'La forma de la onda a lo largo del tiempo', 'La frecuencia más alta que contiene', 'La media de todos sus valores'],
        correcta: 0,
        explicacion: 'Es la misma señal contada por ingredientes en lugar de instante a instante: qué norias lleva y de qué tamaño. La forma de la onda en el tiempo es la otra descripción, la del dominio del tiempo.',
      },
      // 2 · La pregunta a la noria de prueba.
      {
        id: 'e04-pregunta-noria', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Cómo averigua la transformada de Fourier si una señal lleva una noria de 5 Hz?',
        opciones: ['Multiplica la señal, punto a punto, por una noria de prueba de 5 Hz y mira el área del producto', 'Cuenta cuántas veces cruza la señal por cero', 'Mide la altura máxima de la señal', 'Divide la señal entre 5'],
        correcta: 0,
        explicacion: 'Transformar es medir el parecido. Si la señal lleva esa noria, las dos suben y bajan a la vez, el producto queda casi siempre por encima de cero y el área crece; si no, lo que suma se compensa con lo que resta.',
      },
      // 3 · Error típico: el área siempre es exactamente cero.
      {
        id: 'e04-area-cero', tipo: 'vf', nivel: 'medio',
        enunciado: 'Si la noria de prueba no gira igual que ninguna noria de la señal, el área sale siempre exactamente cero.',
        correcta: false,
        explicacion: 'Solo se anula del todo si en el trozo que se mira caben vueltas completas de las dos. Si sobra un trozo de vuelta, queda un resto, y de él se ocupa la lección 5.',
      },
      // 4 · Por qué dos sombras.
      {
        id: 'e04-dos-sombras', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué cada noria de prueba se mira con dos sombras, la del seno y la del coseno?',
        opciones: ['Para que no se escape una noria que empieza en un punto de su vuelta donde una sola prueba daría área cero, y para saber ese punto de partida', 'Para medir las frecuencias el doble de deprisa', 'Porque una sombra mide los graves y la otra los agudos', 'Para quitar el ruido de la señal'],
        correcta: 0,
        explicacion: 'Un coseno contra un seno de la misma velocidad da área cero aunque la noria esté ahí. Con las dos áreas no se escapa ninguna y, además, de ellas salen su tamaño y su punto de partida.',
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
            textoFigura: 'El plano de las dos áreas: una noria escondida de la que se conocen el área con el seno de prueba, S = ' + num(S, 2) + ', y el área con el coseno, C = ' + num(Co, 2),
            enunciado: 'Al probar una velocidad con las dos sombras salen dos áreas: S = **' + num(S, 2) + '** con el seno de prueba y C = **' + num(Co, 2) + '** con el coseno. ¿Qué tamaño tiene la noria escondida?',
            respuesta: A, tolerancia: 0.02, marcador: 'por ejemplo, 0,75', decimales: 2,
            explicacion: 'Las dos áreas son los catetos de un triángulo rectángulo y el tamaño de la noria es su hipotenusa: √(' + num(S, 2) + '² + ' + num(Co, 2) + '²) = ' + num(A, 2) + '. El ángulo de ese triángulo es su punto de partida.',
          };
        },
      },
      // 6 · Gráfica: el espectro de una suma de dos senos.
      {
        id: 'e04-espectro-suma', tipo: 'grafica', nivel: 'medio', altoFigura: 130,
        figura: (ctx, w, h, C) => suma(ctx, w, h, C, [[100, 1], [300, 0.5]], 0.03),
        textoFigura: 'Una señal de 30 milisegundos que es la suma de un seno de 100 Hz y otro de 300 Hz',
        enunciado: 'La señal de la figura es la suma de un seno de 100 Hz, de tamaño 1, y otro de 300 Hz, de tamaño 0,5. ¿Cuál es su espectro?',
        opciones: [
          (ctx, w, h, C) => espectro(ctx, w, h, C, [[100, 1], [300, 0.5]], 400, [0, 100, 200, 300, 400]),
          (ctx, w, h, C) => espectro(ctx, w, h, C, [[100, 1], [200, 0.5]], 400, [0, 100, 200, 300, 400]),
          (ctx, w, h, C) => espectro(ctx, w, h, C, [[200, 0.75]], 400, [0, 100, 200, 300, 400]),
        ],
        correcta: 0,
        explicacion: 'El espectro enumera los ingredientes, cada uno con su tamaño, y no los promedia: una barra de altura 1 en 100 Hz y otra de altura 0,5 en 300 Hz. Una sola barra en 200 Hz sería la «media» de las dos frecuencias, que no existe como noria.',
      },
      // 7 · Gráfica: de un espectro a su señal.
      {
        id: 'e04-una-barra', tipo: 'grafica', nivel: 'basico', altoFigura: 120,
        figura: (ctx, w, h, C) => espectro(ctx, w, h, C, [[3, 1]], 12, [0, 3, 6, 9, 12]),
        textoFigura: 'Un espectro con una sola barra, en 3 Hz',
        enunciado: 'Este espectro tiene una sola barra, en 3 Hz. ¿Qué señal de un segundo es?',
        opciones: [(ctx, w, h, C) => tres(ctx, w, h, C, 'seno'), (ctx, w, h, C) => tres(ctx, w, h, C, 'cuadrada'), (ctx, w, h, C) => tres(ctx, w, h, C, 'ruido')],
        correcta: 0,
        explicacion: 'Una barra es una noria sola, es decir, un seno puro. Una onda cuadrada de 3 Hz tendría barras en 3, 9, 15 Hz y así sucesivamente, cada vez más pequeñas, y el ruido tendría un poco de todo.',
      },
      // 8 · Generada, aplicada y visual: la nota se lee en la separación entre picos.
      {
        id: 'e04-nota-falta', tipo: 'numero', nivel: 'medio', altoFigura: 120,
        generar: azar => {
          const f0 = azar.entero(100, 300), picos = [2, 3, 4, 5].map(k => k * f0);
          return {
            figura: (ctx, w, h, C) => espectro(ctx, w, h, C, picos.map((f, i) => [f, 1 / (i + 2) * 2]), 6 * f0, [0, 2 * f0, 4 * f0, 6 * f0]),
            textoFigura: 'Un espectro con cuatro picos separados por igual, en ' + picos.join(', ') + ' Hz',
            enunciado: 'El espectro de una nota tiene cuatro picos, en **' + picos.map(f => num(f)).join(', ') + ' Hz**, y ninguno por debajo. ¿Cuál es su nota, es decir, su frecuencia fundamental?',
            respuesta: f0, tolerancia: 1, unidad: 'Hz',
            explicacion: 'La nota es el ritmo al que se repite la onda, y ese ritmo es la separación entre picos vecinos: ' + num(f0) + ' Hz. Que falte el pico de ' + num(f0) + ' Hz no cambia la nota, como pasa por teléfono con las voces graves.',
          };
        },
      },
      // 9 · Deslizador generado: barrer hasta encontrar la noria.
      {
        id: 'e04-barre', tipo: 'deslizador', nivel: 'basico',
        generar: azar => {
          const f = azar.entero(2, 9);
          return {
            enunciado: 'La señal verde lleva una noria escondida. Mueve la velocidad de la noria de prueba hasta que el área sea la mayor posible.',
            min: 1, max: 10, paso: 0.5, inicial: 1, unidad: 'Hz', etiqueta: 'Velocidad de la noria de prueba', decimales: 1, alto: 190,
            dibujar: (ctx, w, h, valor, C) => barrido(ctx, w, h, valor, f, C),
            correcto: v => Math.abs(v - f) < 0.25, solucion: f,
            explicacion: 'Solo cuando la noria de prueba gira igual que la de la señal suben y bajan a la vez, el producto queda casi siempre por encima de cero y el área llega a su máximo. Aquí era ' + f + ' Hz; con cualquier otra velocidad, lo que suma se compensa con lo que resta.',
          };
        },
      },
      // 10 · Aplicada: el piano con el pedal pisado.
      {
        id: 'e04-piano', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Levantas los apagadores de un piano con el pedal y cantas fuerte una «aaa» hacia las cuerdas. Al callarte, el piano te devuelve algo parecido a tu «aaa». ¿Por qué?',
        opciones: ['Vibran las cuerdas cuyas frecuencias coinciden con norias de tu voz: el piano separa tu sonido en norias y las vuelve a sumar', 'Es el eco de la caja de madera, que repite lo que oye', 'Vibran todas las cuerdas por igual y el conjunto suena a tu voz', 'Solo vibra la cuerda de la nota que cantas'],
        correcta: 0,
        explicacion: 'Helmholtz lo describió en 1863: con los apagadores levantados, solo se ponen a vibrar las cuerdas que coinciden con alguna de las norias de la voz, y por eso el eco recuerda a la vocal. No es solo la cuerda de tu nota, porque también responden las de sus armónicos. El eco es imperfecto, y su propio traductor lo decía.',
      },
      // 11 · Aplicada, varias respuestas: el oído interno.
      {
        id: 'e04-oido', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué es correcto sobre el oído interno? Marca todo lo que lo sea.',
        opciones: [
          'Cada zona de la membrana de la cóclea responde mejor a una frecuencia: los agudos cerca de la entrada y los graves al fondo',
          'Békésy describió, en oídos de cadáveres, una onda que recorre la membrana y alcanza su máximo en un sitio que depende de la frecuencia',
          'En un oído vivo, unas células amplifican y afinan la respuesta',
          'Hace exactamente una transformada de Fourier, con la misma resolución en todas las frecuencias',
          'Para saber la nota solo importa qué zona vibra más',
        ],
        correctas: [0, 1, 2],
        explicacion: 'El reparto por lugares, la onda viajera y la amplificación activa son correctos. No es una transformada de Fourier exacta, porque los filtros del oído se solapan y se ensanchan hacia los agudos, y la nota también se lee en el ritmo de los impulsos nerviosos (Robles y Ruggero, 2001; Oxenham, 2012).',
      },
      // 12 · Error típico: la fase.
      {
        id: 'e04-misma-magnitud', tipo: 'vf', nivel: 'medio',
        enunciado: 'Dos sonidos con el mismo espectro de tamaños pueden tener formas de onda muy distintas.',
        correcta: true,
        explicacion: 'La forma de la onda depende también de las fases: con los mismos tamaños y otros puntos de partida, las mismas norias dibujan otra onda. El reto de aplanar la onda lo mostraba.',
      },
      // 13 · Error típico: la transformada no dice cuándo.
      {
        id: 'e04-cuando', tipo: 'vf', nivel: 'basico',
        enunciado: 'La transformada de Fourier de una canción te dice en qué momento suena cada nota.',
        correcta: false,
        explicacion: 'Dice qué norias hay en el trozo que se analiza, entero. El cuándo queda escondido en las fases, y para verlo a simple vista hace falta el espectrograma de la lección 11.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
