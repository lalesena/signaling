// Lección 16 · La sombra que falta: términos nuevos y banco de preguntas del examen.
// Lo carga e16.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // El plano de las dos sombras: la de la pared a lo ancho, la del suelo a lo alto, y el punto con sus dos sombras.
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
    G.texto(ctx, cx + lado / 2, cy - 5, 'pared →', { alinear: 'right', color: C.suave, tam: 10, C });
    G.texto(ctx, cx + 6, cy - lado / 2 + 9, 'suelo ↑', { color: C.suave, tam: 10, C });
    G.texto(ctx, cx + k * x + (x >= 0 ? 8 : -8), cy - k * y - 8, '(' + num(x, 2) + '; ' + num(y, 2) + ')', { alinear: x >= 0 ? 'left' : 'right', color: C.texto, tam: 10, peso: 600, C });
  }

  // Una campana que se apaga: una oscilación rápida cuyo tamaño baja poco a poco.
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

  // Espectros de dos caras: barras en -f y +f.
  function espectroDosCaras(barras) {
    return (ctx, w, h, C) => {
      const esc = G.ejes(ctx, { caja: { x: 10, y: 10, w: w - 20, h: h - 30 }, x: [-3, 3], y: [0, 2.3], marcasY: false, marcasX: [-2, 0, 2], formatoX: v => (v === 0 ? '0' : v > 0 ? '+f' : '−f'), rejilla: false, C });
      for (const [f, a] of barras) {
        const x = esc.x(f), y = esc.y(a), ancho = Math.max(6, esc.x(0.3) - esc.x(0));
        ctx.fillStyle = C.espectro; ctx.fillRect(x - ancho / 2, y, ancho, esc.y(0) - y);
      }
    };
  }

  // Retrasar una copia: las dos ondas y el camino que dibujan juntas.
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
      { termino: 'Número complejo', definicion: 'Una pareja de números que dice dónde está un punto del plano: juntos dan un tamaño y un ángulo.', imagen: 'Las dos sombras de la cabina, la de la pared y la del suelo' },
      { termino: 'Señal analítica', definicion: 'La señal junto con su sombra que faltaba: una noria completa que gira, sin frecuencias negativas.', imagen: 'La hélice entera' },
      { termino: 'Transformada de Hilbert', definicion: 'La operación que fabrica la sombra que falta, girando cada noria un cuarto de su propia vuelta.', imagen: 'La sombra en el suelo' },
      { termino: 'Envolvente', definicion: 'El tamaño de la noria en cada instante: el volumen de la señal sin sus vaivenes.', imagen: 'El radio de la hélice' },
      { termino: 'Fase instantánea', definicion: 'El ángulo de la cabina en cada instante, contando las vueltas completas.', imagen: 'El ángulo de la cabina en la hélice' },
      { termino: 'Desenrollar la fase', definicion: 'Sumar una vuelta entera cada vez que el ángulo salta de un extremo al otro, para que crezca sin cortes.', imagen: 'Contar las vueltas de la noria en vez de reiniciar el ángulo' },
      { termino: 'Frecuencia negativa', definicion: 'Una noria que gira al revés; en una señal real, va siempre emparejada con otra igual al derecho.', imagen: 'La noria al revés que proyecta la misma sombra' },
      { termino: 'Demodular', definicion: 'Recuperar el mensaje que viaja en una onda: su tamaño en AM, su velocidad en FM.', imagen: 'Leer el radio o el ritmo del ángulo' },
      { termino: 'Análisis de envolvente', definicion: 'Filtrar una vibración alrededor de una resonancia, sacar su envolvente y mirar su espectro para encontrar el ritmo de unos golpes.', imagen: 'La campanita del metal que suena con cada golpe' },
    ],

    preguntas: [
      // 1 · Básica: qué añade la transformada de Hilbert.
      {
        id: 'e16-hilbert', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué añade la transformada de Hilbert a una señal?',
        opciones: [
          'La otra sombra: la misma señal con cada noria girada un cuarto de vuelta',
          'La envolvente directamente',
          'Su espectro',
          'Una versión de la señal sin ruido',
        ],
        correcta: 0,
        explicacion: 'Fabrica la sombra que falta, la del suelo. La envolvente sale después, al juntar las dos sombras; el espectro y la limpieza de ruido son otras operaciones.',
      },
      // 2 · Verdadero o falso: la sombra de la pared no distingue el sentido de giro.
      {
        id: 'e16-gira-al-reves', tipo: 'vf', nivel: 'basico',
        enunciado: 'Una noria que gira al derecho y otra igual que gira al revés proyectan la misma sombra en la pared.',
        correcta: true,
        explicacion: 'La altura de la cabina es la misma en los dos casos, y solo la sombra del suelo cambia de lado. Por eso, mirando solo la pared, el espectro de una señal real sale simétrico, con una noria al derecho y otra al revés por cada una.',
      },
      // 3 · Generada con figura: la envolvente a partir de las dos sombras.
      {
        id: 'e16-radio', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          let x, y;
          do { x = entero100(azar, -100, 100); y = entero100(azar, -100, 100); } while (Math.abs(x) < 0.1 || Math.abs(y) < 0.1);
          return {
            enunciado: 'En un instante, la sombra de la pared vale ' + num(x, 2) + ' y la del suelo vale ' + num(y, 2) + '. ¿Cuánto vale la envolvente, el radio de la noria?',
            figura: (ctx, w, h, C) => plano(ctx, w, h, C, x, y), altoFigura: 150, textoFigura: 'Una cabina con sus dos sombras',
            respuesta: Math.hypot(x, y), tolerancia: 0.01, marcador: 'por ejemplo, 0,85', decimales: 2,
            explicacion: 'El radio es la distancia del punto al eje, y sale con Pitágoras: la raíz de ' + num(x, 2) + '² + ' + num(y, 2) + '², que son ' + num(Math.hypot(x, y), 2) + '.',
          };
        },
      },
      // 4 · Generada: el ángulo necesita las dos sombras.
      {
        id: 'e16-angulo', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          let x, y;
          do { x = entero100(azar, -100, 100); y = entero100(azar, -100, 100); } while (Math.abs(x) < 0.15 || Math.abs(y) < 0.15);
          const g = Math.atan2(y, x) * 180 / Math.PI;
          return {
            enunciado: 'La sombra de la pared vale ' + num(x, 2) + ' y la del suelo, ' + num(y, 2) + '. ¿En qué ángulo está la cabina, en grados entre −180 y 180, contando desde la derecha y hacia arriba?',
            figura: (ctx, w, h, C) => plano(ctx, w, h, C, x, y), altoFigura: 150, textoFigura: 'Una cabina con sus dos sombras',
            respuesta: g, tolerancia: 1, unidad: '°', marcador: 'por ejemplo, −35', decimales: 0,
            explicacion: 'El ángulo sale de las dos sombras a la vez, con la tangente inversa del cociente entre la del suelo y la de la pared, teniendo en cuenta en qué cuadrante está el punto: aquí, ' + num(g, 0) + '°. Con una sola sombra habría dos ángulos posibles.',
          };
        },
      },
      // 5 · Generada y difícil: el mínimo de la frecuencia instantánea de dos notas.
      {
        id: 'e16-minimo', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const f1 = azar.elegir([80, 100, 120, 150, 180, 200]), d = azar.elegir([10, 20, 30, 40, 50]), a = azar.elegir([0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
          const m = f1 - d * a / (1 - a);
          return {
            enunciado: 'Suenan a la vez una nota de ' + f1 + ' Hz con volumen 1 y otra de ' + (f1 + d) + ' Hz con volumen ' + num(a, 1) + '. ¿Cuál es el valor más bajo que alcanza la frecuencia instantánea de la suma?',
            respuesta: m, tolerancia: 1, unidad: 'Hz', marcador: 'puede ser negativo', decimales: 0,
            explicacion: 'El valor más bajo llega cuando la noria pequeña apunta justo al revés que la grande y la punta pasa lo más cerca del eje: ' + f1 + ' − ' + d + ' · ' + num(a, 1) + ' / (1 − ' + num(a, 1) + ') = ' + num(m, 0) + ' Hz.' + (m < 0 ? ' Sale negativa porque el cociente ' + num(a, 1) + ' / ' + num(1 - a, 1) + ' supera a ' + f1 + ' / ' + d + '.' : ''),
          };
        },
      },
      // 6 · Gráfica: la envolvente de una campana.
      {
        id: 'e16-campana', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Cuál es la **envolvente** de esta campana que se apaga?',
        figura: figuraCampana, altoFigura: 110, textoFigura: 'Una campana sintética, durante un segundo',
        opciones: [opcionCampana('suave'), opcionCampana('rectificada'), opcionCampana('plana')],
        correcta: 0,
        explicacion: 'La envolvente es el radio de la hélice: una curva suave que abraza los picos y baja poco a poco. La segunda sigue cada vaivén de la onda, y la tercera ignora que el sonido se apaga.',
      },
      // 7 · Gráfica: el espectro de la señal analítica de un coseno.
      {
        id: 'e16-espectro-analitico', tipo: 'grafica', nivel: 'medio',
        enunciado: '¿Qué espectro tiene la señal analítica de un coseno de frecuencia f? (Las frecuencias negativas están a la izquierda.)',
        opciones: [espectroDosCaras([[1.5, 2]]), espectroDosCaras([[-1.5, 1], [1.5, 1]]), espectroDosCaras([[-1.5, 2]])],
        correcta: 0,
        explicacion: 'La receta de Gabor borra la mitad que gira al revés y dobla la otra: queda una sola barra en +f, el doble de alta. El espectro del segundo dibujo es el del coseno real, con sus dos medias norias, y el tercero sería una noria que gira al revés.',
      },
      // 8 · Deslizador: retrasar una copia un cuarto de vuelta.
      {
        id: 'e16-retraso', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'La onda verde es un coseno. Retrasa la copia naranja hasta que sea la sombra que falta: el camino que dibujan juntas, a la derecha, tiene que ser un círculo.',
        min: 0, max: 360, paso: 5, inicial: 30, unidad: '°', etiqueta: 'Retraso de la copia',
        dibujar: retraso, correcto: v => Math.abs(v - 90) <= 5, solucion: 90,
        explicacion: 'Un cuarto de vuelta, 90°, convierte el coseno en seno, y el camino se vuelve un círculo de radio constante. Con 0° las dos ondas son iguales y el camino es una recta; con 180° es otra recta, inclinada al revés.',
      },
      // 9 · Aplicada: por qué se filtra antes de la envolvente en un rodamiento.
      {
        id: 'e16-rodamiento-filtro', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Para buscar un fallo en un rodamiento con el análisis de envolvente, ¿por qué se filtra alrededor de una resonancia aguda antes de sacar la envolvente?',
        opciones: [
          'Porque ahí mandan los golpes del defecto, y en los graves mandan el eje y los engranajes',
          'Porque la transformada de Hilbert solo funciona en los agudos',
          'Para quitar el zumbido de la red eléctrica',
          'Porque los rodamientos solo vibran por encima de 5.000 Hz',
        ],
        correcta: 0,
        explicacion: 'Cada golpe hace sonar resonancias agudas de la máquina, y en esa franja el tren de golpes destaca, de modo que su envolvente late al ritmo del defecto. Sin filtrar, la envolvente la domina el eje.',
      },
      // 10 · Generada y aplicada: el ritmo de golpeo de una grieta en la pista de fuera.
      {
        id: 'e16-bpfo', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const n = azar.elegir([7, 8, 9, 10, 12]), fr = azar.elegir([10, 15, 20, 25, 30, 40, 50]), r = azar.elegir([0.15, 0.2, 0.25, 0.3]);
          const b = n / 2 * fr * (1 - r);
          return {
            enunciado: 'Un rodamiento tiene ' + n + ' bolas y su eje gira a ' + fr + ' vueltas por segundo. El diámetro de una bola es ' + num(r, 2) + ' veces el de la circunferencia que recorren las bolas, y el ángulo de contacto es cero. ¿A qué ritmo golpea una grieta de la pista de fuera, en golpes por segundo?',
            respuesta: b, toleranciaRel: 0.02, unidad: 'Hz', decimales: 1,
            explicacion: 'Las bolas, arrastradas por la jaula, pasan por un punto fijo de la pista de fuera algo menos de la mitad de n veces por vuelta del eje: ' + n + ' / 2 · ' + fr + ' · (1 − ' + num(r, 2) + ') = ' + num(b, 1) + ' Hz. Ese es el ritmo que aparece en el espectro de la envolvente.',
          };
        },
      },
      // 11 · Varias, error típico: cuándo la frecuencia instantánea sale un disparate.
      {
        id: 'e16-disparate', tipo: 'varias', nivel: 'medio',
        enunciado: '¿En qué casos la frecuencia instantánea calculada con la señal analítica sale un disparate? Marca todos.',
        opciones: [
          'Dos notas sonando a la vez',
          'Una «aaa» con todos sus armónicos, sin filtrar',
          'Un silbido limpio y sostenido',
          'Un solo armónico de la «aaa», aislado con un paso banda',
        ],
        correctas: [0, 1],
        explicacion: 'Solo tiene sentido con una noria cuyo tamaño y velocidad cambian despacio. Dos notas o una pila de armónicos son varias norias a la vez; el silbido y el armónico aislado son una sola, y la frecuencia sale limpia.',
      },
      // 12 · Error típico: por qué desenrollar la fase.
      {
        id: 'e16-desenrollar', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Por qué hay que desenrollar la fase antes de medir su ritmo de cambio?',
        opciones: [
          'Porque el ángulo calculado salta de +180° a −180° en cada vuelta y hay que sumar las vueltas',
          'Porque la fase sale en grados y hay que pasarla a radianes',
          'Para quitarle el ruido',
          'Porque la fase va hacia atrás en el tiempo',
        ],
        correcta: 0,
        explicacion: 'El ángulo de un punto se mide entre −180° y 180°, y sin sumar las vueltas cada una parece un salto enorme hacia atrás. Medir el giro entre dos muestras seguidas evita el problema.',
      },
      // 13 · Aplicada: demodular una AM.
      {
        id: 'e16-am', tipo: 'vf', nivel: 'medio',
        enunciado: 'Para escuchar una emisora de AM basta con calcular la envolvente de su señal.',
        correcta: true,
        explicacion: 'En AM el mensaje viaja en el tamaño de la noria, que es el radio de la hélice, y la envolvente lo devuelve. Para una FM haría falta el ritmo del ángulo, porque ahí el mensaje viaja en lo deprisa que gira.',
      },
      // 14 · Error típico: Hilbert no es la envolvente.
      {
        id: 'e16-hilbert-no-es-envolvente', tipo: 'vf', nivel: 'basico',
        enunciado: 'La transformada de Hilbert de una señal es su envolvente.',
        correcta: false,
        explicacion: 'Es la otra sombra, la señal con cada noria girada un cuarto de vuelta. La envolvente es la raíz de la suma de los cuadrados de las dos sombras, el radio.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
