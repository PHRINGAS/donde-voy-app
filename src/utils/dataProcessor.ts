import { Feria, ETIQUETAS_SISTEMA } from '../types';

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
                'fiambre y lácteos': 'Fiambres y Lácteos',
                'Productos Organicos': 'Productos Orgánicos'
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

// Función para determinar el tipo de horario
const determineHorarioTipo = (horarios: { apertura: string; cierre: string }): 'mañana' | 'tarde' | 'noche' | 'todo_dia' => {
    const apertura = parseInt(horarios.apertura.split(':')[0]);
    const cierre = parseInt(horarios.cierre.split(':')[0]);

    if (apertura >= 6 && cierre <= 14) return 'mañana';
    if (apertura >= 14 && cierre <= 20) return 'tarde';
    if (apertura >= 20 || cierre <= 6) return 'noche';
    return 'todo_dia';
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

// Función para generar etiquetas especializadas
const generateEspecialidades = (productos: string[], observaciones: string | null): string[] => {
    const especialidades: string[] = [];
    const productosStr = productos.join(' ').toLowerCase();
    const observacionesStr = (observaciones || '').toLowerCase();

    // Detectar especialidades basadas en productos
    if (productosStr.includes('orgánico') || productosStr.includes('organico')) {
        especialidades.push('Orgánico');
    }

    if (productosStr.includes('local') || observacionesStr.includes('local')) {
        especialidades.push('Local');
    }

    if (productosStr.includes('tradicional') || observacionesStr.includes('tradicional')) {
        especialidades.push('Tradicional');
    }

    if (productosStr.includes('fresco') || productosStr.includes('fresco')) {
        especialidades.push('Fresco');
    }

    if (observacionesStr.includes('sabe la tierra')) {
        especialidades.push('Sustentable');
        especialidades.push('Orgánico');
    }

    if (observacionesStr.includes('ba market')) {
        especialidades.push('Moderno');
    }

    return especialidades;
};

// Función para generar servicios disponibles
const generateServicios = (observaciones: string | null, nombre: string): string[] => {
    const servicios: string[] = [];
    const observacionesStr = (observaciones || '').toLowerCase();
    const nombreStr = nombre.toLowerCase();

    // Detectar servicios basados en observaciones y nombre
    if (observacionesStr.includes('plaza') || observacionesStr.includes('parque')) {
        servicios.push('Área de Descanso');
        servicios.push('Estacionamiento');
    }

    if (observacionesStr.includes('sabe la tierra')) {
        servicios.push('Talleres');
        servicios.push('Sustentable');
    }

    if (observacionesStr.includes('ba market')) {
        servicios.push('Pago Digital');
        servicios.push('WiFi');
    }

    if (nombreStr.includes('folclore') || nombreStr.includes('tradicional')) {
        servicios.push('Música en Vivo');
        servicios.push('Actividades para Niños');
    }

    return servicios;
};

// Función para generar etiquetas generales
const generateEtiquetas = (productos: string[], tipo: string, especialidades: string[], servicios: string[]): string[] => {
    const etiquetas: string[] = [];

    // Agregar tipo como etiqueta
    etiquetas.push(tipo);

    // Agregar productos principales como etiquetas
    productos.slice(0, 3).forEach(producto => {
        if (ETIQUETAS_SISTEMA.productos.includes(producto)) {
            etiquetas.push(producto);
        }
    });

    // Agregar especialidades
    etiquetas.push(...especialidades);

    // Agregar servicios destacados
    servicios.slice(0, 2).forEach(servicio => {
        if (ETIQUETAS_SISTEMA.servicios.includes(servicio)) {
            etiquetas.push(servicio);
        }
    });

    return [...new Set(etiquetas)]; // Eliminar duplicados
};

export const processGeoJSONData = (geoJSONData: GeoJSONData): Feria[] => {
    return geoJSONData.features.map(feature => {
        const props = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;
        const productos = extractProductos(props.productos);
        const horarios = extractHorarios(props.horario);
        const tipo = determineTipo(productos);
        const horarioTipo = determineHorarioTipo(horarios);
        const especialidades = generateEspecialidades(productos, props.observacio);
        const servicios = generateServicios(props.observacio, props.nombre);
        const etiquetas = generateEtiquetas(productos, tipo, especialidades, servicios);

        return {
            id: props.id.toString(),
            nombre: props.nombre,
            direccion: props.direccion,
            lat: lat,
            lng: lng,
            tipo: tipo,
            diasFuncionamiento: [convertDia(props.dia)],
            horarios: horarios,
            productos: productos,
            descripcion: `${props.nombre} - ${props.barrio}, ${props.comuna}${props.observacio ? ` - ${props.observacio}` : ''}`,
            telefono: undefined,
            barrio: props.barrio,
            comuna: props.comuna,
            numero: props.numero,
            observaciones: props.observacio || undefined,
            etiquetas: etiquetas,
            horarioTipo: horarioTipo,
            frecuencia: 'semanal',
            especialidad: especialidades,
            servicios: servicios
        };
    });
};

// Función para cargar y procesar el archivo ferias_geo.json
export const loadFeriasFromGeoJSON = async (): Promise<Feria[]> => {
    try {
        const response = await fetch('/ferias_geo.json');
        const geoJSONData: GeoJSONData = await response.json();
        return processGeoJSONData(geoJSONData);
    } catch (error) {
        console.error('Error cargando datos de ferias:', error);
        return [];
    }
}; 