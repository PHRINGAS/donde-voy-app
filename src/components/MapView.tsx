
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const feriaMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  
  const { filteredFerias, userLocation } = useApp();

  // Colores para diferentes tipos de ferias
  const getMarkerColor = (tipo: string): string => {
    const colors: { [key: string]: string } = {
      'Feria Libre': '#FF6B6B',
      'Feria Orgánica': '#4ECDC4',
      'Feria Artesanal': '#45B7D1',
      'Feria Gastronómica': '#96CEB4',
      'Feria Navideña': '#FFEAA7',
      'default': '#FF8C00'
    };
    return colors[tipo] || colors.default;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-70.6693, -33.4489], // Santiago, Chile por defecto
      zoom: 12,
      pitch: 0,
      bearing: 0
    });

    // Agregar controles de navegación
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Agregar control de geolocalización
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Actualizar ubicación del usuario
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Remover marcador anterior del usuario
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Crear nuevo marcador del usuario
    const userMarkerElement = document.createElement('div');
    userMarkerElement.className = 'user-marker';
    userMarkerElement.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #007cbf;
      border: 3px solid #fff;
      box-shadow: 0 0 10px rgba(0,123,191,0.5);
      cursor: pointer;
    `;

    userMarker.current = new mapboxgl.Marker({
      element: userMarkerElement,
      anchor: 'center'
    })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);

    // Centrar mapa en ubicación del usuario
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
      duration: 2000
    });
  }, [userLocation]);

  // Actualizar marcadores de ferias
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores anteriores
    feriaMarkers.current.forEach(marker => marker.remove());
    feriaMarkers.current = [];

    // Agregar nuevos marcadores
    filteredFerias.forEach((feria: Feria) => {
      const markerColor = getMarkerColor(feria.tipo);
      
      // Crear elemento del marcador
      const markerElement = document.createElement('div');
      markerElement.className = 'feria-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: ${markerColor};
        border: 2px solid #fff;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        position: relative;
      `;

      // Agregar icono interno
      const iconElement = document.createElement('div');
      iconElement.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        font-size: 12px;
        color: white;
        font-weight: bold;
      `;
      iconElement.textContent = '🎪';
      markerElement.appendChild(iconElement);

      // Crear popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-semibold text-lg mb-2">${feria.nombre}</h3>
          <p class="text-sm text-gray-600 mb-2">${feria.direccion}</p>
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              ${feria.tipo}
            </span>
          </div>
          <p class="text-xs text-gray-500 mb-2">
            <strong>Horarios:</strong> ${feria.horarios.apertura} - ${feria.horarios.cierre}
          </p>
          <p class="text-xs text-gray-500 mb-2">
            <strong>Días:</strong> ${feria.diasFuncionamiento.join(', ')}
          </p>
          ${feria.distancia ? `
            <p class="text-xs text-blue-600 font-medium">
              📍 ${feria.distancia < 1000 ? 
                `${Math.round(feria.distancia)} m` : 
                `${(feria.distancia / 1000).toFixed(1)} km`} de distancia
            </p>
          ` : ''}
        </div>
      `);

      // Crear marcador
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'bottom'
      })
        .setLngLat([feria.lng, feria.lat])
        .setPopup(popup)
        .addTo(map.current!);

      feriaMarkers.current.push(marker);
    });

    // Ajustar vista para mostrar todas las ferias
    if (filteredFerias.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      filteredFerias.forEach(feria => {
        bounds.extend([feria.lng, feria.lat]);
      });
      
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat]);
      }

      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 16
      });
    }
  }, [filteredFerias]);

  if (showTokenInput) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Configurar Mapa
            </h3>
            <p className="text-gray-600 text-sm">
              Ingresa tu token público de Mapbox para activar el mapa interactivo.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token de Mapbox
              </label>
              <input
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1IjoibXl1c2VybmFtZSIsImEiOiJja..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowTokenInput(false)}
              disabled={!mapboxToken.trim()}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Activar Mapa
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Obtén tu token gratuito en{' '}
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Leyenda de colores */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs">
        <h4 className="font-semibold text-sm mb-2">Tipos de Ferias</h4>
        <div className="space-y-1">
          {Object.entries({
            'Feria Libre': '#FF6B6B',
            'Feria Orgánica': '#4ECDC4',
            'Feria Artesanal': '#45B7D1',
            'Feria Gastronómica': '#96CEB4'
          }).map(([tipo, color]) => (
            <div key={tipo} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-700">{tipo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contador de ferias */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm font-medium text-gray-700">
          {filteredFerias.length} ferias encontradas
        </span>
      </div>
    </div>
  );
};

export default MapView;
