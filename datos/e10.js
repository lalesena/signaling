// Lección 10 · El ruido tiene colores: términos nuevos y banco de preguntas del examen.
// Lo carga e10.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const num = (x, d) => Curso.num(x, d);
  const hz = v => (v >= 1000 ? num(v / 1000) + ' k' : num(v));

  // Un espectro en decibelios, con la frecuencia en escala de octavas: una recta con un poco de temblor, como el de
  // un ruido promediado. La recta pasa por 0 dB en 1.000 Hz.
  function espectro(ctx, w, h, C, pend, semilla) {
    const esc = Graficas.ejes(ctx, {
      caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [100, 8000], y: [-26, 26], logX: true,
      marcasX: [125, 500, 2000, 8000], formatoX: hz, marcasY: false, rejilla: false, C,
    });
    const az = Senal.azar(semilla || 1), f = [], y = [];
    for (let i = 0; i <= 140; i++) { const fi = 100 * Math.pow(80, i / 140); f.push(fi); y.push(pend * Math.log2(fi / 1000) + 0.7 * az.normal()); }
    Graficas.linea(ctx, esc, f, y, { color: C.espectro, ancho: 2, C });
  }

  // La respuesta sintética de un barrido, con ruido de desviación sigma (en las unidades del dibujo).
  const respuesta = t => {
    const picos = [[1.5, 0.55], [2.8, 0.3], [3.7, 0.8], [4.8, 0.4], [5.6, 1], [7.4, -0.7]];
    let s = 0;
    for (const [t0, a] of picos) s += a * Math.exp(-Math.pow((t - t0) / (a < 0 ? 0.6 : 0.25), 2));
    return 0.3 * s;
  };
  function barrido(ctx, w, h, C, sigma, semilla) {
    const esc = Graficas.ejes(ctx, {
      caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [0, 12], y: [-1.2, 1.2], marcasX: [0, 6, 12], formatoX: v => num(v) + ' ms',
      marcasY: false, rejilla: false, C,
    });
    const az = Senal.azar(semilla || 3), xs = [], ys = [];
    for (let i = 0; i < 180; i++) { const t = 12 * i / 179; xs.push(t); ys.push(respuesta(t) + sigma * az.normal()); }
    Graficas.linea(ctx, esc, xs, ys, { color: sigma > 0.3 ? C.ruido : C.senal, ancho: 1.6, C });
  }

  Curso.datos('e10', {
    terminos: [
      { termino: 'Ruido aleatorio', definicion: 'Una señal cuya muestra siguiente no se puede predecir, aunque sus estadísticas se mantengan.', imagen: 'La maraña coral que no se repite' },
      { termino: 'Ruido blanco', definicion: 'El que tiene la misma potencia en cada hercio de frecuencia: su espectro es plano.', imagen: 'La recta plana; la ducha' },
      { termino: 'Ruido rosa', definicion: 'El que tiene la misma energía en cada octava: su espectro baja 3 dB por octava.', imagen: 'La recta inclinada; la lluvia' },
      { termino: 'Ruido marrón (browniano o rojo)', definicion: 'Un paseo aleatorio, en el que cada muestra es la anterior más un paso al azar: su espectro baja 6 dB por octava.', imagen: 'La recta más inclinada; la cascada' },
      { termino: 'Ruidos azul y violeta', definicion: 'Los que suben 3 y 6 dB por octava: tienen más potencia en los agudos que en los graves.', imagen: 'Las rectas que suben' },
      { termino: 'Densidad espectral de potencia', definicion: 'Cuánta potencia tiene una señal en cada hercio de frecuencia; la potencia de una banda es el área que queda bajo la curva.', imagen: 'El espectro ámbar de un ruido' },
      { termino: 'Banda de octava', definicion: 'La franja de frecuencias entre una frecuencia y su doble.', imagen: 'Las barras del ecualizador de octavas' },
      { termino: 'Ruido térmico', definicion: 'El ruido que produce el movimiento al azar de los electrones de cualquier conductor por el mero hecho de estar a una temperatura.', imagen: 'La antena de Penzias y Wilson' },
      { termino: 'Temperatura de ruido', definicion: 'Una forma de medir un ruido: la temperatura a la que tendría que estar un conductor para producir ese mismo ruido.', imagen: 'Los 3,5 K de más' },
      { termino: 'Fondo cósmico de microondas', definicion: 'La radiación que quedó del universo joven y que llega, casi igual, desde todas las direcciones del cielo.', imagen: 'El exceso de ruido que no se iba' },
      { termino: 'Periodograma', definicion: 'El espectro de potencia calculado con un solo trozo de señal; con ruido, sale peludo.', imagen: 'El espectro peludo de un trozo' },
      { termino: 'Método de Welch', definicion: 'Cortar la señal en trozos con ventana, calcular el espectro de cada uno y promediarlos para alisar el resultado.', imagen: 'El espectro que se alisa al promediar trozos' },
      { termino: 'Relación señal-ruido', definicion: 'Cuántas veces más potencia tiene la señal que el ruido, normalmente en decibelios.', imagen: 'La señal verde asomando sobre el ruido coral' },
      { termino: 'Promediado sincronizado', definicion: 'Sumar muchas repeticiones alineadas con su comienzo para que la señal se quede y el ruido se compense.', imagen: 'El promedio que se limpia barrido a barrido' },
      { termino: 'Potencial evocado', definicion: 'La respuesta eléctrica del sistema nervioso a un estímulo, como un clic, que solo se ve al promediar muchas repeticiones.', imagen: 'La respuesta del cerebro del bebé' },
    ],

    preguntas: [
      // 1 · Básica: el color habla del espectro.
      {
        id: 'e10-blanco', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué quiere decir que un ruido sea **blanco**?',
        opciones: ['Que tiene la misma potencia en cada hercio: su espectro es plano', 'Que sus valores se reparten en forma de campana', 'Que suena igual de fuerte en todas las frecuencias', 'Que no tiene graves'],
        correcta: 0,
        explicacion: 'El color de un ruido habla de su espectro, de cómo reparte la potencia entre las frecuencias: el blanco la reparte igual en cada hercio. La campana es otra propiedad, la de los valores gaussianos, que un ruido blanco puede tener o no. «Suena igual de fuerte en todas las frecuencias» describiría más bien el ruido gris, porque el oído no es igual de sensible a todas.',
      },
      // 2 · Por qué el blanco sisea: se cuenta en octavas.
      {
        id: 'e10-siseo', tipo: 'opcion', nivel: 'medio',
        enunciado: 'El ruido blanco reparte la misma potencia en cada hercio. ¿Por qué suena a siseo, con tanto agudo?',
        opciones: ['Porque cada octava hacia arriba tiene el doble de hercios y, por tanto, el doble de energía', 'Porque los agudos son más fuertes por naturaleza', 'Porque el oído no oye los graves', 'Porque el ruido blanco tiene más potencia por hercio en los agudos'],
        correcta: 0,
        explicacion: 'La potencia por hercio es la misma en todas partes, pero el oído cuenta las notas en octavas, y cada octava hacia arriba contiene el doble de hercios que la anterior: con la misma potencia en cada uno, lleva el doble de energía, 3 dB más. El ruido rosa compensa eso bajando 3 dB por octava.',
      },
      // 3 · Generada: el ruido baja con la raíz del número de repeticiones.
      {
        id: 'e10-raiz', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const n = azar.elegir([4, 9, 16, 25, 64, 100, 400, 900, 2500, 10000]), r = Math.sqrt(n);
          return {
            enunciado: 'Promedias ' + num(n) + ' repeticiones de una medida con ruido. ¿Por cuánto se divide la amplitud del ruido?',
            respuesta: r, toleranciaRel: 0.01, unidad: 'veces', marcador: 'por ejemplo, 3',
            explicacion: 'La señal se suma ' + num(n) + ' veces, pero el ruido, que unas veces va hacia arriba y otras hacia abajo, solo se suma √' + num(n) + ' = ' + num(r) + ' veces. Por eso el ruido queda dividido por ' + num(r) + ', y no por ' + num(n) + '.',
          };
        },
      },
      // 4 · Generada y aplicada: cuántos barridos hacen falta.
      {
        id: 'e10-barridos', tipo: 'numero', nivel: 'reto',
        generar: azar => {
          const s0 = azar.elegir([2, 5, 10, 20]), s1 = azar.elegir([0.1, 0.2, 0.5]), n = Math.round(Math.pow(s0 / s1, 2));
          return {
            enunciado: 'En una prueba de potenciales evocados, cada barrido trae un ruido de ' + num(s0) + ' µV y quieres dejarlo en ' + num(s1, 1) + ' µV. ¿Cuántos barridos tienes que promediar?',
            respuesta: n, toleranciaRel: 0.02, unidad: 'barridos',
            explicacion: 'El ruido que queda es ' + num(s0) + '/√N µV. Para que valga ' + num(s1, 1) + ' µV hace falta √N = ' + num(s0 / s1) + ', es decir, N = ' + num(s0 / s1) + '² = ' + num(n) + ' barridos. Para dividir el ruido por 10 hacen falta 100 barridos, no 10.',
          };
        },
      },
      // 5 · Generada: 3 dB más por cada octava hacia arriba, en el blanco.
      {
        id: 'e10-octavas', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const k = azar.entero(1, 6);
          return {
            enunciado: 'En el ruido blanco, ¿cuántos decibelios más de energía tiene una banda de octava que está ' + k + (k === 1 ? ' octava' : ' octavas') + ' por encima de otra?',
            respuesta: 3.01 * k, tolerancia: 0.2, unidad: 'dB', marcador: 'por ejemplo, 6',
            explicacion: 'Cada octava hacia arriba tiene el doble de hercios y la misma potencia por hercio: el doble de energía, que son 3 dB (3,01 exactamente). ' + k + (k === 1 ? ' octava da' : ' octavas dan') + ' 3,01 × ' + k + ' = ' + num(3.01 * k, 1) + ' dB.',
          };
        },
      },
      // 6 · Generada: relación señal-ruido en decibelios a partir del cociente de amplitudes.
      {
        id: 'e10-snr', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const A = azar.elegir([0.1, 0.5, 2, 3, 5, 10]);
          return {
            enunciado: 'La amplitud de una señal es ' + num(A, 1) + ' veces la del ruido. ¿Cuál es la relación señal-ruido, en decibelios?',
            respuesta: 20 * Math.log10(A), tolerancia: 0.2, unidad: 'dB', marcador: 'por ejemplo, 6',
            explicacion: 'La potencia va con el cuadrado de la amplitud, y de ahí sale el 20 en lugar del 10: 20 · log₁₀(' + num(A, 1) + ') = ' + num(20 * Math.log10(A), 1) + ' dB.' + (A < 1 ? ' Es negativa porque la señal es más débil que el ruido.' : ''),
          };
        },
      },
      // 7 · Error típico: el nombre del marrón.
      {
        id: 'e10-marron-color', tipo: 'vf', nivel: 'basico',
        enunciado: 'El ruido marrón se llama así por su color.',
        correcta: false,
        explicacion: 'Viene del movimiento browniano, el temblor al azar que el botánico Robert Brown observó en 1827 en partículas de polen en agua. El ruido marrón es un paseo aleatorio: cada muestra es la anterior más un paso al azar.',
      },
      // 8 · Error típico: un trozo más largo no alisa el espectro.
      {
        id: 'e10-trozo-largo', tipo: 'vf', nivel: 'medio',
        enunciado: 'Si calculas el espectro de un ruido con un trozo más largo, sale menos peludo.',
        correcta: false,
        explicacion: 'Un trozo más largo da más resolución, es decir, más puntos más juntos en la curva, pero cada punto sigue saltando lo mismo. Para alisar el espectro hay que promediar trozos, como hace el método de Welch.',
      },
      // 9 · Visual: la pendiente del rosa.
      {
        id: 'e10-rosa-grafica', tipo: 'grafica', nivel: 'basico',
        enunciado: '¿Cuál es el espectro del **ruido rosa**? Las tres gráficas están en decibelios y con la frecuencia en escala de octavas.',
        opciones: [(ctx, w, h, C) => espectro(ctx, w, h, C, 0, 4), (ctx, w, h, C) => espectro(ctx, w, h, C, -3.01, 5), (ctx, w, h, C) => espectro(ctx, w, h, C, -6.02, 6)],
        correcta: 1,
        explicacion: 'El rosa baja 3 dB cada vez que se dobla la frecuencia, y con eso reparte la misma energía en cada octava. La recta plana es la del blanco, y la que cae el doble, la del marrón.',
      },
      // 10 · Visual: lo que deja el promedio de cien barridos.
      {
        id: 'e10-promedio-grafica', tipo: 'grafica', nivel: 'medio',
        enunciado: 'Promedias **100 repeticiones** de una respuesta enterrada en ruido. ¿Qué ves?',
        opciones: [(ctx, w, h, C) => barrido(ctx, w, h, C, 0.55, 8), (ctx, w, h, C) => barrido(ctx, w, h, C, 0.055, 9), (ctx, w, h, C) => barrido(ctx, w, h, C, 0.0055, 10)],
        correcta: 1,
        explicacion: 'El ruido baja con la raíz del número de repeticiones: con 100, a la décima parte. La respuesta asoma, aunque no queda limpia. Para dejar el ruido cien veces más pequeño harían falta 10.000 repeticiones, y la primera gráfica es la de un solo barrido.',
      },
      // 11 · Visual: ajustar la pendiente del marrón.
      {
        id: 'e10-pendiente-marron', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Ajusta la recta púrpura a la inclinación del espectro de un **ruido marrón**.',
        min: -9, max: 3, paso: 0.25, inicial: 0, unidad: 'dB por octava', etiqueta: 'Pendiente', decimales: 2,
        dibujar: (ctx, w, h, valor, C) => {
          espectro(ctx, w, h, C, -6.02, 12);
          const esc = Graficas.ejes(ctx, { caja: { x: 12, y: 10, w: w - 24, h: h - 30 }, x: [100, 8000], y: [-26, 26], logX: true, soloEscala: true, C });
          Graficas.linea(ctx, esc, [100, 8000], [valor * Math.log2(100 / 1000), valor * Math.log2(8)], { color: C.plantilla, ancho: 2, guiones: [6, 4], C });
        },
        correcto: v => Math.abs(v + 6) <= 0.5, solucion: -6,
        explicacion: 'El marrón cae 6 dB cada vez que se dobla la frecuencia: es un paseo aleatorio, en el que cada muestra es la anterior más un paso al azar. El rosa cae 3 y el blanco, ninguno.',
      },
      // 12 · Aplicada (salud, solo lo publicado): qué dicen los estudios.
      {
        id: 'e10-estudios', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué dicen los estudios publicados sobre el ruido para dormir o para concentrarse? Marca todo lo que sea cierto.',
        opciones: [
          'Una revisión de 38 estudios concluyó que la calidad de la evidencia de que el ruido continuo mejore el sueño es muy baja',
          'En un estudio de laboratorio de 2026, el ruido rosa redujo el sueño REM',
          'En jóvenes con TDAH, el ruido blanco o rosa dio un beneficio pequeño en tareas de laboratorio',
          'Está demostrado que el ruido marrón mejora la concentración de cualquiera',
          'El ruido blanco no puede dañar el oído, ponga el volumen que ponga',
        ],
        correctas: [0, 1, 2],
        explicacion: 'Son la revisión de Riedy y cols. (2021), el estudio de Basner y cols. (2026) y el metaanálisis de Nigg y cols. (2024). Del ruido marrón no se encontró ni un estudio, y en personas sin TDAH el efecto fue ligeramente negativo. Y el volumen importa: en un estudio con 14 máquinas de ruido para bebés, todas superaban a máximo volumen los 50 dB a 30 cm, y tres pasaban de 85.',
      },
      // 13 · Aplicada: las palomas de Penzias y Wilson.
      {
        id: 'e10-palomas', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Penzias y Wilson sospecharon de su antena, desalojaron a las palomas y la limpiaron a fondo. ¿Qué pasó con el exceso de ruido?',
        opciones: ['Apenas bajó: venía del cielo, igual en todas direcciones', 'Desapareció: eran las palomas', 'Se duplicó', 'Cambiaba con las estaciones'],
        correcta: 0,
        explicacion: 'El exceso, de unos 3,5 K, era igual en todas direcciones y no cambió a lo largo del año: no era de la antena ni de la atmósfera. Era el fondo cósmico de microondas, y les valió la mitad del Nobel de Física de 1978.',
      },
      // 14 · Error típico: el compromiso del método de Welch.
      {
        id: 'e10-welch', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Para el método de Welch cortas la grabación en más trozos y, por tanto, más cortos. ¿Qué pasa con el espectro?',
        opciones: ['Sale más liso, pero con menos resolución', 'Sale más liso y con más resolución', 'Sale más peludo', 'No cambia nada'],
        correcta: 0,
        explicacion: 'Más trozos dan más espectros que promediar, y el temblor baja con la raíz de su número. Pero cada trozo, al ser más corto, distingue peor dos frecuencias cercanas: es la ley del afinador de la lección 5, ahora con ruido.',
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
