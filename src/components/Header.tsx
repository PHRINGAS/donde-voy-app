import React, { useState } from 'react';
import { Search, MapPin, Menu, Info } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ETIQUETAS_SISTEMA } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface HeaderProps {
  onSearchClick: () => void;
  onLocationClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchClick, onLocationClick }) => {
  const { filteredFerias, ferias } = useApp();
  const [showStats, setShowStats] = useState(false);

  // Calcular estadísticas
  const totalFerias = ferias.length;
  const feriasFiltradas = filteredFerias.length;
  const barriosUnicos = new Set(ferias.map(f => f.barrio).filter(Boolean)).size;
  const comunasUnicas = new Set(ferias.map(f => f.comuna).filter(Boolean)).size;
  const tiposUnicos = new Set(ferias.map(f => f.tipo)).size;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {/* Typography updated: larger, tighter tracking, semibold, responsive size */}
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-orange-600">
                🤔 Donde Voy?
              </h1>
            </div>
            {/* Subtitle removed */}
          </div>

          {/* Estadísticas rápidas REMOVED */}
          {/*
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <MapPin size={14} className="mr-1" />
              {feriasFiltradas} de {totalFerias} lugares
            </span>
            <span>•</span>
            <span>{barriosUnicos} barrios</span>
            <span>•</span>
            <span>{comunasUnicas} comunas</span>
            <span>•</span>
            <span>{tiposUnicos} tipos</span>
          </div>
           */}

          {/* Botones de acción */}
          <div className="flex items-center space-x-2">
            {/* Botón de estadísticas */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                >
                  <Info size={16} />
                  <span className="hidden md:inline">Estadísticas</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>📊 Estadísticas de Destinos</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Resumen general */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{totalFerias}</div>
                      <div className="text-sm text-gray-600">Total Destinos</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{barriosUnicos}</div>
                      <div className="text-sm text-gray-600">Barrios</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{comunasUnicas}</div>
                      <div className="text-sm text-gray-600">Comunas</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{tiposUnicos}</div>
                      <div className="text-sm text-gray-600">Tipos</div>
                    </div>
                  </div>

                  {/* Tipos de lugares */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Tipos de Destinos Disponibles</h3>
                    <div className="flex flex-wrap gap-2">
                      {ETIQUETAS_SISTEMA.tipos.map(tipo => {
                        const count = ferias.filter(f => f.tipo === tipo).length;
                        return (
                          <Badge key={tipo} variant="outline" className="bg-orange-50 text-orange-700">
                            {tipo} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Productos más comunes */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Productos Más Comunes</h3>
                    <div className="flex flex-wrap gap-2">
                      {ETIQUETAS_SISTEMA.productos.slice(0, 10).map(producto => {
                        const count = ferias.filter(f =>
                          f.productos.some(p => p.toLowerCase().includes(producto.toLowerCase()))
                        ).length;
                        return (
                          <Badge key={producto} variant="outline" className="bg-purple-50 text-purple-700">
                            {producto} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Especialidades Disponibles</h3>
                    <div className="flex flex-wrap gap-2">
                      {ETIQUETAS_SISTEMA.especialidades.map(especialidad => {
                        const count = ferias.filter(f =>
                          f.especialidad.some(e => e.toLowerCase().includes(especialidad.toLowerCase()))
                        ).length;
                        return (
                          <Badge key={especialidad} variant="outline" className="bg-green-50 text-green-700">
                            {especialidad} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Servicios */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Servicios Ofrecidos</h3>
                    <div className="flex flex-wrap gap-2">
                      {ETIQUETAS_SISTEMA.servicios.map(servicio => {
                        const count = ferias.filter(f =>
                          f.servicios.some(s => s.toLowerCase().includes(servicio.toLowerCase()))
                        ).length;
                        return (
                          <Badge key={servicio} variant="outline" className="bg-blue-50 text-blue-700">
                            {servicio} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Barrios más populares */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Barrios con Más Destinos</h3>
                    <div className="flex flex-wrap gap-2">
                      {ETIQUETAS_SISTEMA.barrios.slice(0, 15).map(barrio => {
                        const count = ferias.filter(f => f.barrio === barrio).length;
                        if (count === 0) return null;
                        return (
                          <Badge key={barrio} variant="outline" className="bg-gray-50 text-gray-700">
                            {barrio} ({count})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Botón de ubicación */}
            <Button
              onClick={onLocationClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MapPin size={16} />
              <span className="hidden md:inline">Mi ubicación</span>
            </Button>

            {/* Botón de búsqueda */}
            <Button
              onClick={onSearchClick}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Search size={16} />
              <span className="hidden md:inline ml-2">Buscar</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
