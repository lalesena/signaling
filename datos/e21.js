// Lección 21 · La frontera: lo que todavía no sabemos. Términos y banco de preguntas del examen.
// Lo carga e21.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = 2 * Math.PI;
  const num = (x, d) => Curso.num(x, d);

  // ── Dibujos pequeños ──
  // Un mapa de juguete con la línea de un chirp que sube, con el grosor que da cada método.
  function lineaChirp(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 16 };
    ctx.save();
    ctx.fillStyle = C.pantalla; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const X = u => caja.x + u * caja.w, Y = v => caja.y + (1 - v) * caja.h, linea = u => 0.15 + 0.7 * u * u;
    const rgb = (t, a) => { const [r, g, b] = Graficas.magma(t); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
    ctx.lineCap = 'round';
    const N = 60;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, centro = 1 - Math.pow(2 * ((u0 + u1) / 2) - 1, 2);   // 1 en el centro del chirp
      const grosor = tipo === 'esp' ? 0.2 : tipo === 'sst' ? 0.03 + 0.17 * centro : 0.014;
      const px = grosor * caja.h;
      for (const [f, a, t] of [[1, 0.45, 0.45], [0.55, 0.8, 0.7], [0.2, 1, 0.95]]) {
        ctx.strokeStyle = rgb(t, a * (tipo === 'esp' ? 0.9 : 1)); ctx.lineWidth = Math.max(1.2, px * f);
        ctx.beginPath(); ctx.moveTo(X(u0), Y(linea(u0))); ctx.lineTo(X(u1), Y(linea(u1))); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
  }
  // Una «aaa» en un mapa de juguete: según el modo, una pila de líneas, solo la de abajo o solo una alta y brillante.
  function pilaDeLineas(ctx, w, h, C, modo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 16 };
    ctx.save();
    ctx.fillStyle = C.pantalla; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const Y = v => caja.y + (1 - v) * caja.h, rgb = (t, a) => { const [r, g, b] = Graficas.magma(t); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
    ctx.lineCap = 'round';
    const niveles = modo === 'pila' ? [0.14, 0.28, 0.42, 0.56, 0.7, 0.84] : modo === 'abajo' ? [0.14] : [0.56];
    niveles.forEach((v, i) => {
      const brillo = modo === 'pila' ? [0.75, 0.85, 1, 0.8, 0.6, 0.45][i] : 0.95;
      ctx.strokeStyle = rgb(brillo * 0.6, 0.5); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(caja.x, Y(v)); ctx.lineTo(caja.x + caja.w, Y(v)); ctx.stroke();
      ctx.strokeStyle = rgb(brillo, 1); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(caja.x, Y(v)); ctx.lineTo(caja.x + caja.w, Y(v)); ctx.stroke();
    });
    ctx.restore();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
  }
  // Los picos que ve el espectro de dos tonos de 1.000 y 1.000 + delta Hz con una ventana de Hann de 64 ms; el peor caso entre cuatro fases.
  function dosPicos(delta) {
    const fs = 8000, n = 512; let minimo = Infinity, vista = null;
    for (let q = 0; q < 4; q++) {
      const x = new Float64Array(n);
      for (let i = 0; i < n; i++) { const t = i / fs; x[i] = 0.5 * Math.cos(TAU * 1000 * t) + 0.5 * Math.cos(TAU * (1000 + delta) * t + q * Math.PI / 2); }
      const E = Senal.espectro(x, fs, { ventana: 'hann', nfft: 8192, escala: 'amplitud' });
      let m = 0, picos = 0; for (let i = 0; i < E.mag.length; i++) m = Math.max(m, E.mag[i]);
      for (let i = 1; i < E.mag.length - 1; i++) if (E.f[i] > 800 && E.f[i] < 1300 && E.mag[i] > E.mag[i - 1] && E.mag[i] >= E.mag[i + 1] && E.mag[i] > 0.5 * m) picos++;
      if (picos < minimo) { minimo = picos; vista = E; }
    }
    return { picos: minimo, f: vista.f, mag: vista.mag };
  }
  let dMin = null;
  const deltaMinimo = () => { if (dMin == null) { dMin = 100; for (let d = 1; d <= 100; d++) if (dosPicos(d).picos >= 2) { dMin = d; break; } } return dMin; };
  function espectroDosTonos(ctx, w, h, valor, C) {
    const r = dosPicos(valor), f = [], v = [];
    for (let i = 0; i < r.f.length; i++) if (r.f[i] >= 900 && r.f[i] <= 1200) { f.push(r.f[i]); v.push(r.mag[i]); }
    const esc = Graficas.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 30 }, x: [900, 1200], y: [0, 1.1], marcasY: false, marcasX: [900, 1000, 1100, 1200], formatoX: x => num(x), rejilla: false, C });
    Graficas.linea(ctx, esc, f, v, { color: C.espectro, ancho: 2, C });
    Graficas.texto(ctx, w - 12, 18, r.picos >= 2 ? 'dos picos' : 'un pico', { alinear: 'right', color: C.suave, tam: 11, C });
  }
  // Una onda gravitacional sintética: la frecuencia sube cada vez más deprisa hasta el choque.
  function chirpGravitacional(ctx, w, h, C) {
    const x = Senal.ondaGravitacional({ fs: 1000, dur: 1, tc: 0.75, f0: 35 }), fi = x.verdad.fi[0], ts = [], fs = [];
    for (let i = 0; i < 740; i += 5) { ts.push(i / 1000); fs.push(fi[i]); }
    const esc = Graficas.ejes(ctx, { caja: { x: 38, y: 8, w: w - 48, h: h - 30 }, x: [0, 0.75], y: [0, 300], marcasY: [0, 100, 200, 300], marcasX: [0, 0.25, 0.5, 0.75], formatoX: v => num(v, 2) + ' s', formatoY: v => num(v), rejilla: false, C });
    Graficas.linea(ctx, esc, ts, fs, { color: C.senal, ancho: 2.2, C });
    Graficas.texto(ctx, 4, h - 22, 'Hz', { color: C.tenue, tam: 10, C });
    Graficas.texto(ctx, esc.x(0.02), esc.y(250), 'sintético', { color: C.tenue, tam: 10, C });
  }

  Curso.datos('e21', {
    terminos: [
      { termino: 'Segundo orden (sincrosqueezing de segundo orden)', definicion: 'Un sincrosqueezing que estima también cuánto acelera cada componente y corrige con ello su frecuencia.', imagen: 'La noria con un segundo indicador, el de aceleración' },
      { termino: 'Orden superior (sincrosqueezing de orden superior)', definicion: 'La misma idea con más términos, para componentes cuya aceleración también cambia.', imagen: 'La noria de la onda gravitacional, que acelera cada vez más' },
      { termino: 'Tasa de chirp', definicion: 'Cuántos hercios sube o baja la frecuencia en cada segundo.', imagen: 'La aguja de aceleración de la noria' },
      { termino: 'Synchroextracting', definicion: 'Una variante que se queda solo con los coeficientes que ya están en la fila de su frecuencia estimada y descarta el resto.', imagen: 'Las cabinas fuera de su fila, apagadas' },
      { termino: 'Multisynchrosqueezing', definicion: 'Una variante que aplica el empujón del sincrosqueezing varias veces seguidas, según su resumen, sin perder la reconstrucción.', imagen: 'Exprimir el mismo limón dos y tres veces' },
      { termino: 'Forma de onda (wave-shape)', definicion: 'El dibujo de un solo ciclo de una oscilación que no es una sinusoide, como el de una vocal o un latido.', imagen: 'Una noria que no es redonda' },
      { termino: 'Cepstrum', definicion: 'Una medida del ritmo con que se repiten las líneas de un espectro, que delata el periodo de una familia de armónicos.', imagen: 'Los peldaños de una escalera de líneas, contados' },
      { termino: 'De-shape', definicion: 'Un método que, usando el cepstrum, deja en el mapa solo la fundamental de cada familia de armónicos.', imagen: 'Los epiciclos con la rueda grande encendida' },
      { termino: 'Transformada chirplet', definicion: 'Un análisis con ventanas que también aceleran, para afinar las componentes que suben o bajan.', imagen: 'Una plantilla que acelera al lado de la noria' },
      { termino: 'Representación tiempo-frecuencia-aceleración', definicion: 'Un mapa con un tercer eje, la tasa de chirp, en el que las componentes que se cruzan se separan.', imagen: 'Dos líneas que pasan una por encima de la otra en tres dimensiones' },
      { termino: 'ConceFT (promedio de ventanas)', definicion: 'Promediar sincrosqueezings hechos con ventanas distintas para que las líneas se queden y el ruido se diluya.', imagen: 'La noria entre niebla, vista por muchas ventanas' },
      { termino: 'Ceros del espectrograma', definicion: 'Los puntos del mapa donde la energía es exactamente cero; los del ruido blanco se reparten de forma regular.', imagen: 'Los huecos oscuros entre las burbujas' },
      { termino: 'Red neuronal', definicion: 'Un programa que aprende de ejemplos a convertir una entrada, unos milisegundos de audio, en una respuesta, una nota, sin reglas escritas a mano.', imagen: 'Quien ha visto miles de norias y adivina su velocidad de un vistazo' },
      { termino: 'Generalización', definicion: 'Lo bien que funciona un método aprendido con lo que nunca vio durante el entrenamiento.', imagen: 'La flauta rara que la red no reconoce' },
    ],

    preguntas: [
      // 1 · Básica: la suposición de 2011.
      {
        id: 'e21-suposicion', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué supone el sincrosqueezing de 2011 sobre la señal?',
        opciones: ['Que es una suma de pocas norias que cambian despacio y van separadas', 'Que no tiene nada de ruido', 'Que se repite exactamente igual siempre'],
        correcta: 0,
        explicacion: 'Esa suposición es la que le permite colocar cada trocito de energía en su fila. Tolera algo de ruido y no exige que la señal sea periódica; lo que no tolera es que las norias aceleren mucho, se crucen o no se distingan.',
      },
      // 2 · Error típico: romper la incertidumbre.
      {
        id: 'e21-incertidumbre', tipo: 'vf', nivel: 'basico',
        enunciado: 'Los métodos posteriores a 2011 rompen el principio de incertidumbre.',
        correcta: false,
        explicacion: 'Ninguno lo rompe: lo sortean suponiendo algo sobre la señal. Si la señal no cumple la suposición, la imagen nítida puede estar equivocada.',
      },
      // 3 · Opción: el segundo orden.
      {
        id: 'e21-segundo-orden', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Qué añade el sincrosqueezing de segundo orden?',
        opciones: ['Estima también cuánto acelera la frecuencia y corrige con ello', 'Usa una ventana más larga', 'Borra el ruido antes de calcular'],
        correcta: 0,
        explicacion: 'Además de la velocidad de cada noria, mide su aceleración. Para un chirp lineal con envolvente gaussiana acierta exactamente, y cuesta cinco transformadas en vez de una.',
      },
      // 4 · Gráfica generada: qué mapa da cada método.
      {
        id: 'e21-mapas', tipo: 'grafica', nivel: 'medio',
        generar: azar => {
          const clave = azar.elegir(['esp', 'sst', 'sst2']);
          const nombre = { esp: 'el espectrograma', sst: 'el sincrosqueezing de primer orden', sst2: 'el sincrosqueezing de segundo orden' }[clave];
          return {
            enunciado: 'Estos son tres mapas del mismo chirp muy rápido. ¿Cuál es el de ' + nombre + '?',
            opciones: [(ctx, w, h, C) => lineaChirp(ctx, w, h, C, 'esp'), (ctx, w, h, C) => lineaChirp(ctx, w, h, C, 'sst'), (ctx, w, h, C) => lineaChirp(ctx, w, h, C, 'sst2')],
            correcta: { esp: 0, sst: 1, sst2: 2 }[clave],
            explicacion: 'El espectrograma tiene el grosor de la baldosa. El primer orden se ensancha cuando la frecuencia cambia mucho dentro de la ventana, sobre todo en el centro del chirp. El segundo orden corrige la aceleración y deja la línea fina.',
          };
        },
      },
      // 5 · Numérica generada: cuánto cambia la frecuencia en la ventana.
      {
        id: 'e21-ventana', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const c = azar.elegir([500, 1000, 2000, 4000, 8000]), T = azar.elegir([16, 32, 64, 128]);
          return {
            enunciado: 'Una ventana dura ' + T + ' ms y la frecuencia de un chirp sube ' + num(c) + ' Hz cada segundo. ¿Cuántos hercios cambia la frecuencia dentro de la ventana?',
            respuesta: c * T / 1000, toleranciaRel: 0.01, unidad: 'Hz', decimales: 2,
            explicacion: 'Se multiplica la aceleración por la duración: ' + num(c) + ' × ' + num(T / 1000, 3) + ' = ' + num(c * T / 1000, 2) + ' Hz. Si ese cambio es comparable a la anchura de la baldosa, del orden de 1/T, la suposición del primer orden falla y la línea se emborrona. Por eso las ventanas largas sufren más con los chirps rápidos.',
          };
        },
      },
      // 6 · Opción: el synchroextracting.
      {
        id: 'e21-extraer', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Qué hace el synchroextracting?',
        opciones: ['Se queda solo con los coeficientes que ya están en la fila de su frecuencia estimada y descarta el resto', 'Repite el sincrosqueezing varias veces', 'Añade un eje de aceleración'],
        correcta: 0,
        explicacion: 'Por eso sus líneas son finísimas pero tiran energía, y con aceleraciones fuertes pueden desviarse. Repetir el empujón es el multisynchrosqueezing, y el eje de aceleración es la chirplet.',
      },
      // 7 · Aplicada: la sonata K.304.
      {
        id: 'e21-mozart', tipo: 'opcion', nivel: 'medio',
        enunciado: 'En la sonata K.304 de Mozart, el piano toca un si3 (246,9 Hz) mientras el violín toca un si4 (493,88 Hz). ¿Por qué cuesta separarlos en un espectrograma?',
        opciones: ['Porque todos los armónicos del violín caen sobre armónicos del piano', 'Porque el piano no tiene armónicos', 'Porque el violín suena más grave que el piano'],
        correcta: 0,
        explicacion: '493,88 Hz es el doble de 246,9 Hz, así que los múltiplos del violín coinciden con los múltiplos pares del piano. El de-shape enciende solo la fundamental de cada familia y separa las dos notas.',
      },
      // 8 · Gráfica: qué dibuja el de-shape.
      {
        id: 'e21-deshape', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Una voz canta «aaa». ¿Qué dibuja el de-shape?',
        opciones: [(ctx, w, h, C) => pilaDeLineas(ctx, w, h, C, 'pila'), (ctx, w, h, C) => pilaDeLineas(ctx, w, h, C, 'abajo'), (ctx, w, h, C) => pilaDeLineas(ctx, w, h, C, 'arriba')],
        correcta: 1,
        explicacion: 'El de-shape multiplica el mapa por otro que vota por la frecuencia cuya familia de múltiplos está presente, la fundamental. Quedarse con la línea más brillante, que a veces es un armónico, sería volver al error de octava.',
      },
      // 9 · Verdadero o falso: CREPE trozo a trozo.
      {
        id: 'e21-crepe-trozos', tipo: 'vf', nivel: 'medio',
        enunciado: 'CREPE estima la nota de cada trozo de audio por separado, sin mirar los trozos vecinos.',
        correcta: true,
        explicacion: 'Sus autores lo dicen y proponen añadir seguimiento temporal; pYIN, en cambio, usa Viterbi. El camino de la lección 20 sigue siendo útil con una red.',
      },
      // 10 · Aplicada, error típico: la dizi.
      {
        id: 'e21-dizi', tipo: 'opcion', nivel: 'medio',
        enunciado: 'CREPE funcionó peor con la dizi, una flauta china. ¿Por qué?',
        opciones: ['En esa parte de la prueba no había ninguna dizi entre sus ejemplos de entrenamiento', 'La dizi no tiene frecuencia fundamental', 'La red no admite instrumentos de viento'],
        correcta: 0,
        explicacion: 'Todas las pistas de dizi eran del mismo intérprete y cayeron juntas en la parte de la prueba. Una red aprende de lo que ve, y ante un timbre nuevo puede fallar.',
      },
      // 11 · Numérica generada: casillas de una red.
      {
        id: 'e21-casillas', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const c = azar.elegir([10, 20, 25, 50]), n = azar.elegir([4, 5, 6, 7]);
          return {
            enunciado: 'Una red reparte las alturas en casillas de ' + c + ' cents a lo largo de ' + n + ' octavas. ¿Cuántas casillas tiene?',
            respuesta: n * 1200 / c, tolerancia: 0.01, unidad: 'casillas', decimales: 0,
            explicacion: 'Una octava son 1.200 cents, así que ' + n + ' octavas son ' + num(n * 1200) + ' cents, y entre ' + c + ' salen ' + num(n * 1200 / c) + ' casillas. CREPE usa casillas de 20 cents en 6 octavas, de do1 a si7: 360 casillas.',
          };
        },
      },
      // 12 · Deslizador: una noria o dos.
      {
        id: 'e21-una-o-dos', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Separa dos tonos iguales lo justo para que el espectro, con una ventana de Hann de 64 ms, vea dos picos.',
        min: 1, max: 100, paso: 1, inicial: 5, unidad: 'Hz', etiqueta: 'Separación',
        dibujar: (ctx, w, h, valor, C) => espectroDosTonos(ctx, w, h, valor, C),
        correcto: v => dosPicos(v).picos >= 2 && v <= deltaMinimo() + 4, get solucion() { return deltaMinimo(); },
        explicacion: 'Por debajo de esa separación, el espectro ve una sola noria que late. Que sean una o dos es una decisión de modelo, y el sincrosqueezing exige, por hipótesis, una separación mínima entre componentes.',
      },
      // 13 · Numérica generada, aplicada y con figura: las octavas de GW150914.
      {
        id: 'e21-octavas', tipo: 'numero', nivel: 'reto', temporada: false,
        figura: chirpGravitacional, textoFigura: 'Una onda gravitacional sintética: la frecuencia sube cada vez más deprisa',
        generar: azar => {
          const f1 = azar.elegir([30, 35, 40]), f2 = azar.elegir([150, 200, 250]);
          return {
            enunciado: 'La señal de la primera onda gravitacional detectada subió de ' + f1 + ' a ' + f2 + ' Hz. ¿Cuántas octavas subió?',
            respuesta: Math.log2(f2 / f1), tolerancia: 0.02, unidad: 'octavas', decimales: 2,
            explicacion: 'Cada octava duplica la frecuencia, así que el número de octavas es log₂(' + f2 + '/' + f1 + ') = ' + num(Math.log2(f2 / f1), 2) + '. En el artículo de LIGO, la señal sube de 35 a 250 Hz y, en unos 0,2 s, hace unos 8 ciclos entre 35 y 150 Hz: una noria que acelera cada vez más.',
          };
        },
      },
      // 14 · Varias, aplicada: usos publicados.
      {
        id: 'e21-usos', tipo: 'varias', nivel: 'medio',
        enunciado: '¿En cuáles de estos usos hay trabajos publicados con mapas tiempo-frecuencia como los de este curso?',
        opciones: ['Seguir los ritmos del electroencefalograma durante la anestesia', 'Detectar fallos en rodamientos de máquinas', 'Ver la onda gravitacional de dos agujeros negros', 'Saber qué piensa una persona por su voz'],
        correctas: [0, 1, 2],
        explicacion: 'Las tres primeras están publicadas: Purdon y colaboradores (2013) con espectrogramas del electroencefalograma, trabajos de ingeniería industrial con rodamientos y el artículo de LIGO (2016). Todo ello es investigación. Leer los pensamientos por la voz no tiene base.',
      },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
