
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const feriaMarkers = useRef<L.Marker[]>([]);
  
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

  // Crear icono personalizado para ferias
  const createFeriaIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-feria-marker',
      html: `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: 2px solid #fff;
          transform: rotate(-45deg);
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            font-size: 12px;
            color: white;
            font-weight: bold;
          ">🎪</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });
  };

  // Crear icono personalizado para usuario
  const createUserIcon = () => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #007cbf;
          border: 3px solid #fff;
          box-shadow: 0 0 10px rgba(0,123,191,0.5);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Crear el mapa con OpenStreetMap
      map.current = L.map(mapContainer.current, {
        center: [-33.4489, -70.6693],
        zoom: 12,
        zoomControl: true
      });

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      console.log('Mapa inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Actualizar ubicación del usuario
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Remover marcador anterior del usuario
    if (userMarker.current) {
      map.current.removeLayer(userMarker.current);
    }

    // Crear nuevo marcador del usuario
    userMarker.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserIcon()
    }).addTo(map.current);

    // Centrar mapa en ubicación del usuario
    map.current.setView([userLocation.lat, userLocation.lng], 14);
  }, [userLocation]);

  // Actualizar marcadores de ferias
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores anteriores
    feriaMarkers.current.forEach(marker => {
      map.current!.removeLayer(marker);
    });
    feriaMarkers.current = [];

    // Agregar nuevos marcadores
    filteredFerias.forEach((feria: Feria) => {
      const markerColor = getMarkerColor(feria.tipo);
      
      const marker = L.marker([feria.lat, feria.lng], {
        icon: createFeriaIcon(markerColor)
      }).addTo(map.current!);

      // Crear popup
      const popupContent = `
        <div style="padding: 12px; min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${feria.nombre}</h3>
          <p style="color: #666; font-size: 14px; margin-bottom: 8px;">${feria.direccion}</p>
          <div style="margin-bottom: 8px;">
            <span style="
              background: #fed7aa; 
              color: #c2410c; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px;
            ">${feria.tipo}</span>
          </div>
          <p style="color: #666; font-size: 12px; margin-bottom: 4px;">
            <strong>Horarios:</strong> ${feria.horarios.apertura} - ${feria.horarios.cierre}
          </p>
          <p style="color: #666; font-size: 12px; margin-bottom: 4px;">
            <strong>Días:</strong> ${feria.diasFuncionamiento.join(', ')}
          </p>
          ${feria.distancia ? `
            <p style="color: #2563eb; font-size: 12px; font-weight: 500;">
              📍 ${feria.distancia < 1000 ? 
                `${Math.round(feria.distancia)} m` : 
                `${(feria.distancia / 1000).toFixed(1)} km`} de distancia
            </p>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      feriaMarkers.current.push(marker);
    });

    // Ajustar vista para mostrar todas las ferias
    if (filteredFerias.length > 0) {
      const group = new L.FeatureGroup(feriaMarkers.current);
      if (userMarker.current) {
        group.addLayer(userMarker.current);
      }
      try {
        map.current.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.log('No se pudo ajustar los límites del mapa');
      }
    }
  }, [filteredFerias]);

  return (
    <div className="h-full relative">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />
      
      {/* Leyenda de colores */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs z-[1000]">
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
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <span className="text-sm font-medium text-gray-700">
          {filteredFerias.length} ferias encontradas
        </span>
      </div>
    </div>
  );
};

export default MapView;
