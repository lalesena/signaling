// Lección 12 · El principio de incertidumbre no es solo cuántico: términos nuevos y banco de preguntas del examen.
// Lo carga e12.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una baldosa en su plano (tiempo hacia la derecha, frecuencia hacia arriba): ancho y alto relativos a la caja.
  function baldosa(ctx, w, h, C, ancho, alto, { etiqueta } = {}) {
    const caja = { x: 22, y: 8, w: w - 34, h: h - 28 };
    ctx.save();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(caja.x + 0.5, caja.y); ctx.lineTo(caja.x + 0.5, caja.y + caja.h + 0.5); ctx.lineTo(caja.x + caja.w, caja.y + caja.h + 0.5); ctx.stroke();
    const bw = caja.w * ancho, bh = caja.h * alto, bx = caja.x + (caja.w - bw) / 2, by = caja.y + (caja.h - bh) / 2;
    ctx.fillStyle = G.alfa(C.plantilla, 0.3);
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = C.plantilla; ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
    G.texto(ctx, caja.x + 3, caja.y + 9, 'f', { color: C.tenue, tam: 10, C });
    G.texto(ctx, caja.x + caja.w, caja.y + caja.h + 14, 't', { color: C.tenue, tam: 10, alinear: 'right', C });
    if (etiqueta) G.texto(ctx, caja.x + caja.w - 2, caja.y + 10, etiqueta, { color: C.tenue, tam: 10, alinear: 'right', C });
  }

  // Un espectrograma esquemático de tres palmadas seguidas de una «aaa»: con la ventana corta, con la larga, o con una
  // imposible que lo tuviera todo nítido.
  function esquema(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 26 }, fondo = G.magma(0);
    const col = (t, a = 1) => { const c = G.magma(t); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    const X = f => caja.x + caja.w * f, Y = f => caja.y + caja.h * (1 - f);
    ctx.save();
    ctx.fillStyle = 'rgb(' + fondo.join(',') + ')';
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const palmadas = [0.1, 0.24, 0.38];
    if (tipo === 'corta' || tipo === 'nitido') {
      ctx.fillStyle = col(0.88);
      for (const p of palmadas) ctx.fillRect(X(p) - 1, caja.y, 2.2, caja.h);
    } else {
      for (const p of palmadas) {
        const g = ctx.createLinearGradient(X(p - 0.05), 0, X(p + 0.05), 0);
        g.addColorStop(0, col(0.35, 0)); g.addColorStop(0.35, col(0.62, 0.9)); g.addColorStop(1, col(0.3, 0));
        ctx.fillStyle = g;
        ctx.fillRect(X(p - 0.05), caja.y, X(p + 0.05) - X(p - 0.05), caja.h);
      }
    }
    if (tipo === 'corta') {
      ctx.fillStyle = col(0.42, 0.9);
      ctx.fillRect(X(0.52), Y(0.62), X(0.97) - X(0.52), Y(0.25) - Y(0.62));
      ctx.fillStyle = col(0.72, 0.9);
      for (let x = X(0.52); x < X(0.97); x += 4.5) ctx.fillRect(x, Y(0.62), 1.4, Y(0.25) - Y(0.62));
    } else {
      ctx.fillStyle = col(0.8, 0.95);
      for (let i = 0; i < 7; i++) ctx.fillRect(X(0.52), Y(0.12 + i * 0.1) - 0.8, X(0.97) - X(0.52), 1.8);
    }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'tiempo', { color: C.tenue, tam: 10, alinear: 'right', C });
  }

  // El espectro de dos notas, 440 y 440 + Δf Hz, que suenan T segundos con una ventana de Hann.
  function dosNotas(ctx, w, h, C, df, T) {
    const FA = 2000, n = Math.max(8, Math.round(T * FA)), x = new Float64Array(n);
    for (let i = 0; i < n; i++) { const t = i / FA - T / 2; x[i] = Math.cos(TAU * 440 * t) + Math.cos(TAU * (440 + df) * t + Math.PI / 2); }
    const e = Senal.espectro(x, FA, { ventana: 'hann', nfft: Senal.siguientePotencia2(n * 16) });
    const esc = G.ejes(ctx, { caja: { x: 12, y: 10, w: w - 24, h: h - 38 }, x: [440 - 8, 440 + df + 8], y: [0, 1.6], marcasY: false, marcasX: [440, 440 + df], formatoX: v => num(v) + ' Hz', rejilla: false, C });
    for (const f of [440, 440 + df]) G.linea(ctx, esc, [f, f], [0, 1.6], { color: C.eje, ancho: 1.2, guiones: [4, 4], alfa: 0.8, halo: false, C });
    G.linea(ctx, esc, e.f, e.mag, { color: C.espectro, ancho: 2.2, C });
  }

  Curso.datos('e12', {
    terminos: [
      { termino: 'Principio de incertidumbre (tiempo-frecuencia)', definicion: 'Una señal no puede estar a la vez muy concentrada en el tiempo y muy concentrada en la frecuencia.', imagen: 'La baldosa que se estira o se aplasta, pero no se encoge' },
      { termino: 'Límite de Gabor', definicion: 'El área mínima que puede ocupar una señal en el plano tiempo-frecuencia, medida con desviaciones típicas.', imagen: 'La lectura «1,00 veces el mínimo», que no baja' },
      { termino: 'Baldosa (caja de Heisenberg)', definicion: 'El rectángulo de tiempo y frecuencia que ocupa cada medida de un análisis.', imagen: 'Las casillas del espectrograma, vistas de cerca' },
      { termino: 'Átomo de Gabor (señal elemental)', definicion: 'Una noria recortada por una campana de Gauss: la señal que ocupa la baldosa más pequeña posible.', imagen: 'La onda verde con su campana púrpura' },
      { termino: 'Ventana gaussiana', definicion: 'Una ventana con forma de campana de Gauss, la única cuya baldosa llega al límite de Gabor.', imagen: 'La campana púrpura cuyo espectro es otra campana' },
      { termino: 'Resolución temporal', definicion: 'Lo cerca que pueden estar dos sucesos para que se vean separados.', imagen: 'Dos palmadas que se funden o no' },
      { termino: 'Resolución en frecuencia', definicion: 'Lo cerca que pueden estar dos notas para que se vean separadas.', imagen: 'Los dos picos del afinador' },
      { termino: 'Compromiso tiempo-frecuencia', definicion: 'La elección entre ver bien cuándo o ver bien cuál que obliga a hacer cualquier ventana.', imagen: 'El mismo audio con ventana corta y con ventana larga' },
    ],

    preguntas: [
      // 1 · Básica: qué dice el principio.
      {
        id: 'e12-que-dice', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué dice el principio de incertidumbre de las señales?',
        opciones: ['Que una señal no puede ser a la vez muy breve y tener una frecuencia muy precisa', 'Que medir una señal la perturba', 'Que el ruido impide conocer la frecuencia', 'Que solo vale para partículas'],
        correcta: 0,
        explicacion: 'Es una propiedad de cualquier onda: lo que se concentra en el tiempo se reparte en frecuencia, y al revés. No tiene que ver con que medir perturbe la señal, ni con el ruido, ni con las partículas.',
      },
      // 2 · Numérica generada: el mínimo de la anchura en frecuencia.
      {
        id: 'e12-anchura', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const x = azar.elegir([2, 4, 5, 8, 10, 16, 20, 25, 40]);
          return {
            enunciado: 'Una ventana gaussiana tiene una anchura en el tiempo de **' + x + ' ms**, medida como la desviación típica de su energía. ¿Cuál es la menor anchura posible en frecuencia, medida igual, en hercios?',
            respuesta: 1000 / (4 * Math.PI * x), toleranciaRel: 0.03, unidad: 'Hz', decimales: 1,
            explicacion: 'Con desviaciones típicas, el producto de las dos anchuras no baja de 1/(4π), unas 0,08 vueltas, y la campana de Gauss llega justo a él. Así que la anchura en frecuencia es 1/(4π · ' + num(x / 1000) + ' s) = ' + num(1000 / (4 * Math.PI * x), 1) + ' Hz.',
          };
        },
      },
      // 3 · Numérica generada y aplicada: cuánto hay que escuchar.
      {
        id: 'e12-afinador-ms', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const df = azar.elegir([2, 4, 5, 8, 10, 20, 40]);
          return {
            enunciado: 'Con una ventana de Hann, separar dos notas que se llevan **' + df + ' Hz** exige una ventana de al menos dos veces uno partido por esa diferencia. ¿Cuántos milisegundos hacen falta?',
            respuesta: 2000 / df, toleranciaRel: 0.03, unidad: 'ms', unidades: { ms: 1, s: 1000 },
            explicacion: 'Dos veces uno partido por ' + df + ' Hz son ' + num(2 / df) + ' s, es decir, ' + num(2000 / df) + ' ms. Cuanto más se parecen dos notas, más hay que escuchar para que se desfasen lo bastante y se note la diferencia.',
          };
        },
      },
      // 4 · Verdadero o falso generado: ¿existe una ventana que sirva a las dos cosas?
      {
        id: 'e12-posible', tipo: 'vf', nivel: 'reto',
        generar: azar => {
          let d, df, p;
          do { d = azar.elegir([5, 10, 20, 40]); df = azar.elegir([10, 20, 50, 100, 200]); p = d * df / 1000; } while (p >= 0.8 && p <= 1.25);
          return {
            enunciado: 'Hay dos golpes separados **' + d + ' ms** y dos notas que se llevan **' + df + ' Hz**. Existe una ventana de Hann que separa a la vez los dos golpes y las dos notas.',
            correcta: p > 1,
            explicacion: 'Los golpes piden una ventana de menos de ' + num(2 * d) + ' ms, el doble de su separación, y las notas, de más de ' + num(2000 / df) + ' ms, dos veces uno partido por su diferencia. ' + (p > 1 ? 'Caben las dos exigencias porque el producto de la separación (' + num(d / 1000) + ' s) por la diferencia (' + df + ' Hz) es ' + num(p) + ', mayor que uno.' : 'No caben las dos porque el producto de la separación (' + num(d / 1000) + ' s) por la diferencia (' + df + ' Hz) es ' + num(p) + ', menor que uno.'),
          };
        },
      },
      // 5 · Qué ventana llega al mínimo.
      {
        id: 'e12-mejor-ventana', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Qué forma de ventana alcanza exactamente el área mínima de la baldosa?',
        opciones: ['La campana de Gauss', 'La de Hann', 'La rectangular', 'La de Hamming'],
        correcta: 0,
        explicacion: 'La campana de Gauss tiene por espectro otra campana, sin bordes ni fugas. Hann se queda a un 2,6 % del mínimo, Hamming bastante más lejos por el escalón de sus bordes, y la rectangular, muchísimo más, por sus saltos.',
      },
      // 6 · Visual: la baldosa de una palmada.
      {
        id: 'e12-baldosa-palmada', tipo: 'grafica', nivel: 'basico',
        enunciado: '¿Cuál es la baldosa de una **palmada**?',
        opciones: [
          (ctx, w, h, C) => baldosa(ctx, w, h, C, 0.14, 0.82),
          (ctx, w, h, C) => baldosa(ctx, w, h, C, 0.82, 0.14),
          (ctx, w, h, C) => baldosa(ctx, w, h, C, 0.1, 0.1),
        ],
        correcta: 0,
        explicacion: 'Un golpe está muy localizado en el tiempo y repartido por muchas frecuencias: una baldosa estrecha y alta. La baja y ancha es la de una nota larga, y la diminuta es imposible, porque el área de una baldosa tiene un mínimo.',
      },
      // 7 · Visual: qué se ve con la ventana corta.
      {
        id: 'e12-espectrograma-corta', tipo: 'grafica', nivel: 'medio',
        enunciado: 'El mismo sonido, tres palmadas y una «aaa», se analiza con dos ventanas. ¿Cuál es el espectrograma con la **ventana corta**?',
        opciones: [
          (ctx, w, h, C) => esquema(ctx, w, h, C, 'larga'),
          (ctx, w, h, C) => esquema(ctx, w, h, C, 'corta'),
          (ctx, w, h, C) => esquema(ctx, w, h, C, 'nitido'),
        ],
        correcta: 1,
        explicacion: 'La ventana corta localiza bien los golpes, que salen como rayas verticales finas, y funde los armónicos de la «aaa» en una banda con rayitas verticales. La primera es la de la ventana larga, y la tercera, con todo nítido a la vez, no existe.',
      },
      // 8 · Error típico: más muestras por segundo.
      {
        id: 'e12-mas-muestras', tipo: 'vf', nivel: 'basico',
        enunciado: 'Si grabo con más muestras por segundo, el límite entre tiempo y frecuencia desaparece.',
        correcta: false,
        explicacion: 'El límite depende de lo que dura la ventana, no del número de muestras. Más muestras por segundo añaden frecuencias arriba, pero no afinan las que ya había.',
      },
      // 9 · Error típico: ¿es cuántico?
      {
        id: 'e12-cuantico', tipo: 'vf', nivel: 'medio',
        enunciado: 'El principio de incertidumbre de las señales es un efecto cuántico.',
        correcta: false,
        explicacion: 'Es la misma desigualdad matemática, porque en cuántica la posición y el momento son una pareja de Fourier, como el tiempo y la frecuencia. Pero en un sonido no hay nada cuántico: ni partículas, ni nadie que perturbe al medir.',
      },
      // 10 · Aplicada: el bajo y el violín.
      {
        id: 'e12-bajo-violin', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Para reconocer una nota, un afinador necesita ver varias vueltas de la onda. ¿Por qué tardará más con la cuerda más grave de un bajo, unos 41 Hz, que con la más aguda de un violín, unos 659 Hz?',
        opciones: ['Porque cada vuelta de una onda grave dura más, y hacen falta varias', 'Porque los graves tienen menos energía', 'Porque el micrófono no capta los graves', 'Porque el móvil procesa más despacio los graves'],
        correcta: 0,
        explicacion: 'Una vuelta a 41 Hz dura unos 24 ms, y una a 659 Hz, unos 1,5 ms. Varias vueltas de la nota grave suman décimas de segundo; las de la aguda, unas pocas milésimas. No es un problema de energía, de micrófono ni de velocidad del móvil.',
      },
      // 11 · Visual con deslizador: el tiempo mínimo para separar 440 y 444 Hz.
      {
        id: 'e12-deslizador-afinador', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Con una ventana de Hann, dos notas se ven separadas cuando la ventana dura al menos dos veces uno partido por su diferencia. Pon el tiempo de escucha más corto que separa **440 y 444 Hz** sonando a la vez.',
        min: 0.05, max: 2, paso: 0.05, inicial: 0.2, unidad: 's', etiqueta: 'Tiempo de escucha', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => dosNotas(ctx, w, h, C, 4, valor),
        correcto: v => v >= 0.5 - 1e-9 && v <= 0.6 + 1e-9, solucion: 0.55,
        explicacion: 'Dos veces uno partido por 4 Hz son 0,5 s. Con menos, los dos picos se funden en una sola montaña; a partir de ahí aparece un hueco entre ellos que crece al escuchar más.',
      },
      // 12 · Varias respuestas: lo que dice (y no dice) el límite.
      {
        id: 'e12-varias', tipo: 'varias', nivel: 'reto',
        enunciado: '¿Cuáles de estas afirmaciones sobre el límite son ciertas? Marca todas las que lo sean.',
        opciones: ['El valor exacto del mínimo depende de cómo se mida la anchura', 'Medido con desviaciones típicas, el producto de las dos anchuras no baja de unas 0,08 vueltas', 'Con la ventana rectangular se puede bajar de ese mínimo', 'Solo afecta a los sonidos'],
        correctas: [0, 1],
        explicacion: 'El mínimo cambia según la medida (con la duración efectiva de Gabor vale un medio), pero con desviaciones típicas es 1/(4π), unas 0,08 vueltas. La rectangular es de las ventanas que más se alejan de él, y el límite vale para cualquier señal, sea sonido, radio o luz.',
      },
      // 13 · Aplicada: el ecualizador.
      {
        id: 'e12-ecualizador', tipo: 'opcion', nivel: 'medio',
        enunciado: 'En un ecualizador, una banda muy estrecha, de pocos hercios...',
        opciones: ['...tarda en reaccionar y, cuando el sonido se corta, sigue resonando un poco', '...responde al instante, porque es muy precisa', '...no afecta al tiempo, solo a la frecuencia', '...elimina todas las demás frecuencias'],
        correcta: 0,
        explicacion: 'El tiempo de respuesta y la anchura van juntos: Gabor ya lo resumía diciendo que el tiempo que tarda un resonador en apagarse, multiplicado por su anchura de sintonía, da un número del orden de uno.',
      },
      // 14 · Numérica generada: la mejor ventana para un silbido que sube.
      {
        id: 'e12-silbido', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const c = azar.elegir([500, 1000, 2000, 4000, 8000]);
          return {
            enunciado: 'Un silbido sube **' + num(c) + ' Hz cada segundo**. ¿Cuántos milisegundos debe medir la desviación típica de la ventana gaussiana, medida en su amplitud, que deja su línea lo más fina posible en el espectrograma?',
            respuesta: 1000 / Math.sqrt(TAU * c), toleranciaRel: 0.05, unidad: 'ms', decimales: 1,
            explicacion: 'Si la ventana es larga, la nota cambia dentro de ella y la línea engorda; si es corta, engorda por la incertidumbre. El equilibrio está en uno partido por la raíz de 2π veces la velocidad de subida: 1/√(2π · ' + num(c) + ') = ' + num(1000 / Math.sqrt(TAU * c), 1) + ' ms.',
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
