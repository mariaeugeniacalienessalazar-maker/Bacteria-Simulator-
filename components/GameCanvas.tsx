
import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Player, Bot, Food, Whirlpool, Particle, Pond, Predator, Settings, Accessory, SeaShell, ToxicCloud, Leviathan, PoisonousFood, SteamVent, GameMode, Boss, Anomaly, Police, KillNotification } from '../types';
import { audioEngine } from './AudioEngine';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_START_RADIUS,
  FOOD_RADIUS,
  NUM_FOOD,
  NUM_BOTS,
  NUM_WHIRLPOOLS,
  WHIRLPOOL_MIN_RADIUS,
  WHIRLPOOL_MAX_RADIUS,
  NUM_PARTICLES,
  BOT_NAMES,
  NUM_PREDATORS,
  PREDATOR_START_RADIUS_MIN,
  PREDATOR_START_RADIUS_MAX,
  COLORBLIND_SAFE_COLORS,
  SEASHELL_RADIUS,
  SEASHELL_SUCTION_RADIUS,
  SEASHELL_MAX_VICTIM_RADIUS,
  TOXIC_CLOUD_MIN_RADIUS,
  TOXIC_CLOUD_MAX_RADIUS,
  LEVIATHAN_START_RADIUS,
  LEVIATHAN_CURRENT_RADIUS,
  LEVIATHAN_CURRENT_STRENGTH,
  STEAM_VENT_RADIUS,
  STEAM_VENT_FORCE,
  STEAM_VENT_CYCLE_MS,
  STEAM_VENT_ACTIVE_MS,
  TIME_ATTACK_SECONDS,
  BOSS_EAT_RATIO,
  ANOMALIES,
  REGION_NAMES,
  DANGER_ZONES,
  MYSTERIOUS_TEXTS
} from '../constants';

interface GameCanvasProps {
  onGameOver: (score: number, time: number) => void;
  onVictory: (score: number, time: number) => void;
  pond: Pond | null;
  settings: Settings;
  equippedAccessory: Accessory | null;
  onEat: () => void;
  onEatBot: () => void;
  onScoreUpdate: (score: number) => void;
  onMinuteSurvived: () => void;
  gameMode: GameMode;
  playerName: string;
  friends: React.ComponentProps<any>['friends'];
  onAddFriend: (bot: Bot) => void;
  onReturnToMenu: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onVictory, pond, settings, equippedAccessory, onEat, onEatBot, onScoreUpdate, onMinuteSurvived, gameMode, playerName, friends, onAddFriend, onReturnToMenu }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  
  // FPS COUNTER
  const fpsRef = useRef({ lastTime: 0, frames: 0, fps: 0 });
  
  // JOYSTICK STATE
  const joystickRef = useRef<{active: boolean, originX: number, originY: number, currentX: number, currentY: number} | null>(null);
  const movementRef = useRef({ dx: 0, dy: 0 }); 

  const gameTimerRef = useRef(TIME_ATTACK_SECONDS);
  const lastTimeRef = useRef(performance.now());
  const survivalTimeRef = useRef(0);
  const lastMinuteReportedRef = useRef(0);
  const lastScoreReportedRef = useRef(0);
  
  const bossTimerRef = useRef(0);
  const isInitializedRef = useRef(false);
  
  // CRITICAL FLAGS
  const isCrashedRef = useRef(false); 
  const isJumpscareRef = useRef(false); 
  const runnerDeadRef = useRef(false); // NEW FLAG FOR MAZE VICTORY
  
  // LEADERBOARD REFS
  const lbRef = useRef({ x: 0, y: 0, width: 0, itemHeight: 0, headerHeight: 0, items: [] as Bot[] });
  
  // SPECTATOR CAMERA STATE (ABYSS)
  const [isSpectating, setIsSpectating] = useState(false);
  
  // Horror State
  const glitchIntensityRef = useRef(0); 
  const isCursedHourRef = useRef(false);
  const cursedEntityRef = useRef<Bot | null>(null);
  const ghostsRef = useRef<Bot[]>([]); 
  const activeMessageRef = useRef<{text: string, x: number, y: number, alpha: number} | null>(null);
  
  // Region & Danger Zones
  const currentRegionRef = useRef<string>('');
  const isInDangerZoneRef = useRef<boolean>(false);

  // Maze State
  const mazeGridRef = useRef<{x: number, y: number, w: number, h: number, color: string}[]>([]);
  const weaponsRef = useRef<{x: number, y: number, radius: number}[]>([]);
  const killLogRef = useRef<KillNotification[]>([]);
  const mazeExitRef = useRef<{x: number, y: number, radius: number} | null>(null);

  // COLLECTATHON STATE (GEMS)
  const gemsRef = useRef<{id: string, x: number, y: number, radius: number}[]>([]);
  const gemsCollectedRef = useRef(0);
  const houseRef = useRef<{x: number, y: number, w: number, h: number}>({x:0,y:0,w:0,h:0});
  const altarRef = useRef<{x: number, y: number, radius: number}>({x:0, y:0, radius: 0});
  const forestTreesRef = useRef<{x: number, y: number, radius: number}[]>([]);
  const isHiddenRef = useRef(false);

  // Breath Animation State
  const breathRef = useRef(0);

  const playerRef = useRef<Player>({
    id: 'player',
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    radius: PLAYER_START_RADIUS,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    name: playerName,
    accessory: equippedAccessory,
    hasWeapon: false,
    isDriving: false,
    isInfected: false,
    hasGem: false
  });

  const botsRef = useRef<Bot[]>([]);
  const bossesRef = useRef<Boss[]>([]);
  const policeRef = useRef<Police[]>([]);
  const foodRef = useRef<(Food | PoisonousFood)[]>([]);
  const whirlpoolsRef = useRef<Whirlpool[]>([]);
  
  const particlesRef = useRef<(Particle & { z: number })[]>([]);
  
  const predatorsRef = useRef<Predator[]>([]);
  const seaShellsRef = useRef<SeaShell[]>([]);
  const toxicCloudsRef = useRef<ToxicCloud[]>([]);
  const leviathansRef = useRef<Leviathan[]>([]);
  const steamVentsRef = useRef<SteamVent[]>([]);
  const anomaliesRef = useRef<Anomaly[]>(ANOMALIES); 
  
  const getRandomColor = useCallback(() => {
    if (settings.colorblindMode) {
      return COLORBLIND_SAFE_COLORS[Math.floor(Math.random() * COLORBLIND_SAFE_COLORS.length)];
    }
    return `hsl(${Math.random() * 360}, 85%, 75%)`;
  }, [settings.colorblindMode]);


  const initializeGame = useCallback(() => {
    if (!pond || isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    isJumpscareRef.current = false;
    isCrashedRef.current = false;
    runnerDeadRef.current = false;
    killLogRef.current = [];
    setIsSpectating(false);
    
    // GHOST VOID
    if (pond.id === 'ghost_void' && !settings.safeMode) {
        playerRef.current = {
            id: 'player',
            x: 4500, // Safe distance
            y: 8000, 
            radius: PLAYER_START_RADIUS,
            color: '#00FFFF',
            name: '...',
            accessory: null
        };
        botsRef.current = [{
            id: 'THE_GHOST',
            x: 4500,
            y: 1000, 
            radius: 120, 
            color: '#000',
            name: '',
            dx: 0,
            dy: 0,
            target: null,
            isGlitch: true
        }];
        foodRef.current = Array.from({ length: 15 }, (_, i) => ({
            id: `food_${i}`,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: FOOD_RADIUS,
            color: 'lightgreen',
        }));
        predatorsRef.current = [];
        return;
    }

    // CURSED FOREST ("...")
    if (pond.id === 'cursed_forest' && !settings.safeMode) {
        playerRef.current = {
            id: 'player',
            x: WORLD_WIDTH / 2, 
            y: WORLD_HEIGHT / 2, 
            radius: PLAYER_START_RADIUS,
            color: '#FFFFFF',
            name: '...',
            accessory: null
        };
        
        botsRef.current = [{
            id: 'RED_DEATH',
            x: 1000,
            y: 1000, 
            radius: 350, 
            color: '#FF0000',
            name: 'LA BESTIA',
            dx: 0,
            dy: 0,
            target: null,
            isGlitch: true
        }];
        
        anomaliesRef.current = [];
        for(let i=0; i<300; i++) {
            anomaliesRef.current.push({
                id: `tree_${i}`,
                type: 'MONOLITH', 
                x: Math.random() * WORLD_WIDTH,
                y: Math.random() * WORLD_HEIGHT,
                radius: 0, 
                color: 'transparent',
                content: Math.random() > 0.3 ? '🌲' : '🪵'
            });
        }
        
        foodRef.current = Array.from({ length: 50 }, (_, i) => ({
            id: `food_${i}`,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: FOOD_RADIUS,
            color: '#333333',
        }));
        
        predatorsRef.current = [];
        return;
    }
    
    // ABISMO
    if (pond.id === 'abyss' && !settings.safeMode) {
        playerRef.current = {
            id: 'player',
            x: 1000, 
            y: 1000, 
            radius: PLAYER_START_RADIUS,
            color: '#AAAAAA',
            name: '...',
            accessory: null
        };
        
        const abyssWalker: Bot = {
            id: 'ABYSS_WALKER',
            x: 8000,
            y: 8000, 
            radius: 100,
            color: '#000',
            name: '',
            dx: 0,
            dy: 0,
            target: null,
            isGlitch: true
        };
        
        const abyssBots: Bot[] = [];
        for(let i=0; i<30; i++) {
            abyssBots.push({
                id: `victim_${i}`,
                x: Math.random() * WORLD_WIDTH,
                y: Math.random() * WORLD_HEIGHT,
                radius: 15,
                color: '#444',
                name: '...',
                dx: (Math.random() - 0.5) * 2,
                dy: (Math.random() - 0.5) * 2,
                target: null,
            });
        }
        
        botsRef.current = [abyssWalker, ...abyssBots];
        
        anomaliesRef.current = [];
        
        for(let i=0; i<100; i++) {
            anomaliesRef.current.push({
                id: `abyss_tree_${i}`,
                type: 'MONOLITH', 
                x: Math.random() * WORLD_WIDTH,
                y: Math.random() * WORLD_HEIGHT,
                radius: 0, 
                color: 'transparent',
                content: '🌲'
            });
        }
        for(let i=0; i<20; i++) {
            anomaliesRef.current.push({
                id: `house_${i}`,
                type: 'STATIC_CUBE', 
                x: Math.random() * WORLD_WIDTH,
                y: Math.random() * WORLD_HEIGHT,
                radius: 0, 
                color: 'transparent',
                content: '🏚️'
            });
        }
        for(let i=0; i<WORLD_WIDTH; i+=200) {
             anomaliesRef.current.push({
                id: `track_${i}`,
                type: 'TEXT', 
                x: i,
                y: i,
                radius: 0, 
                color: 'gray',
                content: '🛤️'
            });
        }
        
        foodRef.current = Array.from({ length: 100 }, (_, i) => ({
            id: `food_${i}`,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: FOOD_RADIUS,
            color: '#222',
        }));
        
        predatorsRef.current = [];
        return;
    }

    // MAZE LEVEL
    if (gameMode === 'MAZE') {
         playerRef.current = {
            id: 'player',
            x: 250,
            y: 250, 
            radius: PLAYER_START_RADIUS,
            color: '#FF00FF',
            name: playerName,
            accessory: equippedAccessory,
            hasWeapon: false
        };
        
        let walls: {x: number, y: number, w: number, h: number, color: string}[] = [];
        const cellSize = 500;
        const rows = WORLD_HEIGHT / cellSize;
        const cols = WORLD_WIDTH / cellSize;
        
        const grid: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(true));
        const stack: [number, number][] = [];
        const startR = 0;
        const startC = 0;
        
        grid[startR][startC] = false; 
        stack.push([startR, startC]);
        
        while(stack.length > 0) {
            const [cr, cc] = stack[stack.length - 1];
            const neighbors = [];
            
            const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
            for(const [dr, dc] of dirs) {
                const nr = cr + dr;
                const nc = cc + dc;
                if(nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
                    neighbors.push([nr, nc, dr, dc]);
                }
            }
            
            if(neighbors.length > 0) {
                const [nr, nc, dr, dc] = neighbors[Math.floor(Math.random() * neighbors.length)];
                grid[nr][nc] = false; 
                grid[cr + dr/2][cc + dc/2] = false; 
                stack.push([nr, nc]);
            } else {
                stack.pop();
            }
        }
        
        for(let r=0; r<rows; r++) {
            for(let c=0; c<cols; c++) {
                if(grid[r][c]) {
                     walls.push({
                        x: c * cellSize,
                        y: r * cellSize,
                        w: cellSize,
                        h: cellSize,
                        color: Math.random() > 0.5 ? '#004400' : '#006600'
                    });
                }
            }
        }

        const arenaCenterX = WORLD_WIDTH - 2000;
        const arenaCenterY = WORLD_HEIGHT - 2000;
        const arenaClearRadius = 1500; 
        
        walls = walls.filter(w => {
            const centerX = w.x + w.w / 2;
            const centerY = w.y + w.h / 2;
            return Math.hypot(centerX - arenaCenterX, centerY - arenaCenterY) >= arenaClearRadius;
        });

        mazeGridRef.current = walls;
        
        mazeExitRef.current = {
            x: arenaCenterX,
            y: arenaCenterY,
            radius: 120
        };

        const runner: Bot = {
            id: 'THE_RUNNER',
            x: arenaCenterX,
            y: arenaCenterY, 
            radius: 65, 
            color: '#FF4500',
            name: 'EL CORREDOR',
            dx: 0,
            dy: 0,
            target: null,
            isGlitch: true
        };

        const mazeBots: Bot[] = [];
        for(let i=0; i<60; i++) {
             let bx = 0, by = 0;
             let safe = false;
             let attempts = 0;
             while(!safe && attempts < 100) {
                 bx = Math.random() * WORLD_WIDTH;
                 by = Math.random() * WORLD_HEIGHT;
                 const inWall = walls.some(w => bx > w.x && bx < w.x+w.w && by > w.y && by < w.y+w.h);
                 if(!inWall && Math.hypot(bx-arenaCenterX, by-arenaCenterY) > 500) safe = true;
                 attempts++;
             }
             if(safe) {
                 const isScared = Math.random() < 0.3; 
                 mazeBots.push({
                    id: `bot_${i}`,
                    x: bx,
                    y: by,
                    radius: Math.random() * 15 + 10,
                    color: getRandomColor(),
                    name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)], // Random Unique Name
                    dx: (Math.random() - 0.5) * 2,
                    dy: (Math.random() - 0.5) * 2,
                    target: null,
                    isTrembling: isScared,
                    behavior: 'STANDARD',
                    hasWeapon: false
                 });
             }
        }
        
        botsRef.current = settings.safeMode ? [...mazeBots] : [runner, ...mazeBots];
        
        const weps = [];
        for(let i=0; i<15; i++) { // More weapons
             let wx = 0, wy = 0;
             let safe = false;
             while(!safe) {
                 wx = Math.random() * WORLD_WIDTH;
                 wy = Math.random() * WORLD_HEIGHT;
                 const inWall = walls.some(w => wx > w.x && wx < w.x+w.w && wy > w.y && wy < w.y+w.h);
                 if(!inWall) safe = true;
             }
             weps.push({x: wx, y: wy, radius: 25});
        }
        weaponsRef.current = weps;
        
        foodRef.current = Array.from({ length: 300 }, (_, i) => ({
            id: `food_${i}`,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius: FOOD_RADIUS,
            color: 'lightgreen',
        }));
        
        return;
    }
    
    // COLLECTATHON MODE
    if (gameMode === 'COLLECTATHON') {
        // ... (Same Collectathon Init)
        const cx = WORLD_WIDTH / 2;
        const cy = WORLD_HEIGHT / 2;
        
        playerRef.current = {
            id: 'player',
            x: cx,
            y: cy, 
            radius: PLAYER_START_RADIUS,
            color: '#00AAFF',
            name: playerName,
            accessory: equippedAccessory,
            hasGem: false
        };
        
        houseRef.current = { x: cx - 300, y: cy - 300, w: 600, h: 600 };
        altarRef.current = { x: cx, y: cy, radius: 50 };
        gemsCollectedRef.current = 0;
        
        const teamBots: Bot[] = [];
        for(let i=0; i<30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 200;
            teamBots.push({
                id: `teammate_${i}`,
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                radius: 20,
                color: getRandomColor(),
                name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
                dx: (Math.random() - 0.5) * 2,
                dy: (Math.random() - 0.5) * 2,
                target: null,
                hasGem: false
            });
        }
        
        const hunter: Bot = {
            id: 'THE_HUNTER',
            x: 100,
            y: 100, 
            radius: 70, 
            color: '#FF0000',
            name: 'EL CAZADOR',
            dx: 0,
            dy: 0,
            target: null,
            isGlitch: true,
            eatingCooldown: 0 
        };
        
        botsRef.current = settings.safeMode ? teamBots : [hunter, ...teamBots];
        
        forestTreesRef.current = [];
        for(let i=0; i<400; i++) {
            let tx = Math.random() * WORLD_WIDTH;
            let ty = Math.random() * WORLD_HEIGHT;
            if (Math.abs(tx - cx) < 400 && Math.abs(ty - cy) < 400) continue;
            forestTreesRef.current.push({
                x: tx, y: ty, radius: 40 
            });
        }
        
        gemsRef.current = [];
        for(let i=0; i<10; i++) {
            let gx = 0, gy = 0;
            let farEnough = false;
            while(!farEnough) {
                gx = Math.random() * WORLD_WIDTH;
                gy = Math.random() * WORLD_HEIGHT;
                if (Math.hypot(gx - cx, gy - cy) > 1500) farEnough = true;
            }
            gemsRef.current.push({ id: `gem_${i}`, x: gx, y: gy, radius: 20 });
        }
        
        mazeExitRef.current = {
            x: WORLD_WIDTH - 200,
            y: WORLD_HEIGHT - 200,
            radius: 100
        };
        
        return;
    }


    playerRef.current = {
      id: 'player',
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: PLAYER_START_RADIUS,
      color: getRandomColor(),
      name: playerName,
      accessory: equippedAccessory,
      isInfected: false
    };
    
    // SPAWN BOTS 
    botsRef.current = Array.from({ length: NUM_BOTS }, (_, i) => {
        const rand = Math.random();
        let behavior: Bot['behavior'] = 'STANDARD';
        let radius = Math.random() * 15 + 10;
        let color = getRandomColor();
        let name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        let dx = (Math.random() - 0.5) * 2;
        let dy = (Math.random() - 0.5) * 2;
        let isInfected = false;

        if (rand < 0.10) {
            behavior = 'ENOJON';
            radius = 35; 
            color = '#FF9900'; 
        } 

        return {
            id: `bot_${i}`,
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            radius,
            color,
            name,
            dx,
            dy,
            target: null,
            behavior,
            isAngry: false,
            isInfected
        };
    });
    
    predatorsRef.current = Array.from({ length: NUM_PREDATORS }, (_, i) => ({
        id: `predator_${i}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: Math.random() * (PREDATOR_START_RADIUS_MAX - PREDATOR_START_RADIUS_MIN) + PREDATOR_START_RADIUS_MIN,
        color: getRandomColor(),
        name: 'Depredador',
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        target: null,
    }));

    foodRef.current = Array.from({ length: NUM_FOOD }, (_, i) => ({
      id: `food_${i}`,
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: FOOD_RADIUS,
      color: 'lightgreen',
    }));
      
    whirlpoolsRef.current = Array.from({ length: NUM_WHIRLPOOLS }, (_, i) => ({
        id: `whirlpool_${i}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: Math.random() * (WHIRLPOOL_MAX_RADIUS - WHIRLPOOL_MIN_RADIUS) + WHIRLPOOL_MIN_RADIUS,
        color: 'rgba(0,0,0,0.5)',
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
    }));

    seaShellsRef.current = Array.from({ length: pond.hazards?.seaShells || 0 }, (_, i) => ({
      id: `shell_${i}`,
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: SEASHELL_RADIUS,
      color: 'transparent',
      suctionRadius: SEASHELL_SUCTION_RADIUS,
      maxVictimRadius: SEASHELL_MAX_VICTIM_RADIUS,
    }));

    toxicCloudsRef.current = Array.from({ length: pond.hazards?.toxicClouds || 0 }, (_, i) => ({
      id: `cloud_${i}`,
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      radius: Math.random() * (TOXIC_CLOUD_MAX_RADIUS - TOXIC_CLOUD_MIN_RADIUS) + TOXIC_CLOUD_MIN_RADIUS,
      color: 'rgba(76, 175, 80, 0.2)',
      shrinkRate: 0.05,
    }));
    
    leviathansRef.current = Array.from({ length: pond.hazards?.leviathans || 0 }, (_, i) => ({
        id: `leviathan_${i}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: LEVIATHAN_START_RADIUS,
        color: getRandomColor(),
        name: 'Leviatán',
        dx: (Math.random() - 0.5) * 0.2,
        dy: (Math.random() - 0.5) * 0.2,
        target: null,
        currentRadius: LEVIATHAN_CURRENT_RADIUS,
        currentStrength: LEVIATHAN_CURRENT_STRENGTH,
    }));
    
     steamVentsRef.current = Array.from({ length: pond.hazards?.steamVents || 0 }, (_, i) => ({
        id: `vent_${i}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: STEAM_VENT_RADIUS,
        color: 'rgba(255, 255, 255, 0.2)',
        force: STEAM_VENT_FORCE,
        isActive: false,
        cycleDuration: STEAM_VENT_CYCLE_MS,
        activeDuration: STEAM_VENT_ACTIVE_MS,
        lastActivation: Date.now() + Math.random() * STEAM_VENT_CYCLE_MS,
    }));

    if(pond.hazards?.poisonousFood) {
        for(let i = 0; i < pond.hazards.poisonousFood; i++) {
            if(foodRef.current[i]) {
                foodRef.current[i].color = '#9400D3'; // DarkViolet
            }
        }
    }
    
    const numParticles = settings.graphicsQuality === 'Alta' ? NUM_PARTICLES : settings.graphicsQuality === 'Media' ? NUM_PARTICLES / 2 : NUM_PARTICLES / 5;
    particlesRef.current = Array.from({ length: numParticles }, () => ({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: Math.random() * 2 + 1,
        opacity: Math.random(),
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
        z: Math.random() * 2 + 0.5 // Depth
    }));
  }, [equippedAccessory, getRandomColor, settings.graphicsQuality, pond, gameMode, playerName, settings.safeMode]);
  
  const getRegionName = (x: number, y: number) => {
      const col = Math.floor(x / (WORLD_WIDTH / 3));
      const row = Math.floor(y / (WORLD_HEIGHT / 3));
      if (REGION_NAMES[row] && REGION_NAMES[row][col]) {
          return REGION_NAMES[row][col];
      }
      return 'Desconocido';
  };
    
  const gameLoop = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !pond) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // FPS Calculation
    if (currentTime > fpsRef.current.lastTime + 1000) {
        fpsRef.current.fps = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = currentTime;
    }
    fpsRef.current.frames++;

    if (isCrashedRef.current && !settings.safeMode) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦠', 0, 0); 
        ctx.restore();
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return; 
    }

    if (isJumpscareRef.current && !settings.safeMode) {
        ctx.fillStyle = 'black'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const shakeX = (Math.random() - 0.5) * 30;
        const shakeY = (Math.random() - 0.5) * 30;
        
        ctx.fillStyle = '#990000'; // Blood Red
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.font = '180px sans-serif';
        ctx.fillText('👹', canvas.width/2 + shakeX, canvas.height/2 + shakeY - 50);
        
        ctx.font = 'bold 60px sans-serif';
        ctx.fillText('TE ENCONTRÉ', canvas.width/2 + shakeX, canvas.height/2 + shakeY + 120);

        animationFrameId.current = requestAnimationFrame(gameLoop);
        return; 
    }
    
    // JOYSTICK LOGIC
    if (joystickRef.current && joystickRef.current.active) {
        const j = joystickRef.current;
        const dx = j.currentX - j.originX;
        const dy = j.currentY - j.originY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 50;
        
        const normDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        
        movementRef.current = {
            dx: (Math.cos(angle) * normDist) / maxDist,
            dy: (Math.sin(angle) * normDist) / maxDist
        };
    } else {
        movementRef.current = { dx: 0, dy: 0 };
    }

    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;
    
    // Breathing Animation
    breathRef.current += deltaTime * 2;
    const breathScale = 1 + Math.sin(breathRef.current) * 0.05;
    
    // Danger Zone Logic (Disable in Safe Mode)
    const player = playerRef.current;
    if (isCursedHourRef.current && !settings.safeMode) {
        let inZone = false;
        for (const zone of DANGER_ZONES) {
            const dist = Math.hypot(player.x - zone.x, player.y - zone.y);
            if (dist < zone.radius) {
                inZone = true;
                break;
            }
        }
        
        if (inZone && !isInDangerZoneRef.current) {
            isInDangerZoneRef.current = true;
            audioEngine.startDangerZoneSound();
        } else if (!inZone && isInDangerZoneRef.current) {
            isInDangerZoneRef.current = false;
            audioEngine.stopDangerZoneSound();
        }
    }
    
    // Update timers
    survivalTimeRef.current += deltaTime;

    const currentMinute = Math.floor(survivalTimeRef.current / 60);
    if (currentMinute > lastMinuteReportedRef.current) {
        onMinuteSurvived();
        lastMinuteReportedRef.current = currentMinute;
    }

    if (gameMode === 'TIME_ATTACK') {
        gameTimerRef.current -= deltaTime;
        if (gameTimerRef.current <= 0) {
            onGameOver(Math.round(playerRef.current.radius), survivalTimeRef.current);
            return;
        }
    }
    
    const currentScore = Math.round(player.radius);
    if (currentScore > lastScoreReportedRef.current) {
        onScoreUpdate(currentScore);
        lastScoreReportedRef.current = currentScore;
    }
    
    const bots = botsRef.current;
    const bosses = bossesRef.current;
    const police = policeRef.current;
    const food = foodRef.current;
    const whirlpools = whirlpoolsRef.current;
    const predators = predatorsRef.current;
    const seaShells = seaShellsRef.current;
    const toxicClouds = toxicCloudsRef.current;
    const leviathans = leviathansRef.current;
    const steamVents = steamVentsRef.current;
    const anomalies = anomaliesRef.current;
    const weapons = weaponsRef.current;
    
    const speedModifier = pond.speedModifier || 1.0;
    const speed = (5 - player.radius * 0.01) * speedModifier;
    
    let playerDx = movementRef.current.dx * Math.max(1.5, speed);
    let playerDy = movementRef.current.dy * Math.max(1.5, speed);

    const allBacteria = [player, ...bots, ...predators, ...leviathans, ...bosses, ...police];
    if (cursedEntityRef.current) allBacteria.push(cursedEntityRef.current);
    
    if (gameMode === 'MAZE') {
        // Weapon Pickup for Player
        for (let i = weapons.length - 1; i >= 0; i--) {
            const w = weapons[i];
            
            // Check player pickup
            if (Math.hypot(player.x - w.x, player.y - w.y) < player.radius + w.radius) {
                player.hasWeapon = true;
                weapons.splice(i, 1);
                audioEngine.playEatSound();
                continue;
            }
            
            // Check bot pickup
            for (const bot of bots) {
                if (bot.id.startsWith('bot')) {
                    if (Math.hypot(bot.x - w.x, bot.y - w.y) < bot.radius + w.radius) {
                        (bot as Bot).hasWeapon = true;
                        weapons.splice(i, 1);
                        break; 
                    }
                }
            }
        }
        
        if (mazeExitRef.current && Math.hypot(player.x - mazeExitRef.current.x, player.y - mazeExitRef.current.y) < mazeExitRef.current.radius) {
            onVictory(Math.round(player.radius), survivalTimeRef.current);
            return;
        }
    }
    
    if (gameMode === 'COLLECTATHON') {
        // ... (Collectathon logic remains same)
        for (let i = gemsRef.current.length - 1; i >= 0; i--) {
            const gem = gemsRef.current[i];
            if (Math.hypot(player.x - gem.x, player.y - gem.y) < player.radius + gem.radius) {
                if (!player.hasGem) {
                    player.hasGem = true;
                    gemsRef.current.splice(i, 1);
                    audioEngine.playEatSound();
                }
            }
        }
        if (player.hasGem) {
            if (Math.hypot(player.x - altarRef.current.x, player.y - altarRef.current.y) < player.radius + altarRef.current.radius) {
                player.hasGem = false;
                gemsCollectedRef.current += 1;
                audioEngine.playClickSound();
            }
        }
        if (gemsCollectedRef.current >= 10) {
             if (mazeExitRef.current && Math.hypot(player.x - mazeExitRef.current.x, player.y - mazeExitRef.current.y) < mazeExitRef.current.radius) {
                onVictory(Math.round(player.radius), survivalTimeRef.current);
                return;
            }
        }
        const hunter = bots.find(b => b.id === 'THE_HUNTER');
        let hidden = false;
        if (hunter) {
            for (const tree of forestTreesRef.current) {
                const distToTree = Math.hypot(player.x - tree.x, player.y - tree.y);
                const distHunterToTree = Math.hypot(hunter.x - tree.x, hunter.y - tree.y);
                const distHunterToPlayer = Math.hypot(hunter.x - player.x, hunter.y - player.y);
                if (distToTree < 60 && distHunterToTree < distHunterToPlayer) {
                    hidden = true;
                    break;
                }
            }
        }
        isHiddenRef.current = hidden;
    }
      
    for (let i = allBacteria.length - 1; i >= 0; i--) {
        const b = allBacteria[i];
        let dx = 0;
        let dy = 0;
        
        if (b.id === 'player') {
            dx = playerDx;
            dy = playerDy;
        } else if ((b as Police).isPolice) {
            const pAngle = Math.atan2(player.y - b.y, player.x - b.x);
            dx = Math.cos(pAngle) * 7; 
            dy = Math.sin(pAngle) * 7;
        } else if (b.id === 'THE_RUNNER') {
             // RUNNER AI (DEAD OR ALIVE)
             if (runnerDeadRef.current) {
                 // Remove if dead (should be handled by list filtering but safety check)
             } else {
                 let closestTarget = null;
                 let minDistance = Infinity;
                 
                 const distToPlayer = Math.hypot(player.x - b.x, player.y - b.y);
                 if (distToPlayer < minDistance) {
                     minDistance = distToPlayer;
                     closestTarget = player;
                 }

                 for (const bot of bots) {
                     if (bot.id === 'THE_RUNNER') continue;
                     const d = Math.hypot(bot.x - b.x, bot.y - b.y);
                     if (d < minDistance) {
                         minDistance = d;
                         closestTarget = bot;
                     }
                 }

                 if (closestTarget) {
                     const angle = Math.atan2(closestTarget.y - b.y, closestTarget.x - b.x);
                     const runSpeed = 7;
                     dx = Math.cos(angle) * runSpeed;
                     dy = Math.sin(angle) * runSpeed;
                 }
             }
        } else if (b.id === 'THE_HUNTER') {
             // ... (Collectathon Hunter logic same)
             const hunter = b as Bot;
             if (hunter.eatingCooldown && hunter.eatingCooldown > 0) {
                 hunter.eatingCooldown -= 1;
                 dx = 0;
                 dy = 0;
             } else {
                 let target = null;
                 if (!isHiddenRef.current) {
                     target = player;
                 } else {
                     let furthestBot = null;
                     let maxDist = -1;
                     for (const bot of bots) {
                         if (bot.id === 'THE_HUNTER') continue;
                         const d = Math.hypot(bot.x - player.x, bot.y - player.y);
                         if (d > maxDist) {
                             maxDist = d;
                             furthestBot = bot;
                         }
                     }
                     if (furthestBot) target = furthestBot;
                     else {
                         dx = Math.cos(Date.now() / 1000) * 4;
                         dy = Math.sin(Date.now() / 1000) * 4;
                     }
                 }
                 if (target) {
                     const angle = Math.atan2(target.y - b.y, target.x - b.x);
                     const runSpeed = 6;
                     dx = Math.cos(angle) * runSpeed;
                     dy = Math.sin(angle) * runSpeed;
                 }
             }
             
        } else if (b.id === 'RED_DEATH') {
             const angle = Math.atan2(player.y - b.y, player.x - b.x);
             const runSpeed = 10; 
             dx = Math.cos(angle) * runSpeed;
             dy = Math.sin(angle) * runSpeed;
        } else if (b.id === 'ABYSS_WALKER') {
             // ... (Abyss walker same)
             let closestTarget = null;
             let minDistance = Infinity;
             for (const bot of bots) {
                 if (bot.id === 'ABYSS_WALKER') continue;
                 const d = Math.hypot(bot.x - b.x, bot.y - b.y);
                 if (d < minDistance) {
                     minDistance = d;
                     closestTarget = bot;
                 }
             }
             if (!closestTarget) closestTarget = player; 
             if (closestTarget) {
                 const angle = Math.atan2(closestTarget.y - b.y, closestTarget.x - b.x);
                 const runSpeed = 6; 
                 dx = Math.cos(angle) * runSpeed;
                 dy = Math.sin(angle) * runSpeed;
             }
        } else {
             const isBot = b.id.startsWith('bot') || b.id.startsWith('victim') || b.id.startsWith('teammate');
             const botBehavior = isBot ? (b as Bot).behavior : 'STANDARD';
             
             let botSpeed = (4 - b.radius * 0.01) * speedModifier;
             
             // MAZE BOT AI UPDATE
             if (gameMode === 'MAZE' && isBot) {
                 const bot = b as Bot;
                 
                 // If Runner is dead, run to Exit
                 if (runnerDeadRef.current && mazeExitRef.current) {
                     const angle = Math.atan2(mazeExitRef.current.y - b.y, mazeExitRef.current.x - b.x);
                     dx = Math.cos(angle) * 5;
                     dy = Math.sin(angle) * 5;
                 } 
                 // If Armed, Hunt Runner
                 else if (bot.hasWeapon) {
                     const runner = botsRef.current.find(ent => ent.id === 'THE_RUNNER');
                     if (runner) {
                         const angle = Math.atan2(runner.y - b.y, runner.x - b.x);
                         dx = Math.cos(angle) * 6; // Move fast towards runner
                         dy = Math.sin(angle) * 6;
                     }
                 }
                 // If scared (and unarmed), wander fast
                 else if (bot.isTrembling) {
                     dx = (b as Bot).dx * 1.5;
                     dy = (b as Bot).dy * 1.5;
                 }
                 else {
                     dx = (b as Bot).dx * Math.max(0.1, botSpeed);
                     dy = (b as Bot).dy * Math.max(0.1, botSpeed);
                 }
             }
             // COLLECTATHON TEAMMATES
             else if (isBot && b.id.startsWith('teammate')) {
                 const bot = b as Bot;
                 if (bot.hasGem) {
                     const angle = Math.atan2(altarRef.current.y - b.y, altarRef.current.x - b.x);
                     dx = Math.cos(angle) * 5;
                     dy = Math.sin(angle) * 5;
                 } else {
                     let closestGem = null;
                     let minDist = Infinity;
                     for (const g of gemsRef.current) {
                         const d = Math.hypot(g.x - b.x, g.y - b.y);
                         if (d < minDist) {
                             minDist = d;
                             closestGem = g;
                         }
                     }
                     if (closestGem) {
                         const angle = Math.atan2(closestGem.y - b.y, closestGem.x - b.x);
                         dx = Math.cos(angle) * 4;
                         dy = Math.sin(angle) * 4;
                     } else {
                         let leader = bots.find(mate => (mate as Bot).hasGem);
                         if (leader) {
                             const angle = Math.atan2(leader.y - b.y, leader.x - b.x);
                             dx = Math.cos(angle) * 4;
                             dy = Math.sin(angle) * 4;
                         }
                     }
                 }
             }
             else if (botBehavior === 'ENOJON') {
                 const distToPlayer = Math.hypot(player.x - b.x, player.y - b.y);
                 if (distToPlayer < 400) {
                     (b as Bot).isAngry = true;
                     const angle = Math.atan2(player.y - b.y, player.x - b.x);
                     dx = Math.cos(angle) * 12;
                     dy = Math.sin(angle) * 12;
                     b.color = '#FF0000'; 
                 } else {
                     (b as Bot).isAngry = false;
                     dx = (b as Bot).dx * Math.max(0.1, botSpeed);
                     dy = (b as Bot).dy * Math.max(0.1, botSpeed);
                     b.color = '#FF9900'; 
                 }
             } else {
                 if (b.id.startsWith('predator')) botSpeed = (4.5 - b.radius * 0.005);
                 if (b.id.startsWith('leviathan')) botSpeed = (1 - b.radius * 0.001);
                 
                 dx = (b as Bot).dx * Math.max(0.1, botSpeed);
                 dy = (b as Bot).dy * Math.max(0.1, botSpeed);
             }
        }
        
        // MAZE COLLISION
        if (gameMode === 'MAZE') {
            const nextX = b.x + dx;
            const nextY = b.y + dy;
            let collidedX = false;
            let collidedY = false;

            for(const w of mazeGridRef.current) {
                if(nextX + b.radius > w.x && nextX - b.radius < w.x + w.w && b.y + b.radius > w.y && b.y - b.radius < w.y + w.h) collidedX = true;
                if(b.x + b.radius > w.x && b.x - b.radius < w.x + w.w && nextY + b.radius > w.y && nextY - b.radius < w.y + w.h) collidedY = true;
            }

            if(collidedX) {
                 dx *= -1; 
                 if(b.id !== 'player') (b as Bot).dx *= -1;
            }
            if(collidedY) {
                 dy *= -1;
                 if(b.id !== 'player') (b as Bot).dy *= -1;
            }
        }

        b.x += dx;
        b.y += dy;
        
        b.x = Math.max(b.radius, Math.min(WORLD_WIDTH - b.radius, b.x));
        b.y = Math.max(b.radius, Math.min(WORLD_HEIGHT - b.radius, b.y));
        
        if (b.id !== 'player' && b.id !== 'THE_GHOST' && b.id !== 'RED_DEATH' && b.id !== 'ABYSS_WALKER' && b.id !== 'THE_HUNTER') {
             if (b.x <= b.radius || b.x >= WORLD_WIDTH - b.radius) (b as Bot).dx *= -1;
             if (b.y <= b.radius || b.y >= WORLD_HEIGHT - b.radius) (b as Bot).dy *= -1;
        }
    }

    // COLLISIONS
    const bacteriaToRemove: string[] = [];
    
    for (let i = 0; i < allBacteria.length; i++) {
        const b1 = allBacteria[i];
        if (bacteriaToRemove.includes(b1.id)) continue;

        for (let j = i + 1; j < allBacteria.length; j++) {
            const b2 = allBacteria[j];
            if (bacteriaToRemove.includes(b2.id)) continue;

            const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
            if (dist < Math.max(b1.radius, b2.radius)) {
                let bigger = b1.radius > b2.radius ? b1 : b2;
                let smaller = b1.radius > b2.radius ? b2 : b1;
                
                if (gameMode === 'MAZE') {
                    // Bot with Weapon kills Runner
                    if (bigger.id === 'THE_RUNNER' || smaller.id === 'THE_RUNNER') {
                        const runner = bigger.id === 'THE_RUNNER' ? bigger : smaller;
                        const other = bigger.id === 'THE_RUNNER' ? smaller : bigger;
                        
                        if (other.id === 'player') {
                            if (player.hasWeapon) {
                                onVictory(Math.round(player.radius), survivalTimeRef.current);
                                return;
                            } else {
                                if (!isJumpscareRef.current && !settings.safeMode) {
                                    isJumpscareRef.current = true;
                                    audioEngine.playFatalErrorSound();
                                    setTimeout(() => {
                                        audioEngine.stopFatalErrorSound();
                                        onReturnToMenu();
                                    }, 26000);
                                } else if (settings.safeMode) {
                                    onGameOver(Math.round(player.radius), survivalTimeRef.current);
                                }
                                return;
                            }
                        } else {
                            // BOT VS RUNNER
                            if ((other as Bot).hasWeapon) {
                                // BOT KILLS RUNNER!
                                bacteriaToRemove.push(runner.id);
                                runnerDeadRef.current = true;
                                killLogRef.current.unshift({
                                    id: Math.random().toString(),
                                    message: `${other.name} mató al Corredor!`,
                                    timestamp: Date.now()
                                });
                                // Runner removed
                            } else {
                                // RUNNER KILLS BOT
                                bacteriaToRemove.push(other.id);
                                killLogRef.current.unshift({
                                    id: Math.random().toString(),
                                    message: `El Corredor atrapó a ${other.name}`,
                                    timestamp: Date.now()
                                });
                                if(killLogRef.current.length > 5) killLogRef.current.pop();
                                if(runner.id === 'THE_RUNNER') runner.radius += 2;
                            }
                        }
                        continue;
                    }
                    // Exit Logic for Bots
                    if (mazeExitRef.current) {
                        if (Math.hypot(b1.x - mazeExitRef.current.x, b1.y - mazeExitRef.current.y) < mazeExitRef.current.radius) {
                            if (b1.id !== 'player') bacteriaToRemove.push(b1.id);
                        }
                        if (Math.hypot(b2.x - mazeExitRef.current.x, b2.y - mazeExitRef.current.y) < mazeExitRef.current.radius) {
                            if (b2.id !== 'player') bacteriaToRemove.push(b2.id);
                        }
                    }
                }
                
                if (gameMode === 'COLLECTATHON') {
                    if (bigger.id === 'THE_HUNTER' || smaller.id === 'THE_HUNTER') {
                        // COOLDOWN CHECK FOR HUNTER KILLS
                        const hunter = (bigger.id === 'THE_HUNTER' ? bigger : smaller) as Bot;
                        if (hunter.eatingCooldown && hunter.eatingCooldown > 0) continue;

                        if (smaller.id === 'player' || bigger.id === 'player') {
                            onGameOver(Math.round(player.radius), survivalTimeRef.current);
                            return;
                        }
                        // Hunter eats bot teammates
                        if (smaller.id !== 'THE_HUNTER') {
                            bacteriaToRemove.push(smaller.id);
                            // Set Cooldown (240 frames ~ 4 seconds)
                            hunter.eatingCooldown = 240; 
                            
                            // Drop gem if holding
                            if ((smaller as Bot).hasGem) {
                                gemsRef.current.push({ id: `dropped_${Date.now()}`, x: smaller.x, y: smaller.y, radius: 20 });
                            }
                            killLogRef.current.unshift({
                                id: Math.random().toString(),
                                message: `El Cazador devoró a ${smaller.name}`,
                                timestamp: Date.now()
                            });
                            if(killLogRef.current.length > 3) killLogRef.current.pop();
                        }
                        continue;
                    }
                }

                if (bigger.id === 'THE_GHOST' || smaller.id === 'THE_GHOST') {
                    if (bigger.id === 'player' || smaller.id === 'player') {
                         if (!settings.safeMode) {
                             isCrashedRef.current = true;
                             audioEngine.playFatalErrorSound();
                         } else {
                             onGameOver(Math.round(player.radius), survivalTimeRef.current);
                         }
                         return;
                    }
                    continue;
                }
                
                // ABYSS WALKER / RED DEATH COLLISION
                if (bigger.id === 'RED_DEATH' || smaller.id === 'RED_DEATH' || bigger.id === 'ABYSS_WALKER' || smaller.id === 'ABYSS_WALKER') {
                    if (bigger.id === 'player' || smaller.id === 'player') {
                         if (!settings.safeMode) {
                             const curseKey = bigger.id === 'ABYSS_WALKER' || smaller.id === 'ABYSS_WALKER' ? 'abyss_curse_active' : 'deep_curse_active';
                             localStorage.setItem(curseKey, 'true');
                             localStorage.setItem(curseKey.replace('active', 'count'), '0');
                             isCrashedRef.current = true;
                             audioEngine.playFatalErrorSound();
                         } else {
                             onGameOver(Math.round(player.radius), survivalTimeRef.current);
                         }
                         return;
                    }
                    // ABYSS WALKER EATS VICTIMS
                    if (bigger.id === 'ABYSS_WALKER' && smaller.id !== 'ABYSS_WALKER') {
                        bacteriaToRemove.push(smaller.id);
                        killLogRef.current.unshift({
                            id: Math.random().toString(),
                            message: `La Entidad devoró a ${smaller.name}`,
                            timestamp: Date.now()
                        });
                        if(killLogRef.current.length > 5) killLogRef.current.pop();
                    }
                    continue;
                }

                const eatRatio = (bigger as Boss).isBoss ? 1 : BOSS_EAT_RATIO;
                if ((smaller as Boss).isBoss) {
                     if (bigger.id === 'player' && bigger.radius > smaller.radius * BOSS_EAT_RATIO) {
                        onVictory(Math.round(bigger.radius), survivalTimeRef.current);
                        return;
                    }
                }
                
                if (bigger.radius > smaller.radius * eatRatio) {
                    if (bigger.id === 'player') {
                        onEatBot();
                        if (settings.vibration && navigator.vibrate) navigator.vibrate(20);
                    }
                    bigger.radius = Math.sqrt(bigger.radius**2 + smaller.radius**2);
                    
                    if (smaller.id === 'player') { onGameOver(Math.round(player.radius), survivalTimeRef.current); return; } 
                    
                    bacteriaToRemove.push(smaller.id);
                }
            }
        }
    }
    
    // COLLECTATHON GEM BOT LOGIC
    if (gameMode === 'COLLECTATHON') {
        for (let i = gemsRef.current.length - 1; i >= 0; i--) {
            const gem = gemsRef.current[i];
            for (const bot of bots) {
                if (bot.id.startsWith('teammate') && !(bot as Bot).hasGem) {
                    if (Math.hypot(bot.x - gem.x, bot.y - gem.y) < bot.radius + gem.radius) {
                        (bot as Bot).hasGem = true;
                        gemsRef.current.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        // Bots depositing gems
        for (const bot of bots) {
            if (bot.id.startsWith('teammate') && (bot as Bot).hasGem) {
                if (Math.hypot(bot.x - altarRef.current.x, bot.y - altarRef.current.y) < bot.radius + altarRef.current.radius) {
                    (bot as Bot).hasGem = false;
                    gemsCollectedRef.current += 1;
                }
            }
        }
    }
    
    if (bacteriaToRemove.length > 0) {
        botsRef.current = botsRef.current.filter(b => !bacteriaToRemove.includes(b.id));
        predatorsRef.current = predatorsRef.current.filter(b => !bacteriaToRemove.includes(b.id));
        leviathansRef.current = leviathansRef.current.filter(b => !bacteriaToRemove.includes(b.id));
        bossesRef.current = bossesRef.current.filter(b => !bacteriaToRemove.includes(b.id));
    }
    
    for(let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        for (const b of allBacteria) {
             if (bacteriaToRemove.includes(b.id)) continue;
             if(b.id === 'THE_GHOST' || b.id === 'RED_DEATH' || b.id === 'ABYSS_WALKER' || b.id === 'THE_HUNTER' || (b as Police).isPolice) continue;
            const dist = Math.hypot(b.x - f.x, b.y - f.y);
            if (dist < b.radius) {
                if (f.color === '#9400D3' && !(b as Boss).isBoss) { 
                    b.radius = Math.max(5, b.radius / 1.05);
                } else {
                    const isPlayer = b.id === 'player';
                    if (isPlayer) {
                        onEat();
                        if (settings.vibration && navigator.vibrate) navigator.vibrate(10);
                    }
                    b.radius += 0.8; 
                    if (isPlayer) {
                        for (let k = 0; k < 5; k++) {
                            particlesRef.current.push({
                                x: b.x,
                                y: b.y,
                                z: Math.random() * 2 + 0.5,
                                radius: Math.random() * 2 + 1,
                                opacity: 0.8,
                                dx: (Math.random() - 0.5) * 2,
                                dy: (Math.random() - 0.5) * 2,
                            });
                        }
                    }
                }
                food.splice(i, 1);
                food.push({
                    id: `food_${Date.now()}_${Math.random()}`,
                    x: Math.random() * WORLD_WIDTH,
                    y: Math.random() * WORLD_HEIGHT,
                    radius: FOOD_RADIUS,
                    color: 'lightgreen',
                });
                break;
            }
        }
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, pond.backgroundColor[0]);
    gradient.addColorStop(1, pond.backgroundColor[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particlesRef.current.forEach(p => {
        const parallaxSpeed = p.z || 1; 
        p.x += p.dx * parallaxSpeed;
        p.y += p.dy * parallaxSpeed;
        p.opacity -= 0.005;

        if (p.opacity <= 0) {
            p.x = player.x + (Math.random() - 0.5) * canvas.width * 1.5;
            p.y = player.y + (Math.random() - 0.5) * canvas.height * 1.5;
            p.opacity = Math.random();
            p.z = Math.random() * 2 + 0.5; 
        }
        
        // Cull
        const viewPadding = 100;
        const minX = player.x - canvas.width / 2 - viewPadding;
        const maxX = player.x + canvas.width / 2 + viewPadding;
        const minY = player.y - canvas.height / 2 - viewPadding;
        const maxY = player.y + canvas.height / 2 + viewPadding;
        
        if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) return;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * parallaxSpeed, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
        ctx.fill();
    });

    ctx.save();
    
    // CAMERA TRANSLATION LOGIC
    let camX = player.x;
    let camY = player.y;
    
    if (isSpectating && pond.id === 'abyss') {
        const entity = botsRef.current.find(b => b.id === 'ABYSS_WALKER');
        if (entity) {
            camX = entity.x;
            camY = entity.y;
        }
    }
    
    ctx.translate(canvas.width / 2 - camX, canvas.height / 2 - camY);
    
    // Viewport Culling logic (Updated with Camera Pos)
    const viewPadding = 100;
    const minX = camX - canvas.width / 2 - viewPadding;
    const maxX = camX + canvas.width / 2 + viewPadding;
    const minY = camY - canvas.height / 2 - viewPadding;
    const maxY = camY + canvas.height / 2 + viewPadding;
    
    if (gameMode === 'MAZE') {
        for(const w of mazeGridRef.current) {
             if (w.x > maxX || w.x + w.w < minX || w.y > maxY || w.y + w.h < minY) continue;
             ctx.fillStyle = w.color;
             ctx.beginPath();
             ctx.roundRect(w.x, w.y, w.w, w.h, 20);
             ctx.fill();
        }
        
        for(const w of weapons) {
            if (w.x < minX || w.x > maxX || w.y < minY || w.y > maxY) continue;
            ctx.font = '30px sans-serif';
            ctx.fillText('🔪', w.x - 15, w.y + 10);
        }
        
        if(mazeExitRef.current) {
            ctx.beginPath();
            ctx.arc(mazeExitRef.current.x, mazeExitRef.current.y, mazeExitRef.current.radius, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 30px sans-serif';
            ctx.fillText('SALIDA', mazeExitRef.current.x, mazeExitRef.current.y);
        }
    }
    
    if (gameMode === 'COLLECTATHON') {
        // Draw House
        ctx.fillStyle = 'rgba(100, 50, 0, 0.3)';
        ctx.fillRect(houseRef.current.x, houseRef.current.y, houseRef.current.w, houseRef.current.h);
        ctx.strokeStyle = 'brown';
        ctx.lineWidth = 5;
        ctx.strokeRect(houseRef.current.x, houseRef.current.y, houseRef.current.w, houseRef.current.h);
        
        // Draw Altar
        ctx.beginPath();
        ctx.arc(altarRef.current.x, altarRef.current.y, altarRef.current.radius, 0, Math.PI*2);
        ctx.fillStyle = 'gold';
        ctx.fill();
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛩️', altarRef.current.x, altarRef.current.y);
        
        // Draw Trees
        for (const t of forestTreesRef.current) {
            if (t.x < minX || t.x > maxX || t.y < minY || t.y > maxY) continue;
            ctx.font = '60px sans-serif';
            ctx.fillText('🌲', t.x, t.y);
        }
        
        // Draw Gems
        for (const g of gemsRef.current) {
            if (g.x < minX || g.x > maxX || g.y < minY || g.y > maxY) continue;
            ctx.font = '30px sans-serif';
            ctx.fillText('💎', g.x, g.y);
        }
        
        // Draw Exit if unlocked
        if (gemsCollectedRef.current >= 10 && mazeExitRef.current) {
            ctx.beginPath();
            ctx.arc(mazeExitRef.current.x, mazeExitRef.current.y, mazeExitRef.current.radius, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.fillStyle = '#00FF00';
            ctx.font = 'bold 30px sans-serif';
            ctx.fillText('ESCAPE', mazeExitRef.current.x, mazeExitRef.current.y);
        }
    }
    
    foodRef.current.forEach(f => {
        if (f.x < minX || f.x > maxX || f.y < minY || f.y > maxY) return;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
    });
    
    // RENDER ANOMALIES
    if(!isCursedHourRef.current || pond.id === 'cursed_forest' || pond.id === 'abyss') { 
        anomaliesRef.current.forEach(a => {
             if (a.x < minX || a.x > maxX || a.y < minY || a.y > maxY) return;
             const size = 60;
             ctx.font = `${size}px sans-serif`;
             let emoji = '❓';
             if (a.type === 'MONOLITH') emoji = a.content || '🗿'; 
             if (a.type === 'STATIC_CUBE') emoji = a.content || '⬛'; 
             if (a.type === 'TEXT') emoji = a.content || '';
             
             const bob = Math.sin(Date.now() / 500) * 10;
             ctx.fillText(emoji, a.x, a.y + bob);
        });
    }

    allBacteria.sort((a,b) => a.radius - b.radius).forEach(b => {
        if (b.x < minX || b.x > maxX || b.y < minY || b.y > maxY) return;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const emojiScale = breathScale * ((b as Boss).isBoss ? 2 : 1.5);
        ctx.font = `${b.radius * emojiScale}px sans-serif`;
        
        let displayEmoji = '🦠';
        if (b.id === 'THE_GHOST') displayEmoji = '🦠'; 
        if (b.id === 'THE_RUNNER') displayEmoji = '👹'; 
        if (b.id === 'RED_DEATH') displayEmoji = '🦠';
        if (b.id === 'ABYSS_WALKER') displayEmoji = '🦠';
        if (b.id === 'THE_HUNTER') displayEmoji = '👹';
        if ((b as Police).isPolice) displayEmoji = '🚨';
        
        const botBehavior = (b as Bot).behavior;
        if (botBehavior === 'ENOJON') displayEmoji = '🦠'; 
        
        ctx.fillText(displayEmoji, b.x, b.y);
        
        if (botBehavior === 'ENOJON' && (b as Bot).isAngry) {
             ctx.font = `${b.radius}px sans-serif`;
             ctx.fillText('😠', b.x, b.y - b.radius);
        }
        
        if (b.id === 'player' && b.accessory && b.accessory.id !== 'none') {
            const accessorySize = b.radius * 1; 
            ctx.font = `${accessorySize}px sans-serif`;
            const offsetX = (parseFloat(b.accessory.offset.x) / 100) * b.radius;
            const offsetY = (parseFloat(b.accessory.offset.y) / 100) * b.radius;
            ctx.fillText(b.accessory.emoji, b.x + offsetX, b.y + offsetY);
        }
        
        if (b.id === 'player' && player.hasWeapon) {
             ctx.font = `${b.radius}px sans-serif`;
             ctx.fillText('🔪', b.x + b.radius, b.y - b.radius);
        }
        
        // MAZE: Render weapon on armed bots
        if (gameMode === 'MAZE' && (b as Bot).hasWeapon) {
             ctx.font = `${b.radius}px sans-serif`;
             ctx.fillText('🔪', b.x + b.radius, b.y - b.radius);
        }
        
        // RENDER GEM ON PLAYER
        if (b.id === 'player' && player.hasGem) {
             ctx.font = `${b.radius}px sans-serif`;
             ctx.fillText('💎', b.x + b.radius, b.y - b.radius);
        }
        
        // RENDER GEM ON BOTS (VISUAL)
        if (b.id.startsWith('teammate') && (b as Bot).hasGem) {
             ctx.font = `${b.radius}px sans-serif`;
             ctx.fillText('💎', b.x + b.radius, b.y - b.radius);
        }

        const nameFontSize = Math.max(12, b.radius / 2.5);
        ctx.font = `bold ${nameFontSize}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(b.name, b.x, b.y - b.radius - 10);
        ctx.fillText(b.name, b.x, b.y - b.radius - 10);
    });

    ctx.restore();
    
    const gradientVignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width / 4, canvas.width / 2, canvas.height / 2, canvas.width);
    gradientVignette.addColorStop(0, 'rgba(0,0,0,0)');
    gradientVignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = gradientVignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // FPS DISPLAY
    if (settings.showFPS) {
        ctx.fillStyle = 'lime';
        ctx.font = '16px monospace';
        ctx.fillText(`FPS: ${fpsRef.current.fps}`, 10, 20);
    }
    
    // COLLECTATHON HUD
    if (gameMode === 'COLLECTATHON') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(canvas.width/2 - 100, 10, 200, 50);
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`GEMAS: ${gemsCollectedRef.current} / 10`, canvas.width/2, 45);
        
        if (isHiddenRef.current) {
            ctx.fillStyle = 'lime';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('ESCONDIDO (SEGURO)', canvas.width/2, 80);
        } else {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('VISIBLE (¡CUIDADO!)', canvas.width/2, 80);
        }
        
        // KILL LOG FOR COLLECTATHON
        if (killLogRef.current.length > 0) {
            ctx.textAlign = 'right';
            ctx.font = 'bold 16px sans-serif';
            let y = 300; 
            killLogRef.current.forEach(log => {
                const alpha = Math.max(0, 1 - (Date.now() - log.timestamp) / 3000);
                if (alpha > 0) {
                    const msgWidth = ctx.measureText(log.message).width;
                    ctx.beginPath();
                    ctx.roundRect(canvas.width - msgWidth - 40, y - 25, msgWidth + 30, 35, 10);
                    ctx.fillStyle = `rgba(50, 0, 0, ${alpha * 0.7})`;
                    ctx.fill();
                    ctx.fillStyle = `rgba(255, 200, 200, ${alpha})`;
                    ctx.fillText(log.message, canvas.width - 25, y);
                    y += 45;
                }
            });
        }
    }
    
    // SPECTATOR MODE UI
    if (pond.id === 'abyss' && !settings.safeMode) {
        if (!isSpectating) {
            // CAMERA BUTTON
            // Render on top right
            const camX = canvas.width - 60;
            const camY = 100;
            
            // Simple click check logic would be needed here, but for now just visual
            // Using logic below in click handler
            ctx.font = '40px sans-serif';
            ctx.fillText('📹', camX, camY);
        } else {
            // EXIT BUTTON
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(canvas.width / 2 - 100, canvas.height - 80, 200, 50);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DEJAR DE VER', canvas.width / 2, canvas.height - 48);
            
            // Rec Effect
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(30, 30, 10, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('REC - ENTIDAD', 50, 37);
        }
    }
    
    // LEADERBOARD (VISIBLE IN ABYSS NOW)
    if (pond.id !== 'cursed_forest' && pond.id !== 'ghost_void' && pond.id !== 'void_death') {
        const lbX = canvas.width - 220;
        const lbY = 20;
        const lbWidth = 200;
        const topCount = 10;

        const leaderboard = [player, ...bots, ...bosses, ...police];
        if (cursedEntityRef.current) leaderboard.push(cursedEntityRef.current);
        leaderboard.sort((a, b) => b.radius - a.radius);

        const playerRank = leaderboard.findIndex(b => b.id === 'player');
        const playerInTop = playerRank < topCount;
        
        const lbHeaderHeight = 40;
        const lbItemHeight = 25;
        let lbHeight = lbHeaderHeight + (Math.min(leaderboard.length, topCount) * lbItemHeight) + 10;
        if (!playerInTop && playerRank !== -1) {
            lbHeight += lbItemHeight + 10; 
        }
        
        lbRef.current = {
            x: lbX,
            y: lbY,
            width: lbWidth,
            itemHeight: lbItemHeight,
            headerHeight: lbHeaderHeight,
            items: leaderboard.slice(0, topCount)
        };

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(lbX, lbY, lbWidth, lbHeight, 10);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Clasificación', lbX + lbWidth / 2, lbY + 25);

        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';

        let yPos = lbY + lbHeaderHeight + 15;

        for (let i = 0; i < Math.min(leaderboard.length, topCount); i++) {
            const b = leaderboard[i];
            const isMe = b.id === 'player';
            const isFriend = friends.some(f => f.name === b.name);
            
            if (i === 0) ctx.fillStyle = '#FFD700'; 
            else if (i === 1) ctx.fillStyle = '#C0C0C0'; 
            else if (i === 2) ctx.fillStyle = '#CD7F32'; 
            else if (isMe) ctx.fillStyle = '#00FF00';
            else if (isFriend) ctx.fillStyle = '#00FF00'; 
            else ctx.fillStyle = 'white'; 

            const name = b.name.length > 12 ? b.name.substring(0, 10) + '..' : b.name;
            const scoreVal = Math.round(b.radius);

            ctx.fillText(`${i + 1}. ${name}`, lbX + 15, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(`${scoreVal}`, lbX + lbWidth - 15, yPos);
            ctx.textAlign = 'left';
            
            yPos += lbItemHeight;
        }

        if (!playerInTop && playerRank !== -1) {
            yPos += 5;
            ctx.beginPath();
            ctx.moveTo(lbX + 10, yPos - 12);
            ctx.lineTo(lbX + lbWidth - 10, yPos - 12);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();

            ctx.fillStyle = '#00FF00'; 
            const b = player;
            const name = b.name.length > 12 ? b.name.substring(0, 10) + '..' : b.name;
            const scoreVal = Math.round(b.radius);

            ctx.fillText(`${playerRank + 1}. ${name}`, lbX + 15, yPos);
            ctx.textAlign = 'right';
            ctx.fillText(`${scoreVal}`, lbX + lbWidth - 15, yPos);
        }
        ctx.restore();
    }
    
    // Kill Log (MAZE and ABYSS)
    if ((gameMode === 'MAZE' || pond.id === 'abyss') && killLogRef.current.length > 0) {
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px sans-serif';
        let y = pond.id === 'abyss' ? 300 : 300; 
        if (pond.id !== 'abyss' && pond.id !== 'maze') y = 300; // General y

        killLogRef.current.forEach(log => {
            const alpha = Math.max(0, 1 - (Date.now() - log.timestamp) / 3000);
            if (alpha > 0) {
                const msgWidth = ctx.measureText(log.message).width;
                
                ctx.beginPath();
                ctx.roundRect(canvas.width - msgWidth - 40, y - 25, msgWidth + 30, 35, 10);
                ctx.fillStyle = `rgba(50, 0, 0, ${alpha * 0.7})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(255, 0, 0, ${alpha * 0.5})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.fillStyle = `rgba(255, 200, 200, ${alpha})`;
                ctx.fillText(log.message, canvas.width - 25, y);
                y += 45;
            }
        });
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Puntuación: ${currentScore}`, 20, 40);

    if (joystickRef.current && joystickRef.current.active) {
        const j = joystickRef.current;
        
        const baseGradient = ctx.createRadialGradient(j.originX, j.originY, 10, j.originX, j.originY, 50);
        baseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        baseGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        
        ctx.beginPath();
        ctx.arc(j.originX, j.originY, 50, 0, Math.PI * 2);
        ctx.fillStyle = baseGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const stickGradient = ctx.createRadialGradient(j.currentX, j.currentY, 5, j.currentX, j.currentY, 25);
        stickGradient.addColorStop(0, 'rgba(200, 200, 255, 0.9)');
        stickGradient.addColorStop(1, 'rgba(100, 100, 255, 0.8)');

        ctx.beginPath();
        ctx.arc(j.currentX, j.currentY, 25, 0, Math.PI * 2);
        ctx.fillStyle = stickGradient;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // MINIMAP (HIDDEN IN CURSED/GHOST)
    if (pond.id !== 'cursed_forest' && pond.id !== 'ghost_void' && pond.id !== 'void_death' && pond.id !== 'abyss') {
        const mapSize = 150;
        const mapMargin = 20;
        const mapX = canvas.width - mapSize - mapMargin;
        const mapY = canvas.height - mapSize - mapMargin;
        
        ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);
        
        if (gameMode === 'MAZE') {
            ctx.fillStyle = 'rgba(0, 100, 0, 0.5)';
            for(const w of mazeGridRef.current) {
                 const mx = mapX + (w.x / WORLD_WIDTH) * mapSize;
                 const my = mapY + (w.y / WORLD_HEIGHT) * mapSize;
                 const mw = (w.w / WORLD_WIDTH) * mapSize;
                 const mh = (w.h / WORLD_HEIGHT) * mapSize;
                 ctx.fillRect(mx, my, mw + 0.5, mh + 0.5);
            }
        }
        
        allBacteria.forEach(b => {
            const mx = mapX + (b.x / WORLD_WIDTH) * mapSize;
            const my = mapY + (b.y / WORLD_HEIGHT) * mapSize;
            
            if (mx < mapX || mx > mapX + mapSize || my < mapY || my > mapY + mapSize) return;
            
            ctx.beginPath();
            if (b.id === 'player') {
                ctx.fillStyle = '#00FF00'; // Player Green
                ctx.arc(mx, my, 4, 0, Math.PI * 2);
            } else if (b.id === 'THE_RUNNER') {
                ctx.fillStyle = '#FF0000'; // Runner Red
                ctx.arc(mx, my, 5, 0, Math.PI * 2);
            } else if ((b as Boss).isBoss) {
                ctx.fillStyle = '#FFFF00'; // Boss Yellow
                ctx.arc(mx, my, 5, 0, Math.PI * 2);
            } else {
                 ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                 ctx.arc(mx, my, 2, 0, Math.PI * 2);
            }
            ctx.fill();
        });
    }


    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [onGameOver, onVictory, pond, settings, onEat, onEatBot, onScoreUpdate, onMinuteSurvived, gameMode, playerName, friends, onAddFriend, onReturnToMenu, isSpectating]);
  
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  useEffect(() => {
      return () => {
          audioEngine.stopCursedNoise(); 
          audioEngine.stopDangerZoneSound();
      }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // CHECK SPECTATOR CLICKS
        if (pond?.id === 'abyss' && !settings.safeMode) {
            if (isSpectating) {
                // Exit Button Area (Bottom Center)
                if (x > canvas.width/2 - 100 && x < canvas.width/2 + 100 && y > canvas.height - 80) {
                    setIsSpectating(false);
                    return;
                }
            } else {
                // Camera Icon Area (Top Right)
                const camX = canvas.width - 60;
                const camY = 100;
                if (Math.abs(x - camX) < 40 && Math.abs(y - camY) < 40) {
                    setIsSpectating(true);
                    return;
                }
            }
        }

        const lb = lbRef.current;
        if (x >= lb.x && x <= lb.x + lb.width && y >= lb.y && y <= lb.y + (lb.items.length * lb.itemHeight) + lb.headerHeight) {
             const relativeY = y - lb.y - lb.headerHeight - 10;
             if (relativeY >= 0) {
                 const index = Math.floor(relativeY / lb.itemHeight);
                 if (index >= 0 && index < lb.items.length) {
                     const bot = lb.items[index];
                     onAddFriend(bot);
                     return; 
                 }
             }
        }

        joystickRef.current = {
            active: true,
            originX: touch.clientX,
            originY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY
        };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (joystickRef.current && joystickRef.current.active) {
            const touch = e.touches[0];
            joystickRef.current.currentX = touch.clientX;
            joystickRef.current.currentY = touch.clientY;
        }
    };
    
    const handleTouchEnd = () => {
        joystickRef.current = null;
    };
    
    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // CHECK SPECTATOR CLICKS (MOUSE)
        if (pond?.id === 'abyss' && !settings.safeMode) {
            if (isSpectating) {
                if (x > canvas.width/2 - 100 && x < canvas.width/2 + 100 && y > canvas.height - 80) {
                    setIsSpectating(false);
                    return;
                }
            } else {
                const camX = canvas.width - 60;
                const camY = 100;
                if (Math.abs(x - camX) < 40 && Math.abs(y - camY) < 40) {
                    setIsSpectating(true);
                    return;
                }
            }
        }
        
        const lb = lbRef.current;
        if (x >= lb.x && x <= lb.x + lb.width && y >= lb.y && y <= lb.y + (lb.items.length * lb.itemHeight) + lb.headerHeight) {
             const relativeY = y - lb.y - lb.headerHeight - 10;
             if (relativeY >= 0) {
                 const index = Math.floor(relativeY / lb.itemHeight);
                 if (index >= 0 && index < lb.items.length) {
                     const bot = lb.items[index];
                     onAddFriend(bot);
                     return; 
                 }
             }
        }

        joystickRef.current = {
            active: true,
            originX: e.clientX,
            originY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY
        };
    };
    
    const handleMouseMove = (e: MouseEvent) => {
         if (joystickRef.current && joystickRef.current.active) {
            joystickRef.current.currentX = e.clientX;
            joystickRef.current.currentY = e.clientY;
        }
    };
    
    const handleMouseUp = () => {
        joystickRef.current = null;
    };

    
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    canvas.addEventListener('touchstart', handleTouchStart, {passive: false});
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', handleTouchEnd);
    
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if(animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [gameLoop, onAddFriend, isSpectating, pond?.id, settings.safeMode]);

  return <canvas ref={canvasRef} className="block select-none touch-none" />;
};

export default GameCanvas;
