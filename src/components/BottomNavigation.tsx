import React from 'react';
import { MapPin, Search, Heart, Bell } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'map' | 'list' | 'favorites' | 'reminders';
  onTabChange: (tab: 'map' | 'list' | 'favorites' | 'reminders') => void;
  favoriteCount: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  favoriteCount
}) => {
  return (
    <nav className="bottom-navigation">
      <div className="flex justify-around items-center h-full px-2">
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
            activeTab === 'map'
              ? 'text-orange-600 bg-orange-50 active'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="icon">
            <MapPin size={22} />
          </div>
          <span className="label text-xs mt-1 font-medium">Mapa</span>
        </button>
        
        <button
          onClick={() => onTabChange('list')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
            activeTab === 'list'
              ? 'text-orange-600 bg-orange-50 active'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="icon">
            <Search size={22} />
          </div>
          <span className="label text-xs mt-1 font-medium">Lista</span>
        </button>

        <button
          onClick={() => onTabChange('favorites')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all relative ${
            activeTab === 'favorites'
              ? 'text-red-600 bg-red-50 active'
              : 'text-gray-500 hover:text-red-600'
          }`}
        >
          <div className="icon">
            <Heart size={22} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} />
          </div>
          <span className="label text-xs mt-1 font-medium">Favoritas</span>
          {favoriteCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {favoriteCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('reminders')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
            activeTab === 'reminders'
              ? 'text-orange-600 bg-orange-50 active'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="icon">
            <Bell size={22} />
          </div>
          <span className="label text-xs mt-1 font-medium">Alertas</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;