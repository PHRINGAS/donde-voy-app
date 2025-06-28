
import React from 'react';
import { MapPin, Clock, Calendar, Heart } from 'lucide-react';
import { Feria } from '../types';
import { useApp } from '../contexts/AppContext';
import { formatDistance } from '../utils/distanceCalculator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FeriaCardProps {
  feria: Feria;
  onViewDetails: (feria: Feria) => void;
}

const FeriaCard: React.FC<FeriaCardProps> = ({ feria, onViewDetails }) => {
  const { toggleFavorite, isFavorite } = useApp();
  const isLiked = isFavorite(feria.id);

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {feria.nombre}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={16} className="mr-2 text-orange-500" />
              <span className="text-sm">{feria.direccion}</span>
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(feria.id)}
            className={`p-2 rounded-full transition-colors ${
              isLiked 
                ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {feria.tipo}
          </Badge>
          {feria.distancia && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              {formatDistance(feria.distancia)}
            </Badge>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Clock size={14} className="mr-2" />
          <span>{feria.horarios.apertura} - {feria.horarios.cierre}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Calendar size={14} className="mr-2" />
          <span>{feria.diasFuncionamiento.join(', ')}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {feria.productos.slice(0, 3).map((producto, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {producto}
            </span>
          ))}
          {feria.productos.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{feria.productos.length - 3} más
            </span>
          )}
        </div>

        <Button
          onClick={() => onViewDetails(feria)}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          Ver detalles
        </Button>
      </CardContent>
    </Card>
  );
};

export default FeriaCard;
