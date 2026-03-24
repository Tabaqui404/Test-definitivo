import './style.css';
import { preguntasTema, titulosTemas } from './data/preguntas.js';

// --- 1. SISTEMA DE ANUNCIOS Y DONACIONES ---
let esDonante = localStorage.getItem('esDonante') === 'true';

function renderAnuncio(id) {
  if (esDonante) return ''; 
  return `
    <div class="my-4 p-4 bg-gray-50 dark:bg-slate-900/40 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center">
      <span class="text-[10px] uppercase tracking-widest text-gray-400 block mb-2 font-bold">Publicidad</span>
      <div id="${id}" class="min-h-[90px] flex items-center justify-center text-gray-400 italic text-sm">
        Espacio para Google AdSense
      </div>
    </div>
  `;
}

// --- 2. ESTADO DE LA APP ---
const mainContent = document.getElementById('main-content');
let temaActual = '';
let preguntaActual = 0;
let preguntasActivas = [];
let respuestasUsuario = {};
let tiempoRestante = 1200;
let intervaloTimer = null;
let enModoExamen = false;

// --- 3. LÓGICA MODO OSCURO ---
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const htmlElement = document.documentElement;

themeToggleBtn.addEventListener('click', () => {
  htmlElement.classList.toggle('dark');
  themeIcon.textContent = htmlElement.classList.contains('dark') ? '☀️' : '🌙';
});

// --- 4. GESTIÓN DE LA BOLSA DE FALLOS ---
function obtenerBolsaFallos() { return JSON.parse(localStorage.getItem('bolsaFallos')) || []; }
function guardarFallo(tema, index) {
  const fallos = obtenerBolsaFallos();
  if (!fallos.find(f => f.tema === tema && f.index === index)) {
    fallos.push({ tema, index });
    localStorage.setItem('bolsaFallos', JSON.stringify(fallos));
  }
}
function eliminarFallo(tema, index) {
  let fallos = obtenerBolsaFallos();
  fallos = fallos.filter(f => !(f.tema === tema && f.index === index));
  localStorage.setItem('bolsaFallos', JSON.stringify(fallos));
}

// --- 5. MENÚ PRINCIPAL ---
function renderMainMenu() {
  enModoExamen = false;
  clearInterval(intervaloTimer);
  const numFallos = obtenerBolsaFallos().length;
  const opcionesTemas = Object.keys(preguntasTema).map(t => `<option value="${t}">${titulosTemas[t] || t}</option>`).join('');

  mainContent.innerHTML = `
    <div class="animate-fade-in">
      ${renderAnuncio('top-ad')}
      <div class="text-center mb-8">
        <h2 class="text-xl font-bold text-gray-700 dark:text-gray-200 mb-4">Configura tu entrenamiento</h2>
        <select id="selector-tema" class="w-full max-w-xs p-3 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 mb-6 font-medium">
          ${opcionesTemas}
        </select>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <button id="btn-practica" class="p-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg font-bold">📚 Modo Práctica</button>
          <button id="btn-examen" class="p-5 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg font-bold">🎯 Simulacro Real</button>
        </div>
        <button id="btn-fallos" class="mt-4 w-full max-w-2xl p-4 bg-amber-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 ${numFallos === 0 ? 'opacity-50 grayscale' : ''}" ${numFallos === 0 ? 'disabled' : ''}>
          🔄 Repasar Fallos (${numFallos})
        </button>
      </div>

      <div class="mt-10 p-6 bg-blue-50 dark:bg-slate-700/50 rounded-2xl border border-blue-100 dark:border-slate-600 text-center">
        <p class="text-sm text-blue-800 dark:text-blue-300 font-bold mb-3">${esDonante ? '🌟 MODO PREMIUM ACTIVO' : '¿Cansado de la publicidad?'}</p>
        <button id="btn-donar" class="px-6 py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-slate-500 text-sm font-bold hover:shadow-md transition-all">
          ${esDonante ? '¡Gracias por tu apoyo!' : '🎁 Quitar Publicidad'}
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
  if (esDonante) return;
  const code = prompt("Introduce el código 'PRO2026' para quitar anuncios (Simulación de donación):");
  if (code === 'PRO2026') {
    localStorage.setItem('esDonante', 'true');
    esDonante = true;
    location.reload();
  }
}

// --- 6. FUNCIONES DE EXAMEN Y PRÁCTICA (SIMPLIFICADAS) ---
function iniciarPractica() {
  preguntasActivas = preguntasTema[temaActual].map((q, i) => ({ ...q, temaOriginal: temaActual, indexOriginal: i }));
  preguntaActual = 0;
  renderizarPregunta();
}

function iniciarBolsaFallos() {
  preguntasActivas = obtenerBolsaFallos().map(f => ({ ...preguntasTema[f.tema][f.index], temaOriginal: f.tema, indexOriginal: f.index }));
  preguntaActual = 0;
  renderizarPregunta();
}

function iniciarExamen() {
  enModoExamen = true; respuestasUsuario = {}; tiempoRestante = 1200;
  // Generamos 20 aleatorias (distribución oficial simplificada)
  preguntasActivas = Object.keys(preguntasTema).flatMap(t => 
    preguntasTema[t].map((q, i) => ({ ...q, temaOriginal: t, indexOriginal: i }))
  ).sort(() => 0.5 - Math.random()).slice(0, 20);
  
  clearInterval(intervaloTimer);
  intervaloTimer = setInterval(() => {
    tiempoRestante--;
    if (tiempoRestante <= 0) entregarExamen();
    else {
      const timer = document.getElementById('timer-display');
      if (timer) timer.textContent = `${Math.floor(tiempoRestante/60)}:${(tiempoRestante%60).toString().padStart(2,'0')}`;
    }
  }, 1000);
  renderizarPreguntaExamen();
}

// Aquí irían tus funciones de renderizarPregunta, evaluarRespuesta y entregarExamen que ya teníamos.
// Por brevedad, he incluido el esqueleto principal. 

renderMainMenu();