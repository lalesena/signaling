// Lección 2 · Fotos de una noria: términos nuevos y banco de preguntas del examen.
// Lo carga e02.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
// Tipos de pregunta y campos: ESPECIFICACION.md § 7 y API.md.
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  const num = (x, d) => Curso.num(x, d);
  const G = Graficas;

  // Una sinusoide de un segundo con sus muestras como tallos verdes: «vueltas» ciclos y «fotos» muestras.
  function ondaConFotos(ctx, w, h, C, { vueltas, fotos, fase = 0.35 }) {
    const esc = G.ejes(ctx, { caja: { x: 10, y: 8, w: w - 20, h: h - 30 }, x: [0, 1], y: [-1.2, 1.2], marcasX: false, marcasY: false, rejilla: false, C });
    G.curva(ctx, esc, t => Math.sin(TAU * vueltas * t + fase), { color: C.cuerpo, ancho: 1.3, alfa: 0.6, halo: false, n: 700, C });
    const ts = Array.from({ length: fotos }, (_, n) => n / fotos);
    G.tallos(ctx, esc, ts, ts.map(t => Math.sin(TAU * vueltas * t + fase)), { color: C.senal, radio: 3.6, C });
    G.texto(ctx, w / 2, h - 7, vueltas + ' vueltas, ' + fotos + ' fotos', { alinear: 'center', color: C.tenue, tam: 10, C });
  }

  // La noria con las últimas seis fotos de un flash de «fs» fotos por segundo: la noria da f vueltas por segundo.
  function noriaConFotos(ctx, w, h, C, f, fs) {
    const r = Math.max(24, Math.min((h - 22) / 2.3, w * 0.22)), cx = w * 0.28, cy = 10 + r;
    const cabinas = [];
    for (let i = 0; i < 6; i++) cabinas.push({ desfase: 0.9 + TAU * f * i / fs, color: G.alfa(C.senal, 0.3 + 0.7 * (i + 1) / 6), brillo: false });
    G.noria(ctx, { C, cx, cy, r, angulo: 0, cabinas, radios: 8, neutras: false });
    G.texto(ctx, w * 0.54, h / 2 - 8, 'la noria da ' + num(f) + ' vueltas/s', { color: C.suave, tam: 11, C });
    G.texto(ctx, w * 0.54, h / 2 + 10, 'se ven las seis últimas fotos', { color: C.tenue, tam: 11, C });
  }

  // Una rueda de coche con N radios iguales, quieta.
  function ruedaConRadios(ctx, w, h, C, N) {
    const R = Math.min(w, h) * 0.4, cx = w / 2, cy = h / 2;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.9); ctx.lineWidth = R * 0.16;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.92, 0, TAU); ctx.stroke();
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.45); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.74, 0, TAU); ctx.stroke();
    ctx.strokeStyle = G.alfa(C.cuerpo, 0.9); ctx.lineWidth = Math.max(2, R * 0.06);
    ctx.beginPath();
    for (let k = 0; k < N; k++) { const a = 0.3 + TAU * k / N; ctx.moveTo(cx, cy); ctx.lineTo(cx + R * 0.74 * Math.cos(a), cy + R * 0.74 * Math.sin(a)); }
    ctx.stroke();
    ctx.fillStyle = C.cuerpo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  Curso.datos('e02', {
    terminos: [
      { termino: 'Muestreo', definicion: 'Tomar el valor de una señal a intervalos regulares.', imagen: 'Fotografiar la noria con un flash' },
      { termino: 'Muestra', definicion: 'Cada uno de esos valores: un número, la altura de la señal en un instante.', imagen: 'Un tallo verde: la altura de la cabina en una foto' },
      { termino: 'Frecuencia de muestreo', definicion: 'Cuántas muestras se toman por segundo; se mide en hercios.', imagen: 'Los destellos por segundo del estroboscopio' },
      { termino: 'Periodo de muestreo', definicion: 'El tiempo entre una muestra y la siguiente; la inversa de la frecuencia de muestreo.', imagen: 'El hueco oscuro entre dos destellos' },
      { termino: 'Efecto estroboscópico', definicion: 'Lo que se ve cuando algo que gira se ilumina a destellos: parece ir más despacio, pararse o retroceder.', imagen: 'La noria bajo el flash' },
      { termino: 'Aliasing (solapamiento)', definicion: 'El disfraz de una frecuencia demasiado alta, que en las muestras aparece como otra más baja; en una noria, más lenta, quieta o al revés.', imagen: 'La rueda de carro' },
      { termino: 'Regla de Nyquist', definicion: 'Para no engañarte, la frecuencia de muestreo tiene que ser mayor que el doble de la frecuencia más alta de la señal.', imagen: 'Más de dos fotos por vuelta de la noria más rápida' },
      { termino: 'Frecuencia de Nyquist', definicion: 'La mitad de la frecuencia de muestreo: lo más rápido que las muestras pueden contar sin disfrazarlo.', imagen: 'El espejo donde rebota el pitido' },
      { termino: 'Reconstrucción', definicion: 'Recuperar la curva continua a partir de las muestras; si se cumplió la regla, solo cabe una sin nada por encima de la frecuencia de Nyquist.', imagen: 'La curva suave que pasa por los tallos' },
      { termino: 'Filtro antialias', definicion: 'Un filtro que quita, antes de muestrear, lo que va demasiado rápido para las muestras que se van a tomar.', imagen: 'Un colador delante de la cámara' },
      { termino: 'Cuantización', definicion: 'Redondear cada muestra al peldaño más cercano de una escalera de alturas; en España también se dice cuantificación.', imagen: 'La escalera' },
      { termino: 'Bit', definicion: 'Cada cifra binaria de una muestra: cada bit más duplica los peldaños de la escalera.', imagen: 'Peldaños que se parten en dos' },
      { termino: 'Ruido de cuantización', definicion: 'El pequeño error de redondear cada muestra, que suena como un siseo débil.', imagen: 'La diferencia entre la curva y el peldaño' },
    ],

    preguntas: [
      // 1 · Básica: qué es la frecuencia de muestreo.
      {
        id: 'e02-frecuencia-muestreo', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué es la **frecuencia de muestreo**?',
        opciones: ['Cuántas muestras, o fotos, se toman por segundo', 'La frecuencia más alta que contiene la señal', 'Cuántos bits tiene cada muestra', 'Lo deprisa que gira la noria que se mide'],
        correcta: 0,
        explicacion: 'Es el ritmo del flash, no algo de la noria: cuenta cuántas fotos se hacen por segundo, y por eso se mide en hercios. La frecuencia más alta de la señal es otra cosa, y los bits dicen con cuánto detalle se guarda cada foto.',
      },
      // 2 · Generada: la regla de Nyquist.
      {
        id: 'e02-limite-nyquist', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const F = azar.elegir([1000, 3400, 4000, 8000, 10000, 20000]);
          return {
            enunciado: 'Una señal tiene componentes de hasta **' + num(F) + ' Hz**. ¿Qué valor, en hercios, tiene que superar la frecuencia de muestreo para no engañarte?',
            respuesta: 2 * F, toleranciaRel: 0.01, unidad: 'Hz',
            explicacion: 'Hacen falta más de dos muestras por vuelta de la noria más rápida: la frecuencia de muestreo tiene que ser mayor que 2 × ' + num(F) + ' = ' + num(2 * F) + ' Hz. Justo el doble no basta, y por eso se dice «superar».',
          };
        },
      },
      // 3 · Generada: la frecuencia en que suena un tono doblado.
      {
        id: 'e02-alias-tono', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const fs = azar.elegir([8000, 10000, 16000]);
          const lo = Math.ceil(0.55 * fs / 100), hi = Math.floor(1.45 * fs / 100);
          let f;
          do { f = 100 * azar.entero(lo, hi); } while (Math.abs(f - fs) < 100);
          const fa = Math.abs(f - fs * Math.round(f / fs));
          return {
            enunciado: 'Un tono de **' + num(f) + ' Hz** se muestrea a **' + num(fs) + ' muestras por segundo**, sin filtro previo. ¿A qué frecuencia suena al reproducirlo?',
            respuesta: fa, tolerancia: 10, unidad: 'Hz',
            explicacion: f < fs
              ? 'Lo que pasa de la mitad de la frecuencia de muestreo, ' + num(fs / 2) + ' Hz, se refleja como en un espejo: ' + num(fs) + ' − ' + num(f) + ' = ' + num(fa) + ' Hz.'
              : 'Un tono más rápido que la propia frecuencia de muestreo da vueltas enteras de más entre foto y foto, y esas no se notan: queda ' + num(f) + ' − ' + num(fs) + ' = ' + num(fa) + ' Hz.',
          };
        },
      },
      // 4 · Error típico: «con el doble exacto basta».
      {
        id: 'e02-doble-exacto', tipo: 'vf', nivel: 'medio',
        enunciado: 'Con exactamente dos muestras por vuelta siempre basta para no perder la noria.',
        correcta: false,
        explicacion: 'Con dos fotos justas por vuelta, las fotos pueden caer siempre cuando la cabina pasa por la altura media, y todas las muestras valdrían cero: la onda parecería plana. La regla pide más de dos muestras por vuelta, no dos.',
      },
      // 5 · Error típico: el audio digital no es una escalera.
      {
        id: 'e02-escalera-digital', tipo: 'vf', nivel: 'basico',
        enunciado: 'El audio digital suena «a escalera» porque cada muestra se mantiene como un escalón hasta la siguiente.',
        correcta: false,
        explicacion: 'Los escalones solo están en los dibujos que unen las muestras con tramos horizontales. Si se cumplió la regla de Nyquist, el conversor entrega la curva suave que pasa por todas las muestras, sin escalones.',
      },
      // 6 · Aplicada: por qué 44.100.
      {
        id: 'e02-cd', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué el CD usa 44.100 muestras por segundo?',
        opciones: [
          'Hacía falta algo más del doble de lo que oímos, unos 20.000 Hz, con margen para el filtro, y esa cifra encajaba con los grabadores de vídeo en que se guardaba el audio digital',
          'Porque es justo el doble de lo que oímos',
          'Porque así cabía entera la Novena de Beethoven',
          'Porque es lo más rápido que podía leer el láser',
        ],
        correcta: 0,
        explicacion: 'Para guardar hasta unos 20.000 Hz hace falta más del doble, y conviene dejar margen para el filtro antialias. La cifra exacta salió de los adaptadores que guardaban audio digital en cintas de vídeo, donde 44.100 encajaba con la televisión europea y con la americana. Justo el doble sería 40.000 Hz, y la historia de la Novena de Beethoven habla de la duración del disco, no de las muestras por segundo.',
      },
      // 7 · Visual: en qué dibujo bastan las muestras.
      {
        id: 'e02-bastan-las-muestras', tipo: 'grafica', nivel: 'medio', altoOpcion: 124,
        enunciado: '¿En cuál de estos dibujos las muestras bastan para recuperar la onda?',
        opciones: [
          (ctx, w, h, C) => ondaConFotos(ctx, w, h, C, { vueltas: 2, fotos: 16 }),
          (ctx, w, h, C) => ondaConFotos(ctx, w, h, C, { vueltas: 9, fotos: 10 }),
          (ctx, w, h, C) => ondaConFotos(ctx, w, h, C, { vueltas: 5, fotos: 10, fase: 0 }),
        ],
        correcta: 0,
        explicacion: 'En el primero hay 8 fotos por vuelta, muy por encima de dos. En el segundo hay poco más de una foto por vuelta: los puntos dibujarían una onda lenta que no existe. En el tercero hay justo dos por vuelta, y en este caso caen todas en los cruces por cero: las muestras valen cero y la onda parece plana.',
      },
      // 8 · Visual con deslizador: parar la noria con el flash.
      {
        id: 'e02-flash-quieta', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'Una noria da 3 vueltas por segundo. Mueve el ritmo del flash hasta que parezca quieta.',
        min: 0.5, max: 6, paso: 0.05, inicial: 4, unidad: 'fotos/s', etiqueta: 'Ritmo del flash', alto: 150,
        dibujar: (ctx, w, h, valor, C) => noriaConFotos(ctx, w, h, C, 3, valor),
        correcto: v => { const k = 3 / v; return Math.round(k) >= 1 && Math.abs(k - Math.round(k)) < 0.02; },
        solucion: 3,
        explicacion: 'Si entre dos destellos la noria da una o varias vueltas enteras, la cabina sale siempre en el mismo sitio y parece quieta: con 3 fotos por segundo, una vuelta por foto. También valen 1,5, 1, 0,75, 0,6 o 0,5 fotos por segundo, que son dos, tres, cuatro, cinco o seis vueltas por foto.',
      },
      // 9 · Aplicada, visual y generada: la rueda de un coche a 24 fotos por segundo.
      {
        id: 'e02-rueda-coche', tipo: 'opcion', nivel: 'medio', altoFigura: 130,
        generar: azar => {
          const N = azar.elegir([4, 5, 6, 8]), k = azar.elegir([1, 2]), d = azar.elegir([-0.1, 0, 0.1]);
          const f = +(24 / N * (k + d)).toFixed(3), nf = N * f, a = nf - 24 * Math.round(nf / 24);
          const clave = Math.abs(a) < 0.01 ? 0 : a < 0 ? 1 : 2;
          const razon = clave === 0
            ? 'Es justo ' + (k === 1 ? 'el ritmo' : 'el doble del ritmo') + ' de las 24 fotos por segundo: entre una foto y la siguiente, la rueda gira exactamente lo que separa ' + (k === 1 ? 'dos radios' : 'dos radios, dos veces') + ', todas las fotos son iguales y la rueda parece quieta.'
            : clave === 1
              ? 'Eso queda un poco por debajo de ' + 24 * k + ': en cada foto la rueda ha girado casi lo que separa dos radios, pero no del todo, y parece retroceder despacio.'
              : 'Eso queda un poco por encima de ' + 24 * k + ': en cada foto la rueda ha girado algo más de lo que separa dos radios, y parece avanzar despacio.';
          return {
            figura: (ctx, w, h, C) => ruedaConRadios(ctx, w, h, C, N),
            textoFigura: 'Una rueda con ' + N + ' radios iguales',
            enunciado: 'Un coche se graba a **24 fotos por segundo**. Sus ruedas tienen **' + N + ' radios** iguales y giran a **' + num(f, 2) + ' vueltas por segundo**. ¿Qué se ve en el vídeo?',
            opciones: ['Parece quieta', 'Parece girar despacio hacia atrás', 'Parece girar despacio hacia delante', 'Se ve girar tal cual, a ' + num(f, 2) + ' vueltas por segundo'],
            correcta: clave,
            explicacion: 'Con ' + N + ' radios iguales, la rueda parece la misma cada ' + N + 'ª parte de vuelta, así que la cámara muestrea ' + N + ' × ' + num(f, 2) + ' = ' + num(nf, 1) + ' veces por segundo. ' + razon,
          };
        },
      },
      // 10 · Generada: los peldaños de la escalera.
      {
        id: 'e02-peldanos', tipo: 'numero', nivel: 'basico',
        generar: azar => {
          const N = azar.elegir([3, 4, 8, 12, 16]);
          return {
            enunciado: '¿Cuántos peldaños distintos, es decir, cuántas alturas distintas, puede guardar una muestra de **' + N + ' bits**?',
            respuesta: Math.pow(2, N), tolerancia: 0,
            explicacion: 'Cada bit duplica los peldaños: con 1 bit hay 2, con 2 bits 4, con 3 bits 8, y así hasta ' + num(Math.pow(2, N)) + ' con ' + N + ' bits.' + (N === 16 ? ' Es la escalera de un CD.' : ''),
          };
        },
      },
      // 11 · Aplicada y generada: el caudal del audio sin comprimir.
      {
        id: 'e02-caudal', tipo: 'numero', nivel: 'medio', temporada: false,
        generar: azar => {
          const fs = azar.elegir([8000, 16000, 44100, 48000]), N = azar.elegir([8, 16, 24]), C = azar.elegir([1, 2]);
          return {
            enunciado: 'Un audio sin comprimir se guarda a **' + num(fs) + ' muestras por segundo**, con **' + N + ' bits** por muestra y **' + (C === 1 ? 'un canal' : 'dos canales') + '**. ¿Cuántos bits ocupa cada segundo de audio?',
            respuesta: fs * N * C, toleranciaRel: 0.001, unidad: 'bit/s',
            explicacion: 'Cada segundo hay ' + num(fs) + ' muestras por canal, y cada una ocupa ' + N + ' bits: ' + num(fs) + ' × ' + N + (C === 2 ? ' × 2' : '') + ' = ' + num(fs * N * C) + ' bit/s. El CD, con 44.100 muestras, 16 bits y dos canales, da 1.411.200.',
          };
        },
      },
      // 12 · Aplicada: qué es aliasing y qué no.
      {
        id: 'e02-cuales-aliasing', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Cuáles de estas situaciones son aliasing? Marca todas las que lo sean.',
        opciones: [
          'La rueda que gira al revés en un vídeo',
          'Un pitido que sube y «rebota» hacia abajo al grabarlo con pocas muestras por segundo',
          'Una sierra que parece quieta bajo una luz que parpadea',
          'El siseo de una cinta vieja',
          'La voz apagada del teléfono',
        ],
        correctas: [0, 1, 2],
        explicacion: 'Las tres primeras son algo rápido disfrazado de algo lento al mirarlo a intervalos. El siseo de una cinta es ruido, y el teléfono suena apagado porque le quitan los agudos con un filtro, no porque disfrace frecuencias.',
      },
      // 13 · Error típico: el filtro va antes.
      {
        id: 'e02-filtro-antes', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué el filtro antialias va antes de muestrear y no después?',
        opciones: [
          'Porque, después de muestrear, lo doblado ocupa las mismas frecuencias que lo bueno y ya no se puede separar',
          'Porque después gastaría más batería',
          'Da igual dónde vaya: el resultado es el mismo',
          'Porque después de muestrear ya no hay frecuencias',
        ],
        correcta: 0,
        explicacion: 'Una vez hechas las fotos, la noria rápida y la lenta que se hace pasar por ella dejan exactamente las mismas muestras, y los números no recuerdan cuál era cuál. Hay que quitar lo rápido mientras todavía se distingue.',
      },
      // 14 · Generada: lo que gana cada bit.
      {
        id: 'e02-snr-bits', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const N = azar.elegir([8, 12, 16, 24]);
          return {
            enunciado: 'Un tono que ocupa todo el rango se guarda con **' + N + ' bits**. ¿Cuántos decibelios, más o menos, quedan entre el tono y el ruido de redondeo?',
            respuesta: 6.02 * N + 1.76, tolerancia: 1.5, unidad: 'dB',
            explicacion: 'Cada bit parte los peldaños en dos y baja el ruido unos 6 dB, y a eso se suman unos 1,8 dB: con ' + N + ' bits, 6,02 × ' + N + ' + 1,76 ≈ ' + num(6.02 * N + 1.76, 0) + ' dB.' + (N === 16 ? ' Es el margen de un CD.' : ''),
          };
        },
      },
    ],

    examen: { n: 8, aprobado: 0.7 },
  });
})();
