import { Feria } from '../types';
import { loadFeriasFromGeoJSON } from '../utils/dataProcessor';

// Datos de muestra de ferias urbanas (fallback si fallan los datos unificados)
export const feriasData: Feria[] = [
  {
    id: '1',
    nombre: 'Feria de San Telmo',
    direccion: 'Plaza Dorrego, San Telmo',
    lat: -34.6211,
    lng: -58.3736,
    tipo: 'Artesanías',
    categoria: 'Ferias',
    diasFuncionamiento: ['Domingo'],
    horarios: { apertura: '10:00', cierre: '17:00' },
    productos: ['Artesanías', 'Antigüedades', 'Libros', 'Comida'],
    descripcion: 'Tradicional feria de antigüedades y artesanías',
    telefono: '+54 11 1234-5678',
    etiquetas: ['Artesanías', 'Tradicional'],
    horarioTipo: 'tarde',
    frecuencia: 'semanal',
    especialidad: ['Tradicional', 'Local'],
    servicios: ['Accesibilidad']
  },
  {
    id: '2',
    nombre: 'Feria de Mataderos',
    direccion: 'Av. Lisandro de la Torre y Av. de los Corrales',
    lat: -34.6560,
    lng: -58.5020,
    tipo: 'Folclore',
    categoria: 'Ferias',
    diasFuncionamiento: ['Domingo'],
    horarios: { apertura: '11:00', cierre: '19:00' },
    productos: ['Artesanías', 'Comida', 'Música', 'Danza'],
    descripcion: 'Feria de tradiciones folklóricas argentinas',
    etiquetas: ['Folclore', 'Tradicional'],
    horarioTipo: 'tarde',
    frecuencia: 'semanal',
    especialidad: ['Tradicional'],
    servicios: ['Música en Vivo', 'Actividades para Niños']
  },
  {
    id: '3',
    nombre: 'Mercado San Nicolás',
    direccion: 'Av. Corrientes 1247',
    lat: -34.6037,
    lng: -58.3816,
    tipo: 'Mercado',
    categoria: 'Mercados',
    diasFuncionamiento: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    horarios: { apertura: '08:00', cierre: '18:00' },
    productos: ['Frutas y Verduras', 'Carnes', 'Fiambres y Lácteos'],
    descripcion: 'Mercado tradicional de productos frescos',
    etiquetas: ['Mercado', 'Alimentos'],
    horarioTipo: 'mañana',
    frecuencia: 'semanal',
    especialidad: ['Fresco', 'Local'],
    servicios: ['Estacionamiento']
  },
  {
    id: '4',
    nombre: 'Feria de Recoleta',
    direccion: 'Plaza Francia, Recoleta',
    lat: -34.5885,
    lng: -58.3932,
    tipo: 'Artesanías',
    categoria: 'Ferias',
    diasFuncionamiento: ['Sábado', 'Domingo'],
    horarios: { apertura: '10:00', cierre: '18:00' },
    productos: ['Artesanías', 'Joyería', 'Cuero', 'Textiles'],
    descripcion: 'Feria de artesanos en el corazón de Recoleta',
    etiquetas: ['Artesanías'],
    horarioTipo: 'tarde',
    frecuencia: 'semanal',
    especialidad: ['Tradicional', 'Local'],
    servicios: ['Accesibilidad']
  },
  {
    id: '5',
    nombre: 'Mercado de Abasto',
    direccion: 'Carlos Gardel 3200',
    lat: -34.6036,
    lng: -58.4110,
    tipo: 'Mercado',
    categoria: 'Mercados',
    diasFuncionamiento: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    horarios: { apertura: '09:00', cierre: '20:00' },
    productos: ['Frutas y Verduras', 'Especias', 'Comida'],
    descripcion: 'Mercado histórico con gran variedad de productos',
    etiquetas: ['Mercado', 'Alimentos'],
    horarioTipo: 'todo_dia',
    frecuencia: 'semanal',
    especialidad: ['Local', 'Fresco'],
    servicios: ['Accesibilidad', 'Estacionamiento']
  }
];

// Función para obtener todas las ferias (muestra + GeoJSON)
export const getAllFerias = async (): Promise<Feria[]> => {
  try {
    const geoJSONFerias = await loadFeriasFromGeoJSON();

    // Combinar datos de muestra con datos del GeoJSON
    // Usar un Map para evitar duplicados por ID
    const allFeriasMap = new Map<string, Feria>();

    // Agregar datos de muestra primero
    feriasData.forEach(feria => {
      allFeriasMap.set(feria.id, feria);
    });

    // Agregar datos del GeoJSON, evitando duplicados
    geoJSONFerias.forEach(feria => {
      if (!allFeriasMap.has(feria.id)) {
        allFeriasMap.set(feria.id, feria);
      }
    });

    return Array.from(allFeriasMap.values());
  } catch (error) {
    console.error('Error cargando todas las ferias:', error);
    return feriasData; // Fallback a datos de muestra
  }
};
