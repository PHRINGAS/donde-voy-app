
import { Feria } from '../types';

// Datos de muestra de ferias urbanas
export const feriasData: Feria[] = [
  {
    id: '1',
    nombre: 'Feria de San Telmo',
    direccion: 'Plaza Dorrego, San Telmo',
    lat: -34.6211,
    lng: -58.3736,
    tipo: 'Artesanías',
    diasFuncionamiento: ['Domingo'],
    horarios: { apertura: '10:00', cierre: '17:00' },
    productos: ['Artesanías', 'Antigüedades', 'Libros', 'Comida'],
    descripcion: 'Tradicional feria de antigüedades y artesanías',
    telefono: '+54 11 1234-5678'
  },
  {
    id: '2',
    nombre: 'Feria de Mataderos',
    direccion: 'Av. Lisandro de la Torre y Av. de los Corrales',
    lat: -34.6560,
    lng: -58.5020,
    tipo: 'Folclore',
    diasFuncionamiento: ['Domingo'],
    horarios: { apertura: '11:00', cierre: '19:00' },
    productos: ['Artesanías', 'Comida típica', 'Música', 'Danza'],
    descripcion: 'Feria de tradiciones folklóricas argentinas'
  },
  {
    id: '3',
    nombre: 'Mercado San Nicolás',
    direccion: 'Av. Corrientes 1247',
    lat: -34.6037,
    lng: -58.3816,
    tipo: 'Mercado',
    diasFuncionamiento: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    horarios: { apertura: '08:00', cierre: '18:00' },
    productos: ['Frutas', 'Verduras', 'Carnes', 'Lácteos'],
    descripcion: 'Mercado tradicional de productos frescos'
  },
  {
    id: '4',
    nombre: 'Feria de Recoleta',
    direccion: 'Plaza Francia, Recoleta',
    lat: -34.5885,
    lng: -58.3932,
    tipo: 'Artesanías',
    diasFuncionamiento: ['Sábado', 'Domingo'],
    horarios: { apertura: '10:00', cierre: '18:00' },
    productos: ['Artesanías', 'Joyería', 'Cuero', 'Textiles'],
    descripcion: 'Feria de artesanos en el corazón de Recoleta'
  },
  {
    id: '5',
    nombre: 'Mercado de Abasto',
    direccion: 'Carlos Gardel 3200',
    lat: -34.6036,
    lng: -58.4110,
    tipo: 'Mercado',
    diasFuncionamiento: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    horarios: { apertura: '09:00', cierre: '20:00' },
    productos: ['Frutas', 'Verduras', 'Especias', 'Comida internacional'],
    descripcion: 'Mercado histórico con gran variedad de productos'
  }
];

export const tiposDeFeria = [
  'Artesanías',
  'Mercado',
  'Folclore',
  'Gastronómico',
  'Libros',
  'Ropa'
];

export const diasSemana = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
];

export const tiposProductos = [
  'Artesanías', 'Antigüedades', 'Libros', 'Comida', 'Frutas', 'Verduras',
  'Carnes', 'Lácteos', 'Joyería', 'Cuero', 'Textiles', 'Especias', 'Música', 'Danza'
];
