// Lesson 20 · Following the ridge: from the image to the pitch curve. New terms and the quiz question bank. (English version.)
// Loaded by en/e20.html after comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const num = (x, d) => Curso.num(x, d);
  const limitar = (x, a, b) => Math.min(b, Math.max(a, x));

  // ── Dibujos pequeños ──
  // Un mapa de juguete: un silbido que sube (la banda diagonal) y dos golpes de ruido más brillantes. La curva depende de la regla.
  function mapaJuguete(ctx, w, h, C, regla) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 16 };
    ctx.save();
    ctx.fillStyle = C.pantalla; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
    ctx.beginPath(); ctx.rect(caja.x, caja.y, caja.w, caja.h); ctx.clip();
    const X = u => caja.x + u * caja.w, Y = v => caja.y + (1 - v) * caja.h;
    const linea = u => 0.2 + 0.55 * u;
    const rgb = (t, a) => { const [r, g, b] = Graficas.magma(t); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgb(0.55, 0.9); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(X(0), Y(linea(0))); ctx.lineTo(X(1), Y(linea(1))); ctx.stroke();
    ctx.strokeStyle = rgb(0.85, 0.95); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(0), Y(linea(0))); ctx.lineTo(X(1), Y(linea(1))); ctx.stroke();
    for (const [u, v] of [[0.3, 0.92], [0.72, 0.1]]) {
      const g = ctx.createRadialGradient(X(u), Y(v), 0, X(u), Y(v), 14);
      g.addColorStop(0, rgb(1, 1)); g.addColorStop(1, rgb(0.2, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X(u), Y(v), 14, 0, 2 * Math.PI); ctx.fill();
    }
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      let v;
      if (regla === 'enorme') v = linea(0);
      else if (regla === 'moderado') v = linea(u);
      else v = Math.abs(u - 0.3) < 0.035 ? 0.92 : Math.abs(u - 0.72) < 0.035 ? 0.1 : linea(u);
      pts.push([X(u), Y(v)]);
    }
    ctx.lineJoin = 'round';
    for (const pasada of [0, 1]) {
      ctx.strokeStyle = pasada ? C.senal : 'rgba(0,0,0,0.65)'; ctx.lineWidth = pasada ? 2.4 : 5;
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
  }

  // Un mapa de 26 filas por 40 columnas con una nota que cambia a mitad y, en un tramo, la fundamental muy débil.
  const NF = 26, NT = 40;
  const mapaNota = (() => {
    const az = Senal.azar(5), P = new Float32Array(NF * NT);
    for (let j = 0; j < NT; j++) {
      const k0 = j < 24 ? 5 : 10, debil = j >= 12 && j < 21;
      for (let k = 0; k < NF; k++) {
        let v = 0.01 * Math.abs(az.normal());
        v += (debil ? 0.35 : 1) * Math.exp(-Math.pow(k - k0, 2) / 9);
        v += (debil ? 1 : 0.55) * Math.exp(-Math.pow(k - (k0 + 12), 2) / 9);
        P[k * NT + j] = v * v;
      }
    }
    return P;
  })();
  const verdadNota = j => (j < 24 ? 5 : 10);
  const memoriaCresta = new Map();
  const crestaDe = lam => {
    const k = Math.round(lam * 100);
    if (!memoriaCresta.has(k)) memoriaCresta.set(k, Senal.cresta(mapaNota, NF, NT, { penalizacion: lam < 0.005 ? 0 : lam }));
    return memoriaCresta.get(k);
  };
  function resultadoNota(lam) {
    const c = crestaDe(lam);
    let err = 0, oct = 0, tarde = -1;
    for (let j = 0; j < NT; j++) { const e = Math.abs(c[j] - verdadNota(j)); err += e; if (e >= 8) oct++; }
    for (let j = 24; j < NT; j++) if (Math.abs(c[j] - 10) <= 1) { tarde = j - 24; break; }
    return { err: err / NT, oct, tarde };
  }
  const buenoNota = lam => { const r = resultadoNota(lam); return r.err < 0.5 && r.oct === 0 && r.tarde >= 0 && r.tarde <= 2; };
  const solucionNota = (() => {
    const ok = [];
    for (let v = 0; v <= 6.0001; v += 0.05) if (buenoNota(Math.round(v * 100) / 100)) ok.push(Math.round(v * 100) / 100);
    return ok.length ? ok[Math.floor(ok.length / 2)] : 1;
  })();
  function dibujarNota(ctx, w, h, lam, C) {
    const caja = { x: 8, y: 8, w: w - 16, h: h - 16 }, cw = caja.w / NT, ch = caja.h / NF;
    let pm = 0; for (let i = 0; i < mapaNota.length; i++) if (mapaNota[i] > pm) pm = mapaNota[i];
    for (let k = 0; k < NF; k++) for (let j = 0; j < NT; j++) {
      const e = limitar(1 + 10 * Math.log10(mapaNota[k * NT + j] / pm + 1e-12) / 40, 0, 1), [r, g, b] = Graficas.magma(e);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(caja.x + j * cw, caja.y + (NF - 1 - k) * ch, cw + 0.6, ch + 0.6);
    }
    const c = crestaDe(lam), p = new Path2D();
    for (let j = 0; j < NT; j++) { const px = caja.x + (j + 0.5) * cw, py = caja.y + (NF - 1 - c[j] + 0.5) * ch; if (j) p.lineTo(px, py); else p.moveTo(px, py); }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 5; ctx.stroke(p);
    ctx.strokeStyle = C.senal; ctx.lineWidth = 2.4; ctx.stroke(p);
    ctx.strokeStyle = C.eje; ctx.lineWidth = 1; ctx.strokeRect(caja.x + 0.5, caja.y + 0.5, caja.w - 1, caja.h - 1);
  }

  // Una curva de tono con un hueco: la nota, el silencio y otra nota.
  function curvaConHueco(ctx, w, h, C) {
    const esc = Graficas.ejes(ctx, { caja: { x: 38, y: 8, w: w - 48, h: h - 30 }, x: [0, 2], y: [150, 350], marcasY: [150, 250, 350], marcasX: [0, 1, 2], formatoX: v => num(v) + ' s', formatoY: v => num(v), rejilla: false, C });
    const t1 = [], f1 = [], t2 = [], f2 = [];
    for (let t = 0; t <= 0.8; t += 0.02) { t1.push(t); f1.push(220 + 8 * Math.sin(2 * Math.PI * 5.5 * t)); }
    for (let t = 1.2; t <= 2; t += 0.02) { t2.push(t); f2.push(294 + 8 * Math.sin(2 * Math.PI * 5.5 * t)); }
    Graficas.linea(ctx, esc, t1, f1, { color: C.senal, ancho: 2.2, C });
    Graficas.linea(ctx, esc, t2, f2, { color: C.senal, ancho: 2.2, C });
    Graficas.texto(ctx, esc.x(1), esc.y(250), 'silence', { alinear: 'center', color: C.tenue, tam: 11, C });
    Graficas.texto(ctx, 4, h - 22, 'Hz', { color: C.tenue, tam: 10, C });
  }

  Curso.datos('e20', {
    terminos: [
      { termino: 'Ridge', definicion: 'The line of maximum energy of a component on a time-frequency map, like the line of peaks of a mountain range.', imagen: 'The relief seen from above, with the walker' },
      { termino: 'Ridge extraction', definicion: 'Turning the image of a map into a curve, with one value per instant.', imagen: 'The walker who crosses the map from left to right' },
      { termino: 'Greedy method', definicion: 'Choosing at each instant the best thing visible at that moment, without remembering what came before; here, the brightest point of each column.', imagen: 'The memoryless walker who jumps from peak to peak' },
      { termino: 'Jump penalty', definicion: 'What is subtracted from a path for changing height abruptly, so that smooth curves are preferred.', imagen: 'The rope that holds the walker back' },
      { termino: 'Inertia (curvature penalty)', definicion: 'What is subtracted for changing slope, so that a path keeps going in the direction it was going.', imagen: 'The walker who passes through the saddle of the X without turning' },
      { termino: 'Dynamic programming', definicion: 'A way of finding the best path by keeping, for each point, only the best path that reaches it.', imagen: 'The bread crumbs at every campsite' },
      { termino: 'Viterbi algorithm', definicion: 'Dynamic programming applied to choosing the most believable sequence of hidden states; it was born to decode noisy messages.', imagen: 'The same campsites, with a mobile phone in the background' },
      { termino: 'Pitch curve (f0 contour)', definicion: 'The pitch of a voice or an instrument at each instant.', imagen: 'The ridge of the fundamental, in green over the map' },
      { termino: 'Octave error', definicion: 'When a detector gives a note an octave, or another multiple, above or below the real one.', imagen: 'The walker climbed onto the ridge next door' },
      { termino: 'Subharmonic error', definicion: 'The octave error downward: the detector takes two or three periods for one.', imagen: 'The template that fits on the second turn' },
      { termino: 'Missing fundamental', definicion: 'A note that is heard even though its fundamental is not in the sound, because its harmonics are.', imagen: 'The stack of epicycles without the bottom wheel' },
      { termino: 'YIN', definicion: 'A pitch detector that looks for the smallest shift that leaves the signal almost the same.', imagen: 'The sliding template with the threshold line' },
      { termino: 'Absolute threshold', definicion: 'The level a valley must cross to be accepted as a period; the first one that crosses it is chosen.', imagen: 'The horizontal line over the difference curve' },
      { termino: 'Voiced and unvoiced', definicion: 'Whether at an instant there is a voice with pitch, voiced, or not, unvoiced: a silence, a whisper or an “s.”', imagen: 'The walker who can go down to the valley and wait' },
      { termino: 'Cent', definicion: 'One hundredth of a semitone; 1,200 cents make an octave.', imagen: 'The fine little lines between the piano keys' },
    ],

    preguntas: [
      // 1 · Basic: what the ridge is.
      {
        id: 'e20-cresta', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What is the **ridge** of a time-frequency map?',
        opciones: ['The curve that joins, instant by instant, the points of most energy of a component', 'The average frequency of the whole recording', 'The edge of the map where the noise begins'],
        correcta: 0,
        explicacion: 'If the map is seen as a relief, each component is a mountain range and the ridge is its line of peaks. For a component that changes slowly, it follows its instantaneous frequency; the average frequency erases exactly what changes.',
      },
      // 2 · Generated graph: which curve each rule produces.
      {
        id: 'e20-reglas', tipo: 'grafica', nivel: 'medio',
        generar: azar => {
          const clave = azar.elegir(['atajo', 'moderado', 'enorme']);
          const nombre = { atajo: 'the greedy method, which picks the brightest point of each instant', moderado: 'a moderate jump penalty', enorme: 'a huge jump penalty' }[clave];
          return {
            enunciado: 'This is the map of a rising whistle, with two bursts of noise stronger than it. Which curve does ' + nombre + ' produce?',
            opciones: [(ctx, w, h, C) => mapaJuguete(ctx, w, h, C, 'atajo'), (ctx, w, h, C) => mapaJuguete(ctx, w, h, C, 'moderado'), (ctx, w, h, C) => mapaJuguete(ctx, w, h, C, 'enorme')],
            correcta: { atajo: 0, moderado: 1, enorme: 2 }[clave],
            explicacion: 'With no penalty there is no memory, and any brighter blob takes the curve with it. With a moderate penalty, going to a blob and coming back costs more than it gains, and the curve stays stuck to the whistle. With a huge one it is not even worth following the rise, and the curve stays flat at the height where it started.',
          };
        },
      },
      // 3 · Slider: the penalty for the changing note and the octave above.
      {
        id: 'e20-castigo', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'On this map, a low note changes to a higher one halfway through, and in a central stretch its fundamental almost disappears and the octave above shines more. Adjust the jump penalty so that the curve follows the note without climbing to the octave and without arriving late at the change.',
        min: 0, max: 6, paso: 0.05, inicial: 0, unidad: '', etiqueta: 'Jump penalty',
        dibujar: (ctx, w, h, valor, C) => dibujarNota(ctx, w, h, Math.round(valor * 100) / 100, C),
        correcto: v => buenoNota(Math.round(v * 100) / 100), solucion: solucionNota,
        explicacion: 'With little penalty, the curve climbs to the octave in the stretch where the fundamental is weak. With too much, changing note costs so much that the curve arrives late at the change or stays entirely on the starting note. The right value lets the melody be followed without being carried off by the octave.',
      },
      // 4 · Generated numeric: error in semitones.
      {
        id: 'e20-semitonos', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.elegir([110, 130.81, 146.83, 196, 220]), factor = azar.elegir([2, 0.5, 3, 1 / 3]);
          const fh = f * factor, lectura = factor === 2 ? 'twice the real frequency' : factor === 0.5 ? 'half the real frequency' : factor === 3 ? 'three times the real frequency' : 'a third of the real frequency';
          return {
            enunciado: 'A detector returns ' + num(fh, 1) + ' Hz for a note of ' + num(f, 2) + ' Hz; that is ' + lectura + '. By how many semitones is it off? Enter a minus sign if it falls below.',
            respuesta: 12 * Math.log2(factor), tolerancia: 0.1, unidad: 'semitones', decimales: 1,
            explicacion: 'An octave is 12 semitones and the distance depends on the ratio: 12·log₂(' + num(factor, 2) + ') = ' + num(12 * Math.log2(factor), 2) + '. With three times the frequency you get about 19 semitones, an octave and a fifth, which is why YIN says “octave error” is a misnomer.',
          };
        },
      },
      // 5 · Generated numeric: the 20% of YIN.
      {
        id: 'e20-grueso', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.entero(80, 400);
          return {
            enunciado: 'YIN calls a gross error an estimate that departs more than 20% from the reference. If the real note is ' + f + ' Hz, what is the highest frequency that is still not a gross error?',
            respuesta: 1.2 * f, tolerancia: 0.5, unidad: 'Hz', decimales: 1,
            explicacion: '20% more means multiplying by 1.2: ' + f + ' × 1.2 = ' + num(1.2 * f, 1) + ' Hz. That is about 316 cents, a little over three semitones, so it is a permissive criterion: it separates octave errors from small misalignments.',
          };
        },
      },
      // 6 · True or false (common mistake).
      {
        id: 'e20-doble', tipo: 'vf', nivel: 'medio',
        enunciado: 'Octave error always multiplies or divides the frequency by exactly two.',
        correcta: false,
        explicacion: 'The detector can settle on three periods, and the note comes out an octave and a fifth below, or on the third harmonic, and it comes out an octave and a fifth above. That is why De Cheveigné and Kawahara warn that “octave error” is a misnomer.',
      },
      // 7 · True or false: dynamic programming.
      {
        id: 'e20-dinamica', tipo: 'vf', nivel: 'basico',
        enunciado: 'Dynamic programming finds the best path without trying every possible path.',
        correcta: true,
        explicacion: 'For each point it keeps only the best path that reaches it and where it came from. In a grid of 6 instants and 5 heights there are 15,625 paths and about 130 calculations are enough.',
      },
      // 8 · Applied: low voice over the phone.
      {
        id: 'e20-telefono', tipo: 'opcion', nivel: 'medio',
        enunciado: 'A man sings at 110 Hz over a phone that lets nothing through below 300 Hz. A detector that keeps the highest peak of the spectrum will say…',
        opciones: ['110 Hz', 'A harmonic: 330 Hz, 440 Hz or more', '0 Hz, because there is no fundamental'],
        correcta: 1,
        explicacion: 'The harmonics at 110 and 220 Hz do not get through, so the highest peak is one of those that remain. The ear, on the other hand, still hears 110 Hz because it recognizes the family of harmonics: that is the missing fundamental.',
      },
      // 9 · Common mistake: the subharmonic error.
      {
        id: 'e20-subarmonico', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Why can a detector based on autocorrelation give a note an octave lower?',
        opciones: ['Because the signal also resembles itself shifted by two periods', 'Because the microphone records more slowly than the voice', 'Because autocorrelation only sees the high frequencies'],
        correcta: 0,
        explicacion: 'What repeats every period also repeats every two. If the match at two periods wins, the frequency comes out halved. YIN avoids it by keeping the first valley that drops below a threshold, not the deepest one.',
      },
      // 10 · Multiple: two whistles that cross.
      {
        id: 'e20-cruce', tipo: 'varias', nivel: 'medio',
        enunciado: 'What helps avoid confusing two whistles that cross? Mark everything that helps.',
        opciones: ['Penalizing slope changes (inertia)', 'Using clues such as the timbre or the loudness of each whistle', 'Always keeping the brightest line', 'Raising the jump penalty a lot'],
        correctas: [0, 1],
        explicacion: 'The jump penalty does not tell bouncing from going straight, because they cost the same; inertia does. The brightest branch may belong to the other whistle, and a huge jump penalty leaves the curve flat.',
      },
      // 11 · Applied: the karaoke game.
      {
        id: 'e20-karaoke', tipo: 'opcion', nivel: 'medio',
        enunciado: 'According to its code, before comparing your note with the one in the song, the free karaoke game UltraStar Deluxe…',
        opciones: ['Moves it to the octave closest to the one in the song', 'Requires you to sing in the same octave', 'Only checks whether you sing loudly enough'],
        correcta: 0,
        explicacion: 'It moves your note by adding or subtracting octaves until it is near the one in the song, and then allows 2, 1 or 0 semitones of margin depending on the difficulty. That is why an octave error by the detector, or singing an octave lower, does not cost you points.',
      },
      // 12 · Applied: the Auto-Tune patent.
      {
        id: 'e20-patente', tipo: 'opcion', nivel: 'medio',
        enunciado: 'According to its 1998 patent, how does Auto-Tune avoid confusing the note with its harmonic in vowels with little energy at the fundamental?',
        opciones: ['It also checks the double period, with the signal at full resolution', 'It listens to the lyrics to know which vowel it is', 'It always keeps the highest peak of the spectrum'],
        correcta: 0,
        explicacion: 'The patent acknowledges that, in those vowels, its method detects the first harmonic, and that is why it also tries double the lag, with the signal at full resolution, before accepting a period.',
      },
      // 13 · Generated numeric and applied: the lag range of the patent.
      {
        id: 'e20-retraso', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const L = azar.entero(2, 110);
          return {
            enunciado: 'The Auto-Tune in the patent lowers the sampling rate from 44,100 Hz to one eighth, 5,512.5 Hz, and tries lags from 2 to 110 samples. What frequency corresponds to a lag of ' + L + ' samples?',
            respuesta: 5512.5 / L, toleranciaRel: 0.01, unidad: 'Hz', decimales: 1,
            explicacion: 'The lag that makes the signal match itself is the period, and the frequency is its inverse: 5,512.5 / ' + L + ' = ' + num(5512.5 / L, 1) + ' Hz. With 2 samples you get about 2,756 Hz and with 110, about 50 Hz: the range of the voice with some margin.',
          };
        },
      },
      // 14 · True or false with a figure: staying silent.
      {
        id: 'e20-silencio', tipo: 'vf', nivel: 'basico',
        figura: curvaConHueco, textoFigura: 'A pitch curve with a silence in the middle',
        enunciado: 'A good pitch tracker should be able to say “there is no note here” in the gap in the figure.',
        correcta: true,
        explicacion: 'Without that option, the tracker invents a note in the background noise. Praat includes at each instant an “unvoiced” candidate and charges a cost for turning the voice on or off.',
      },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
