
import React from 'react';
import type { Friend } from '../types';

interface FriendsScreenProps {
  onBack: () => void;
  friends: Friend[];
  onJoinFriend: (friend: Friend) => void;
  onRemoveFriend: (friendId: string) => void;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ onBack, friends, onJoinFriend, onRemoveFriend }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h1 className="text-5xl md:text-7xl font-bold mb-8 text-shadow-lg">Amigos</h1>
      
      <div className="w-full max-w-4xl h-[60vh] bg-black bg-opacity-30 rounded-lg p-6 overflow-y-auto">
        {friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-6xl mb-4">👥</span>
                <p className="text-2xl">Aún no tienes amigos.</p>
                <p className="mt-2">Toca el nombre de una bacteria en la clasificación mientras juegas para añadirla.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-4">
                {friends.map((friend) => (
                    <div key={friend.id} className="bg-gray-800 bg-opacity-80 p-4 rounded-lg flex justify-between items-center border border-gray-600">
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-white">
                                🦠
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-green-400">{friend.name}</h3>
                                <p className="text-sm text-gray-300">Visto en: {friend.serverName}</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                             {/* Play button removed as requested */}
                             <button 
                                onClick={() => onRemoveFriend(friend.id)}
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg border-b-4 border-red-800"
                             >
                                ✕
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
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

export default FriendsScreen;
