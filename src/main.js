// --- IMPORTACIONES ---
import './style.css';
import { preguntasTema, titulosTemas } from './data/preguntas.js';

// --- LÓGICA DEL MODO OSCURO ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  htmlElement.classList.add('dark');
  themeIcon.textContent = '☀️';
} else {
  htmlElement.classList.remove('dark');
  themeIcon.textContent = '🌙';
}

themeToggleBtn.addEventListener('click', () => {
  htmlElement.classList.toggle('dark');
  if (htmlElement.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
    themeIcon.textContent = '☀️';
  } else {
    localStorage.setItem('theme', 'light');
    themeIcon.textContent = '🌙';
  }
});

// --- GESTIÓN DE LA BOLSA DE FALLOS ---
function obtenerBolsaFallos() {
  return JSON.parse(localStorage.getItem('bolsaFallos')) || [];
}

function guardarFallo(tema, indexOriginal) {
  const fallos = obtenerBolsaFallos();
  // Comprobar si ya existe para no duplicar
  const existe = fallos.find(f => f.tema === tema && f.index === indexOriginal);
  if (!existe) {
    fallos.push({ tema, index: indexOriginal });
    localStorage.setItem('bolsaFallos', JSON.stringify(fallos));
  }
}

function eliminarFallo(tema, indexOriginal) {
  let fallos = obtenerBolsaFallos();
  fallos = fallos.filter(f => !(f.tema === tema && f.index === indexOriginal));
  localStorage.setItem('bolsaFallos', JSON.stringify(fallos));
}

// --- ESTADO DE LA APLICACIÓN ---
let temaActual = '';
let preguntaActual = 0;
const mainContent = document.getElementById('main-content');

// Estados para saber dónde estamos
let enModoPractica = false;
let enModoExamen = false;
let enModoFallos = false;

// Variables para Examen y Fallos
let preguntasActivas = []; // Usado para Examen y Bolsa de Fallos
let respuestasUsuario = {}; 
let tiempoRestante = 1200; 
let intervaloTimer = null;

// --- RENDERIZAR MENÚ PRINCIPAL ---
function renderMainMenu() {
  enModoPractica = false;
  enModoExamen = false;
  enModoFallos = false;
  clearInterval(intervaloTimer);
  
  const bolsaFallos = obtenerBolsaFallos();
  const numFallos = bolsaFallos.length;

  const opcionesTemas = Object.keys(preguntasTema).map(tema => {
    const titulo = titulosTemas[tema] || tema;
    return `<option value="${tema}">${titulo}</option>`;
  }).join('');

  mainContent.innerHTML = `
    <div class="text-center py-6 animate-fade-in">
      <h2 class="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Configura tu test
      </h2>
      
      <div class="mb-8 max-w-md mx-auto">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona el Tema (Solo para Práctica)</label>
        <select id="selector-tema" class="w-full p-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all cursor-pointer font-medium">
          ${opcionesTemas}
        </select>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <button id="btn-practica" class="p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1">
          <div class="text-3xl mb-2">📚</div>
          Modo Práctica
          <div class="text-xs font-normal mt-1 opacity-80">Por temas. Corrección al instante</div>
        </button>
        
        <button id="btn-examen" class="p-6 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg hover:shadow-red-500/30 transform hover:-translate-y-1">
          <div class="text-3xl mb-2">🎯</div>
          Simulacro Oficial
          <div class="text-xs font-normal mt-1 opacity-80">20 preg. | 20 min. | Mín: 16</div>
        </button>

        <button id="btn-fallos" class="p-6 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-semibold shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-1 relative ${numFallos === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${numFallos === 0 ? 'disabled' : ''}>
          <div class="absolute -top-3 -right-3 bg-red-600 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
            ${numFallos}
          </div>
          <div class="text-3xl mb-2">🔄</div>
          Bolsa de Fallos
          <div class="text-xs font-normal mt-1 opacity-80">Repasa tus errores</div>
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-practica').addEventListener('click', () => {
    temaActual = document.getElementById('selector-tema').value;
    iniciarPractica();
  });
  
  document.getElementById('btn-examen').addEventListener('click', iniciarExamen);
  
  document.getElementById('btn-fallos').addEventListener('click', iniciarBolsaFallos);
}

// ==========================================
//          LÓGICA DE BOLSA DE FALLOS
// ==========================================
function iniciarBolsaFallos() {
  const fallos = obtenerBolsaFallos();
  if (fallos.length === 0) return;

  enModoFallos = true;
  preguntaActual = 0;
  
  // Rescatar las preguntas reales usando los índices guardados
  preguntasActivas = fallos.map(f => {
    // Le inyectamos el tema y el index original para saber de dónde viene
    return { ...preguntasTema[f.tema][f.index], temaOriginal: f.tema, indexOriginal: f.index };
  });

  // Mezclar para que no salgan siempre en el mismo orden
  preguntasActivas.sort(() => 0.5 - Math.random());

  renderizarPregunta();
}

// ==========================================
//          LÓGICA DEL MODO EXAMEN
// ==========================================
function obtenerAleatoriasParaExamen(array, cantidad, temaNombre) {
  if (!array) return [];
  // Le pegamos el tema y el index original antes de mezclar
  const mezclado = array.map((q, i) => ({ ...q, temaOriginal: temaNombre, indexOriginal: i })).sort(() => 0.5 - Math.random());
  return mezclado.slice(0, cantidad);
}

function iniciarExamen() {
  enModoExamen = true;
  preguntaActual = 0;
  respuestasUsuario = {};
  tiempoRestante = 1200; 
  
  const pT1 = obtenerAleatoriasParaExamen(preguntasTema['tema1'] || [], 4, 'tema1');
  const pT2 = obtenerAleatoriasParaExamen(preguntasTema['tema2'] || [], 3, 'tema2');
  const pT3 = obtenerAleatoriasParaExamen(preguntasTema['tema3'] || [], 3, 'tema3');
  const pT4 = obtenerAleatoriasParaExamen(preguntasTema['tema4'] || [], 3, 'tema4');
  const pT5 = obtenerAleatoriasParaExamen(preguntasTema['tema5'] || [], 3, 'tema5');
  const pT6 = obtenerAleatoriasParaExamen(preguntasTema['tema6'] || [], 2, 'tema6');
  const pT7 = obtenerAleatoriasParaExamen(preguntasTema['tema7'] || [], 2, 'tema7');

  let examenGenerado = [...pT1, ...pT2, ...pT3, ...pT4, ...pT5, ...pT6, ...pT7];
  preguntasActivas = examenGenerado.sort(() => 0.5 - Math.random());

  if (preguntasActivas.length === 0) {
    alert("Error: No hay preguntas en la base de datos.");
    renderMainMenu();
    return;
  }

  clearInterval(intervaloTimer);
  intervaloTimer = setInterval(actualizarTemporizador, 1000);
  
  renderizarPreguntaExamen();
}

function actualizarTemporizador() {
  tiempoRestante--;
  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const timerDisplay = document.getElementById('timer-display');
  
  if (timerDisplay) {
    timerDisplay.textContent = `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
    if (tiempoRestante < 300) timerDisplay.classList.add('text-red-500', 'animate-pulse');
  }

  if (tiempoRestante <= 0) {
    clearInterval(intervaloTimer);
    entregarExamen();
  }
}

function renderizarPreguntaExamen() {
  const pregunta = preguntasActivas[preguntaActual];
  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  
  mainContent.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
        <span class="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 py-1.5 px-4 rounded-full shadow-sm border border-red-200 dark:border-red-800">
          SIMULACRO OFICIAL - Pregunta ${preguntaActual + 1} de ${preguntasActivas.length}
        </span>
        
        <div class="flex gap-4 items-center">
            <div class="font-mono text-xl font-bold bg-gray-200 dark:bg-slate-700 px-3 py-1 rounded-lg" id="timer-display">
               ${minutos}:${segundos < 10 ? '0' : ''}${segundos}
            </div>
            <button id="btn-entregar" class="px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 shadow-sm transition-colors">
              Entregar
            </button>
        </div>
      </div>
      
      <div class="bg-gray-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-600 shadow-sm relative">
        <h3 class="text-xl md:text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 leading-relaxed">${pregunta.q}</h3>
        <div class="space-y-3" id="opciones-container">
          ${pregunta.options.map((opcion, index) => {
            const estaSeleccionada = respuestasUsuario[preguntaActual] === index;
            const clasesExtra = estaSeleccionada 
                ? 'border-blue-500 bg-blue-50 dark:bg-slate-600/50 dark:border-blue-500 shadow-inner' 
                : 'border-gray-200 dark:border-slate-600 hover:border-blue-400';
            return `
            <button class="opcion-examen-btn w-full text-left p-4 rounded-xl border-2 ${clasesExtra} transition-all font-medium text-gray-700 dark:text-gray-200" data-index="${index}">
              <span class="inline-block w-6 font-bold opacity-50">${index + 1}.</span> ${opcion}
            </button>`
          }).join('')}
        </div>
      </div>

      <div class="mt-6 flex justify-between min-h-[50px] items-center">
        <button id="btn-anterior" class="px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold rounded-xl transition-colors ${preguntaActual === 0 ? 'invisible' : ''}">⬅️ Anterior</button>
        <button id="btn-siguiente" class="px-6 py-3 bg-gray-800 dark:bg-slate-600 hover:bg-gray-900 dark:hover:bg-slate-500 text-white font-bold rounded-xl transition-colors ${preguntaActual === preguntasActivas.length - 1 ? 'invisible' : ''}">Siguiente ➡️</button>
      </div>
    </div>
  `;

  document.getElementById('btn-anterior').addEventListener('click', () => { preguntaActual--; renderizarPreguntaExamen(); });
  document.getElementById('btn-siguiente').addEventListener('click', () => { preguntaActual++; renderizarPreguntaExamen(); });
  document.getElementById('btn-entregar').addEventListener('click', entregarExamen);

  const botonesOpcion = document.querySelectorAll('.opcion-examen-btn');
  botonesOpcion.forEach(boton => {
    boton.addEventListener('click', (e) => seleccionarRespuestaExamen(e.currentTarget, botonesOpcion));
  });
}

function seleccionarRespuestaExamen(botonClicado, todosLosBotones) {
  const indiceClicado = parseInt(botonClicado.getAttribute('data-index'));
  respuestasUsuario[preguntaActual] = indiceClicado;

  todosLosBotones.forEach(btn => {
    btn.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-slate-600/50', 'dark:border-blue-500', 'shadow-inner');
    btn.classList.add('border-gray-200', 'dark:border-slate-600');
  });
  
  botonClicado.classList.remove('border-gray-200', 'dark:border-slate-600');
  botonClicado.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-slate-600/50', 'dark:border-blue-500', 'shadow-inner');
}

function entregarExamen() {
  clearInterval(intervaloTimer);
  enModoExamen = false;
  
  let aciertos = 0; let fallos = 0; let enBlanco = 0;
  let htmlFallos = ''; let htmlAciertos = '';

  preguntasActivas.forEach((pregunta, index) => {
    const respuestaUser = respuestasUsuario[index];
    const respuestaCorrectaTexto = pregunta.options[pregunta.ans];
    
    if (respuestaUser === undefined) {
      enBlanco++;
      guardarFallo(pregunta.temaOriginal, pregunta.indexOriginal); // Guardar en bolsa
      htmlFallos += generarTarjetaRevision(index + 1, pregunta.q, "No contestada", respuestaCorrectaTexto, "blanco");
    } else if (respuestaUser === pregunta.ans) {
      aciertos++;
      eliminarFallo(pregunta.temaOriginal, pregunta.indexOriginal); // Eliminar de la bolsa si se acierta
      htmlAciertos += generarTarjetaRevision(index + 1, pregunta.q, pregunta.options[respuestaUser], respuestaCorrectaTexto, "acierto");
    } else {
      fallos++;
      guardarFallo(pregunta.temaOriginal, pregunta.indexOriginal); // Guardar en bolsa
      htmlFallos += generarTarjetaRevision(index + 1, pregunta.q, pregunta.options[respuestaUser], respuestaCorrectaTexto, "fallo");
    }
  });

  const estaAprobado = aciertos >= 16;

  mainContent.innerHTML = `
    <div class="max-w-4xl mx-auto animate-fade-in py-8">
      <div class="text-center mb-12 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div class="text-6xl mb-4">${estaAprobado ? '✅' : '❌'}</div>
        <h2 class="text-4xl font-extrabold mb-2 text-gray-800 dark:text-white uppercase tracking-wider">
          ${estaAprobado ? '<span class="text-green-600">APTO</span>' : '<span class="text-red-600">NO APTO</span>'}
        </h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">
          Se necesitaban 16 aciertos para aprobar. Has conseguido <strong>${aciertos}</strong>.
        </p>
        
        <div class="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div class="text-2xl font-bold text-green-700 dark:text-green-400">${aciertos}</div>
            <div class="text-sm text-green-600 dark:text-green-500">Aciertos</div>
          </div>
          <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800">
            <div class="text-2xl font-bold text-red-700 dark:text-red-400">${fallos}</div>
            <div class="text-sm text-red-600 dark:text-red-500">Fallos</div>
          </div>
          <div class="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl border border-gray-200 dark:border-slate-600">
            <div class="text-2xl font-bold text-gray-700 dark:text-gray-300">${enBlanco}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">En blanco</div>
          </div>
        </div>
        
        <button id="btn-volver-menu" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-transform transform hover:-translate-y-0.5">
          Volver al Menú Principal
        </button>
      </div>

      <div class="mt-8">
        <h3 class="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b-2 border-gray-200 dark:border-slate-700 pb-2">Revisión del Examen</h3>
        ${htmlFallos.length > 0 ? `<div class="mb-10"><h4 class="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><span>❌</span> Tus Fallos</h4><div class="space-y-4">${htmlFallos}</div></div>` : ''}
        ${htmlAciertos.length > 0 ? `<div><h4 class="text-xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2"><span>✅</span> Tus Aciertos</h4><div class="space-y-4">${htmlAciertos}</div></div>` : ''}
      </div>
    </div>
  `;
  window.scrollTo(0, 0);
  document.getElementById('btn-volver-menu').addEventListener('click', renderMainMenu);
}

function generarTarjetaRevision(numero, textoPregunta, respuestaUser, respuestaCorrecta, tipo) {
  let estiloBorde = ""; let iconoUser = ""; let colorUser = "";
  if (tipo === "fallo") { estiloBorde = "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10"; iconoUser = "❌"; colorUser = "text-red-600 dark:text-red-400"; } 
  else if (tipo === "blanco") { estiloBorde = "border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800"; iconoUser = "⚪"; colorUser = "text-gray-500 dark:text-gray-400 italic"; } 
  else if (tipo === "acierto") { estiloBorde = "border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10"; iconoUser = "✅"; colorUser = "text-green-600 dark:text-green-400"; }

  return `
    <div class="p-5 rounded-xl border-2 ${estiloBorde} shadow-sm">
      <p class="font-bold text-gray-800 dark:text-gray-100 mb-3 text-lg">${numero}. ${textoPregunta}</p>
      <div class="flex flex-col gap-2 text-sm md:text-base bg-white dark:bg-slate-900/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
        ${tipo !== "acierto" ? `
          <div class="flex items-start gap-2 ${colorUser}"><span>${iconoUser}</span><span><strong>Tu respuesta:</strong> ${respuestaUser}</span></div>
          <div class="flex items-start gap-2 text-green-700 dark:text-green-400 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700"><span>👉</span><span><strong>Correcta:</strong> ${respuestaCorrecta}</span></div>
        ` : `
          <div class="flex items-start gap-2 text-green-700 dark:text-green-400"><span>✅</span><span><strong>Acertaste:</strong> ${respuestaCorrecta}</span></div>
        `}
      </div>
    </div>
  `;
}

// ==========================================
//    LÓGICA DEL MODO PRÁCTICA / FALLOS
// ==========================================
function iniciarPractica() {
  enModoPractica = true;
  preguntaActual = 0;
  // Preparamos las preguntas del tema elegido
  preguntasActivas = preguntasTema[temaActual].map((q, i) => ({ ...q, temaOriginal: temaActual, indexOriginal: i }));
  renderizarPregunta();
}

function renderizarPregunta() {
  if (preguntasActivas.length === 0) {
    alert("¡No hay preguntas disponibles!");
    renderMainMenu();
    return;
  }
  
  const pregunta = preguntasActivas[preguntaActual];
  
  let etiquetaCabecera = "";
  let colorCabecera = "";
  
  if (enModoFallos) {
    etiquetaCabecera = `REPASO DE FALLOS - Pregunta ${preguntaActual + 1} de ${preguntasActivas.length}`;
    colorCabecera = "text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800";
  } else {
    const tituloActual = titulosTemas[temaActual] || temaActual;
    etiquetaCabecera = `${tituloActual} - Pregunta ${preguntaActual + 1} de ${preguntasActivas.length}`;
    colorCabecera = "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800";
  }
  
  mainContent.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
        <span class="text-sm font-bold py-1.5 px-4 rounded-full shadow-sm border ${colorCabecera}">
          ${etiquetaCabecera}
        </span>
        <div class="flex gap-4 items-center">
            <button id="btn-leer" class="text-2xl hover:scale-110 transition-transform" title="Leer en voz alta">🔊</button>
            <button id="btn-volver" class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm underline decoration-dotted transition-colors">Salir al Menú</button>
        </div>
      </div>
      
      <div class="bg-gray-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-600 shadow-sm relative">
        <div class="absolute top-2 right-4 text-xs text-gray-400">Atajos: 1, 2, 3</div>
        <h3 class="text-xl md:text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 leading-relaxed">${pregunta.q}</h3>
        <div class="space-y-3" id="opciones-container">
          ${pregunta.options.map((opcion, index) => `
            <button class="opcion-btn w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600/50 dark:hover:border-blue-500 transition-all font-medium text-gray-700 dark:text-gray-200" data-index="${index}">
              <span class="inline-block w-6 font-bold opacity-50">${index + 1}.</span> ${opcion}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="mt-6 flex justify-between min-h-[50px] items-center">
        <div class="text-sm text-gray-400 hidden md:block">Usa ⬅️ ➡️ para navegar</div>
        <button id="btn-siguiente" class="hidden px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-transform transform hover:-translate-y-0.5 ml-auto">
          Siguiente ➡️
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-volver').addEventListener('click', () => { window.speechSynthesis.cancel(); renderMainMenu(); });
  document.getElementById('btn-siguiente').addEventListener('click', avanzarPregunta);
  document.getElementById('btn-leer').addEventListener('click', () => { leerEnVozAlta(pregunta.q, pregunta.options); });

  const botonesOpcion = document.querySelectorAll('.opcion-btn');
  botonesOpcion.forEach(boton => {
    boton.addEventListener('click', (e) => evaluarRespuesta(e.currentTarget, pregunta.ans, botonesOpcion));
  });
}

function evaluarRespuesta(botonClicado, indiceCorrecto, todosLosBotones) {
  if(botonClicado.disabled) return;
  const indiceClicado = parseInt(botonClicado.getAttribute('data-index'));
  const btnSiguiente = document.getElementById('btn-siguiente');
  
  const pregunta = preguntasActivas[preguntaActual];

  todosLosBotones.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove('hover:border-blue-500', 'hover:bg-blue-50', 'dark:hover:bg-slate-600/50');
    btn.classList.add('opacity-60', 'cursor-not-allowed');
  });

  if (indiceClicado === indiceCorrecto) {
    // ACIERTO
    botonClicado.classList.replace('border-gray-200', 'border-green-500');
    botonClicado.classList.replace('dark:border-slate-600', 'dark:border-green-500');
    botonClicado.classList.add('bg-green-50', 'dark:bg-green-900/30', 'opacity-100');
    
    // Si la acierta, la eliminamos de la bolsa de fallos
    eliminarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
  } else {
    // FALLO
    botonClicado.classList.replace('border-gray-200', 'border-red-500');
    botonClicado.classList.replace('dark:border-slate-600', 'dark:border-red-500');
    botonClicado.classList.add('bg-red-50', 'dark:bg-red-900/30', 'opacity-100');
    if(todosLosBotones[indiceCorrecto]) {
        todosLosBotones[indiceCorrecto].classList.replace('border-gray-200', 'border-green-500');
        todosLosBotones[indiceCorrecto].classList.replace('dark:border-slate-600', 'dark:border-green-500');
        todosLosBotones[indiceCorrecto].classList.add('bg-green-50', 'dark:bg-green-900/30', 'opacity-100');
    }
    
    // Si la falla, la añadimos a la bolsa de fallos
    guardarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
  }
  btnSiguiente.classList.remove('hidden');
}

function avanzarPregunta() {
  window.speechSynthesis.cancel();
  if (preguntaActual < preguntasActivas.length - 1) {
    preguntaActual++;
    renderizarPregunta();
  } else {
    alert("¡Has terminado este bloque de preguntas!");
    renderMainMenu();
  }
}

function retrocederPregunta() {
  if (preguntaActual > 0) {
    window.speechSynthesis.cancel();
    preguntaActual--;
    renderizarPregunta();
  }
}

function leerEnVozAlta(textoPregunta, opciones) {
  window.speechSynthesis.cancel();
  const textoCompleto = textoPregunta + ". " + opciones.join(". ");
  const utterance = new SpeechSynthesisUtterance(textoCompleto);
  utterance.lang = 'es-ES';
  window.speechSynthesis.speak(utterance);
}

// Eventos de teclado
document.addEventListener('keydown', (e) => {
  if (enModoPractica || enModoFallos) {
    const btnSiguiente = document.getElementById('btn-siguiente');
    if (e.key === 'ArrowRight' && btnSiguiente && !btnSiguiente.classList.contains('hidden')) avanzarPregunta();
    else if (e.key === 'ArrowLeft') retrocederPregunta();
    
    if (['1', '2', '3'].includes(e.key)) {
      const indice = parseInt(e.key) - 1;
      const botones = document.querySelectorAll('.opcion-btn');
      if (botones[indice] && !botones[indice].disabled) botones[indice].click();
    }
  } else if (enModoExamen) {
    if (e.key === 'ArrowRight' && preguntaActual < preguntasActivas.length - 1) { preguntaActual++; renderizarPreguntaExamen(); }
    else if (e.key === 'ArrowLeft' && preguntaActual > 0) { preguntaActual--; renderizarPreguntaExamen(); }
    
    if (['1', '2', '3'].includes(e.key)) {
      const indice = parseInt(e.key) - 1;
      const botones = document.querySelectorAll('.opcion-examen-btn');
      if (botones[indice]) botones[indice].click();
    }
  }
});

renderMainMenu();