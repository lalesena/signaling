// Lección 14 · Desvío: wavelets para comprimir y limpiar: términos nuevos y banco de preguntas del examen.
// Lo carga e14.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una pareja de muestras vecinas, como dos tallos.
  function pareja(ctx, w, h, C, a, b) {
    const esc = G.ejes(ctx, { caja: { x: 30, y: 14, w: w - 44, h: h - 32 }, x: [0, 3], y: [0, 22], marcasX: false, marcasY: [0, 10, 20], rejilla: false, C });
    G.tallos(ctx, esc, [1, 2], [a, b], { color: C.senal, radio: 5, C });
    G.texto(ctx, esc.x(1), esc.y(a) - 10, num(a), { alinear: 'center', color: C.texto, tam: 11, peso: 600, C });
    G.texto(ctx, esc.x(2), esc.y(b) - 10, num(b), { alinear: 'center', color: C.texto, tam: 11, peso: 600, C });
  }

  // Una huella sintética diminuta (48 × 48) con tres aspectos: «bloques» (cada cuadrito de 6 × 6 con su tono medio, como JPEG
  // muy apretado), «borroso» (la pirámide de wavelets, que emborrona) y «ruido» (la imagen entera con granos sueltos).
  function huellaMini(ctx, w, h, C, modo) {
    const n = 48, lado = Math.min(w - 8, h - 8), px = lado / n, x0 = (w - lado) / 2, y0 = (h - lado) / 2;
    let v = new Float64Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dx = (i - 23.5) / 24, dy = (j - 23.5) / 24 * 1.12;
      const r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const fase = r * 24 / 4.3 + 0.28 * Math.sin(2 * a + 3 * r);
      const env = 1 / (1 + Math.exp((r - 0.85) / 0.07));
      v[j * n + i] = 1 - env * (0.5 - 0.5 * Math.cos(TAU * fase));     // 1 = papel, 0 = tinta
    }
    if (modo === 'bloques') {
      const b = new Float64Array(n * n);
      for (let by = 0; by < n; by += 6) for (let bx = 0; bx < n; bx += 6) {
        let s = 0;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) s += v[(by + j) * n + bx + i];
        s /= 36;
        for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) b[(by + j) * n + bx + i] = s;
      }
      v = b;
    } else if (modo === 'borroso') {
      for (let pasada = 0; pasada < 2; pasada++) {
        const b = new Float64Array(n * n);
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          let s = 0, k = 0;
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
            const jj = j + dj, ii = i + di;
            if (jj >= 0 && jj < n && ii >= 0 && ii < n) { s += v[jj * n + ii]; k++; }
          }
          b[j * n + i] = s / k;
        }
        v = b;
      }
    } else if (modo === 'ruido') {
      const az = Senal.azar(31);
      for (let i = 0; i < v.length; i++) v[i] = Math.min(1, Math.max(0, v[i] + 0.22 * az.normal()));
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      ctx.fillStyle = G.mezclar(C.cuerpo, C.pantalla, Math.min(1, Math.max(0, v[j * n + i])));
      ctx.fillRect(x0 + i * px, y0 + j * px, px + 0.5, px + 0.5);
    }
  }

  // Tres señales de 200 muestras para la pregunta de «¿cuál se guarda con pocos coeficientes de Haar?».
  function senalMini(ctx, w, h, C, tipo) {
    const n = 200, ys = new Float64Array(n);
    const az = Senal.azar(8);
    for (let i = 0; i < n; i++) {
      const u = i / n;
      if (tipo === 'escalones') ys[i] = u < 0.18 ? 0.3 : u < 0.39 ? -0.7 : u < 0.55 ? 0.8 : u < 0.77 ? -0.2 : 0.55;
      else if (tipo === 'seno') ys[i] = 0.8 * Math.sin(TAU * 2.2 * u);
      else ys[i] = 0.55 * az.normal();
    }
    const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 20 }, x: [0, 1], y: [-1.2, 1.2], marcasX: false, marcasY: false, rejilla: false, C });
    G.linea(ctx, esc, null, ys, { t0: 0, dt: 1 / n, color: C.senal, ancho: 1.8, C });
  }

  // Los detalles de la pregunta del deslizador: 61 de ruido (desviación 1) y tres grandes de la señal.
  const az14 = Senal.azar(14);
  const ruido = Array.from({ length: 61 }, () => az14.normal());
  const maxRuido = Math.max(...ruido.map(Math.abs));
  const detalles = ruido.slice();
  detalles.splice(9, 0, 7);
  detalles.splice(30, 0, -9);
  detalles.splice(47, 0, 6);
  const solucionUmbral = Math.round((maxRuido + 6) / 2 * 10) / 10;

  Curso.datos('e14', {
    terminos: [
      { termino: 'Transformada wavelet discreta', definicion: 'Descomponer una señal en una versión borrosa y detalles a escalas que se duplican, con tantos números como muestras tenía.', imagen: 'La pirámide' },
      { termino: 'Versión borrosa (aproximación)', definicion: 'La señal vista con menos detalle: en el paso más sencillo, la media de cada pareja de muestras.', imagen: 'El piso de arriba de la pirámide' },
      { termino: 'Detalle (coeficiente de detalle)', definicion: 'Lo que hay que añadir a la versión borrosa para recuperar la señal nítida a esa escala.', imagen: 'Los escalones que le faltan a la borrosa' },
      { termino: 'Multirresolución', definicion: 'Ver la misma señal a varias escalas, cada una con la mitad de detalle que la anterior.', imagen: 'Los pisos de la pirámide, como octavas' },
      { termino: 'Wavelet de Haar', definicion: 'La wavelet más sencilla: un escalón hacia arriba seguido de otro hacia abajo.', imagen: 'La media y la semidiferencia de cada pareja' },
      { termino: 'Wavelet de Daubechies', definicion: 'Una wavelet corta y suave, con la que la pirámide se deshace sin error y que guarda bien las curvas.', imagen: 'Una onda corta que se estira, hecha para curvas' },
      { termino: 'Banco de filtros', definicion: 'Una pareja de filtros, paso bajo y paso alto, que reparte la señal en dos mitades de frecuencia y se queda con una muestra de cada dos en cada mitad.', imagen: 'El ecualizador partido en dos' },
      { termino: 'Compresión con pérdida', definicion: 'Guardar solo lo importante de una señal y aceptar a cambio un error pequeño.', imagen: 'Tirar los detalles pequeños de la pirámide' },
      { termino: 'Umbral', definicion: 'Poner a cero los coeficientes que no llegan a cierta altura.', imagen: 'La línea púrpura sobre los detalles' },
      { termino: 'Umbral duro y umbral suave', definicion: 'El duro borra lo que no llega y deja intacto lo demás; el suave, además, acerca a cero lo que deja.', imagen: 'Cortar frente a cortar y encoger' },
      { termino: 'Umbral universal', definicion: 'Una altura de umbral que depende del nivel del ruido y crece muy despacio con la longitud de la señal.', imagen: 'La línea justo por encima del ruido más alto' },
      { termino: 'Baldosas (artefactos de bloque)', definicion: 'Las juntas que aparecen entre bloques cuando una imagen se comprime mucho a trozos.', imagen: 'La huella cuadriculada' },
      { termino: 'WSQ', definicion: 'La norma del FBI para comprimir huellas dactilares con una pirámide de wavelets.', imagen: 'La huella que se emborrona sin baldosas' },
      { termino: 'JPEG 2000', definicion: 'Una norma de compresión de imágenes basada en una pirámide de wavelets, sin bloques.', imagen: 'La foto que se emborrona al apretar' },
    ],

    preguntas: [
      // 1 · Básica: qué guarda la versión borrosa.
      {
        id: 'e14-borrosa-pareja', tipo: 'opcion', nivel: 'basico',
        enunciado: 'En un paso de la pirámide de Haar, ¿qué guarda la versión borrosa de cada pareja de muestras?',
        opciones: ['Su media', 'Su diferencia', 'La mayor de las dos', 'Solo la primera'],
        correcta: 0,
        explicacion: 'La media resume la pareja en una sola altura. Lo que falta para recuperar las dos muestras es el detalle, la semidiferencia. Quedarse con la mayor o con la primera perdería información sin forma de recuperarla.',
      },
      // 2 · Generada y visual: el detalle de una pareja.
      {
        id: 'e14-detalle', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const a = azar.entero(2, 20);
          let b = azar.entero(2, 20);
          if (b === a) b = a + 3;
          const m = (a + b) / 2, d = (a - b) / 2;
          return {
            figura: (ctx, w, h, C) => pareja(ctx, w, h, C, a, b), altoFigura: 120, textoFigura: 'Una pareja de muestras vecinas, de alturas ' + a + ' y ' + b,
            enunciado: 'Una pareja de muestras vale ' + a + ' y ' + b + '. ¿Cuánto vale su detalle, la semidiferencia: la primera menos la segunda, partido por dos?',
            respuesta: d, tolerancia: 0.01, marcador: 'por ejemplo, 2,5',
            explicacion: 'Con la media m = ' + num(m) + ' y el detalle d = ' + num(d) + ' se recuperan las dos muestras: la primera es m + d = ' + num(m + d) + ' y la segunda, m − d = ' + num(m - d) + '.' + (d < 0 ? ' El detalle sale negativo porque la primera muestra es la menor.' : ''),
          };
        },
      },
      // 3 · Generada: cuántas muestras quedan arriba de la pirámide.
      {
        id: 'e14-pisos', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const k = azar.entero(9, 14), L = azar.entero(2, 6), N = Math.pow(2, k);
          return {
            enunciado: 'Una señal tiene ' + num(N) + ' muestras y subes ' + L + ' pisos de la pirámide. ¿Cuántas muestras tiene la versión borrosa del último piso?',
            respuesta: N / Math.pow(2, L), tolerancia: 0.01,
            explicacion: 'Cada piso parte la versión borrosa por la mitad: ' + num(N) + ' / 2' + ['', '', '²', '³', '⁴', '⁵', '⁶'][L] + ' = ' + num(N / Math.pow(2, L)) + '. El total de números, la borrosa más los detalles de todos los pisos, sigue siendo ' + num(N) + '.',
          };
        },
      },
      // 4 · Error típico: la transformada ya comprime.
      {
        id: 'e14-no-comprime', tipo: 'vf', nivel: 'basico',
        enunciado: 'La transformada wavelet discreta de 1.024 muestras da más de 1.024 números.',
        correcta: false,
        explicacion: 'Da exactamente 1.024, ni uno más ni uno menos, y con ellos se recupera la señal sin error. Lo que comprime no es la transformada, sino lo que se hace después: tirar los detalles pequeños y guardar solo los grandes.',
      },
      // 5 · Error típico: qué hace un compresor wavelet.
      {
        id: 'e14-que-tira', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Qué hace un compresor wavelet con pérdida?',
        opciones: ['Guarda los detalles grandes y tira o redondea los pequeños', 'Tira todas las frecuencias agudas', 'Guarda una de cada dos muestras', 'Guarda solo la versión borrosa del último piso'],
        correcta: 0,
        explicacion: 'Se queda con lo que pesa, sea grave o agudo. Un borde de una imagen es agudo y se conserva, porque su detalle es grande. Tirar lo agudo es lo que hace un paso bajo, y quedarse solo con la versión borrosa del último piso emborronaría todo.',
      },
      // 6 · Visual: las baldosas.
      {
        id: 'e14-baldosas', tipo: 'grafica', nivel: 'medio', altoOpcion: 116,
        enunciado: 'La misma huella sintética, comprimida mucho. ¿Cuál es la versión por bloques, la de JPEG?',
        opciones: [(ctx, w, h, C) => huellaMini(ctx, w, h, C, 'bloques'), (ctx, w, h, C) => huellaMini(ctx, w, h, C, 'borroso'), (ctx, w, h, C) => huellaMini(ctx, w, h, C, 'ruido')],
        correcta: 0,
        explicacion: 'JPEG resume cada bloque por su cuenta y, al apretar, se ven las juntas entre bloques: la cuadrícula de la primera. La segunda es lo que hace una pirámide de wavelets, que emborrona sin juntas, y la tercera sería la imagen entera con ruido, sin comprimir.',
      },
      // 7 · Visual con deslizador: el hueco entre el ruido y los saltos.
      {
        id: 'e14-umbral-hueco', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Estos son los 64 detalles de una señal con ruido: casi todos son ruido y tres son saltos de verdad. Mueve el umbral hasta que borre todo el ruido y conserve los tres saltos.',
        min: 0, max: 10, paso: 0.1, inicial: 1, unidad: '', decimales: 1, etiqueta: 'Altura del umbral', alto: 170,
        dibujar: (ctx, w, h, valor, C) => {
          const esc = G.ejes(ctx, { caja: { x: 30, y: 10, w: w - 42, h: h - 22 }, x: [0, 65], y: [-11, 11], marcasX: false, marcasY: [-10, 0, 10], rejilla: false, C });
          ctx.save();
          ctx.fillStyle = G.alfa(C.plantilla, C.oscuro ? 0.16 : 0.1);
          ctx.fillRect(esc.caja.x, esc.y(valor), esc.caja.w, esc.y(-valor) - esc.y(valor));
          ctx.restore();
          detalles.forEach((d, i) => {
            const queda = Math.abs(d) > valor;
            G.tallos(ctx, esc, [i + 1], [d], { color: queda ? C.senal : G.alfa(C.cuerpo, 0.4), radio: 2.2, ancho: 1.3, C });
          });
          for (const s of [1, -1]) G.linea(ctx, esc, [0, 65], [s * valor, s * valor], { color: C.plantilla, ancho: 1.8, halo: false, guiones: [5, 3], C });
        },
        correcto: v => v > maxRuido + 0.05 && v < 6, solucion: solucionUmbral,
        explicacion: 'El ruido deja muchos detalles pequeños y los saltos, pocos y grandes, y entre unos y otros hay un hueco: el ruido no pasa de ' + num(maxRuido, 1) + ' y el menor de los saltos mide 6. El umbral tiene que quedar dentro de ese hueco, como la línea que ves.',
      },
      // 8 · Generada: el umbral universal.
      {
        id: 'e14-umbral-universal', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const s = azar.entero(1, 10) / 100, N = azar.elegir([1024, 4096, 16384, 65536]);
          const T = s * Math.sqrt(2 * Math.log(N));
          return {
            enunciado: 'El ruido de una grabación tiene una desviación típica de ' + num(s, 2) + ' y la pirámide tiene ' + num(N) + ' coeficientes. ¿Cuánto vale el umbral universal de Donoho y Johnstone, es decir, el nivel del ruido por la raíz de 2 · ln N?',
            respuesta: T, toleranciaRel: 0.02, decimales: 3, marcador: 'por ejemplo, 0,125',
            explicacion: 'Es ' + num(s, 2) + ' × √(2 · ln ' + num(N) + ') = ' + num(s, 2) + ' × ' + num(Math.sqrt(2 * Math.log(N)), 2) + ' = ' + num(T, 3) + ', casi la altura del mayor de ' + num(N) + ' ruidos: por debajo de ella, casi todo es ruido. Crece muy despacio con N.',
          };
        },
      },
      // 9 · Aplicada: por qué el FBI no usó JPEG.
      {
        id: 'e14-fbi-jpeg', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué el FBI no usó JPEG para comprimir sus huellas?',
        opciones: ['Al comprimir mucho, JPEG formaba baldosas de 8 píxeles, casi del tamaño de las crestas, que confundían a los programas que buscan minucias', 'JPEG no admite imágenes en gris', 'JPEG solo comprime 2 a 1', 'JPEG era más lento que las wavelets'],
        correcta: 0,
        explicacion: 'Los bloques de 8 píxeles de JPEG tienen casi el mismo tamaño que la separación entre crestas a 500 puntos por pulgada. Por encima de unos 10 a 1, las baldosas eran inevitables y engañaban a los programas que buscan minucias, los finales y las bifurcaciones de las crestas (Brislawn, 1995).',
      },
      // 10 · Generada y aplicada: el tamaño de una ficha.
      {
        id: 'e14-ficha', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const M = azar.entero(8, 12), R = azar.elegir([10, 15, 20]);
          return {
            enunciado: 'Una ficha de huellas escaneada ocupa ' + M + ' megabytes. Con WSQ a una compresión de ' + R + ' a 1, ¿cuántos megabytes ocupa?',
            respuesta: M / R, toleranciaRel: 0.03, unidad: 'MB', decimales: 2, marcador: 'por ejemplo, 0,7',
            explicacion: 'Comprimir ' + R + ' a 1 es dividir el tamaño entre ' + R + ': ' + M + ' / ' + R + ' = ' + num(M / R, 2) + ' MB. El FBI trabajó con unos 15 a 1, y así unos 10 MB pasaban a ocupar menos de 1 MB.',
          };
        },
      },
      // 11 · Varias: ventajas de la pirámide frente a los bloques.
      {
        id: 'e14-ventajas', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué ventajas tiene una pirámide de wavelets frente a los bloques de JPEG? Marca todas las que lo sean.',
        opciones: ['No aparecen baldosas', 'Al apretar, la imagen se emborrona poco a poco', 'Se puede sacar una versión pequeña de la imagen sin descomprimirlo todo', 'Comprime siempre sin perder nada', 'Todos los navegadores la muestran'],
        correctas: [0, 1, 2],
        explicacion: 'Las tres primeras salen de la pirámide: sin bloques no hay juntas, los detalles finos se pierden poco a poco y los pisos de arriba ya son la imagen en pequeño (el cine digital saca la versión 2K de una copia 4K tirando los detalles de los pisos finos). Comprimir con pérdida pierde información, y casi ningún navegador muestra JPEG 2000.',
      },
      // 12 · Error típico: el zumbido.
      {
        id: 'e14-zumbido', tipo: 'vf', nivel: 'medio',
        enunciado: 'Un umbral wavelet quita bien el zumbido de 50 Hz de una grabación.',
        correcta: false,
        explicacion: 'El zumbido es grande y constante: sus coeficientes son grandes y el umbral los toma por señal, así que se los deja. Para quitarlo está la banda eliminada de la lección 6, que decide por frecuencia, no por tamaño.',
      },
      // 13 · Visual: qué se guarda bien con Haar.
      {
        id: 'e14-haar-escalones', tipo: 'grafica', nivel: 'basico', altoOpcion: 104,
        enunciado: '¿Cuál de estas señales se guarda casi perfecta con muy pocos detalles de la wavelet de Haar?',
        opciones: [(ctx, w, h, C) => senalMini(ctx, w, h, C, 'escalones'), (ctx, w, h, C) => senalMini(ctx, w, h, C, 'seno'), (ctx, w, h, C) => senalMini(ctx, w, h, C, 'ruido')],
        correcta: 0,
        explicacion: 'Los escalones solo dejan detalles grandes en los saltos, y en el resto la media lo explica todo. El seno necesita muchos detalles medianos, y se guarda mejor con una wavelet suave, y el ruido reparte su energía por todos los detalles y no se puede resumir.',
      },
      // 14 · El umbral duro y el suave.
      {
        id: 'e14-duro-suave', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Comparas el umbral duro y el suave. ¿Cuál encoge también los detalles que sobreviven?',
        opciones: ['El suave', 'El duro', 'Los dos', 'Ninguno'],
        correcta: 0,
        explicacion: 'El duro deja intactos los detalles que superan el umbral y borra el resto. El suave, además, les resta el umbral a los que deja. Por eso el suave da un resultado más liso, pero también aplana un poco los saltos.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
