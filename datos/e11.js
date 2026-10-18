// Lección 11 · Fourier no sabe cuándo: el espectrograma: términos nuevos y banco de preguntas del examen.
// Lo carga e11.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Un espectrograma esquemático (tiempo hacia la derecha, frecuencia hacia arriba) con los colores de la escala magma.
  function esquema(ctx, w, h, C, tipo) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 26 }, fondo = G.magma(0);
    const col = (t, a = 1) => { const c = G.magma(t); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
    const X = f => caja.x + caja.w * f, Y = f => caja.y + caja.h * (1 - f);
    ctx.save();
    ctx.fillStyle = 'rgb(' + fondo.join(',') + ')';
    ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const raya = (x0, y0, x1, y1, ancho, t) => { ctx.strokeStyle = col(t); ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X(x0), Y(y0)); ctx.lineTo(X(x1), Y(y1)); ctx.stroke(); };
    if (tipo === 'diagonalSube') raya(0.1, 0.15, 0.9, 0.85, 3, 0.85);
    else if (tipo === 'diagonalBaja') raya(0.1, 0.85, 0.9, 0.15, 3, 0.85);
    else if (tipo === 'rayas') for (const p of [0.2, 0.5, 0.8]) raya(p, 0.02, p, 0.98, 3, 0.88);
    else if (tipo === 'pila') for (let i = 0; i < 6; i++) raya(0.1, 0.12 + i * 0.14, 0.9, 0.12 + i * 0.14, 2.4, 0.9 - i * 0.07);
    else if (tipo === 'nube') { const az = Senal.azar(4); for (let i = 0; i < 160; i++) { ctx.fillStyle = col(0.35 + 0.4 * az.real(), 0.8); ctx.fillRect(X(0.12 + 0.76 * az.real()), Y(0.55 + 0.4 * az.real()), 3, 3); } }
    else if (tipo === 'linea') raya(0.1, 0.5, 0.9, 0.5, 3, 0.88);
    else if (tipo === 'trinoBaja') for (let i = 0; i < 7; i++) raya(0.1 + i * 0.12, 0.8, 0.17 + i * 0.12, 0.35, 2.4, 0.85);
    else if (tipo === 'zumbido') for (const f of [0.22, 0.44, 0.66]) raya(0.03, f, 0.97, f, 1.2, 0.8);
    else if (tipo === 'zumbidoYvoz') { for (const f of [0.22, 0.44, 0.66]) raya(0.03, f, 0.97, f, 1.2, 0.8); raya(0.25, 0.8, 0.75, 0.8, 4, 0.6); }
    ctx.restore();
    G.texto(ctx, caja.x + caja.w, h - 4, 'tiempo', { color: C.tenue, tam: 10, alinear: 'right', C });
    G.texto(ctx, caja.x + 2, h - 4, 'frecuencia ↑', { color: C.tenue, tam: 10, C });
  }
  const dib = tipo => (ctx, w, h, C) => esquema(ctx, w, h, C, tipo);

  // Espectro, en ámbar, del trozo que cubre una ventana de Hann de 64 ms (para la pregunta del deslizador).
  function espectroTrozo(x, fs, c, ancho) {
    const n = Math.round(ancho * fs), i0 = Math.round(c * fs) - n / 2, y = new Float64Array(n), w = Senal.ventana('hann', n);
    for (let i = 0; i < n; i++) y[i] = (x[i0 + i] || 0) * w[i];
    const nfft = 4096, X = Senal.fftReal(y, nfft), df = fs / nfft, K = Math.ceil(1000 / df), f = [], m = [];
    for (let k = 0; k <= K; k++) { f.push(k * df); m.push(Math.hypot(X.re[k], X.im[k])); }
    return { f, m };
  }

  Curso.datos('e11', {
    terminos: [
      { termino: 'Señal no estacionaria', definicion: 'Una señal cuyo contenido de frecuencias cambia con el tiempo, como la voz o la música.', imagen: 'La partitura, donde cada nota tiene su instante' },
      { termino: 'Transformada de Fourier de tiempo corto (STFT)', definicion: 'Fourier aplicado a trozos cortos de la señal, uno tras otro, para saber qué frecuencias hay en cada instante.', imagen: 'La ventana púrpura que se desliza sobre la onda' },
      { termino: 'Espectrograma', definicion: 'El mapa que pone el tiempo a lo ancho, la frecuencia a lo alto y la energía como color.', imagen: 'Columnas de espectro apiladas: la partitura que dibuja el sonido' },
      { termino: 'Salto', definicion: 'La distancia entre el comienzo de una ventana y el de la siguiente; decide cuántas columnas hay por segundo.', imagen: 'Los pasos de la ventana deslizante' },
      { termino: 'Banda ancha y banda estrecha', definicion: 'Espectrogramas hechos con ventana corta (banda ancha: se ven los golpes y los formantes) o con ventana larga (banda estrecha: se ven los armónicos).', imagen: 'Los dos filtros del primer espectrógrafo' },
      { termino: 'Formante', definicion: 'Una zona de frecuencias que la boca y la garganta refuerzan, y que distingue unas vocales de otras.', imagen: 'Las bandas más brillantes dentro de la pila de armónicos' },
      { termino: 'Sonagrama (sonograma)', definicion: 'El nombre que dan al espectrograma los ornitólogos y otros campos; viene del Sona-Graph, una máquina que se vendía en los años cincuenta.', imagen: 'El canto de un pájaro dibujado como trazos' },
      { termino: 'Huella acústica', definicion: 'Un resumen compacto de un sonido que permite reconocerlo aunque esté degradado, como la constelación de picos de Shazam.', imagen: 'El cielo estrellado del espectrograma' },
      { termino: 'Escala logarítmica de frecuencias', definicion: 'Un eje en el que cada octava ocupa lo mismo, como en el teclado de un piano.', imagen: 'La palabra escondida, que solo se lee con este eje' },
    ],
    preguntas: [
      { id: 'e11-reves', tipo: 'opcion', nivel: 'basico', enunciado: 'Le das la vuelta a una grabación. ¿Qué le pasa a su espectro de amplitudes?',
        opciones: ['No cambia', 'Los graves pasan a ser agudos', 'Se desplaza a frecuencias negativas', 'Se vuelve más ruidoso'], correcta: 0,
        explicacion: 'Invertir una señal en el tiempo solo cambia el signo de su fase: el tamaño de cada noria es el mismo. Por eso el espectro de una grabación entera no sabe cuándo.' },
      { id: 'e11-espejo', tipo: 'vf', nivel: 'medio', enunciado: 'El espectrograma de una canción al revés es igual que el de la canción al derecho.', correcta: false,
        explicacion: 'Es el mismo dibujo visto en un espejo, con el tiempo dado la vuelta. Solo el espectro de amplitudes de toda la grabación es idéntico.' },
      { id: 'e11-silbido', tipo: 'grafica', nivel: 'basico', enunciado: '¿Cuál es el espectrograma de un silbido que sube?',
        opciones: [dib('diagonalSube'), dib('rayas'), dib('pila')], correcta: 0,
        explicacion: 'Un tono que cambia dibuja una línea que se curva; las rayas verticales son golpes y la pila de líneas es un sonido con armónicos.' },
      { id: 'e11-palmadas', tipo: 'grafica', nivel: 'basico', enunciado: '¿Cuál es el espectrograma de tres palmadas?',
        opciones: [dib('nube'), dib('linea'), dib('rayas')], correcta: 2,
        explicacion: 'Un golpe dura un instante y suena en muchas frecuencias a la vez, así que dibuja una raya vertical.' },
      { id: 'e11-aaa', tipo: 'varias', nivel: 'medio', enunciado: '¿Qué ves en el espectrograma de una «aaa» sostenida y cantada? Marca todo lo que corresponda.',
        opciones: ['Una pila de líneas horizontales a la misma distancia', 'Bandas más brillantes dentro de la pila, los formantes', 'Una nube de ruido en lo más alto', 'Una sola línea fina'], correctas: [0, 1],
        explicacion: 'Una vocal cantada es una pila de armónicos con unas bandas iluminadas. La nube en lo alto sería una «s», y una sola línea fina, un silbido.' },
      { id: 'e11-trozo', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 22050]), N = azar.elegir([256, 512, 1024, 2048]);
          return { enunciado: 'Analizas a ' + num(fs) + ' Hz con una ventana de ' + num(N) + ' muestras. ¿Cuánto dura cada trozo?', respuesta: 1000 * N / fs, toleranciaRel: 0.01, unidad: 'ms',
            explicacion: 'El trozo dura lo que tardan en pasar N muestras: ' + num(N) + ' entre ' + num(fs) + ' son ' + num(N / fs, 4) + ' s, es decir, ' + num(1000 * N / fs, 1) + ' ms.' };
        } },
      { id: 'e11-filas', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 22050]), N = azar.elegir([256, 512, 1024, 2048]);
          return { enunciado: 'Analizas a ' + num(fs) + ' Hz con una ventana de ' + num(N) + ' muestras, sin rellenar con ceros. ¿Cada cuántos hercios hay una fila del espectrograma?', respuesta: fs / N, toleranciaRel: 0.01, unidad: 'Hz',
            explicacion: 'La separación entre filas es la inversa de la duración del trozo: ' + num(fs) + ' entre ' + num(N) + ' son ' + num(fs / N, 1) + ' Hz. Por eso un trozo corto da filas gruesas.' };
        } },
      { id: 'e11-columnas', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const fs = azar.elegir([8000, 16000]), H = azar.elegir([64, 128, 256, 512]);
          return { enunciado: 'Con un salto de ' + num(H) + ' muestras a ' + num(fs) + ' Hz, ¿cuántas columnas tiene cada segundo del espectrograma?', respuesta: fs / H, toleranciaRel: 0.01, unidad: 'columnas',
            explicacion: 'El salto decide cuántas veces por segundo se mira: ' + num(fs) + ' entre ' + num(H) + ' son ' + num(fs / H) + ' columnas. No decide la nitidez, que depende de la duración de la ventana.' };
        } },
      { id: 'e11-nitidez', tipo: 'opcion', nivel: 'medio', enunciado: 'Quieres ver más nítidas las notas de una melodía en el espectrograma. ¿Qué cambias?',
        opciones: ['Alargo la ventana', 'Reduzco el salto', 'Relleno con ceros', 'Subo la frecuencia de muestreo'], correcta: 0,
        explicacion: 'Solo la duración de la ventana afina la frecuencia. El salto añade columnas, los ceros interpolan la misma curva y más muestras por segundo añaden frecuencias arriba, no detalle.' },
      { id: 'e11-shazam', tipo: 'opcion', nivel: 'medio', enunciado: 'Según el método que publicó Shazam en 2003, ¿qué compara para reconocer una canción?',
        opciones: ['La posición de los picos de su espectrograma y las distancias entre ellos', 'La forma de onda, muestra a muestra', 'El volumen medio de la canción', 'El espectro de toda la canción'], correcta: 0,
        explicacion: 'Los picos sobreviven al ruido, y las parejas de picos, con dos frecuencias y una diferencia de tiempos, forman huellas que se buscan muy deprisa.' },
      { id: 'e11-aphex', tipo: 'vf', nivel: 'basico', enunciado: 'Para ver bien la cara que Aphex Twin escondió en una de sus canciones, el eje de frecuencias del espectrograma tiene que estar en escala logarítmica.', correcta: true,
        explicacion: 'La imagen se dibujó pensando en un eje logarítmico, con las filas repartidas por octavas; en lineal sale deformada.' },
      { id: 'e11-ventana', tipo: 'deslizador', nivel: 'basico', temporada: false,
        generar: azar => {
          const FS = 4000, orden = azar.barajar([300, 500, 800]), idx = orden.indexOf(800);
          const x = new Float64Array(Math.round(1.5 * FS));
          orden.forEach((f, i) => { for (let k = 0; k < 0.5 * FS; k++) x[Math.round(i * 0.5 * FS) + k] = Math.sin(TAU * f * k / FS); });
          return { enunciado: 'Suenan tres notas seguidas, de 0,5 s cada una. Mueve la ventana hasta el instante en que suena la más aguda: el espectro del trozo te dice qué nota hay.',
            min: 0, max: 1.5, paso: 0.01, inicial: 0.1, unidad: 's', etiqueta: 'Centro de la ventana',
            dibujar: (ctx, w, h, v, C) => {
              const alto1 = Math.round(h * 0.38);
              const e1 = G.ejes(ctx, { caja: { x: 10, y: 6, w: w - 20, h: alto1 }, x: [0, 1.5], y: [-1.2, 1.2], marcasY: false, marcasX: [0, 0.5, 1, 1.5], formatoX: t => num(t, 1), rejilla: false, C });
              const mitad = 0.032;
              ctx.save(); ctx.fillStyle = G.alfa(C.plantilla, 0.3); ctx.fillRect(e1.x(v - mitad), e1.caja.y, e1.x(v + mitad) - e1.x(v - mitad), e1.caja.h); ctx.restore();
              G.linea(ctx, e1, null, x, { t0: 0, dt: 1 / FS, color: C.senal, ancho: 1, alfa: 0.7, halo: false, C });
              const y2 = 6 + alto1 + 28, e2 = G.ejes(ctx, { caja: { x: 10, y: y2, w: w - 20, h: h - y2 - 26 }, x: [0, 1000], y: [0, 1.1], marcasY: false, marcasX: [0, 250, 500, 750, 1000], formatoX: t => num(t), etiquetaX: 'Hz', C });
              const r = espectroTrozo(x, FS, v, 0.064);
              let mx = 0; for (const a of r.m) mx = Math.max(mx, a);
              if (mx > 1e-6) G.linea(ctx, e2, r.f, r.m.map(a => a / 20), { color: C.espectro, ancho: 2, C });
            },
            correcto: v => v > idx * 0.5 + 0.05 && v < idx * 0.5 + 0.45, solucion: idx * 0.5 + 0.25,
            explicacion: 'El espectro del trozo dice qué suena ahí: el pico más a la derecha, hacia los 800 Hz, está en la nota más aguda. Esa es la idea de la ventana deslizante.' };
        } },
      { id: 'e11-trino', tipo: 'opcion', nivel: 'medio', figura: dib('trinoBaja'), textoFigura: 'Un trozo de un sonagrama',
        enunciado: 'Un ornitólogo ve en el sonagrama una serie de marcas cortas, en diagonal hacia abajo y muy seguidas. ¿Qué está oyendo?',
        opciones: ['Un trino de notas que bajan', 'Un zumbido grave constante', 'Un golpe seco', 'El viento'], correcta: 0,
        explicacion: 'Cada marca es una nota breve cuyo tono baja, y muchas seguidas forman un trino. Un zumbido constante sería una línea horizontal; un golpe, una raya vertical; el viento, una nube.' },
      { id: 'e11-red', tipo: 'opcion', nivel: 'medio', figura: dib('zumbido'), textoFigura: 'Líneas finas y constantes, también en el silencio',
        enunciado: 'En tu grabación aparecen líneas horizontales finas y constantes en 50, 100 y 150 Hz, también en los silencios. ¿Qué es lo más probable?',
        opciones: ['El zumbido de la red eléctrica', 'Tu nota, con sus armónicos', 'Un formante de tu voz', 'Aliasing'], correcta: 0,
        explicacion: 'Aparecen también en el silencio y están en 50 Hz y sus múltiplos, que es la frecuencia de la red eléctrica en Europa. Tu nota solo está donde hablas.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
