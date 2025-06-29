import { useState, useEffect, useRef } from 'react';
import { UserLocation } from '../types';
import { toast } from 'sonner';

export const useGeolocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastNotificationTime = useRef<number>(0);
  const locationLostTimeout = useRef<NodeJS.Timeout | null>(null);

  // ELIMINA "UBICACIÓN ACTIVA" Y MEJORA NOTIFICACIONES
  const showLocationUpdate = () => {
    // Solo mostrar cuando se actualiza manualmente
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime.current;
    
    // Mostrar notificación solo si han pasado más de 5 minutos
    if (timeSinceLastNotification > 5 * 60 * 1000) {
      showNotification('📍 Ubicación actualizada', 2000);
      lastNotificationTime.current = now;
    }
  };

  const handleLocationLost = () => {
    showNotification('📍 Ubicación perdida - Intentando reconectar...', 3000);
  };

  // Función mejorada de notificaciones
  const showNotification = (message: string, duration: number = 3000) => {
    const notification = document.createElement('div');
    notification.className = 'location-notification';
    notification.innerHTML = `<span>${message}</span>`;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remover después de duration
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setError(null);
        setLoading(false);
        
        // Limpiar timeout de ubicación perdida si existe
        if (locationLostTimeout.current) {
          clearTimeout(locationLostTimeout.current);
          locationLostTimeout.current = null;
        }
        
        // NO mostrar notificación automática de "ubicación activa"
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        
        // Configurar timeout para detectar cuando se pierde la ubicación por más de 1 minuto
        if (!locationLostTimeout.current) {
          locationLostTimeout.current = setTimeout(() => {
            handleLocationLost();
            locationLostTimeout.current = null;
          }, 60000); // 1 minuto
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (locationLostTimeout.current) {
        clearTimeout(locationLostTimeout.current);
      }
    };
  }, []);

  return { location, error, loading };
};