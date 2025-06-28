import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feria, SearchFilters, UserLocation } from '../types'; // Assuming Feria type already allows optional 'distancia'
import { feriasData, getAllFerias } from '../data/feriasData';
import { feriasService } from '../integrations/supabase/feriasService';
import { calculateDistance } from '../utils/distanceCalculator';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { unifyAllData } from '../utils/dataProcessor';

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
  const [rawFerias, setRawFerias] = useState<Feria[]>([]); // Stores ferias without distance
  const [feriasWithDistances, setFeriasWithDistances] = useState<Feria[]>([]); // Stores ferias with distance
  const [filteredFerias, setFilteredFerias] = useState<Feria[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);

  // Usar localStorage para persistir favoritos
  const [favorites, setFavorites] = useLocalStorage<string[]>('feriando-favorites', []);

  // Cargar datos unificados al inicializar
  useEffect(() => {
    const loadUnifiedData = async () => {
      try {
        setLoading(true);

        // Intentar cargar datos unificados primero
        let allData: Feria[] = [];

        try {
          console.log('🔄 Cargando datos unificados (mercados, ferias, cultura)...');
          allData = await unifyAllData();

          if (allData.length > 0) {
            console.log(`✅ Se cargaron ${allData.length} puntos desde datos unificados`);
          } else {
            throw new Error('No se pudieron cargar datos unificados');
          }
        } catch (unifiedError) {
          console.log('⚠️  No se pudieron cargar datos unificados, intentando Supabase...');
          console.error('Error datos unificados:', unifiedError);

          // Fallback a Supabase
          try {
            console.log('🔄 Intentando cargar ferias desde Supabase...');
            allData = await feriasService.getAllFerias();

            if (allData.length > 0) {
              console.log(`✅ Se cargaron ${allData.length} ferias desde Supabase`);
            } else {
              throw new Error('No hay datos en Supabase');
            }
          } catch (supabaseError) {
            console.log('⚠️  No se pudieron cargar datos desde Supabase, usando datos locales...');
            console.error('Error Supabase:', supabaseError);

            // Fallback a datos locales
            allData = await getAllFerias();
            console.log(`✅ Se cargaron ${allData.length} ferias desde datos locales`);
          }
        }

        setRawFerias(allData);
        // Initially, set feriasWithDistances to rawFerias; distances will be added if location is available
        setFeriasWithDistances(allData);
        setFilteredFerias(allData); // Initial filtered list

      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        // Fallback final a datos de muestra (ensure this data is in the correct shape)
        const fallbackData = feriasData.map(f => ({ ...f, distancia: undefined }));
        setRawFerias(fallbackData);
        setFeriasWithDistances(fallbackData);
        setFilteredFerias(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadUnifiedData();
  }, []);

  // Actualizar distancias cuando cambia la ubicación del usuario o cuando rawFerias cambia
  useEffect(() => {
    if (userLocation && rawFerias.length > 0) {
      const updatedFeriasWithDistances = rawFerias.map(feria => ({
        ...feria,
        distancia: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          feria.lat,
          feria.lng
        )
      }));
      setFeriasWithDistances(updatedFeriasWithDistances);
    } else {
      // If no user location, or no rawFerias, ensure feriasWithDistances is rawFerias (without distances)
      setFeriasWithDistances(rawFerias.map(f => ({ ...f, distancia: undefined })));
    }
  }, [userLocation, rawFerias]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...feriasWithDistances]; // Filter from ferias that may have distances

    // Filtro por categoría (nuevo)
    if (searchFilters.categoria && searchFilters.categoria !== 'Todos') {
      filtered = filtered.filter(feria =>
        feria.categoria === searchFilters.categoria
      );
    }

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

    // Ordenar por distancia si está disponible (distancia is already on feriasWithDistances)
    if (userLocation && filtered.some(f => f.distancia !== undefined)) {
      filtered.sort((a, b) => (a.distancia || Infinity) - (b.distancia || Infinity));
    }

    setFilteredFerias(filtered);
  }, [searchFilters, feriasWithDistances, userLocation]); // userLocation is needed here for re-sorting if it changes

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
      ferias: feriasWithDistances, // Provide feriasWithDistances as 'ferias'
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
