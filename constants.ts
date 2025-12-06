
import type { Pond, Accessory, Settings, Mission, Anomaly } from './types';

export const WORLD_WIDTH = 9000;
export const WORLD_HEIGHT = 9000;
export const PLAYER_START_RADIUS = 20;
export const FOOD_RADIUS = 7;

// POPULATION SETTINGS
export const NUM_FOOD = 2500; 
export const NUM_BOTS = 120; 
export const NUM_PREDATORS = 10;
export const PREDATOR_START_RADIUS_MIN = 200;
export const PREDATOR_START_RADIUS_MAX = 350;

export const NUM_WHIRLPOOLS = 20;
export const WHIRLPOOL_MIN_RADIUS = 50;
export const WHIRLPOOL_MAX_RADIUS = 150;

export const NUM_PARTICLES = 200;

export const SEASHELL_RADIUS = 40;
export const SEASHELL_SUCTION_RADIUS = 300;
export const SEASHELL_MAX_VICTIM_RADIUS = 50;

export const TOXIC_CLOUD_MIN_RADIUS = 100;
export const TOXIC_CLOUD_MAX_RADIUS = 250;

export const LEVIATHAN_START_RADIUS = 800;
export const LEVIATHAN_CURRENT_RADIUS = 1500;
export const LEVIATHAN_CURRENT_STRENGTH = 3;

export const STEAM_VENT_RADIUS = 60;
export const STEAM_VENT_FORCE = 5;
export const STEAM_VENT_CYCLE_MS = 8000;
export const STEAM_VENT_ACTIVE_MS = 2000;

export const TIME_ATTACK_SECONDS = 180;

export const BOSS_EAT_RATIO = 1.25;

export const GLITCH_ZONE_THRESHOLD = 8500; 

// ANOMALIES
export const ANOMALIES: Anomaly[] = [
    { id: 'monolith_alpha', type: 'MONOLITH', x: 8800, y: 8800, radius: 100, color: '#111' },
    { id: 'cube_void', type: 'STATIC_CUBE', x: 8500, y: 500, radius: 80, color: '#000' },
    { id: 'moai_1', type: 'MONOLITH', x: 1500, y: 1500, radius: 120, color: '#555' },
    { id: 'ufo_crash', type: 'STATIC_CUBE', x: 4500, y: 4500, radius: 200, color: '#Silver' },
    { id: 'text_run', type: 'TEXT', x: 2500, y: 2500, radius: 0, color: 'Red', content: 'ELLOS OBSERVAN' },
];

export const MYSTERIOUS_TEXTS = [
    "NO MIRES ATRÁS", "ELLOS SABEN", "NO HAY SALIDA", "DESPIERTA", "OSCURIDAD"
];

export const REGION_NAMES = [
    ['Arrecife Noroeste', 'Corrientes del Norte', 'Cavernas Olvidadas'],
    ['Planicies Occidentales', 'El Núcleo', 'Este Lejano'],
    ['Bajos Fondos', 'Desierto Abisal', 'Rincón Muerto']
];

export const DANGER_ZONES = [
    { x: 8000, y: 8000, radius: 800, name: 'Zona Prohibida Alpha' },
    { x: 1000, y: 1000, radius: 600, name: 'Vórtice de Datos' },
    { x: 4500, y: 4500, radius: 500, name: 'Singularidad' }
];

export const BOT_NAMES = [
  'Bacillus', 'Coccus', 'Spirillum', 'Vibrio', 'Staphylo', 'Strepto', 'Diplo', 'Tetrad', 'Sarcina',
  'E. coli', 'Salmo', 'Clostri', 'Lacto', 'Myco', 'Rhodo', 'Pseudo', 'Aero', 'Nitro', 'Chibibot', 'Mochi', 'Pudding', 'Yummy',
  'Pepa', 'Lolo', 'Burbuja', 'Chispa', 'Rayo', 'Sombra', 'Fantasma', 'Zombie', 'Vampiro', 'Alien', 'Mutante', 'Clon',
  'Alfa', 'Beta', 'Gamma', 'Dr. Cell', 'Prof. Germ', 'Mr. Blob', 'Temblores', 'Miedoso', 'Valiente', 'Rápido', 'Lento'
];

export const SERVER_NAMES = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Neo', 'Prime', 'Zero', 'Flux'];

export const COLORBLIND_SAFE_COLORS = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'];

export const MISSION_DEFINITIONS = [
    { id: 'eat_food', type: 'EAT_FOOD' as const, description: (goal: number) => `Come ${goal} unidades de comida`, goal: 100, reward: 50 },
    { id: 'eat_bots', type: 'EAT_BOTS' as const, description: (goal: number) => `Devora ${goal} bacterias`, goal: 5, reward: 100 },
    { id: 'reach_score', type: 'REACH_SCORE' as const, description: (goal: number) => `Alcanza un tamaño de ${goal}`, goal: 500, reward: 120 }
];

export const DEFAULT_SETTINGS: Settings = {
  musicVolume: 50,
  sfxVolume: 80,
  graphicsQuality: 'Alta',
  showPlayerName: true,
  showBotNames: true,
  colorblindMode: false,
  directPlay: true, // Default to skipping modes
  defaultGameMode: 'SURVIVAL',
  safeMode: false,
  vibration: true,
  showFPS: false,
  showGhostServers: false,
};

export const ACCESSORIES: Accessory[] = [
  { id: 'none', name: 'Ninguno', emoji: '', offset: { x: '0', y: '0' }, price: 0 },
  { id: 'crown', name: 'Corona', emoji: '👑', offset: { x: '0', y: '-60%' }, price: 500 },
  { id: 'sunglasses', name: 'Gafas', emoji: '😎', offset: { x: '0', y: '0' }, price: 300 },
  { id: 'tophat', name: 'Sombrero', emoji: '🎩', offset: { x: '0', y: '-70%' }, price: 600 },
  { id: 'partyhat', name: 'Fiesta', emoji: '🥳', offset: { x: '0', y: '-65%' }, price: 200 },
  { id: 'devil', name: 'Diablillo', emoji: '😈', offset: { x: '0', y: '-50%' }, price: 1000 },
  { id: 'angel', name: 'Aureola', emoji: '😇', offset: { x: '0', y: '-60%' }, price: 1000 },
  { id: 'cowboy', name: 'Vaquero', emoji: '🤠', offset: { x: '0', y: '-60%' }, price: 400 },
  { id: 'flower', name: 'Flor', emoji: '🌸', offset: { x: '30%', y: '-30%' }, price: 150 },
  { id: 'gasmask', name: 'Máscara Gas', emoji: '😷', offset: { x: '0%', y: '-5%' }, price: 600 },
  { id: 'astro', name: 'Casco Espacial', emoji: '👨‍🚀', offset: { x: '0%', y: '-10%' }, price: 800 },
];

// REORGANIZED PONDS: 3 NORMAL + 3 GHOST
export const PONDS: Pond[] = [
  // --- NORMAL PONDS ---
  {
    id: 'freshwater',
    name: 'Agua Dulce',
    securityLevel: 'SAFE',
    characteristics: ['Abundante comida', 'Pocos depredadores'],
    unlockScore: 0, // Always unlocked
    backgroundColor: ['#00b4db', '#0083b0'],
    hazards: { seaShells: 5 },
    emoji: '💧'
  },
  {
    id: 'saltwater',
    name: 'Agua Salada',
    securityLevel: 'MODERATE',
    characteristics: ['Corrientes fuertes', 'Conchas marinas'],
    unlockScore: 2000, // Unlock requirement
    backgroundColor: ['#005C97', '#363795'],
    hazards: { seaShells: 15 },
    emoji: '🌊'
  },
  {
    id: 'stagnant',
    name: 'Agua Estancada',
    securityLevel: 'DANGEROUS',
    characteristics: ['Visibilidad baja', 'Gases tóxicos'],
    unlockScore: 5000, // Unlock requirement
    backgroundColor: ['#556B2F', '#2E4638'],
    hazards: { toxicClouds: 20 },
    emoji: '🤮'
  },

  // --- GHOST SERVERS (Visible only via Settings) ---
  {
    id: 'ghost_void',
    name: 'Fantasma',
    securityLevel: 'FATAL',
    characteristics: ['Vacío Azul', 'Entidad Solitaria'],
    unlockScore: 0,
    backgroundColor: ['#000022', '#000011'], // Dark Blue Void
    emoji: '👻'
  },
  {
      id: 'abyss',
      name: 'Abismo',
      securityLevel: 'FATAL',
      characteristics: ['Bosque Oscuro', 'Vías de Tren', '7 Reinicios'],
      unlockScore: 0,
      backgroundColor: ['#050505', '#000000'], // Pitch Black
      emoji: '🕳️'
  },
  {
    id: 'cursed_forest',
    name: '...',
    securityLevel: 'CRITICAL',
    characteristics: ['Servidor Desconocido', 'La Bestia Roja', '4 Reinicios'],
    unlockScore: 0,
    backgroundColor: ['#1a0000', '#000000'], // Red/Black
    emoji: '🩸'
  }
];
