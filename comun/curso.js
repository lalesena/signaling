// Curso: el núcleo de interfaz del curso web «Señales, desde cero» (Ena en Curso).
// Script clásico (sin módulos): define la global Curso. Necesita TEMARIO (comun/temario.js) y Graficas
// (comun/graficas.js); usa Senal (comun/senal.js), si está, para los ejemplos sintéticos del laboratorio de voz.
//
// Qué hace solo al cargar la página (Curso.montar, en DOMContentLoaded):
//   - la barra superior con la lección y su progreso, dibujado como muestras: una por reto y otra por el examen;
//   - completa la cabecera (antetítulo, «te llevas», número de retos y de preguntas);
//   - pinta los términos nuevos, monta el examen y el pie con la pregunta que abre la lección siguiente;
//   - prepara el rincón matemático (carga KaTeX al abrirlo) y las fichas de los términos del texto.
// La lección solo escribe su contenido y, en un <script> al final, registra sus retos y su laboratorio.
// Documentación con ejemplos: API.md.
(function (raiz) {
  'use strict';
  if (raiz.Curso && raiz.Curso.version) return;

  const doc = document;
  const TAU = Math.PI * 2;
  const limitar = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const G = () => raiz.Graficas;
  const S = () => raiz.Senal;
  const T = () => raiz.TEMARIO;
  const reducido = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  // Ejecuta fn en el próximo fotograma (o a los 80 ms si la pestaña está oculta y no hay fotogramas).
  const programar = fn => { let hecho = false; const f = () => { if (!hecho) { hecho = true; fn(); } }; requestAnimationFrame(f); setTimeout(f, 80); };
  const dosFotogramas = () => new Promise(r => {
    let hecho = false;
    const f = () => { if (!hecho) { hecho = true; r(); } };
    requestAnimationFrame(() => requestAnimationFrame(f));
    setTimeout(f, 150);
  });
  const esperar = ms => new Promise(r => setTimeout(r, ms));

  // ── Idioma de la página ──────────────────────────────────────────────────────────────────────────────
  // <html lang="en…"> → inglés; cualquier otra cosa → español (el idioma por defecto). Curso.idioma: 'es' | 'en'.
  const idioma = (() => { try { return /^en/i.test((doc.documentElement.getAttribute('lang') || '').trim()) ? 'en' : 'es'; } catch (e) { return 'es'; } })();
  const EN = idioma === 'en';
  // El texto del código común se escribe en español; en las páginas inglesas, tr() lo cambia por su versión inglesa.
  // {0}, {1}… se sustituyen por los argumentos. Una clave sin traducción sale en español y avisa una vez en la consola.
  const DICC = {
    // barra, tema y pie
    'Curso y progreso de la lección': 'Course and lesson progress',
    'Mapa del curso': 'Course map',
    'Señales': 'Signals',
    'Volver al principio de la lección': 'Back to the top of the lesson',
    'Progreso: una muestra por reto y otra por el examen': 'Progress: one sample per challenge and one for the quiz',
    '{0} de {1} retos conseguidos': '{0} of {1} challenges done',
    'Reto {0}': 'Challenge {0}',
    'Examen': 'Quiz',
    'aprobado': 'passed',
    'conseguido': 'done',
    'visto con la solución': 'seen with the solution',
    'por hacer': 'to do',
    'Auto': 'Auto',
    'Agua': 'Water',
    'Papel': 'Paper',
    'Tema automático: sigue al sistema. Pulsa para pasar a agua (oscuro).': 'Automatic theme: follows your system. Press to switch to water (dark).',
    'Tema agua (oscuro). Pulsa para pasar a papel (claro).': 'Water theme (dark). Press to switch to paper (light).',
    'Tema papel (claro). Pulsa para volver al automático.': 'Paper theme (light). Press to go back to automatic.',
    'Lección {0} · {1}': 'Lesson {0} · {1}',
    'Lección {0}': 'Lesson {0}',
    'La pregunta que abre la lección {0}': 'The question that opens lesson {0}',
    'Final del curso': 'End of the course',
    'El examen final →': 'The final exam →',
    'Lecciones': 'Lessons',
    'Primera lección': 'First lesson',
    'Última lección': 'Last lesson',
    'Glosario': 'Glossary',
    'Exámenes': 'Exams',
    'Tu progreso se guarda solo en este navegador.': 'Your progress is saved only in this browser.',
    'Nivel {0} · Lección {1}': 'Level {0} · Lesson {1}',
    'Te llevas': 'You take away',
    '{0} reto': '{0} challenge',
    '{0} retos': '{0} challenges',
    'examen de {0} preguntas': '{0}-question quiz',
    'Todos los términos del curso, en el glosario →': 'All the course terms, in the glossary →',
    'Las fórmulas se ven en LaTeX, tal cual, porque no se ha podido cargar KaTeX (¿sin conexión?).': 'The formulas appear as plain LaTeX because KaTeX could not be loaded (offline?).',
    // retos
    'Fácil': 'Easy',
    'Medio': 'Medium',
    'Difícil': 'Hard',
    'Dificultad: {0}': 'Difficulty: {0}',
    'Por hacer': 'To do',
    'Pista': 'Hint',
    'Otra pista': 'Another hint',
    'Ver la solución': 'Show the solution',
    'Comprobar': 'Check',
    'Reiniciar': 'Reset',
    'Conseguido': 'Done',
    'Con la solución': 'With the solution',
    'Conseguido.': 'Done.',
    'No he podido comprobarlo: {0}': 'I could not check it: {0}',
    'Así se resuelve. Juega con los mandos para verlo por ti mismo.': 'That is how it works out. Play with the controls to see it for yourself.',
    'Todavía no. Sigue probando.': 'Not yet. Keep trying.',
    // animaciones y audio
    'Animar': 'Animate',
    'Pausa': 'Pause',
    'Pausar la animación': 'Pause the animation',
    'Escuchar': 'Listen',
    'Parar': 'Stop',
    // laboratorio En tu voz
    'El micrófono está bloqueado en esta ventana. Dentro del visor de claude.ai es lo normal: no deja grabar. Si abres el curso desde tu ordenador o desde su web, podrás grabar aquí mismo. Mientras, sube un audio grabado con el móvil o prueba con un ejemplo sintético.':
      'The microphone is blocked in this window. Inside the claude.ai viewer that is normal: it does not allow recording. If you open the course from your computer or from its website, you will be able to record right here. In the meantime, upload audio recorded with your phone or try a synthetic example.',
    'El micrófono está bloqueado en esta ventana': 'The microphone is blocked in this window',
    'tu audio no sale del navegador': 'your audio never leaves your browser',
    'Laboratorio: en tu voz': 'Lab: in your voice',
    'En tu voz · laboratorio': 'In your voice · lab',
    'Grabar': 'Record',
    'Subir un audio': 'Upload audio',
    'Ejemplos sintéticos': 'Synthetic examples',
    'Nivel': 'Level',
    'Toda la grabación cargada': 'The whole loaded recording',
    'Graba, sube un audio o elige un ejemplo': 'Record, upload audio or pick an example',
    'ejemplo sintético': 'synthetic example',
    'muestras/s': 'samples/s',
    'pico': 'peak',
    'Tu grabación': 'Your recording',
    'El audio está vacío.': 'The audio is empty.',
    'Es largo: me quedo con los {0} s con más sonido (de {1} a {2} s).': 'It is long: I keep the {0} s with the most sound (from {1} to {2} s).',
    'Casi no hay sonido (pico de {0} dBFS). Acerca el micrófono o sube el volumen de la grabación.': 'There is almost no sound (peak of {0} dBFS). Move the microphone closer or turn up the recording volume.',
    'Satura: el {0} % de las muestras tocan el techo y la onda sale recortada. Aléjate un poco del micrófono.': 'Clipping: {0}% of the samples hit the ceiling and the wave comes out cut off. Move a little farther from the microphone.',
    'Es muy corto: con un segundo o dos se ve mucho mejor.': 'It is very short: with a second or two it looks much better.',
    'No he podido analizar este audio: {0}': 'I could not analyze this audio: {0}',
    'Los ejemplos sintéticos necesitan comun/senal.js, y no ha cargado.': 'The synthetic examples need comun/senal.js, and it did not load.',
    'No he podido generar el ejemplo «{0}»: {1}': 'I could not generate the example “{0}”: {1}',
    'Leyendo «{0}»…': 'Reading “{0}”…',
    'No puedo leer «{0}». Prueba con un WAV, un MP3 o un M4A grabado con el móvil.': 'I cannot read “{0}”. Try a WAV, an MP3 or an M4A recorded with your phone.',
    'El navegador solo deja grabar en páginas seguras (https) o abiertas desde el disco. Sube un audio o prueba con un ejemplo.': 'Your browser only allows recording on secure pages (https) or pages opened from disk. Upload audio or try an example.',
    'No encuentro ningún micrófono. Sube un audio grabado con el móvil o prueba con un ejemplo sintético.': 'I cannot find a microphone. Upload audio recorded with your phone or try a synthetic example.',
    'El micrófono está ocupado por otra aplicación. Ciérrala y vuelve a probar, o sube un audio.': 'The microphone is in use by another application. Close it and try again, or upload audio.',
    'No tengo permiso para usar el micrófono. Puedes darlo en el candado de la barra de direcciones, subir un audio o probar con un ejemplo.': 'I do not have permission to use the microphone. You can grant it with the lock icon in the address bar, upload audio or try an example.',
    'Este navegador no tiene Web Audio: no puedo grabar.': 'This browser has no Web Audio: I cannot record.',
    'Grabando. Silba o canta una nota larga; se para sola a los {0} s.': 'Recording. Whistle or sing a long note; it stops by itself after {0} s.',
    'Graba al menos {0} s': 'Record at least {0} s',
    // ejemplos sintéticos
    'Silencio': 'Silence',
    'Silbido': 'Whistle',
    '«Aaa»': '“Aah”',
    '«Eee»': '“Ehh”',
    '«Iii»': '“Eee”',
    '«Ooo»': '“Ooh”',
    '«Uuu»': '“Ooo”',
    '«Aaa» y luego «iii»': '“Aah” and then “eee”',
    'Silbido que sube y baja': 'Whistle that rises and falls',
    'Frase': 'Phrase',
    'Palmadas': 'Claps',
    'Melodía': 'Melody',
    'Dos silbidos que se cruzan': 'Two whistles that cross',
    'Diapasón': 'Tuning fork',
    'Sirena': 'Siren',
    'Acorde': 'Chord',
    // examen
    'básico': 'basic',
    'medio': 'medium',
    'reto': 'challenge',
    'Pregunta {0} de {1}': 'Question {0} of {1}',
    'Figura de la pregunta': 'Figure for the question',
    'Verdadero': 'True',
    'Falso': 'False',
    'V': 'T',
    'F': 'F',
    'Tu respuesta': 'Your answer',
    'Gráfica {0}': 'Graph {0}',
    'Opción': 'Option',
    'Figura que cambia con el deslizador': 'Figure that changes with the slider',
    'Valor': 'Value',
    'La buena: {0}.': 'The right one: {0}.',
    'Las buenas: {0}.': 'The right ones: {0}.',
    'Era verdadero.': 'It was true.',
    'Era falso.': 'It was false.',
    'La respuesta: {0}.': 'The answer: {0}.',
    'La buena era la gráfica {0}.': 'The right one was graph {0}.',
    'Una solución: {0}.': 'One solution: {0}.',
    'El examen de esta lección todavía no está listo.': 'The quiz for this lesson is not ready yet.',
    'Preguntas de varias lecciones, sacadas al azar de sus bancos.': 'Questions from several lessons, drawn at random from their banks.',
    'Unas preguntas para comprobar que te llevas lo importante. Cambian en cada intento y cada una explica por qué.': 'A few questions to check that you are taking away what matters. They change on every attempt and each one explains why.',
    '{0} preguntas': '{0} questions',
    'de un banco de {0}': 'from a bank of {0}',
    'se aprueba con el {0} %': 'the pass mark is {0}%',
    'tu mejor nota: {0}': 'your best score: {0}',
    '{0} de {1}': '{0} of {1}',
    'Hacer otro intento': 'Try again',
    'Empezar el examen': 'Start the quiz',
    'Respondidas {0} de {1} · aciertos {2}': 'Answered {0} of {1} · correct {2}',
    'Aprobado': 'Passed',
    'Todavía no': 'Not yet',
    'Has acertado {0} de {1}. Lee las explicaciones de las que has fallado: ahí está lo que conviene repasar.': 'You got {0} of {1} right. Read the explanations of the ones you missed: that is what is worth reviewing.',
    'Necesitabas {0} de {1}. Repasa las explicaciones y vuelve a intentarlo: las preguntas cambian.': 'You needed {0} of {1}. Review the explanations and try again: the questions change.',
    'Otro intento, con preguntas nuevas': 'Another attempt, with new questions',
    // vocabulario fijo del contrato (TRADUCCION.md § 4) que una lección puede pedir con Curso.tr
    'Lección': 'Lesson',
    'Paso': 'Step',
    'Sintético': 'Synthetic',
    'Modelo simplificado': 'Simplified model',
  };
  const sinTraducir = new Set();
  function tr(texto, ...args) {
    let t = texto;
    if (EN) {
      if (Object.prototype.hasOwnProperty.call(DICC, texto)) t = DICC[texto];
      else if (!sinTraducir.has(texto)) { sinTraducir.add(texto); console.warn('Curso.tr: sin traducción al inglés: «' + String(texto).slice(0, 80) + '»'); }
    }
    return args.length ? t.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? '' : args[i])) : t;
  }
  const comillas = t => (EN ? '“' + t + '”' : '«' + t + '»');
  const porciento = t => t + (EN ? '%' : ' %');

  const Curso = { version: '1.0' };
  let resolverListo;
  Curso.listo = new Promise(r => { resolverListo = r; });
  Object.defineProperty(Curso, 'leccion', { get: () => (doc.body && doc.body.getAttribute('data-leccion')) || null, enumerable: true });

  // ── Utilidades ───────────────────────────────────────────────────────────────────────────────────────
  // Curso.crear('div', { class, id, html, text, style, on…, otros atributos }, …hijos)
  function crear(etiqueta, attrs, ...hijos) {
    const e = doc.createElement(etiqueta);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (k === 'hidden' || k === 'disabled' || k === 'checked') e[k] = true;
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const h of hijos.flat(Infinity)) { if (h == null || h === false) continue; e.append(h.nodeType ? h : String(h)); }
    return e;
  }
  const buscar = x => (typeof x === 'string' ? doc.querySelector(x.match(/^[\w-]+$/) ? '#' + x : x) : x);
  const escapar = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Texto con un markdown mínimo: **negrita** y *cursiva*. Sirve para enunciados y explicaciones del examen.
  function md(s) {
    return escapar(s)
      .replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(«“])\*([^*\s][^*]*?)\*(?=[\s.,;:!?)»”]|$)/g, '$1<i>$2</i>')
      .replace(/\n/g, '<br>');
  }
  const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  const slug = s => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Formato de números según el idioma de la página: en español Curso.num(44100) → «44.100» y Curso.num(0.25, 2)
  // → «0,25»; en inglés → «44,100» y «0.25».
  function num(x, d) {
    if (G() && G().num) return G().num(x, d);
    return Number.isFinite(+x) ? (EN ? String(+x) : String(+x).replace('.', ',')) : '—';
  }
  // Lee un número escrito por una persona: «0,25», «0.25», «44.100», «1/4», «−3», «2,5 s».
  //   En una página inglesa, «1,000» es mil (coma de miles) y «1.000» es uno; en la española, al revés.
  //   unidades (opcional): { s: 1, ms: 0.001 } multiplica según la unidad escrita; una unidad desconocida da NaN.
  function leerNumero(texto, unidades) {
    if (typeof texto === 'number') return texto;
    const s = String(texto ?? '').trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
    if (!s) return NaN;
    const m = s.match(/^([-+]?(?:\d[\d.,]*|[.,]\d+)(?:e[-+]?\d+)?)(?:\/([\d.,]+))?([a-zA-Zµμ%°]*)$/);
    if (!m) return NaN;
    let v = leerCifra(m[1]);
    if (m[2]) { const den = leerCifra(m[2]); v = den ? v / den : NaN; }
    if (m[3] && unidades) {
      const k = unidades[m[3]] ?? unidades[m[3].toLowerCase()];
      if (k == null) return NaN;
      v *= k;
    }
    return v;
  }
  function leerCifra(t) {
    const coma = t.lastIndexOf(','), punto = t.lastIndexOf('.');
    if (coma >= 0 && punto >= 0) t = coma > punto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
    else if (coma >= 0) t = (EN ? /^[-+]?[1-9]\d{0,2}(,\d{3})+$/ : /^[-+]?[1-9]\d{0,2}(,\d{3}){2,}$/).test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
    else if (punto >= 0 && (EN ? /^[-+]?[1-9]\d{0,2}(\.\d{3}){2,}$/ : /^[-+]?[1-9]\d{0,2}(\.\d{3})+$/).test(t)) t = t.replace(/\./g, '');
    if ((t.match(/[.,]/g) || []).length > 1) return NaN;
    return /^[-+]?$/.test(t) ? NaN : Number(t);
  }
  // Azar con semilla (mulberry32): real(a, b), entero(a, b) (ambos incluidos), elegir(lista), barajar(lista), normal().
  function azar(semilla = Date.now()) {
    let s = (Math.floor(Math.abs(semilla)) >>> 0) || 1;
    const u = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      semilla,
      real: (a = 0, b = 1) => a + (b - a) * u(),
      entero: (a, b) => a + Math.floor(u() * (b - a + 1)),
      elegir: l => l[Math.floor(u() * l.length)],
      barajar: l => { const c = Array.from(l); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(u() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; },
      normal: () => { let a = 0; while (a === 0) a = u(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(TAU * u()); },
    };
  }
  // Nota musical más cercana a una frecuencia, con nombres en español ('La') o ingleses ('A') según el idioma de la
  // página: { nombre: 'La', octava: 4, centimos, frecuencia }
  const NOTAS = EN ? ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
    : ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  function nota(f) {
    if (!(f > 0) || !Number.isFinite(f)) return null;
    const midi = 69 + 12 * Math.log2(f / 440);
    const n = Math.round(midi);
    return { nombre: NOTAS[((n % 12) + 12) % 12], octava: Math.floor(n / 12) - 1, centimos: Math.round((midi - n) * 100), frecuencia: 440 * Math.pow(2, (n - 69) / 12), midi: n };
  }

  const ICONO = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.6v10.8L13 8z"/></svg>',
    stop: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.2"/></svg>',
    pausa: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="2.8" width="3" height="10.4" rx=".8"/><rect x="9.5" y="2.8" width="3" height="10.4" rx=".8"/></svg>',
    grabar: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5"/></svg>',
    subir: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8l4.2 4.3H9.2v4.6H6.8V6.1H3.8zM2.8 12.2h10.4v2H2.8z"/></svg>',
    pista: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5a4.5 4.5 0 0 0-2.6 8.2V11.5h5.2V9.7A4.5 4.5 0 0 0 8 1.5zM5.6 12.6h4.8V14H5.6z"/></svg>',
    ojo: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5C4.6 3.5 2 6.2 1 8c1 1.8 3.6 4.5 7 4.5s6-2.7 7-4.5c-1-1.8-3.6-4.5-7-4.5zm0 7.3A2.8 2.8 0 1 1 8 5.2a2.8 2.8 0 0 1 0 5.6z"/></svg>',
    otra: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5a5.5 5.5 0 1 0 5.4 6.6h-2A3.6 3.6 0 1 1 8 4.4c1 0 1.9.4 2.5 1.1L8.6 7.4H14V2l-2.1 2.1A5.5 5.5 0 0 0 8 2.5z"/></svg>',
    tema: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor"/></svg>',
    noria: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11.5" cy="10.5" r="7.6" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/><circle cx="11.5" cy="10.5" r="7.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-dasharray="0.01 2.4"/><path d="M11.5 10.5L7.4 22M11.5 10.5L15.6 22M11.5 10.5L5.2 6.1M11.5 10.5L11.5 2.9" stroke="currentColor" stroke-opacity=".45" stroke-width="1.1"/><circle cx="18.6" cy="7.8" r="2.5" style="fill:var(--c-senal)"/></svg>',
  };

  // ── Eventos ──────────────────────────────────────────────────────────────────────────────────────────
  const oyentes = {};
  // Curso.on('tema' | 'reto' | 'examen' | 'progreso' | 'listo', fn) → función para dejar de escuchar
  Curso.on = (evento, fn) => { (oyentes[evento] = oyentes[evento] || new Set()).add(fn); return () => oyentes[evento].delete(fn); };
  function emitir(evento, ...args) { for (const f of oyentes[evento] || []) { try { f(...args); } catch (e) { console.error(e); } } }
  if (G() && G().alCambiarTema) G().alCambiarTema(C => emitir('tema', C.oscuro ? 'oscuro' : 'claro', C));

  // ── Progreso (localStorage, con try/catch: si falla, todo sigue funcionando sin guardar) ─────────────
  const CLAVE_PROGRESO = 'senales:progreso:v1';
  let enAutoprueba = false;
  let memoria = null;
  let almacenOk = true;
  function cargarMemoria() {
    if (memoria) return memoria;
    let d = null;
    try { const t = raiz.localStorage.getItem(CLAVE_PROGRESO); d = t ? JSON.parse(t) : null; } catch (e) { almacenOk = false; }
    memoria = d && typeof d === 'object' ? d : {};
    memoria.v = 1;
    memoria.lecciones = memoria.lecciones || {};
    memoria.examenes = memoria.examenes || {};
    return memoria;
  }
  function guardarMemoria() {
    if (enAutoprueba) return false;
    try { raiz.localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(memoria)); return true; } catch (e) { almacenOk = false; return false; }
  }
  const hoy = () => new Date().toISOString().slice(0, 10);
  Curso.progreso = {
    get disponible() { cargarMemoria(); return almacenOk; },
    leer() { return cargarMemoria(); },
    guardar(datos) { if (datos) memoria = datos; cargarMemoria(); const ok = guardarMemoria(); emitir('progreso', memoria); return ok; },
    leccion(id) { const m = cargarMemoria(); return (m.lecciones[id] = m.lecciones[id] || { retos: {}, total: 0 }); },
    reto(leccion, reto) { const l = cargarMemoria().lecciones[leccion]; return (l && l.retos && l.retos[reto]) || null; },
    marcarReto(leccion, reto, { ayuda = false } = {}) {
      const l = Curso.progreso.leccion(leccion);
      const previo = l.retos[reto];
      l.retos[reto] = { ok: true, ayuda: previo && previo.ok ? previo.ayuda && ayuda : ayuda, fecha: hoy() };
      guardarMemoria();
      emitir('progreso', memoria);
    },
    examen(clave) { return cargarMemoria().examenes[clave] || null; },
    guardarExamen(clave, { aciertos, total, aprobado }) {
      const m = cargarMemoria();
      const p = m.examenes[clave] || { intentos: 0, mejor: 0, aprobado: false };
      const nota = total ? aciertos / total : 0;
      p.intentos += 1;
      p.ultimo = nota;
      p.mejor = Math.max(p.mejor || 0, nota);
      p.mejorAciertos = Math.max(p.mejorAciertos || 0, aciertos);
      p.total = total;
      p.aprobado = !!(p.aprobado || aprobado);
      p.fecha = hoy();
      m.examenes[clave] = p;
      guardarMemoria();
      emitir('progreso', memoria);
      return p;
    },
    // Resumen de una lección: { retos, total, ayuda, examen }
    resumen(id) {
      const m = cargarMemoria();
      const l = m.lecciones[id] || { retos: {}, total: 0 };
      const hechos = Object.values(l.retos || {}).filter(r => r.ok);
      return { retos: hechos.length, total: l.total || 0, ayuda: hechos.filter(r => r.ayuda).length, examen: m.examenes[id] || null, visita: l.visita || null };
    },
    borrar() {
      memoria = { v: 1, lecciones: {}, examenes: {} };
      try { raiz.localStorage.removeItem(CLAVE_PROGRESO); } catch (e) { almacenOk = false; }
      emitir('progreso', memoria);
    },
  };

  // ── Tema: automático (sigue al sistema o al visor), agua (oscuro) o papel (claro) ──────────────────────
  const CLAVE_TEMA = 'senales:tema';
  const NOMBRE_TEMA = { auto: 'Auto', agua: 'Agua', papel: 'Papel' };
  function leerTema() { try { const t = raiz.localStorage.getItem(CLAVE_TEMA); return t === 'agua' || t === 'papel' ? t : 'auto'; } catch (e) { return 'auto'; } }
  let temaActual = leerTema();
  // data-tema-previo guarda el data-theme que hubiera antes de tocarlo nosotros (el del visor, si lo puso), para
  // volver a él en «auto». El script de la cabecera de cada página lo apunta antes de aplicar el tema guardado.
  function aplicarTema(t) {
    const h = doc.documentElement;
    if (!h.hasAttribute('data-tema-previo')) h.setAttribute('data-tema-previo', h.getAttribute('data-theme') || '');
    if (t === 'agua') h.setAttribute('data-theme', 'dark');
    else if (t === 'papel') h.setAttribute('data-theme', 'light');
    else {
      const previo = h.getAttribute('data-tema-previo');
      if (previo === 'dark' || previo === 'light') h.setAttribute('data-theme', previo); else h.removeAttribute('data-theme');
    }
  }
  Curso.tema = {
    get actual() { return temaActual; },
    fijar(t) {
      temaActual = t === 'agua' || t === 'papel' ? t : 'auto';
      try { if (temaActual === 'auto') raiz.localStorage.removeItem(CLAVE_TEMA); else raiz.localStorage.setItem(CLAVE_TEMA, temaActual); } catch (e) { /* sin almacén */ }
      aplicarTema(temaActual);
      pintarBotonTema();
    },
    siguiente() { Curso.tema.fijar({ auto: 'agua', agua: 'papel', papel: 'auto' }[temaActual]); },
  };
  let botonTema = null;
  function pintarBotonTema() {
    if (!botonTema) return;
    const titulo = tr({ auto: 'Tema automático: sigue al sistema. Pulsa para pasar a agua (oscuro).', agua: 'Tema agua (oscuro). Pulsa para pasar a papel (claro).', papel: 'Tema papel (claro). Pulsa para volver al automático.' }[temaActual]);
    botonTema.innerHTML = ICONO.tema + '<span class="texto">' + tr(NOMBRE_TEMA[temaActual]) + '</span>';
    botonTema.title = titulo;
    botonTema.setAttribute('aria-label', titulo);
  }

  // ── Barra superior ─────────────────────────────────────────────────────────────────────────────────────
  let barra = null, muestrasEl = null, cuentaEl = null;
  function montarBarra() {
    if (doc.querySelector('.barra') || (doc.body && doc.body.hasAttribute('data-sin-barra'))) { barra = doc.querySelector('.barra'); return; }
    const id = Curso.leccion;
    const L = id && T() && T().porId ? T().porId[id] : null;
    barra = crear('nav', { class: 'barra', 'aria-label': tr('Curso y progreso de la lección') });
    barra.appendChild(crear('a', { class: 'barra-marca', href: 'index.html', title: tr('Mapa del curso'), html: ICONO.noria + '<span class="texto">' + tr('Señales') + '</span>' }));
    if (L) {
      barra.appendChild(crear('a', { class: 'barra-leccion', href: '#', title: tr('Volver al principio de la lección'), onclick: ev => { ev.preventDefault(); raiz.scrollTo({ top: 0, behavior: reducido() ? 'auto' : 'smooth' }); } },
        crear('span', { class: 'num' }, String(L.n).padStart(2, '0')), crear('span', { class: 'titulo' }, L.titulo)));
      muestrasEl = crear('div', { class: 'muestras', role: 'list', 'aria-label': tr('Progreso: una muestra por reto y otra por el examen') });
      cuentaEl = crear('span', { class: 'barra-cuenta', 'aria-live': 'polite' });
      barra.appendChild(crear('div', { class: 'barra-progreso' }, muestrasEl, cuentaEl));
    } else {
      const titulo = (doc.querySelector('h1') || {}).textContent || doc.title;
      barra.appendChild(crear('span', { class: 'barra-leccion' }, crear('span', { class: 'titulo' }, titulo)));
      barra.appendChild(crear('div', { class: 'barra-progreso' }));
    }
    barra.appendChild(botonIdioma());
    botonTema = crear('button', { type: 'button', class: 'barra-tema', onclick: () => Curso.tema.siguiente() });
    barra.appendChild(botonTema);
    pintarBotonTema();
    doc.body.insertBefore(barra, doc.body.firstChild);
  }
  // Botón de idioma, con el aspecto del botón del tema: «EN» en las páginas españolas (enlaza a en/<archivo>) y
  // «ES» en las inglesas (enlaza a ../<archivo>). El archivo es el último trozo de la ruta, o index.html.
  function archivoActual() {
    let a = '';
    try { a = decodeURIComponent((location.pathname || '').split('/').pop() || ''); } catch (e) { a = (location.pathname || '').split('/').pop() || ''; }
    return a || 'index.html';
  }
  function botonIdioma() {
    if (!doc.getElementById('estilo-barra-idioma')) {
      doc.head.appendChild(crear('style', { id: 'estilo-barra-idioma', text: 'a.barra-idioma { text-decoration: none; color: var(--texto-suave); } a.barra-idioma:hover { color: var(--texto); text-decoration: none; }' }));
    }
    const titulo = EN ? 'Leer esta página en español' : 'Read this page in English';
    const destino = () => (EN ? '../' : 'en/') + archivoActual() + (location.hash || '');
    const a = crear('a', { class: 'barra-tema barra-idioma', href: destino(), hreflang: EN ? 'es' : 'en', lang: EN ? 'es' : 'en', title: titulo, 'aria-label': titulo }, EN ? 'ES' : 'EN');
    raiz.addEventListener('hashchange', () => { a.setAttribute('href', destino()); });
    return a;
  }
  // Las muestras: los tallos siguen una sinusoide muestreada; se encienden al superar cada reto.
  function pintarMuestras() {
    if (!muestrasEl) return;
    const id = Curso.leccion;
    const elementos = [...doc.querySelectorAll('.reto[id]')];
    const items = elementos.map((e, i) => {
      const R = retos.get(e.id);
      const p = Curso.progreso.reto(id, e.id);
      return { href: '#' + e.id, nombre: tr('Reto {0}', i + 1) + (R ? ': ' + R.titulo : ''), estado: p && p.ok ? (p.ayuda ? 'ayuda' : 'hecha') : '', examen: false };
    });
    const hayExamen = !!doc.getElementById('examen');
    if (hayExamen) {
      const ex = Curso.progreso.examen(id);
      items.push({ href: '#examen', nombre: tr('Examen'), estado: ex && ex.aprobado ? 'hecha' : '', examen: true });
    }
    muestrasEl.innerHTML = '';
    const n = items.length;
    items.forEach((it, k) => {
      let v = Math.sin(TAU * (k + 0.4) / Math.max(n, 3));
      if (Math.abs(v) < 0.3) v = v < 0 ? -0.3 : 0.3;
      const centro = 19, amp = 14.5;
      const yCab = centro - v * amp;
      const estadoTxt = tr(it.estado === 'hecha' ? (it.examen ? 'aprobado' : 'conseguido') : it.estado === 'ayuda' ? 'visto con la solución' : 'por hacer');
      const a = crear('a', { class: 'muestra' + (it.estado ? ' ' + it.estado : '') + (it.examen ? ' examen' : ''), href: it.href, role: 'listitem', 'aria-label': it.nombre + ': ' + estadoTxt, title: it.nombre + ' · ' + estadoTxt },
        crear('span', { class: 'tallo', style: { top: Math.min(centro, yCab) + 'px', height: Math.abs(centro - yCab) + 'px' } }),
        crear('span', { class: 'cabeza', style: { top: yCab + 'px' } }));
      a.addEventListener('click', ev => {
        const destino = doc.querySelector(it.href);
        if (!destino) return;
        ev.preventDefault();
        destino.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', it.href);
      });
      muestrasEl.appendChild(a);
    });
    const hechos = items.filter(i => !i.examen && i.estado).length;
    const total = items.filter(i => !i.examen).length;
    if (cuentaEl) { cuentaEl.textContent = total ? hechos + '/' + total : ''; cuentaEl.title = tr('{0} de {1} retos conseguidos', hechos, total); }
  }

  // ── Retos ──────────────────────────────────────────────────────────────────────────────────────────────
  const retos = new Map();
  const NIVELES = { facil: ['Fácil', 1], medio: ['Medio', 2], dificil: ['Difícil', 3], easy: ['Fácil', 1], medium: ['Medio', 2], hard: ['Difícil', 3] };
  // Curso.reto(id, { el, titulo, comprobar, resolver, pista, exito, auto = true, nivel, alReiniciar })
  //   comprobar() → true | false | { ok, mensaje }; resolver() deja los mandos en una solución válida.
  //   pista: texto o lista de una o dos pistas (aceptan HTML). exito: HTML de la mini-recompensa.
  // → { revisar(), conseguido, reiniciar(), mensaje(texto), el }
  Curso.reto = function (id, o = {}) {
    const el = o.el ? buscar(o.el) : doc.getElementById(id);
    if (!el) { console.warn('Curso.reto: no encuentro el elemento del reto «' + id + '»'); return { revisar() { return false; }, conseguido: false, reiniciar() {}, mensaje() {} }; }
    if (retos.has(id)) return retos.get(id).api;
    if (!el.id) el.id = id;
    el.classList.add('reto');
    const todos = [...doc.querySelectorAll('.reto')];
    const n = todos.indexOf(el) + 1 || retos.size + 1;
    const titulo = o.titulo || el.getAttribute('data-titulo') || tr('Reto {0}', n);
    const nivelClave = normalizar(o.nivel || el.getAttribute('data-nivel') || (n === 1 ? 'facil' : n >= Math.max(3, todos.length - 1) ? 'dificil' : 'medio')).replace(/\s/g, '');
    const [nivelNombre, nivelN] = NIVELES[nivelClave] || NIVELES.medio;
    const pistas = o.pista == null ? [] : Array.isArray(o.pista) ? o.pista : [o.pista];

    // Marco: cabeza (número, título, dificultad, estado), cuerpo (lo que escribe la lección), éxito y pie.
    let cuerpo = el.querySelector(':scope > .reto-cuerpo');
    if (!cuerpo) {
      cuerpo = crear('div', { class: 'reto-cuerpo' });
      while (el.firstChild) cuerpo.appendChild(el.firstChild);
      el.appendChild(cuerpo);
    }
    const chip = crear('span', { class: 'reto-chip' }, tr('Por hacer'));
    const puntos = [1, 2, 3].map(k => crear('i', { class: k <= nivelN ? 'lleno' : '' }));
    const cabeza = crear('div', { class: 'reto-cabeza' },
      crear('span', { class: 'reto-num' }, tr('Reto {0}', n)),
      crear('h4', { class: 'reto-titulo', id: id + '-titulo' }, titulo),
      crear('span', { class: 'reto-datos' },
        crear('span', { class: 'reto-nivel', title: tr('Dificultad: {0}', tr(nivelNombre).toLowerCase()) }, puntos, crear('span', {}, tr(nivelNombre))),
        chip));
    el.insertBefore(cabeza, el.firstChild);
    el.setAttribute('role', 'group');
    el.setAttribute('aria-labelledby', id + '-titulo');
    const exito = crear('div', { class: 'reto-exito', hidden: true });
    const mensajeEl = crear('p', { class: 'reto-mensaje', 'aria-live': 'polite' });
    const listaPistas = crear('ol', { class: 'reto-pistas' });
    const botones = crear('div', { class: 'botones' });
    const bPista = crear('button', { type: 'button', class: 'boton peque discreto', html: ICONO.pista + '<span>' + tr('Pista') + '</span>' });
    const bSolucion = crear('button', { type: 'button', class: 'boton peque discreto', html: ICONO.ojo + '<span>' + tr('Ver la solución') + '</span>', hidden: true });
    const bComprobar = o.auto === false ? crear('button', { type: 'button', class: 'boton principal peque' }, tr('Comprobar')) : null;
    if (pistas.length) botones.appendChild(bPista); else bSolucion.hidden = false;
    botones.appendChild(bSolucion);
    if (bComprobar) botones.appendChild(bComprobar);
    el.appendChild(exito);
    el.appendChild(crear('div', { class: 'reto-pie' }, mensajeEl, botones, listaPistas));

    const R = { id, el, o, titulo, n, sesion: false, usoSolucion: false };
    let vistas = 0;
    bPista.addEventListener('click', () => {
      if (vistas >= pistas.length) return;
      listaPistas.appendChild(crear('li', { html: pistas[vistas] }));
      vistas += 1;
      if (vistas >= pistas.length) { bPista.hidden = true; bSolucion.hidden = false; }
      else bPista.querySelector('span').textContent = tr('Otra pista');
    });
    bSolucion.addEventListener('click', () => {
      R.usoSolucion = true;
      try { o.resolver && o.resolver(); } catch (e) { console.error(e); }
      dosFotogramas().then(() => R.revisar(true));
    });
    if (bComprobar) bComprobar.addEventListener('click', () => R.revisar(true));

    function evaluar() {
      let r;
      try { r = o.comprobar ? o.comprobar() : false; } catch (e) { console.error(e); return { ok: false, mensaje: tr('No he podido comprobarlo: {0}', e.message) }; }
      if (typeof r === 'boolean') return { ok: r };
      return { ok: !!(r && r.ok), mensaje: r && r.mensaje };
    }
    R.evaluar = evaluar;
    function mensaje(texto, tipo) {
      mensajeEl.textContent = texto || '';
      mensajeEl.className = 'reto-mensaje' + (tipo ? ' ' + tipo : '');
    }
    function pintarConseguido(ayuda) {
      el.classList.add('conseguido');
      chip.textContent = ayuda ? tr('Con la solución') : tr('Conseguido');
      if (o.exito) { exito.innerHTML = o.exito; exito.hidden = false; }
    }
    R.revisar = manual => {
      const r = evaluar();
      if (r.ok) {
        const yaEnSesion = R.sesion;
        R.sesion = true;
        pintarConseguido(R.usoSolucion && !(Curso.progreso.reto(Curso.leccion, id) || {}).ok);
        mensaje(r.mensaje || (R.usoSolucion ? tr('Así se resuelve. Juega con los mandos para verlo por ti mismo.') : tr('Conseguido.')), 'bien');
        if (!yaEnSesion && !enAutoprueba) {
          if (Curso.leccion) Curso.progreso.marcarReto(Curso.leccion, id, { ayuda: R.usoSolucion });
          pintarMuestras();
          emitir('reto', id, { ayuda: R.usoSolucion });
        }
      } else {
        mensaje(r.mensaje || (manual ? tr('Todavía no. Sigue probando.') : ''), manual && !r.mensaje ? 'mal' : '');
      }
      return r.ok;
    };
    R.reiniciar = () => {
      R.sesion = false;
      R.usoSolucion = false;
      exito.hidden = true;
      el.classList.remove('conseguido');
      mensaje('');
      const p = Curso.progreso.reto(Curso.leccion, id);
      chip.textContent = p && p.ok ? (p.ayuda ? tr('Con la solución') : tr('Conseguido')) : tr('Por hacer');
      try { o.alReiniciar && o.alReiniciar(); } catch (e) { console.error(e); }
    };
    R.api = {
      el,
      revisar: () => R.revisar(true),
      reiniciar: R.reiniciar,
      mensaje: (t, tipo) => mensaje(t, tipo),
      get conseguido() { const p = Curso.progreso.reto(Curso.leccion, id); return R.sesion || !!(p && p.ok); },
    };
    retos.set(id, R);
    // Si ya estaba conseguido en otra visita, se ve así desde el principio (y sigue siendo jugable).
    const previo = Curso.progreso.reto(Curso.leccion, id);
    if (previo && previo.ok) { pintarConseguido(previo.ayuda); chip.textContent = previo.ayuda ? tr('Con la solución') : tr('Conseguido'); }
    if (montado) pintarMuestras();
    return R.api;
  };
  // Curso.cambio(id): el estado del reto ha cambiado. Si el reto es automático, se comprueba en el fotograma siguiente.
  const pendientes = new Set();
  let cambioProgramado = false;
  Curso.cambio = function (id) {
    const R = retos.get(id);
    if (!R) return;
    if (R.o.auto === false) return;
    pendientes.add(R);
    if (cambioProgramado) return;
    cambioProgramado = true;
    programar(() => {
      cambioProgramado = false;
      const lista = [...pendientes];
      pendientes.clear();
      for (const r of lista) r.revisar(false);
    });
  };

  // ── Mandos ─────────────────────────────────────────────────────────────────────────────────────────────
  let contador = 0;
  const nuevoId = p => p + '-' + (++contador);
  // Curso.mando(contenedor, { id, etiqueta, min, max, paso, valor, unidad, decimales, formato, alCambiar, reto,
  //                           escala: 'lineal' | 'log', clase })  → { el, input, valor, fijar(v, avisar = true) }
  Curso.mando = function (contenedor, o = {}) {
    const cont = buscar(contenedor);
    const id = o.id || nuevoId('mando');
    const min = o.min ?? 0, max = o.max ?? 1, paso = o.paso ?? (max - min) / 100;
    const log = o.escala === 'log' && min > 0;
    const input = crear('input', { type: 'range', id });
    if (log) { input.min = 0; input.max = 1000; input.step = 1; } else { input.min = min; input.max = max; input.step = paso || 'any'; }
    const salida = crear('output', { for: id, 'aria-hidden': 'true' });
    const el = crear('div', { class: 'mando' + (o.clase ? ' ' + o.clase : '') },
      crear('div', { class: 'mando-fila' }, crear('label', { for: id }, o.etiqueta || ''), salida), input);
    const redondear = v => (paso && !log ? Math.round((v - min) / paso) * paso + min : v);
    const aPos = v => (log ? Math.round(1000 * Math.log(v / min) / Math.log(max / min)) : v);
    const dePos = p => { let v = log ? min * Math.pow(max / min, p / 1000) : +p; if (log && paso) v = Math.round(v / paso) * paso; return limitar(v, min, max); };
    let valor = limitar(o.valor ?? min, min, max);
    const formato = v => (o.formato ? o.formato(v) : num(v, o.decimales) + (o.unidad ? ' ' + o.unidad : ''));
    const pintar = () => {
      const t = formato(valor);
      salida.textContent = t;
      input.setAttribute('aria-valuetext', t);
      const pct = log ? aPos(valor) / 10 : (valor - min) / ((max - min) || 1) * 100;
      input.style.setProperty('--pct', limitar(pct, 0, 100).toFixed(2) + '%');
    };
    input.value = aPos(valor);
    pintar();
    input.addEventListener('input', () => {
      valor = +redondear(dePos(input.value)).toFixed(10);
      pintar();
      try { o.alCambiar && o.alCambiar(valor); } catch (e) { console.error(e); }
      if (o.reto) Curso.cambio(o.reto);
    });
    if (cont) cont.appendChild(el);
    return {
      el, input,
      get valor() { return valor; },
      fijar(v, avisar = true) {
        valor = limitar(+v, min, max);
        input.value = aPos(valor);
        pintar();
        if (avisar) { try { o.alCambiar && o.alCambiar(valor); } catch (e) { console.error(e); } if (o.reto) Curso.cambio(o.reto); }
      },
      formato,
    };
  };
  // Curso.botones(contenedor, [{ id, texto, alPulsar, tipo: 'principal' | 'discreto', icono, pulsado, titulo, peque }])
  //   → { [id]: botón }. Con «pulsado» (true/false) el botón alterna y alPulsar recibe el estado nuevo.
  Curso.botones = function (contenedor, lista = []) {
    const cont = buscar(contenedor);
    let fila = cont;
    if (cont && !cont.classList.contains('botones')) { fila = crear('div', { class: 'botones' }); cont.appendChild(fila); }
    const out = {};
    for (const b of lista) {
      const boton = crear('button', { type: 'button', class: 'boton' + (b.tipo ? ' ' + b.tipo : '') + (b.peque ? ' peque' : ''), title: b.titulo, id: b.idElemento });
      boton.innerHTML = (b.icono && ICONO[b.icono] ? ICONO[b.icono] : '') + '<span>' + escapar(b.texto) + '</span>';
      if (b.pulsado != null) boton.setAttribute('aria-pressed', b.pulsado ? 'true' : 'false');
      boton.addEventListener('click', () => {
        let estado;
        if (b.pulsado != null) { estado = boton.getAttribute('aria-pressed') !== 'true'; boton.setAttribute('aria-pressed', String(estado)); }
        try { b.alPulsar && b.alPulsar(estado, boton); } catch (e) { console.error(e); }
      });
      if (fila) fila.appendChild(boton);
      out[b.id || 'b' + Object.keys(out).length] = boton;
    }
    return out;
  };
  // Curso.eleccion(contenedor, { id, etiqueta, opciones: [{ valor, texto }] | ['a', 'b'], valor, alCambiar, reto })
  //   Elegir entre opciones (radio con aspecto de selector). → { el, valor, fijar(v, avisar = true) }
  Curso.eleccion = function (contenedor, o = {}) {
    const cont = buscar(contenedor);
    const id = o.id || nuevoId('eleccion');
    const opciones = (o.opciones || []).map(x => (typeof x === 'object' ? x : { valor: x, texto: String(x) }));
    let valor = o.valor ?? (opciones[0] && opciones[0].valor);
    const grupo = crear('div', { class: 'eleccion-opciones', role: 'radiogroup', 'aria-labelledby': id + '-nombre' });
    const inputs = opciones.map(op => {
      const inp = crear('input', { type: 'radio', name: id, value: String(op.valor) });
      inp.checked = op.valor === valor;
      inp.addEventListener('change', () => {
        if (!inp.checked) return;
        valor = op.valor;
        try { o.alCambiar && o.alCambiar(valor); } catch (e) { console.error(e); }
        if (o.reto) Curso.cambio(o.reto);
      });
      grupo.appendChild(crear('label', {}, inp, crear('span', {}, op.texto)));
      return [op, inp];
    });
    const el = crear('div', { class: 'eleccion' }, crear('span', { class: 'eleccion-nombre', id: id + '-nombre' }, o.etiqueta || ''), grupo);
    if (cont) cont.appendChild(el);
    return {
      el,
      get valor() { return valor; },
      fijar(v, avisar = true) {
        valor = v;
        for (const [op, inp] of inputs) inp.checked = op.valor === v;
        if (avisar) { try { o.alCambiar && o.alCambiar(valor); } catch (e) { console.error(e); } if (o.reto) Curso.cambio(o.reto); }
      },
    };
  };
  // Curso.campo(contenedor, { id, etiqueta, unidad, unidades, marcador, ancho, alCambiar, alEnviar, reto })
  //   Escribir un número (acepta coma decimal, «1/4» y, con «unidades», cosas como «200 ms»).
  //   → { el, input, valor (número o NaN), texto, fijar(v), marcar('bien' | 'mal' | null) }
  Curso.campo = function (contenedor, o = {}) {
    const cont = buscar(contenedor);
    const id = o.id || nuevoId('campo');
    const input = crear('input', { type: 'text', id, inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', placeholder: o.marcador || '' });
    if (o.ancho) input.style.width = 'calc(' + o.ancho + 'ch + 1.4rem)';   // ancho en caracteres, más el relleno
    const el = crear('div', { class: 'campo' }, crear('label', { for: id }, o.etiqueta || ''),
      crear('span', { class: 'campo-caja' }, input, o.unidad ? crear('span', { class: 'unidad' }, o.unidad) : null));
    input.addEventListener('input', () => {
      el.classList.remove('bien', 'mal');
      try { o.alCambiar && o.alCambiar(leerNumero(input.value, o.unidades), input.value); } catch (e) { console.error(e); }
      if (o.reto) Curso.cambio(o.reto);
    });
    input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); o.alEnviar && o.alEnviar(leerNumero(input.value, o.unidades), input.value); } });
    if (cont) cont.appendChild(el);
    return {
      el, input,
      get valor() { return leerNumero(input.value, o.unidades); },
      get texto() { return input.value; },
      fijar(v) { input.value = typeof v === 'number' ? num(v, o.decimales) : String(v ?? ''); el.classList.remove('bien', 'mal'); },
      marcar(estado) { el.classList.remove('bien', 'mal'); if (estado) el.classList.add(estado); },
    };
  };
  // Curso.lecturas(contenedor, [{ id, nombre, valor, clase: 'senal' | 'respuesta' | 'cuerpo' | 'destacada' }])
  //   Los números del instrumento, siempre a la vista. → { el, fijar(id, valor), clase(id, clase) }
  Curso.lecturas = function (contenedor, lista = []) {
    const cont = buscar(contenedor);
    const el = crear('div', { class: 'lecturas' });
    const mapa = {};
    for (const l of lista) {
      const valor = crear('span', { class: 'valor' }, l.valor ?? '—');
      const caja = crear('div', { class: 'lectura' + (l.clase ? ' ' + l.clase : '') }, crear('span', { class: 'nombre' }, l.nombre || ''), valor);
      mapa[l.id] = { caja, valor, base: 'lectura' + (l.clase ? ' ' + l.clase : '') };
      el.appendChild(caja);
    }
    if (cont) cont.appendChild(el);
    return {
      el,
      fijar(id, v) { const m = mapa[id]; if (m && m.valor.textContent !== String(v)) m.valor.textContent = String(v); },
      clase(id, c) { const m = mapa[id]; if (m) m.caja.className = m.base + (c ? ' ' + c : ''); },
    };
  };
  // Curso.arrastre(elemento, { alBajar(p, ev), alMover(p, ev), alSoltar(p, ev), eje = 'ambos' | 'x' | 'y', cursor })
  //   Ratón, dedo y lápiz con pointer events. p = { x, y } en píxeles CSS del elemento. Si alBajar devuelve false,
  //   no se arrastra. Con eje 'x', la página sigue pudiendo desplazarse en vertical con el dedo.
  Curso.arrastre = function (elemento, o = {}) {
    const e = buscar(elemento);
    const objetivo = e && e.canvas ? e.canvas : e;
    if (!objetivo) return { quitar() {} };
    objetivo.style.touchAction = o.eje === 'x' ? 'pan-y' : o.eje === 'y' ? 'pan-x' : 'none';
    objetivo.classList.add(o.cursor === 'toque' ? 'tocable' : 'arrastrable');
    let activo = null;
    const pos = ev => { const r = objetivo.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    const bajar = ev => {
      if (ev.button > 0) return;
      const p = pos(ev);
      if (o.alBajar && o.alBajar(p, ev) === false) return;
      activo = ev.pointerId;
      try { objetivo.setPointerCapture(ev.pointerId); } catch (err) { /* sin captura */ }
      objetivo.classList.add('arrastrando');
      if (o.eje !== 'x' && o.eje !== 'y') ev.preventDefault();
    };
    const mover = ev => { if (activo !== ev.pointerId) return; o.alMover && o.alMover(pos(ev), ev); };
    const soltar = ev => {
      if (activo !== ev.pointerId) return;
      activo = null;
      objetivo.classList.remove('arrastrando');
      o.alSoltar && o.alSoltar(pos(ev), ev);
    };
    objetivo.addEventListener('pointerdown', bajar);
    objetivo.addEventListener('pointermove', mover);
    objetivo.addEventListener('pointerup', soltar);
    objetivo.addEventListener('pointercancel', soltar);
    return { quitar() { objetivo.removeEventListener('pointerdown', bajar); objetivo.removeEventListener('pointermove', mover); objetivo.removeEventListener('pointerup', soltar); objetivo.removeEventListener('pointercancel', soltar); } };
  };

  // Curso.alVerse(elemento, fn, { margen = '300px' }): llama a fn una sola vez, cuando el elemento se acerca a la
  // pantalla. Es para el cálculo pesado (§ 11 de la especificación): se hace al llegar al paso, nunca todo al cargar.
  // La autoprueba ejecuta antes las que estén pendientes, así que resolver() y comprobar() pueden contar con ellas.
  const pendientesAlVerse = new Set();
  Curso.alVerse = function (elemento, fn, o = {}) {
    const el = buscar(elemento);
    let hecho = false;
    const ejecutar = () => {
      if (hecho) return;
      hecho = true;
      pendientesAlVerse.delete(ejecutar);
      try { fn(); } catch (e) { console.error(e); }
    };
    pendientesAlVerse.add(ejecutar);
    if (!el || typeof IntersectionObserver === 'undefined') { setTimeout(ejecutar, 0); return ejecutar; }
    const io = new IntersectionObserver(ent => { if (ent.some(e => e.isIntersecting)) { io.disconnect(); ejecutar(); } }, { rootMargin: o.margen || '300px' });
    io.observe(el);
    return ejecutar;
  };

  // ── Animaciones: un solo bucle para toda la página, y solo con lo que se ve ───────────────────────────
  const activas = new Set();
  let bucle = null, previo = 0;
  function arrancarBucle() {
    if (bucle) return;
    previo = performance.now();
    const paso = ahora => {
      const dt = Math.min(0.1, Math.max(0, (ahora - previo) / 1000));
      previo = ahora;
      for (const A of activas) {
        A.t += dt;
        try { A.fn(A.t, dt); } catch (e) { console.error(e); activas.delete(A); }
      }
      bucle = activas.size ? requestAnimationFrame(paso) : null;
    };
    bucle = requestAnimationFrame(paso);
  }
  // Curso.animar(lienzoOContenedor, (t, dt) => {}, { autoarranque = true, boton, posicion = 'arriba' })
  //   t: segundos de animación (se detienen en pausa); dt: segundos desde el fotograma anterior.
  //   Solo corre mientras el lienzo se ve; con «prefers-reduced-motion» arranca en pausa. El botón de pausa va en
  //   la esquina del lienzo, o dentro de «boton» (un elemento) si se da; boton: false lo quita.
  // → { pausar(), reanudar(), alternar(), paso(dt), corriendo, t }
  Curso.animar = function (objetivo, fn, o = {}) {
    const el = objetivo && objetivo.canvas ? objetivo.canvas : buscar(objetivo);
    const A = { t: 0, fn, visible: false, pausada: !((o.autoarranque ?? true) && !reducido()) };
    let boton = null;
    if (o.boton !== false && el) {
      const enFila = o.boton && o.boton.nodeType;
      const destino = enFila ? o.boton : el.parentElement;
      if (destino) {
        if (!enFila && getComputedStyle(destino).position === 'static') destino.style.position = 'relative';
        boton = crear('button', { type: 'button', class: enFila ? 'boton peque animar-boton en-fila' : 'animar-boton' + (o.posicion === 'abajo' ? '' : ' arriba') });
        boton.addEventListener('click', () => A.alternar());
        destino.appendChild(boton);
      }
    }
    const pintar = () => {
      if (!boton) return;
      boton.innerHTML = (A.pausada ? ICONO.play : ICONO.pausa) + '<span>' + (A.pausada ? tr('Animar') : tr('Pausa')) + '</span>';
      boton.setAttribute('aria-label', A.pausada ? tr('Animar') : tr('Pausar la animación'));
    };
    const actualizar = () => {
      if (A.visible && !A.pausada) { activas.add(A); arrancarBucle(); } else activas.delete(A);
      pintar();
    };
    A.pausar = () => { A.pausada = true; actualizar(); };
    A.reanudar = () => { A.pausada = false; actualizar(); };
    A.alternar = () => { A.pausada = !A.pausada; actualizar(); };
    A.paso = (dt = 1 / 60) => { A.t += dt; fn(A.t, dt); };
    Object.defineProperty(A, 'corriendo', { get: () => activas.has(A) });
    if (el && typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(entradas => { A.visible = entradas[entradas.length - 1].isIntersecting; actualizar(); }, { rootMargin: '60px' }).observe(el);
    } else { A.visible = true; }
    pintar();
    try { fn(0, 0); } catch (e) { console.error(e); }
    actualizar();
    return A;
  };

  // ── Audio ──────────────────────────────────────────────────────────────────────────────────────────────
  // Nunca suena nada solo: todo empieza con un clic. Un sonido a la vez; fundidos de 10 ms para que no chasquee.
  Curso.audio = (() => {
    let ac = null, actual = null;
    const FORMAS = { seno: 'sine', cuadrada: 'square', sierra: 'sawtooth', triangular: 'triangle' };
    function contexto() {
      if (!ac) {
        const AC = raiz.AudioContext || raiz.webkitAudioContext;
        if (!AC) return null;
        try { ac = new AC(); } catch (e) { return null; }
      }
      if (ac.state === 'suspended') { try { ac.resume(); } catch (e) { /* lo reanudará el próximo clic */ } }
      return ac;
    }
    const nulo = () => ({ parar() {}, sonando: false, alAcabar(f) { setTimeout(f, 0); }, fin: Promise.resolve() });
    function registrar(nodos, duracion) {
      let sonando = true, avisos = [], terminar;
      const fin = new Promise(r => { terminar = r; });
      const acabar = () => {
        if (!sonando) return;
        sonando = false;
        if (actual === h) actual = null;
        for (const f of avisos) { try { f(); } catch (e) { console.error(e); } }
        avisos = [];
        terminar();
      };
      const h = {
        get sonando() { return sonando; },
        alAcabar(f) { if (sonando) avisos.push(f); else setTimeout(f, 0); },
        fin,
        parar() {
          if (!sonando) return;
          const ahora = ac.currentTime;
          try {
            nodos.gain.gain.cancelScheduledValues(ahora);
            nodos.gain.gain.setValueAtTime(nodos.gain.gain.value, ahora);
            nodos.gain.gain.linearRampToValueAtTime(0, ahora + 0.012);
            nodos.fuente.stop(ahora + 0.03);
          } catch (e) { /* ya parado */ }
          acabar();
        },
        nodos,
      };
      nodos.fuente.onended = acabar;
      if (Number.isFinite(duracion)) setTimeout(acabar, (duracion + 0.25) * 1000);
      actual = h;
      return h;
    }
    function envolvente(g, t0, dur, v) {
      const fade = Math.min(0.01, dur / 4);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(v, t0 + fade);
      if (Number.isFinite(dur)) {
        g.gain.setValueAtTime(v, Math.max(t0 + fade, t0 + dur - fade));
        g.gain.linearRampToValueAtTime(0, t0 + dur);
      }
    }
    // Curso.audio.reproducir(x, fs, { volumen = 0.8, normalizar = true }) → { parar(), sonando, alAcabar(fn), fin }
    //   Normaliza el pico a «volumen»; con normalizar: false respeta la amplitud (x se multiplica por volumen).
    function reproducir(x, fs, o = {}) {
      const c = contexto();
      if (!c || !x || !x.length || !(fs > 0)) return nulo();
      parar();
      const vol = limitar(o.volumen ?? 0.8, 0, 1);
      let pico = 0;
      for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > pico) pico = a; }
      const k = o.normalizar === false ? vol : pico > 1e-9 ? vol / pico : 0;
      let datos = x, tasa = fs, buf;
      try { buf = c.createBuffer(1, x.length, fs); } catch (e) {
        // Frecuencia de muestreo que este navegador no admite: se pasa a la del contexto.
        const r = c.sampleRate / fs, n = Math.max(1, Math.round(x.length * r));
        datos = new Float32Array(n);
        for (let i = 0; i < n; i++) { const p = i / r, i0 = Math.floor(p), w = p - i0; datos[i] = (x[i0] || 0) * (1 - w) + (x[i0 + 1] || 0) * w; }
        tasa = c.sampleRate;
        buf = c.createBuffer(1, n, tasa);
      }
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = limitar(datos[i] * k, -1, 1);
      const fuente = c.createBufferSource();
      fuente.buffer = buf;
      const gain = c.createGain();
      const t0 = c.currentTime + 0.02;
      envolvente(gain, t0, buf.duration, 1);
      fuente.connect(gain); gain.connect(c.destination);
      fuente.start(t0);
      return registrar({ fuente, gain }, buf.duration);
    }
    // Curso.audio.tono(f, dur = 1, { forma = 'seno' | 'cuadrada' | 'sierra' | 'triangular', volumen = 0.5 })
    function tono(f, dur = 1, o = {}) {
      const c = contexto();
      if (!c || !(f > 0)) return nulo();
      parar();
      const fuente = c.createOscillator();
      fuente.type = FORMAS[o.forma || 'seno'] || 'sine';
      fuente.frequency.value = f;
      const gain = c.createGain();
      const t0 = c.currentTime + 0.02;
      envolvente(gain, t0, dur, limitar(o.volumen ?? 0.5, 0, 1));
      fuente.connect(gain); gain.connect(c.destination);
      fuente.start(t0);
      fuente.stop(t0 + dur + 0.02);
      return registrar({ fuente, gain }, dur);
    }
    // Curso.audio.continuo(f, { forma, volumen = 0.4 }) → { fijar({ f, volumen }), parar(), sonando }
    //   Un tono que dura hasta que se para, con frecuencia y volumen que se pueden cambiar en vivo.
    function continuo(f, o = {}) {
      const c = contexto();
      if (!c) return Object.assign(nulo(), { fijar() {} });
      parar();
      const fuente = c.createOscillator();
      fuente.type = FORMAS[o.forma || 'seno'] || 'sine';
      fuente.frequency.value = f > 0 ? f : 440;
      const gain = c.createGain();
      const t0 = c.currentTime + 0.02;
      envolvente(gain, t0, Infinity, limitar(o.volumen ?? 0.4, 0, 1));
      fuente.connect(gain); gain.connect(c.destination);
      fuente.start(t0);
      const h = registrar({ fuente, gain }, Infinity);
      h.fijar = ({ f: nf, volumen } = {}) => {
        if (!h.sonando) return;
        const ahora = c.currentTime;
        if (nf > 0) fuente.frequency.setTargetAtTime(nf, ahora, 0.02);
        if (volumen != null) gain.gain.setTargetAtTime(limitar(volumen, 0, 1), ahora, 0.02);
      };
      return h;
    }
    function parar() { if (actual) actual.parar(); }
    // Curso.audio.boton(contenedor, () => ({ x, fs }) | ({ f, dur }), 'Escuchar', { textoParar, clase, volumen })
    //   Botón ▶/■ reutilizable. La función se llama en cada clic, así que puede devolver el estado del momento.
    function boton(contenedor, fuenteFn, texto = tr('Escuchar'), o = {}) {
      const cont = buscar(contenedor);
      const b = crear('button', { type: 'button', class: 'boton audio' + (o.clase ? ' ' + o.clase : '') });
      let h = null;
      const pintar = sonando => {
        b.innerHTML = (sonando ? ICONO.stop : ICONO.play) + '<span>' + escapar(sonando ? (o.textoParar || tr('Parar')) : texto) + '</span>';
        b.classList.toggle('sonando', sonando);
      };
      pintar(false);
      b.addEventListener('click', () => {
        if (h && h.sonando) { h.parar(); return; }
        let s;
        try { s = fuenteFn(); } catch (e) { console.error(e); return; }
        if (!s) return;
        const op = { volumen: s.volumen ?? o.volumen, normalizar: s.normalizar, forma: s.forma };
        h = s.x ? reproducir(s.x, s.fs, op) : s.f ? tono(s.f, s.dur ?? 1, op) : null;
        if (!h || !h.sonando) return;
        pintar(true);
        h.alAcabar(() => pintar(false));
      });
      if (cont) cont.appendChild(b);
      return { el: b, parar() { if (h) h.parar(); } };
    }
    if (doc.addEventListener) doc.addEventListener('visibilitychange', () => { if (doc.hidden) parar(); });
    return { contexto, reproducir, tono, continuo, parar, boton, get sonando() { return !!(actual && actual.sonando); } };
  })();

  // ── Laboratorio «En tu voz» ────────────────────────────────────────────────────────────────────────────
  // Ejemplos sintéticos de Senal.ejemplos, con el nombre que se ve en el botón. Corresponden a los tramos de la
  // grabación de referencia de la serie. Una lección puede pasar además los suyos: { id, nombre, crear: fs => x }.
  const EJEMPLOS = {
    silencio: { nombre: tr('Silencio'), crear: (s, fs) => s.ejemplos.silencio(fs) },
    silbido: { nombre: tr('Silbido'), crear: (s, fs) => s.ejemplos.silbido(fs) },
    aaa: { nombre: tr('«Aaa»'), crear: (s, fs) => s.ejemplos.vocal(fs, { vocal: 'a' }) },
    eee: { nombre: tr('«Eee»'), crear: (s, fs) => s.ejemplos.vocal(fs, { vocal: 'e' }) },
    iii: { nombre: tr('«Iii»'), crear: (s, fs) => s.ejemplos.vocal(fs, { vocal: 'i' }) },
    ooo: { nombre: tr('«Ooo»'), crear: (s, fs) => s.ejemplos.vocal(fs, { vocal: 'o' }) },
    uuu: { nombre: tr('«Uuu»'), crear: (s, fs) => s.ejemplos.vocal(fs, { vocal: 'u' }) },
    aaaIii: { nombre: tr('«Aaa» y luego «iii»'), crear: (s, fs) => s.ejemplos.aaaIii(fs) },
    silbidoQueSube: { nombre: tr('Silbido que sube y baja'), crear: (s, fs) => s.ejemplos.silbidoQueSube(fs) },
    frase: { nombre: tr('Frase'), crear: (s, fs) => s.ejemplos.frase(fs) },
    palmadas: { nombre: tr('Palmadas'), crear: (s, fs) => s.ejemplos.palmadas(fs) },
    melodia: { nombre: tr('Melodía'), crear: (s, fs) => s.ejemplos.melodia(fs) },
    dosSilbidos: { nombre: tr('Dos silbidos que se cruzan'), crear: (s, fs) => s.ejemplos.dosSilbidos(fs) },
    diapason: { nombre: tr('Diapasón'), crear: (s, fs) => s.ejemplos.diapason(fs) },
    sirena: { nombre: tr('Sirena'), crear: (s, fs) => s.ejemplos.sirena(fs) },
    acorde: { nombre: tr('Acorde'), crear: (s, fs) => s.ejemplos.acorde(fs) },
  };
  Curso.ejemplosVoz = EJEMPLOS;
  // ¿Deja el navegador usar el micrófono en esta página? false si una política (p. ej., la del visor de
  // claude.ai) lo bloquea; null si no se sabe hasta intentarlo.
  function microfonoPermitido() {
    try {
      if (!raiz.isSecureContext && location.protocol !== 'file:') return false;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
      const pol = doc.permissionsPolicy || doc.featurePolicy;
      if (pol && pol.allowsFeature) return pol.allowsFeature('microphone');
    } catch (e) { return null; }
    return null;
  }
  const enVisor = () => { try { return raiz.self !== raiz.top; } catch (e) { return true; } };
  const MENSAJE_SIN_MICRO = tr('El micrófono está bloqueado en esta ventana. Dentro del visor de claude.ai es lo normal: no deja grabar. Si abres el curso desde tu ordenador o desde su web, podrás grabar aquí mismo. Mientras, sube un audio grabado con el móvil o prueba con un ejemplo sintético.');
  function remuestrear(x, de, a) {
    if (S() && S().remuestrear) { try { return Float64Array.from(S().remuestrear(x, de, a)); } catch (e) { /* respaldo local */ } }
    const r = a / de, n = Math.max(1, Math.floor(x.length * r));
    let fuente = x;
    if (r < 1) {
      // Media móvil del ancho de una muestra nueva: un filtro paso bajo tosco contra el aliasing.
      const k = Math.max(1, Math.round(1 / r));
      fuente = new Float64Array(x.length);
      let s = 0;
      for (let i = 0; i < x.length; i++) { s += x[i]; if (i >= k) s -= x[i - k]; fuente[i] = s / Math.min(i + 1, k); }
    }
    const y = new Float64Array(n), desfase = r < 1 ? (Math.round(1 / r) - 1) / 2 : 0;
    for (let i = 0; i < n; i++) {
      const p = i / r + desfase, i0 = Math.floor(p), w = p - i0;
      y[i] = (fuente[Math.min(i0, x.length - 1)] || 0) * (1 - w) + (fuente[Math.min(i0 + 1, x.length - 1)] || 0) * w;
    }
    return y;
  }
  // Ventana de n muestras con más energía (para recortar audios largos sin quedarse con el silencio del principio).
  function ventanaMasFuerte(x, fs, n) {
    const bloque = Math.max(1, Math.round(fs * 0.1));
    const nb = Math.ceil(x.length / bloque), e = new Float64Array(nb);
    for (let i = 0; i < x.length; i++) e[Math.floor(i / bloque)] += x[i] * x[i];
    const k = Math.max(1, Math.floor(n / bloque));
    let s = 0, mejor = 0, inicio = 0;
    for (let b = 0; b < nb; b++) {
      s += e[b];
      if (b >= k) s -= e[b - k];
      if (b >= k - 1 && s > mejor) { mejor = s; inicio = b - k + 1; }
    }
    return Math.min(inicio * bloque, Math.max(0, x.length - n));
  }
  function decodificar(c, buf) {
    return new Promise((ok, mal) => {
      try {
        const p = c.decodeAudioData(buf, ok, mal);
        if (p && p.then) p.then(ok, mal);
      } catch (e) { mal(e); }
    });
  }
  function aMono(audio) {
    const n = audio.length, canales = audio.numberOfChannels, x = new Float64Array(n);
    for (let c = 0; c < canales; c++) { const d = audio.getChannelData(c); for (let i = 0; i < n; i++) x[i] += d[i] / canales; }
    return x;
  }
  const labs = [];
  // Curso.voz(contenedor, { ejemplos: ['silbido', 'aaa'], inicial, fsAnalisis = null, fsEjemplos = 22050, maxSegundos = 10,
  //                         minSegundos = 3, alCargar: (x, fs, nombre, info) => {}, alDibujarVista, alTocarVista, titulo })
  //   Tres fuentes: grabar (de 3 a 10 s), subir un audio o un ejemplo sintético. Lo cargado se pasa a mono, se le quita
  //   la continua, se recorta a maxSegundos (los de más sonido) y se remuestrea a fsAnalisis si se pide.
  // → { el, panel, vista, actual, cargar(x, fs, nombre, opciones), ejemplo(nombre), aviso(texto, tipo), redibujarVista() }
  Curso.voz = function (contenedor, o = {}) {
    const cont = buscar(contenedor);
    const maxS = o.maxSegundos ?? 10, minS = Math.min(o.minSegundos ?? 3, maxS);
    const fsEj = o.fsEjemplos ?? 22050;
    const lista = (o.ejemplos || ['silbido', 'aaa']).map(e => (typeof e === 'object' ? e : EJEMPLOS[e] ? { id: e, ...EJEMPLOS[e] } : (console.warn('Curso.voz: no conozco el ejemplo «' + e + '»'), null))).filter(Boolean);
    const V = { actual: null, escVista: null };
    const led = crear('span', { class: 'led', 'aria-hidden': 'true' });
    const derecha = crear('span', { class: 'derecha' }, tr('tu audio no sale del navegador'));
    const lab = crear('div', { class: 'laboratorio', role: 'group', 'aria-label': tr('Laboratorio: en tu voz') },
      crear('div', { class: 'lab-cabeza' }, led, crear('span', {}, o.titulo || tr('En tu voz · laboratorio')), derecha));

    // Fuentes de sonido
    const bGrabar = crear('button', { type: 'button', class: 'boton grabar' });
    const pintarGrabar = (estado, extra) => {
      if (estado === 'grabando') bGrabar.innerHTML = ICONO.stop + '<span>' + tr('Parar') + (extra ? ' · ' + extra : '') + '</span>';
      else bGrabar.innerHTML = ICONO.grabar + '<span>' + tr('Grabar') + '</span>';
    };
    pintarGrabar('reposo');
    const archivo = crear('input', { type: 'file', accept: 'audio/*,video/*', 'aria-label': tr('Subir un audio') });
    const grupoEj = crear('div', { class: 'lab-grupo' }, crear('span', { class: 'nombre' }, tr('Ejemplos sintéticos')));
    const botonesEj = {};
    for (const e of lista) {
      const b = crear('button', { type: 'button', class: 'boton peque', onclick: () => V.ejemplo(e.id) }, e.nombre);
      botonesEj[e.id] = b;
      grupoEj.appendChild(b);
    }
    lab.appendChild(crear('div', { class: 'lab-fuentes' },
      crear('div', { class: 'lab-grupo' }, bGrabar),
      crear('div', { class: 'lab-grupo' }, crear('label', { class: 'lab-archivo' }, archivo, crear('span', { class: 'boton', html: ICONO.subir + '<span>' + tr('Subir un audio') + '</span>' }))),
      lista.length ? grupoEj : null));
    const avisoEl = crear('p', { class: 'lab-aviso', hidden: true, 'aria-live': 'polite' });
    lab.appendChild(avisoEl);
    const estado = crear('div', { class: 'lab-estado' });
    lab.appendChild(estado);
    const medidor = crear('div', { class: 'medidor', hidden: true }, crear('span', {}, tr('Nivel')), crear('span', { class: 'barra-nivel' }, crear('i')));
    lab.appendChild(crear('div', { class: 'lab-vista' }, medidor));
    const vistaCont = crear('div', { class: 'escena' });
    lab.lastChild.appendChild(vistaCont);
    const panel = crear('div', { class: 'lab-panel' });
    lab.appendChild(panel);
    if (cont) cont.appendChild(lab);

    const aviso = (texto, tipo) => {
      if (!texto) { avisoEl.hidden = true; avisoEl.textContent = ''; return; }
      avisoEl.hidden = false;
      avisoEl.className = 'lab-aviso' + (tipo ? ' ' + tipo : '');
      avisoEl.textContent = texto;
    };
    V.aviso = aviso;

    // Vista de toda la grabación
    const vista = G().lienzo(vistaCont, {
      alto: w => (w < 520 ? 66 : 78),
      etiqueta: tr('Toda la grabación cargada'),
      dibujar: (ctx, w, h, C) => {
        const a = V.actual;
        if (!a) {
          G().texto(ctx, w / 2, h / 2, tr('Graba, sube un audio o elige un ejemplo'), { alinear: 'center', base: 'middle', color: C.tenue, tam: 12, C });
          V.escVista = null;
          return;
        }
        const dur = a.x.length / a.fs, tope = Math.max(a.pico * 1.08, 0.02);
        const esc = G().ejes(ctx, { caja: { x: 8, y: 6, w: w - 16, h: h - 22 }, x: [0, dur], y: [-tope, tope], soloEscala: true, C });
        V.escVista = esc;
        ctx.save();
        ctx.strokeStyle = G().alfa(C.eje, 0.6); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(8, Math.round(esc.y(0)) + 0.5); ctx.lineTo(w - 8, Math.round(esc.y(0)) + 0.5); ctx.stroke();
        ctx.restore();
        G().linea(ctx, esc, null, a.x, { t0: 0, dt: 1 / a.fs, color: C.cuerpo, ancho: 1, alfa: 0.62, halo: false, C });
        const marcas = G().marcasBonitas(0, dur, Math.max(2, Math.round((w - 16) / 90)));
        ctx.fillStyle = C.tenue;
        for (const v of marcas) {
          const px = esc.x(v);
          if (px < 8 || px > w - 8) continue;
          ctx.fillRect(Math.round(px), h - 15, 1, 4);
          G().texto(ctx, Math.min(Math.max(px, 14), w - 14), h - 2, num(v) + ' s', { alinear: 'center', tam: 10, color: C.tenue, C });
        }
        if (o.alDibujarVista) o.alDibujarVista(ctx, esc, C, a);
      },
    });
    V.vista = vista;
    if (o.alTocarVista) {
      Curso.arrastre(vista.canvas, {
        eje: 'x',
        alBajar: p => { if (!V.actual || !V.escVista) return false; o.alTocarVista(limitar(V.escVista.xi(p.x), 0, V.actual.duracion), V.actual); },
        alMover: p => { if (V.actual && V.escVista) o.alTocarVista(limitar(V.escVista.xi(p.x), 0, V.actual.duracion), V.actual); },
      });
    }

    let escuchar = null;
    function pintarEstado() {
      const a = V.actual;
      estado.innerHTML = '';
      if (!a) return;
      const db = a.pico > 0 ? 20 * Math.log10(a.pico) : -Infinity;
      estado.append(
        crear('span', { class: 'nombre-audio' }, a.nombre),
        a.sintetico ? crear('span', { class: 'sintetico' }, tr('ejemplo sintético')) : null,
        crear('span', {}, num(a.duracion, a.duracion < 10 ? 1 : 0) + ' s'),
        crear('span', {}, num(a.fs) + ' ' + tr('muestras/s')),
        crear('span', {}, tr('pico') + ' ' + (Number.isFinite(db) ? num(db, 0) + ' dBFS' : '−∞ dBFS')));
      escuchar = Curso.audio.boton(estado, () => (V.actual ? { x: V.actual.x, fs: V.actual.fs, volumen: 0.8 } : null), tr('Escuchar'), { clase: 'peque' });
    }
    // Carga cualquier audio: lo pasa a mono, le quita la continua, lo recorta y lo remuestrea si hace falta.
    V.cargar = (x, fs, nombre = 'Audio', op = {}) => {
      if (!x || !x.length || !(fs > 0)) { aviso(tr('El audio está vacío.'), 'mal'); return false; }
      let y = Float64Array.from(x);
      let media = 0;
      for (let i = 0; i < y.length; i++) media += y[i];
      media /= y.length;
      if (Math.abs(media) > 1e-6) for (let i = 0; i < y.length; i++) y[i] -= media;
      const avisos = [];
      const maxN = Math.round(maxS * fs);
      let recorte = null;
      if (y.length > maxN) {
        const ini = ventanaMasFuerte(y, fs, maxN);
        y = y.slice(ini, ini + maxN);
        recorte = [ini / fs, (ini + maxN) / fs];
        avisos.push([tr('Es largo: me quedo con los {0} s con más sonido (de {1} a {2} s).', num(maxS), num(recorte[0], 1), num(recorte[1], 1)), '']);
      }
      let fsA = fs;
      if (o.fsAnalisis && Math.abs(o.fsAnalisis - fs) > 0.5) { y = remuestrear(y, fs, o.fsAnalisis); fsA = o.fsAnalisis; }
      let pico = 0, techo = 0;
      for (let i = 0; i < y.length; i++) { const a = Math.abs(y[i]); if (a > pico) pico = a; }
      for (let i = 0; i < y.length; i++) if (Math.abs(y[i]) >= 0.985 * Math.max(pico, 0.5) && pico >= 0.98) techo++;
      const satFrac = techo / y.length;
      if (pico < 0.003) avisos.push([tr('Casi no hay sonido (pico de {0} dBFS). Acerca el micrófono o sube el volumen de la grabación.', pico > 0 ? num(20 * Math.log10(pico), 0) : '−∞'), 'mal']);
      else if (satFrac > 0.002) avisos.push([tr('Satura: el {0} % de las muestras tocan el techo y la onda sale recortada. Aléjate un poco del micrófono.', num(100 * satFrac, 1)), 'mal']);
      if (y.length / fsA < 0.25) avisos.push([tr('Es muy corto: con un segundo o dos se ve mucho mejor.'), 'mal']);
      V.actual = { x: y, fs: fsA, nombre, sintetico: !!op.sintetico, pico, satFrac, duracion: y.length / fsA, recorte, fsOriginal: fs };
      if (escuchar) escuchar.parar();
      pintarEstado();
      vista.dibujar();
      lab.classList.add('con-audio');
      for (const id in botonesEj) botonesEj[id].setAttribute('aria-pressed', String(op.ejemplo === id));
      const peor = avisos.find(a => a[1] === 'mal') || avisos[0];
      aviso(peor ? peor[0] : '', peor ? peor[1] : '');
      if (o.alCargar) {
        try { o.alCargar(y, fsA, nombre, V.actual); }
        catch (e) {
          console.error(e);
          aviso(tr('No he podido analizar este audio: {0}', e.message), 'mal');
          if (op.lanzar) throw e;
        }
      }
      return true;
    };
    V.ejemplo = async id => {
      const e = lista.find(x => x.id === id);
      if (!e) return false;
      const s = S();
      if (!s && e.crear.length >= 2) { aviso(tr('Los ejemplos sintéticos necesitan comun/senal.js, y no ha cargado.'), 'mal'); return false; }
      let x;
      try { x = e.crear.length >= 2 ? e.crear(s, fsEj) : e.crear(fsEj); }
      catch (err) { console.error(err); aviso(tr('No he podido generar el ejemplo «{0}»: {1}', e.nombre, err.message), 'mal'); return false; }
      return V.cargar(x, fsEj, e.nombre, { sintetico: true, ejemplo: id });
    };
    V.redibujarVista = () => vista.dibujar();

    // Subir un audio (o soltarlo encima del laboratorio)
    async function leerArchivo(f) {
      if (!f) return;
      aviso(tr('Leyendo «{0}»…', f.name));
      try {
        const c = Curso.audio.contexto();
        if (!c) throw new Error('este navegador no tiene Web Audio');
        const audio = await decodificar(c, await f.arrayBuffer());
        V.cargar(aMono(audio), audio.sampleRate, f.name, { sintetico: false });
      } catch (e) {
        console.warn(e);
        aviso(tr('No puedo leer «{0}». Prueba con un WAV, un MP3 o un M4A grabado con el móvil.', f.name), 'mal');
      }
    }
    archivo.addEventListener('change', () => { leerArchivo(archivo.files && archivo.files[0]); archivo.value = ''; });
    lab.addEventListener('dragover', ev => { ev.preventDefault(); });
    lab.addEventListener('drop', ev => { ev.preventDefault(); const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]; if (f) leerArchivo(f); });

    // Grabar con el micrófono (captura directa de muestras, sin compresión)
    let grabacion = null;
    const permitido = microfonoPermitido();
    if (permitido === false) {
      aviso(MENSAJE_SIN_MICRO);
      bGrabar.disabled = true;
      bGrabar.title = tr('El micrófono está bloqueado en esta ventana');
    }
    async function empezarGrabacion() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        aviso(location.protocol === 'http:' ? tr('El navegador solo deja grabar en páginas seguras (https) o abiertas desde el disco. Sube un audio o prueba con un ejemplo.') : MENSAJE_SIN_MICRO, 'mal');
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      } catch (e) {
        const nombre = e && e.name;
        let t = MENSAJE_SIN_MICRO;
        if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') t = tr('No encuentro ningún micrófono. Sube un audio grabado con el móvil o prueba con un ejemplo sintético.');
        else if (nombre === 'NotReadableError') t = tr('El micrófono está ocupado por otra aplicación. Ciérrala y vuelve a probar, o sube un audio.');
        else if ((nombre === 'NotAllowedError' || nombre === 'SecurityError') && !enVisor()) t = tr('No tengo permiso para usar el micrófono. Puedes darlo en el candado de la barra de direcciones, subir un audio o probar con un ejemplo.');
        aviso(t, 'mal');
        return;
      }
      const c = Curso.audio.contexto();
      if (!c) { stream.getTracks().forEach(t => t.stop()); aviso(tr('Este navegador no tiene Web Audio: no puedo grabar.'), 'mal'); return; }
      try { await c.resume(); } catch (e) { /* sigue */ }
      const fuente = c.createMediaStreamSource(stream);
      const proc = c.createScriptProcessor(4096, 1, 1);
      const mudo = c.createGain();
      mudo.gain.value = 0;
      const trozos = [];
      let total = 0, nivel = 0;
      proc.onaudioprocess = ev => {
        const d = ev.inputBuffer.getChannelData(0);
        trozos.push(new Float32Array(d));
        total += d.length;
        let p = 0;
        for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > p) p = a; }
        nivel = Math.max(p, nivel * 0.85);
        if (total / c.sampleRate >= maxS) terminarGrabacion();
      };
      fuente.connect(proc); proc.connect(mudo); mudo.connect(c.destination);
      grabacion = { stream, fuente, proc, mudo, trozos, fs: c.sampleRate, inicio: performance.now(), get total() { return total; }, get nivel() { return nivel; } };
      lab.classList.add('grabando');
      medidor.hidden = false;
      aviso(tr('Grabando. Silba o canta una nota larga; se para sola a los {0} s.', num(maxS)));
      const tic = () => {
        if (!grabacion) return;
        const s = (performance.now() - grabacion.inicio) / 1000;
        pintarGrabar('grabando', num(s, 1) + ' s');
        bGrabar.disabled = s < minS;
        bGrabar.title = s < minS ? tr('Graba al menos {0} s', num(minS)) : '';
        medidor.querySelector('i').style.width = (100 * Math.min(1, grabacion.nivel)).toFixed(1) + '%';
        requestAnimationFrame(tic);
      };
      tic();
    }
    function terminarGrabacion() {
      const g = grabacion;
      if (!g) return;
      grabacion = null;
      try { g.fuente.disconnect(); g.proc.disconnect(); g.mudo.disconnect(); } catch (e) { /* ya desconectado */ }
      g.stream.getTracks().forEach(t => t.stop());
      lab.classList.remove('grabando');
      medidor.hidden = true;
      bGrabar.disabled = false;
      pintarGrabar('reposo');
      const x = new Float64Array(g.total);
      let k = 0;
      for (const t of g.trozos) { x.set(t, k); k += t.length; }
      V.cargar(x, g.fs, tr('Tu grabación'), { sintetico: false });
    }
    bGrabar.addEventListener('click', () => { if (grabacion) terminarGrabacion(); else empezarGrabacion(); });

    // El primer ejemplo se carga solo cuando el laboratorio se acerca a la pantalla: la página se ve completa en
    // reposo, sin calcular nada pesado al cargar.
    const inicial = o.inicial === undefined ? (lista[0] && lista[0].id) : o.inicial;
    if (inicial && typeof IntersectionObserver !== 'undefined') {
      const io = new IntersectionObserver(ent => {
        if (!ent.some(e => e.isIntersecting)) return;
        io.disconnect();
        if (!V.actual) V.ejemplo(inicial);
      }, { rootMargin: '400px' });
      io.observe(lab);
    } else if (inicial) setTimeout(() => { if (!V.actual) V.ejemplo(inicial); }, 0);

    // Autoprueba: el análisis de la lección tiene que aguantar cualquier audio.
    V.probar = async () => {
      const out = [];
      const casos = lista.map(e => ['ejemplo ' + e.id, () => {
        const s = S();
        if (!s && e.crear.length >= 2) throw new Error('Senal no está cargado (comun/senal.js)');
        return { x: e.crear.length >= 2 ? e.crear(s, fsEj) : e.crear(fsEj), fs: fsEj };
      }]);
      const tonoDe = (fs, seg, f, amp = 0.5) => { const x = new Float64Array(Math.round(fs * seg)); for (let i = 0; i < x.length; i++) x[i] = amp * Math.sin(TAU * f * i / fs); return x; };
      casos.push(['silencio', () => ({ x: new Float64Array(22050), fs: 22050 })]);
      casos.push(['saturado', () => { const fs = 44100, x = tonoDe(fs, 2, 220, 3), r = azar(7); for (let i = 0; i < x.length; i++) x[i] = limitar(x[i] + 0.2 * r.normal(), -1, 1); return { x, fs }; }]);
      casos.push(['8 kHz', () => ({ x: tonoDe(8000, 1.5, 300), fs: 8000 })]);
      casos.push(['48 kHz y 15 s', () => ({ x: tonoDe(48000, 15, 180, 0.3), fs: 48000 })]);
      casos.push(['muy corto', () => ({ x: tonoDe(22050, 0.03, 500), fs: 22050 })]);
      for (const [nombre, gen] of casos) {
        try {
          const { x, fs } = gen();
          V.cargar(x, fs, 'Prueba: ' + nombre, { lanzar: true, sintetico: true });
          await dosFotogramas();
          out.push({ id: 'voz · ' + nombre, ok: true });
        } catch (e) { out.push({ id: 'voz · ' + nombre, ok: false, error: e.message }); }
      }
      aviso('');
      if (inicial) await V.ejemplo(inicial);
      return out;
    };
    labs.push(V);
    return {
      el: lab, panel, vista,
      get actual() { return V.actual; },
      cargar: V.cargar, ejemplo: V.ejemplo, aviso, redibujarVista: V.redibujarVista,
    };
  };

  // ── Datos de las lecciones: términos y bancos de preguntas ────────────────────────────────────────────
  const datos = {};
  // Curso.datos(id, { terminos, preguntas, examen: { n, aprobado } }): lo llaman los archivos datos/eNN.js.
  Curso.datos = function (id, obj) {
    datos[id] = obj || {};
    if (montado && id === Curso.leccion) { montarTerminos(id); montarExamenLeccion(id); montarFichas(id); }
  };
  Curso.datosDe = id => datos[id] || null;
  Curso.todosLosDatos = () => Object.assign({}, datos);

  function buscarTermino(lista, texto) {
    const t = normalizar(texto);
    const claves = lista.map(x => [normalizar(x.termino), x]).sort((a, b) => b[0].length - a[0].length);
    return (claves.find(([k]) => k === t) || claves.find(([k]) => t.startsWith(k)) || claves.find(([k]) => k.startsWith(t) && t.length >= 4) || [])[1] || null;
  }
  function montarTerminos(id) {
    const sec = doc.getElementById('terminos');
    const d = datos[id];
    if (!sec || !d || !Array.isArray(d.terminos)) return;
    let dl = sec.querySelector('dl.terminos');
    if (!dl) { dl = crear('dl', { class: 'terminos' }); sec.appendChild(dl); }
    dl.innerHTML = '';
    for (const t of d.terminos) {
      dl.appendChild(crear('div', { id: 'termino-' + slug(t.termino) },
        crear('dt', {}, t.termino),
        crear('dd', {}, t.definicion || '', t.imagen ? crear('span', { class: 'imagen-ancla' }, t.imagen) : null)));
    }
    if (!sec.querySelector('.terminos-glosario')) sec.appendChild(crear('p', { class: 'terminos-glosario' }, crear('a', { href: 'glosario.html' }, tr('Todos los términos del curso, en el glosario →'))));
  }
  // Fichas: al pasar o tocar un <b class="termino"> sale su definición.
  let ficha = null;
  function montarFichas(id) {
    const lista = id && datos[id] && Array.isArray(datos[id].terminos) ? datos[id].terminos : [];
    const nodos = [...doc.querySelectorAll('b.termino')];
    if (!nodos.length || !lista.length) return;
    if (!ficha) {
      ficha = crear('div', { class: 'ficha-termino', role: 'tooltip', hidden: true, id: 'ficha-termino' });
      doc.body.appendChild(ficha);
      raiz.addEventListener('scroll', () => { ficha.hidden = true; }, { passive: true });
      doc.addEventListener('pointerdown', ev => { if (!ev.target.closest || !ev.target.closest('b.termino')) ficha.hidden = true; });
    }
    for (const b of nodos) {
      if (b.dataset.fichaLista) continue;
      const t = buscarTermino(lista, b.getAttribute('data-termino') || b.textContent);
      if (!t) continue;
      b.dataset.fichaLista = '1';
      b.tabIndex = 0;
      const desc = crear('span', { class: 'oculto-visual', id: 'def-' + (++contador) }, ': ' + t.definicion);
      b.after(desc);
      b.setAttribute('aria-describedby', desc.id);
      const mostrar = () => {
        ficha.innerHTML = '';
        ficha.append(crear('span', { class: 'nombre' }, t.termino), t.definicion);
        ficha.hidden = false;
        const r = b.getBoundingClientRect(), fw = ficha.offsetWidth, fh = ficha.offsetHeight;
        const vw = doc.documentElement.clientWidth, vh = raiz.innerHeight;
        const x = limitar(r.left + r.width / 2 - fw / 2, 16, Math.max(16, vw - fw - 16));
        const y = r.bottom + 8 + fh < vh - 8 ? r.bottom + 8 : Math.max(8, r.top - fh - 8);
        ficha.style.left = x + 'px';
        ficha.style.top = y + 'px';
      };
      const ocultar = () => { ficha.hidden = true; };
      b.addEventListener('mouseenter', mostrar);
      b.addEventListener('mouseleave', ocultar);
      b.addEventListener('focus', mostrar);
      b.addEventListener('blur', ocultar);
      b.addEventListener('click', ev => { ev.preventDefault(); if (ficha.hidden) mostrar(); else ocultar(); });
    }
  }

  // ── Examen ─────────────────────────────────────────────────────────────────────────────────────────────
  const TIPOS = ['opcion', 'varias', 'vf', 'numero', 'grafica', 'deslizador'];
  const LETRAS = 'ABCDEFGHIJ';
  const NIVEL_PREGUNTA = { basico: 'básico', medio: 'medio', reto: 'reto' };   // se traducen al pintarlos
  // Una pregunta generada se rehace en cada intento: generar(azar) devuelve los campos de su tipo.
  function instanciar(p, a) {
    if (typeof p.generar !== 'function') return Object.assign({}, p);
    const g = p.generar(a) || {};
    const q = Object.assign({}, p, g);
    delete q.generar;
    q.generada = true;
    return q;
  }
  function validarPregunta(q) {
    const e = [];
    if (!TIPOS.includes(q.tipo)) e.push('tipo desconocido «' + q.tipo + '»');
    if (!q.enunciado || typeof q.enunciado !== 'string') e.push('falta el enunciado');
    if (!q.explicacion || typeof q.explicacion !== 'string') e.push('falta la explicación (tiene que decir por qué)');
    const n = Array.isArray(q.opciones) ? q.opciones.length : 0;
    if (q.tipo === 'opcion' && (n < 2 || !Number.isInteger(q.correcta) || q.correcta < 0 || q.correcta >= n)) e.push('opciones o «correcta» mal');
    if (q.tipo === 'varias' && (n < 2 || !Array.isArray(q.correctas) || !q.correctas.length || q.correctas.some(i => !Number.isInteger(i) || i < 0 || i >= n))) e.push('opciones o «correctas» mal');
    if (q.tipo === 'vf' && typeof q.correcta !== 'boolean') e.push('«correcta» tiene que ser true o false');
    if (q.tipo === 'numero' && !Number.isFinite(q.respuesta)) e.push('«respuesta» no es un número');
    if (q.tipo === 'grafica' && (n < 2 || q.opciones.some(f => typeof f !== 'function') || !Number.isInteger(q.correcta) || q.correcta < 0 || q.correcta >= n)) e.push('las opciones tienen que ser funciones de dibujo y «correcta», un índice');
    if (q.tipo === 'deslizador') {
      if (!(q.max > q.min)) e.push('min y max mal');
      if (typeof q.dibujar !== 'function') e.push('falta dibujar(ctx, w, h, valor, C)');
      if (!Number.isFinite(q.solucion) || q.solucion < q.min || q.solucion > q.max) e.push('«solucion» fuera de [min, max]');
    }
    if (q.figura != null && typeof q.figura !== 'function') e.push('«figura» tiene que ser una función de dibujo');
    if (q.audio != null && typeof q.audio !== 'function') e.push('«audio» tiene que ser una función');
    if (e.length) throw new Error(e.join('; '));
  }
  function corregir(q, r) {
    switch (q.tipo) {
      case 'opcion': case 'grafica': return r === q.correcta;
      case 'varias': { const a = [...r].sort((x, y) => x - y), b = [...q.correctas].sort((x, y) => x - y); return a.length === b.length && a.every((v, i) => v === b[i]); }
      case 'vf': return r === q.correcta;
      case 'numero': {
        if (!Number.isFinite(r)) return false;
        const tol = q.toleranciaRel != null ? Math.abs(q.respuesta) * q.toleranciaRel : q.tolerancia != null ? q.tolerancia : Math.abs(q.respuesta) * 1e-6 + 1e-9;
        return Math.abs(r - q.respuesta) <= tol + 1e-12;
      }
      case 'deslizador': return typeof q.correcto === 'function' ? !!q.correcto(r) : Math.abs(r - q.solucion) <= (q.tolerancia ?? (q.paso || (q.max - q.min) / 100) / 2);
      default: return false;
    }
  }
  function textoRespuesta(q, orden) {
    const op = i => comillas(String(q.opciones[i]).replace(/\*/g, ''));
    switch (q.tipo) {
      case 'opcion': return tr('La buena: {0}.', op(q.correcta));
      case 'varias': return tr('Las buenas: {0}.', q.correctas.map(op).join(', '));
      case 'vf': return tr(q.correcta ? 'Era verdadero.' : 'Era falso.');
      case 'numero': return tr('La respuesta: {0}.', num(q.respuesta, q.decimales) + (q.unidad ? ' ' + q.unidad : ''));
      case 'grafica': return tr('La buena era la gráfica {0}.', LETRAS[orden.indexOf(q.correcta)]);
      case 'deslizador': return tr('Una solución: {0}.', num(q.solucion, q.decimales) + (q.unidad ? ' ' + q.unidad : ''));
      default: return '';
    }
  }
  let uid = 0;
  // Pinta una pregunta. → { el, lienzos, aplicarSolucion(), corregirAhora() }
  function pintarPregunta(q, pos, total, a, alCorregir, extra = {}) {
    const id = 'preg-' + (++uid);
    const lienzosP = [];
    const li = crear('li', { class: 'preg', id });
    li.appendChild(crear('div', { class: 'preg-cabeza' },
      crear('span', { class: 'n' }, tr('Pregunta {0} de {1}', pos, total)),
      q.nivel ? crear('span', {}, NIVEL_PREGUNTA[q.nivel] ? tr(NIVEL_PREGUNTA[q.nivel]) : q.nivel) : null,
      extra.leccion ? crear('span', {}, extra.leccion) : null));
    li.appendChild(crear('p', { class: 'preg-enunciado', id: id + '-e', html: md(q.enunciado) }));
    if (q.figura) {
      const f = crear('div', { class: 'preg-figura' });
      li.appendChild(f);
      lienzosP.push(G().lienzo(f, { alto: q.altoFigura ?? 140, etiqueta: q.textoFigura || tr('Figura de la pregunta'), dibujar: (ctx, w, h, C) => q.figura(ctx, w, h, C) }));
    }
    if (q.audio) { const d = crear('div', { class: 'preg-audio' }); li.appendChild(d); Curso.audio.boton(d, q.audio, q.textoAudio || tr('Escuchar')); }
    const zona = crear('div', { class: 'preg-respuesta', role: 'group', 'aria-labelledby': id + '-e' });
    li.appendChild(zona);
    const bComprobar = crear('button', { type: 'button', class: 'boton principal', disabled: true }, tr('Comprobar'));
    li.appendChild(crear('div', { class: 'preg-acciones' }, bComprobar));
    const retro = crear('div', { class: 'retro', hidden: true, 'aria-live': 'polite' });
    li.appendChild(retro);
    let leer = () => null, aplicar = () => {}, marcar = () => {}, bloquear = () => {}, orden = [];
    const habilitar = () => { bComprobar.disabled = leer() == null; };
    if (q.tipo === 'opcion' || q.tipo === 'varias' || q.tipo === 'vf') {
      const multiple = q.tipo === 'varias';
      const ops = q.tipo === 'vf' ? [tr('Verdadero'), tr('Falso')] : q.opciones;
      orden = q.tipo === 'vf' || q.fijas ? ops.map((_, i) => i) : a.barajar(ops.map((_, i) => i));
      const ul = crear('ul', { class: q.tipo === 'vf' ? 'opciones vf' : 'opciones' });
      const inputs = orden.map((iOrig, k) => {
        const inp = crear('input', { type: multiple ? 'checkbox' : 'radio', name: id + '-o', value: String(iOrig) });
        inp.addEventListener('change', habilitar);
        ul.appendChild(crear('li', {}, crear('label', { class: 'opcion' }, inp,
          crear('span', { class: 'marca', 'aria-hidden': 'true' }, q.tipo === 'vf' ? (iOrig === 0 ? tr('V') : tr('F')) : LETRAS[k]),
          crear('span', { class: 'texto', html: md(ops[iOrig]) }))));
        return inp;
      });
      zona.appendChild(ul);
      const valor = i => (q.tipo === 'vf' ? i === 0 : i);
      leer = () => { const s = inputs.filter(i => i.checked).map(i => +i.value); if (!s.length) return null; return multiple ? s : valor(s[0]); };
      aplicar = () => { for (const i of inputs) { const v = +i.value; i.checked = multiple ? q.correctas.includes(v) : q.tipo === 'vf' ? valor(v) === q.correcta : v === q.correcta; } habilitar(); };
      marcar = () => {
        for (const i of inputs) {
          const v = +i.value, lab = i.closest('.opcion');
          const buena = multiple ? q.correctas.includes(v) : q.tipo === 'vf' ? valor(v) === q.correcta : v === q.correcta;
          if (buena) lab.classList.add('es-correcta'); else if (i.checked) lab.classList.add('fallo');
        }
      };
      bloquear = () => { inputs.forEach(i => { i.disabled = true; }); ul.classList.add('bloqueada'); };
    } else if (q.tipo === 'numero') {
      const campo = Curso.campo(zona, { etiqueta: tr('Tu respuesta'), unidad: q.unidad, unidades: q.unidades, marcador: q.marcador || '', alCambiar: habilitar, alEnviar: () => { if (!bComprobar.disabled) bComprobar.click(); } });
      leer = () => { const v = campo.valor; return Number.isFinite(v) ? v : null; };
      aplicar = () => { campo.fijar(q.respuesta); habilitar(); };
      marcar = ok => campo.marcar(ok ? 'bien' : 'mal');
      bloquear = () => { campo.input.disabled = true; };
    } else if (q.tipo === 'grafica') {
      orden = q.fijas ? q.opciones.map((_, i) => i) : a.barajar(q.opciones.map((_, i) => i));
      const ul = crear('ul', { class: 'opciones-graficas' });
      const inputs = orden.map((iOrig, k) => {
        const inp = crear('input', { type: 'radio', name: id + '-g', value: String(iOrig), 'aria-label': tr('Gráfica {0}', LETRAS[k]) });
        inp.addEventListener('change', habilitar);
        const lienzoCont = crear('div');
        const lab = crear('label', { class: 'opcion-grafica' }, inp, crear('span', { class: 'letra', 'aria-hidden': 'true' }, LETRAS[k]), lienzoCont);
        ul.appendChild(crear('li', {}, lab));
        return [inp, lienzoCont, iOrig];
      });
      zona.appendChild(ul);
      for (const [, lc, iOrig] of inputs) lienzosP.push(G().lienzo(lc, { alto: q.altoOpcion ?? 112, etiqueta: tr('Opción'), dibujar: (ctx, w, h, C) => q.opciones[iOrig](ctx, w, h, C) }));
      leer = () => { const s = inputs.find(([i]) => i.checked); return s ? +s[0].value : null; };
      aplicar = () => { for (const [i] of inputs) i.checked = +i.value === q.correcta; habilitar(); };
      marcar = () => { for (const [i] of inputs) { const lab = i.closest('.opcion-grafica'); if (+i.value === q.correcta) lab.classList.add('es-correcta'); else if (i.checked) lab.classList.add('fallo'); } };
      bloquear = () => { inputs.forEach(([i]) => { i.disabled = true; }); };
    } else if (q.tipo === 'deslizador') {
      const caja = crear('div', { class: 'preg-deslizador' });
      const esc = crear('div', { class: 'escena' });
      caja.appendChild(esc);
      zona.appendChild(caja);
      let valor = q.inicial ?? q.min;
      const L = G().lienzo(esc, { alto: q.alto ?? 150, etiqueta: tr('Figura que cambia con el deslizador'), dibujar: (ctx, w, h, C) => q.dibujar(ctx, w, h, valor, C) });
      lienzosP.push(L);
      const m = Curso.mando(caja, { etiqueta: q.etiqueta || tr('Valor'), min: q.min, max: q.max, paso: q.paso, valor, unidad: q.unidad, decimales: q.decimales, formato: q.formato, alCambiar: v => { valor = v; L.dibujar(); } });
      leer = () => m.valor;
      aplicar = () => { m.fijar(q.solucion); };
      marcar = () => {};
      bloquear = () => { m.input.disabled = true; };
      bComprobar.disabled = false;
      // La autoprueba también dibuja en los extremos para cazar errores.
      lienzosP.probar = () => { for (const v of [q.min, q.max, q.inicial ?? q.min, q.solucion]) { valor = v; L.dibujar(); } valor = m.valor; L.dibujar(); };
    }
    let corregida = false;
    bComprobar.addEventListener('click', () => {
      const r = leer();
      if (r == null || corregida) return;
      corregida = true;
      const ok = corregir(q, r);
      bloquear();
      marcar(ok);
      bComprobar.hidden = true;
      retro.hidden = false;
      retro.className = 'retro ' + (ok ? 'bien' : 'mal');
      retro.innerHTML = (ok ? '' : '<span class="respuesta-buena">' + escapar(textoRespuesta(q, orden)) + '</span>') + md(q.explicacion);
      li.classList.add(ok ? 'acertada' : 'fallada');
      if (alCorregir) alCorregir(ok);
    });
    return { el: li, lienzos: lienzosP, aplicarSolucion: aplicar, corregirAhora: () => { const r = leer(); return r != null && corregir(q, r); } };
  }
  function esVisual(q) { return q.tipo === 'grafica' || q.tipo === 'deslizador' || !!q.figura; }
  // Elige n preguntas de un banco: al azar, pero con al menos una visual si el banco tiene alguna.
  function elegirPreguntas(banco, n, a) {
    const mezcla = a.barajar(banco);
    const elegidas = mezcla.slice(0, Math.min(n, mezcla.length));
    if (!elegidas.some(p => esVisual(p.p))) {
      const v = mezcla.slice(elegidas.length).find(p => esVisual(p.p));
      if (v && elegidas.length) elegidas[elegidas.length - 1] = v;
    }
    return elegidas;
  }
  // Curso.examen(contenedor, { lecciones: ['e05'], n, aprobado = 0.7, clave, porLeccion, titulo })
  //   Con una lección, saca n preguntas de su banco (por defecto, las de datos/eNN.js → examen.n). Con varias
  //   (exámenes de temporada y final), saca porLeccion de cada una, sin las que llevan temporada: false.
  Curso.examen = function (contenedor, o = {}) {
    const cont = buscar(contenedor);
    if (!cont) return null;
    const lecciones = o.lecciones || (Curso.leccion ? [Curso.leccion] : []);
    const multi = lecciones.length > 1;
    const clave = o.clave || lecciones.join('+');
    const conf = !multi && datos[lecciones[0]] && datos[lecciones[0]].examen ? datos[lecciones[0]].examen : {};
    const aprobado = o.aprobado ?? conf.aprobado ?? 0.7;
    const banco = [];
    for (const l of lecciones) {
      const d = datos[l];
      if (!d || !Array.isArray(d.preguntas)) continue;
      d.preguntas.forEach((p, i) => { if (multi && p.temporada === false) return; banco.push({ p, leccion: l, i }); });
    }
    const porLeccion = o.porLeccion ?? (multi ? Math.max(1, Math.floor((o.n ?? lecciones.length * 2) / lecciones.length)) : null);
    const n = multi ? porLeccion * lecciones.length : Math.min(o.n ?? conf.n ?? 8, banco.length);
    let lienzosVivos = [];
    cont.classList.add('examen');
    cont.innerHTML = '';
    if (!banco.length) {
      cont.appendChild(crear('div', { class: 'examen-portada' }, crear('p', {}, tr('El examen de esta lección todavía no está listo.'))));
      return { clave };
    }
    function portada() {
      for (const L of lienzosVivos) L.quitar();
      lienzosVivos = [];
      cont.innerHTML = '';
      const p = Curso.progreso.examen(clave);
      const tarjeta = crear('div', { class: 'examen-portada' },
        crear('p', {}, o.titulo || tr(multi ? 'Preguntas de varias lecciones, sacadas al azar de sus bancos.' : 'Unas preguntas para comprobar que te llevas lo importante. Cambian en cada intento y cada una explica por qué.')),
        crear('ul', { class: 'meta' },
          crear('li', {}, tr('{0} preguntas', n)),
          crear('li', {}, tr('de un banco de {0}', banco.length)),
          crear('li', {}, tr('se aprueba con el {0} %', num(Math.round(aprobado * 100)))),
          p ? crear('li', {}, tr('tu mejor nota: {0}', p.mejorAciertos != null && p.total ? tr('{0} de {1}', p.mejorAciertos, p.total) : porciento(num(Math.round(p.mejor * 100)))) + (p.aprobado ? ' · ' + tr('aprobado') : '')) : null));
      const botones = crear('div', { class: 'botones' });
      const empezar = crear('button', { type: 'button', class: 'boton principal' }, p ? tr('Hacer otro intento') : tr('Empezar el examen'));
      empezar.addEventListener('click', () => intento(true));
      botones.appendChild(empezar);
      tarjeta.appendChild(botones);
      cont.appendChild(tarjeta);
    }
    function intento(enfocar) {
      for (const L of lienzosVivos) L.quitar();
      lienzosVivos = [];
      cont.innerHTML = '';
      const a = azar(Date.now() + Math.floor(Math.random() * 1e6));
      let elegidas;
      if (multi) {
        elegidas = [];
        for (const l of lecciones) elegidas.push(...elegirPreguntas(banco.filter(b => b.leccion === l), porLeccion, a));
      } else elegidas = elegirPreguntas(banco, n, a);
      const total = elegidas.length;
      const resultados = new Array(total).fill(null);
      const marcador = crear('div', { class: 'examen-marcador', 'aria-live': 'polite' });
      const lista = crear('ol', { class: 'examen-lista' });
      cont.appendChild(lista);
      cont.appendChild(marcador);
      const pintarMarcador = () => {
        const hechas = resultados.filter(r => r !== null).length, bien = resultados.filter(r => r === true).length;
        marcador.innerHTML = '';
        marcador.append(crear('span', { class: 'puntos', 'aria-hidden': 'true' }, resultados.map(r => crear('i', { class: r === true ? 'si' : r === false ? 'no' : '' }))),
          crear('span', {}, tr('Respondidas {0} de {1} · aciertos {2}', hechas, total, bien)));
      };
      pintarMarcador();
      elegidas.forEach((b, k) => {
        let q;
        try { q = instanciar(b.p, a); validarPregunta(q); } catch (e) { console.error('Pregunta ' + (b.p.id || b.leccion + '-p' + (b.i + 1)) + ': ' + e.message); resultados[k] = false; return; }
        const T_ = T();
        const etiqueta = multi && T_ && T_.porId[b.leccion] ? tr('Lección {0}', T_.porId[b.leccion].n) : null;
        const card = pintarPregunta(q, k + 1, total, a, ok => {
          resultados[k] = ok;
          pintarMarcador();
          if (resultados.every(r => r !== null)) final();
        }, { leccion: etiqueta });
        lienzosVivos.push(...card.lienzos);
        lista.appendChild(card.el);
      });
      function final() {
        const bien = resultados.filter(r => r === true).length;
        const nota = total ? bien / total : 0;
        const ok = nota >= aprobado - 1e-9;
        const p = Curso.progreso.guardarExamen(clave, { aciertos: bien, total, aprobado: ok });
        const necesita = Math.ceil(aprobado * total - 1e-9);
        const res = crear('div', { class: 'resultado', role: 'status' },
          crear('div', { class: 'nota-grande' }, String(bien), crear('small', {}, ' / ' + total)),
          crear('div', {},
            crear('span', { class: 'sello' + (ok ? '' : ' no') }, tr(ok ? 'Aprobado' : 'Todavía no')),
            crear('p', { style: { marginTop: '.6rem' } }, ok
              ? tr('Has acertado {0} de {1}. Lee las explicaciones de las que has fallado: ahí está lo que conviene repasar.', bien, total)
              : tr('Necesitabas {0} de {1}. Repasa las explicaciones y vuelve a intentarlo: las preguntas cambian.', necesita, total))),
          crear('div', { class: 'botones' },
            crear('button', { type: 'button', class: 'boton principal', onclick: () => intento(true) }, tr('Otro intento, con preguntas nuevas'))));
        cont.appendChild(res);
        pintarMuestras();
        emitir('examen', clave, { aciertos: bien, total, aprobado: ok, progreso: p });
      }
      if (enfocar) {
        const primera = lista.querySelector('.preg');
        if (primera) primera.scrollIntoView({ behavior: reducido() ? 'auto' : 'smooth', block: 'start' });
      }
    }
    portada();
    return { clave, empezar: () => intento(false), n, banco: banco.length };
  };
  function montarExamenLeccion(id) {
    const sec = doc.getElementById('examen');
    if (!sec || !datos[id]) return;
    let cont = sec.querySelector('.examen');
    if (!cont) { cont = crear('div', { class: 'examen' }); sec.appendChild(cont); }
    Curso.examen(cont, { lecciones: [id], clave: id });
  }
  // Avisos para quien escribe la lección: el banco y los términos, comparados con el contrato (§ 7).
  function revisarDatos(id) {
    if (!/^e\d\d$/.test(id)) return;     // la plantilla y las páginas de prueba no tienen banco que revisar
    const d = datos[id];
    if (!d) { if (doc.getElementById('examen') || doc.getElementById('terminos')) console.warn('[' + id + '] no hay datos: falta <script src="datos/' + id + '.js"> o Curso.datos(\'' + id + '\', …)'); return; }
    const P = Array.isArray(d.preguntas) ? d.preguntas : [];
    const avisos = [];
    if (P.length < 10 || P.length > 14) avisos.push('el banco tiene ' + P.length + ' preguntas; tienen que ser de 10 a 14');
    const muestras = P.map((p, i) => { try { return instanciar(p, azar(99 + i)); } catch (e) { return p; } });
    const visuales = muestras.filter(esVisual).length;
    if (visuales < 3) avisos.push('hay ' + visuales + ' preguntas visuales (grafica, deslizador o con figura); tienen que ser al menos 3');
    const numGen = P.filter((p, i) => p.generar && muestras[i].tipo === 'numero').length;
    if (numGen < 2) avisos.push('hay ' + numGen + ' preguntas numéricas generadas; tienen que ser al menos 2');
    if (!d.examen || !d.examen.n) avisos.push('falta examen: { n, aprobado }');
    if (!Array.isArray(d.terminos) || !d.terminos.length) avisos.push('no hay términos');
    else for (const b of doc.querySelectorAll('b.termino')) {
      if (!buscarTermino(d.terminos, b.getAttribute('data-termino') || b.textContent)) avisos.push('el término «' + b.textContent + '» del texto no está en datos/' + id + '.js (o ponle data-termino)');
    }
    for (const a of avisos) console.warn('[' + id + '] ' + a);
  }

  // ── Rincón matemático: KaTeX desde cdnjs al abrirlo, con salida MathML; si no carga, el LaTeX se queda legible ─
  const KATEX = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
  let promesaKatex = null;
  function cargarKatex() {
    if (raiz.katex) return Promise.resolve(raiz.katex);
    if (!promesaKatex) {
      promesaKatex = new Promise((ok, mal) => {
        const s = crear('script', { src: KATEX, async: true });
        s.onload = () => (raiz.katex ? ok(raiz.katex) : mal(new Error('KaTeX ha cargado vacío')));
        s.onerror = () => mal(new Error('No se ha podido cargar KaTeX'));
        doc.head.appendChild(s);
        setTimeout(() => mal(new Error('KaTeX tarda demasiado')), 12000);
      }).catch(e => { promesaKatex = null; throw e; });
    }
    return promesaKatex;
  }
  async function renderizarTex(contenedor) {
    const nodos = [...contenedor.querySelectorAll('.tex')];
    if (!nodos.length) return { ok: true, errores: [] };
    let katex;
    try { katex = await cargarKatex(); } catch (e) {
      if (!contenedor.querySelector('.rincon-aviso')) {
        const cuerpo = contenedor.querySelector('.rincon-cuerpo') || contenedor;
        cuerpo.insertBefore(crear('p', { class: 'rincon-aviso' }, tr('Las fórmulas se ven en LaTeX, tal cual, porque no se ha podido cargar KaTeX (¿sin conexión?).')), cuerpo.firstChild);
      }
      return { ok: true, errores: [], sinKatex: true };
    }
    const errores = [];
    for (const n of nodos) {
      if (n.getAttribute('data-renderizada')) continue;
      const tex = n.getAttribute('data-tex') || n.textContent.trim();
      n.setAttribute('data-tex', tex);
      try {
        katex.render(tex, n, { output: 'mathml', displayMode: n.tagName === 'DIV', throwOnError: true, strict: 'ignore' });
        n.classList.add('renderizada');
        n.setAttribute('data-renderizada', '1');
      } catch (e) {
        errores.push('«' + tex.slice(0, 50) + '»: ' + e.message);
        n.classList.add('error-tex');
        n.textContent = tex;
      }
    }
    return { ok: !errores.length, errores };
  }
  Curso.renderizarTex = renderizarTex;
  function montarRincon() {
    const r = doc.getElementById('rincon');
    if (!r) return;
    for (const n of r.querySelectorAll('.tex')) if (!n.getAttribute('data-tex')) n.setAttribute('data-tex', n.textContent.trim());
    r.addEventListener('toggle', () => { if (r.open) renderizarTex(r); });
    if (r.open) renderizarTex(r);
  }

  // ── Cabecera y pie ─────────────────────────────────────────────────────────────────────────────────────
  function completarCabecera(id) {
    const L = T() && T().porId ? T().porId[id] : null;
    const cab = doc.querySelector('.cabecera');
    if (!cab || !L) return;
    const ante = cab.querySelector('.antetitulo');
    if (ante && !ante.textContent.trim()) ante.textContent = tr('Nivel {0} · Lección {1}', L.nivel, L.n);
    if (L.llevas && !cab.querySelector('.llevas')) {
      const p = crear('p', { class: 'llevas' }, crear('b', {}, tr('Te llevas')), L.llevas);
      const preg = cab.querySelector('.pregunta');
      if (preg) preg.after(p); else cab.appendChild(p);
    }
    const meta = cab.querySelector('.meta');
    if (meta && !meta.querySelector('[data-auto]')) {
      const nRetos = doc.querySelectorAll('.reto').length;
      const d = datos[id];
      if (nRetos) meta.appendChild(crear('li', { 'data-auto': '1' }, tr(nRetos === 1 ? '{0} reto' : '{0} retos', nRetos)));
      if (d && d.examen && d.examen.n) meta.appendChild(crear('li', { 'data-auto': '1' }, tr('examen de {0} preguntas', d.examen.n)));
    }
  }
  function montarPie(id) {
    if (doc.querySelector('footer.pie') || !T()) return;
    const lista = T().lecciones, L = T().porId[id];
    if (!L) return;
    const i = lista.indexOf(L), ant = lista[i - 1], sig = lista[i + 1];
    const enlace = (l, flecha) => crear('a', { href: l.id + '.html' }, flecha === '←' ? '← ' + tr('Lección {0} · {1}', l.n, l.corto) : tr('Lección {0} · {1}', l.n, l.corto) + ' →');
    const interior = crear('div', { class: 'pie-interior' });
    if (sig) {
      interior.append(
        crear('p', { class: 'antetitulo' }, tr('La pregunta que abre la lección {0}', sig.n)),
        crear('p', { class: 'pie-abre' }, L.abre || sig.pregunta),
        crear('a', { class: 'pie-siguiente', href: sig.id + '.html' }, tr('Lección {0} · {1}', sig.n, sig.titulo) + ' →'));
    } else {
      interior.append(crear('p', { class: 'antetitulo' }, tr('Final del curso')), crear('p', { class: 'pie-abre' }, L.abre || ''),
        crear('a', { class: 'pie-siguiente', href: 'examenes.html#final' }, tr('El examen final →')));
    }
    interior.appendChild(crear('nav', { class: 'pie-nav', 'aria-label': tr('Lecciones') },
      ant ? enlace(ant, '←') : crear('span', { class: 'vacio' }, tr('Primera lección')),
      crear('a', { href: 'index.html' }, tr('Mapa del curso')),
      crear('a', { href: 'glosario.html' }, tr('Glosario')),
      crear('a', { href: 'examenes.html' }, tr('Exámenes')),
      sig ? enlace(sig, '→') : crear('span', { class: 'vacio' }, tr('Última lección'))));
    interior.appendChild(crear('p', { class: 'pie-creditos' }, T().titulo + ' · ' + T().autor + ' · Alejandro Ena. ' + tr('Tu progreso se guarda solo en este navegador.')));
    doc.body.appendChild(crear('footer', { class: 'pie' }, interior));
  }

  // ── Montaje ────────────────────────────────────────────────────────────────────────────────────────────
  let montado = false;
  Curso.montar = function () {
    if (montado) return Curso.listo;
    montado = true;
    try {
      const id = Curso.leccion;
      montarBarra();
      if (id) {
        if (T() && !T().porId[id] && /^e\d\d$/.test(id)) console.warn('[' + id + '] la lección no está en comun/temario.js');
        const l = Curso.progreso.leccion(id);
        l.total = doc.querySelectorAll('.reto').length;
        l.visita = hoy();
        if (!enAutoprueba) guardarMemoria();
        completarCabecera(id);
        montarTerminos(id);
        montarExamenLeccion(id);
        montarPie(id);
        montarFichas(id);
        revisarDatos(id);
      }
      montarRincon();
      pintarMuestras();
      if (Curso.leccion) for (const e of doc.querySelectorAll('.reto[id]')) if (!retos.has(e.id)) console.warn('[' + Curso.leccion + '] el reto #' + e.id + ' no está registrado con Curso.reto()');
    } catch (e) { console.error(e); }
    resolverListo(true);
    emitir('listo');
    return Curso.listo;
  };

  // ── Autoprueba: la usa herramientas/revisar.mjs ───────────────────────────────────────────────────────
  // → { retos: [{ id, ok, error }], preguntas: [{ id, ok, error }], labs: [{ id, ok, error }], rincon: { ok, errores } }
  async function probarPregunta(p, i, leccion) {
    const id = p.id || leccion + '-p' + (i + 1);
    const veces = typeof p.generar === 'function' ? 20 : 1;
    const caja = crear('div', { 'aria-hidden': 'true', style: { position: 'absolute', left: '-12000px', top: '0', width: '620px', visibility: 'hidden' } });
    doc.body.appendChild(caja);
    try {
      for (let k = 0; k < veces; k++) {
        const a = azar(1000 + 7919 * k + i);
        const q = instanciar(p, a);
        validarPregunta(q);
        const lista = crear('ol');
        caja.appendChild(lista);
        const card = pintarPregunta(q, 1, 1, a, null);
        lista.appendChild(card.el);
        for (const L of card.lienzos) L.dibujar();
        if (card.lienzos.probar) card.lienzos.probar();
        if (q.audio) { const s = q.audio(); if (!s || !((s.x && s.x.length && s.fs > 0) || s.f > 0)) throw new Error('audio() no devuelve { x, fs } ni { f, dur }'); }
        card.aplicarSolucion();
        const bien = card.corregirAhora();
        for (const L of card.lienzos) L.quitar();
        lista.remove();
        if (!bien) throw new Error('la solución declarada no se corrige como buena' + (veces > 1 ? ' (versión ' + (k + 1) + ')' : ''));
      }
      return { id, ok: true };
    } catch (e) {
      return { id, ok: false, error: e.message };
    } finally { caja.remove(); }
  }
  Curso.autoprueba = async function () {
    await Curso.listo;
    const res = { retos: [], preguntas: [], labs: [], rincon: { ok: true, errores: [] } };
    enAutoprueba = true;
    try {
      for (const ejecutar of [...pendientesAlVerse]) ejecutar();
      for (const R of retos.values()) {
        try {
          if (typeof R.o.resolver !== 'function') throw new Error('falta resolver()');
          if (typeof R.o.comprobar !== 'function') throw new Error('falta comprobar()');
          R.o.resolver();
          await dosFotogramas();
          const r = R.evaluar();
          res.retos.push(r.ok ? { id: R.id, ok: true } : { id: R.id, ok: false, error: r.mensaje || 'comprobar() no da por buena la solución de resolver()' });
        } catch (e) { res.retos.push({ id: R.id, ok: false, error: e.message }); }
      }
      for (const e of doc.querySelectorAll('.reto[id]')) if (!retos.has(e.id)) res.retos.push({ id: e.id, ok: false, error: 'no está registrado con Curso.reto()' });
      const id = Curso.leccion;
      const d = id && datos[id];
      if (d && Array.isArray(d.preguntas)) for (let i = 0; i < d.preguntas.length; i++) res.preguntas.push(await probarPregunta(d.preguntas[i], i, id));
      for (const V of labs) res.labs.push(...await V.probar());
      const r = doc.getElementById('rincon');
      if (r) {
        r.open = true;
        res.rincon = await Promise.race([renderizarTex(r), esperar(15000).then(() => ({ ok: true, errores: [], sinKatex: true }))]);
      }
    } finally { enAutoprueba = false; }
    return res;
  };

  // ── Exportación ────────────────────────────────────────────────────────────────────────────────────────
  Object.assign(Curso, { crear, escapar, md, num, leerNumero, azar, nota, slug, reducido, dosFotogramas, iconos: ICONO, idioma, tr });
  raiz.Curso = Curso;
  aplicarTema(temaActual);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => Curso.montar());
  else setTimeout(() => Curso.montar(), 0);
})(typeof self !== 'undefined' ? self : this);
