import { Feria } from '../types';

interface GeoJSONFeature {
    type: string;
    properties: {
        id: number;
        nombre: string;
        dia: string;
        horario: string;
        numero: number;
        ubicacion: string;
        barrio: string;
        comuna: string;
        productos: string | null;
        calle: string | null;
        altura: number | null;
        calle2: string | null;
        direccion: string;
        observacio: string | null;
    };
    geometry: {
        type: string;
        coordinates: [number, number]; // [longitud, latitud]
    };
}

interface GeoJSONData {
    type: string;
    name: string;
    crs: any;
    features: GeoJSONFeature[];
}

// Función para convertir el formato de día
const convertDia = (dia: string): string => {
    const diaMap: { [key: string]: string } = {
        'LUNES': 'Lunes',
        'MARTES': 'Martes',
        'MIERCOLES': 'Miércoles',
        'JUEVES': 'Jueves',
        'VIERNES': 'Viernes',
        'SABADO': 'Sábado',
        'DOMINGO': 'Domingo'
    };
    return diaMap[dia] || dia;
};

// Función para extraer productos del string
const extractProductos = (productos: string | null): string[] => {
    if (!productos) return ['Productos varios'];

    return productos
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => {
            // Normalizar nombres de productos
            const productoMap: { [key: string]: string } = {
                'Frutihorticolas': 'Frutas y Verduras',
                'pescadería': 'Pescadería',
                'panadería': 'Panadería',
                'especies y legumbres': 'Especias y Legumbres',
                'granja y carnes': 'Carnes',
                'fiambres y lácteos': 'Fiambres y Lácteos',
                'plantas': 'Plantas',
                'mascotas': 'Mascotas',
                'limpieza': 'Limpieza',
                'pescaderia': 'Pescadería',
                'granja y carne': 'Carnes',
                'fiambre y lácteos': 'Fiambres y Lácteos'
            };
            return productoMap[p] || p;
        });
};

// Función para extraer horarios del string
const extractHorarios = (horario: string): { apertura: string; cierre: string } => {
    const match = horario.match(/de (\d{1,2}):(\d{2}) a (\d{1,2}):(\d{2})/);
    if (match) {
        return {
            apertura: `${match[1].padStart(2, '0')}:${match[2]}`,
            cierre: `${match[3].padStart(2, '0')}:${match[4]}`
        };
    }
    return { apertura: '08:00', cierre: '14:00' };
};

// Función para determinar el tipo de feria basado en productos
const determineTipo = (productos: string[]): string => {
    const productosStr = productos.join(' ').toLowerCase();

    if (productosStr.includes('frutas') || productosStr.includes('verduras') || productosStr.includes('hortícolas')) {
        return 'Mercado';
    }
    if (productosStr.includes('artesanías') || productosStr.includes('artesanias')) {
        return 'Artesanías';
    }
    if (productosStr.includes('folclore') || productosStr.includes('folklore')) {
        return 'Folclore';
    }
    if (productosStr.includes('gastronómico') || productosStr.includes('gastronomico')) {
        return 'Gastronómico';
    }

    return 'Mercado'; // Por defecto
};

export const processGeoJSONData = (geoJSONData: GeoJSONData): Feria[] => {
    return geoJSONData.features.map(feature => {
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const productos = extractProductos(props.productos);

        return {
            id: props.id.toString(),
            nombre: props.nombre,
            direccion: props.direccion,
            lat: lat,
            lng: lng,
            tipo: determineTipo(productos),
            diasFuncionamiento: [convertDia(props.dia)],
            horarios: extractHorarios(props.horario),
            productos: productos,
            descripcion: `${props.nombre} - ${props.barrio}, ${props.comuna}${props.observacio ? ` - ${props.observacio}` : ''}`,
            telefono: undefined
        };
    });
};

// Función para cargar y procesar el archivo ferias_geo.json
export const loadFeriasFromGeoJSON = async (): Promise<Feria[]> => {
    try {
        let geoJSONData: GeoJSONData;
        if (typeof window === 'undefined') {
            // Node.js: leer archivo localmente
            const fs = await import('fs/promises');
            const path = require('path');
            const filePath = path.resolve(process.cwd(), 'ferias_geo.json');
            const file = await fs.readFile(filePath, 'utf-8');
            geoJSONData = JSON.parse(file);
        } else {
            // Navegador: fetch
            const response = await fetch('/ferias_geo.json');
            geoJSONData = await response.json();
        }
        return processGeoJSONData(geoJSONData);
    } catch (error) {
        console.error('Error cargando datos de ferias:', error);
        return [];
    }
}; 