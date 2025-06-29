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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex">
      <div className="bg-white w-full max-w-md ml-auto h-full flex flex-col">
        {/* Header fijo con z-index alto y posicionamiento optimizado */}
        <div className="sticky top-0 z-[1110] bg-white shadow-sm">
          {/* Título con botón X posicionado debajo del header */}
          <div className="px-4 py-3 border-b border-gray-200" style={{ marginTop: '56px' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Buscar Lugares</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors z-[1120]"
                style={{ position: 'relative' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tabs con scroll horizontal suave */}
          <div className="overflow-x-auto scrollbar-hide smooth-scroll">
            <div className="flex border-b border-gray-200 min-w-max px-2">
              {[
                { id: 'general', label: 'General', icon: Search },
                { id: 'productos', label: 'Productos', icon: Tag },
                { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
                { id: 'especialidades', label: 'Especialidades', icon: Star }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-max ${
                    activeTab === id
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Área de contenido scrolleable con márgenes optimizados */}
        <div 
          className="flex-1 overflow-y-auto smooth-scroll"
          style={{
            paddingTop: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            marginBottom: '80px', // Evitar que se oculte detrás del menú inferior
            maxHeight: 'calc(100vh - 200px)', // Altura dinámica según viewport
            scrollBehavior: 'smooth'
          }}
        >
          <div className="space-y-6 pb-6">
            {/* Tab General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Campo de búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar por dirección o nombre
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Ej: San Telmo, Recoleta..."
                      value={localFilters.direccion || ''}
                      onChange={(e) => setLocalFilters({
                        ...localFilters,
                        direccion: e.target.value || undefined
                      })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tipo de lugar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de lugar
                  </label>
                  <Select
                    value={localFilters.tipo || ""}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      tipo: value || undefined
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de lugar" />
                    </SelectTrigger>
                    <SelectContent className="z-[1130]">
                      {ETIQUETAS_SISTEMA.tipos.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Día de funcionamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día de funcionamiento
                  </label>
                  <Select
                    value={localFilters.dia || ""}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      dia: value || undefined
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar día" />
                    </SelectTrigger>
                    <SelectContent className="z-[1130]">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => (
                        <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horario preferido
                  </label>
                  <Select
                    value={localFilters.horarioTipo || ""}
                    onValueChange={(value) => setLocalFilters({
                      ...localFilters,
                      horarioTipo: value as any || undefined
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar horario" />
                    </SelectTrigger>
                    <SelectContent className="z-[1130]">
                      <SelectItem value="mañana">Mañana (8:00-14:00)</SelectItem>
                      <SelectItem value="tarde">Tarde (14:00-20:00)</SelectItem>
                      <SelectItem value="noche">Noche (20:00-00:00)</SelectItem>
                      <SelectItem value="todo_dia">Todo el día</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Distancia máxima */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  />
                </div>
              </div>
            )}

            {/* Tab Productos con layout optimizado */}
            {activeTab === 'productos' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Productos disponibles
                  </label>
                  {/* Grid de 2 columnas con scroll suave */}
                  <div 
                    className="grid grid-cols-2 gap-x-4 gap-y-3 overflow-y-auto smooth-scroll"
                    style={{ maxHeight: '320px' }}
                  >
                    {ETIQUETAS_SISTEMA.productos.map(producto => (
                      <div key={producto} className="flex items-start space-x-2">
                        <Checkbox
                          id={producto}
                          checked={isSelected('productos', producto)}
                          onCheckedChange={() => handleMultiSelect('productos', producto)}
                          className="h-4 w-4 mt-0.5 flex-shrink-0"
                        />
                        <label
                          htmlFor={producto}
                          className="text-sm text-gray-700 cursor-pointer flex-1 leading-tight"
                        >
                          {producto}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Ubicación con badges en filas */}
            {activeTab === 'ubicacion' && (
              <div className="space-y-6">
                {/* Barrio con scroll suave */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Barrio
                  </label>
                  <div 
                    className="flex flex-wrap gap-2 overflow-y-auto smooth-scroll"
                    style={{ maxHeight: '200px' }}
                  >
                    {ETIQUETAS_SISTEMA.barrios.map(barrio => (
                      <Badge
                        key={barrio}
                        variant={isSelected('barrio', barrio) ? "default" : "outline"}
                        className={`cursor-pointer text-sm transition-all duration-200 ${
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

                <Separator />

                {/* Comuna con scroll suave */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Comuna
                  </label>
                  <div 
                    className="flex flex-wrap gap-2 overflow-y-auto smooth-scroll"
                    style={{ maxHeight: '200px' }}
                  >
                    {ETIQUETAS_SISTEMA.comunas.map(comuna => (
                      <Badge
                        key={comuna}
                        variant={isSelected('comuna', comuna) ? "default" : "outline"}
                        className={`cursor-pointer text-sm transition-all duration-200 ${
                          isSelected('comuna', comuna)
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : 'hover:bg-orange-50 hover:border-orange-300'
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

            {/* Tab Especialidades con scroll suave */}
            {activeTab === 'especialidades' && (
              <div className="space-y-6">
                {/* Especialidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Especialidades
                  </label>
                  <div 
                    className="flex flex-wrap gap-2 overflow-y-auto smooth-scroll"
                    style={{ maxHeight: '200px' }}
                  >
                    {ETIQUETAS_SISTEMA.especialidades.map(especialidad => (
                      <Badge
                        key={especialidad}
                        variant={isSelected('especialidad', especialidad) ? "default" : "outline"}
                        className={`cursor-pointer text-sm transition-all duration-200 ${
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

                <Separator />

                {/* Servicios */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Servicios disponibles
                  </label>
                  <div 
                    className="flex flex-wrap gap-2 overflow-y-auto smooth-scroll"
                    style={{ maxHeight: '200px' }}
                  >
                    {ETIQUETAS_SISTEMA.servicios.map(servicio => (
                      <Badge
                        key={servicio}
                        variant={isSelected('servicios', servicio) ? "default" : "outline"}
                        className={`cursor-pointer text-sm transition-all duration-200 ${
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

        {/* Botones de acción fijos en la parte inferior */}
        <div 
          className="sticky bottom-0 z-[1110] bg-white border-t border-gray-200 p-4"
          style={{ marginBottom: '0px' }}
        >
          <div className="flex space-x-3">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1 transition-all duration-200 hover:bg-gray-50"
            >
              Limpiar
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-orange-500 hover:bg-orange-600 transition-all duration-200"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;