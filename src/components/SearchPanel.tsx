
import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { tiposDeFeria, diasSemana, tiposProductos } from '../data/feriasData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose }) => {
  const { searchFilters, setSearchFilters } = useApp();
  const [localFilters, setLocalFilters] = useState(searchFilters);

  const handleApplyFilters = () => {
    setSearchFilters(localFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    setSearchFilters(emptyFilters);
  };

  const handleProductToggle = (producto: string) => {
    const currentProducts = localFilters.productos || [];
    const newProducts = currentProducts.includes(producto)
      ? currentProducts.filter(p => p !== producto)
      : [...currentProducts, producto];
    
    setLocalFilters({
      ...localFilters,
      productos: newProducts.length > 0 ? newProducts : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white w-full max-w-md ml-auto h-full overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Buscar Ferias</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Búsqueda por dirección */}
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

          {/* Tipo de feria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de feria
            </label>
            <Select
              value={localFilters.tipo || ""}
              onValueChange={(value) => setLocalFilters({
                ...localFilters,
                tipo: value || undefined
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposDeFeria.map(tipo => (
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
              <SelectContent>
                {diasSemana.map(dia => (
                  <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productos disponibles
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tiposProductos.map(producto => (
                <div key={producto} className="flex items-center space-x-2">
                  <Checkbox
                    id={producto}
                    checked={(localFilters.productos || []).includes(producto)}
                    onCheckedChange={() => handleProductToggle(producto)}
                  />
                  <label
                    htmlFor={producto}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {producto}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              className="flex-1"
            >
              Limpiar
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
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
