
import React from 'react';
import { MapPin, Search, Heart } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'map' | 'list';
  onTabChange: (tab: 'map' | 'list') => void;
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
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'map'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin size={20} />
          <span className="text-xs mt-1">Mapa</span>
        </button>
        
        <button
          onClick={() => onTabChange('list')}
          className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
            activeTab === 'list'
              ? 'text-orange-600 bg-orange-50'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search size={20} />
          <span className="text-xs mt-1">Lista</span>
        </button>
        
        <button
          onClick={onFavoritesClick}
          className="flex flex-col items-center py-2 px-4 rounded-lg transition-colors text-gray-500 hover:text-red-600 relative"
        >
          <Heart size={20} />
          <span className="text-xs mt-1">Favoritas</span>
          {favoriteCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {favoriteCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
