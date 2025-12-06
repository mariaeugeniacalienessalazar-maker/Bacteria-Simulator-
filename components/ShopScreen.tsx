import React, { useState } from 'react';
import type { Accessory } from '../types';
import { ACCESSORIES } from '../constants';

interface ShopScreenProps {
  onBack: () => void;
  equippedAccessory: Accessory | null;
  onEquipAccessory: (accessory: Accessory | null) => void;
  onPreview: () => void;
  bioPoints: number;
  unlockedAccessories: string[];
  onPurchase: (accessory: Accessory) => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack, equippedAccessory, onEquipAccessory, onPreview, bioPoints, unlockedAccessories, onPurchase }) => {
  const [previewAccessory, setPreviewAccessory] = useState<Accessory | null>(equippedAccessory ?? ACCESSORIES[0]);

  const handleEquip = () => {
    if (previewAccessory && unlockedAccessories.includes(previewAccessory.id)) {
      onEquipAccessory(previewAccessory);
      onPreview();
    }
  };
  
  const handlePurchase = () => {
    if (previewAccessory) {
      onPurchase(previewAccessory);
    }
  }

  const handlePreview = (acc: Accessory) => {
    setPreviewAccessory(acc);
    onPreview();
  }
  
  const isUnlocked = previewAccessory ? unlockedAccessories.includes(previewAccessory.id) : false;
  const isEquipped = previewAccessory?.id === equippedAccessory?.id;
  const canAfford = previewAccessory ? bioPoints >= previewAccessory.price : false;

  const renderActionButton = () => {
    if (!previewAccessory) return null;

    if (isEquipped) {
      return (
        <button disabled className="bg-gray-600 text-white font-bold py-3 px-8 border-b-4 border-gray-800 rounded-lg text-xl cursor-not-allowed">
            Equipado
        </button>
      );
    }

    if (isUnlocked) {
      return (
         <button onClick={handleEquip} className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-8 border-b-4 border-green-700 hover:border-green-500 rounded-lg text-xl transition-transform transform hover:scale-105">
            Equipar
        </button>
      );
    }
    
    // Not unlocked, so show purchase button
    return (
        <button onClick={handlePurchase} disabled={!canAfford} className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 border-b-4 border-blue-700 hover:border-blue-500 rounded-lg text-xl transition-transform transform hover:scale-105 disabled:bg-gray-600 disabled:border-gray-800 disabled:cursor-not-allowed disabled:transform-none">
            Comprar ({previewAccessory.price} BP)
        </button>
    );

  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-6xl flex justify-between items-center mb-4">
          <h1 className="text-5xl md:text-7xl font-bold text-shadow-lg">Tienda</h1>
          <div className="bg-yellow-500 text-white font-bold py-2 px-5 rounded-lg border-b-4 border-yellow-700 text-2xl">
              {bioPoints} BP
          </div>
      </div>

      <div className="flex w-full max-w-6xl h-[60vh] bg-black bg-opacity-20 rounded-lg p-6">
        {/* Accessory Selection */}
        <div className="w-1/3 pr-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Accesorios</h2>
          <div className="grid grid-cols-2 gap-4">
            {ACCESSORIES.map(acc => {
              const isAccUnlocked = unlockedAccessories.includes(acc.id);
              return (
              <button
                key={acc.id}
                onClick={() => handlePreview(acc)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors relative ${previewAccessory?.id === acc.id ? 'bg-purple-600 border-purple-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
              >
                {!isAccUnlocked && (
                    <div className="absolute top-1 right-1 bg-gray-900 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
                        {acc.price} BP
                    </div>
                )}
                <span className="text-4xl mb-2">{acc.emoji || '🚫'}</span>
                <span className="text-sm text-center">{acc.name}</span>
                {isAccUnlocked && acc.id !== 'none' && (
                    <span className="absolute bottom-1 right-1 text-green-400 text-lg">✓</span>
                )}
              </button>
            )})}
          </div>
        </div>

        {/* Bacteria Preview */}
        <div className="w-2/3 flex flex-col items-center justify-center bg-black bg-opacity-25 rounded-lg">
          <div className="text-[18rem] relative">
            <span>🦠</span>
            {previewAccessory && previewAccessory.id !== 'none' && (
              <span className="absolute text-[9rem]" style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translate(${previewAccessory.offset.x}, ${previewAccessory.offset.y})`
              }}>
                {previewAccessory.emoji}
              </span>
            )}
          </div>
           {renderActionButton()}
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

export default ShopScreen;