
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Feria, SearchFilters, UserLocation } from '../types';
import { feriasData } from '../data/feriasData';
import { calculateDistance } from '../utils/distanceCalculator';

interface AppContextType {
  ferias: Feria[];
  filteredFerias: Feria[];
  userLocation: UserLocation | null;
  favorites: string[];
  searchFilters: SearchFilters;
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});

  // Cargar favoritos del localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('feria-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem('feria-favorites', JSON.stringify(favorites));
  }, [favorites]);

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
