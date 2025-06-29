import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Clock, Tag, Star, Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ETIQUETAS_SISTEMA } from '../types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const { searchFilters, setSearchFilters, filteredFerias } = useApp();
  const [localFilters, setLocalFilters] = useState(searchFilters);
  const [activeTab, setActiveTab] = useState<'general' | 'productos' | 'ubicacion' | 'especialidades'>('general');
  const [searchValue, setSearchValue] = useState(localFilters.direccion || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchValue.length > 2) {
        const results = filteredFerias
          .filter(feria => 
            feria.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
            feria.direccion.toLowerCase().includes(searchValue.toLowerCase()) ||
            feria.barrio?.toLowerCase().includes(searchValue.toLowerCase())
          )
          .slice(0, 5);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchValue, filteredFerias]);

  const handleApplyFilters = () => {
    setSearchFilters(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setSearchFilters(emptyFilters);
    setSearchValue('');
    setSearchResults([]);
  };

  const handleMultiSelect = (category: keyof typeof localFilters, value: string) => {
    const currentValues = (localFilters[category] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    setLocalFilters({
      ...localFilters,
      [category]: newValues.length > 0 ? newValues : undefined
    });
  };

  const isSelected = (category: keyof typeof localFilters, value: string) => {
    return (localFilters[category] as string[])?.includes(value) || false;
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(value => 
      value !== undefined && 
      value !== '' && 
      !(Array.isArray(value) && value.length === 0)
    ).length;
  };

  const handleSearchSelect = (result: any) => {
    setSearchValue(result.nombre);
    setLocalFilters({
      ...localFilters,
      direccion: result.nombre
    });
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex animate-slide-in-right">
      <div className="bg-white w-full max-w-md ml-auto h-full flex flex-col shadow-2xl">
        {/* Header con glassmorphism */}
        <div className="sticky top-0 z-[1110] bg-white bg-opacity-95 backdrop-blur-lg shadow-sm">
          {/* Título optimizado */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Search size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Buscar</h2>
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs mt-1">
                      {getActiveFiltersCount()} filtros activos
                    </Badge>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-all hover:scale-105"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Campo de búsqueda prominente con placeholder actualizado */}
          <div className="px-4 py-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500" size={18} />
              <Input
                placeholder="¿Dónde voy?"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setLocalFilters({
                    ...localFilters,
                    direccion: e.target.value || undefined
                  });
                }}
                className="pl-12 pr-10 py-3 text-base border-2 border-orange-200 focus:border-orange-500 rounded-xl bg-white shadow-sm"
              />
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue('');
                    setLocalFilters({
                      ...localFilters,
                      direccion: undefined
                    });
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda mejorados */}
            {searchResults.length > 0 && (
              <div className="mt-3 bg-white border border-orange-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-orange-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-semibold text-sm text-gray-800">{result.nombre}</div>
                    <div className="text-xs text-gray-500 mt-1">{result.direccion}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs mejorados */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex border-b border-gray-200 min-w-max bg-white">
              {[
                { id: 'general', label: 'Filtros', icon: Filter, color: 'orange' },
                { id: 'productos', label: 'Productos', icon: Tag, color: 'purple' },
                { id: 'ubicacion', label: 'Zona', icon: MapPin, color: 'blue' },
                { id: 'especialidades', label: 'Tipo', icon: Star, color: 'green' }
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === id
                      ? `text-${color}-600 border-b-2 border-${color}-600 bg-${color}-50`
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido scrolleable optimizado */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Tab General - Diseño mejorado */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Tipo de lugar con iconos */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Tipo de lugar
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ETIQUETAS_SISTEMA.tipos.slice(0, 6).map(tipo => (
                      <button
                        key={tipo}
                        onClick={() => setLocalFilters({
                          ...localFilters,
                          tipo: localFilters.tipo === tipo ? undefined : tipo
                        })}
                        className={`filter-chip ${
                          localFilters.tipo === tipo
                            ? 'filter-chip-active'
                            : 'filter-chip-inactive'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario con chips mejorados */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Horario preferido
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'mañana', label: '🌅 Mañana', desc: '8:00-14:00' },
                      { value: 'tarde', label: '🌞 Tarde', desc: '14:00-20:00' },
                      { value: 'noche', label: '🌙 Noche', desc: '20:00+' },
                      { value: 'todo_dia', label: '🕐 Todo el día', desc: 'Extendido' }
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setLocalFilters({
                          ...localFilters,
                          horarioTipo: localFilters.horarioTipo === value ? undefined : value as any
                        })}
                        className={`p-3 rounded-xl border-2 transition-all text-xs text-center ${
                          localFilters.horarioTipo === value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <div className="font-bold">{label}</div>
                        <div className="text-gray-500 mt-1">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Días de la semana mejorados */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Día de funcionamiento
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => {
                      const fullDay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index];
                      return (
                        <button
                          key={dia}
                          onClick={() => setLocalFilters({
                            ...localFilters,
                            dia: localFilters.dia === fullDay ? undefined : fullDay
                          })}
                          className={`p-3 rounded-xl text-xs font-bold transition-all ${
                            localFilters.dia === fullDay
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                              : 'bg-gray-100 hover:bg-orange-100 text-gray-700 hover:scale-105'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Distancia con botones mejorados */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Distancia máxima
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 5, 10].map(km => (
                      <button
                        key={km}
                        onClick={() => setLocalFilters({
                          ...localFilters,
                          distanciaMaxima: localFilters.distanciaMaxima === km * 1000 ? undefined : km * 1000
                        })}
                        className={`p-3 rounded-xl text-sm font-bold transition-all ${
                          localFilters.distanciaMaxima === km * 1000
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                            : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:scale-105'
                        }`}
                      >
                        {km} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Productos */}
            {activeTab === 'productos' && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-4">
                  Productos disponibles
                </label>
                <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                  {ETIQUETAS_SISTEMA.productos.map(producto => (
                    <label
                      key={producto}
                      className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected('productos', producto)
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:scale-102'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected('productos', producto)}
                        onCheckedChange={() => handleMultiSelect('productos', producto)}
                        className="mr-3"
                      />
                      <span className="text-sm font-semibold">{producto}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Ubicación */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-6">
                {/* Barrio */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Barrio
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ETIQUETAS_SISTEMA.barrios.map(barrio => (
                      <Badge
                        key={barrio}
                        variant={isSelected('barrio', barrio) ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected('barrio', barrio)
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'hover:bg-orange-50'
                          }`}
                        onClick={() => handleMultiSelect('barrio', barrio)}
                      >
                        {barrio}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Comuna */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Comuna
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ETIQUETAS_SISTEMA.comunas.map(comuna => (
                      <Badge
                        key={comuna}
                        variant={isSelected('comuna', comuna) ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected('comuna', comuna)
                            ? 'bg-orange-500 hover:bg-orange-600'
                            : 'hover:bg-orange-50'
                          }`}
                        onClick={() => handleMultiSelect('comuna', comuna)}
                      >
                        {comuna}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Especialidades */}
            {activeTab === 'especialidades' && (
              <div className="space-y-6">
                {/* Especialidades */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Especialidades
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ETIQUETAS_SISTEMA.especialidades.map(especialidad => (
                      <Badge
                        key={especialidad}
                        variant={isSelected('especialidad', especialidad) ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected('especialidad', especialidad)
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'hover:bg-green-50'
                          }`}
                        onClick={() => handleMultiSelect('especialidad', especialidad)}
                      >
                        {especialidad}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Servicios */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3">
                    Servicios disponibles
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ETIQUETAS_SISTEMA.servicios.map(servicio => (
                      <Badge
                        key={servicio}
                        variant={isSelected('servicios', servicio) ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected('servicios', servicio)
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'hover:bg-blue-50'
                          }`}
                        onClick={() => handleMultiSelect('servicios', servicio)}
                      >
                        {servicio}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Filtros activos */}
            {Object.keys(localFilters).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Filtros activos:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(localFilters).map(([key, value]) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;
                    const displayValue = Array.isArray(value) ? value.join(', ') : value;
                    return (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {key}: {displayValue}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer mejorado */}
        <div className="sticky bottom-0 z-[1110] bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1 transition-all hover:bg-gray-50 border-2"
              disabled={getActiveFiltersCount() === 0}
            >
              Limpiar {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;