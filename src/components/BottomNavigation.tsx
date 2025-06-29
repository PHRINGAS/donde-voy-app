import React from 'react';
import { MapPin, Search, Heart, Bell } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'map' | 'list' | 'reminders';
  onTabChange: (tab: 'map' | 'list' | 'reminders') => void;
  onFavoritesClick: () => void;
  favoriteCount: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onFavoritesClick,
  favoriteCount
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1.5 z-50 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors ${
            activeTab === 'map'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={18} />
          <span className="text-xs mt-0.5">Mapa</span>
        </button>
        
        <button
          onClick={() => onTabChange('list')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors ${
            activeTab === 'list'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search size={18} />
          <span className="text-xs mt-0.5">Lista</span>
        </button>

        <button
          onClick={() => onTabChange('reminders')}
          className={`flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors ${
            activeTab === 'reminders'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bell size={18} />
          <span className="text-xs mt-0.5">Alertas</span>
        </button>
        
        <button
          onClick={onFavoritesClick}
          className="flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors text-gray-500 hover:text-red-600 relative"
        >
          <Heart size={18} />
          <span className="text-xs mt-0.5">Favoritas</span>
          {favoriteCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {favoriteCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;