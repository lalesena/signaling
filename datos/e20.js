// Lección 20 · Seguir la cresta: de la imagen a la curva de tono. Términos y banco de preguntas del examen.
// Lo carga e20.html (y, más adelante, glosario.html y examenes.html) después de comun/curso.js.
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
    Graficas.texto(ctx, esc.x(1), esc.y(250), 'silencio', { alinear: 'center', color: C.tenue, tam: 11, C });
    Graficas.texto(ctx, 4, h - 22, 'Hz', { color: C.tenue, tam: 10, C });
  }

  Curso.datos('e20', {
    terminos: [
      { termino: 'Cresta', definicion: 'La línea de máxima energía de una componente en un mapa tiempo-frecuencia, como la línea de cumbres de una sierra.', imagen: 'El relieve visto desde arriba, con el caminante' },
      { termino: 'Extracción de crestas', definicion: 'Convertir la imagen de un mapa en una curva, con un valor por instante.', imagen: 'El caminante que cruza el mapa de izquierda a derecha' },
      { termino: 'Método voraz', definicion: 'Elegir en cada instante lo mejor que se ve en ese momento, sin recordar lo anterior; aquí, el punto más brillante de cada columna.', imagen: 'El caminante sin memoria que salta de pico en pico' },
      { termino: 'Castigo de salto (penalización)', definicion: 'Lo que se resta a un camino por cambiar bruscamente de altura, para preferir curvas suaves.', imagen: 'La cuerda que frena al caminante' },
      { termino: 'Inercia (castigo de curvatura)', definicion: 'Lo que se resta por cambiar de pendiente, para que un camino siga en la dirección que llevaba.', imagen: 'El caminante que atraviesa el collado de la X sin girar' },
      { termino: 'Programación dinámica', definicion: 'Una forma de encontrar el mejor camino guardando, para cada punto, solo el mejor camino que llega hasta él.', imagen: 'Las migas de pan en cada campamento' },
      { termino: 'Algoritmo de Viterbi', definicion: 'La programación dinámica aplicada a elegir la secuencia más creíble de estados ocultos; nació para descifrar mensajes con ruido.', imagen: 'Los mismos campamentos, con un móvil al fondo' },
      { termino: 'Curva de tono (contorno de f0)', definicion: 'La altura de una voz o de un instrumento en cada instante.', imagen: 'La cresta de la fundamental, en verde sobre el mapa' },
      { termino: 'Error de octava', definicion: 'Cuando un detector da una nota una octava, u otro múltiplo, por encima o por debajo de la real.', imagen: 'El caminante subido a la cresta de al lado' },
      { termino: 'Error subarmónico', definicion: 'El error de octava hacia abajo: el detector toma dos o tres periodos por uno.', imagen: 'La plantilla que encaja a la segunda vuelta' },
      { termino: 'Fundamental ausente', definicion: 'Una nota que se oye aunque su fundamental no esté en el sonido, porque están sus armónicos.', imagen: 'La pila de epiciclos sin la rueda de abajo' },
      { termino: 'YIN', definicion: 'Un detector de tono que busca el menor desplazamiento que deja la señal casi igual.', imagen: 'La plantilla deslizante con la línea del umbral' },
      { termino: 'Umbral absoluto', definicion: 'El nivel que debe cruzar un valle para aceptarlo como periodo; se elige el primero que lo cruza.', imagen: 'La línea horizontal sobre la curva de diferencias' },
      { termino: 'Sonoro y sordo', definicion: 'Si en un instante hay voz con tono, sonoro, o no la hay, sordo: un silencio, un susurro o una «s».', imagen: 'El caminante que puede bajar al valle y esperar' },
      { termino: 'Cent', definicion: 'La centésima parte de un semitono; 1.200 cents son una octava.', imagen: 'Las rayitas finas entre las teclas del piano' },
    ],

    preguntas: [
      // 1 · Básica: qué es la cresta.
      {
        id: 'e20-cresta', tipo: 'opcion', nivel: 'basico',
        enunciado: '¿Qué es la **cresta** de un mapa tiempo-frecuencia?',
        opciones: ['La curva que une, instante a instante, los puntos de más energía de una componente', 'La frecuencia media de toda la grabación', 'El borde del mapa donde empieza el ruido'],
        correcta: 0,
        explicacion: 'Si el mapa se mira como un relieve, cada componente es una sierra y la cresta es su línea de cumbres. Para una componente que cambia despacio sigue su frecuencia instantánea; la frecuencia media borra justo lo que cambia.',
      },
      // 2 · Gráfica generada: qué curva saca cada regla.
      {
        id: 'e20-reglas', tipo: 'grafica', nivel: 'medio',
        generar: azar => {
          const clave = azar.elegir(['atajo', 'moderado', 'enorme']);
          const nombre = { atajo: 'el atajo, que elige el punto más brillante de cada instante', moderado: 'un castigo de salto moderado', enorme: 'un castigo de salto enorme' }[clave];
          return {
            enunciado: 'Este es el mapa de un silbido que sube, con dos golpes de ruido más fuertes que él. ¿Qué curva saca ' + nombre + '?',
            opciones: [(ctx, w, h, C) => mapaJuguete(ctx, w, h, C, 'atajo'), (ctx, w, h, C) => mapaJuguete(ctx, w, h, C, 'moderado'), (ctx, w, h, C) => mapaJuguete(ctx, w, h, C, 'enorme')],
            correcta: { atajo: 0, moderado: 1, enorme: 2 }[clave],
            explicacion: 'Sin castigo no hay memoria, y cualquier mancha más brillante se lleva la curva. Con un castigo moderado, ir hasta una mancha y volver cuesta más de lo que se gana, y la curva se queda pegada al silbido. Con uno enorme ni siquiera compensa seguir la subida, y la curva se queda plana en la altura donde empezó.',
          };
        },
      },
      // 3 · Deslizador: el castigo de la nota que cambia y la octava de arriba.
      {
        id: 'e20-castigo', tipo: 'deslizador', nivel: 'medio',
        enunciado: 'En este mapa, una nota grave cambia a otra más alta a mitad, y en un tramo central su fundamental casi desaparece y brilla más la octava de arriba. Ajusta el castigo por saltar para que la curva siga la nota sin subirse a la octava y sin llegar tarde al cambio.',
        min: 0, max: 6, paso: 0.05, inicial: 0, unidad: '', etiqueta: 'Castigo por saltar',
        dibujar: (ctx, w, h, valor, C) => dibujarNota(ctx, w, h, Math.round(valor * 100) / 100, C),
        correcto: v => buenoNota(Math.round(v * 100) / 100), solucion: solucionNota,
        explicacion: 'Con poco castigo, la curva se sube a la octava en el tramo donde la fundamental es débil. Con demasiado, cambiar de nota cuesta tanto que la curva llega tarde al cambio o se queda entera en la nota de partida. El buen valor deja que se siga la melodía sin dejarse llevar por la octava.',
      },
      // 4 · Numérica generada: error en semitonos.
      {
        id: 'e20-semitonos', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.elegir([110, 130.81, 146.83, 196, 220]), factor = azar.elegir([2, 0.5, 3, 1 / 3]);
          const fh = f * factor, lectura = factor === 2 ? 'el doble' : factor === 0.5 ? 'la mitad' : factor === 3 ? 'el triple' : 'la tercera parte';
          return {
            enunciado: 'Un detector da ' + num(fh, 1) + ' Hz para una nota de ' + num(f, 2) + ' Hz, que es ' + lectura + '. ¿De cuántos semitonos es el error? Pon un signo menos si se queda por debajo.',
            respuesta: 12 * Math.log2(factor), tolerancia: 0.1, unidad: 'semitonos', decimales: 1,
            explicacion: 'Una octava son 12 semitonos y la distancia depende del cociente: 12·log₂(' + num(factor, 2) + ') = ' + num(12 * Math.log2(factor), 2) + '. Con el triple salen unos 19 semitonos, una octava y una quinta, y por eso YIN dice que «error de octava» es un nombre impropio.',
          };
        },
      },
      // 5 · Numérica generada: el 20 % de YIN.
      {
        id: 'e20-grueso', tipo: 'numero', nivel: 'medio',
        generar: azar => {
          const f = azar.entero(80, 400);
          return {
            enunciado: 'YIN llama error grueso a una estimación que se aparta más de un 20 % de la referencia. Si la nota real es de ' + f + ' Hz, ¿cuál es la frecuencia más alta que todavía no es un error grueso?',
            respuesta: 1.2 * f, tolerancia: 0.5, unidad: 'Hz', decimales: 1,
            explicacion: 'Un 20 % más es multiplicar por 1,2: ' + f + ' × 1,2 = ' + num(1.2 * f, 1) + ' Hz. Equivale a unos 316 cents, algo más de tres semitonos, así que es un criterio permisivo: separa los errores de octava de los desajustes pequeños.',
          };
        },
      },
      // 6 · Verdadero o falso (error típico).
      {
        id: 'e20-doble', tipo: 'vf', nivel: 'medio',
        enunciado: 'El error de octava siempre multiplica o divide la frecuencia exactamente por dos.',
        correcta: false,
        explicacion: 'El detector puede quedarse con tres periodos, y la nota sale una octava y una quinta por debajo, o con el tercer armónico, y sale una octava y una quinta por encima. Por eso De Cheveigné y Kawahara avisan de que «error de octava» es un nombre impropio.',
      },
      // 7 · Verdadero o falso: la programación dinámica.
      {
        id: 'e20-dinamica', tipo: 'vf', nivel: 'basico',
        enunciado: 'La programación dinámica encuentra el mejor camino sin probar todos los caminos posibles.',
        correcta: true,
        explicacion: 'Para cada punto guarda solo el mejor camino que llega hasta él y de dónde venía. En una rejilla de 6 instantes y 5 alturas hay 15.625 caminos y bastan unas 130 cuentas.',
      },
      // 8 · Aplicada: voz grave por teléfono.
      {
        id: 'e20-telefono', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Un hombre canta a 110 Hz por un teléfono que no deja pasar nada por debajo de 300 Hz. Un detector que se queda con el pico más alto del espectro dirá…',
        opciones: ['110 Hz', 'Un armónico: 330 Hz, 440 Hz o más', '0 Hz, porque no hay fundamental'],
        correcta: 1,
        explicacion: 'Los armónicos de 110 y 220 Hz no pasan, así que el pico más alto es uno de los que quedan. El oído, en cambio, sigue oyendo 110 Hz porque reconoce la familia de armónicos: es la fundamental ausente.',
      },
      // 9 · Error típico: el error subarmónico.
      {
        id: 'e20-subarmonico', tipo: 'opcion', nivel: 'medio',
        enunciado: '¿Por qué un detector basado en la autocorrelación puede dar una nota una octava por debajo?',
        opciones: ['Porque la señal también se parece a sí misma desplazada dos periodos', 'Porque el micrófono graba más despacio que la voz', 'Porque la autocorrelación solo ve los agudos'],
        correcta: 0,
        explicacion: 'Lo que se repite cada periodo se repite también cada dos. Si gana la coincidencia a dos periodos, la frecuencia sale a la mitad. YIN lo evita quedándose con el primer valle que baja de un umbral, no con el más hondo.',
      },
      // 10 · Varias: dos silbidos que se cruzan.
      {
        id: 'e20-cruce', tipo: 'varias', nivel: 'medio',
        enunciado: '¿Qué ayuda a no confundir dos silbidos que se cruzan? Marca todo lo que sirva.',
        opciones: ['Castigar los cambios de pendiente (la inercia)', 'Usar pistas como el timbre o la intensidad de cada silbido', 'Quedarse siempre con la línea más brillante', 'Subir mucho el castigo de salto'],
        correctas: [0, 1],
        explicacion: 'El castigo de salto no distingue entre rebotar y seguir recto, porque cuestan lo mismo; la inercia sí. La rama más brillante puede ser la del otro silbido, y un castigo de salto enorme deja la curva plana.',
      },
      // 11 · Aplicada: el karaoke.
      {
        id: 'e20-karaoke', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Según su código, el karaoke libre UltraStar Deluxe, antes de comparar tu nota con la de la canción…',
        opciones: ['La mueve a la octava más cercana a la de la canción', 'Exige que cantes en la misma octava', 'Solo mira si cantas lo bastante fuerte'],
        correcta: 0,
        explicacion: 'Mueve tu nota sumando o restando octavas hasta dejarla cerca de la de la canción, y luego admite 2, 1 o 0 semitonos de margen según la dificultad. Por eso un error de octava del detector, o cantar una octava más abajo, no te quita puntos.',
      },
      // 12 · Aplicada: la patente del Auto-Tune.
      {
        id: 'e20-patente', tipo: 'opcion', nivel: 'medio',
        enunciado: 'Según su patente de 1998, ¿cómo evita el Auto-Tune confundir la nota con su armónico en vocales con poca energía en la fundamental?',
        opciones: ['Comprueba también el periodo doble, con la señal a resolución completa', 'Escucha la letra para saber qué vocal es', 'Se queda siempre con el pico más alto del espectro'],
        correcta: 0,
        explicacion: 'La patente reconoce que, en esas vocales, su método detecta el primer armónico, y por eso prueba también el doble del retraso, con la señal a resolución completa, antes de aceptar un periodo.',
      },
      // 13 · Numérica generada y aplicada: el rango de retrasos de la patente.
      {
        id: 'e20-retraso', tipo: 'numero', nivel: 'reto', temporada: false,
        generar: azar => {
          const L = azar.entero(2, 110);
          return {
            enunciado: 'El Auto-Tune de la patente baja la frecuencia de muestreo de 44.100 Hz a la octava parte, 5.512,5 Hz, y prueba retrasos de 2 a 110 muestras. ¿Qué frecuencia corresponde a un retraso de ' + L + ' muestras?',
            respuesta: 5512.5 / L, toleranciaRel: 0.01, unidad: 'Hz', decimales: 1,
            explicacion: 'El retraso que hace coincidir la señal consigo misma es el periodo, y la frecuencia es su inversa: 5.512,5 / ' + L + ' = ' + num(5512.5 / L, 1) + ' Hz. Con 2 muestras salen unos 2.756 Hz y con 110, unos 50 Hz: el rango de la voz con margen.',
          };
        },
      },
      // 14 · Verdadero o falso con figura: callarse.
      {
        id: 'e20-silencio', tipo: 'vf', nivel: 'basico',
        figura: curvaConHueco, textoFigura: 'Una curva de tono con un silencio en medio',
        enunciado: 'Un buen rastreador de tono debe poder decir «aquí no hay nota» en el hueco de la figura.',
        correcta: true,
        explicacion: 'Sin esa opción, el rastreador inventa una nota en el ruido de fondo. Praat incluye en cada instante un candidato «sordo» y cobra un coste por encender o apagar la voz.',
      },
    ],
    examen: { n: 8, aprobado: 0.7 },
  });
})();
