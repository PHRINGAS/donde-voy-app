
import React from 'react';
import { X, MapPin, Clock, Calendar, Heart, Bell } from 'lucide-react';
import { Feria } from '../types';
import { useApp } from '../contexts/AppContext';
import { formatDistance } from '../utils/distanceCalculator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FeriaDetailsProps {
  feria: Feria | null;
  isOpen: boolean;
  onClose: () => void;
}

const FeriaDetails: React.FC<FeriaDetailsProps> = ({ feria, isOpen, onClose }) => {
  const { toggleFavorite, isFavorite } = useApp();

  if (!isOpen || !feria) return null;

  const isLiked = isFavorite(feria.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] md:max-h-[80vh] rounded-t-2xl md:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{feria.nombre}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-400 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center text-orange-100">
            <MapPin size={16} className="mr-2" />
            <span className="text-sm">{feria.direccion}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] md:max-h-[calc(80vh-120px)]">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
              {feria.tipo}
            </Badge>
            {feria.distancia && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                📍 {formatDistance(feria.distancia)}
              </Badge>
            )}
          </div>

          {/* Descripción */}
          {feria.descripcion && (
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">{feria.descripcion}</p>
            </div>
          )}

          <Separator className="my-4" />

          {/* Horarios */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Clock size={18} className="mr-3 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Horarios</h3>
            </div>
            <p className="text-gray-600 ml-9">
              {feria.horarios.apertura} - {feria.horarios.cierre}
            </p>
          </div>

          {/* Días de funcionamiento */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Calendar size={18} className="mr-3 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Días de funcionamiento</h3>
            </div>
            <div className="flex flex-wrap gap-2 ml-9">
              {feria.diasFuncionamiento.map((dia, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                >
                  {dia}
                </span>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Productos disponibles</h3>
            <div className="flex flex-wrap gap-2">
              {feria.productos.map((producto, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                >
                  {producto}
                </span>
              ))}
            </div>
          </div>

          {/* Teléfono */}
          {feria.telefono && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Contacto</h3>
              <p className="text-gray-600">{feria.telefono}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <Button
              onClick={() => toggleFavorite(feria.id)}
              variant={isLiked ? "default" : "outline"}
              className={`flex-1 ${
                isLiked 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'border-red-200 text-red-600 hover:bg-red-50'
              }`}
            >
              <Heart 
                size={16} 
                className="mr-2" 
                fill={isLiked ? 'currentColor' : 'none'} 
              />
              {isLiked ? 'Guardado' : 'Guardar'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              <Bell size={16} className="mr-2" />
              Recordar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeriaDetails;
