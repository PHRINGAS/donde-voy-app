import React from 'react';
import { Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import FeriaCard from './FeriaCard';
import { Feria } from '../types';

interface FavoritesTabProps {
  onViewDetails: (feria: Feria) => void;
}

const FavoritesTab: React.FC<FavoritesTabProps> = ({ onViewDetails }) => {
  const { ferias, favorites } = useApp();
  
  const favoriteFerias = ferias.filter(feria => favorites.includes(feria.id));

  return (
    <div className="h-full overflow-y-auto">
      {/* Header de la pestaña */}
      <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white">
        <div className="flex items-center space-x-2">
          <Heart size={24} fill="currentColor" />
          <h2 className="text-xl font-bold">Mis Favoritas</h2>
        </div>
        <p className="text-red-100 text-sm mt-1">
          {favoriteFerias.length} {favoriteFerias.length === 1 ? 'feria guardada' : 'ferias guardadas'}
        </p>
      </div>

      {/* Contenido */}
      <div className="p-4 pb-20">
        {favoriteFerias.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No tienes favoritas aún
            </h3>
            <p className="text-gray-500 text-center max-w-sm mx-auto">
              Marca las ferias que más te gusten tocando el corazón ❤️ para encontrarlas fácilmente aquí
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
  );
};

export default FavoritesTab;