
import React, { useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { filteredFerias, userLocation } = useApp();

  useEffect(() => {
    // Simulación de mapa - en una implementación real usarías Google Maps, Mapbox, etc.
    if (!mapContainer.current) return;

    // Placeholder para el mapa
    const mapElement = mapContainer.current;
    mapElement.innerHTML = `
      <div class="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center rounded-lg">
        <div class="text-center p-8">
          <div class="text-6xl mb-4">🗺️</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Vista de Mapa</h3>
          <p class="text-gray-600 mb-4">Mostrando ${filteredFerias.length} ferias</p>
          ${userLocation ? `
            <div class="text-sm text-blue-600 mb-2">📍 Tu ubicación detectada</div>
          ` : `
            <div class="text-sm text-orange-600 mb-2">⚠️ Ubicación no disponible</div>
          `}
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
            ${filteredFerias.slice(0, 4).map(feria => `
              <div class="bg-white bg-opacity-70 p-2 rounded">
                📍 ${feria.nombre}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }, [filteredFerias, userLocation]);

  return (
    <div className="h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default MapView;
