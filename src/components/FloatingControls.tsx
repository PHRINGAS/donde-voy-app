import React from 'react';
import { Search, MapPin, Layers } from 'lucide-react';

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
      {/* Brand flotante */}
      <div className="app-brand">
        🤔 Donde Voy?
      </div>

      {/* Búsqueda flotante */}
      <div className="floating-search">
        <input 
          type="text" 
          placeholder="Buscar lugares, direcciones..."
          onClick={onSearchClick}
          readOnly
        />
      </div>

      {/* Controles laterales */}
      <div className="map-controls">
        <button 
          className="control-btn"
          onClick={onLocationClick}
          title="Mi ubicación"
        >
          <MapPin size={20} className="text-orange-500" />
        </button>
        
        <button 
          className="control-btn"
          title="Capas del mapa"
        >
          <Layers size={20} className="text-gray-600" />
        </button>
      </div>
    </>
  );
};

export default FloatingControls;