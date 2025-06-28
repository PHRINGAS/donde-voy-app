
import { useState, useEffect, useRef } from 'react';
import { UserLocation } from '../types';
import { toast } from 'sonner';

export const useGeolocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastNotificationTime = useRef<number>(0);
  const locationLostTimeout = useRef<NodeJS.Timeout | null>(null);

  const showLocationNotification = (isFirstTime: boolean = false) => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime.current;
    
    // Mostrar notificación solo si es la primera vez o han pasado más de 5 minutos
    if (isFirstTime || timeSinceLastNotification > 5 * 60 * 1000) {
      toast.success("📍 Ubicación activa - Feriando te mantendrá actualizado", {
        duration: 4000,
        position: 'top-center'
      });
      lastNotificationTime.current = now;
    }
  };

  const handleLocationLost = () => {
    toast.warning("📍 Ubicación perdida - Intentando reconectar...", {
      duration: 3000,
      position: 'top-center'
    });
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setLoading(false);
      return;
    }

    let isFirstLocation = true;

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
        
        // Mostrar notificación de ubicación activa
        showLocationNotification(isFirstLocation);
        isFirstLocation = false;
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
