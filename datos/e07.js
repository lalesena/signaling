// Lección 7 · La convolución: cada sonido deja su eco. Términos y banco de preguntas.
(function () {
  'use strict';
  const num = (x, d) => Curso.num(x, d);
  const G = () => Graficas;

  // ── Dibujos pequeños ────────────────────────────────────────────────────────────────────────────────────
  // Una entrada de dos palitos (1 en t = 0 y 0,5 en t = 0,3 s) y un sello en forma de campana de 0,2 s: las cuatro
  // salidas posibles de la pregunta de la gráfica.
  const FSD = 200, TMAX = 0.7;
  const campana = t => (t >= 0 && t <= 0.2 ? Math.sin(Math.PI * t / 0.2) : 0);
  function salidaDe(copias) {
    const n = Math.round(TMAX * FSD), y = new Float64Array(n);
    for (const [t0, a] of copias) for (let i = 0; i < n; i++) y[i] += a * campana(i / FSD - t0);
    return y;
  }
  function dibujarSalida(ctx, w, h, C, tipo) {
    const g = G(), esc = g.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 26 }, x: [0, TMAX], y: [-0.1, 1.25], marcasY: false, marcasX: [0, 0.3, 0.6], formatoX: v => num(v, 1) + ' s', rejilla: false, C });
    if (tipo === 'puntos') { g.tallos(ctx, esc, [0, 0.3], [0.45, 0.2], { color: C.cuerpo, radio: 4, C }); return; }
    const copias = { dos: [[0, 1], [0.3, 0.5]], una: [[0, 1]], iguales: [[0, 1], [0.3, 1]] }[tipo];
    const y = salidaDe(copias), t = Float64Array.from(y, (_, i) => i / FSD);
    g.linea(ctx, esc, t, y, { color: C.cuerpo, ancho: 2, C });
  }
  // Un sello de luz de 15 × 15 píxeles, ampliado: disco, raya horizontal, mancha gaussiana o un solo punto.
  function dibujarSello(ctx, w, h, C, forma) {
    const g = G(), N = 15, px = Math.floor(Math.min(w - 8, h - 8) / N), x0 = Math.round((w - px * N) / 2), y0 = Math.round((h - px * N) / 2);
    ctx.save();
    ctx.fillStyle = g.alfa(C.cuerpo, 0.07);
    ctx.fillRect(x0, y0, px * N, px * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const dx = i - 7, dy = j - 7, d = Math.hypot(dx, dy);
      let v = 0;
      if (forma === 'disco') v = d <= 5 ? 1 : 0;
      else if (forma === 'raya') v = dy === 0 && Math.abs(dx) <= 6 ? 1 : 0;
      else if (forma === 'gauss') v = Math.exp(-d * d / (2 * 2.2 * 2.2));
      else v = dx === 0 && dy === 0 ? 1 : 0;
      if (v > 0.02) { ctx.fillStyle = g.alfa(C.respuesta, Math.min(1, v)); ctx.fillRect(x0 + i * px, y0 + j * px, px, px); }
    }
    ctx.restore();
  }
  // La salida de una sílaba con un eco de fuerza 0,5 y retraso «d», frente a la del objetivo (0,25 s).
  function pulso(t) { return t >= 0 && t <= 0.08 ? Math.sin(TAU2 * 50 * t) * Math.sin(Math.PI * t / 0.08) : 0; }
  const TAU2 = 2 * Math.PI;
  function dibujarEco(ctx, w, h, C, d) {
    const g = G(), esc = g.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 28 }, x: [0, 0.6], y: [-1.15, 1.15], marcasY: false, marcasX: [0, 0.25, 0.5], formatoX: v => num(v, 2) + ' s', rejilla: false, C });
    const n = Math.round(0.6 * 2000), t = Float64Array.from({ length: n }, (_, i) => i / 2000);
    const sal = dd => Float64Array.from(t, x => pulso(x) + 0.5 * pulso(x - dd));
    g.linea(ctx, esc, t, sal(0.25), { color: C.cuerpo, guiones: [5, 4], alfa: 0.6, halo: false, ancho: 1.6, C });
    if (d !== undefined) g.linea(ctx, esc, t, sal(d), { color: C.cuerpo, ancho: 2, C });
  }

  Curso.datos('e07', {
    terminos: [
      { termino: 'Impulso', definicion: 'Un sonido o una señal brevísima, un solo palito, que contiene todas las frecuencias a la vez.', imagen: 'La palmada o el globo que revienta' },
      { termino: 'Respuesta al impulso', definicion: 'Lo que devuelve un sistema cuando le entra un impulso; es su huella completa y el sello de la convolución.', imagen: 'La cola de la palmada en el baño' },
      { termino: 'Sistema lineal e invariante', definicion: 'Un sistema en el que el doble de entrada da el doble de salida y en el que retrasar la entrada solo retrasa la salida.', imagen: 'Palmada doble, cola doble; palmada más tarde, la misma cola más tarde' },
      { termino: 'Convolución', definicion: 'La operación que construye la salida sumando una copia de la respuesta al impulso por cada muestra de la entrada, escalada y desplazada.', imagen: 'Los sellos' },
      { termino: 'Reverberación', definicion: 'La cola de sonido que deja una sala al apagarse un sonido, hecha de miles de reflexiones.', imagen: 'La catedral que sigue sonando' },
      { termino: 'Tiempo de reverberación (T60)', definicion: 'Lo que tarda la cola de una sala en bajar 60 dB.', imagen: 'La cola que se apaga en la gráfica en dB' },
      { termino: 'Función de dispersión de punto', definicion: 'El sello de luz que deja un solo punto en una imagen; describe el desenfoque.', imagen: 'El disco de una estrella desenfocada' },
      { termino: 'Deconvolución', definicion: 'Intentar despegar los sellos para recuperar la señal original; funciona solo en parte cuando hay ruido.', imagen: 'Las fotos del Hubble corregidas con cálculos' },
      { termino: 'Teorema de la convolución', definicion: 'La regla según la cual sumar sellos en el tiempo equivale a multiplicar espectros.', imagen: 'El sello visto como ecualizador' },
    ],
    preguntas: [
      { id: 'e07-impulso', tipo: 'opcion', nivel: 'basico', enunciado: '¿Qué es la respuesta al impulso de una sala?',
        opciones: ['Lo que devuelve la sala ante un sonido brevísimo, como una palmada: su huella', 'El volumen máximo que aguanta la sala', 'La frecuencia a la que más resuena', 'El eco que se oye solo al gritar'], correcta: 0,
        explicacion: 'Es la salida ante un impulso. Con ella se sabe cómo responderá la sala a cualquier sonido, porque cada palito de ese sonido estampará su copia.' },
      { id: 'e07-salida', tipo: 'grafica', nivel: 'medio',
        enunciado: 'La entrada son dos palitos: uno de altura 1 en t = 0 y otro de altura 0,5 en t = 0,3 s. El sello es una campana que dura 0,2 s. ¿Cuál es la salida?',
        opciones: [(ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'dos'), (ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'una'), (ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'iguales'), (ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'puntos')],
        correcta: 0,
        explicacion: 'Cada palito estampa el sello escalado por su altura y en su instante: la segunda copia es la mitad de alta y empieza en 0,3 s. Dos copias iguales ignoran la altura del segundo palito, una sola copia ignora el segundo palito, y quedarse con dos puntos confunde la convolución con multiplicar punto a punto.' },
      { id: 'e07-lineal', tipo: 'vf', nivel: 'basico', enunciado: 'Si das una palmada el doble de fuerte, la cola de la sala sale el doble de fuerte.', correcta: true,
        explicacion: 'Es la linealidad: la respuesta a una entrada escalada es la respuesta escalada. En una sala se cumple muy bien con volúmenes normales.' },
      { id: 'e07-longitud', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const L = azar.entero(100, 2000), M = azar.entero(10, 500);
          return { enunciado: 'Convolucionas una señal de ' + num(L) + ' muestras con un sello de ' + num(M) + ' muestras. ¿Cuántas muestras tiene el resultado?', respuesta: L + M - 1, tolerancia: 0, unidad: 'muestras',
            explicacion: 'El último palito de la entrada estampa un sello que sobresale M − 1 muestras: ' + num(L) + ' + ' + num(M) + ' − 1 = ' + num(L + M - 1) + '.' };
        } },
      { id: 'e07-coste', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const T = azar.elegir([0.5, 1, 2, 3]), fs = azar.elegir([16000, 44100, 48000]), r = T * fs * fs / 1e6;
          return { enunciado: 'Un programa de reverberación estampa un sello de ' + num(T) + ' s en una señal de ' + num(fs) + ' muestras por segundo, sumando los sellos uno a uno, sin FFT. ¿Cuántas multiplicaciones por segundo hace? Responde en millones.', respuesta: r, toleranciaRel: 0.02, unidad: 'millones',
            explicacion: 'Cada muestra de salida suma T·fs productos y hay fs muestras por segundo: ' + num(T) + ' · ' + num(fs) + ' · ' + num(fs) + ' ≈ ' + num(r, 0) + ' millones. Por eso se usa la FFT.' };
        } },
      { id: 'e07-medir', tipo: 'varias', nivel: 'medio', enunciado: '¿Con qué se mide la respuesta al impulso de una sala real? Marca todo lo que sirva.',
        opciones: ['Un globo que revienta', 'Una pistola de fogueo', 'Un barrido de tonos por un altavoz, que luego se deshace con un cálculo', 'Un diapasón', 'Una foto de la sala'], correctas: [0, 1, 2],
        explicacion: 'Hace falta algo que contenga todas las frecuencias: un golpe breve y fuerte o un barrido que luego se deshace con un cálculo. Un diapasón da casi una sola frecuencia, y una foto no dice nada del sonido.' },
      { id: 'e07-sofia', tipo: 'opcion', nivel: 'medio', enunciado: '¿Cómo pudo cantar un coro «dentro» de Santa Sofía sin viajar a Estambul?',
        opciones: ['Convolucionando su voz en directo con la respuesta al impulso obtenida de globos reventados en la basílica', 'Grabando en Estambul y reproduciéndolo en California', 'Un técnico imitó el eco a mano con un mezclador', 'Con altavoces enormes dentro de una iglesia de California'], correcta: 0,
        explicacion: 'La respuesta al impulso guarda la huella de la sala, y convolucionar con ella pone cualquier sonido dentro. Los globos se procesaron antes, porque no radian igual en todas direcciones y su espectro tiene huecos.' },
      { id: 'e07-teorema', tipo: 'vf', nivel: 'basico', enunciado: 'Convolucionar dos señales en el tiempo equivale a multiplicar sus espectros.', correcta: true,
        explicacion: 'Es el teorema de la convolución, el puente entre los sellos y el ecualizador: la respuesta en frecuencia de un filtro es el espectro de su sello.' },
      { id: 'e07-media', tipo: 'opcion', nivel: 'basico', enunciado: 'Vista como sello, la media móvil de 5 muestras es…',
        opciones: ['Un rectángulo de 5 muestras de altura 1/5', 'Un palito de altura 5', 'Una campana que decae', 'Dos palitos separados 5 muestras'], correcta: 0,
        explicacion: 'Cada salida es la suma de las 5 últimas entradas, cada una multiplicada por 1/5: un sello plano de 5 muestras.' },
      { id: 'e07-camara', tipo: 'grafica', nivel: 'medio', enunciado: 'Al hacer la foto, la cámara se movió en horizontal mientras estaba abierto el obturador. ¿Qué sello de luz explica la foto borrosa?',
        opciones: [(ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'disco'), (ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'raya'), (ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'gauss'), (ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'punto')],
        altoOpcion: 130, correcta: 1,
        explicacion: 'Durante la exposición, cada punto de luz se arrastró en horizontal y dejó una raya. El disco es el desenfoque de la lente, la mancha suave es la turbulencia del aire y un solo punto sería una foto nítida.' },
      { id: 'e07-eco', tipo: 'deslizador', nivel: 'medio', enunciado: 'Una palmada con un eco de fuerza 0,5 suena como la línea discontinua. Mueve el retraso del eco hasta que la salida la tape.',
        min: 0, max: 0.6, paso: 0.01, inicial: 0.1, unidad: 's', etiqueta: 'Retraso del eco', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => dibujarEco(ctx, w, h, C, valor),
        correcto: v => Math.abs(v - 0.25) <= 0.011, solucion: 0.25,
        explicacion: 'El sello del eco tiene un segundo palito en el retraso, y la copia aparece justo ahí: si el eco de la discontinua llega a 0,25 s, el sello necesita su palito en 0,25 s.' },
      { id: 'e07-hubble', tipo: 'vf', nivel: 'medio', enunciado: 'Si conoces el sello de un desenfoque, siempre puedes recuperar la foto original perfecta.', correcta: false,
        explicacion: 'Donde el sello borra frecuencias, la información se ha perdido, y al intentar recuperarla el ruido se dispara. Con el Hubble solo se corrigieron las imágenes en parte, y la solución definitiva fue instalar espejos correctores.' },
      { id: 'e07-ruido', tipo: 'opcion', nivel: 'reto', enunciado: 'Usas la palmada del baño como sello, pero la grabación tiene mucho ruido de fondo. ¿Qué pasará con la voz convolucionada?',
        opciones: ['Cada muestra de tu voz estampará también el ruido: saldrá una cola de siseo, y hay que recortar el sello donde se hunde en el ruido', 'Nada, el ruido no cuenta', 'Desaparecerá la reverberación', 'La voz saldrá más aguda'], correcta: 0,
        explicacion: 'Todo lo que va en el sello se convoluciona con la voz, también el ruido de fondo que haya al final del recorte.' },
      { id: 'e07-puerta', tipo: 'opcion', nivel: 'reto', enunciado: 'Mientras grabas en una sala, alguien abre una puerta grande. ¿Qué regla de la convolución deja de cumplirse?',
        opciones: ['La sala ya no es invariante en el tiempo: su sello cambia', 'La linealidad', 'La conmutatividad', 'Ninguna'], correcta: 0,
        explicacion: 'Los sellos solo valen si la sala no cambia. Al abrir la puerta cambia la respuesta al impulso, y la misma palmada deja una cola distinta antes y después.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
