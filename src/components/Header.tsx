
import React from 'react';
import { Search, Bell, Calendar } from 'lucide-react';

interface HeaderProps {
  onSearchClick: () => void;
  onNotificationsClick: () => void;
  onCalendarClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onSearchClick,
  onNotificationsClick,
  onCalendarClick
}) => {
  return (
    <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-orange-500 font-bold text-lg">🎪</span>
          </div>
          <h1 className="text-xl font-bold">Feriando</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onSearchClick}
            className="p-2 hover:bg-orange-400 rounded-full transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            onClick={onNotificationsClick}
            className="p-2 hover:bg-orange-400 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={onCalendarClick}
            className="p-2 hover:bg-orange-400 rounded-full transition-colors"
          >
            <Calendar size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
