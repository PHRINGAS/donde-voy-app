import React from 'react';
import { MapPin, Clock, Calendar, Heart, Tag, Star, Map } from 'lucide-react';
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

  // Función para obtener el color de las etiquetas según su tipo
  const getTagColor = (tag: string) => {
    if (feria.especialidad.includes(tag)) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (feria.servicios.includes(tag)) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (feria.productos.includes(tag)) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Función para obtener el icono según el tipo de etiqueta
  const getTagIcon = (tag: string) => {
    if (feria.especialidad.includes(tag)) return <Star size={12} />;
    if (feria.servicios.includes(tag)) return <Map size={12} />;
    if (feria.productos.includes(tag)) return <Tag size={12} />;
    return null;
  };

  // Función para obtener el color del borde según la categoría
  const getBorderColor = (categoria: string) => {
    const colors = {
      'Mercados': 'border-l-blue-500',
      'Ferias': 'border-l-orange-500',
      'Cultura': 'border-l-purple-500'
    };
    return colors[categoria as keyof typeof colors] || 'border-l-gray-500';
  };

  // Función para obtener el icono de categoría
  const getCategoryIcon = (categoria: string) => {
    const icons = {
      'Mercados': '🛒',
      'Ferias': '🎪',
      'Cultura': '🎭'
    };
    return icons[categoria as keyof typeof icons] || '📍';
  };

  return (
    <Card className={`mb-4 hover:shadow-lg transition-shadow duration-200 border-l-4 ${getBorderColor(feria.categoria)}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{getCategoryIcon(feria.categoria)}</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {feria.nombre}
              </h3>
            </div>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin size={16} className="mr-2 text-orange-500" />
              <span className="text-sm">{feria.direccion}</span>
            </div>
            {feria.barrio && (
              <div className="text-xs text-gray-500 mb-1">
                {feria.barrio}, {feria.comuna}
              </div>
            )}
          </div>
          <button
            onClick={() => toggleFavorite(feria.id)}
            className={`p-2 rounded-full transition-colors ${isLiked
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Etiquetas principales */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {feria.tipo}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {feria.categoria}
          </Badge>
          {feria.distancia && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              {formatDistance(feria.distancia)}
            </Badge>
          )}
          {feria.horarioTipo && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              {feria.horarioTipo === 'mañana' ? '🌅 Mañana' :
                feria.horarioTipo === 'tarde' ? '🌞 Tarde' :
                  feria.horarioTipo === 'noche' ? '🌙 Noche' : '🕐 Todo el día'}
            </Badge>
          )}
        </div>

        {/* Información de horarios */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Clock size={14} className="mr-2" />
          <span>{feria.horarios.apertura} - {feria.horarios.cierre}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <Calendar size={14} className="mr-2" />
          <span>{feria.diasFuncionamiento.join(', ')}</span>
        </div>

        {/* Etiquetas especializadas */}
        {feria.etiquetas.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              <Tag size={12} className="mr-1" />
              Características:
            </div>
            <div className="flex flex-wrap gap-1">
              {feria.etiquetas.slice(0, 4).map((etiqueta, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`text-xs px-2 py-1 ${getTagColor(etiqueta)} flex items-center gap-1`}
                >
                  {getTagIcon(etiqueta)}
                  {etiqueta}
                </Badge>
              ))}
              {feria.etiquetas.length > 4 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{feria.etiquetas.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Productos destacados */}
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Productos:</div>
          <div className="flex flex-wrap gap-1">
            {feria.productos.slice(0, 3).map((producto, index) => (
              <span
                key={index}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
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
        </div>

        {/* Observaciones especiales */}
        {feria.observaciones && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-xs font-medium text-yellow-800 mb-1">💡 Nota:</div>
            <div className="text-xs text-yellow-700">{feria.observaciones}</div>
          </div>
        )}

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
