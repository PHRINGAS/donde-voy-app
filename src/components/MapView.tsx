import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import { Button } from './ui/button';
import { Navigation, X } from 'lucide-react';
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
  const [selectedMarker, setSelectedMarker] = useState<Feria | null>(null);

  const { filteredFerias, userLocation } = useApp();

  // Función para calcular altura del mapa dinámicamente
  const adjustMapHeight = () => {
    if (!mapContainer.current) return;
    
    const headerHeight = 56; // Altura del header compactado
    const menuHeight = 56; // Altura del menú inferior
    const windowHeight = window.innerHeight;
    
    const mapHeight = windowHeight - headerHeight - menuHeight;
    mapContainer.current.style.height = `${mapHeight}px`;
    
    // Invalidar el tamaño del mapa
    if (map.current) {
      setTimeout(() => {
        map.current!.invalidateSize();
      }, 100);
    }
  };

  // Colores para diferentes categorías
  const getMarkerColor = (categoria: string, tipo: string): string => {
    const categoryColors: { [key: string]: string } = {
      'Mercados': '#4ECDC4',
      'Ferias': '#FF6B6B',
      'Cultura': '#9B59B6'
    };

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

  // Crear icono personalizado para puntos
  const createPointIcon = (color: string, size: number = 30, categoria: string, isSelected: boolean = false) => {
    const iconMap: { [key: string]: string } = {
      'Mercados': '🛒',
      'Ferias': '🎪',
      'Cultura': '🎭'
    };

    const icon = iconMap[categoria] || '📍';
    const selectedScale = isSelected ? 1.3 : 1;
    const selectedShadow = isSelected ? '0 6px 25px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.3)';

    return L.divIcon({
      className: 'custom-point-marker',
      html: `
        <div style="
          width: ${size * selectedScale}px;
          height: ${size * selectedScale}px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: ${isSelected ? '3px' : '2px'} solid #fff;
          transform: rotate(-45deg);
          box-shadow: ${selectedShadow};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          cursor: pointer;
          z-index: ${isSelected ? 1000 : 100};
        ">
          <div style="
            transform: rotate(45deg);
            font-size: ${size * selectedScale * 0.4}px;
            color: white;
            font-weight: bold;
          ">${icon}</div>
        </div>
      `,
      iconSize: [size * selectedScale, size * selectedScale],
      iconAnchor: [size * selectedScale / 2, size * selectedScale],
      popupAnchor: [0, -size * selectedScale]
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
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0,123,191,0.7); }
            70% { box-shadow: 0 0 0 10px rgba(0,123,191,0); }
            100% { box-shadow: 0 0 0 0 rgba(0,123,191,0); }
          }
        </style>
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

  // Función para crear tarjeta informativa
  const createInfoCard = (point: Feria) => {
    const distanceText = point.distancia 
      ? point.distancia < 1000 
        ? `${Math.round(point.distancia)} m` 
        : `${(point.distancia / 1000).toFixed(1)} km`
      : '';

    return (
      <div className="fixed top-20 left-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 z-[1100] max-w-sm mx-auto">
        <div className="p-4">
          {/* Header con botón cerrar */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold text-gray-800 pr-2">{point.nombre}</h3>
            <button
              onClick={() => setSelectedMarker(null)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          
          {/* Dirección */}
          <p className="text-gray-600 text-sm mb-3">{point.direccion}</p>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
              {point.tipo}
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              {point.categoria}
            </span>
            {distanceText && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                📍 {distanceText}
              </span>
            )}
          </div>
          
          {/* Información básica */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-600">
              <span className="font-medium mr-2">🕒 Horarios:</span>
              <span>{point.horarios.apertura} - {point.horarios.cierre}</span>
            </div>
            
            <div className="flex items-start text-gray-600">
              <span className="font-medium mr-2">📅 Días:</span>
              <span className="flex-1">{point.diasFuncionamiento.join(', ')}</span>
            </div>
            
            {point.productos && point.productos.length > 0 && (
              <div className="flex items-start text-gray-600">
                <span className="font-medium mr-2">🛍️ Productos:</span>
                <span className="flex-1">{point.productos.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
          
          {/* Descripción */}
          {point.descripcion && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 leading-relaxed">{point.descripcion}</p>
            </div>
          )}
          
          {/* Información adicional */}
          {(point.barrio || point.comuna) && (
            <div className="mt-2 text-xs text-gray-400">
              {point.barrio && <span>{point.barrio}</span>}
              {point.barrio && point.comuna && <span> • </span>}
              {point.comuna && <span>{point.comuna}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Ajustar altura inicial
      adjustMapHeight();

      map.current = L.map(mapContainer.current, {
        center: [-34.6037, -58.3816],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.current);

      map.current.on('movestart', () => {
        setIsUserMovingMap(true);
      });

      // Cerrar tarjeta al hacer clic en el mapa
      map.current.on('click', () => {
        setSelectedMarker(null);
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

  // Escuchar eventos de cambio de tamaño y activación de pestaña
  useEffect(() => {
    const handleResize = () => {
      adjustMapHeight();
    };

    const handleMapTabActivated = () => {
      adjustMapHeight();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mapTabActivated', handleMapTabActivated);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mapTabActivated', handleMapTabActivated);
    };
  }, []);

  // Actualizar ubicación del usuario
  useEffect(() => {
    if (!map.current || !userLocation) return;

    if (userMarker.current) {
      map.current.removeLayer(userMarker.current);
    }

    userMarker.current = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserIcon()
    }).addTo(map.current);

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

    let pointsToShow = filteredFerias;

    // Si hay ubicación del usuario, mostrar solo los 10 más cercanos
    if (userLocation && filteredFerias.length > 0) {
      pointsToShow = getClosestMarkersToShow(filteredFerias, userLocation.lat, userLocation.lng);
      console.log(`Mostrando ${pointsToShow.length} marcadores más cercanos de ${filteredFerias.length} total`);
    }

    // Agregar nuevos marcadores
    pointsToShow.forEach((point: Feria) => {
      const markerColor = getMarkerColor(point.categoria, point.tipo);
      const isSelected = selectedMarker?.id === point.id;
      const markerSize = 30;

      const marker = L.marker([point.lat, point.lng], {
        icon: createPointIcon(markerColor, markerSize, point.categoria, isSelected)
      }).addTo(map.current!);

      // Manejar clic en marcador
      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        setSelectedMarker(point);
        
        // Centrar el mapa en el marcador seleccionado
        map.current!.setView([point.lat, point.lng], Math.max(map.current!.getZoom(), 15), {
          animate: true,
          duration: 0.5
        });
      });

      feriaMarkers.current.push(marker);
    });

    // Ajustar vista para mostrar todos los puntos visibles
    if (pointsToShow.length > 0 && !isUserMovingMap && !selectedMarker) {
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
  }, [filteredFerias, userLocation, isUserMovingMap, selectedMarker]);

  return (
    <div className="h-full w-full relative">
      {/* Contenedor del mapa */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
      />

      {/* Tarjeta informativa del marcador seleccionado */}
      {selectedMarker && createInfoCard(selectedMarker)}

      {/* Contador de puntos */}
      <div className="absolute bottom-4 left-3 bg-white bg-opacity-90 rounded-lg px-2.5 py-1.5 shadow-lg z-[1000]">
        <span className="text-xs font-medium text-gray-700">
          {userLocation && filteredFerias.length > 10 
            ? `10 de ${filteredFerias.length} puntos` 
            : `${filteredFerias.length} puntos`}
        </span>
      </div>

      {/* Botón para centrar en usuario */}
      <div className="absolute bottom-4 right-3 z-[1000]">
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