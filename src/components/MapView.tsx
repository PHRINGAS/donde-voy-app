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
    
    const menuHeight = 65; // Altura del menú inferior elegante
    const windowHeight = window.innerHeight;
    
    const mapHeight = windowHeight - menuHeight;
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
      'Mercados': '#FF5722',    // Naranja vibrante
      'Ferias': '#E64A19',      // Naranja oscuro
      'Cultura': '#00BCD4'      // Cyan
    };

    const typeColors: { [key: string]: string } = {
      'Mercado': '#FF5722',
      'Artesanías': '#E64A19',
      'Libros': '#00BCD4',
      'Antigüedades': '#FFC107',
      'Teatro': '#9C27B0',
      'Museo': '#673AB7',
      'Centro Cultural': '#3F51B5',
      'Bar': '#FF9800',
      'Café': '#FF5722'
    };

    return typeColors[tipo] || categoryColors[categoria] || '#FF5722';
  };

  // Crear icono personalizado mejorado
  const createPointIcon = (color: string, size: number = 30, categoria: string, isSelected: boolean = false) => {
    const iconMap: { [key: string]: string } = {
      'Mercados': '🛒',
      'Ferias': '🎪',
      'Cultura': '🎭'
    };

    const icon = iconMap[categoria] || '📍';
    const selectedScale = isSelected ? 1.3 : 1;
    const selectedShadow = isSelected ? '0 8px 25px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.2)';

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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          z-index: ${isSelected ? 1000 : 100};
        ">
          <div style="
            transform: rotate(45deg);
            font-size: ${size * selectedScale * 0.4}px;
            color: white;
            font-weight: bold;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          ">${icon}</div>
        </div>
      `,
      iconSize: [size * selectedScale, size * selectedScale],
      iconAnchor: [size * selectedScale / 2, size * selectedScale],
      popupAnchor: [0, -size * selectedScale]
    });
  };

  // Crear icono personalizado para usuario con animación
  const createUserIcon = () => {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FF5722;
          border: 3px solid #fff;
          box-shadow: 0 0 15px rgba(255,87,34,0.6);
          position: relative;
        ">
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: #FF5722;
            animation: pulse-location 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse-location {
            0% { 
              transform: scale(1);
              opacity: 1;
            }
            50% { 
              transform: scale(1.8);
              opacity: 0.3;
            }
            100% { 
              transform: scale(2.5);
              opacity: 0;
            }
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
      map.current.setView([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 0.8
      });
      setIsUserMovingMap(false);
    }
  };

  // Función para obtener solo los 10 puntos más cercanos
  const getClosestMarkersToShow = (points: Feria[], userLat: number, userLng: number) => {
    return getClosestPoints(points, userLat, userLng, 10);
  };

  // Función para crear tarjeta informativa mejorada
  const createInfoCard = (point: Feria) => {
    const distanceText = point.distancia 
      ? point.distancia < 1000 
        ? `${Math.round(point.distancia)} m` 
        : `${(point.distancia / 1000).toFixed(1)} km`
      : '';

    return (
      <div className="fixed top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1100] max-w-sm mx-auto glass-effect animate-fade-in-up">
        <div className="p-5">
          {/* Header con gradiente */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-3">
              <h3 className="text-xl font-bold text-gray-800 leading-tight">{point.nombre}</h3>
              <p className="text-gray-600 text-sm mt-1">{point.direccion}</p>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          
          {/* Badges mejorados */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
              {point.tipo}
            </span>
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
              {point.categoria}
            </span>
            {distanceText && (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                📍 {distanceText}
              </span>
            )}
          </div>
          
          {/* Información con iconos mejorados */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center text-gray-700">
              <span className="text-lg mr-3">🕒</span>
              <div>
                <span className="font-semibold">Horarios:</span>
                <span className="ml-2">{point.horarios.apertura} - {point.horarios.cierre}</span>
              </div>
            </div>
            
            <div className="flex items-start text-gray-700">
              <span className="text-lg mr-3 mt-0.5">📅</span>
              <div>
                <span className="font-semibold">Días:</span>
                <span className="ml-2 block">{point.diasFuncionamiento.join(', ')}</span>
              </div>
            </div>
            
            {point.productos && point.productos.length > 0 && (
              <div className="flex items-start text-gray-700">
                <span className="text-lg mr-3 mt-0.5">🛍️</span>
                <div>
                  <span className="font-semibold">Productos:</span>
                  <span className="ml-2 block">{point.productos.slice(0, 3).join(', ')}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Descripción con estilo mejorado */}
          {point.descripcion && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                {point.descripcion}
              </p>
            </div>
          )}
          
          {/* Información adicional */}
          {(point.barrio || point.comuna) && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>
                {point.barrio && <span>{point.barrio}</span>}
                {point.barrio && point.comuna && <span> • </span>}
                {point.comuna && <span>{point.comuna}</span>}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Inicializar mapa con estilo mejorado
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      adjustMapHeight();

      map.current = L.map(mapContainer.current, {
        center: [-34.6037, -58.3816],
        zoom: 12,
        zoomControl: false // Removemos controles default
      });

      // Usar estilo de mapa más moderno (CartoDB Voyager)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '©OpenStreetMap, ©CartoDB',
        maxZoom: 19
      }).addTo(map.current);

      // Agregar controles personalizados
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map.current);

      map.current.on('movestart', () => {
        setIsUserMovingMap(true);
      });

      map.current.on('click', () => {
        setSelectedMarker(null);
      });

      console.log('Mapa inicializado con estilo moderno');
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

  // Escuchar eventos de cambio de tamaño
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
      map.current.setView([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 0.8
      });
    }
  }, [userLocation, isUserMovingMap]);

  // Actualizar marcadores con animaciones
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
    }

    // Agregar nuevos marcadores con animación
    pointsToShow.forEach((point: Feria, index) => {
      const markerColor = getMarkerColor(point.categoria, point.tipo);
      const isSelected = selectedMarker?.id === point.id;
      const markerSize = 32; // Tamaño ligeramente mayor

      const marker = L.marker([point.lat, point.lng], {
        icon: createPointIcon(markerColor, markerSize, point.categoria, isSelected)
      });

      // Animación de entrada escalonada
      setTimeout(() => {
        marker.addTo(map.current!);
      }, index * 50);

      // Manejar clic en marcador
      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        setSelectedMarker(point);
        
        // Centrar el mapa en el marcador seleccionado con animación suave
        map.current!.setView([point.lat, point.lng], Math.max(map.current!.getZoom(), 15), {
          animate: true,
          duration: 0.8
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
        map.current.fitBounds(group.getBounds().pad(0.1), {
          animate: true,
          duration: 0.8
        });
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

      {/* Contador de puntos mejorado */}
      <div className="absolute bottom-20 left-4 bg-white bg-opacity-95 rounded-xl px-3 py-2 shadow-lg z-[1000] glass-effect">
        <span className="text-sm font-semibold text-gray-700">
          {userLocation && filteredFerias.length > 10 
            ? `10 de ${filteredFerias.length} lugares` 
            : `${filteredFerias.length} lugares`}
        </span>
      </div>

      {/* Botón para centrar en usuario mejorado */}
      <div className="absolute bottom-20 right-4 z-[1000]">
        <Button
          onClick={centerOnUser}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg h-12 w-12 p-0 rounded-full transition-all hover:scale-105 active:scale-95"
          title="Centrar en mi ubicación"
        >
          <Navigation className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MapView;