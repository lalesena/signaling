// Lesson 18 · Moving the energy to its place: phase and reassignment. New terms and the quiz question bank.
// Loaded by e18.html (and by glosario.html and examenes.html) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // A black box with a border, for drawing “images” in the options of the graph questions.
  function recuadro(ctx, w, h, C) {
    const lado = Math.min(w - 12, h - 12), x = (w - lado) / 2, y = (h - lado) / 2;
    ctx.fillStyle = '#05030c'; ctx.fillRect(x, y, lado, lado);
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, lado - 1, lado - 1);
    return { x, y, lado };
  }
  // The three possible images when crossing the sizes of the wheel with the phase of the letters.
  function imagenNoria(ctx, w, h, C) {
    const r = recuadro(ctx, w, h, C), cx = r.x + r.lado / 2, cy = r.y + r.lado / 2, R = r.lado * 0.36;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.4; ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); } ctx.stroke();
  }
  function imagenLetras(ctx, w, h, C) {
    const r = recuadro(ctx, w, h, C);
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.lado, r.lado); ctx.clip();
    const az = Senal.azar(3);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 160; i++) ctx.fillRect(r.x + az.real() * r.lado, r.y + az.real() * r.lado, 2, 2);
    ctx.font = '700 ' + Math.round(r.lado * 0.24) + 'px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.strokeText('PHASE', r.x + r.lado / 2, r.y + r.lado / 2);
    ctx.restore();
  }
  function imagenMancha(ctx, w, h, C) {
    const r = recuadro(ctx, w, h, C), cx = r.x + r.lado / 2, cy = r.y + r.lado / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r.lado * 0.28);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.lado, r.lado);
  }
  // A knock and a chirp on the time–frequency plane, thick or thin.
  function golpeYChirp(ctx, w, h, C, estilo) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 26 }, x: [0, 1], y: [0, 1], marcasX: [0, 1], marcasY: false, formatoX: v => num(v) + ' s', rejilla: false, C });
    const fino = estilo === 'fino';
    if (estilo === 'horizontal') {
      for (const y of [0.25, 0.5, 0.75]) Graficas.linea(ctx, esc, [0.05, 0.95], [y, y], { color: C.espectro, ancho: 2, halo: false, C });
      return;
    }
    const gr = fino ? 1.6 : 9;
    Graficas.linea(ctx, esc, [0.5, 0.5], [0.04, 0.96], { color: C.espectro, ancho: gr * (fino ? 1 : 1.3), alfa: fino ? 1 : 0.55, halo: false, C });
    Graficas.linea(ctx, esc, [0.15, 0.85], [0.15, 0.85], { color: C.senal, ancho: gr, alfa: fino ? 1 : 0.55, halo: false, C });
  }
  // Two notes and the width of the blob each one leaves with a Gaussian window of σ ms.
  function dosManchas(ctx, w, h, valor, C) {
    const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 8, w: w - 24, h: h - 38 }, x: [940, 1100], y: [0, 1.1], marcasX: [1000, 1040], marcasY: false, formatoX: v => num(v), rejilla: false, C });
    const s = 1 / (TAU * valor / 1000), amp = f => Math.exp(-0.5 * Math.pow((f - 1000) / s, 2)), amp2 = f => Math.exp(-0.5 * Math.pow((f - 1040) / s, 2));
    Graficas.curva(ctx, esc, amp, { color: C.espectro, ancho: 1.6, halo: false, alfa: 0.7, desde: 940, hasta: 1100, C });
    Graficas.curva(ctx, esc, amp2, { color: C.espectro, ancho: 1.6, halo: false, alfa: 0.7, desde: 940, hasta: 1100, C });
    Graficas.curva(ctx, esc, f => Math.min(1.05, amp(f) + amp2(f)), { color: C.respuesta, ancho: 2.2, desde: 940, hasta: 1100, C });
    Graficas.texto(ctx, w / 2, h - 4, 'blob of one note: ' + num(Math.sqrt(2 * Math.LN2) / (Math.PI * valor / 1000), 0) + ' Hz · separation: 40 Hz', { alinear: 'center', color: C.suave, tam: 10.5, C });
  }

  Curso.datos('e18', {
    terminos: [
      { termino: 'STFT phase', definicion: 'The starting point of each cell of the spectrogram, which the spectrogram throws away.', imagen: 'The arrow of each test wheel' },
      { termino: 'Phase swap', definicion: 'Combining the sizes of one image or sound with the phase of another.', imagen: 'The wheel with the starting points of the letters, which reads as letters' },
      { termino: 'Local instantaneous frequency', definicion: 'The real speed of the wheel that dominates a cell, read from how far its phase turns between two snapshots.', imagen: 'The arrow that turns too much' },
      { termino: 'Local group delay', definicion: 'The real instant of the energy of a cell, read from how its phase changes from one row to the next.', imagen: 'The blob that knows when it happened' },
      { termino: 'Center of gravity (centroid)', definicion: 'The point where the energy that falls inside a tile balances.', imagen: 'The scale hung from its balance point' },
      { termino: 'Reassignment', definicion: 'Moving each value of the spectrogram to its center of gravity, calculated with the phase.', imagen: 'The clouds of energy shrinking toward lines' },
      { termino: 'Reassigned spectrogram', definicion: 'The image that results from reassigning all the points of a spectrogram.', imagen: 'The sheet music with thin strokes instead of blobs' },
      { termino: 'Wigner–Ville distribution', definicion: 'A time–frequency image that nails a chirp but draws ghosts between components.', imagen: 'The sharp photo with double images in the middle' },
      { termino: 'Cross-term (interference)', definicion: 'The ghost that the Wigner–Ville distribution draws halfway between two components, oscillating between positive and negative.', imagen: 'The third note nobody played' },
      { termino: 'Energy threshold', definicion: 'The level below which nothing is reassigned, so as not to move the noise.', imagen: 'The strainer that keeps the specks out' },
    ],

    preguntas: [
      // 1 · Basic: what the spectrogram keeps.
      {
        id: 'e18-que-guarda', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What gets painted for each cell of a spectrogram?',
        opciones: ['Only its size, the energy; the phase is thrown away', 'Only its phase', 'The size and the phase, in two colors'],
        correcta: 0,
        explicacion: 'The squared size of each cell is drawn and the phase is discarded. That discarded half is exactly where the information is that reassignment uses to find where the energy really is.',
      },
      // 2 · Graph: phase swap.
      {
        id: 'e18-intercambio', tipo: 'grafica', nivel: 'medio',
        enunciado: 'You combine the **sizes of the wheel** with the **starting points of the letters** PHASE. What image comes out?',
        opciones: [imagenNoria, imagenLetras, imagenMancha],
        correcta: 1,
        explicacion: 'The word comes out, a bit dirty: the phase places the edges and the positions, and the sizes only say how much of each stripe there is. The bright blob in the center is what you get with the sizes alone.',
      },
      // 3 · Generated: the arrow that turns too much.
      {
        id: 'e18-flecha', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fk = azar.elegir([500, 1000, 2000]), dt = azar.elegir([1, 2, 4]);
          let g = azar.entero(-9, 9) * 10;
          if (g === 0) g = 30;
          const f = fk + g / (360 * dt / 1000);
          return {
            enunciado: 'The arrow of the cell in the ' + num(fk) + ' Hz row turns ' + (g > 0 ? num(g) + '° too much' : num(-g) + '° too little') + ' between two snapshots ' + num(dt) + ' ms apart. At what frequency is the wheel inside it going?',
            respuesta: f, tolerancia: 1, unidad: 'Hz',
            explicacion: num(Math.abs(g)) + '° is ' + num(Math.abs(g) / 360, 3) + ' of a turn, and in ' + num(dt) + ' ms that is ' + num(Math.abs(g) / 360 / (dt / 1000), 1) + ' turns per second ' + (g > 0 ? 'more' : 'less') + ' than its row: ' + num(fk) + (g > 0 ? ' + ' : ' − ') + num(Math.abs(g) / 360 / (dt / 1000), 1) + ' = ' + num(f, 1) + ' Hz.',
          };
        },
      },
      // 4 · Generated: a linear chirp lands on its line.
      {
        id: 'e18-chirp', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f0 = azar.entero(200, 800), al = azar.entero(5, 50) * 100, T = azar.entero(1, 9) / 10;
          const f = f0 + al * T;
          return {
            enunciado: 'A linear chirp starts at ' + num(f0) + ' Hz and rises ' + num(al) + ' Hz every second. Reassignment takes one of its points to the instant ' + num(T, 1) + ' s. At what frequency does it place it?',
            respuesta: f, toleranciaRel: 0.005, unidad: 'Hz',
            explicacion: 'Reassignment locates linear chirps perfectly: each point lands on the chirp’s line, so its frequency is ' + num(f0) + ' + ' + num(al) + ' · ' + num(T, 1) + ' = ' + num(f) + ' Hz.',
          };
        },
      },
      // 5 · Generated: the ghost is at the midpoint.
      {
        id: 'e18-fantasma', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f1 = azar.entero(2, 9) * 100, f2 = azar.entero(12, 30) * 100, t1 = azar.entero(1, 4) / 10, t2 = azar.entero(5, 9) / 10;
          return {
            enunciado: 'Two short notes sound at (' + num(t1, 1) + ' s, ' + num(f1) + ' Hz) and at (' + num(t2, 1) + ' s, ' + num(f2) + ' Hz). At what frequency does the Wigner–Ville distribution draw its ghost?',
            respuesta: (f1 + f2) / 2, tolerancia: 1, unidad: 'Hz',
            explicacion: 'The ghost lands exactly at the midpoint of the two notes, in both time and frequency: (' + num(f1) + ' + ' + num(f2) + ') / 2 = ' + num((f1 + f2) / 2) + ' Hz, at the instant ' + num((t1 + t2) / 2, 2) + ' s.',
          };
        },
      },
      // 6 · Common mistake: reassignment does not stay in its column.
      {
        id: 'e18-columna', tipo: 'vf', nivel: 'medio',
        enunciado: 'Reassignment moves each point without leaving its column, to the maximum of that column.',
        correcta: false,
        explicacion: 'It moves it to its center of gravity, calculated with the phase, and that center can be at another instant: in a chirp, the points travel diagonally to the line, which is why it comes out so thin. Moving only vertically, within its column, is what the synchrosqueezing in the next lesson will do.',
      },
      // 7 · Common mistake: going back from the reassigned one.
      {
        id: 'e18-volver', tipo: 'vf', nivel: 'basico',
        enunciado: 'From the reassigned spectrogram you can hear the original signal again.',
        correcta: false,
        explicacion: 'No: it has thrown away the phase, moved values to other instants and stacked at a single point values that came from different places. The complete transform can be undone; the reassigned image cannot.',
      },
      // 8 · Multiple answers: why there is no way back.
      {
        id: 'e18-no-vuelta', tipo: 'varias', nivel: 'medio',
        enunciado: 'Why is there no way back from reassignment? Select everything that is true.',
        opciones: ['It keeps only the energy, without the phase', 'It also moves values in time, and each column stops adding up to what it did', 'Several points end up piled in the same place', 'Because the Fourier transform cannot be inverted', 'Because it uses a Gaussian window'],
        correctas: [0, 1, 2],
        explicacion: 'The first three are real losses. The Fourier transform can be inverted, and the Gaussian window has nothing to do with it: what is lost is the phase and the order of the instants.',
      },
      // 9 · Graph: reassigned knock and chirp.
      {
        id: 'e18-golpe-chirp', tipo: 'grafica', nivel: 'medio',
        enunciado: 'A knock and a chirp, with a 7 ms window. Which one is the **reassigned** spectrogram?',
        opciones: [(ctx, w, h, C) => golpeYChirp(ctx, w, h, C, 'grueso'), (ctx, w, h, C) => golpeYChirp(ctx, w, h, C, 'fino'), (ctx, w, h, C) => golpeYChirp(ctx, w, h, C, 'horizontal')],
        correcta: 1,
        explicacion: 'Reassigned, the knock is a thin vertical streak and the chirp a thin diagonal: these are exactly the cases that reassignment locates perfectly. The first image, with thick bands, is the spectrogram before reassignment.',
      },
      // 10 · Slider: separating two notes.
      {
        id: 'e18-dos-notas', tipo: 'deslizador', nivel: 'reto',
        enunciado: 'Move the window until the notes at **1,000 and 1,040 Hz** come out separated in the reassigned image: the blob of one note has to be narrower than their separation, with some margin.',
        min: 2, max: 30, paso: 0.5, inicial: 4, unidad: 'ms', etiqueta: 'Window width (σ)',
        dibujar: (ctx, w, h, valor, C) => dosManchas(ctx, w, h, valor, C),
        correcto: v => v >= 12, solucion: 14,
        explicacion: 'For reassignment to sharpen the two notes, the separation has to exceed the half-height width of the blob of a single note, √(2 ln 2)/(π σ): with 12 ms that is about 31 Hz, less than the 40 that separate them. With a shorter window, the two blobs overlap and get in each other’s way.',
      },
      // 11 · Applied: the threshold.
      {
        id: 'e18-umbral', tipo: 'opcion', nivel: 'medio',
        enunciado: 'What is the energy threshold for in a reassigned spectrogram?',
        opciones: ['So that the noise is not moved, since otherwise it would turn into bright specks', 'So that the image weighs less', 'So that the lines come out thicker'],
        correcta: 0,
        explicacion: 'Reassignment moves any energy, including that of the noise, and piles it into specks. Setting a threshold leaves still what has almost no energy, at the cost of not moving whatever is below it: the weak note has to stay above.',
      },
      // 12 · Applied: low voice.
      {
        id: 'e18-voz-grave', tipo: 'opcion', nivel: 'reto',
        enunciado: 'You sing a low note whose harmonics are 100 Hz apart. With which Gaussian window does each harmonic come out on its own line?',
        opciones: ['σ = 1 ms: that way the slice is very short and everything shows up at the exact instant', 'σ = 10 ms: the blob of one harmonic is about 37 Hz wide', 'Any one: reassignment separates whatever you want'],
        correcta: 1,
        explicacion: 'With 10 ms, the blob of a note is about 37 Hz wide, well under the 100 Hz that separate the harmonics. With 1 ms it is about 375 Hz wide and the harmonics blend together; and reassignment does not break uncertainty, it only sharpens what the window already separates.',
      },
      // 13 · History.
      {
        id: 'e18-historia', tipo: 'opcion', nivel: 'basico', temporada: false,
        enunciado: 'Who first proposed using the phase to relocate the energy of the spectrogram?',
        opciones: ['Kodera, Gendrin and de Villedary, in the late 1970s', 'Auger and Flandrin, in 1995', 'Wigner, in 1932'],
        correcta: 0,
        explicacion: 'Kodera, Gendrin and de Villedary proposed it under the name modified moving window method. Auger and Flandrin gave it the name reassignment in 1995, along with a recipe using three transforms, and Wigner defined another image, with no blur but with ghosts.',
      },
      // 14 · Wigner–Ville and the spectrogram.
      {
        id: 'e18-wigner-espectro', tipo: 'opcion', nivel: 'reto', temporada: false,
        enunciado: 'What is the relation between the spectrogram and the Wigner–Ville distribution?',
        opciones: ['The spectrogram is the signal’s Wigner–Ville distribution smoothed with that of the window', 'They are the same image with a different color scale', 'The Wigner–Ville distribution is the spectrogram with the longest window'],
        correcta: 0,
        explicacion: 'Smoothing erases the ghosts, but it blurs everything else: that is why the spectrogram has no interference and does have blur. Reassignment tries to recover the sharpness without bringing the ghosts back.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
