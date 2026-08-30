import { useState, useEffect, useRef } from 'react';
import { UserLocation } from '../types';

const MIN_DISTANCE_METERS = 25;

export const useGeolocation = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const lastEmitted = useRef<UserLocation | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setGeoLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        // Throttle: solo propagar si se movió lo suficiente o es la primera
        // fix. Evita recalcular distancias y reconstruir marcadores en cada tick.
        const prev = lastEmitted.current;
        const movedEnough =
          !prev ||
          Math.abs(next.lat - prev.lat) > 1e-5 ||
          Math.abs(next.lng - prev.lng) > 1e-5;

        if (movedEnough) {
          lastEmitted.current = next;
          setLocation(next);
        }

        setError(null);
        setGeoLoading(false);
      },
      (err) => {
        setError(err.message);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, error, loading: geoLoading };
};
