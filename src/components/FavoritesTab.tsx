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
    <div className="h-full overflow-y-auto bg-white">
      {/* Header arreglado - SIN ROSA */}
      <div className="page-header">
        <h1>
          <Heart size={24} className="text-red-500" />
          Mis Favoritas
        </h1>
        <p className="subtitle">
          {favoriteFerias.length} {favoriteFerias.length === 1 ? 'feria guardada' : 'ferias guardadas'}
        </p>
      </div>

      {/* Contenido */}
      <div className="p-4 pb-20">
        {favoriteFerias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">❤️</div>
            <h3 className="empty-state-title">
              No tienes favoritas aún
            </h3>
            <p className="empty-state-description">
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