import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import { Button } from './ui/button';
import { Navigation, X } from 'lucide-react';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapView: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const userMarker = useRef<L.Marker | null>(null);
  const markersCluster = useRef<L.MarkerClusterGroup | null>(null);
  const [isUserMovingMap, setIsUserMovingMap] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Feria | null>(null);

  // Marca movimientos programáticos (setView/fitBounds) para que los
  // handlers movestart/moveend no los confundan con interacción del usuario.
  const programmaticMoveRef = useRef(false);

  const { filteredFerias, userLocation, favorites, toggleFavorite, isFavorite } = useApp();

  // Función para calcular altura del mapa dinámicamente
  const adjustMapHeight = () => {
    if (!mapContainer.current) return;
    
    const menuHeight = 56; // Altura del menú inferior arreglado
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

  // Colores para diferentes categorías - SOLO MODO CLARO
  const getMarkerColor = (categoria: string, tipo: string): string => {
    const categoryColors: { [key: string]: string } = {
      'Mercados': '#FF5722',
      'Ferias': '#E64A19',
      'Cultura': '#FF9800',
      'Gastronomía': '#43A047',
      'Bares': '#7B1FA2',
      'Actividades': '#00897B',
      'Noche': '#5C6BC0'
    };

    const typeColors: { [key: string]: string } = {
      'Mercado': '#FF5722',
      'Artesanías': '#E64A19',
      'Libros': '#FF9800',
      'Antigüedades': '#FFC107'
    };

    return typeColors[tipo] || categoryColors[categoria] || '#FF5722';
  };

  // Crear icono personalizado mejorado
  const createPointIcon = (color: string, size: number = 32, categoria: string, isSelected: boolean = false) => {
    const iconMap: { [key: string]: string } = {
      'Mercados': '🛒',
      'Ferias': '🎪',
      'Cultura': '🎭',
      'Gastronomía': '🍽️',
      'Bares': '🍺',
      'Actividades': '🎯',
      'Noche': '🌙'
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
      programmaticMoveRef.current = true;
      map.current.setView([userLocation.lat, userLocation.lng], 15, {
        animate: true,
        duration: 0.8
      });
      setIsUserMovingMap(false);
    }
  };

  // Caché de iconos: evita regenerar HTML/divIcon por cada marcador en cada rebuild
  const iconCacheRef = useRef<Map<string, L.DivIcon>>(new Map());
  const getPointIcon = useCallback((color: string, size: number, categoria: string, isSelected: boolean): L.DivIcon => {
    const key = `${color}|${size}|${categoria}|${isSelected}`;
    // NOTA: evitar tokens de exclamación seguidos de nombres de clases custom
    // (el escáner de contenido de Tailwind los interpreta como variantes y
    // genera reglas CSS fantasma a partir de las clases de index.css).
    let cachedIcon = iconCacheRef.current.get(key);
    if (!cachedIcon) {
      cachedIcon = createPointIcon(color, size, categoria, isSelected);
      iconCacheRef.current.set(key, cachedIcon);
    }
    return cachedIcon;
  }, []);

  // Función para crear tarjeta informativa mejorada con favoritos
  const createInfoCard = (point: Feria) => {
    const distanceText = point.distancia 
      ? point.distancia < 1000 
        ? `${Math.round(point.distancia)} m` 
        : `${(point.distancia / 1000).toFixed(1)} km`
      : '';

    const isLiked = isFavorite(point.id);

    return (
      <div className="fixed top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[1100] max-w-sm mx-auto animate-fade-in-up">
        <div className="p-5">
          {/* Header con botón de favorito */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-3">
              <h3 className="text-xl font-bold text-gray-800 leading-tight">{point.nombre}</h3>
              <p className="text-gray-600 text-sm mt-1">{point.direccion}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => toggleFavorite(point.id)}
                className={`p-2 rounded-full transition-all ${
                  isLiked
                    ? 'text-red-500 bg-red-50 hover:bg-red-100'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
              <button
                onClick={() => setSelectedMarker(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Badges */}
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
          
          {/* Información */}
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
          
          {/* Descripción */}
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

  // Inicializar mapa con clustering
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      adjustMapHeight();

      map.current = L.map(mapContainer.current, {
        center: [-34.6037, -58.3816],
        zoom: 12,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map.current);

      // Crear grupo de clusters
      const markerClusterFactory = (
        L as typeof L & {
          markerClusterGroup: (opts?: L.MarkerClusterGroupOptions) => L.MarkerClusterGroup;
        }
      ).markerClusterGroup;
      markersCluster.current = markerClusterFactory({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function(cluster: L.MarkerCluster) {
          const count = cluster.getChildCount();
          let size = 'small';
          let className = 'marker-cluster-small';
          
          if (count > 10) {
            size = 'medium';
            className = 'marker-cluster-medium';
          }
          if (count > 50) {
            size = 'large';
            className = 'marker-cluster-large';
          }
          
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster ${className}`,
            iconSize: L.point(40, 40)
          });
        }
      });

      map.current.addLayer(markersCluster.current);

      // Agregar controles personalizados
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map.current);

      // Distingue paneos del usuario de los programáticos (setView/fitBounds)
      // para no entrar en bucles ni pelear con el usuario.
      map.current.on('movestart', () => {
        if (!programmaticMoveRef.current) {
          setIsUserMovingMap(true);
        }
      });

      map.current.on('moveend', () => {
        if (programmaticMoveRef.current) {
          programmaticMoveRef.current = false;
        }
      });

      map.current.on('click', () => {
        setSelectedMarker(null);
      });

      console.log('Mapa inicializado con clustering');
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
      programmaticMoveRef.current = true;
      map.current.setView([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 0.8
      });
    }
  }, [userLocation, isUserMovingMap]);

  // MOSTRAR TODOS LOS MARCADORES POR DEFECTO
  useEffect(() => {
    if (!map.current || !markersCluster.current) return;

    // Limpiar cluster
    markersCluster.current.clearLayers();

    // MOSTRAR TODOS los marcadores filtrados
    const pointsToShow = filteredFerias;

    // Agregar marcadores al cluster
    pointsToShow.forEach((point: Feria) => {
      const markerColor = getMarkerColor(point.categoria, point.tipo);
      const isSelected = selectedMarker?.id === point.id;
      const markerSize = 32;

      const marker = L.marker([point.lat, point.lng], {
        icon: getPointIcon(markerColor, markerSize, point.categoria, isSelected)
      });

      // Manejar clic en marcador
      marker.on('click', (e) => {
        e.originalEvent.stopPropagation();
        setSelectedMarker(point);

        // Centrar el mapa en el marcador seleccionado
        programmaticMoveRef.current = true;
        map.current!.setView([point.lat, point.lng], Math.max(map.current!.getZoom(), 15), {
          animate: true,
          duration: 0.8
        });
      });

      markersCluster.current!.addLayer(marker);
    });

    // Ajustar vista si no hay marcador seleccionado
    if (pointsToShow.length > 0 && !isUserMovingMap && !selectedMarker) {
      const group = new L.FeatureGroup([markersCluster.current]);
      if (userMarker.current) {
        group.addLayer(userMarker.current);
      }
      try {
        programmaticMoveRef.current = true;
        map.current.fitBounds(group.getBounds().pad(0.1), {
          animate: true,
          duration: 0.8
        });
      } catch (error) {
        console.log('No se pudo ajustar los límites del mapa');
        programmaticMoveRef.current = false;
      }
    }
  }, [filteredFerias, userLocation, isUserMovingMap, selectedMarker, getPointIcon]);

  return (
    <div className="h-full w-full relative">
      {/* Logo Feriando flotante */}
      <div className="app-brand">
        <span className="brand-icon">📍</span>
        <span className="brand-text">Feriando</span>
      </div>

      {/* Contenedor del mapa */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full"
      />

      {/* Tarjeta informativa del marcador seleccionado */}
      {selectedMarker && createInfoCard(selectedMarker)}

      {/* Contador de puntos mejorado */}
      <div className="map-counter">
        <span className="text-sm font-semibold text-gray-700">
          {filteredFerias.length} lugares encontrados
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