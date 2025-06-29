import React, { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApp } from '../contexts/AppContext';
import { Feria } from '../types';
import SearchPanel from '../components/SearchPanel';
import FeriaCard from '../components/FeriaCard';
import FeriaDetails from '../components/FeriaDetails';
import MapView from '../components/MapView';
import FavoritesTab from '../components/FavoritesTab';
import ReminderSystem from '../components/ReminderSystem';
import BottomNavigation from '../components/BottomNavigation';
import CategoryFilter from '../components/CategoryFilter';
import FloatingControls from '../components/FloatingControls';
import { AppProvider } from '../contexts/AppContext';
import { toast } from "sonner";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'favorites' | 'reminders'>('map');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFeria, setSelectedFeria] = useState<Feria | null>(null);

  const { location, error, loading } = useGeolocation();
  const { setUserLocation, filteredFerias, favorites } = useApp();

  useEffect(() => {
    if (location) {
      setUserLocation(location);
    } else if (error) {
      toast.error(`Error de ubicación: ${error}`);
    }
  }, [location, error, setUserLocation]);

  const handleLocationClick = () => {
    if (location) {
      toast.success("📍 Ubicación actualizada");
    } else {
      toast.error("No se pudo obtener la ubicación");
    }
  };

  // Función para invalidar el tamaño del mapa cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'map') {
      setTimeout(() => {
        const mapEvent = new CustomEvent('mapTabActivated');
        window.dispatchEvent(mapEvent);
      }, 100);
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <div className="absolute inset-0">
            <MapView />
            {/* Controles flotantes sobre el mapa */}
            <FloatingControls
              onSearchClick={() => setShowSearch(true)}
              onLocationClick={handleLocationClick}
            />
          </div>
        );

      case 'favorites':
        return (
          <FavoritesTab onViewDetails={setSelectedFeria} />
        );

      case 'reminders':
        return (
          <div className="h-full overflow-y-auto">
            <ReminderSystem />
          </div>
        );

      case 'list':
      default:
        return (
          <div className="h-full overflow-y-auto">
            {/* Filtro de categorías compacto */}
            <div className="p-3">
              <CategoryFilter />
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-2 text-gray-600">Detectando ubicación...</p>
              </div>
            )}

            {filteredFerias.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">🤔</div>
                <h3 className="empty-state-title">
                  No se encontraron lugares
                </h3>
                <p className="empty-state-description">
                  Intenta ajustar los filtros o cambiar de categoría
                </p>
              </div>
            ) : (
              <div className="px-3 space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-800">
                    Lugares disponibles ({filteredFerias.length})
                  </h2>
                  {/* ELIMINA "UBICACIÓN ACTIVA" */}
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
    <div className="app-container">
      {/* Contenido principal - Ocupa toda la pantalla */}
      <div className="app-content">
        {renderContent()}
      </div>

      {/* Navegación inferior fija - Siempre visible */}
      {!showSearch && (
        <div className="app-bottom-nav safe-area-bottom">
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            favoriteCount={favorites.length}
          />
        </div>
      )}

      {/* Modales */}
      <SearchPanel
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
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