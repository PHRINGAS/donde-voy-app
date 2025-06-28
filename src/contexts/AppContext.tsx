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

    // Filtro por tipo de feria
    if (searchFilters.tipo) {
      filtered = filtered.filter(feria =>
        feria.tipo.toLowerCase().includes(searchFilters.tipo!.toLowerCase())
      );
    }

    // Filtro por día de funcionamiento
    if (searchFilters.dia) {
      filtered = filtered.filter(feria =>
        feria.diasFuncionamiento.includes(searchFilters.dia!)
      );
    }

    // Filtro por dirección o nombre
    if (searchFilters.direccion) {
      filtered = filtered.filter(feria =>
        feria.nombre.toLowerCase().includes(searchFilters.direccion!.toLowerCase()) ||
        feria.direccion.toLowerCase().includes(searchFilters.direccion!.toLowerCase()) ||
        (feria.barrio && feria.barrio.toLowerCase().includes(searchFilters.direccion!.toLowerCase())) ||
        (feria.comuna && feria.comuna.toLowerCase().includes(searchFilters.direccion!.toLowerCase()))
      );
    }

    // Filtro por productos
    if (searchFilters.productos && searchFilters.productos.length > 0) {
      filtered = filtered.filter(feria =>
        searchFilters.productos!.some(producto =>
          feria.productos.some(feriaProducto =>
            feriaProducto.toLowerCase().includes(producto.toLowerCase())
          )
        )
      );
    }

    // Filtro por barrio
    if (searchFilters.barrio && searchFilters.barrio.length > 0) {
      filtered = filtered.filter(feria =>
        feria.barrio && searchFilters.barrio!.some(barrio =>
          feria.barrio!.toLowerCase().includes(barrio.toLowerCase())
        )
      );
    }

    // Filtro por comuna
    if (searchFilters.comuna && searchFilters.comuna.length > 0) {
      filtered = filtered.filter(feria =>
        feria.comuna && searchFilters.comuna!.some(comuna =>
          feria.comuna!.toLowerCase().includes(comuna.toLowerCase())
        )
      );
    }

    // Filtro por etiquetas
    if (searchFilters.etiquetas && searchFilters.etiquetas.length > 0) {
      filtered = filtered.filter(feria =>
        searchFilters.etiquetas!.some(etiqueta =>
          feria.etiquetas.some(feriaEtiqueta =>
            feriaEtiqueta.toLowerCase().includes(etiqueta.toLowerCase())
          )
        )
      );
    }

    // Filtro por tipo de horario
    if (searchFilters.horarioTipo) {
      filtered = filtered.filter(feria =>
        feria.horarioTipo === searchFilters.horarioTipo
      );
    }

    // Filtro por especialidades
    if (searchFilters.especialidad && searchFilters.especialidad.length > 0) {
      filtered = filtered.filter(feria =>
        searchFilters.especialidad!.some(especialidad =>
          feria.especialidad.some(feriaEspecialidad =>
            feriaEspecialidad.toLowerCase().includes(especialidad.toLowerCase())
          )
        )
      );
    }

    // Filtro por servicios
    if (searchFilters.servicios && searchFilters.servicios.length > 0) {
      filtered = filtered.filter(feria =>
        searchFilters.servicios!.some(servicio =>
          feria.servicios.some(feriaServicio =>
            feriaServicio.toLowerCase().includes(servicio.toLowerCase())
          )
        )
      );
    }

    // Filtro por distancia máxima
    if (searchFilters.distanciaMaxima && userLocation) {
      filtered = filtered.filter(feria =>
        feria.distancia && feria.distancia <= searchFilters.distanciaMaxima!
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
