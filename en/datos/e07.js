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
      { termino: 'Impulse', definicion: 'An extremely brief sound or signal, a single stick, that contains all frequencies at once.', imagen: 'The clap or the bursting balloon' },
      { termino: 'Impulse response', definicion: 'What a system returns when an impulse goes in; it is its complete fingerprint and the stamp of the convolution.', imagen: 'The tail of the clap in the bathroom' },
      { termino: 'Linear time-invariant (LTI) system', definicion: 'A system in which twice the input gives twice the output and in which delaying the input only delays the output.', imagen: 'Double clap, double tail; clap later, the same tail later' },
      { termino: 'Convolution', definicion: 'The operation that builds the output by adding one copy of the impulse response for each sample of the input, scaled and shifted.', imagen: 'The stamps' },
      { termino: 'Reverberation', definicion: 'The tail of sound a room leaves when a sound stops, made of thousands of reflections.', imagen: 'The cathedral that keeps ringing' },
      { termino: 'Reverberation time (T60)', definicion: 'How long the tail of a room takes to drop by 60 dB.', imagen: 'The tail fading out on the dB graph' },
      { termino: 'Point spread function', definicion: 'The stamp of light that a single point leaves in an image; it describes the blur.', imagen: 'The disk of an out-of-focus star' },
      { termino: 'Deconvolution', definicion: 'Trying to peel off the stamps to recover the original signal; it works only partly when there is noise.', imagen: 'The Hubble photos corrected with calculations' },
      { termino: 'Convolution theorem', definicion: 'The rule that says adding stamps in time is the same as multiplying spectra.', imagen: 'The stamp seen as an equalizer' },
    ],
    preguntas: [
      { id: 'e07-impulso', tipo: 'opcion', nivel: 'basico', enunciado: 'What is the impulse response of a room?',
        opciones: ['What the room returns in response to an extremely brief sound, such as a clap: its fingerprint', 'The maximum volume the room can take', 'The frequency at which it resonates the most', 'The echo you hear only when you shout'], correcta: 0,
        explicacion: 'It is the output in response to an impulse. With it you know how the room will respond to any sound, because each stick of that sound will stamp its copy.' },
      { id: 'e07-salida', tipo: 'grafica', nivel: 'medio',
        enunciado: 'The input is two sticks: one of height 1 at t = 0 and another of height 0.5 at t = 0.3 s. The stamp is a bell shape that lasts 0.2 s. What is the output?',
        opciones: [(ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'dos'), (ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'una'), (ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'iguales'), (ctx, w, h, C) => dibujarSalida(ctx, w, h, C, 'puntos')],
        correcta: 0,
        explicacion: 'Each stick stamps the stamp scaled by its height and at its instant: the second copy is half as tall and starts at 0.3 s. Two equal copies ignore the height of the second stick, a single copy ignores the second stick, and keeping just two points confuses convolution with multiplying point by point.' },
      { id: 'e07-lineal', tipo: 'vf', nivel: 'basico', enunciado: 'If you clap twice as hard, the tail of the room comes out twice as strong.', correcta: true,
        explicacion: 'That is linearity: the response to a scaled input is the scaled response. In a room it holds very well at normal volumes.' },
      { id: 'e07-longitud', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const L = azar.entero(100, 2000), M = azar.entero(10, 500);
          return { enunciado: 'You convolve a signal of ' + num(L) + ' samples with a stamp of ' + num(M) + ' samples. How many samples does the result have?', respuesta: L + M - 1, tolerancia: 0, unidad: 'samples',
            explicacion: 'The last stick of the input stamps a stamp that sticks out M − 1 samples: ' + num(L) + ' + ' + num(M) + ' − 1 = ' + num(L + M - 1) + '.' };
        } },
      { id: 'e07-coste', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const T = azar.elegir([0.5, 1, 2, 3]), fs = azar.elegir([16000, 44100, 48000]), r = T * fs * fs / 1e6;
          return { enunciado: 'A reverb program stamps a stamp of ' + num(T) + ' s on a signal of ' + num(fs) + ' samples per second, adding the stamps one by one, without the FFT. How many multiplications per second does it do? Answer in millions.', respuesta: r, toleranciaRel: 0.02, unidad: 'millions',
            explicacion: 'Each output sample adds T·fs products and there are fs samples per second: ' + num(T) + ' · ' + num(fs) + ' · ' + num(fs) + ' ≈ ' + num(r, 0) + ' million. That is why the FFT is used.' };
        } },
      { id: 'e07-medir', tipo: 'varias', nivel: 'medio', enunciado: 'What is used to measure the impulse response of a real room? Mark everything that works.',
        opciones: ['A bursting balloon', 'A starter pistol', 'A sweep of tones through a loudspeaker, which is later undone with a calculation', 'A tuning fork', 'A photo of the room'], correctas: [0, 1, 2],
        explicacion: 'You need something that contains all the frequencies: a short, loud bang or a sweep that is later undone with a calculation. A tuning fork gives almost a single frequency, and a photo says nothing about the sound.' },
      { id: 'e07-sofia', tipo: 'opcion', nivel: 'medio', enunciado: 'How could a choir sing “inside” Hagia Sophia without traveling to Istanbul?',
        opciones: ['By convolving their voices live with the impulse response obtained from balloons popped in the basilica', 'By recording in Istanbul and playing it back in California', 'A technician imitated the echo by hand with a mixer', 'With huge loudspeakers inside a church in California'], correcta: 0,
        explicacion: 'The impulse response keeps the fingerprint of the room, and convolving with it puts any sound inside. The balloons were processed beforehand, because they do not radiate equally in all directions and their spectrum has gaps.' },
      { id: 'e07-teorema', tipo: 'vf', nivel: 'basico', enunciado: 'Convolving two signals in time is the same as multiplying their spectra.', correcta: true,
        explicacion: 'That is the convolution theorem, the bridge between stamps and the equalizer: the frequency response of a filter is the spectrum of its stamp.' },
      { id: 'e07-media', tipo: 'opcion', nivel: 'basico', enunciado: 'Seen as a stamp, the 5-sample moving average is…',
        opciones: ['A rectangle of 5 samples of height 1/5', 'A stick of height 5', 'A bell shape that decays', 'Two sticks 5 samples apart'], correcta: 0,
        explicacion: 'Each output is the sum of the last 5 inputs, each multiplied by 1/5: a flat stamp of 5 samples.' },
      { id: 'e07-camara', tipo: 'grafica', nivel: 'medio', enunciado: 'When the photo was taken, the camera moved horizontally while the shutter was open. Which stamp of light explains the blurry photo?',
        opciones: [(ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'disco'), (ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'raya'), (ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'gauss'), (ctx, w, h, C) => dibujarSello(ctx, w, h, C, 'punto')],
        altoOpcion: 130, correcta: 1,
        explicacion: 'During the exposure, each point of light was dragged horizontally and left a streak. The disk is the blur of the lens, the soft blotch is air turbulence, and a single point would be a sharp photo.' },
      { id: 'e07-eco', tipo: 'deslizador', nivel: 'medio', enunciado: 'A clap with an echo of strength 0.5 sounds like the dashed line. Move the echo delay until the output covers it.',
        min: 0, max: 0.6, paso: 0.01, inicial: 0.1, unidad: 's', etiqueta: 'Echo delay', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => dibujarEco(ctx, w, h, C, valor),
        correcto: v => Math.abs(v - 0.25) <= 0.011, solucion: 0.25,
        explicacion: 'The stamp of the echo has a second stick at the delay, and the copy appears right there: if the echo of the dashed line arrives at 0.25 s, the stamp needs its stick at 0.25 s.' },
      { id: 'e07-hubble', tipo: 'vf', nivel: 'medio', enunciado: 'If you know the stamp of a blur, you can always recover the perfect original photo.', correcta: false,
        explicacion: 'Where the stamp erases frequencies, the information is lost, and when you try to recover it the noise shoots up. With Hubble the images were only partly corrected, and the definitive fix was installing corrective mirrors.' },
      { id: 'e07-ruido', tipo: 'opcion', nivel: 'reto', enunciado: 'You use the clap from the bathroom as a stamp, but the recording has a lot of background noise. What will happen to the convolved voice?',
        opciones: ['Each sample of your voice will stamp the noise too: a hissing tail will come out, so the stamp has to be trimmed where it sinks into the noise', 'Nothing, noise does not count', 'The reverberation will disappear', 'The voice will come out higher-pitched'], correcta: 0,
        explicacion: 'Everything in the stamp is convolved with the voice, including the background noise at the end of the cut.' },
      { id: 'e07-puerta', tipo: 'opcion', nivel: 'reto', enunciado: 'While you record in a room, someone opens a big door. Which rule of convolution stops holding?',
        opciones: ['The room is no longer time-invariant: its stamp changes', 'Linearity', 'Commutativity', 'None'], correcta: 0,
        explicacion: 'Stamps are only valid if the room does not change. When the door opens, the impulse response changes, and the same clap leaves a different tail before and after.' },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
