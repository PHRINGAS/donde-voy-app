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
        // Simular resultados de búsqueda
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex search-menu-backdrop">
      <div className="bg-white w-full max-w-md ml-auto h-full flex flex-col search-menu-panel">
        {/* Header compacto y fijo */}
        <div className="sticky top-0 z-[1110] bg-white shadow-sm">
          {/* Título optimizado */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">Buscar</h2>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    {getActiveFiltersCount()} filtros
                  </Badge>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Campo de búsqueda prominente */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500" size={18} />
              <Input
                placeholder="Buscar lugares, direcciones..."
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setLocalFilters({
                    ...localFilters,
                    direccion: e.target.value || undefined
                  });
                }}
                className="pl-10 pr-4 py-3 text-base border-2 border-orange-200 focus:border-orange-500 rounded-lg"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda en tiempo real */}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-sm text-gray-800">{result.nombre}</div>
                    <div className="text-xs text-gray-500">{result.direccion}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs compactos */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex border-b border-gray-200 min-w-max">
              {[
                { id: 'general', label: 'Filtros', icon: Filter },
                { id: 'productos', label: 'Productos', icon: Tag },
                { id: 'ubicacion', label: 'Zona', icon: MapPin },
                { id: 'especialidades', label: 'Tipo', icon: Star }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-2 px-3 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === id
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
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
          <div className="p-4 space-y-4">
            {/* Tab General - Diseño compacto */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Tipo de lugar con iconos */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo de lugar
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ETIQUETAS_SISTEMA.tipos.slice(0, 6).map(tipo => (
                      <button
                        key={tipo}
                        onClick={() => setLocalFilters({
                          ...localFilters,
                          tipo: localFilters.tipo === tipo ? undefined : tipo
                        })}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                          localFilters.tipo === tipo
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario con chips */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Horario preferido
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'mañana', label: '🌅 Mañana', desc: '8:00-14:00' },
                      { value: 'tarde', label: '🌞 Tarde', desc: '14:00-20:00' },
                      { value: 'noche', label: '🌙 Noche', desc: '20:00+' },
                      { value: 'todo_dia', label: '🕐 Todo el día', desc: 'Horario extendido' }
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setLocalFilters({
                          ...localFilters,
                          horarioTipo: localFilters.horarioTipo === value ? undefined : value as any
                        })}
                        className={`flex-1 p-2 rounded-lg border transition-all text-xs ${
                          localFilters.horarioTipo === value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="font-medium">{label}</div>
                        <div className="text-gray-500">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Días de la semana */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Día de funcionamiento
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => {
                      const fullDay = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][index];
                      return (
                        <button
                          key={dia}
                          onClick={() => setLocalFilters({
                            ...localFilters,
                            dia: localFilters.dia === fullDay ? undefined : fullDay
                          })}
                          className={`p-2 rounded-lg text-xs font-medium transition-all ${
                            localFilters.dia === fullDay
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 hover:bg-orange-100 text-gray-700'
                          }`}
                        >
                          {dia}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Distancia con slider visual */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Distancia máxima
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 5, 10].map(km => (
                      <button
                        key={km}
                        onClick={() => setLocalFilters({
                          ...localFilters,
                          distanciaMaxima: localFilters.distanciaMaxima === km * 1000 ? undefined : km * 1000
                        })}
                        className={`flex-1 p-2 rounded-lg text-sm font-medium transition-all ${
                          localFilters.distanciaMaxima === km * 1000
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 hover:bg-green-100 text-gray-700'
                        }`}
                      >
                        {km} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Productos - Grid optimizado */}
            {activeTab === 'productos' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Productos disponibles
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                  {ETIQUETAS_SISTEMA.productos.map(producto => (
                    <label
                      key={producto}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected('productos', producto)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected('productos', producto)}
                        onCheckedChange={() => handleMultiSelect('productos', producto)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{producto}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Ubicación - Badges compactos */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Barrios populares
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {ETIQUETAS_SISTEMA.barrios.slice(0, 15).map(barrio => (
                      <Badge
                        key={barrio}
                        variant={isSelected('barrio', barrio) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          isSelected('barrio', barrio)
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'hover:bg-orange-50 hover:border-orange-300'
                        }`}
                        onClick={() => handleMultiSelect('barrio', barrio)}
                      >
                        {barrio}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Comuna
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {ETIQUETAS_SISTEMA.comunas.map(comuna => (
                      <button
                        key={comuna}
                        onClick={() => handleMultiSelect('comuna', comuna)}
                        className={`p-2 rounded-lg text-xs font-medium transition-all ${
                          isSelected('comuna', comuna)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 hover:bg-orange-100 text-gray-700'
                        }`}
                      >
                        {comuna.replace('Comuna ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Especialidades - Chips coloridos */}
            {activeTab === 'especialidades' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Especialidades
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ETIQUETAS_SISTEMA.especialidades.map(especialidad => (
                      <Badge
                        key={especialidad}
                        variant={isSelected('especialidad', especialidad) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          isSelected('especialidad', especialidad)
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'hover:bg-green-50 hover:border-green-300'
                        }`}
                        onClick={() => handleMultiSelect('especialidad', especialidad)}
                      >
                        {especialidad}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Servicios
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ETIQUETAS_SISTEMA.servicios.map(servicio => (
                      <Badge
                        key={servicio}
                        variant={isSelected('servicios', servicio) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          isSelected('servicios', servicio)
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-blue-50 hover:border-blue-300'
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
          </div>
        </div>

        {/* Footer fijo con botones optimizados */}
        <div className="sticky bottom-0 z-[1110] bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1 transition-all hover:bg-gray-50"
              disabled={getActiveFiltersCount() === 0}
            >
              Limpiar {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-orange-500 hover:bg-orange-600 transition-all"
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