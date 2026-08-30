import React, { useEffect, useCallback, useState } from 'react';
import { X, MapPin, Clock, Calendar, Heart, Bell, Tag, Star, Map, Info, PlayCircle } from 'lucide-react';
import { Feria, PlaceVideo } from '../types';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../integrations/supabase/client';
import { formatDistance } from '../utils/distanceCalculator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface FeriaDetailsProps {
  feria: Feria | null;
  isOpen: boolean;
  onClose: () => void;
  onReminder?: () => void;
}

const FeriaDetails: React.FC<FeriaDetailsProps> = ({ feria, isOpen, onClose, onReminder }) => {
  const { toggleFavorite, isFavorite } = useApp();
  const [videos, setVideos] = useState<PlaceVideo[]>([]);

  useEffect(() => {
    if (!isOpen || !feria) {
      setVideos([]);
      return;
    }
    let cancel = false;
    supabase
      .from('place_videos')
      .select('*')
      .eq('place_id', feria.id)
      .in('estado', ['approved', 'auto_matched'])
      .order('match_score', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!cancel) setVideos((data as PlaceVideo[]) ?? []);
      });
    return () => {
      cancel = true;
    };
  }, [isOpen, feria]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !feria) return null;

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
    if (feria.especialidad.includes(tag)) return <Star size={14} />;
    if (feria.servicios.includes(tag)) return <Map size={14} />;
    if (feria.productos.includes(tag)) return <Tag size={14} />;
    return null;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[1200] flex items-end md:items-center md:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={feria.nombre}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] md:max-h-[80vh] rounded-t-2xl md:rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{feria.nombre}</h2>
            <button
              onClick={onClose}
              aria-label="Cerrar detalles"
              className="p-2 hover:bg-orange-400 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center text-orange-100 mb-1">
            <MapPin size={16} className="mr-2" />
            <span className="text-sm">{feria.direccion}</span>
          </div>
          {feria.barrio && (
            <div className="text-xs text-orange-200">
              {feria.barrio}, {feria.comuna}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] md:max-h-[calc(80vh-120px)]">
          {/* Badges principales */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
              {feria.tipo}
            </Badge>
            {feria.distancia && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                📍 {formatDistance(feria.distancia)}
              </Badge>
            )}
            {feria.horarioTipo && (
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {feria.horarioTipo === 'mañana' ? '🌅 Mañana' :
                  feria.horarioTipo === 'tarde' ? '🌞 Tarde' :
                    feria.horarioTipo === 'noche' ? '🌙 Noche' : '🕐 Todo el día'}
              </Badge>
            )}
            {feria.frecuencia && (
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                {feria.frecuencia}
              </Badge>
            )}
          </div>

          {/* Videos */}
          {videos.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <PlayCircle size={18} className="text-red-500" />
                Videos ({videos.length})
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {videos.map((video) => (
                  <a
                    key={video.id}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-36 group"
                  >
                    <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100 aspect-video bg-gray-100">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.titulo ?? 'Video'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white uppercase font-bold">
                        {video.platform}
                      </span>
                    </div>
                    {video.canal && (
                      <p className="text-xs text-gray-500 mt-1 truncate">@{video.canal}</p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          {feria.descripcion && (
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">{feria.descripcion}</p>
            </div>
          )}

          <Separator className="my-4" />

          {/* Información de ubicación */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <MapPin size={18} className="mr-3 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Ubicación</h3>
            </div>
            <div className="ml-9 space-y-1">
              <p className="text-gray-600">{feria.direccion}</p>
              {feria.barrio && (
                <p className="text-sm text-gray-500">Barrio: {feria.barrio}</p>
              )}
              {feria.comuna && (
                <p className="text-sm text-gray-500">Comuna: {feria.comuna}</p>
              )}
            </div>
          </div>

          {/* Horarios */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Clock size={18} className="mr-3 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Horarios</h3>
            </div>
            <div className="ml-9 space-y-1">
              <p className="text-gray-600">
                {feria.horarios.apertura} - {feria.horarios.cierre}
              </p>
              <p className="text-sm text-gray-500">
                Tipo: {feria.horarioTipo === 'mañana' ? 'Horario matutino' :
                  feria.horarioTipo === 'tarde' ? 'Horario vespertino' :
                    feria.horarioTipo === 'noche' ? 'Horario nocturno' : 'Horario extendido'}
              </p>
            </div>
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

          {/* Etiquetas especializadas */}
          {feria.etiquetas.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Tag size={18} className="mr-3 text-orange-500" />
                <h3 className="font-semibold text-gray-800">Características</h3>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {feria.etiquetas.map((etiqueta, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`${getTagColor(etiqueta)} flex items-center gap-1`}
                  >
                    {getTagIcon(etiqueta)}
                    {etiqueta}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Especialidades */}
          {feria.especialidad.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Star size={18} className="mr-3 text-green-500" />
                <h3 className="font-semibold text-gray-800">Especialidades</h3>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {feria.especialidad.map((especialidad, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    {especialidad}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Servicios */}
          {feria.servicios.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Map size={18} className="mr-3 text-blue-500" />
                <h3 className="font-semibold text-gray-800">Servicios disponibles</h3>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {feria.servicios.map((servicio, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-200"
                  >
                    {servicio}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Productos */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Productos disponibles</h3>
            <div className="flex flex-wrap gap-2">
              {feria.productos.map((producto, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full"
                >
                  {producto}
                </span>
              ))}
            </div>
          </div>

          {/* Observaciones especiales */}
          {feria.observaciones && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center mb-2">
                <Info size={16} className="mr-2 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Información adicional</h4>
              </div>
              <p className="text-sm text-yellow-700">{feria.observaciones}</p>
            </div>
          )}

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
              className={`flex-1 ${isLiked
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
              onClick={() => onReminder?.()}
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
