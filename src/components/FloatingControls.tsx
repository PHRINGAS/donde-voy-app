import React from 'react';
import { Search, MapPin } from 'lucide-react';

interface FloatingControlsProps {
  onSearchClick: () => void;
  onLocationClick: () => void;
}

const FloatingControls: React.FC<FloatingControlsProps> = ({
  onSearchClick,
  onLocationClick
}) => {
  return (
    <>
      {/* Búsqueda flotante con placeholder actualizado */}
      <div className="floating-search">
        <input 
          type="text" 
          placeholder="¿Dónde voy?"
          onClick={onSearchClick}
          readOnly
        />
      </div>

      {/* Controles laterales - SIN BOTÓN DE CAPAS */}
      <div className="map-controls">
        <button 
          className="control-btn"
          onClick={onLocationClick}
          title="Mi ubicación"
        >
          <MapPin size={20} className="text-orange-500" />
        </button>
      </div>
    </>
  );
};

export default FloatingControls;