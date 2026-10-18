// Lección 19 · Sincrosqueezing: exprimir el espectrograma. Términos nuevos y banco de preguntas del examen.
// Lo carga e19.html (y glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Un golpe (una columna) en el plano tiempo-frecuencia, de tres maneras.
  function columna(ctx, w, h, C, estilo) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 26 }, x: [0, 1], y: [0, 1], marcasX: [0, 1], marcasY: false, formatoX: v => num(v) + ' s', rejilla: false, C });
    if (estilo === 'ancha') {
      ctx.fillStyle = Graficas.alfa(C.espectro, 0.55);
      ctx.fillRect(esc.x(0.44), esc.y(0.96), esc.x(0.56) - esc.x(0.44), esc.y(0.04) - esc.y(0.96));
    } else if (estilo === 'fina') Graficas.linea(ctx, esc, [0.5, 0.5], [0.04, 0.96], { color: C.espectro, ancho: 1.6, halo: false, C });
    else Graficas.linea(ctx, esc, [0.05, 0.95], [0.5, 0.5], { color: C.espectro, ancho: 1.8, halo: false, C });
  }
  // Lo mal que se recupera un silbido, a lo largo del tiempo, según dónde se concentre el error.
  function errorEnElTiempo(ctx, w, h, C, estilo) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 26 }, x: [0, 2], y: [0, 1.1], marcasX: [0, 1, 2], marcasY: false, formatoX: v => num(v) + ' s', rejilla: false, C });
    const f = { cruce: t => 0.04 + 0.95 * Math.exp(-Math.pow((t - 1) / 0.12, 2)), plano: () => 0.45, bordes: t => 0.04 + 0.9 * (Math.exp(-Math.pow(t / 0.2, 2)) + Math.exp(-Math.pow((t - 2) / 0.2, 2))) }[estilo];
    Graficas.curva(ctx, esc, t => Math.min(1.05, f(t)), { color: C.ruido, ancho: 2.2, desde: 0, hasta: 2, n: 200, C });
    Graficas.texto(ctx, esc.caja.x + 4, esc.caja.y + 12, 'error', { color: C.tenue, tam: 10, C });
  }
  // Para el deslizador de la ventana: la mancha de una nota frente a su separación, y lo que queda del borrón del chirp.
  function dosMedidores(ctx, w, h, valor, C) {
    const mancha = Math.sqrt(2 * Math.LN2) / (Math.PI * valor / 1000), q = TAU * 1500 * Math.pow(valor / 1000, 2), kappa = q * q / (1 + q * q);
    const x0 = 12, ancho = w - 24;
    const barra = (y, texto, frac, color) => {
      Graficas.texto(ctx, x0, y - 5, texto, { color: C.suave, tam: 10.5, C });
      ctx.fillStyle = Graficas.alfa(C.eje, 0.25); ctx.fillRect(x0, y, ancho, 9);
      ctx.fillStyle = color; ctx.fillRect(x0, y, Math.max(2, ancho * Math.min(1, frac)), 9);
    };
    barra(24, 'mancha de una nota: ' + num(Math.round(mancha)) + ' Hz (las notas distan 80 Hz)', mancha / 160, mancha < 80 ? C.ok : C.mal);
    ctx.strokeStyle = C.texto; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + ancho * 0.5, 20); ctx.lineTo(x0 + ancho * 0.5, 36); ctx.stroke();
    barra(64, 'borrón que queda del chirp (κ): ' + num(Math.round(100 * kappa)) + ' %', kappa, kappa < 0.3 ? C.ok : C.mal);
  }

  Curso.datos('e19', {
    terminos: [
      { termino: 'Sincrosqueezing', definicion: 'Apretar cada columna de un espectrograma moviendo cada trocito, con su fase, a la fila de su frecuencia verdadera.', imagen: 'Exprimir un trapo en vertical' },
      { termino: 'Etiqueta de frecuencia', definicion: 'La velocidad real de la noria de una casilla, leída de cómo gira su fase.', imagen: 'La etiqueta que cuelga de cada trocito de energía' },
      { termino: 'Sincrosqueezing basado en Fourier (FSST)', definicion: 'El sincrosqueezing hecho sobre la transformada de Fourier de tiempo corto.', imagen: 'La ventana deslizante con sus manchas exprimidas' },
      { termino: 'Sincrosqueezing con wavelets', definicion: 'El sincrosqueezing hecho sobre la transformada wavelet continua, que separa bien notas lejanas en proporción.', imagen: 'La wavelet que se estira, con sus manchas exprimidas' },
      { termino: 'Inversión por columnas', definicion: 'Recuperar cada muestra de la señal sumando todas las casillas de su columna.', imagen: 'La columna que, sumada, devuelve un punto de la onda' },
      { termino: 'Franja de reconstrucción', definicion: 'La banda estrecha alrededor de una línea que se suma para recuperar solo esa componente.', imagen: 'Un carril alrededor de la línea' },
      { termino: 'Condición de separación', definicion: 'Las componentes deben distar en frecuencia más que el ancho de la mancha de una nota.', imagen: 'Dos líneas que no caben en la misma baldosa' },
      { termino: 'Modulación lenta', definicion: 'Que el tamaño y la velocidad de cada noria cambien poco mientras dura la ventana.', imagen: 'La noria que acelera tan despacio que en una foto parece ir a velocidad fija' },
      { termino: 'Lo que queda del borrón (κ)', definicion: 'La fracción de la anchura de la mancha que sobrevive al exprimir un chirp; nombre propio de esta lección, no un término estándar.', imagen: 'El trapo que, mojado de más, no se escurre del todo' },
    ],

    preguntas: [
      // 1 · Básica: diferencia con la reasignación.
      {
        id: 'e19-diferencia', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿En qué se diferencia el sincrosqueezing de la reasignación?',
        opciones: ['Solo mueve cada trocito en frecuencia, dentro de su instante, y lo mueve con su fase', 'Mueve en tiempo y en frecuencia, como la reasignación, pero con otra ventana', 'Solo mueve en el tiempo'],
        correcta: 0,
        explicacion: 'Al no cambiar de instante y al mover números complejos enteros, la suma de cada columna se conserva y se puede volver a la señal. La reasignación mueve también en el tiempo y guarda solo energía.',
      },
      // 2 · Error típico: rompe la incertidumbre.
      {
        id: 'e19-incertidumbre', tipo: 'vf', nivel: 'basico',
        enunciado: 'El sincrosqueezing rompe el principio de incertidumbre.',
        correcta: false,
        explicacion: 'Afina porque supone que la señal es una suma de componentes separadas que cambian despacio. Para las señales que no cumplen esa suposición, la mancha no se aprieta.',
      },
      // 3 · Generada: a qué fila va un trocito.
      {
        id: 'e19-fila', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 16000]), nfft = azar.elegir([256, 512, 1024]), fe = azar.real(100, 3000), fila = Math.round(fe * nfft / fs);
          return {
            enunciado: 'La etiqueta de un trocito dice ' + num(fe, 1) + ' Hz. Con ' + num(fs) + ' Hz de muestreo y una transformada de ' + num(nfft) + ' puntos, las filas están separadas ' + num(fs / nfft, 2) + ' Hz y la fila 0 es 0 Hz. ¿A qué fila va?',
            respuesta: fila, tolerancia: 0.5,
            explicacion: 'El sincrosqueezing coloca cada trocito en la fila más cercana a su etiqueta: ' + num(fe, 1) + ' / ' + num(fs / nfft, 2) + ' = ' + num(fe * nfft / fs, 2) + ', que redondeado es la fila ' + num(fila) + '.',
          };
        },
      },
      // 4 · Generada: lo que queda del borrón.
      {
        id: 'e19-kappa', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const al = azar.entero(2, 50) * 100, s = azar.entero(2, 16), q = TAU * al * Math.pow(s / 1000, 2), kappa = 100 * q * q / (1 + q * q);
          return {
            enunciado: 'Un chirp sube ' + num(al) + ' Hz cada segundo y la ventana gaussiana tiene σ = ' + num(s) + ' ms. Con q = 2π · α · σ², ¿qué porcentaje de la anchura del espectrograma sigue ahí tras exprimir? Es 100 · q² / (1 + q²).',
            respuesta: kappa, tolerancia: 2, unidad: '%',
            explicacion: 'Con σ = ' + num(s / 1000, 3) + ' s, q = 2π · ' + num(al) + ' · ' + num(Math.pow(s / 1000, 2), 6) + ' = ' + num(q, 2) + ', y 100 · q² / (1 + q²) = ' + num(kappa, 0) + ' %. Cuanto mayor es q, menos se exprime.',
          };
        },
      },
      // 5 · Generada: separación mínima.
      {
        id: 'e19-separacion', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const s = azar.elegir([4, 6, 8, 10, 12, 16, 20]), sep = Math.sqrt(2 * Math.LN2) / (Math.PI * s / 1000);
          return {
            enunciado: 'Con una ventana gaussiana de σ = ' + num(s) + ' ms, ¿qué separación mínima, en hercios, piden dos notas para que el sincrosqueezing las separe? (Dos veces la anchura a media altura de la mancha de una nota.)',
            respuesta: sep, toleranciaRel: 0.03, unidad: 'Hz',
            explicacion: 'La condición de separación es la raíz de 2 ln 2, dividida por π y por σ en segundos: ' + num(sep, 1) + ' Hz. Cuanto más larga es la ventana, más estrecha es la mancha y más cerca pueden ir las notas.',
          };
        },
      },
      // 6 · Deslizador: la ventana para dos notas y un chirp.
      {
        id: 'e19-ventana', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Elige la ventana que deja finas a la vez **dos notas a 80 Hz de distancia** y **un chirp de 1.500 Hz por segundo**: la mancha de una nota tiene que ser menor que su separación, y al chirp le tiene que quedar poco borrón.',
        min: 2, max: 20, paso: 0.5, inicial: 3, unidad: 'ms', etiqueta: 'Anchura de la ventana (σ)',
        dibujar: (ctx, w, h, valor, C) => dosMedidores(ctx, w, h, valor, C),
        correcto: v => v >= 5 && v <= 8, solucion: 6.5,
        explicacion: 'Las notas piden una ventana larga, para que la mancha mida bastante menos que los 80 Hz, y el chirp pide una corta, para que apenas cambie dentro de ella. Entre 5 y 8 ms se cumplen las dos cosas; con 3 ms las notas se mezclan, y con 12 ms al chirp le queda más de la mitad del borrón.',
      },
      // 7 · Gráfica: la palmada.
      {
        id: 'e19-palmada', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Cómo queda una palmada tras el sincrosqueezing?',
        opciones: [(ctx, w, h, C) => columna(ctx, w, h, C, 'ancha'), (ctx, w, h, C) => columna(ctx, w, h, C, 'fina'), (ctx, w, h, C) => columna(ctx, w, h, C, 'horizontal')],
        correcta: 0,
        explicacion: 'Una columna tan ancha como la ventana, igual que en el espectrograma: para un golpe, la etiqueta de cada casilla es su propia fila, no se mueve nada, y el sincrosqueezing no mueve en el tiempo. La raya fina es lo que da la reasignación.',
      },
      // 8 · Gráfica: dónde está el error en un cruce.
      {
        id: 'e19-cruce', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Dos silbidos se cruzan y reconstruyes uno con su franja. ¿Dónde está el error?',
        opciones: [(ctx, w, h, C) => errorEnElTiempo(ctx, w, h, C, 'cruce'), (ctx, w, h, C) => errorEnElTiempo(ctx, w, h, C, 'plano'), (ctx, w, h, C) => errorEnElTiempo(ctx, w, h, C, 'bordes')],
        correcta: 0,
        explicacion: 'Concentrado alrededor del cruce: fuera de él, cada línea tiene su franja y se recupera casi perfecta, y en el cruce las dos comparten franja y la etiqueta no puede decir de quién es cada trocito.',
      },
      // 9 · Varias: condiciones.
      {
        id: 'e19-condiciones', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué necesita la señal para que el sincrosqueezing funcione bien? Marca todo lo que sea cierto.',
        opciones: ['Componentes separadas en frecuencia más que el ancho de la mancha de una nota', 'Tamaño y frecuencia que cambian despacio comparados con la ventana', 'Que sea periódica', 'Que no tenga nada de ruido', 'Que tenga una sola componente'],
        correctas: [0, 1],
        explicacion: 'Son las dos condiciones de Daubechies, Lu y Wu (2011) y de Auger y colaboradores (2013). No pide que sea periódica, tolera ruido moderado y está pensado precisamente para varias componentes.',
      },
      // 10 · Por qué se puede volver.
      {
        id: 'e19-vuelta', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué se puede volver a la señal tras exprimir?',
        opciones: ['Porque la suma de cada columna devuelve la muestra del centro de la ventana, y exprimir solo reordena dentro de la columna', 'Porque guarda una copia del espectrograma original', 'Porque la ventana es gaussiana'],
        correcta: 0,
        explicacion: 'La fórmula de inversión por columnas sigue valiendo si los coeficientes cambian de fila pero no de instante. Eso es justo lo que la reasignación rompe al mover también en el tiempo.',
      },
      // 11 · Historia.
      {
        id: 'e19-historia', tipo: 'opcion', nivel: 'basico', temporada: false,
        enunciado: '¿De dónde salió la idea del sincrosqueezing?',
        opciones: ['De analizar sonido con ideas tomadas de modelos del nervio auditivo (Daubechies y Maes, 1996)', 'Del radar militar de los años cincuenta', 'De la búsqueda de petróleo con wavelets'],
        correcta: 0,
        explicacion: 'Así lo cuentan Daubechies, Lu y Wu (2011) y Thakur (2014). Las wavelets y el petróleo son la historia de la transformada wavelet, que es otra.',
      },
      // 12 · Aplicada: la fundamental.
      {
        id: 'e19-fundamental', tipo: 'vf', nivel: 'medio',
        enunciado: 'Para oír tu fundamental sola basta con sumar una franja estrecha, de unos 15 Hz a cada lado, alrededor de su línea en el sincrosqueezing, si la línea está bien localizada.',
        correcta: true,
        explicacion: 'Exprimida, la energía de la fundamental cabe en la franja, y se recupera con buena calidad. En el espectrograma sin exprimir, la misma franja se deja fuera media mancha y hace falta una el doble de ancha para llegar a la misma calidad.',
      },
      // 13 · Ruido.
      {
        id: 'e19-ruido', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Grabas con mucho ruido de fondo. ¿Qué hace el sincrosqueezing?',
        opciones: ['También exprime el ruido en motas; si el ruido es comparable a la señal en la franja, la línea se pierde', 'Elimina el ruido, porque solo exprime lo que es señal', 'Convierte el ruido en una línea horizontal en el centro'],
        correcta: 0,
        explicacion: 'El método no sabe qué es ruido: mueve toda la energía según su etiqueta. Está demostrado que es robusto al ruido blanco gaussiano, pero no hace milagros.',
      },
      // 14 · Wavelets o Fourier.
      {
        id: 'e19-versiones', tipo: 'opcion', nivel: 'reto',
        enunciado: 'Quieres separar los armónicos 10 y 11 de una voz grave. ¿Qué versión eliges?',
        opciones: ['La de la transformada de Fourier de tiempo corto: pide la misma separación en hercios en todas las frecuencias', 'La de wavelets, porque ve mejor los agudos', 'Da igual, son iguales'],
        correcta: 0,
        explicacion: 'Los armónicos están a una distancia fija, la frecuencia de la fundamental. Con wavelets, la separación pedida es relativa a la frecuencia, y los armónicos altos quedan relativamente muy juntos.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
