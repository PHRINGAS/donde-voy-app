import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import { Button } from './ui/button';
import { Navigation } from 'lucide-react';

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
  const [isUserMovingMap, setIsUserMovingMap] = useState(false);

  const { filteredFerias, userLocation } = useApp();

  // Colores para diferentes tipos de ferias
  const getMarkerColor = (tipo: string): string => {
    const colors: { [key: string]: string } = {
      'Feria Libre': '#FF6B6B',
      'Feria Orgánica': '#4ECDC4',
      'Feria Artesanal': '#45B7D1',
      'Feria Gastronómica': '#96CEB4',
      'Feria Navideña': '#FFEAA7',
      'Mercado': '#4ECDC4',
      'Artesanías': '#45B7D1',
      'Folclore': '#96CEB4',
      'Gastronómico': '#FF6B6B',
      'default': '#FF8C00'
    };
    return colors[tipo] || colors.default;
  };

  // Crear icono personalizado para ferias con tamaño dinámico
  const createFeriaIcon = (color: string, size: number = 30) => {
    return L.divIcon({
      className: 'custom-feria-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: 2px solid #fff;
          transform: rotate(-45deg);
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        ">
          <div style="
            transform: rotate(45deg);
            font-size: ${size * 0.4}px;
            color: white;
            font-weight: bold;
          ">🎪</div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size]
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

  // Función para centrar mapa en la posición del usuario
  const centerOnUser = () => {
    if (map.current && userLocation) {
      map.current.setView([userLocation.lat, userLocation.lng], 14);
      setIsUserMovingMap(false);
    }
  };

  // Función para obtener las 5 ferias más cercanas
  const getClosestFerias = (ferias: Feria[], userLat: number, userLng: number, count: number = 5) => {
    return ferias
      .filter(feria => feria.distancia !== undefined)
      .sort((a, b) => (a.distancia || 0) - (b.distancia || 0))
      .slice(0, count);
  };

  // Función para calcular el tamaño del marcador basado en la distancia y zoom
  const getMarkerSize = (feria: Feria, isClosest: boolean, zoom: number): number => {
    if (isClosest) {
      return 30; // Tamaño normal para las 5 más cercanas
    }

    // Tamaño base del 20% para las demás
    let baseSize = 6; // 20% de 30px

    // Aumentar tamaño basado en la distancia y zoom
    if (feria.distancia && feria.distancia < 2000) { // Dentro de 2km
      baseSize = Math.max(baseSize, 12);
    }

    if (feria.distancia && feria.distancia < 1000) { // Dentro de 1km
      baseSize = Math.max(baseSize, 18);
    }

    // Ajustar por zoom
    if (zoom >= 15) {
      baseSize = Math.min(baseSize * 1.5, 25);
    } else if (zoom >= 13) {
      baseSize = Math.min(baseSize * 1.2, 20);
    }

    return baseSize;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Crear el mapa con OpenStreetMap
      map.current = L.map(mapContainer.current, {
        center: [-34.6037, -58.3816], // Buenos Aires
        zoom: 12,
        zoomControl: true
      });

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      // Detectar cuando el usuario mueve el mapa manualmente
      map.current.on('movestart', () => {
        setIsUserMovingMap(true);
      });

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

    // Solo centrar mapa en ubicación del usuario si no está siendo movido manualmente
    if (!isUserMovingMap) {
      map.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, isUserMovingMap]);

  // Actualizar marcadores de ferias
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores anteriores
    feriaMarkers.current.forEach(marker => {
      map.current!.removeLayer(marker);
    });
    feriaMarkers.current = [];

    // Si no hay ubicación del usuario, mostrar todas las ferias en tamaño normal
    if (!userLocation) {
      filteredFerias.forEach((feria: Feria) => {
        const markerColor = getMarkerColor(feria.tipo);

        const marker = L.marker([feria.lat, feria.lng], {
          icon: createFeriaIcon(markerColor, 30)
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
          </div>
        `;

        marker.bindPopup(popupContent);
        feriaMarkers.current.push(marker);
      });

      // Ajustar vista para mostrar todas las ferias
      if (filteredFerias.length > 0 && !isUserMovingMap) {
        const group = new L.FeatureGroup(feriaMarkers.current);
        try {
          map.current.fitBounds(group.getBounds().pad(0.1));
        } catch (error) {
          console.log('No se pudo ajustar los límites del mapa');
        }
      }
      return;
    }

    // Obtener las 5 ferias más cercanas
    const closestFerias = getClosestFerias(filteredFerias, userLocation.lat, userLocation.lng);
    const currentZoom = map.current.getZoom();

    // Agregar nuevos marcadores
    filteredFerias.forEach((feria: Feria) => {
      const isClosest = closestFerias.some(cf => cf.id === feria.id);
      const markerSize = getMarkerSize(feria, isClosest, currentZoom);
      const markerColor = getMarkerColor(feria.tipo);

      const marker = L.marker([feria.lat, feria.lng], {
        icon: createFeriaIcon(markerColor, markerSize)
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

    // Solo ajustar vista automáticamente si no está siendo movido manualmente
    if (filteredFerias.length > 0 && !isUserMovingMap) {
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
  }, [filteredFerias, userLocation, isUserMovingMap]);

  // Actualizar tamaños de marcadores cuando cambia el zoom
  useEffect(() => {
    if (!map.current || !userLocation) return;

    const updateMarkerSizes = () => {
      const currentZoom = map.current!.getZoom();
      const closestFerias = getClosestFerias(filteredFerias, userLocation.lat, userLocation.lng);

      feriaMarkers.current.forEach((marker, index) => {
        const feria = filteredFerias[index];
        if (feria) {
          const isClosest = closestFerias.some(cf => cf.id === feria.id);
          const newSize = getMarkerSize(feria, isClosest, currentZoom);
          const markerColor = getMarkerColor(feria.tipo);

          marker.setIcon(createFeriaIcon(markerColor, newSize));
        }
      });
    };

    map.current.on('zoomend', updateMarkerSizes);

    return () => {
      if (map.current) {
        map.current.off('zoomend', updateMarkerSizes);
      }
    };
  }, [filteredFerias, userLocation]);

  return (
    <div className="h-full relative">
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />

      {/* Leyenda de colores */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Tipos de Ferias</h4>
        <div className="space-y-1">
          {Object.entries({
            'Mercado': '#4ECDC4',
            'Artesanías': '#45B7D1',
            'Folclore': '#96CEB4',
            'Gastronómico': '#FF6B6B'
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
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>🎯</strong> Las 5 ferias más cercanas se muestran en tamaño completo
          </p>
        </div>
      </div>

      {/* Contador de ferias */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <span className="text-sm font-medium text-gray-700">
          {filteredFerias.length} ferias encontradas
        </span>
      </div>

      {/* Botón para centrar en usuario */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Button
          onClick={centerOnUser}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          title="Centrar en mi ubicación"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default MapView;
