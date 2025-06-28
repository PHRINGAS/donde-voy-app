import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feria, SearchFilters, UserLocation } from '../types';
import { feriasData, getAllFerias } from '../data/feriasData';
import { feriasService } from '../integrations/supabase/feriasService';
import { calculateDistance } from '../utils/distanceCalculator';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface AppContextType {
  ferias: Feria[];
  filteredFerias: Feria[];
  userLocation: UserLocation | null;
  favorites: string[];
  searchFilters: SearchFilters;
  loading: boolean;
  setSearchFilters: (filters: SearchFilters) => void;
  setUserLocation: (location: UserLocation | null) => void;
  toggleFavorite: (feriaId: string) => void;
  isFavorite: (feriaId: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ferias, setFerias] = useState<Feria[]>(feriasData);
  const [filteredFerias, setFilteredFerias] = useState<Feria[]>(feriasData);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);

  // Usar localStorage para persistir favoritos
  const [favorites, setFavorites] = useLocalStorage<string[]>('feriando-favorites', []);

  // Cargar datos de ferias al inicializar
  useEffect(() => {
    const loadFerias = async () => {
      try {
        setLoading(true);

        // Intentar cargar desde Supabase primero
        let allFerias: Feria[] = [];

        try {
          console.log('🔄 Intentando cargar ferias desde Supabase...');
          allFerias = await feriasService.getAllFerias();

          if (allFerias.length > 0) {
            console.log(`✅ Se cargaron ${allFerias.length} ferias desde Supabase`);
          } else {
            throw new Error('No hay datos en Supabase');
          }
        } catch (supabaseError) {
          console.log('⚠️  No se pudieron cargar datos desde Supabase, usando datos locales...');
          console.error('Error Supabase:', supabaseError);

          // Fallback a datos locales (muestra + GeoJSON)
          allFerias = await getAllFerias();
          console.log(`✅ Se cargaron ${allFerias.length} ferias desde datos locales`);
        }

        setFerias(allFerias);
        setFilteredFerias(allFerias);

      } catch (error) {
        console.error('❌ Error cargando ferias:', error);
        // Fallback final a datos de muestra
        setFerias(feriasData);
        setFilteredFerias(feriasData);
      } finally {
        setLoading(false);
      }
    };

    loadFerias();
  }, []);

  // Actualizar distancias cuando cambia la ubicación del usuario
  useEffect(() => {
    if (userLocation) {
      const feriasWithDistance = ferias.map(feria => ({
        ...feria,
        distancia: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          feria.lat,
          feria.lng
        )
      }));
      setFerias(feriasWithDistance);
    }
  }, [userLocation]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...ferias];

    if (searchFilters.tipo) {
      filtered = filtered.filter(feria =>
        feria.tipo.toLowerCase().includes(searchFilters.tipo!.toLowerCase())
      );
    }

    if (searchFilters.dia) {
      filtered = filtered.filter(feria =>
        feria.diasFuncionamiento.includes(searchFilters.dia!)
      );
    }

    if (searchFilters.direccion) {
      filtered = filtered.filter(feria =>
        feria.nombre.toLowerCase().includes(searchFilters.direccion!.toLowerCase()) ||
        feria.direccion.toLowerCase().includes(searchFilters.direccion!.toLowerCase())
      );
    }

    if (searchFilters.productos && searchFilters.productos.length > 0) {
      filtered = filtered.filter(feria =>
        searchFilters.productos!.some(producto =>
          feria.productos.some(feriaProducto =>
            feriaProducto.toLowerCase().includes(producto.toLowerCase())
          )
        )
      );
    }

    // Ordenar por distancia si está disponible
    if (userLocation) {
      filtered.sort((a, b) => (a.distancia || 0) - (b.distancia || 0));
    }

    setFilteredFerias(filtered);
  }, [searchFilters, ferias, userLocation]);

  const toggleFavorite = (feriaId: string) => {
    setFavorites(prev =>
      prev.includes(feriaId)
        ? prev.filter(id => id !== feriaId)
        : [...prev, feriaId]
    );
  };

  const isFavorite = (feriaId: string) => favorites.includes(feriaId);

  return (
    <AppContext.Provider value={{
      ferias,
      filteredFerias,
      userLocation,
      favorites,
      searchFilters,
      loading,
      setSearchFilters,
      setUserLocation,
      toggleFavorite,
      isFavorite
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
