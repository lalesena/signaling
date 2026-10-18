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
    for (const [fr, txt] of [[500, 'voice'], [3000, 'beep']]) {
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
      { termino: 'Filter', definicion: 'A system that lets some frequencies through and holds others back, multiplying each one by its own number.', imagen: 'The equalizer' },
      { termino: 'Frequency response', definicion: 'The curve that says by how much a filter multiplies each frequency.', imagen: 'The line that joins the knobs of the equalizer' },
      { termino: 'Gain', definicion: 'The number by which a filter multiplies a frequency; in decibels, positive if it raises it and negative if it lowers it.', imagen: 'The height of a knob' },
      { termino: 'Low-pass', definicion: 'A filter that lets the lows through and holds back the highs.', imagen: 'The voice on the other side of the wall' },
      { termino: 'High-pass', definicion: 'A filter that lets the highs through and holds back what is low and slow.', imagen: 'Removing the rumble or the drift' },
      { termino: 'Band-pass', definicion: 'A filter that lets only one band of frequencies through.', imagen: 'The phone voice' },
      { termino: 'Band-stop (notch)', definicion: 'A filter that removes a narrow band and lets the rest through.', imagen: 'The notch that removes the 50 Hz hum' },
      { termino: 'Cutoff frequency', definicion: 'The frequency at which the filter has already lowered the power to half, about 3 dB.', imagen: 'The edge of the ramp' },
      { termino: 'Filter order', definicion: 'How abrupt its drop is: each order adds about 6 dB per octave.', imagen: 'Gentle ramp versus cliff' },
      { termino: 'Moving average', definicion: 'The simplest filter: each data point is replaced by the average of the last N.', imagen: 'The 7-day average' },
    ],

    preguntas: [
      // 1 · Los decibelios del ecualizador.
      {
        id: 'e06-ganancia', tipo: 'opcion', nivel: 'basico',
        enunciado: 'On the equalizer you raise the bass band by **6 dB**. What happens to an 80 Hz note?',
        opciones: ['Its amplitude is multiplied by roughly 2', 'It becomes 6 Hz higher in pitch', 'Its volume is multiplied by 6', 'It disappears'],
        correcta: 0,
        explicacion: 'Six decibels more is double the amplitude. An equalizer changes how loud each frequency is, not the frequency: the note is still 80 Hz, but louder.',
      },
      // 2 · Visual: la curva de la voz de teléfono.
      {
        id: 'e06-curva-telefono', tipo: 'grafica', nivel: 'basico',
        enunciado: 'Which curve is that of the old-style **phone voice**? They are gain curves in decibels, with the frequencies on a logarithmic scale.',
        opciones: [
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, PASO_BAJO()),
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, PASO_ALTO()),
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, PASO_BANDA()),
          (ctx, w, h, C) => curvaFiltro(ctx, w, h, C, MUESCA()),
        ],
        correcta: 2,
        explicacion: 'The classic phone lets through a band in the middle of the voice, from about 300 to 3,400 Hz: it is a band-pass. The other drawings are a low-pass (the wall), a high-pass (removing the bass) and a notch (removing the hum).',
      },
      // 3 · Varias: quién es un paso bajo.
      {
        id: 'e06-pasos-bajos', tipo: 'varias', nivel: 'medio',
        enunciado: 'Which of these behave like a **low-pass**? Mark all that do.',
        opciones: ['The wall between your room and the neighbor’s', 'The 7-day average of daily cases', 'The filter that removes the 50 Hz hum', 'The classic phone channel', 'The filter that removes the slow drift of a line'],
        correctas: [0, 1],
        explicacion: 'The wall and the average let what is slow or low through and hold back what is fast. The notch is a band-stop, the phone is a band-pass and removing slow drift is a high-pass.',
      },
      // 4 · Generada: lo que borra una media móvil.
      {
        id: 'e06-media-borra', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const pares = [];
          for (const fs of [1000, 8000, 16000]) for (const N of [10, 20, 40, 80, 160, 320]) if (fs / N >= 5) pares.push([fs, N]);
          const [fs, N] = azar.elegir(pares);
          return {
            enunciado: 'A moving average of **' + N + ' samples**, with data taken at **' + num(fs) + ' Hz**. What is the lowest frequency it erases completely?',
            respuesta: fs / N, toleranciaRel: 0.01, unidad: 'Hz',
            explicacion: 'The average of ' + N + ' samples cancels everything that makes a whole number of turns in those ' + N + ' samples, because it adds up whole turns and that comes to zero. The slowest one that fits is one turn: ' + num(fs) + ' / ' + N + ' = ' + num(fs / N) + ' Hz.',
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
            enunciado: 'A Butterworth low-pass of **order ' + n + '**. Approximately, how many decibels does it attenuate a note that is **' + (k === 1 ? 'one octave' : 'two octaves') + '** above the cutoff frequency?',
            respuesta: exacto, tolerancia: 1, unidad: 'dB',
            explicacion: 'Far from the cutoff, each order adds about 6 dB of drop per octave: ' + n + ' orders and ' + k + (k === 1 ? ' octave' : ' octaves') + ' make about 6 · ' + n + ' · ' + k + ' = ' + (6 * n * k) + ' dB. The exact formula in the math corner gives ' + num(exacto, 1) + ' dB.',
          };
        },
      },
      // 6 · Error típico: una sola muesca.
      {
        id: 'e06-una-muesca', tipo: 'vf', nivel: 'basico',
        enunciado: 'A notch at 50 Hz removes the power-grid hum without touching anything else in the recording.',
        correcta: false,
        explicacion: 'The hum usually comes with harmonics, at 100 and 150 Hz, which are still there, and you need a notch at each one. Besides, the notch also takes away whatever the voice or the music had right in that band, although since it is narrow it is very little.',
      },
      // 7 · Aplicada: la media de 7 días.
      {
        id: 'e06-siete-dias', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why did the case charts of 2020 use the **7-day average**?',
        opciones: [
          'The data had a weekly rhythm tied to testing and reporting, and the 7-day average erases whatever repeats every week',
          'The virus spread in 7-day cycles',
          'It made the numbers come out lower',
          'It eliminated false positives',
        ],
        correcta: 0,
        explicacion: 'A 2020 study found in the data of the United States a period of 7.0 days tied to testing and reporting. A 7-day average contains each day of the week once, so it erases that rhythm.',
      },
      // 8 · Generada: el retraso de la media hacia atrás.
      {
        id: 'e06-retraso', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const N = azar.elegir([3, 5, 7, 9, 15, 21]);
          return {
            enunciado: 'A moving average of **' + N + ' days**, computed backward (with today and the ' + (N - 1) + ' previous days). How many days late is the curve compared with the centered average?',
            respuesta: (N - 1) / 2, tolerancia: 0.01, unidad: 'days',
            explicacion: 'The backward average describes the center of its window, which is (N − 1) / 2 days before today: (' + N + ' − 1) / 2 = ' + num((N - 1) / 2) + ' days. With 7 days, the three days of delay in the pandemic charts.',
          };
        },
      },
      // 9 · Aplicada: la «s» y la «f».
      {
        id: 'e06-s-y-f', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why is it hard to tell an “s” from an “f” over the phone?',
        opciones: [
          'A good part of their energy is above 3,400 Hz, and the classic phone doesn’t transmit it',
          'They are sounds that are too low',
          'The phone compresses them in time',
          'The microphone confuses them with the hum',
        ],
        correcta: 0,
        explicacion: 'The classic phone is a band-pass from about 300 to 3,400 Hz, and the “s” and the “f” have a lot of their energy above that band. HD voice, which reaches up to 7,000 Hz, gives it back.',
      },
      // 10 · Error típico: la fundamental ausente.
      {
        id: 'e06-fundamental', tipo: 'vf', nivel: 'medio',
        enunciado: 'Over the classic phone you can’t hear the pitch of a low voice, because its fundamental frequency falls below 300 Hz.',
        correcta: false,
        explicacion: 'You can. Even if the fundamental barely gets through, the harmonics do, and the brain works out the note from them. What is lost is something else: the difference between the “s” and the “f.”',
      },
      // 11 · Visual con deslizador: el corte de un paso bajo.
      {
        id: 'e06-corte', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'A low-pass of **order 4**. Move the cutoff so that the **500 Hz** voice doesn’t drop more than 1 dB and the **3,000 Hz** beep drops at least 40 dB.',
        min: 100, max: 3000, paso: 10, inicial: 2000, unidad: 'Hz', etiqueta: 'Cutoff frequency',
        alto: 170,
        dibujar: (ctx, w, h, valor, C) => dibujarCorte(ctx, w, h, valor, C),
        correcto: v => gananciaDb(4, v, 500) >= -1 && gananciaDb(4, v, 3000) <= -40,
        solucion: 750,
        explicacion: 'With order 4, the drop is about 24 dB per octave. The cutoff has to be high enough to respect the 500 Hz and low enough to sink the 3,000: any value between about 600 and 940 Hz works.',
      },
      // 12 · Aplicada: quitar una deriva lenta.
      {
        id: 'e06-deriva', tipo: 'opcion', nivel: 'medio',
        enunciado: 'In a synthetic electrocardiogram, the baseline rises and falls very slowly, once every four seconds. What filter would you use to remove that drift?',
        opciones: ['A high-pass with a very low cutoff, below 1 Hz', 'A low-pass at 40 Hz', 'A notch at 50 Hz', 'A 7-day average'],
        correcta: 0,
        explicacion: 'The drift is extremely slow, so you have to remove what is slow and let the rest through: a high-pass with a very low cutoff. The 2007 recommendations for the electrocardiogram speak of 0.05 Hz so as not to distort the tracing.',
      },
      // 13 · Error típico: separar lo que comparte frecuencias.
      {
        id: 'e06-misma-banda', tipo: 'vf', nivel: 'basico',
        enunciado: 'A filter can separate two sounds even if they occupy the same frequencies.',
        correcta: false,
        explicacion: 'A filter multiplies each frequency by a number. If the two sounds share frequencies, it raises or lowers them both at once. Separating them takes other techniques, such as machine learning.',
      },
      // 14 · Visual: qué hace una media de 7 días hacia atrás.
      {
        id: 'e06-media-hacia-atras', tipo: 'grafica', nivel: 'medio', altoFigura: 130,
        figura: (ctx, w, h, C) => casos(ctx, w, h, C, 'crudo'),
        textoFigura: 'Synthetic daily cases over 70 days, with a dip every weekend, and the wave in the background, dashed',
        enunciado: 'These are the daily data, with a dip every weekend. What does the orange curve look like after a **7-day backward average**? The dashed line is the real wave.',
        opciones: [
          (ctx, w, h, C) => casos(ctx, w, h, C, 'dientes'),
          (ctx, w, h, C) => casos(ctx, w, h, C, 'liso'),
          (ctx, w, h, C) => casos(ctx, w, h, C, 'plana'),
        ],
        correcta: 1,
        explicacion: 'The average erases the weekly rhythm and keeps the trend, but backward it arrives late: the smooth curve ends up shifted about three days to the right. The first option hasn’t filtered anything and the third mistakes smoothing for flattening.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
