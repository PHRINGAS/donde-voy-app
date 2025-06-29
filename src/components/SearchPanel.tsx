import React, { useState } from 'react';
import { X, Search, MapPin, Clock, Tag, Star } from 'lucide-react';
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
  const { searchFilters, setSearchFilters } = useApp();
  const [localFilters, setLocalFilters] = useState(searchFilters);
  const [activeTab, setActiveTab] = useState<'general' | 'productos' | 'ubicacion' | 'especialidades'>('general');

  const handleApplyFilters = () => {
    setSearchFilters(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setSearchFilters(emptyFilters);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex">
      <div className="bg-white w-full max-w-md ml-auto h-full flex flex-col">
        {/* Header compacto */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          {/* Título reducido */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Buscar Lugares</h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tabs con scroll horizontal */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex border-b border-gray-200 min-w-max">
              {[
                { id: 'general', label: 'General', icon: Search },
                { id: 'productos', label: 'Productos', icon: Tag },
                { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
                { id: 'especialidades', label: 'Especialidades', icon: Star }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium transition-colors whitespace-nowrap ${activeTab === id
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

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 space-y-4">
            {/* Tab General */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                {/* Campo de búsqueda reducido */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Buscar por dirección o nombre
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <Input
                      placeholder="Ej: San Telmo, Recoleta..."
                      value={localFilters.direccion || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        direccion: e.target.value || undefined
                      })}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Tipo de lugar */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Tipo de lugar
                  </label>
                  <Select
                    value={localFilters.tipo || ""}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      tipo: value || undefined
                    })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Seleccionar tipo de lugar" />
                    </SelectTrigger>
                    <SelectContent className="z-[1002]">
                      {ETIQUETAS_SISTEMA.tipos.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Día de funcionamiento */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Día de funcionamiento
                  </label>
                  <Select
                    value={localFilters.dia || ""}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      dia: value || undefined
                    })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent className="z-[1002]">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => (
                        <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horario */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Horario preferido
                  </label>
                  <Select
                    value={localFilters.horarioTipo || ""}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      horarioTipo: value as any || undefined
                    })}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Seleccionar horario" />
                    </SelectTrigger>
                    <SelectContent className="z-[1002]">
                      <SelectItem value="mañana">Mañana (8:00-14:00)</SelectItem>
                      <SelectItem value="tarde">Tarde (14:00-20:00)</SelectItem>
                      <SelectItem value="noche">Noche (20:00-00:00)</SelectItem>
                      <SelectItem value="todo_dia">Todo el día</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Distancia máxima */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Distancia máxima (km)
                  </label>
                  <Input
                    type="number"
                    placeholder="Ej: 5"
                    value={localFilters.distanciaMaxima || ''}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      distanciaMaxima: e.target.value ? parseInt(e.target.value) * 1000 : undefined
                    })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Tab Productos */}
            {activeTab === 'productos' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Productos disponibles
                  </label>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {ETIQUETAS_SISTEMA.productos.map(producto => (
                      <div key={producto} className="flex items-center space-x-2">
                        <Checkbox
                          id={producto}
                          checked={isSelected('productos', producto)}
                          onCheckedChange={() => handleMultiSelect('productos', producto)}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={producto}
                          className="text-xs text-gray-700 cursor-pointer flex-1"
                        >
                          {producto}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Ubicación */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-4">
                {/* Barrio con scroll horizontal */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Barrio
                  </label>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-2 min-w-max">
                      {ETIQUETAS_SISTEMA.barrios.map(barrio => (
                        <Badge
                          key={barrio}
                          variant={isSelected('barrio', barrio) ? "default" : "outline"}
                          className={`cursor-pointer text-xs whitespace-nowrap ${isSelected('barrio', barrio)
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
                </div>

                <Separator />

                {/* Comuna con scroll horizontal */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Comuna
                  </label>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-2 min-w-max">
                      {ETIQUETAS_SISTEMA.comunas.map(comuna => (
                        <Badge
                          key={comuna}
                          variant={isSelected('comuna', comuna) ? "default" : "outline"}
                          className={`cursor-pointer text-xs whitespace-nowrap ${isSelected('comuna', comuna)
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
              </div>
            )}

            {/* Tab Especialidades */}
            {activeTab === 'especialidades' && (
              <div className="space-y-4">
                {/* Especialidades con scroll horizontal */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Especialidades
                  </label>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-2 min-w-max">
                      {ETIQUETAS_SISTEMA.especialidades.map(especialidad => (
                        <Badge
                          key={especialidad}
                          variant={isSelected('especialidad', especialidad) ? "default" : "outline"}
                          className={`cursor-pointer text-xs whitespace-nowrap ${isSelected('especialidad', especialidad)
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
                </div>

                <Separator />

                {/* Servicios con scroll horizontal */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Servicios disponibles
                  </label>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-2 min-w-max">
                      {ETIQUETAS_SISTEMA.servicios.map(servicio => (
                        <Badge
                          key={servicio}
                          variant={isSelected('servicios', servicio) ? "default" : "outline"}
                          className={`cursor-pointer text-xs whitespace-nowrap ${isSelected('servicios', servicio)
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
              </div>
            )}

            {/* Filtros activos */}
            {Object.keys(localFilters).length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Filtros activos:</h4>
                <div className="flex flex-wrap gap-1.5">
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

            {/* Botones de acción compactos */}
            <div className="flex space-x-2 pt-3">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1 h-9 text-sm"
              >
                Limpiar
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="flex-1 bg-orange-500 hover:bg-orange-600 h-9 text-sm"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;