// Lección 8 · El filtro que se vuelve loco: términos nuevos y banco de preguntas del examen.
// Lo carga e08.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Respuesta a una palmada de tres filtros distintos, en tallos (muestras): termina, se apaga o crece.
  function palmada(ctx, w, h, C, tipo) {
    const n = 24, ks = [], vs = [];
    for (let k = 0; k < n; k++) {
      let v;
      if (tipo === 'fir') v = k < 9 ? 0.55 : 0;
      else if (tipo === 'estable') v = Math.pow(0.88, k) * Math.cos(0.7 * k);
      else v = 0.06 * Math.pow(1.17, k) * Math.cos(0.7 * k);
      ks.push(k); vs.push(v);
    }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 24 }, x: [-1, n], y: [-1.1, 1.1], marcasY: false, marcasX: [0, 12, 24], formatoX: v => String(v), rejilla: false, C });
    Graficas.tallos(ctx, esc, ks, vs, { color: C.respuesta, radio: 2.6, C });
  }

  // El plano de los polos: el círculo de radio 1 y dos polos (un par conjugado) a una distancia r del centro.
  function plano(ctx, w, h, C, r) {
    const cx = w / 2, cy = h / 2, R = Math.min(h / 2 - 6, 50), ang = 0.7;
    ctx.save();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - R * 1.35, cy); ctx.lineTo(cx + R * 1.35, cy); ctx.moveTo(cx, cy - R * 1.2); ctx.lineTo(cx, cy + R * 1.2); ctx.stroke();
    ctx.strokeStyle = C.cuerpo; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = C.respuesta; ctx.lineWidth = 2.2;
    for (const s of [1, -1]) {
      const x = cx + R * r * Math.cos(ang), y = cy - s * R * r * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(x - 4.5, y - 4.5); ctx.lineTo(x + 4.5, y + 4.5); ctx.moveTo(x + 4.5, y - 4.5); ctx.lineTo(x - 4.5, y + 4.5); ctx.stroke();
    }
    ctx.restore();
  }

  // Los ecos de un eco que se alimenta: el primero vale 1 y cada uno, g veces el anterior.
  function ecos(ctx, w, h, C, g) {
    const ks = [], vs = [];
    for (let k = 0; k <= 8; k++) { ks.push(k); vs.push(Math.min(1.4, Math.pow(g, k))); }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 26 }, x: [-0.5, 8.5], y: [0, 1.5], marcasY: false, marcasX: [0, 4, 8], formatoX: v => String(v), etiquetaX: 'vueltas', rejilla: false, C });
    Graficas.tallos(ctx, esc, ks, vs, { color: C.respuesta, radio: 3.2, C });
    const ref = Math.round(esc.y(1)) + 0.5;
    ctx.save(); ctx.strokeStyle = Graficas.alfa(C.eje, 0.8); ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(esc.caja.x, ref); ctx.lineTo(esc.caja.x + esc.caja.w, ref); ctx.stroke(); ctx.restore();
  }

  Curso.datos('e08', {
    terminos: [
      { termino: 'Realimentación', definicion: 'Que un sistema use lo que él mismo acaba de producir.', imagen: 'La flecha que vuelve de la salida a la entrada' },
      { termino: 'Acople', definicion: 'El pitido que aparece cuando lo que sale por el altavoz vuelve al micrófono igual de fuerte o más, y a tiempo; también se llama efecto Larsen.', imagen: 'El eco que se alimenta de sí mismo' },
      { termino: 'Ganancia del lazo', definicion: 'La parte del sonido que vuelve después de dar una vuelta completa al círculo.', imagen: 'El pulso que engorda o adelgaza en cada vuelta' },
      { termino: 'Filtro FIR', definicion: 'El que solo usa las entradas recientes; su respuesta a una palmada termina.', imagen: 'Un sello de longitud finita' },
      { termino: 'Filtro IIR', definicion: 'El que también usa sus propias salidas anteriores; su respuesta a una palmada no termina nunca.', imagen: 'El eco que se alimenta' },
      { termino: 'Estabilidad', definicion: 'Que la respuesta a algo breve acabe apagándose en lugar de crecer; en un filtro, que todos sus polos estén dentro del círculo.', imagen: 'Ecos cada vez más pequeños' },
      { termino: 'Polo', definicion: 'Un punto del plano donde el filtro resuena; cuanto más cerca del borde del círculo, más estrecho y alto es el pico.', imagen: 'Un poste que levanta la lona' },
      { termino: 'Cero', definicion: 'Un punto del plano donde el filtro anula una frecuencia.', imagen: 'Una chincheta que hunde la lona' },
      { termino: 'Retraso de grupo', definicion: 'Lo que tarda en salir del filtro la envolvente de un grupo de frecuencias cercanas.', imagen: 'La palmada filtrada que llega tarde' },
      { termino: 'Fase lineal', definicion: 'Cuando todas las frecuencias salen con el mismo retraso y la forma de la onda no se deforma.', imagen: 'El FIR simétrico, con sus dos bordes iguales' },
      { termino: 'Filtro causal', definicion: 'El que solo usa el presente y el pasado; el único posible en directo.', imagen: 'Una ventana que solo mira hacia atrás' },
      { termino: 'Filtrado de fase cero', definicion: 'Filtrar hacia delante y hacia atrás para que los retrasos se cancelen; solo se puede con la grabación entera.', imagen: 'La palmada que vuelve a su sitio' },
      { termino: 'Ganancia máxima estable', definicion: 'El volumen más alto posible antes de que el lazo empiece a pitar.', imagen: 'La línea de 1 que no hay que tocar' },
    ],

    preguntas: [
      // 1 · Básica: la condición del acople.
      {
        id: 'e08-acople', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué dos cosas hacen falta para que pite un micrófono?',
        opciones: [
          'Que en alguna frecuencia el sonido vuelva igual de fuerte o más, y que llegue a tiempo, con la onda en su sitio',
          'Que el volumen pase de 100 dB y que el micrófono sea barato',
          'Que la voz tenga agudos y que la sala sea pequeña',
          'Que el micrófono apunte al público y el altavoz, al escenario',
        ],
        correcta: 0, fijas: true,
        explicacion: 'El lazo se vuelve inestable cuando su ganancia llega a 1 en una frecuencia en la que, además, la fase completa una vuelta entera. El volumen es solo una parte de esa ganancia: también cuentan la distancia, hacia dónde apuntan los equipos y la sala.',
      },
      // 2 · Error típico: un FIR no se dispara.
      {
        id: 'e08-fir-loco', tipo: 'vf', nivel: 'medio',
        enunciado: 'Un filtro FIR puede volverse inestable y crecer sin freno.',
        correcta: false,
        explicacion: 'Sin realimentación, su respuesta a una palmada termina cuando se acaban los pesos, así que nada puede crecer sin freno. Puede amplificar mucho una frecuencia, pero no dispararse. Lo que se vuelve loco es lo que escucha su propia salida.',
      },
      // 3 · Aplicada: el truco de ida y vuelta necesita el futuro.
      {
        id: 'e08-directo', tipo: 'vf', nivel: 'medio',
        enunciado: 'El filtrado hacia delante y hacia atrás se puede usar en unos auriculares con cancelación de ruido.',
        correcta: false,
        explicacion: 'El paso hacia atrás necesita el final de la señal, es decir, el futuro, y en directo todavía no existe. Los auriculares tienen que convivir con el retraso del filtro causal.',
      },
      // 4 · Generada: la semivida de la media que olvida.
      {
        id: 'e08-semivida', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const x = azar.elegir([0.9, 0.95, 0.98, 0.99, 0.995]), fs = azar.elegir([8000, 16000]);
          const ms = 1000 * Math.log(0.5) / (Math.log(x) * fs);
          return {
            enunciado: 'Un filtro que olvida conserva en cada muestra una fracción ' + num(x, 3) + ' de su salida anterior. Con ' + num(fs) + ' muestras por segundo, ¿cuántos milisegundos tarda su respuesta a una palmada en caer a la mitad?',
            respuesta: ms, toleranciaRel: 0.05, unidad: 'ms', decimales: 2, marcador: 'por ejemplo, 4,3',
            explicacion: 'Cada muestra conserva ' + num(x, 3) + ' de lo anterior, así que tras n muestras queda ' + num(x, 3) + ' elevado a n, que vale la mitad cuando n = ln 0,5 / ln ' + num(x, 3) + ' = ' + num(Math.log(0.5) / Math.log(x), 1) + ' muestras. A ' + num(fs) + ' muestras por segundo son ' + num(ms, 2) + ' ms.',
          };
        },
      },
      // 5 · Generada y error típico: cuánto llega tarde un FIR simétrico.
      {
        id: 'e08-retraso-fir', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const n = azar.elegir([101, 201, 401, 641, 801, 1601]), fs = azar.elegir([16000, 48000]);
          const ms = (n - 1) / 2 / fs * 1000;
          return {
            enunciado: 'Un filtro FIR simétrico de ' + num(n) + ' coeficientes trabaja a ' + num(fs) + ' muestras por segundo. ¿Cuántos milisegundos llega tarde?',
            respuesta: ms, toleranciaRel: 0.02, unidad: 'ms', decimales: 2, marcador: 'por ejemplo, 5',
            explicacion: 'Un FIR simétrico retrasa todas las frecuencias lo mismo: la mitad de su longitud, (' + num(n) + ' − 1) / 2 = ' + num((n - 1) / 2) + ' muestras, que a ' + num(fs) + ' muestras por segundo son ' + num(ms, 2) + ' ms. El error típico es dar la longitud entera.',
          };
        },
      },
      // 6 · Generada: los picos del eco que se alimenta.
      {
        id: 'e08-peine', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const d = azar.elegir([80, 160, 320, 400, 800]);
          return {
            enunciado: 'Un eco que se alimenta vuelve cada ' + num(d) + ' muestras, con 16.000 muestras por segundo. ¿Cada cuántos hercios tiene un pico su respuesta en frecuencia?',
            respuesta: 16000 / d, toleranciaRel: 0.01, unidad: 'Hz', decimales: 1, marcador: 'por ejemplo, 100',
            explicacion: 'El eco refuerza las frecuencias a las que cabe un número entero de ondas en su retraso, y eso pasa cada fs / D = 16.000 / ' + num(d) + ' = ' + num(16000 / d) + ' Hz. Es lo mismo que le pasa al lazo de un micrófono con las frecuencias que llegan en fase.',
          };
        },
      },
      // 7 · Generada y aplicada: las frecuencias que llegan en fase con el micro a d metros.
      {
        id: 'e08-distancia', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const d = azar.elegir([0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4]);
          return {
            enunciado: 'El micrófono está a ' + num(d, 2) + ' metros del altavoz y solo cuenta el camino directo del sonido, a 343 metros por segundo. ¿Cada cuántos hercios se repiten las frecuencias que llegan en fase?',
            respuesta: 343 / d, toleranciaRel: 0.03, unidad: 'Hz', decimales: 0, marcador: 'por ejemplo, 100',
            explicacion: 'El sonido tarda ' + num(d / 343 * 1000, 2) + ' ms en recorrer el camino. La fase vuelve a su sitio cada vez que en ese tiempo cabe una onda más, y eso pasa cada 343 / ' + num(d, 2) + ' = ' + num(343 / d, 0) + ' Hz: la separación es la inversa del retraso.',
          };
        },
      },
      // 8 · Gráfica: cómo se ve un filtro que se vuelve loco.
      {
        id: 'e08-grafica-loco', tipo: 'grafica', nivel: 'basico',
        enunciado: '¿Cuál es la respuesta a una palmada de un filtro que **se ha vuelto loco**?',
        opciones: [(ctx, w, h, C) => palmada(ctx, w, h, C, 'fir'), (ctx, w, h, C) => palmada(ctx, w, h, C, 'estable'), (ctx, w, h, C) => palmada(ctx, w, h, C, 'loco')],
        correcta: 2,
        explicacion: 'Inestable quiere decir que la respuesta a algo breve crece en lugar de apagarse. La primera termina porque es un FIR, y la segunda se apaga porque es un IIR estable.',
      },
      // 9 · Gráfica: el plano de los polos.
      {
        id: 'e08-grafica-polos', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Los polos de un filtro aparecen como aspas en el plano. ¿Cuál de estos filtros es **estable**?',
        opciones: [(ctx, w, h, C) => plano(ctx, w, h, C, 0.9), (ctx, w, h, C) => plano(ctx, w, h, C, 1), (ctx, w, h, C) => plano(ctx, w, h, C, 1.1)],
        correcta: 0, altoOpcion: 130,
        explicacion: 'Un filtro es estable si todos sus polos están dentro del círculo. Con los polos dentro, cada vuelta devuelve menos y todo se apaga; en el borde, el tono no se apaga nunca, y fuera, crece sin freno.',
      },
      // 10 · Deslizador: cada vuelta devuelve la mitad.
      {
        id: 'e08-realimentacion', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Ajusta lo que devuelve el eco en cada vuelta para que **cada eco valga la mitad que el anterior**. La línea punteada es el tamaño del primero.',
        min: 0, max: 1.2, paso: 0.01, inicial: 0.9, unidad: '', etiqueta: 'Lo que devuelve cada vuelta',
        dibujar: (ctx, w, h, valor, C) => ecos(ctx, w, h, C, valor),
        correcto: v => Math.abs(v - 0.5) <= 0.02, solucion: 0.5,
        explicacion: 'Con 0,5, cada eco tiene la mitad de altura que el anterior, que son unos 6 dB menos por vuelta. Con 1, todos valen lo mismo, y por encima de 1 crecen.',
      },
      // 11 · Aplicada: cómo no pita el micrófono.
      {
        id: 'e08-domar', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué ayuda a que **no pite** el micrófono? Marca todo lo que ayude.',
        opciones: [
          'Alejar el micrófono del altavoz',
          'Recortar con el ecualizador la frecuencia que pita',
          'Usar un micrófono direccional que no apunte al altavoz',
          'Acercar el micrófono al altavoz para que «lo oiga antes»',
          'Subir los agudos con el ecualizador',
        ],
        correctas: [0, 1, 2],
        explicacion: 'Todo lo que baja la ganancia del lazo en la frecuencia peligrosa aleja el pitido. Acercar el micrófono la sube, y subir los agudos puede crear un pico nuevo donde antes no lo había.',
      },
      // 12 · Aplicada: filtrar un electrocardiograma ya grabado.
      {
        id: 'e08-ecg', tipo: 'opcion', nivel: 'reto',
        enunciado: 'Quieres ver, en un electrocardiograma **ya grabado**, el instante exacto de cada latido, y antes tienes que quitar el ruido. ¿Qué haces?',
        opciones: [
          'Filtrar hacia delante y hacia atrás',
          'Pasarlo por un IIR en directo, porque es más barato',
          'No filtrar nunca, porque todo filtro retrasa',
          'Un IIR de orden muy alto escrito en un solo bloque',
        ],
        correcta: 0,
        explicacion: 'La ida y vuelta deja los latidos en su sitio, porque con la grabación entera sí se puede dar la vuelta a la señal. Un IIR en directo los retrasaría y los deformaría, distinto según la frecuencia. Un FIR simétrico también valdría si se descuenta su retraso.',
      },
      // 13 · Error típico: la magnitud no lo es todo.
      {
        id: 'e08-fase', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Cuál de estas frases es **correcta**?',
        opciones: [
          'Si dos filtros atenúan igual cada frecuencia, dejan la señal igual',
          'Dos filtros con la misma atenuación pueden deformar distinto una palmada, porque no la retrasan igual en cada frecuencia',
          'El retraso solo importa en los filtros caros',
        ],
        correcta: 1,
        explicacion: 'La respuesta en frecuencia tiene magnitud y fase. Un FIR simétrico y un IIR con la misma magnitud retrasan cada frecuencia de forma distinta, y por eso el segundo deforma los bordes de un golpe.',
      },
      // 14 · Los filtros finos llegan tarde.
      {
        id: 'e08-finos', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué un filtro que separa frecuencias muy cercanas llega **más tarde**?',
        opciones: [
          'Porque para distinguir frecuencias cercanas tiene que mirar más tiempo de señal, como el afinador',
          'Porque el ordenador tarda más en hacer las cuentas',
          'Porque amplifica más',
          'Porque los agudos viajan más despacio',
        ],
        correcta: 0, fijas: true,
        explicacion: 'La resolución en frecuencia se paga con duración. En un FIR de ventana, la longitud crece como el inverso de la anchura de la transición y el retraso es la mitad de la longitud: unos 2 ms si la transición mide 1.000 Hz y 200 ms si mide 10 Hz.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
