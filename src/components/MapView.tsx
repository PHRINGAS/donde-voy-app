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
  const [currentOpenPopup, setCurrentOpenPopup] = useState<L.Popup | null>(null);

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

  // Función para obtener solo los 10 puntos más cercanos
  const getClosestMarkersToShow = (points: Feria[], userLat: number, userLng: number) => {
    return getClosestPoints(points, userLat, userLng, 10);
  };

  // Función para crear popup persistente (SIMPLIFICADA PARA DEBUGGING)
  const createPersistentPopup = (point: Feria) => {
    const popupContent = `<h3>${point.nombre}</h3><p>Test Pop-up</p><button onclick="this.closest('.leaflet-popup').style.display='none'">Close</button>`;
    return popupContent;
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

      // Manejar clics en el mapa para cerrar popups
      map.current.on('click', () => {
        if (currentOpenPopup) {
          map.current!.closePopup(currentOpenPopup);
          setCurrentOpenPopup(null);
        }
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
  }, [currentOpenPopup]);

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

  // Actualizar marcadores de puntos - Solo mostrar los 10 más cercanos
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores anteriores
    feriaMarkers.current.forEach(marker => {
      map.current!.removeLayer(marker);
    });
    feriaMarkers.current = [];

    let pointsToShow = filteredFerias;

    // Si hay ubicación del usuario, mostrar solo los 10 más cercanos
    if (userLocation && filteredFerias.length > 0) {
      pointsToShow = getClosestMarkersToShow(filteredFerias, userLocation.lat, userLocation.lng);
      console.log(`Mostrando ${pointsToShow.length} marcadores más cercanos de ${filteredFerias.length} total`);
    }

    // Agregar nuevos marcadores
    pointsToShow.forEach((point: Feria) => {
      const markerColor = getMarkerColor(point.categoria, point.tipo);
      const markerSize = 30; // Tamaño estándar para los marcadores más cercanos

      const marker = L.marker([point.lat, point.lng], {
        icon: createPointIcon(markerColor, markerSize, point.categoria)
      }).addTo(map.current!);

      // Crear popup persistente
      const popupContent = createPersistentPopup(point);
      const popup = L.popup({
        closeButton: false, // Deshabilitamos el botón de cierre por defecto
        autoClose: false,   // No cerrar automáticamente
        closeOnClick: false, // No cerrar al hacer clic en el mapa
        closeOnEscapeKey: true // Permitir cerrar con Escape
      }).setContent(popupContent);

      marker.bindPopup(popup);

      // Manejar clic en marcador
      marker.on('click', (e) => {
        e.originalEvent.stopPropagation(); // Prevenir que el clic se propague al mapa
        
        // Cerrar popup anterior si existe
        if (currentOpenPopup && currentOpenPopup !== popup) {
          map.current!.closePopup(currentOpenPopup);
        }
        
        // Abrir nuevo popup
        marker.openPopup();
        setCurrentOpenPopup(popup);
      });

      feriaMarkers.current.push(marker);
    });

    // Ajustar vista para mostrar todos los puntos visibles
    if (pointsToShow.length > 0 && !isUserMovingMap) {
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
  }, [filteredFerias, userLocation, isUserMovingMap, currentOpenPopup]);

  return (
    <div className="h-full relative">
      {/* Contenedor del mapa con altura específica que respeta el menú inferior */}
      <div 
        ref={mapContainer} 
        className="w-full absolute inset-0"
        style={{ 
          height: '100%', // Ocupa toda la altura del contenedor padre relativo
          minHeight: '300px' 
        }} 
      />

      {/* Contador de puntos */}
      <div className="absolute bottom-16 left-3 bg-white bg-opacity-90 rounded-lg px-2.5 py-1.5 shadow-lg z-[1000]">
        <span className="text-xs font-medium text-gray-700">
          {userLocation && filteredFerias.length > 10 
            ? `10 de ${filteredFerias.length} puntos` 
            : `${filteredFerias.length} puntos`}
        </span>
      </div>

      {/* Botón para centrar en usuario */}
      <div className="absolute bottom-16 right-3 z-[1000]">
        <Button
          onClick={centerOnUser}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg h-8 w-8 p-0"
          title="Centrar en mi ubicación"
        >
          <Navigation className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default MapView;