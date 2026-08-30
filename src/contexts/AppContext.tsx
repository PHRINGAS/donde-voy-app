import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feria, SearchFilters, UserLocation, CATEGORIAS_PRINCIPALES } from '../types';
import { feriasData, getAllFerias } from '../data/feriasData';
import { feriasService } from '../integrations/supabase/feriasService';
import { getNearbyPlacesAsFerias } from '../integrations/supabase/placesService';
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

  // Cargar datos al inicializar: base masiva de lugares (agentes) + datasets locales
  useEffect(() => {
    const loadUnifiedData = async () => {
      try {
        setLoading(true);
        const allDataMap = new Map<string, Feria>();

        const addBatch = (batch: Feria[], nombre: string) => {
          batch.forEach(item => {
            if (!allDataMap.has(item.id)) allDataMap.set(item.id, item);
          });
          console.log(`✅ ${batch.length} puntos desde ${nombre} (total: ${allDataMap.size})`);
        };

        // 1) Base masiva `places` cargada por los agentes (carga por cercanía con tope)
        const places = await getNearbyPlacesAsFerias();
        if (places.length > 0) addBatch(places, 'places (Supabase)');

        // 2) Datasets locales unificados (mercados, ferias, cultura)
        try {
          const localData = await unifyAllData();
          if (localData.length > 0) addBatch(localData, 'datasets locales');
        } catch (localError) {
          console.error('Error datos locales:', localError);

          // Fallback a Supabase (tabla vieja de ferias)
          try {
            const legacy = await feriasService.getAllFerias();
            if (legacy.length > 0) addBatch(legacy, 'ferias (Supabase legacy)');
          } catch (supabaseError) {
            console.error('Error Supabase legacy:', supabaseError);
            addBatch(await getAllFerias(), 'datos locales fallback');
          }
        }

        const allData = Array.from(allDataMap.values());

        if (allData.length === 0) throw new Error('Sin fuentes de datos disponibles');
        setRawFerias(allData);
        setFeriasWithDistances(allData);
        setFilteredFerias(allData);

      } catch (error) {
        console.error('❌ Error cargando datos:', error);
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

    // Filtro por categoría
    // Las categorías principales filtran por el campo `categoria`;
    // cualquier otro valor (Orgánico, Vegano, ...) se busca como
    // especialidad/etiqueta/producto para que coincida con el contador.
    if (searchFilters.categoria && searchFilters.categoria !== 'Todos') {
      const categoria = searchFilters.categoria;
      const isCore = CATEGORIAS_PRINCIPALES.includes(categoria);

      filtered = filtered.filter(feria => {
        if (isCore) {
          return feria.categoria === categoria;
        }
        const needle = categoria.toLowerCase();
        return (
          feria.categoria === categoria ||
          feria.especialidad.some(e => e.toLowerCase().includes(needle)) ||
          feria.etiquetas.some(t => t.toLowerCase().includes(needle)) ||
          feria.productos.some(p => p.toLowerCase().includes(needle))
        );
      });
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
