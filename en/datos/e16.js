// Lesson 16 · The missing shadow: new terms and the quiz question bank.
// Loaded by e16.html (and by glosario.html and examenes.html) after comun/curso.js.
// Question types and fields: ESPECIFICACION.md § 7 and API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // The plane of the two shadows: the wall one across, the floor one up, and the point with its two shadows.
  function plano(ctx, w, h, C, x, y) {
    const lado = Math.min(h - 16, w - 30), cx = w / 2, cy = h / 2, k = lado / 2 / 1.15;
    ctx.save();
    ctx.strokeStyle = G.alfa(C.eje, 0.8); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - lado / 2, cy + 0.5); ctx.lineTo(cx + lado / 2, cy + 0.5); ctx.moveTo(cx + 0.5, cy - lado / 2); ctx.lineTo(cx + 0.5, cy + lado / 2); ctx.stroke();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = G.alfa(C.senal, 0.8); ctx.beginPath(); ctx.moveTo(cx + k * x, cy - k * y); ctx.lineTo(cx + k * x, cy); ctx.stroke();
    ctx.strokeStyle = G.alfa(C.respuesta, 0.8); ctx.beginPath(); ctx.moveTo(cx + k * x, cy - k * y); ctx.lineTo(cx, cy - k * y); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = C.cuerpo; ctx.beginPath(); ctx.arc(cx + k * x, cy - k * y, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = C.senal; ctx.beginPath(); ctx.arc(cx + k * x, cy, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = C.respuesta; ctx.beginPath(); ctx.arc(cx, cy - k * y, 4, 0, TAU); ctx.fill();
    G.texto(ctx, cx + lado / 2, cy - 5, 'wall →', { alinear: 'right', color: C.suave, tam: 10, C });
    G.texto(ctx, cx + 6, cy - lado / 2 + 9, 'floor ↑', { color: C.suave, tam: 10, C });
    G.texto(ctx, cx + k * x + (x >= 0 ? 8 : -8), cy - k * y - 8, '(' + num(x, 2) + ', ' + num(y, 2) + ')', { alinear: x >= 0 ? 'left' : 'right', color: C.texto, tam: 10, peso: 600, C });
  }

  // A fading bell: a fast oscillation whose size slowly drops.
  const campana = t => Math.exp(-t / 0.35) * Math.sin(TAU * 18 * t);
  function ejesCampana(ctx, w, h, C) {
    return G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 28 }, x: [0, 1], y: [-1.15, 1.15], marcasY: false, marcasX: [0, 1], formatoX: v => num(v) + ' s', rejilla: false, C });
  }
  function figuraCampana(ctx, w, h, C) {
    const esc = ejesCampana(ctx, w, h, C);
    G.curva(ctx, esc, campana, { color: C.senal, ancho: 1.6, n: 800, C });
  }
  function opcionCampana(tipo) {
    return (ctx, w, h, C) => {
      const esc = ejesCampana(ctx, w, h, C);
      G.curva(ctx, esc, campana, { color: C.senal, ancho: 1, alfa: 0.35, halo: false, n: 800, C });
      if (tipo === 'suave') G.curva(ctx, esc, t => Math.exp(-t / 0.35), { color: C.respuesta, ancho: 2.4, n: 200, C });
      else if (tipo === 'rectificada') G.curva(ctx, esc, t => Math.abs(campana(t)), { color: C.respuesta, ancho: 2, n: 800, C });
      else G.curva(ctx, esc, () => 1, { color: C.respuesta, ancho: 2.4, n: 4, C });
    };
  }

  // Two-sided spectra: bars at -f and +f.
  function espectroDosCaras(barras) {
    return (ctx, w, h, C) => {
      const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 30 }, x: [-3, 3], y: [0, 2.3], marcasY: false, marcasX: [-2, 0, 2], formatoX: v => (v === 0 ? '0' : v > 0 ? '+f' : '−f'), rejilla: false, C });
      for (const [f, a] of barras) {
        const x = esc.x(f), y = esc.y(a), ancho = Math.max(6, esc.x(0.3) - esc.x(0));
        ctx.fillStyle = C.espectro; ctx.fillRect(x - ancho / 2, y, ancho, esc.y(0) - y);
      }
    };
  }

  // Delaying a copy: the two waves and the path they draw together.
  function retraso(ctx, w, h, valor, C) {
    const g = valor * Math.PI / 180, mitad = Math.round(w * 0.6);
    const esc = G.ejes(ctx, { caja: { x: 10, y: 12, w: mitad - 16, h: h - 32 }, x: [0, 1], y: [-1.2, 1.2], marcasY: false, marcasX: [0, 1], formatoX: v => num(v) + ' s', rejilla: false, C });
    G.curva(ctx, esc, t => Math.cos(TAU * t), { color: C.senal, ancho: 2, n: 300, C });
    G.curva(ctx, esc, t => Math.cos(TAU * t - g), { color: C.respuesta, ancho: 2, n: 300, C });
    const cx = mitad + (w - mitad) / 2, cy = (h - 18) / 2 + 8, r = Math.min((w - mitad) / 2 - 8, (h - 28) / 2);
    ctx.save();
    ctx.strokeStyle = G.alfa(C.eje, 0.6); ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(cx - r - 3, cy + 0.5); ctx.lineTo(cx + r + 3, cy + 0.5); ctx.moveTo(cx + 0.5, cy - r - 3); ctx.lineTo(cx + 0.5, cy + r + 3); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.cuerpo; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const t = i / 200, px = cx + r * 0.9 * Math.cos(TAU * t), py = cy - r * 0.9 * Math.cos(TAU * t - g); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.restore();
  }

  const entero100 = (azar, a, b) => azar.entero(a, b) / 100;

  Curso.datos('e16', {
    terminos: [
      { termino: 'Complex number', definicion: 'A pair of numbers that says where a point of the plane is: together they give a size and an angle.', imagen: 'The two shadows of the cabin, the one on the wall and the one on the floor' },
      { termino: 'Analytic signal', definicion: 'The signal together with its missing shadow: a complete spinning Ferris wheel, with no negative frequencies.', imagen: 'The whole helix' },
      { termino: 'Hilbert transform', definicion: 'The operation that builds the missing shadow, by turning each wheel a quarter of its own turn.', imagen: 'The shadow on the floor' },
      { termino: 'Envelope', definicion: 'The size of the wheel at every instant: the volume of the signal without its ups and downs.', imagen: 'The radius of the helix' },
      { termino: 'Instantaneous phase', definicion: 'The angle of the cabin at every instant, counting the complete turns.', imagen: 'The angle of the cabin on the helix' },
      { termino: 'Phase unwrapping', definicion: 'Adding one whole turn each time the angle jumps from one end to the other, so that it grows without breaks.', imagen: 'Counting the turns of the wheel instead of resetting the angle' },
      { termino: 'Negative frequency', definicion: 'A wheel that turns backwards; in a real signal, it always comes paired with an identical one turning forwards.', imagen: 'The backwards wheel that casts the same shadow' },
      { termino: 'Demodulate', definicion: 'To recover the message traveling in a wave: its size in AM, its speed in FM.', imagen: 'Reading the radius or the rate of the angle' },
      { termino: 'Envelope analysis', definicion: 'Filtering a vibration around a resonance, taking its envelope and looking at its spectrum to find the rhythm of some knocks.', imagen: 'The little bell of the metal that rings with every knock' },
    ],

    preguntas: [
      // 1 · Basic: what the Hilbert transform adds.
      {
        id: 'e16-hilbert', tipo: 'opcion', nivel: 'basico',
        enunciado: 'What does the Hilbert transform add to a signal?',
        opciones: [
          'The other shadow: the same signal with each wheel turned a quarter of a turn',
          'The envelope directly',
          'Its spectrum',
          'A noise-free version of the signal',
        ],
        correcta: 0,
        explicacion: 'It builds the missing shadow, the one on the floor. The envelope comes afterwards, from putting the two shadows together; the spectrum and noise cleaning are other operations.',
      },
      // 2 · True or false: the wall shadow does not tell the direction of rotation.
      {
        id: 'e16-gira-al-reves', tipo: 'vf', nivel: 'basico',
        enunciado: 'A Ferris wheel turning forwards and an identical one turning backwards cast the same shadow on the wall.',
        correcta: true,
        explicacion: 'The height of the cabin is the same in both cases, and only the floor shadow switches sides. That is why, looking only at the wall, the spectrum of a real signal comes out symmetric, with one forward wheel and one backward wheel for each real one.',
      },
      // 3 · Generated with a figure: the envelope from the two shadows.
      {
        id: 'e16-radio', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          let x, y;
          do { x = entero100(azar, -100, 100); y = entero100(azar, -100, 100); } while (Math.abs(x) < 0.1 || Math.abs(y) < 0.1);
          return {
            enunciado: 'At one instant, the wall shadow is ' + num(x, 2) + ' and the floor shadow is ' + num(y, 2) + '. What is the envelope, the radius of the wheel?',
            figura: (ctx, w, h, C) => plano(ctx, w, h, C, x, y), altoFigura: 150, textoFigura: 'A cabin with its two shadows',
            respuesta: Math.hypot(x, y), tolerancia: 0.01, marcador: 'for example, 0.85', decimales: 2,
            explicacion: 'The radius is the distance from the point to the axis, and it comes from Pythagoras: the square root of ' + num(x, 2) + '² + ' + num(y, 2) + '², which is ' + num(Math.hypot(x, y), 2) + '.',
          };
        },
      },
      // 4 · Generated: the angle needs both shadows.
      {
        id: 'e16-angulo', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          let x, y;
          do { x = entero100(azar, -100, 100); y = entero100(azar, -100, 100); } while (Math.abs(x) < 0.15 || Math.abs(y) < 0.15);
          const g = Math.atan2(y, x) * 180 / Math.PI;
          return {
            enunciado: 'The wall shadow is ' + num(x, 2) + ' and the floor shadow is ' + num(y, 2) + '. At what angle is the cabin, in degrees between −180 and 180, measured from the right and counterclockwise?',
            figura: (ctx, w, h, C) => plano(ctx, w, h, C, x, y), altoFigura: 150, textoFigura: 'A cabin with its two shadows',
            respuesta: g, tolerancia: 1, unidad: '°', marcador: 'for example, −35', decimales: 0,
            explicacion: 'The angle comes from both shadows at once, with the inverse tangent of the ratio between the floor shadow and the wall shadow, taking into account which quadrant the point is in: here, ' + num(g, 0) + '°. With a single shadow there would be two possible angles.',
          };
        },
      },
      // 5 · Generated and hard: the minimum of the instantaneous frequency of two notes.
      {
        id: 'e16-minimo', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const f1 = azar.elegir([80, 100, 120, 150, 180, 200]), d = azar.elegir([10, 20, 30, 40, 50]), a = azar.elegir([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
          const m = f1 - d * a / (1 - a);
          return {
            enunciado: 'A ' + f1 + ' Hz note with volume 1 and a ' + (f1 + d) + ' Hz note with volume ' + num(a, 1) + ' sound at the same time. What is the lowest value the instantaneous frequency of the sum reaches?',
            respuesta: m, tolerancia: 1, unidad: 'Hz', marcador: 'can be negative', decimales: 0,
            explicacion: 'The lowest value occurs when the small wheel points exactly opposite to the big one and the tip passes as close as possible to the axis: ' + f1 + ' − ' + d + ' · ' + num(a, 1) + ' / (1 − ' + num(a, 1) + ') = ' + num(m, 0) + ' Hz.' + (m < 0 ? ' It comes out negative because the ratio ' + num(a, 1) + ' / ' + num(1 - a, 1) + ' exceeds ' + f1 + ' / ' + d + '.' : ''),
          };
        },
      },
      // 6 · Graph: the envelope of a bell.
      {
        id: 'e16-campana', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Which is the **envelope** of this fading bell?',
        figura: figuraCampana, altoFigura: 110, textoFigura: 'A synthetic bell, over one second',
        opciones: [opcionCampana('suave'), opcionCampana('rectificada'), opcionCampana('plana')],
        correcta: 0,
        explicacion: 'The envelope is the radius of the helix: a smooth curve that hugs the peaks and slowly drops. The second one follows every up and down of the wave, and the third ignores that the sound dies out.',
      },
      // 7 · Graph: the spectrum of the analytic signal of a cosine.
      {
        id: 'e16-espectro-analitico', tipo: 'grafica', nivel: 'medio',
        enunciado: 'What spectrum does the analytic signal of a cosine of frequency f have? (Negative frequencies are on the left.)',
        opciones: [espectroDosCaras([[1.5, 2]]), espectroDosCaras([[-1.5, 1], [1.5, 1]]), espectroDosCaras([[-1.5, 2]])],
        correcta: 0,
        explicacion: 'Gabor’s recipe erases the half that turns backwards and doubles the other: a single bar is left at +f, twice as tall. The spectrum in the second drawing is that of the real cosine, with its two half-wheels, and the third would be a wheel turning backwards.',
      },
      // 8 · Slider: delaying a copy by a quarter of a turn.
      {
        id: 'e16-retraso', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'The green wave is a cosine. Delay the orange copy until it is the missing shadow: the path they draw together, on the right, has to be a circle.',
        min: 0, max: 360, paso: 5, inicial: 30, unidad: '°', etiqueta: 'Delay of the copy',
        dibujar: retraso, correcto: v => Math.abs(v - 90) <= 5, solucion: 90,
        explicacion: 'A quarter of a turn, 90°, turns the cosine into a sine, and the path becomes a circle of constant radius. At 0° the two waves are equal and the path is a line; at 180° it is another line, tilted the other way.',
      },
      // 9 · Applied: why you filter before taking the envelope for a bearing.
      {
        id: 'e16-rodamiento-filtro', tipo: 'opcion', nivel: 'medio',
        enunciado: 'To look for a fault in a bearing with envelope analysis, why do you filter around a high-pitched resonance before taking the envelope?',
        opciones: [
          'Because that is where the knocks of the defect dominate, and in the low range the shaft and the gears dominate',
          'Because the Hilbert transform only works at high frequencies',
          'To remove the hum of the power line',
          'Because bearings only vibrate above 5,000 Hz',
        ],
        correcta: 0,
        explicacion: 'Each knock makes high-pitched resonances of the machine ring, and in that band the train of knocks stands out, so its envelope beats at the rhythm of the defect. Without filtering, the envelope is dominated by the shaft.',
      },
      // 10 · Generated and applied: the knock rate of a crack on the outer track.
      {
        id: 'e16-bpfo', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const n = azar.elegir([7, 8, 9, 10, 12]), fr = azar.elegir([10, 15, 20, 25, 30, 40, 50]), r = azar.elegir([0.15, 0.2, 0.25, 0.3]);
          const b = n / 2 * fr * (1 - r);
          return {
            enunciado: 'A bearing has ' + n + ' balls and its shaft turns at ' + fr + ' turns per second. The diameter of a ball is ' + num(r, 2) + ' times that of the circle the balls travel along, and the contact angle is zero. At what rate does a crack on the outer track knock, in knocks per second?',
            respuesta: b, toleranciaRel: 0.02, unidad: 'Hz', decimales: 1,
            explicacion: 'The balls, carried by the cage, pass a fixed point of the outer track a little fewer than n/2 times per turn of the shaft: ' + n + ' / 2 · ' + fr + ' · (1 − ' + num(r, 2) + ') = ' + num(b, 1) + ' Hz. That is the rate that shows up in the spectrum of the envelope.',
          };
        },
      },
      // 11 · Multiple answers, common mistake: when the instantaneous frequency comes out nonsense.
      {
        id: 'e16-disparate', tipo: 'varias', nivel: 'medio',
        enunciado: 'In which cases does the instantaneous frequency calculated with the analytic signal come out as nonsense? Select all that apply.',
        opciones: [
          'Two notes sounding at once',
          'An “aah” with all its harmonics, unfiltered',
          'A clean, sustained whistle',
          'A single harmonic of the “aah,” isolated with a band-pass filter',
        ],
        correctas: [0, 1],
        explicacion: 'It only makes sense with a wheel whose size and speed change slowly. Two notes or a stack of harmonics are several wheels at once; the whistle and the isolated harmonic are a single one, and the frequency comes out clean.',
      },
      // 12 · Common mistake: why unwrap the phase.
      {
        id: 'e16-desenrollar', tipo: 'opcion', nivel: 'basico',
        enunciado: 'Why do you have to unwrap the phase before measuring its rate of change?',
        opciones: [
          'Because the calculated angle jumps from +180° to −180° on every turn and the turns have to be added up',
          'Because the phase comes out in degrees and has to be converted to radians',
          'To remove the noise',
          'Because the phase runs backwards in time',
        ],
        correcta: 0,
        explicacion: 'The angle of a point is measured between −180° and 180°, and without adding up the turns each one looks like a huge jump backwards. Measuring the rotation between two consecutive samples avoids the problem.',
      },
      // 13 · Applied: demodulating an AM signal.
      {
        id: 'e16-am', tipo: 'vf', nivel: 'medio',
        enunciado: 'To listen to an AM station, it is enough to compute the envelope of its signal.',
        correcta: true,
        explicacion: 'In AM the message travels in the size of the wheel, which is the radius of the helix, and the envelope gives it back. For FM you would need the rate of the angle, because there the message travels in how fast it turns.',
      },
      // 14 · Common mistake: Hilbert is not the envelope.
      {
        id: 'e16-hilbert-no-es-envolvente', tipo: 'vf', nivel: 'basico',
        enunciado: 'The Hilbert transform of a signal is its envelope.',
        correcta: false,
        explicacion: 'It is the other shadow, the signal with each wheel turned a quarter of a turn. The envelope is the square root of the sum of the squares of the two shadows, the radius.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
