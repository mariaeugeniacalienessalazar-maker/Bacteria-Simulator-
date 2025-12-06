
import React, { useState, useCallback, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Background3D from './components/Background3D';
import SettingsScreen from './components/SettingsScreen';
import ShopScreen from './components/ShopScreen';
import FriendsScreen from './components/FriendsScreen';
import type { GameState, Pond, Accessory, Settings, GameMode, Mission, Server, Friend, Bot } from './types';
import { PONDS, DEFAULT_SETTINGS, MISSION_DEFINITIONS, SERVER_NAMES, TIME_ATTACK_SECONDS } from './constants';
import { audioEngine } from './components/AudioEngine';

const App: React.FC = () => {
  // CURSE STATE
  const [isCursedLocked, setIsCursedLocked] = useState(false);
  const [curseMessage, setCurseMessage] = useState('');

  // CHECK FOR CURSE ON LOAD
  useEffect(() => {
      if (localStorage.getItem('abyss_curse_active') === 'true') {
          const count = parseInt(localStorage.getItem('abyss_curse_count') || '0', 10);
          if (count < 7) {
              setIsCursedLocked(true);
              setCurseMessage('ABISMO');
              localStorage.setItem('abyss_curse_count', (count + 1).toString());
              audioEngine.playFatalErrorSound();
          } else {
              localStorage.removeItem('abyss_curse_active');
              localStorage.removeItem('abyss_curse_count');
          }
      }
      else if (localStorage.getItem('deep_curse_active') === 'true') {
          const count = parseInt(localStorage.getItem('deep_curse_count') || '0', 10);
          if (count < 4) {
              setIsCursedLocked(true);
              setCurseMessage('...');
              localStorage.setItem('deep_curse_count', (count + 1).toString());
              audioEngine.playFatalErrorSound();
          } else {
              localStorage.removeItem('deep_curse_active');
              localStorage.removeItem('deep_curse_count');
          }
      }
  }, []);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SURVIVAL');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [equippedAccessory, setEquippedAccessory] = useState<Accessory | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  
  const [playerName, setPlayerName] = useState('Felipe');
  const [nameError, setNameError] = useState('');
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionOpacity, setTransitionOpacity] = useState(0);
  
  const [bioPoints, setBioPoints] = useState(0);
  const [unlockedAccessories, setUnlockedAccessories] = useState<string[]>(['none']);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [gameTimer, setGameTimer] = useState(TIME_ATTACK_SECONDS);
  const [finalTime, setFinalTime] = useState(0);

  const [unlockedPondIds, setUnlockedPondIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('bacterioSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    const savedHighScore = localStorage.getItem('bacterioHighScore');
    const scoreVal = savedHighScore ? parseInt(savedHighScore, 10) : 0;
    if (savedHighScore) setHighScore(scoreVal);
    
    const savedName = localStorage.getItem('bacterioPlayerName');
    if (savedName) setPlayerName(savedName);
    
    const savedAccessory = localStorage.getItem('bacterioEquippedAccessory');
    if (savedAccessory) setEquippedAccessory(JSON.parse(savedAccessory));

    const savedBioPoints = localStorage.getItem('bacterioBioPoints');
    if (savedBioPoints) setBioPoints(parseInt(savedBioPoints, 10));

    const savedUnlockedAcc = localStorage.getItem('bacterioUnlockedAccessories');
    if (savedUnlockedAcc) setUnlockedAccessories(JSON.parse(savedUnlockedAcc));
    
    const savedFriends = localStorage.getItem('bacterioFriends');
    if (savedFriends) setFriends(JSON.parse(savedFriends));
    
    // UNLOCK LOGIC
    const savedPonds = localStorage.getItem('bacterioUnlockedPonds');
    let currentUnlockedPonds: string[] = savedPonds ? JSON.parse(savedPonds) : [];
    
    // Ensure basic unlocks
    PONDS.forEach(p => {
        if (p.unlockScore <= scoreVal && !currentUnlockedPonds.includes(p.id)) {
            currentUnlockedPonds.push(p.id);
        }
    });
    // Always unlock freshwater and ghost maps (they are hidden by settings anyway)
    if(!currentUnlockedPonds.includes('freshwater')) currentUnlockedPonds.push('freshwater');
    if(!currentUnlockedPonds.includes('ghost_void')) currentUnlockedPonds.push('ghost_void');
    if(!currentUnlockedPonds.includes('abyss')) currentUnlockedPonds.push('abyss');
    if(!currentUnlockedPonds.includes('cursed_forest')) currentUnlockedPonds.push('cursed_forest');
    
    setUnlockedPondIds(currentUnlockedPonds);
    
    // Missions
    const lastMissionDate = localStorage.getItem('bacterioLastMissionDate');
    const today = new Date().toISOString().split('T')[0];
    if (lastMissionDate !== today) {
        const shuffled = [...MISSION_DEFINITIONS].sort(() => 0.5 - Math.random());
        const newMissions = shuffled.slice(0, 3).map(def => ({
            ...def,
            description: def.description(def.goal),
            progress: 0,
            isClaimed: false,
        }));
        setMissions(newMissions);
        localStorage.setItem('bacterioMissions', JSON.stringify(newMissions));
        localStorage.setItem('bacterioLastMissionDate', today);
    } else {
        const savedMissions = localStorage.getItem('bacterioMissions');
        if (savedMissions) setMissions(JSON.parse(savedMissions));
    }
  }, []);

  const handleSettingsChange = (newSettings: Settings) => {
      setSettings(newSettings);
      localStorage.setItem('bacterioSettings', JSON.stringify(newSettings));
      audioEngine.setSfxVolume(newSettings.sfxVolume);
  }

  const handleGameOver = useCallback((finalScore: number, timeSurvived: number) => {
    setScore(finalScore);
    setGameState('GAME_OVER');
    setFinalTime(timeSurvived);
    audioEngine.playDeathSound();

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('bacterioHighScore', finalScore.toString());
    }
    const newBP = bioPoints + Math.floor(finalScore / 10);
    setBioPoints(newBP);
    localStorage.setItem('bacterioBioPoints', newBP.toString());
  }, [highScore, bioPoints]);

  const handleVictory = useCallback((finalScore: number, timeSurvived: number) => {
      setScore(finalScore);
      setGameState('VICTORY');
      setFinalTime(timeSurvived);
      audioEngine.playVictorySound();
      
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('bacterioHighScore', finalScore.toString());
      }
      const newBP = bioPoints + Math.floor(finalScore / 5) + 100;
      setBioPoints(newBP);
      localStorage.setItem('bacterioBioPoints', newBP.toString());
  }, [highScore, bioPoints]);
  
  const handleAddFriend = (bot: Bot) => {
      if (friends.some(f => f.name === bot.name)) return;
      const newFriend: Friend = {
          id: Math.random().toString(),
          name: bot.name,
          serverName: selectedPond?.name || 'Desconocido', 
          pondId: selectedPond?.id || 'freshwater',
          dateAdded: new Date().toISOString()
      };
      const updatedFriends = [...friends, newFriend];
      setFriends(updatedFriends);
      localStorage.setItem('bacterioFriends', JSON.stringify(updatedFriends));
  };

  const handleRemoveFriend = (friendId: string) => {
      const updatedFriends = friends.filter(f => f.id !== friendId);
      setFriends(updatedFriends);
      localStorage.setItem('bacterioFriends', JSON.stringify(updatedFriends));
  }
  
  const handleJoinFriend = (friend: Friend) => {
      const pond = PONDS.find(p => p.id === friend.pondId);
      if (pond) {
          selectPond(pond);
      }
  };

  const handleStartPlaying = () => {
       if (!playerName.trim()) {
          setNameError('Por favor ingresa un nombre');
          return;
      }
      if (!isAudioInitialized) {
          audioEngine.initialize();
          audioEngine.startAmbience();
          audioEngine.setSfxVolume(settings.sfxVolume);
          setIsAudioInitialized(true);
      }
      
      // GO DIRECTLY TO POND SELECTION
      setGameState('POND_SELECTION');
  }

  const selectPond = (pond: Pond) => {
      setSelectedPond(pond);
      setGameState('PLAYING');
      setGameMode('SURVIVAL'); // Default to Survival for main ponds
      setScore(0);
      setGameTimer(TIME_ATTACK_SECONDS);
  }

  const handleReturnToMenu = () => {
      setGameState('MENU');
      audioEngine.stopFatalErrorSound();
      audioEngine.stopCursedNoise();
  }
  
  const handleMissionEvent = (event: { type: Mission['type'], value: number }) => {
        // ... (mission logic same as before)
        let missionsUpdated = false;
        const updatedMissions = missions.map(mission => {
            if (mission.type === event.type && !mission.isClaimed && mission.progress < mission.goal) {
                const newProgress = Math.min(mission.goal, mission.progress + event.value);
                if (newProgress !== mission.progress) {
                    missionsUpdated = true;
                    return { ...mission, progress: newProgress };
                }
            }
            return mission;
        });
        if (missionsUpdated) {
            setMissions(updatedMissions);
            localStorage.setItem('bacterioMissions', JSON.stringify(updatedMissions));
        }
  };
  
  const handleClaimMission = (missionId: string) => {
        const mission = missions.find(m => m.id === missionId);
        if (mission && mission.progress >= mission.goal && !mission.isClaimed) {
            const newBioPoints = bioPoints + mission.reward;
            setBioPoints(newBioPoints);
            localStorage.setItem('bacterioBioPoints', newBioPoints.toString());
            const updatedMissions = missions.map(m => m.id === missionId ? { ...m, isClaimed: true } : m);
            setMissions(updatedMissions);
            localStorage.setItem('bacterioMissions', JSON.stringify(updatedMissions));
            audioEngine.playEatSound();
        }
  };
  
  const handleEquipAccessory = (acc: Accessory | null) => {
      setEquippedAccessory(acc);
      localStorage.setItem('bacterioEquippedAccessory', JSON.stringify(acc));
  }
  
  const handlePurchaseAccessory = (acc: Accessory) => {
      if (bioPoints >= acc.price && !unlockedAccessories.includes(acc.id)) {
          const newPoints = bioPoints - acc.price;
          setBioPoints(newPoints);
          localStorage.setItem('bacterioBioPoints', newPoints.toString());
          const newUnlocked = [...unlockedAccessories, acc.id];
          setUnlockedAccessories(newUnlocked);
          localStorage.setItem('bacterioUnlockedAccessories', JSON.stringify(newUnlocked));
          audioEngine.playEatSound();
      }
  }
  
  const handleResetHighScore = () => {
      setHighScore(0);
      localStorage.setItem('bacterioHighScore', '0');
  }

  if (isCursedLocked) {
      return (
          <div className="w-full h-screen bg-black text-red-600 font-mono flex flex-col items-center justify-center p-8 text-center select-none">
              <h1 className="text-9xl mb-4 animate-pulse">ERROR</h1>
              <p className="text-4xl mb-8">{curseMessage}</p>
              <p className="text-xl">Sistema bloqueado.</p>
          </div>
      );
  }

  // Filter ponds for the selection screen
  const visiblePonds = settings.showGhostServers 
    ? PONDS.filter(p => ['ghost_void', 'abyss', 'cursed_forest'].includes(p.id))
    : PONDS.filter(p => ['freshwater', 'saltwater', 'stagnant'].includes(p.id));

  return (
    <div className="w-full h-screen overflow-hidden bg-gray-900 text-white font-sans relative">
      <Background3D />
      
      {gameState === 'MENU' && (
          <div className="flex flex-col items-center justify-center h-full z-10 relative">
              <h1 className="text-5xl md:text-7xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 text-shadow-lg flex items-center justify-center gap-2">
                  <span>BACTERIA</span>
                  <span>SIMULAT</span>
                  <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">💧</span>
                  <span>R</span>
              </h1>
              
              <div className="mb-6 flex flex-col items-center">
                  <input 
                      type="text" 
                      value={playerName}
                      onChange={(e) => {
                          setPlayerName(e.target.value);
                          localStorage.setItem('bacterioPlayerName', e.target.value);
                          setNameError('');
                      }}
                      maxLength={12}
                      placeholder="Tu Nombre"
                      className="bg-gray-800 text-white border-2 border-gray-600 rounded-lg px-4 py-2 text-xl text-center focus:outline-none focus:border-blue-500 mb-2"
                  />
                  {nameError && <span className="text-red-400 font-bold">{nameError}</span>}
              </div>

              <div className="flex items-start justify-center w-full gap-20">
                  <div className="space-y-4 w-64">
                      <button onClick={handleStartPlaying} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-green-800 text-xl transition-transform hover:scale-105">
                          JUGAR
                      </button>
                      <button onClick={() => setGameState('MISSIONS')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-blue-800 text-xl transition-transform hover:scale-105">
                          MISIONES
                      </button>
                      <button onClick={() => setGameState('SHOP')} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-yellow-800 text-xl transition-transform hover:scale-105">
                          TIENDA
                      </button>
                      <button onClick={() => setGameState('FRIENDS')} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-cyan-800 text-xl transition-transform hover:scale-105">
                          AMIGOS
                      </button>
                      <button onClick={() => setGameState('SETTINGS')} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg border-b-4 border-gray-800 text-xl transition-transform hover:scale-105">
                          AJUSTES
                      </button>
                  </div>
                  
                  <div className="text-[15rem] hidden md:block relative animate-bounce-slow">
                    <span className="drop-shadow-[0_20px_15px_rgba(0,0,0,0.4)]">🦠</span>
                    {equippedAccessory && equippedAccessory.id !== 'none' && (
                      <span className="absolute text-[8rem] drop-shadow-[0_20px_15px_rgba(0,0,0,0.4)]" style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${equippedAccessory.offset.x}, ${equippedAccessory.offset.y})`
                      }}>
                        {equippedAccessory.emoji}
                      </span>
                    )}
                  </div>
              </div>
          </div>
      )}

      {gameState === 'POND_SELECTION' && (
          <div className="flex flex-col items-center justify-center h-full p-4 z-10 relative">
              <h2 className="text-4xl font-bold mb-6">Elige tu Charco</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl p-2">
                  {visiblePonds.map(pond => {
                      const isLocked = pond.unlockScore > highScore;
                      return (
                          <button 
                              key={pond.id} 
                              onClick={() => !isLocked && selectPond(pond)}
                              disabled={isLocked}
                              className={`p-6 rounded-xl border-4 flex flex-col items-center justify-center relative transition-all min-h-[200px] ${isLocked ? 'bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed' : 'bg-gray-900 bg-opacity-80 border-blue-500 hover:border-white hover:scale-105'}`}
                          >
                              {/* RENDER POND EMOJI */}
                              <span className="text-6xl mb-2 filter drop-shadow-lg">{pond.emoji}</span>
                              <h3 className="text-2xl font-bold mb-2">{pond.name}</h3>
                              {isLocked ? (
                                  <div className="text-red-500 font-bold text-xl flex flex-col items-center">
                                      <span className="text-4xl mb-2">🔒</span>
                                      <span>{pond.unlockScore} pts</span>
                                  </div>
                              ) : (
                                  <span className="text-green-400 font-bold text-xl">DESBLOQUEADO</span>
                              )}
                              <div className="mt-4 text-sm text-gray-400">
                                  {pond.characteristics[0]}
                              </div>
                          </button>
                      );
                  })}
              </div>
              <button onClick={() => setGameState('MENU')} className="mt-12 text-gray-400 hover:text-white underline text-xl">Volver al Menú</button>
          </div>
      )}

      {gameState === 'PLAYING' && (
          <GameCanvas 
              onGameOver={handleGameOver}
              onVictory={handleVictory}
              pond={selectedPond}
              settings={settings}
              equippedAccessory={equippedAccessory}
              onEat={() => {
                  setScore(s => s + 1);
                  handleMissionEvent({type: 'EAT_FOOD', value: 1});
              }}
              onEatBot={() => {
                  setScore(s => s + 10);
                  handleMissionEvent({type: 'EAT_BOTS', value: 1});
              }}
              onScoreUpdate={(s) => {
                  setScore(s);
                  handleMissionEvent({type: 'REACH_SCORE', value: s});
              }}
              onMinuteSurvived={() => {
                  const newBP = bioPoints + 5;
                  setBioPoints(newBP);
                  localStorage.setItem('bacterioBioPoints', newBP.toString());
                  handleMissionEvent({type: 'SURVIVE_MINUTES', value: 1});
              }}
              gameMode={gameMode}
              playerName={playerName}
              friends={friends}
              onAddFriend={handleAddFriend}
              onReturnToMenu={handleReturnToMenu}
          />
      )}
      
      {gameState === 'SETTINGS' && (
          <SettingsScreen 
            onBack={() => setGameState('MENU')} 
            settings={settings} 
            onSettingsChange={handleSettingsChange}
            onResetHighScore={handleResetHighScore}
          />
      )}
      
      {gameState === 'SHOP' && (
          <ShopScreen 
            onBack={() => setGameState('MENU')}
            equippedAccessory={equippedAccessory}
            onEquipAccessory={handleEquipAccessory}
            onPreview={() => audioEngine.playClickSound()}
            bioPoints={bioPoints}
            unlockedAccessories={unlockedAccessories}
            onPurchase={handlePurchaseAccessory}
          />
      )}
      
      {gameState === 'FRIENDS' && (
          <FriendsScreen 
            onBack={() => setGameState('MENU')}
            friends={friends}
            onJoinFriend={handleJoinFriend}
            onRemoveFriend={handleRemoveFriend}
          />
      )}
      
      {gameState === 'MISSIONS' && (
         <div className="flex flex-col items-center justify-center h-full p-4 z-10 relative">
             <h1 className="text-5xl md:text-7xl font-bold mb-8">Misiones</h1>
             <div className="w-full max-w-2xl bg-black bg-opacity-60 p-6 rounded-lg space-y-4">
                 {missions.map(mission => {
                     const isComplete = mission.progress >= mission.goal;
                     return (
                         <div key={mission.id} className="bg-gray-800 p-4 rounded-md flex items-center justify-between">
                             <div>
                                 <p className="text-lg">{mission.description}</p>
                                 <div className="w-full bg-gray-600 rounded-full h-2.5 mt-1">
                                    <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${Math.min(100, (mission.progress / mission.goal) * 100)}%` }}></div>
                                 </div>
                                 <p className="text-sm text-gray-400">{mission.progress} / {mission.goal}</p>
                             </div>
                             <button 
                                onClick={() => handleClaimMission(mission.id)}
                                disabled={!isComplete || mission.isClaimed}
                                className="bg-yellow-500 font-bold py-2 px-4 rounded-lg border-b-2 border-yellow-700 disabled:bg-gray-600 disabled:border-gray-700 disabled:cursor-not-allowed"
                             >
                                 {mission.isClaimed ? 'Reclamado' : `+${mission.reward} BP`}
                             </button>
                         </div>
                     );
                 })}
             </div>
             <button onClick={() => setGameState('MENU')} className="mt-8 bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-6 border-b-4 border-gray-700 hover:border-gray-500 rounded-lg text-lg">
                Volver
            </button>
         </div>
      )}

      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
              <h1 className={`text-6xl font-bold mb-4 ${gameState === 'VICTORY' ? 'text-green-500' : 'text-red-600'}`}>
                  {gameState === 'VICTORY' ? '¡VICTORIA!' : 'FIN DEL JUEGO'}
              </h1>
              <div className="text-2xl mb-8 text-center">
                  <p>Tamaño Final: <span className="text-yellow-400 font-bold">{score}</span></p>
                  <p>Tiempo: <span className="text-blue-400 font-bold">{Math.floor(finalTime)}s</span></p>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => setGameState('POND_SELECTION')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg border-b-4 border-blue-800 text-xl">
                      Jugar de Nuevo
                  </button>
                  <button onClick={() => setGameState('MENU')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg border-b-4 border-gray-800 text-xl">
                      Menú
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
