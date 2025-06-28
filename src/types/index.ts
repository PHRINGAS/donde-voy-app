
export interface Feria {
  id: string;
  nombre: string;
  direccion: string;
  lat: number;
  lng: number;
  tipo: string;
  diasFuncionamiento: string[];
  horarios: {
    apertura: string;
    cierre: string;
  };
  productos: string[];
  descripcion?: string;
  telefono?: string;
  distancia?: number;
}

export interface User {
  id: string;
  favoritos: string[];
  notificaciones: {
    feriascercanas: boolean;
    distanciaMaxima: number; // en metros
    recordatorios: boolean;
  };
}

export interface SearchFilters {
  tipo?: string;
  dia?: string;
  horaApertura?: string;
  productos?: string[];
  direccion?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}
