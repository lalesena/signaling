// Lección 13 · Wavelets: un microscopio para señales: términos nuevos y banco de preguntas del examen.
// Lo carga e13.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // El reparto de baldosas en el plano (tiempo hacia la derecha, frecuencia hacia arriba): tres franjas de baldosas.
  // tipo 'wavelet': estrechas y altas arriba, anchas y bajas abajo; 'fija': todas iguales; 'revés': al contrario.
  function baldosas(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 24 };
    ctx.save();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
    // Alturas relativas de las tres franjas (de abajo arriba) y número de baldosas por franja.
    const alt = tipo === 'wavelet' ? [0.2, 0.3, 0.5] : tipo === 'fija' ? [0.333, 0.333, 0.334] : [0.5, 0.3, 0.2];
    const cuantas = tipo === 'wavelet' ? [2, 4, 8] : tipo === 'fija' ? [4, 4, 4] : [8, 4, 2];
    let y = caja.y + caja.h;
    for (let b = 0; b < 3; b++) {
      const hb = caja.h * alt[b], n = cuantas[b], wb = caja.w / n;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = G.alfa(C.plantilla, (i + b) % 2 ? 0.14 : 0.3);
        ctx.fillRect(caja.x + i * wb + 1, y - hb + 1, wb - 2, hb - 2);
      }
      y -= hb;
    }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'tiempo', { color: C.tenue, tam: 10, alinear: 'right', C });
    G.texto(ctx, caja.x + 2, h - 4, 'frecuencia ↑', { color: C.tenue, tam: 10, C });
  }

  // Un escalograma esquemático de un chasquido: raya fina arriba que se ensancha hacia abajo (cono), una línea horizontal o una nube.
  function escalograma(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 24 }, fondo = G.magma(0);
    const col = (t, a = 1) => { const c = G.magma(t); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    ctx.save();
    ctx.fillStyle = 'rgb(' + fondo.join(',') + ')'; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const cx = caja.x + caja.w / 2;
    if (tipo === 'cono') {
      for (let i = 0; i < 30; i++) {
        const f = 1 - i / 30, yy = caja.y + caja.h * (1 - f) + 0, anch = 1.5 + 22 * (i / 30);
        const g = ctx.createLinearGradient(cx - anch, 0, cx + anch, 0);
        g.addColorStop(0, col(0.3, 0)); g.addColorStop(0.5, col(0.9 - 0.4 * (i / 30), 0.95)); g.addColorStop(1, col(0.3, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - anch, caja.y + caja.h * (i / 30), anch * 2, caja.h / 30 + 1);
      }
    } else if (tipo === 'linea') { ctx.fillStyle = col(0.9); ctx.fillRect(caja.x + 4, caja.y + caja.h * 0.45, caja.w - 8, 3); }
    else { const az = Senal.azar(5); for (let i = 0; i < 220; i++) { ctx.fillStyle = col(0.3 + 0.35 * az.real(), 0.75); ctx.fillRect(caja.x + az.real() * (caja.w - 3), caja.y + az.real() * (caja.h - 3), 3, 3); } }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'tiempo', { color: C.tenue, tam: 10, alinear: 'right', C });
    G.texto(ctx, caja.x + 2, h - 4, 'frecuencia ↑', { color: C.tenue, tam: 10, C });
  }
  const dibB = tipo => (ctx, w, h, C) => baldosas(ctx, w, h, C, tipo);
  const dibE = tipo => (ctx, w, h, C) => escalograma(ctx, w, h, C, tipo);

  // Una nota de 440 Hz con una wavelet de Morlet que busca una frecuencia (para la pregunta del deslizador).
  function senoYWavelet(ctx, w, h, C, f) {
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 34 }, x: [0, 30], y: [-1.2, 1.2], marcasY: false, marcasX: [0, 10, 20, 30], formatoX: v => num(v), etiquetaX: 'ms', rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * 440 * t / 1000), { color: C.senal, ancho: 1.8, n: 700, C });
    const s = 6 / (TAU * f);
    G.curva(ctx, esc, t => Math.exp(-(t - 15) * (t - 15) / 1e6 / (2 * s * s)) * Math.cos(TAU * f * (t - 15) / 1000), { color: C.plantilla, ancho: 2.2, n: 1200, C });
  }

  Curso.datos('e13', {
    terminos: [
      { termino: 'Wavelet', definicion: 'Una onda corta (ondícula), de pocas vueltas y media cero, que se usa como plantilla para medir el parecido con la señal.', imagen: 'Unas pocas vueltas de noria dentro de una campana' },
      { termino: 'Wavelet madre', definicion: 'La forma de la que salen todas las copias del análisis, estiradas o encogidas y desplazadas.', imagen: 'La wavelet púrpura antes de estirarla' },
      { termino: 'Escala', definicion: 'Lo estirada o encogida que está una copia de la wavelet; cuanto mayor, más grave la nota que busca.', imagen: 'El zoom de la wavelet que se estira' },
      { termino: 'Octava', definicion: 'El intervalo entre una nota y la del doble de frecuencia; en el piano, de un La al siguiente La.', imagen: 'Los siete La del teclado, a la misma distancia' },
      { termino: 'Wavelet de Morlet', definicion: 'La más usada con sonidos: una noria dentro de una campana de Gauss, cuyo ajuste w0 dice cuántas vueltas tiene.', imagen: 'El átomo de Gabor que mantiene su forma al estirarse' },
      { termino: 'Resolución relativa constante (Q constante)', definicion: 'Cada frecuencia se mira con una anchura proporcional a ella misma, de modo que todas las octavas tienen la misma nitidez relativa.', imagen: 'Las octavas del piano, todas igual de anchas en el teclado' },
      { termino: 'Transformada wavelet continua (CWT)', definicion: 'El parecido de la señal con todas las copias de una wavelet, a todas las escalas y en todos los instantes.', imagen: 'La wavelet que se estira y se desliza, y el mapa que deja' },
      { termino: 'Escalograma', definicion: 'El mapa de la transformada wavelet: tiempo a lo ancho, frecuencia a lo alto (por octavas) y energía como color.', imagen: 'Baldosas estrechas arriba y anchas abajo' },
      { termino: 'Cono de influencia', definicion: 'La zona cerca de los bordes donde las wavelets largas se salen de la señal y el escalograma no es fiable.', imagen: 'El sombreado que se ensancha hacia los graves en los extremos' },
      { termino: 'Ondas P y S', definicion: 'Las dos ondas que manda un terremoto: la P, más rápida, llega primero; la S llega después y sacude más.', imagen: 'Las dos llegadas en un sismograma' },
    ],
    preguntas: [
      { id: 'e13-copias', tipo: 'opcion', nivel: 'basico', enunciado: '¿Qué cambia entre las copias de una wavelet madre?',
        opciones: ['Su tamaño (la escala) y su posición en el tiempo', 'Su forma', 'Su número de oscilaciones', 'Su media'], correcta: 0,
        explicacion: 'Todas son la misma onda estirada o encogida y desplazada, y por eso Morlet las llamó «de forma constante».' },
      { id: 'e13-reparto', tipo: 'grafica', nivel: 'medio', enunciado: '¿Cómo se reparten las baldosas en una transformada wavelet?',
        opciones: [dibB('wavelet'), dibB('fija'), dibB('reves')], correcta: 0,
        explicacion: 'Arriba la wavelet es corta (sabe bien cuándo) y abajo es larga (sabe bien qué nota). El reparto de baldosas iguales es el del espectrograma, con ventana fija.' },
      { id: 'e13-chasquido', tipo: 'grafica', nivel: 'medio', enunciado: '¿Cuál es el escalograma de un chasquido?',
        opciones: [dibE('linea'), dibE('cono'), dibE('nube')], correcta: 1,
        explicacion: 'El golpe enciende todas las escalas a la vez: las wavelets cortas de arriba lo localizan con precisión y las largas de abajo lo emborronan, y por eso sale un cono.' },
      { id: 'e13-duracion', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.elegir([50, 100, 200, 440, 1000, 4000]);
          return { enunciado: 'La envolvente de una wavelet de Morlet con w0 = 6 que busca ' + num(f) + ' Hz es una campana con una desviación típica de 6 dividido entre 2π por la frecuencia. ¿Cuántos milisegundos mide?',
            respuesta: 6000 / (TAU * f), toleranciaRel: 0.03, unidad: 'ms',
            explicacion: 'Son 6000 entre (2π por ' + num(f) + ') = ' + num(6000 / (TAU * f), 2) + ' ms. La wavelet dura menos cuanto más aguda es la nota que busca, y siempre mete el mismo número de vueltas.' };
        } },
      { id: 'e13-semitono', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const f = azar.elegir([27.5, 55, 110, 440, 1760, 3951]);
          return { enunciado: 'En el piano, subir un semitono multiplica la frecuencia por 1,0595. ¿Cuántos hercios hay entre una nota de ' + num(f, f % 1 ? 1 : 0) + ' Hz y la siguiente?',
            respuesta: f * 0.0595, toleranciaRel: 0.02, unidad: 'Hz',
            explicacion: 'Un semitono es siempre la misma proporción, un 5,95 %, así que en hercios crece con la nota: ' + num(f * 0.0595, 1) + ' Hz aquí, de 1,6 Hz en la nota más grave a unos 235 Hz en la más aguda.' };
        } },
      { id: 'e13-octava', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const X = azar.elegir([8, 10, 16, 20]), k = azar.elegir([1, 2, 3, 4]);
          return { enunciado: 'A 100 Hz, una wavelet dura ' + X + ' ms. ¿Cuánto dura la misma wavelet cuando busca ' + num(100 * Math.pow(2, k)) + ' Hz?',
            respuesta: X / Math.pow(2, k), toleranciaRel: 0.02, unidad: 'ms',
            explicacion: 'Duración y frecuencia van al revés: cada octava hacia arriba, la mitad. ' + num(100 * Math.pow(2, k)) + ' Hz son ' + k + (k === 1 ? ' octava' : ' octavas') + ' por encima, y ' + X + ' entre ' + num(Math.pow(2, k)) + ' son ' + num(X / Math.pow(2, k), 2) + ' ms.' };
        } },
      { id: 'e13-armonicos', tipo: 'opcion', nivel: 'medio', enunciado: 'En el escalograma de una «aaa», arriba los armónicos se funden. ¿Por qué?',
        opciones: ['Porque arriba las baldosas son altas: la wavelet es corta y su nota, borrosa', 'Porque hay ruido', 'Porque la voz no tiene armónicos agudos', 'Porque el micrófono corta los agudos'], correcta: 0,
        explicacion: 'Los armónicos están a la misma distancia en hercios, pero la anchura de la wavelet crece con la frecuencia, y arriba una baldosa abarca varios armónicos.' },
      { id: 'e13-gabor', tipo: 'vf', nivel: 'basico', enunciado: 'Las wavelets rompen el límite de Gabor.', correcta: false,
        explicacion: 'Cada baldosa tiene el área mínima; las wavelets solo cambian su forma según la altura.' },
      { id: 'e13-p', tipo: 'opcion', nivel: 'basico', enunciado: 'En un sismograma, ¿qué onda llega primero?',
        opciones: ['La onda P', 'La onda S', 'Llegan a la vez', 'Depende del día'], correcta: 0,
        explicacion: 'Las P son las más rápidas, y las S van más o menos al 60 % de su velocidad, así que siempre llegan después.' },
      { id: 'e13-distancia', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const dt = azar.elegir([3, 5, 8, 12, 20]);
          return { enunciado: 'Entre la llegada de la onda P y la de la S pasan ' + dt + ' s. Si las P viajan a 6 km/s y las S a 3,5 km/s, ¿a cuántos kilómetros está el terremoto?',
            respuesta: dt * 6 * 3.5 / (6 - 3.5), toleranciaRel: 0.03, unidad: 'km',
            explicacion: 'Las dos salen a la vez y la diferencia de llegada crece con la distancia: Δt por 6 por 3,5 entre (6 − 3,5) son unos 8,4 km por segundo de diferencia, es decir, ' + num(dt * 8.4, 1) + ' km.' };
        } },
      { id: 'e13-petroleo', tipo: 'opcion', nivel: 'basico', enunciado: 'Las wavelets de Morlet nacieron para…',
        opciones: ['…analizar ecos sísmicos en la búsqueda de petróleo', '…comprimir fotos', '…reconocer voces', '…predecir terremotos'], correcta: 0,
        explicacion: 'Morlet trabajaba para Elf Aquitaine y buscaba leer mejor los ecos de las capas de roca. La compresión vino después.' },
      { id: 'e13-ajuste', tipo: 'deslizador', nivel: 'basico', enunciado: 'Ajusta la wavelet hasta que encaje con la onda verde, que es una nota de 440 Hz.',
        min: 100, max: 2000, paso: 1, inicial: 150, unidad: 'Hz', etiqueta: 'Frecuencia que busca',
        dibujar: (ctx, w, h, v, C) => senoYWavelet(ctx, w, h, C, v), correcto: v => v >= 427 && v <= 453, solucion: 440,
        explicacion: 'El parecido es máximo cuando las vueltas de la wavelet coinciden con las de la onda: a 440 Hz.' },
      { id: 'e13-oido', tipo: 'opcion', nivel: 'medio', enunciado: '¿Qué afirmación sobre el oído es correcta?',
        opciones: ['Sus filtros se ensanchan con la frecuencia, de forma parecida a las wavelets por encima de unos 1.000 Hz, pero no hace una transformada wavelet', 'Hace exactamente una transformada wavelet', 'Funciona como un espectrograma de ventana fija', 'No separa frecuencias'], correcta: 0,
        explicacion: 'La anchura de sus filtros es casi proporcional a la frecuencia por encima de 1 kHz, pero el oído es no lineal y su respuesta depende del volumen.' },
      { id: 'e13-piano', tipo: 'varias', nivel: 'medio', enunciado: '¿Qué tienen en común el escalograma y el teclado del piano? Marca todo lo que corresponda.',
        opciones: ['Intervalos iguales ocupan distancias iguales (eje logarítmico)', 'La resolución relativa es la misma en todas las octavas', 'Cada octava tiene el mismo número de hercios', 'Los agudos se ven más finos en frecuencia'], correctas: [0, 1],
        explicacion: 'El piano y la wavelet piensan en proporciones; en hercios, cada octava es el doble de ancha que la anterior, y los agudos se ven más borrosos en frecuencia.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
