import React from 'react';
import type { Settings } from '../types';

interface SettingsScreenProps {
  onBack: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onResetHighScore: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, settings, onSettingsChange, onResetHighScore }) => {
  const handleResetClick = () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar tu puntuación máxima? Esta acción no se puede deshacer.')) {
      onResetHighScore();
      alert('Puntuación máxima reiniciada.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h1 className="text-5xl md:text-7xl font-bold mb-8 text-shadow-lg">Ajustes</h1>
      <div className="bg-black bg-opacity-20 p-8 rounded-lg w-full max-w-lg overflow-y-auto max-h-[80vh]">
        
        {/* Music Volume */}
        <div className="mb-6">
          <label className="block text-lg mb-2 text-gray-500" htmlFor="music-volume">Volumen de la Música: (Desactivada)</label>
          <input
            id="music-volume"
            type="range"
            min="0"
            max="100"
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-not-allowed"
            value={0}
            disabled
            readOnly
          />
        </div>

        {/* SFX Volume */}
        <div className="mb-6">
          <label className="block text-lg mb-2" htmlFor="sfx-volume">Volumen de SFX: {settings.sfxVolume}%</label>
          <input
            id="sfx-volume"
            type="range"
            min="0"
            max="100"
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            value={settings.sfxVolume}
            onChange={(e) => onSettingsChange({ ...settings, sfxVolume: parseInt(e.target.value, 10) })}
          />
        </div>
        
        {/* Graphics Quality */}
        <div className="mb-6">
          <label className="block text-lg mb-2" htmlFor="graphics-quality">Calidad de Gráficos</label>
          <select
            id="graphics-quality"
            className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={settings.graphicsQuality}
            onChange={(e) => onSettingsChange({ ...settings, graphicsQuality: e.target.value as Settings['graphicsQuality'] })}
          >
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
        </div>

        {/* Direct Play Options - Classic Style */}
        <div className="mb-6">
           <label htmlFor="directPlay" className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-700">
            <input
              type="checkbox"
              id="directPlay"
              className="h-5 w-5 rounded accent-blue-500"
              checked={settings.directPlay}
              onChange={(e) => onSettingsChange({ ...settings, directPlay: e.target.checked })}
            />
            <span className="font-bold text-blue-300">Saltar selección de modo</span>
          </label>
          
          {settings.directPlay && (
               <div className="mt-2 pl-8">
                   <label className="block text-sm mb-1 text-gray-400">Modo por defecto:</label>
                   <select
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none"
                        value={settings.defaultGameMode}
                        onChange={(e) => onSettingsChange({ ...settings, defaultGameMode: e.target.value as Settings['defaultGameMode'] })}
                    >
                        <option value="SURVIVAL">Supervivencia</option>
                        <option value="TIME_ATTACK">Contrarreloj</option>
                        <option value="MAZE">Laberinto</option>
                        <option value="COLLECTATHON">Coleccionista</option>
                    </select>
               </div>
           )}
        </div>

        {/* Checkbox Options List */}
        <div className="mb-6 space-y-3">
          <label htmlFor="showPlayerName" className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-700">
            <input
              type="checkbox"
              id="showPlayerName"
              className="h-5 w-5 rounded accent-blue-500"
              checked={settings.showPlayerName}
              onChange={(e) => onSettingsChange({ ...settings, showPlayerName: e.target.checked })}
            />
            <span>Mostrar mi nombre</span>
          </label>
          
          <label htmlFor="showBotNames" className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-700">
            <input
              type="checkbox"
              id="showBotNames"
              className="h-5 w-5 rounded accent-blue-500"
              checked={settings.showBotNames}
              onChange={(e) => onSettingsChange({ ...settings, showBotNames: e.target.checked })}
            />
            <span>Mostrar nombres de bots</span>
          </label>
          
          <label htmlFor="colorblindMode" className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-700">
            <input
              type="checkbox"
              id="colorblindMode"
              className="h-5 w-5 rounded accent-blue-500"
              checked={settings.colorblindMode}
              onChange={(e) => onSettingsChange({ ...settings, colorblindMode: e.target.checked })}
            />
            <span>Modo daltónico</span>
          </label>
        </div>
        
        <hr className="border-gray-600 my-6" />
        
        {/* System Utilities */}
        <div className="mb-6 space-y-2">
            <h3 className="text-lg font-bold text-gray-400 mb-2">Utilidades</h3>
            
            <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-700">
                <span>🛡️ Modo Seguro (Sin sustos)</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-purple-500"
                  checked={settings.safeMode}
                  onChange={(e) => onSettingsChange({ ...settings, safeMode: e.target.checked })}
                />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-700">
                <span>📳 Vibración</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-purple-500"
                  checked={settings.vibration}
                  onChange={(e) => onSettingsChange({ ...settings, vibration: e.target.checked })}
                />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-700">
                <span>📊 Mostrar FPS</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-purple-500"
                  checked={settings.showFPS}
                  onChange={(e) => onSettingsChange({ ...settings, showFPS: e.target.checked })}
                />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-gray-700">
                <span className="text-red-400">👁️ Ver Servidores Fantasma</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded accent-red-500"
                  checked={settings.showGhostServers}
                  onChange={(e) => onSettingsChange({ ...settings, showGhostServers: e.target.checked })}
                />
            </label>
        </div>

        <hr className="border-gray-600 my-6" />

        <div className="mb-6">
            <button 
                onClick={handleResetClick}
                className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-3 px-4 rounded border-b-4 border-red-900"
            >
                ⚠️ Reiniciar Puntuación Máxima
            </button>
        </div>
      </div>
      
      <button
        onClick={onBack}
        className="mt-8 bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-6 border-b-4 border-gray-700 hover:border-gray-500 rounded-lg text-lg"
      >
        Volver
      </button>
    </div>
  );
};

export default SettingsScreen;