
export type GameState = 'MENU' | 'MODE_SELECTION' | 'POND_SELECTION' | 'SERVER_SELECTION' | 'PLAYING' | 'GAME_OVER' | 'SETTINGS' | 'SHOP' | 'MISSIONS' | 'VICTORY' | 'FRIENDS';
export type GameMode = 'SURVIVAL' | 'TIME_ATTACK' | 'MAZE' | 'COLLECTATHON';
export type MissionType = 'EAT_FOOD' | 'EAT_BOTS' | 'SURVIVE_MINUTES' | 'REACH_SCORE';

export interface Mission {
  id: string;
  description: string;
  type: MissionType;
  goal: number;
  progress: number;
  reward: number;
  isClaimed: boolean;
  pondId?: string; 
}

export interface Server {
  id: string;
  name: string;
  pondId: Pond['id'];
}

export interface Friend {
    id: string;
    name: string;
    serverName: string;
    pondId: string;
    dateAdded: string;
}


export interface Circle {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface Player extends Circle {
  name: string;
  accessory: Accessory | null;
  hasWeapon?: boolean;
  isDriving?: boolean;
  carEmoji?: string;
  isInfected?: boolean; 
  hasGem?: boolean; // For Collectathon
}

export interface Bot extends Circle {
  name:string;
  dx: number;
  dy: number;
  target: { x: number, y: number } | null;
  isGlitch?: boolean;
  isTrembling?: boolean; 
  behavior?: 'STANDARD' | 'ENOJON'; 
  isAngry?: boolean; 
  isInfected?: boolean;
  hasGem?: boolean; // For Collectathon 
  eatingCooldown?: number;
  hasWeapon?: boolean;
}

export interface Boss extends Bot {
    isBoss: true;
    title: string;
}

export interface Police extends Bot {
    isPolice: true;
}

export interface Predator extends Bot {}

export interface Leviathan extends Predator {}

export interface Food extends Circle {}
export interface PoisonousFood extends Food {}


export interface Whirlpool extends Circle {
  rotation: number;
  rotationSpeed: number;
}

export interface SeaShell extends Circle {
  suctionRadius: number;
  maxVictimRadius: number;
}

export interface ToxicCloud extends Circle {
    shrinkRate: number;
}

export interface SteamVent extends Circle {
  force: number;
  isActive: boolean;
  cycleDuration: number;

  lastActivation: number;
  activeDuration: number;
}

export interface Particle {
    x: number;
    y: number;
    radius: number;
    opacity: number;
    dx: number;
    dy: number;
}

export interface Anomaly {
    id: string;
    type: 'MONOLITH' | 'TEXT' | 'STATIC_CUBE';
    x: number;
    y: number;
    radius: number;
    color: string;
    content?: string;
}

export interface Pond {
  id: string;
  name: string;
  securityLevel: string;
  characteristics: string[];
  unlockScore: number;
  backgroundColor: [string, string];
  speedModifier?: number;
  emoji?: string; // ADDED EMOJI
  hazards?: {
    seaShells?: number;
    toxicClouds?: number;
    poisonousFood?: number;
    leviathans?: number;
    steamVents?: number;
    whirlpools?: number;
  };
}

export interface Accessory {
  id: string;
  name: string;
  emoji: string;
  offset: { x: string; y: string };
  price: number;
}

export interface Settings {
  musicVolume: number;
  sfxVolume: number;
  graphicsQuality: 'Alta' | 'Media' | 'Baja';
  showPlayerName: boolean;
  showBotNames: boolean;
  colorblindMode: boolean;
  directPlay: boolean; 
  defaultGameMode: GameMode;
  safeMode: boolean; 
  vibration: boolean; 
  showFPS: boolean; 
  showGhostServers: boolean; 
}

export interface KillNotification {
    id: string;
    message: string;
    timestamp: number;
}
