// --- IMPORTACIONES ---
import './style.css';
import { preguntasTema, titulosTemas } from './data/preguntas.js';

// --- 1. SISTEMA DE ANUNCIOS Y DONACIONES ---
let esDonante = localStorage.getItem('esDonante') === 'true';

function renderBotonDonar() {
  const paypalLink = "https://paypal.me/TESTARMAS"; // <-- PON TU LINK AQUÍ
  
  return `
    <div class="flex flex-col items-center justify-center my-10 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-inner">
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">
        ¿Te hemos ayudado a preparar el examen?
      </p>
      
      <a href="${paypalLink}" 
         target="_blank" 
         rel="noopener noreferrer"
         class="group relative flex items-center justify-center gap-3 bg-[#0070ba] hover:bg-[#005ea6] text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/20 w-full max-w-xs">
        
        <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20.067 8.478c.492.88.556 2.014.307 3.232-.401 1.954-1.604 3.398-3.61 3.398h-1.33c-.444 0-.813.333-.878.773l-1.03 7.025c-.075.509-.512.894-1.025.894h-3.213c-.462 0-.81-.425-.755-.884l.54-4.522c.065-.44.434-.773.878-.773h.584c2.257 0 4.108-1.503 4.545-3.63.14-.683.095-1.301-.122-1.782-.203-.45-.55-.805-1.042-1.063-.092-.048-.042-.187.06-.187h1.012c.797 0 1.54.401 2.079 1.118zM16.29 4.384c.412 1.332.13 2.893-.814 4.305-.913 1.366-2.428 2.222-4.148 2.222h-2.12c-.444 0-.813.333-.878.773l-1.03 7.025c-.075.509-.512.894-1.025.894H3.062c-.462 0-.81-.425-.755-.884l2.125-17.746c.07-.582.565-1.013 1.151-1.013h7.108c1.564 0 2.875.437 3.599 1.424z"/>
        </svg>

        <span>Pagar con PayPal</span>

        <div class="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </a>
      
      <span class="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
        Seguro • Rápido • Sin registro
      </span>
    </div>
  `;
}
// --- 2. LÓGICA MODO OSCURO ---
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

// --- 3. GESTIÓN DE LA BOLSA DE FALLOS ---
function obtenerBolsaFallos() {
  return JSON.parse(localStorage.getItem('bolsaFallos')) || [];
}

function guardarFallo(tema, indexOriginal) {
  const fallos = obtenerBolsaFallos();
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

// --- 4. ESTADO DE LA APLICACIÓN ---
const mainContent = document.getElementById('main-content');
let temaActual = '';
let preguntaActual = 0;
let enModoPractica = false;
let enModoExamen = false;
let enModoFallos = false;
let preguntasActivas = []; 
let respuestasUsuario = {}; 
let tiempoRestante = 1200; 
let intervaloTimer = null;

// --- 5. MENÚ PRINCIPAL ---
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
    <div class="text-center animate-fade-in">
      ${renderAnuncio('top-ad')}
      
      <h2 class="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Configura tu test
      </h2>
      
      <div class="mb-8 max-w-md mx-auto">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selecciona el Tema (Para Práctica)</label>
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
          Simulacro de Examen
          <div class="text-xs font-normal mt-1 opacity-80">20 preg. | 20 min. | Mín: 16</div>
        </button>

        <button id="btn-fallos" class="p-6 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-semibold shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-1 relative ${numFallos === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}" ${numFallos === 0 ? 'disabled' : ''}>
          <div class="absolute -top-3 -right-3 bg-red-600 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
            ${numFallos}
          </div>
          <div class="text-3xl mb-2">🔄</div>
          Bolsa de Fallos
          <div class="text-xs font-normal mt-1 opacity-80">Repasa tus errores</div>
        </button>
      </div>

      <div class="mt-10 max-w-2xl mx-auto p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-700/30 rounded-2xl border border-blue-100 dark:border-slate-600 text-center">
        <p class="text-sm text-blue-800 dark:text-blue-300 font-medium mb-3">
          ${esDonante ? '🌟 ¡Modo Premium activado! Gracias por tu apoyo.' : '¿Cansado de la publicidad?'}
        </p>
        <button id="btn-donar" class="px-6 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-slate-500 text-sm font-bold hover:shadow-md transition-all">
          ${esDonante ? 'Premium Activo' : '🎁 Quitar Publicidad'}
        </button>
      </div>

      ${renderAnuncio('bottom-ad')}
    </div>
  `;

  document.getElementById('btn-practica').addEventListener('click', () => { temaActual = document.getElementById('selector-tema').value; iniciarPractica(); });
  document.getElementById('btn-examen').addEventListener('click', iniciarExamen);
  document.getElementById('btn-fallos').addEventListener('click', iniciarBolsaFallos);
  document.getElementById('btn-donar').addEventListener('click', gestionarDonacion);
}

function gestionarDonacion() {
  if (esDonante) {
    alert("Ya tienes activado el modo sin anuncios. ¡Gracias por usar la app!");
    return;
  }
  const code = prompt("Para quitar anuncios, introduce el código secreto (Ej: PRO2026):");
  if (code === 'PRO2026') {
    localStorage.setItem('esDonante', 'true');
    esDonante = true;
    location.reload();
  }
}

// ==========================================
//          LÓGICA DEL MODO EXAMEN
// ==========================================
function obtenerAleatoriasParaExamen(array, cantidad, temaNombre) {
  if (!array) return [];
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
        <span class="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 py-1.5 px-4 rounded-full border border-red-200 dark:border-red-800">
          SIMULACRO DE EXAMEN - Pregunta ${preguntaActual + 1} de ${preguntasActivas.length}
        </span>
        <div class="flex gap-4 items-center">
            <div class="font-mono text-xl font-bold bg-gray-200 dark:bg-slate-700 px-3 py-1 rounded-lg" id="timer-display">
               ${minutos}:${segundos < 10 ? '0' : ''}${segundos}
            </div>
            <button id="btn-entregar" class="px-4 py-1.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors">Entregar</button>
        </div>
      </div>
      
      <div class="bg-gray-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-600 relative">
        <h3 class="text-xl md:text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 leading-relaxed">${pregunta.q}</h3>
        <div class="space-y-3" id="opciones-container">
          ${pregunta.options.map((opcion, index) => {
            const estaSeleccionada = respuestasUsuario[preguntaActual] === index;
            const clasesExtra = estaSeleccionada ? 'border-blue-500 bg-blue-50 dark:bg-slate-600/50 dark:border-blue-500 shadow-inner' : 'border-gray-200 dark:border-slate-600 hover:border-blue-400';
            return `
            <button class="opcion-examen-btn w-full text-left p-4 rounded-xl border-2 ${clasesExtra} transition-all font-medium text-gray-700 dark:text-gray-200" data-index="${index}">
              <span class="inline-block w-6 font-bold opacity-50">${index + 1}.</span> ${opcion}
            </button>`
          }).join('')}
        </div>
      </div>

      <div class="mt-6 flex justify-between items-center">
        <button id="btn-anterior" class="px-6 py-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold rounded-xl ${preguntaActual === 0 ? 'invisible' : ''}">⬅️ Anterior</button>
        <button id="btn-siguiente" class="px-6 py-3 bg-gray-800 dark:bg-slate-600 hover:bg-gray-900 dark:hover:bg-slate-500 text-white font-bold rounded-xl ${preguntaActual === preguntasActivas.length - 1 ? 'invisible' : ''}">Siguiente ➡️</button>
      </div>
    </div>
  `;

  document.getElementById('btn-anterior').addEventListener('click', () => { preguntaActual--; renderizarPreguntaExamen(); });
  document.getElementById('btn-siguiente').addEventListener('click', () => { preguntaActual++; renderizarPreguntaExamen(); });
  document.getElementById('btn-entregar').addEventListener('click', entregarExamen);

  const botones = document.querySelectorAll('.opcion-examen-btn');
  botones.forEach(boton => boton.addEventListener('click', (e) => seleccionarRespuestaExamen(e.currentTarget, botones)));
}

function seleccionarRespuestaExamen(botonClicado, todosLosBotones) {
  respuestasUsuario[preguntaActual] = parseInt(botonClicado.getAttribute('data-index'));
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
      enBlanco++; guardarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
      htmlFallos += generarTarjetaRevision(index + 1, pregunta.q, "No contestada", respuestaCorrectaTexto, "blanco");
    } else if (respuestaUser === pregunta.ans) {
      aciertos++; eliminarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
      htmlAciertos += generarTarjetaRevision(index + 1, pregunta.q, pregunta.options[respuestaUser], respuestaCorrectaTexto, "acierto");
    } else {
      fallos++; guardarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
      htmlFallos += generarTarjetaRevision(index + 1, pregunta.q, pregunta.options[respuestaUser], respuestaCorrectaTexto, "fallo");
    }
  });

  const estaAprobado = aciertos >= 16;
  mainContent.innerHTML = `
    <div class="max-w-4xl mx-auto animate-fade-in py-8">
      <div class="text-center mb-12 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
        <div class="text-6xl mb-4">${estaAprobado ? '✅' : '❌'}</div>
        <h2 class="text-4xl font-extrabold mb-2 text-gray-800 dark:text-white">${estaAprobado ? '<span class="text-green-600">APTO</span>' : '<span class="text-red-600">NO APTO</span>'}</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">Has conseguido <strong>${aciertos}</strong> aciertos (se necesitaban 16).</p>
        <div class="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200"><div class="text-2xl font-bold text-green-700">${aciertos}</div><div class="text-sm text-green-600">Aciertos</div></div>
          <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200"><div class="text-2xl font-bold text-red-700">${fallos}</div><div class="text-sm text-red-600">Fallos</div></div>
          <div class="bg-gray-100 dark:bg-slate-700 p-4 rounded-xl border border-gray-200"><div class="text-2xl font-bold text-gray-700">${enBlanco}</div><div class="text-sm text-gray-500">En blanco</div></div>
        </div>
        <button id="btn-volver-menu" class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl">Volver al Menú</button>
      </div>
      <div class="mt-8">
        ${htmlFallos.length > 0 ? `<h4 class="text-xl font-bold text-red-600 mb-4">❌ Tus Fallos</h4><div class="space-y-4 mb-10">${htmlFallos}</div>` : ''}
        ${htmlAciertos.length > 0 ? `<h4 class="text-xl font-bold text-green-600 mb-4">✅ Tus Aciertos</h4><div class="space-y-4">${htmlAciertos}</div>` : ''}
      </div>
    </div>
  `;
  window.scrollTo(0, 0);
  document.getElementById('btn-volver-menu').addEventListener('click', renderMainMenu);
}

function generarTarjetaRevision(numero, textoPregunta, respuestaUser, respuestaCorrecta, tipo) {
  const estilo = tipo === "fallo" ? "border-red-300 bg-red-50" : (tipo === "blanco" ? "border-gray-300 bg-gray-50" : "border-green-300 bg-green-50");
  return `
    <div class="p-5 rounded-xl border-2 ${estilo} dark:bg-slate-800 shadow-sm">
      <p class="font-bold text-gray-800 dark:text-gray-100 mb-3">${numero}. ${textoPregunta}</p>
      <div class="text-sm md:text-base bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
        ${tipo !== "acierto" ? `
          <div class="text-red-600 dark:text-red-400"><strong>Tu respuesta:</strong> ${respuestaUser}</div>
          <div class="text-green-700 dark:text-green-400 mt-2 pt-2 border-t"><strong>Correcta:</strong> ${respuestaCorrecta}</div>
        ` : `<div class="text-green-700 dark:text-green-400"><strong>Acertaste:</strong> ${respuestaCorrecta}</div>`}
      </div>
    </div>
  `;
}

// ==========================================
//    LÓGICA DEL MODO PRÁCTICA / FALLOS
// ==========================================
function iniciarPractica() {
  enModoPractica = true; enModoFallos = false; preguntaActual = 0;
  preguntasActivas = preguntasTema[temaActual].map((q, i) => ({ ...q, temaOriginal: temaActual, indexOriginal: i }));
  renderizarPregunta();
}

function iniciarBolsaFallos() {
  const fallos = obtenerBolsaFallos();
  if (fallos.length === 0) return;
  enModoPractica = false; enModoFallos = true; preguntaActual = 0;
  preguntasActivas = fallos.map(f => ({ ...preguntasTema[f.tema][f.index], temaOriginal: f.tema, indexOriginal: f.index })).sort(() => 0.5 - Math.random());
  renderizarPregunta();
}

function renderizarPregunta() {
  if (preguntasActivas.length === 0) { alert("¡No hay preguntas disponibles!"); renderMainMenu(); return; }
  const pregunta = preguntasActivas[preguntaActual];
  
  const tituloCabecera = enModoFallos ? "REPASO DE FALLOS" : (titulosTemas[temaActual] || temaActual);
  const colorCabecera = enModoFallos ? "text-amber-600 bg-amber-100 border-amber-200" : "text-blue-600 bg-blue-100 border-blue-200";
  
  mainContent.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
        <span class="text-sm font-bold py-1.5 px-4 rounded-full border dark:bg-slate-800 ${colorCabecera}">${tituloCabecera} - Pregunta ${preguntaActual + 1} de ${preguntasActivas.length}</span>
        <div class="flex gap-4 items-center">
            <button id="btn-leer" class="text-2xl hover:scale-110 transition-transform">🔊</button>
            <button id="btn-volver" class="text-gray-500 hover:text-gray-800 dark:text-gray-400 text-sm underline">Salir</button>
        </div>
      </div>
      
      <div class="bg-gray-50 dark:bg-slate-700/50 p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-slate-600">
        <h3 class="text-xl md:text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100">${pregunta.q}</h3>
        <div class="space-y-3" id="opciones-container">
          ${pregunta.options.map((opcion, index) => `
            <button class="opcion-btn w-full text-left p-4 rounded-xl border-2 border-gray-200 dark:border-slate-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600/50 transition-all font-medium text-gray-700 dark:text-gray-200" data-index="${index}">
              <span class="inline-block w-6 font-bold opacity-50">${index + 1}.</span> ${opcion}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="mt-6 flex justify-between min-h-[50px] items-center">
        <div class="text-sm text-gray-400 hidden md:block">Usa atajos: 1, 2, 3 o flechas</div>
        <button id="btn-siguiente" class="hidden px-6 py-3 bg-blue-600 text-white font-bold rounded-xl ml-auto">Siguiente ➡️</button>
      </div>
    </div>
  `;

  document.getElementById('btn-volver').addEventListener('click', () => { window.speechSynthesis.cancel(); renderMainMenu(); });
  document.getElementById('btn-siguiente').addEventListener('click', avanzarPregunta);
  document.getElementById('btn-leer').addEventListener('click', () => leerEnVozAlta(pregunta.q, pregunta.options));

  const botones = document.querySelectorAll('.opcion-btn');
  botones.forEach(boton => boton.addEventListener('click', (e) => evaluarRespuesta(e.currentTarget, pregunta.ans, botones)));
}

function evaluarRespuesta(botonClicado, indiceCorrecto, todosLosBotones) {
  if(botonClicado.disabled) return;
  const indiceClicado = parseInt(botonClicado.getAttribute('data-index'));
  const pregunta = preguntasActivas[preguntaActual];

  todosLosBotones.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-not-allowed');
  });

  if (indiceClicado === indiceCorrecto) {
    botonClicado.classList.replace('border-gray-200', 'border-green-500');
    botonClicado.classList.add('bg-green-50', 'dark:bg-green-900/30', 'opacity-100');
    eliminarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
  } else {
    botonClicado.classList.replace('border-gray-200', 'border-red-500');
    botonClicado.classList.add('bg-red-50', 'dark:bg-red-900/30', 'opacity-100');
    if(todosLosBotones[indiceCorrecto]) {
        todosLosBotones[indiceCorrecto].classList.replace('border-gray-200', 'border-green-500');
        todosLosBotones[indiceCorrecto].classList.add('bg-green-50', 'dark:bg-green-900/30', 'opacity-100');
    }
    guardarFallo(pregunta.temaOriginal, pregunta.indexOriginal);
  }
  document.getElementById('btn-siguiente').classList.remove('hidden');
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

function leerEnVozAlta(textoPregunta, opciones) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(textoPregunta + ". " + opciones.join(". "));
  utterance.lang = 'es-ES';
  window.speechSynthesis.speak(utterance);
}

// ==========================================
//          EVENTOS DE TECLADO
// ==========================================
document.addEventListener('keydown', (e) => {
  if (enModoPractica || enModoFallos) {
    const btnSiguiente = document.getElementById('btn-siguiente');
    if (e.key === 'ArrowRight' && btnSiguiente && !btnSiguiente.classList.contains('hidden')) avanzarPregunta();
    
    if (['1', '2', '3'].includes(e.key)) {
      const botones = document.querySelectorAll('.opcion-btn');
      if (botones[parseInt(e.key) - 1] && !botones[parseInt(e.key) - 1].disabled) botones[parseInt(e.key) - 1].click();
    }
  } else if (enModoExamen) {
    if (e.key === 'ArrowRight' && preguntaActual < preguntasActivas.length - 1) { preguntaActual++; renderizarPreguntaExamen(); }
    else if (e.key === 'ArrowLeft' && preguntaActual > 0) { preguntaActual--; renderizarPreguntaExamen(); }
    
    if (['1', '2', '3'].includes(e.key)) {
      const botones = document.querySelectorAll('.opcion-examen-btn');
      if (botones[parseInt(e.key) - 1]) botones[parseInt(e.key) - 1].click();
    }
  }
});

renderMainMenu();
// --- AVISO DE COOKIES (RGPD) ---
if (!localStorage.getItem('cookiesAceptadas')) {
  const banner = document.createElement('div');
  banner.className = "fixed bottom-0 left-0 w-full bg-slate-900 text-white p-4 text-center z-50 text-sm md:text-base border-t border-slate-700 shadow-2xl animate-fade-in flex flex-col md:flex-row justify-center items-center gap-4";
  banner.innerHTML = `
    <p>Usamos cookies propias y de terceros (Google AdSense) para personalizar anuncios y analizar el tráfico. Si continúas navegando, consideramos que aceptas su uso.</p>
    <div class="flex gap-3 shrink-0">
      <button id="btn-aceptar-cookies" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors">Aceptar</button>
      <a href="/legal.html#cookies" class="bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-xl transition-colors text-sm flex items-center">Leer más</a>
    </div>
  `;
  document.body.appendChild(banner);
  
  document.getElementById('btn-aceptar-cookies').addEventListener('click', () => {
    localStorage.setItem('cookiesAceptadas', 'true');
    banner.remove();
  });
}