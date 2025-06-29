import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import { Button } from './ui/button';
import { Navigation } from 'lucide-react';
import { getClosestPoints } from '../utils/dataProcessor';

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

  // Colores para diferentes categorías
  const getMarkerColor = (categoria: string, tipo: string): string => {
    const categoryColors: { [key: string]: string } = {
      'Mercados': '#4ECDC4',
      'Ferias': '#FF6B6B',
      'Cultura': '#9B59B6'
    };

    // Colores específicos por tipo dentro de las categorías
    const typeColors: { [key: string]: string } = {
      'Mercado': '#4ECDC4',
      'Artesanías': '#45B7D1',
      'Libros': '#96CEB4',
      'Antigüedades': '#FFEAA7',
      'Teatro': '#9B59B6',
      'Museo': '#8E44AD',
      'Centro Cultural': '#6C5CE7',
      'Bar': '#E17055',
      'Café': '#FDCB6E'
    };

    return typeColors[tipo] || categoryColors[categoria] || '#FF8C00';
  };

  // Crear icono personalizado para puntos con tamaño dinámico y efectos hover
  const createPointIcon = (color: string, size: number = 30, categoria: string) => {
    const iconMap: { [key: string]: string } = {
      'Mercados': '🛒',
      'Ferias': '🎪',
      'Cultura': '🎭'
    };

    const icon = iconMap[categoria] || '📍';

    return L.divIcon({
      className: 'custom-point-marker',
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
          cursor: pointer;
        " onmouseover="this.style.transform='rotate(-45deg) scale(1.2)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.4)';" onmouseout="this.style.transform='rotate(-45deg) scale(1)'; this.style.boxShadow='0 2px 10px rgba(0,0,0,0.3)';">
          <div style="
            transform: rotate(45deg);
            font-size: ${size * 0.4}px;
            color: white;
            font-weight: bold;
          ">${icon}</div>
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

  // Función para obtener los puntos más cercanos (máximo 10)
  const getClosestPointsToShow = (points: Feria[], userLat: number, userLng: number) => {
    return getClosestPoints(points, userLat, userLng, 10);
  };

  // Función para calcular el tamaño del marcador basado en la distancia y zoom
  const getMarkerSize = (point: Feria, isClosest: boolean, zoom: number): number => {
    if (isClosest) {
      return 30; // Tamaño normal para los puntos más cercanos
    }

    // Tamaño base del 20% para los demás
    let baseSize = 6; // 20% de 30px

    // Aumentar tamaño basado en la distancia y zoom
    if (point.distancia && point.distancia < 2000) { // Dentro de 2km
      baseSize = Math.max(baseSize, 12);
    }

    if (point.distancia && point.distancia < 1000) { // Dentro de 1km
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

  // Actualizar marcadores de puntos
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores anteriores
    feriaMarkers.current.forEach(marker => {
      map.current!.removeLayer(marker);
    });
    feriaMarkers.current = [];

    // Si no hay ubicación del usuario, mostrar todos los puntos en tamaño normal
    if (!userLocation) {
      filteredFerias.forEach((point: Feria) => {
        const markerColor = getMarkerColor(point.categoria, point.tipo);

        const marker = L.marker([point.lat, point.lng], {
          icon: createPointIcon(markerColor, 30, point.categoria)
        }).addTo(map.current!);

        // Crear popup
        const popupContent = `
          <div style="padding: 12px; min-width: 200px;">
            <h3 style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${point.nombre}</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 8px;">${point.direccion}</p>
            <div style="margin-bottom: 8px;">
              <span style="
                background: #fed7aa; 
                color: #c2410c; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 12px;
              ">${point.tipo}</span>
              <span style="
                background: #dbeafe; 
                color: #1e40af; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 12px;
                margin-left: 4px;
              ">${point.categoria}</span>
            </div>
            <p style="color: #666; font-size: 12px; margin-bottom: 4px;">
              <strong>Horarios:</strong> ${point.horarios.apertura} - ${point.horarios.cierre}
            </p>
            <p style="color: #666; font-size: 12px; margin-bottom: 4px;">
              <strong>Días:</strong> ${point.diasFuncionamiento.join(', ')}
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);
        feriaMarkers.current.push(marker);
      });

      // Ajustar vista para mostrar todos los puntos
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

    // Obtener los 10 puntos más cercanos
    const closestPoints = getClosestPointsToShow(filteredFerias, userLocation.lat, userLocation.lng);
    const currentZoom = map.current.getZoom();

    // Agregar nuevos marcadores
    filteredFerias.forEach((point: Feria) => {
      const isClosest = closestPoints.some(cp => cp.id === point.id);
      const markerSize = getMarkerSize(point, isClosest, currentZoom);
      const markerColor = getMarkerColor(point.categoria, point.tipo);

      const marker = L.marker([point.lat, point.lng], {
        icon: createPointIcon(markerColor, markerSize, point.categoria)
      }).addTo(map.current!);

      // Crear popup
      const popupContent = `
        <div style="padding: 12px; min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${point.nombre}</h3>
          <p style="color: #666; font-size: 14px; margin-bottom: 8px;">${point.direccion}</p>
          <div style="margin-bottom: 8px;">
            <span style="
              background: #fed7aa; 
              color: #c2410c; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px;
            ">${point.tipo}</span>
            <span style="
              background: #dbeafe; 
              color: #1e40af; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px;
              margin-left: 4px;
            ">${point.categoria}</span>
          </div>
          <p style="color: #666; font-size: 12px; margin-bottom: 4px;">
            <strong>Horarios:</strong> ${point.horarios.apertura} - ${point.horarios.cierre}
          </p>
          <p style="color: #666; font-size: 12px; margin-bottom: 4px;">
            <strong>Días:</strong> ${point.diasFuncionamiento.join(', ')}
          </p>
          ${point.distancia ? `
            <p style="color: #2563eb; font-size: 12px; font-weight: 500;">
              📍 ${point.distancia < 1000 ?
            `${Math.round(point.distancia)} m` :
            `${(point.distancia / 1000).toFixed(1)} km`} de distancia
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
      const closestPoints = getClosestPointsToShow(filteredFerias, userLocation.lat, userLocation.lng);

      feriaMarkers.current.forEach((marker, index) => {
        const point = filteredFerias[index];
        if (point) {
          const isClosest = closestPoints.some(cp => cp.id === point.id);
          const newSize = getMarkerSize(point, isClosest, currentZoom);
          const markerColor = getMarkerColor(point.categoria, point.tipo);

          marker.setIcon(createPointIcon(markerColor, newSize, point.categoria));
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

      {/* Leyenda de colores REMOVED as per user request for less intrusive reference.
          Category info is on markers (icon/color) and in CategoryFilter.
      */}

      {/* Contador de puntos */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 shadow-lg z-[1000]">
        <span className="text-sm font-medium text-gray-700">
          {filteredFerias.length} puntos encontrados
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
