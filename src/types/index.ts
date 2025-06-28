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
  barrio?: string;
  comuna?: string;
  numero?: number;
  observaciones?: string;
  etiquetas: string[];
  horarioTipo: 'mañana' | 'tarde' | 'noche' | 'todo_dia';
  frecuencia: 'semanal' | 'quincenal' | 'mensual';
  especialidad: string[];
  servicios: string[];
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
  barrio?: string[];
  comuna?: string[];
  etiquetas?: string[];
  horarioTipo?: 'mañana' | 'tarde' | 'noche' | 'todo_dia';
  especialidad?: string[];
  servicios?: string[];
  distanciaMaxima?: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface EtiquetasSistema {
  tipos: string[];
  productos: string[];
  especialidades: string[];
  servicios: string[];
  barrios: string[];
  comunas: string[];
  horarios: string[];
  frecuencias: string[];
}

export const ETIQUETAS_SISTEMA: EtiquetasSistema = {
  tipos: [
    'Mercado',
    'Artesanías',
    'Folclore',
    'Gastronómico',
    'Orgánico',
    'Sustentable',
    'Tradicional',
    'Moderno'
  ],
  productos: [
    'Frutas y Verduras',
    'Pescadería',
    'Panadería',
    'Especias y Legumbres',
    'Carnes',
    'Fiambres y Lácteos',
    'Plantas',
    'Mascotas',
    'Limpieza',
    'Productos Orgánicos',
    'Artesanías',
    'Antigüedades',
    'Libros',
    'Comida',
    'Joyería',
    'Cuero',
    'Textiles',
    'Especias',
    'Música',
    'Danza'
  ],
  especialidades: [
    'Orgánico',
    'Sin TACC',
    'Vegano',
    'Vegetariano',
    'Local',
    'Sustentable',
    'Tradicional',
    'Gourmet',
    'Casero',
    'Fresco',
    'De Temporada'
  ],
  servicios: [
    'Delivery',
    'Reserva',
    'Pago Digital',
    'Estacionamiento',
    'Accesibilidad',
    'WiFi',
    'Baños',
    'Área de Descanso',
    'Talleres',
    'Música en Vivo',
    'Actividades para Niños'
  ],
  barrios: [
    'Villa Crespo',
    'Chacarita',
    'Saavedra',
    'Almagro',
    'Caballito',
    'Nuñez',
    'Flores',
    'Belgrano',
    'Recoleta',
    'Palermo',
    'San Telmo',
    'Mataderos',
    'Balvanera',
    'Monserrat',
    'San Nicolás',
    'Barracas',
    'Villa Pueyrredón',
    'Villa Devoto',
    'Versalles',
    'Villa Ortuzar',
    'Nueva Pompeya',
    'Parque Patricios',
    'Boedo',
    'Colegiales',
    'Villa Santa Rita'
  ],
  comunas: [
    'Comuna 1',
    'Comuna 2',
    'Comuna 3',
    'Comuna 4',
    'Comuna 5',
    'Comuna 6',
    'Comuna 7',
    'Comuna 8',
    'Comuna 9',
    'Comuna 10',
    'Comuna 11',
    'Comuna 12',
    'Comuna 13',
    'Comuna 14',
    'Comuna 15'
  ],
  horarios: [
    'Mañana (8:00-14:00)',
    'Tarde (14:00-20:00)',
    'Noche (20:00-00:00)',
    'Todo el día',
    'Fines de semana',
    'Días hábiles'
  ],
  frecuencias: [
    'Semanal',
    'Quincenal',
    'Mensual',
    'Eventual'
  ]
};
