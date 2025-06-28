
import React from 'react';
import { X, Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import FeriaCard from './FeriaCard';
import { Feria } from '../types';

interface FavoritesListProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (feria: Feria) => void;
}

const FavoritesList: React.FC<FavoritesListProps> = ({ 
  isOpen, 
  onClose, 
  onViewDetails 
}) => {
  const { ferias, favorites } = useApp();
  
  const favoriteFerias = ferias.filter(feria => favorites.includes(feria.id));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full max-w-md ml-auto h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart size={24} fill="currentColor" />
              <h2 className="text-xl font-bold">Mis Favoritas</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-400 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-red-100 text-sm mt-1">
            {favoriteFerias.length} ferias guardadas
          </p>
        </div>

        <div className="p-4">
          {favoriteFerias.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No tienes favoritas aún
              </h3>
              <p className="text-gray-500">
                Marca las ferias que más te gusten para encontrarlas fácilmente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteFerias.map(feria => (
                <FeriaCard
                  key={feria.id}
                  feria={feria}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesList;
