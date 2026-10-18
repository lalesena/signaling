// Lección 1 · Toda onda es una noria: términos nuevos y banco de preguntas del examen.
// Lo carga e01.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);

  // Una sinusoide de «dur» segundos en un lienzo pequeño, con el tiempo hacia la derecha.
  function onda(ctx, w, h, C, { f = 2, A = 1, fase = 0, dur = 1, color } = {}) {
    const esc = Graficas.ejes(ctx, {
      caja: { x: 10, y: 10, w: w - 20, h: h - 28 }, x: [0, dur], y: [-1.15, 1.15],
      marcasY: false, marcasX: [0, dur], formatoX: v => num(v) + ' s', rejilla: false, C,
    });
    Graficas.curva(ctx, esc, t => A * Math.sin(TAU * f * t + fase), { color: color || C.senal, ancho: 2, n: 600, C });
    return esc;
  }

  Curso.datos('e01', {
    terminos: [
      { termino: 'Señal', definicion: 'Algo que cambia y se puede medir; para una máquina, una lista de números en orden.', imagen: 'La traza que deja la cabina' },
      { termino: 'Sinusoide (seno)', definicion: 'La curva que dibuja la altura de algo que gira a velocidad constante.', imagen: 'La sombra de la noria' },
      { termino: 'Amplitud', definicion: 'La separación máxima respecto al centro; en el sonido, se oye como volumen.', imagen: 'El tamaño de la noria' },
      { termino: 'Frecuencia', definicion: 'Vueltas (ciclos) por segundo; en el sonido, se oye como la nota.', imagen: 'La velocidad de la noria' },
      { termino: 'Hercio (Hz)', definicion: 'Unidad de frecuencia: un ciclo por segundo.', imagen: 'Una vuelta de la noria cada segundo' },
      { termino: 'Periodo', definicion: 'Lo que dura un ciclo; la inversa de la frecuencia.', imagen: 'Lo que tarda una vuelta' },
      { termino: 'Fase', definicion: 'El punto de partida de una onda; desplaza la curva sin cambiar su forma.', imagen: 'Dos cabinas separadas en la misma noria' },
      { termino: 'Movimiento armónico simple', definicion: 'El de todo lo que vuelve a su reposo con una fuerza proporcional a la separación; es la sombra de un giro uniforme.', imagen: 'El muelle junto a la noria' },
    ],

    preguntas: [
      // 1 · Error típico: confundir la nota con el volumen.
      {
        id: 'e01-noria-pequena', tipo: 'opcion', nivel: 'basico',
        enunciado: 'Conviertes en sonido la altura de la cabina de una noria **pequeña** que gira **muy deprisa**. ¿Cómo suena?',
        opciones: ['Aguda y flojita', 'Grave y flojita', 'Aguda y fuerte', 'Grave y fuerte'],
        correcta: 0,
        explicacion: 'La velocidad de giro, la frecuencia, decide la nota: cuanto más deprisa, más aguda. El tamaño, la amplitud, decide el volumen, y una noria pequeña suena flojita. Son dos cosas independientes, y confundirlas es el error más común al empezar.',
      },
      // 2 · Aplicada y generada: pasar de vueltas por minuto a hercios.
      {
        id: 'e01-ventilador', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const rpm = azar.elegir([60, 90, 120, 150, 180, 240]);
          return {
            enunciado: 'Un ventilador de techo da ' + rpm + ' vueltas por minuto. ¿Cuál es su frecuencia de giro, en hercios?',
            respuesta: rpm / 60, tolerancia: 0.01, unidad: 'Hz',
            explicacion: 'Un hercio es una vuelta por segundo, así que hay que pasar de minutos a segundos: ' + rpm + ' vueltas en 60 segundos son ' + num(rpm / 60) + ' vueltas por segundo, es decir, ' + num(rpm / 60) + ' Hz.',
          };
        },
      },
      // 3 · Generada: el periodo es la inversa de la frecuencia.
      {
        id: 'e01-periodo', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.elegir([2, 4, 5, 8, 10, 20, 25, 50]);
          return {
            enunciado: 'Una onda tiene una frecuencia de ' + f + ' Hz. ¿Cuánto dura cada vuelta, su periodo, en segundos?',
            respuesta: 1 / f, toleranciaRel: 0.03, unidad: 's', unidades: { s: 1, ms: 0.001 }, marcador: 'por ejemplo, 0,5',
            explicacion: 'El periodo es la inversa de la frecuencia: si caben ' + f + ' vueltas en un segundo, cada una dura 1/' + f + ' = ' + num(1 / f) + ' s.' + (f === 50 ? ' Es el caso del enchufe: 20 milésimas por vuelta.' : ''),
          };
        },
      },
      // 4 · Visual y generada, con trampa: la más alta no es la de más frecuencia.
      {
        id: 'e01-mas-frecuencia', tipo: 'grafica', nivel: 'basico',
        generar: azar => {
          const fs = azar.barajar([1.5, 3, 5]);
          const otras = azar.barajar([0.72, 1]);
          const amps = fs.map(f => (f === 5 ? 0.38 : otras.pop()));
          return {
            enunciado: '¿Cuál de estas tres ondas tiene **más frecuencia**? Las tres duran un segundo.',
            opciones: fs.map((f, i) => (ctx, w, h, C) => onda(ctx, w, h, C, { f, A: amps[i] })),
            correcta: fs.indexOf(5),
            explicacion: 'La frecuencia se ve en lo apretadas que están las ondas, no en su altura: la buena da 5 vueltas en el segundo, aunque sea la más bajita. La más alta es la de más amplitud, que en un sonido sería la más fuerte, no la más aguda.',
          };
        },
      },
      // 5 · Visual con deslizador y generada.
      {
        id: 'e01-deslizador-vueltas', tipo: 'deslizador', nivel: 'medio',
        generar: azar => {
          const n = azar.entero(2, 5);
          return {
            enunciado: 'Mueve el deslizador hasta que la onda dé exactamente ' + n + ' vueltas en el segundo que se ve.',
            min: 0.5, max: 6, paso: 0.5, inicial: 1, unidad: 'Hz', etiqueta: 'Frecuencia',
            dibujar: (ctx, w, h, valor, C) => onda(ctx, w, h, C, { f: valor }),
            correcto: v => Math.abs(v - n) < 0.01, solucion: n,
            explicacion: n + ' vueltas en un segundo son ' + n + ' Hz: la frecuencia cuenta vueltas por segundo, y cada vuelta se ve como una cresta y un valle.',
          };
        },
      },
      // 6 · Error típico: el ordenador no guarda la curva.
      {
        id: 'e01-guarda-curva', tipo: 'vf', nivel: 'basico',
        enunciado: 'Cuando grabas un audio, el móvil guarda la curva entera, con todos sus puntos.',
        correcta: false,
        explicacion: 'Guarda números sueltos, uno cada poco tiempo: decenas de miles por segundo en un audio, pero sueltos. Entre uno y otro no mira, y la curva la reconstruye quien la dibuja. Cuántos números hacen falta para no perder nada es la pregunta de la lección 2.',
      },
      // 7 · Aplicada: la red eléctrica.
      {
        id: 'e01-enchufe', tipo: 'vf', nivel: 'basico',
        enunciado: 'La tensión del enchufe, en España, sube y baja 50 veces por segundo.',
        correcta: true,
        explicacion: 'La red europea va a 50 Hz. El generador típico de una central térmica tiene dos polos y da 3.000 vueltas por minuto, que son 50 por segundo, y cada vuelta empuja la tensión arriba y abajo una vez. Buena parte de América usa 60 Hz.',
      },
      // 8 · Varias respuestas: qué se mueve como la sombra de una noria.
      {
        id: 'e01-armonico', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Cuáles de estas cosas se mueven, al menos de forma aproximada, como la sombra de una noria? Marca todas las que lo hagan.',
        opciones: ['La púa de un diapasón, después del golpe', 'Una masa colgada de un muelle', 'Un columpio con poco impulso', 'Una pelota que bota en el suelo', 'Unas palmadas'],
        correctas: [0, 1, 2],
        explicacion: 'Las tres primeras vuelven a su sitio con una fuerza proporcional a lo que se separan, y eso basta para el movimiento armónico simple, la sombra de una noria. La pelota cae empujada por su peso, que no crece al separarse, y dibuja arcos de parábola; unas palmadas son golpes cortos, no algo que va y vuelve a su ritmo.',
      },
      // 9 · Visual con figura: dos cabinas en la misma noria.
      {
        id: 'e01-dos-cabinas', tipo: 'opcion', nivel: 'medio', altoFigura: 160,
        figura: (ctx, w, h, C) => Graficas.escenaNoria(ctx, w, h, {
          C, angulo: 0.5, radio: 0.9, segundos: 2,
          cabinas: [{ desfase: 0, color: C.senal }, { desfase: Math.PI / 2, color: C.respuesta }],
          trazas: [
            { f: e => 0.9 * Math.sin(0.5 + Math.PI / 2 - TAU * 0.5 * e), color: C.respuesta },
            { f: e => 0.9 * Math.sin(0.5 - TAU * 0.5 * e), color: C.senal },
          ],
        }),
        textoFigura: 'Una noria con una cabina verde y otra naranja separadas un cuarto de vuelta, y la onda que dibuja cada una',
        enunciado: 'Las dos cabinas de la figura van en la misma noria. ¿En qué se diferencian sus ondas?',
        opciones: ['En la fase: una va un cuarto de vuelta por delante', 'En la frecuencia: una gira más deprisa', 'En la amplitud: una sube más que la otra', 'En nada: son la misma onda en el mismo instante'],
        correcta: 0,
        explicacion: 'Van en la misma noria, así que tienen el mismo tamaño (amplitud) y la misma velocidad (frecuencia). Solo cambia el punto de partida: la naranja va un cuarto de vuelta, 90°, por delante. Eso es la fase.',
      },
      // 10 · Aplicada, con sonido: el La de 440 Hz.
      {
        id: 'e01-la-440', tipo: 'numero', nivel: 'medio',
        audio: () => ({ f: 440, dur: 1.5, volumen: 0.4 }), textoAudio: 'Escuchar el La',
        enunciado: 'Este tono es el La de 440 Hz con el que afina una orquesta. ¿Cuánto dura cada una de sus vibraciones, en milisegundos?',
        respuesta: 1000 / 440, toleranciaRel: 0.02, unidad: 'ms', unidades: { ms: 1, s: 1000 }, decimales: 2,
        explicacion: 'El periodo es la inversa de la frecuencia: 1/440 de segundo son unos 0,00227 s, es decir, 2,27 milisegundos. En cada segundo caben 440 vibraciones, cada una cortísima.',
      },
      // 11 · Error típico: «la fase da igual».
      {
        id: 'e01-fase-importa', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Alguien dice: «la fase da igual, solo cambia dónde empieza la onda». ¿Cuándo deja de dar igual?',
        opciones: ['Cuando se suman dos ondas: según su fase, se refuerzan o se anulan', 'Nunca: la fase no se oye ni se ve', 'Solo cuando la onda es muy aguda', 'Solo cuando la onda es muy grande'],
        correcta: 0,
        explicacion: 'Con una onda sola, la fase solo desplaza la curva. Si sumas dos ondas iguales, con la misma fase se refuerzan y con media vuelta de diferencia se anulan en cada instante. Los auriculares con cancelación de ruido se apoyan en eso.',
      },
      // 12 · Visual y generada: contar hercios en una figura.
      {
        id: 'e01-cuenta-hercios', tipo: 'numero', nivel: 'basico', altoFigura: 130,
        generar: azar => {
          const f = azar.entero(3, 9), A = azar.elegir([0.55, 0.8, 1]);
          return {
            figura: (ctx, w, h, C) => onda(ctx, w, h, C, { f, A }),
            textoFigura: 'Una onda que dura un segundo',
            enunciado: 'La onda de la figura dura justo un segundo. ¿Cuál es su frecuencia, en hercios?',
            respuesta: f, tolerancia: 0.01, unidad: 'Hz',
            explicacion: 'Se cuentan las crestas que caben en el segundo: hay ' + f + ', así que la onda tiene ' + f + ' Hz. Su altura no cuenta para esto, porque eso es la amplitud.',
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
