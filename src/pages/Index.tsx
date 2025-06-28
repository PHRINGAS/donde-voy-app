import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import Header from '../components/Header';
import SearchPanel from '../components/SearchPanel';
import FeriaCard from '../components/FeriaCard';
import FeriaDetails from '../components/FeriaDetails';
import MapView from '../components/MapView';
import FavoritesList from '../components/FavoritesList';
import ReminderSystem from '../components/ReminderSystem';
import BottomNavigation from '../components/BottomNavigation';
import { AppProvider } from '../contexts/AppContext';
import { toast } from "sonner";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'reminders'>('map');
  const [showSearch, setShowSearch] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFeria, setSelectedFeria] = useState<Feria | null>(null);

  const { location, error, loading } = useGeolocation();
  const { setUserLocation, filteredFerias, favorites } = useApp();

  useEffect(() => {
    if (location) {
      setUserLocation(location);
      toast.success("Ubicación detectada correctamente");
    } else if (error) {
      toast.error(`Error de ubicación: ${error}`);
    }
  }, [location, error, setUserLocation]);

  const handleLocationClick = () => {
    if (location) {
      toast.success("Ubicación actualizada");
    } else {
      toast.error("No se pudo obtener la ubicación");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="flex-1 pb-20">
            <MapView />
          </div>
        );

      case 'reminders':
        return (
          <div className="flex-1 overflow-y-auto pb-20">
            <ReminderSystem />
          </div>
        );

      case 'list':
      default:
        return (
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Detectando ubicación...</p>
              </div>
            )}

            {filteredFerias.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No se encontraron ferias
                </h3>
                <p className="text-gray-500">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Ferias disponibles ({filteredFerias.length})
                  </h2>
                  {location && (
                    <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      📍 Ubicación activa
                    </span>
                  )}
                </div>

                {filteredFerias.map(feria => (
                  <FeriaCard
                    key={feria.id}
                    feria={feria}
                    onViewDetails={setSelectedFeria}
                  />
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        onSearchClick={() => setShowSearch(true)}
        onLocationClick={handleLocationClick}
      />

      {/* Contenido principal */}
      {renderContent()}

      {/* Navegación inferior fija */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFavoritesClick={() => setShowFavorites(true)}
        favoriteCount={favorites.length}
      />

      {/* Modales */}
      <SearchPanel
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      <FavoritesList
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onViewDetails={setSelectedFeria}
      />

      <FeriaDetails
        feria={selectedFeria}
        isOpen={!!selectedFeria}
        onClose={() => setSelectedFeria(null)}
      />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
