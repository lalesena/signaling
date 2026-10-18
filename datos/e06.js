// Lección 6 · Filtros: quedarte con lo que importa. Términos nuevos y banco de preguntas del examen.
// Lo carga e06.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;
  const fmtF = v => (v >= 1000 ? num(v / 1000) + ' k' : num(v));

  // La curva de ganancia (dB) de un filtro, con las frecuencias en escala logarítmica de 20 a 20.000 Hz.
  function curvaFiltro(ctx, w, h, C, secs) {
    const esc = G.ejes(ctx, {
      caja: { x: 30, y: 8, w: w - 40, h: h - 28 }, x: [20, 20000], y: [-42, 6], logX: true,
      marcasX: [100, 1000, 10000], formatoX: fmtF, marcasY: [-40, -20, 0], formatoY: v => num(v), C,
    });
    const f = Float64Array.from({ length: 220 }, (_, i) => 20 * Math.pow(1000, i / 219));
    G.linea(ctx, esc, f, Senal.respuesta(secs, 48000, f).magDb, { color: C.respuesta, ancho: 2.2, C });
  }
  const FS = 48000;
  const PASO_BAJO = () => Senal.butterworth(2, 500, FS, 'pasoBajo');
  const PASO_ALTO = () => Senal.butterworth(2, 2000, FS, 'pasoAlto');
  const PASO_BANDA = () => [...Senal.butterworth(2, 300, FS, 'pasoAlto'), ...Senal.butterworth(2, 3400, FS, 'pasoBajo')];
  const MUESCA = () => [Senal.biquad('banda', 50, FS, { Q: 3 })];

  // Respuesta analítica de un paso bajo de Butterworth de orden n (la que da la fórmula del rincón).
  const gananciaDb = (n, fc, f) => -10 * Math.log10(1 + Math.pow(f / fc, 2 * n));
  function dibujarCorte(ctx, w, h, fc, C) {
    const esc = G.ejes(ctx, {
      caja: { x: 32, y: 10, w: w - 44, h: h - 34 }, x: [100, 10000], y: [-60, 6], logX: true,
      marcasX: [100, 500, 3000, 10000], formatoX: fmtF, marcasY: [-40, -20, 0], formatoY: v => num(v), etiquetaX: 'Hz', C,
    });
    const f = Float64Array.from({ length: 200 }, (_, i) => 100 * Math.pow(100, i / 199));
    ctx.save();
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.55); ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (const y of [-1, -40]) { ctx.moveTo(esc.caja.x, Math.round(esc.y(y)) + 0.5); ctx.lineTo(esc.caja.x + esc.caja.w, Math.round(esc.y(y)) + 0.5); }
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [fr, txt] of [[500, 'voz'], [3000, 'pitido']]) {
      ctx.strokeStyle = G.alfa(C.cuerpo, 0.45);
      ctx.beginPath(); ctx.moveTo(Math.round(esc.x(fr)) + 0.5, esc.caja.y); ctx.lineTo(Math.round(esc.x(fr)) + 0.5, esc.caja.y + esc.caja.h); ctx.stroke();
      G.texto(ctx, esc.x(fr) + 4, esc.caja.y + 12, txt, { color: C.tenue, tam: 10, C });
    }
    ctx.restore();
    G.linea(ctx, esc, f, f.map(v => gananciaDb(4, fc, v)), { color: C.respuesta, ancho: 2.2, C });
    G.puntos(ctx, esc, [500, 3000], [gananciaDb(4, fc, 500), gananciaDb(4, fc, 3000)], { color: C.respuesta, radio: 4, C });
  }

  // Casos diarios de una ola con ritmo semanal (sintéticos), en 70 días: los datos, la ola de verdad y una curva.
  const PATRON = (() => { const p = [1.15, 1.05, 1, 1, 0.95, 0.6, 0.55], m = p.reduce((a, b) => a + b) / 7; return p.map(v => v / m); })();
  const OLA = t => Math.exp(-0.5 * Math.pow((t - 35) / 12, 2)) + 0.05;
  const DIAS = Float64Array.from({ length: 70 }, (_, i) => i);
  const CRUDO = Float64Array.from(DIAS, t => OLA(t) * PATRON[t % 7]);
  function casos(ctx, w, h, C, tipo) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [0, 70], y: [0, 1.5], marcasX: [0, 35, 70], formatoX: v => num(v) + ' d', marcasY: false, rejilla: false, C });
    G.linea(ctx, esc, DIAS, Float64Array.from(DIAS, OLA), { color: C.cuerpo, guiones: [4, 4], alfa: 0.55, halo: false, ancho: 1.3, C });
    G.linea(ctx, esc, DIAS, CRUDO, { color: C.cuerpo, alfa: tipo === 'crudo' ? 0.9 : 0.35, halo: false, ancho: tipo === 'crudo' ? 1.8 : 1.2, C });
    let y = null;
    if (tipo === 'dientes') y = CRUDO;
    else if (tipo === 'liso') { y = Senal.mediaMovil(CRUDO, 7); for (let i = 0; i < 6; i++) y[i] = NaN; }
    else if (tipo === 'plana') { const m = CRUDO.reduce((a, b) => a + b) / CRUDO.length; y = DIAS.map(() => m); }
    if (y) G.linea(ctx, esc, DIAS, y, { color: C.respuesta, ancho: 2.4, C });
  }

  Curso.datos('e06', {
    terminos: [
      { termino: 'Filtro', definicion: 'Un sistema que deja pasar unas frecuencias y frena otras, multiplicando cada una por su propio número.', imagen: 'El ecualizador' },
      { termino: 'Respuesta en frecuencia', definicion: 'La curva que dice por cuánto multiplica un filtro cada frecuencia.', imagen: 'La línea que une los mandos del ecualizador' },
      { termino: 'Ganancia', definicion: 'El número por el que un filtro multiplica una frecuencia; en decibelios, positiva si la sube y negativa si la baja.', imagen: 'La altura de un mando' },
      { termino: 'Paso bajo', definicion: 'Filtro que deja pasar los graves y frena los agudos.', imagen: 'La voz al otro lado de la pared' },
      { termino: 'Paso alto', definicion: 'Filtro que deja pasar los agudos y frena lo grave y lo lento.', imagen: 'Quitar el retumbar o la deriva' },
      { termino: 'Paso banda', definicion: 'Filtro que deja pasar solo una franja de frecuencias.', imagen: 'La voz de teléfono' },
      { termino: 'Banda eliminada (muesca)', definicion: 'Filtro que quita una franja estrecha y deja pasar el resto.', imagen: 'La muesca que quita el zumbido de 50 Hz' },
      { termino: 'Frecuencia de corte', definicion: 'La frecuencia en la que el filtro ya ha bajado la potencia a la mitad, unos 3 dB.', imagen: 'El borde de la rampa' },
      { termino: 'Orden de un filtro', definicion: 'Lo abrupta que es su caída: cada orden añade unos 6 dB por octava.', imagen: 'Rampa suave frente a acantilado' },
      { termino: 'Media móvil', definicion: 'El filtro más sencillo: cada dato se sustituye por la media de los últimos N.', imagen: 'La media de 7 días' },
    ],

    preguntas: [
      // 1 · Los decibelios del ecualizador.
      {
        id: 'e06-ganancia', tipo: 'opcion', nivel: 'basico',
        enunciado: 'En el ecualizador subes **6 dB** la banda de los graves. ¿Qué le pasa a una nota de 80 Hz?',
        opciones: ['Su amplitud se multiplica más o menos por 2', 'Se vuelve 6 Hz más aguda', 'Su volumen se multiplica por 6', 'Desaparece'],
        correcta: 0,
        explicacion: 'Seis decibelios más son el doble de amplitud. Un ecualizador cambia cuánto suena cada frecuencia, no la frecuencia: la nota sigue siendo de 80 Hz, pero más fuerte.',
      },
      // 2 · Visual: la curva de la voz de teléfono.
      {
        id: 'e06-curva-telefono', tipo: 'grafica', nivel: 'basico',
        enunciado: '¿Qué curva es la de la **voz de teléfono** de las de antes? Son curvas de ganancia en decibelios, con las frecuencias en escala logarítmica.',
        opciones: [
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, PASO_BAJO()),
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, PASO_ALTO()),
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, PASO_BANDA()),
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, MUESCA()),
        ],
        correcta: 2,
        explicacion: 'El teléfono clásico deja pasar una franja en medio de la voz, de unos 300 a 3.400 Hz: es un paso banda. Los otros dibujos son un paso bajo (la pared), un paso alto (quitar los graves) y una muesca (quitar el zumbido).',
      },
      // 3 · Varias: quién es un paso bajo.
      {
        id: 'e06-pasos-bajos', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Cuáles de estos se comportan como un **paso bajo**? Marca todos los que lo hagan.',
        opciones: ['La pared entre tu cuarto y el del vecino', 'La media de 7 días de los casos diarios', 'El filtro que quita el zumbido de 50 Hz', 'El canal del teléfono clásico', 'El filtro que quita la deriva lenta de una línea'],
        correctas: [0, 1],
        explicacion: 'La pared y la media dejan pasar lo lento o grave y frenan lo rápido. La muesca es una banda eliminada, el teléfono es un paso banda y quitar la deriva lenta es un paso alto.',
      },
      // 4 · Generada: lo que borra una media móvil.
      {
        id: 'e06-media-borra', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const pares = [];
          for (const fs of [1000, 8000, 16000]) for (const N of [10, 20, 40, 80, 160, 320]) if (fs / N >= 5) pares.push([fs, N]);
          const [fs, N] = azar.elegir(pares);
          return {
            enunciado: 'Una media móvil de **' + N + ' muestras**, con datos tomados a **' + num(fs) + ' Hz**. ¿Cuál es la frecuencia más baja que borra por completo?',
            respuesta: fs / N, toleranciaRel: 0.01, unidad: 'Hz',
            explicacion: 'La media de ' + N + ' muestras anula todo lo que da un número entero de vueltas en esas ' + N + ' muestras, porque suma vueltas completas y eso vale cero. La más lenta que cabe es una vuelta: ' + num(fs) + ' / ' + N + ' = ' + num(fs / N) + ' Hz.',
          };
        },
      },
      // 5 · Generada: la pendiente de un Butterworth.
      {
        id: 'e06-pendiente', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const n = azar.elegir([2, 4, 6, 8]), k = azar.elegir([1, 2]);
          const exacto = 10 * Math.log10(1 + Math.pow(4, n * k));
          return {
            enunciado: 'Un paso bajo de Butterworth de **orden ' + n + '**. Aproximadamente, ¿cuántos decibelios atenúa una nota que está **' + (k === 1 ? 'una octava' : 'dos octavas') + '** por encima de la frecuencia de corte?',
            respuesta: exacto, tolerancia: 1, unidad: 'dB',
            explicacion: 'Lejos del corte, cada orden añade unos 6 dB de caída por octava: ' + n + ' órdenes y ' + k + (k === 1 ? ' octava' : ' octavas') + ' son unos 6 · ' + n + ' · ' + k + ' = ' + (6 * n * k) + ' dB. La fórmula exacta del rincón matemático da ' + num(exacto, 1) + ' dB.',
          };
        },
      },
      // 6 · Error típico: una sola muesca.
      {
        id: 'e06-una-muesca', tipo: 'vf', nivel: 'basico',
        enunciado: 'Una muesca en 50 Hz quita el zumbido de la red sin tocar nada más de la grabación.',
        correcta: false,
        explicacion: 'El zumbido suele traer armónicos, a 100 y 150 Hz, que siguen ahí, y hace falta una muesca en cada uno. Además, la muesca se lleva también lo que la voz o la música tuvieran justo en esa franja, aunque al ser estrecha sea muy poco.',
      },
      // 7 · Aplicada: la media de 7 días.
      {
        id: 'e06-siete-dias', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué las gráficas de casos de 2020 usaban la **media de 7 días**?',
        opciones: [
          'Los datos tenían un ritmo semanal ligado a las pruebas y las notificaciones, y la media de 7 días borra lo que se repite cada semana',
          'El virus se contagiaba en ciclos de 7 días',
          'Así los números salían más bajos',
          'Eliminaba los falsos positivos',
        ],
        correcta: 0,
        explicacion: 'Un estudio de 2020 encontró en los datos de Estados Unidos un periodo de 7,0 días ligado a las pruebas y a las notificaciones. Una media de 7 días contiene cada día de la semana una vez, así que borra ese ritmo.',
      },
      // 8 · Generada: el retraso de la media hacia atrás.
      {
        id: 'e06-retraso', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const N = azar.elegir([3, 5, 7, 9, 15, 21]);
          return {
            enunciado: 'Una media móvil de **' + N + ' días**, calculada hacia atrás (con el día de hoy y los ' + (N - 1) + ' anteriores). ¿Cuántos días va retrasada la curva respecto a la media centrada?',
            respuesta: (N - 1) / 2, tolerancia: 0.01, unidad: 'días',
            explicacion: 'La media hacia atrás describe el centro de su ventana, que queda (N − 1) / 2 días antes de hoy: (' + N + ' − 1) / 2 = ' + num((N - 1) / 2) + ' días. Con 7 días, los tres de retraso de las gráficas de la pandemia.',
          };
        },
      },
      // 9 · Aplicada: la «s» y la «f».
      {
        id: 'e06-s-y-f', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué por teléfono cuesta distinguir la «s» de la «f»?',
        opciones: [
          'Buena parte de su energía está por encima de 3.400 Hz, y el teléfono clásico no la transmite',
          'Son sonidos demasiado graves',
          'El teléfono las comprime en el tiempo',
          'El micrófono las confunde con el zumbido',
        ],
        correcta: 0,
        explicacion: 'El teléfono clásico es un paso banda de unos 300 a 3.400 Hz, y la «s» y la «f» tienen mucha de su energía por encima de esa franja. La voz HD, que llega hasta 7.000 Hz, se la devuelve.',
      },
      // 10 · Error típico: la fundamental ausente.
      {
        id: 'e06-fundamental', tipo: 'vf', nivel: 'medio',
        enunciado: 'Por el teléfono clásico no se oye el tono de una voz grave, porque su frecuencia fundamental queda por debajo de 300 Hz.',
        correcta: false,
        explicacion: 'Se oye. Aunque la fundamental apenas llegue, los armónicos sí pasan, y el cerebro deduce la nota a partir de ellos. Lo que se pierde es otra cosa: la diferencia entre la «s» y la «f».',
      },
      // 11 · Visual con deslizador: el corte de un paso bajo.
      {
        id: 'e06-corte', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Un paso bajo de **orden 4**. Mueve el corte para que la voz de **500 Hz** no baje más de 1 dB y el pitido de **3.000 Hz** baje al menos 40 dB.',
        min: 100, max: 3000, paso: 10, inicial: 2000, unidad: 'Hz', etiqueta: 'Frecuencia de corte',
        alto: 170,
        dibujar: (ctx, w, h, valor, C) => dibujarCorte(ctx, w, h, valor, C),
        correcto: v => gananciaDb(4, v, 500) >= -1 && gananciaDb(4, v, 3000) <= -40,
        solucion: 750,
        explicacion: 'Con orden 4, la caída es de unos 24 dB por octava. El corte tiene que estar lo bastante alto para respetar los 500 Hz y lo bastante bajo para hundir los 3.000: sirve cualquier valor entre unos 600 y 940 Hz.',
      },
      // 12 · Aplicada: quitar una deriva lenta.
      {
        id: 'e06-deriva', tipo: 'opcion', nivel: 'medio',
        enunciado: 'En un electrocardiograma sintético, la línea de base sube y baja muy despacio, una vez cada cuatro segundos. ¿Qué filtro usarías para quitar esa deriva?',
        opciones: ['Un paso alto con un corte muy bajo, por debajo de 1 Hz', 'Un paso bajo en 40 Hz', 'Una muesca en 50 Hz', 'Una media de 7 días'],
        correcta: 0,
        explicacion: 'La deriva es lentísima, así que hay que quitar lo lento y dejar pasar el resto: un paso alto con un corte muy bajo. Las recomendaciones de 2007 para el electrocardiograma hablan de 0,05 Hz para no deformar el trazado.',
      },
      // 13 · Error típico: separar lo que comparte frecuencias.
      {
        id: 'e06-misma-banda', tipo: 'vf', nivel: 'basico',
        enunciado: 'Un filtro puede separar dos sonidos aunque ocupen las mismas frecuencias.',
        correcta: false,
        explicacion: 'Un filtro multiplica cada frecuencia por un número. Si los dos sonidos comparten frecuencias, los sube o los baja a la vez. Separarlos exige otras técnicas, como el aprendizaje automático.',
      },
      // 14 · Visual: qué hace una media de 7 días hacia atrás.
      {
        id: 'e06-media-hacia-atras', tipo: 'grafica', nivel: 'medio', altoFigura: 130,
        figura: (ctx, w, h, C) => casos(ctx, w, h, C, 'crudo'),
        textoFigura: 'Casos diarios sintéticos durante 70 días, con un bajón cada fin de semana, y la ola de fondo, discontinua',
        enunciado: 'Estos son los datos diarios, con un bajón cada fin de semana. ¿Cómo queda la curva naranja tras una **media de 7 días hacia atrás**? La línea discontinua es la ola de verdad.',
        opciones: [
          (ctx, w, h, C) => casos(ctx, w, h, C, 'dientes'),
          (ctx, w, h, C) => casos(ctx, w, h, C, 'liso'),
          (ctx, w, h, C) => casos(ctx, w, h, C, 'plana'),
        ],
        correcta: 1,
        explicacion: 'La media borra el ritmo semanal y conserva la tendencia, pero hacia atrás llega tarde: la curva lisa queda desplazada unos tres días a la derecha. La primera opción no ha filtrado nada y la tercera confunde suavizar con aplanar.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
