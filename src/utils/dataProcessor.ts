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

// Tipos para los diferentes datos
interface MercadoData {
    NOMBRE: string;
    NOMBRE_MAP: string;
    UBICACION: string;
    BARRIO: string;
    LON: string;
    LAT: string;
}

interface FeriaCSVData {
    LAT: string;
    LNG: string;
    ID: string;
    OBJETO: string;
    TIPO: string;
    NOMBRE: string;
    DIAS: string;
    OBSERVACIO: string;
    DIRECCION: string;
    CALLE: string;
    CRUCE: string;
    DIREC_NORM: string;
    DIREC_ARCG: string;
    BARRIO: string;
    COMUNA: string;
}

interface EspacioCulturalData {
    id: string;
    nombre: string;
    tipo: string;
    categoria: string;
    direccion: string;
    lat: number;
    lng: number;
    barrio: string;
    comuna: string;
    descripcion: string;
    horarios: {
        apertura: string;
        cierre: string;
    };
    diasFuncionamiento: string[];
    servicios: string[];
    etiquetas: string[];
    telefono: string;
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

// Función para procesar datos de mercados CSV
export const processMercadosData = (csvData: string): Feria[] => {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';');
    const data = lines.slice(1);

    return data.map((line, index) => {
        const values = line.split(';');
        const mercado: any = {};
        headers.forEach((header, i) => {
            mercado[header] = values[i];
        });

        return {
            id: `mercado_${index + 1}`,
            nombre: mercado.NOMBRE || 'Mercado',
            direccion: mercado.UBICACION || '',
            lat: parseFloat(mercado.LAT?.replace(',', '.')) || 0,
            lng: parseFloat(mercado.LON?.replace(',', '.')) || 0,
            tipo: 'Mercado',
            categoria: 'Mercados',
            diasFuncionamiento: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            horarios: {
                apertura: '08:00',
                cierre: '18:00'
            },
            productos: ['Frutas y Verduras', 'Carnes', 'Fiambres y Lácteos', 'Pescadería', 'Panadería'],
            descripcion: `Mercado municipal en ${mercado.BARRIO}`,
            barrio: mercado.BARRIO || '',
            comuna: mercado.COMUNA || '',
            etiquetas: ['Mercado', 'Municipal', 'Alimentos', 'Fresco'],
            horarioTipo: 'mañana' as const,
            frecuencia: 'semanal' as const,
            especialidad: ['Local', 'Fresco', 'Tradicional'],
            servicios: ['Estacionamiento', 'Accesibilidad'],
            distancia: undefined
        };
    });
};

// Función para procesar datos de ferias CSV
export const processFeriasCSVData = (csvData: string): Feria[] => {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';');
    const data = lines.slice(1);

    return data.map((line, index) => {
        const values = line.split(';');
        const feria: any = {};
        headers.forEach((header, i) => {
            feria[header] = values[i];
        });

        // Mapear tipos de ferias a categorías coherentes
        const tipoMapping: { [key: string]: string } = {
            'MANUALIDADES Y ANTIGÜEDADES': 'Artesanías',
            'LIBROS USADOS': 'Libros',
            'ARTESANIAS': 'Artesanías',
            'ANTIGÜEDADES': 'Antigüedades',
            'FILATELIA Y NUMISMATICA': 'Coleccionismo'
        };

        const tipo = tipoMapping[feria.TIPO] || 'Feria';

        // Procesar días de funcionamiento
        const diasRaw = feria.DIAS || '';
        const diasMapping: { [key: string]: string[] } = {
            'SABADO, DOMINGOS Y FERIADOS': ['Sábado', 'Domingo'],
            'MARTES A DOMINGO': ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
            'MARTES A VIERNES': ['Martes', 'Miércoles', 'Jueves', 'Viernes'],
            'JUEVES Y VIERNES / SABADO Y DOMINGOS': ['Jueves', 'Viernes', 'Sábado', 'Domingo']
        };

        const diasFuncionamiento = diasMapping[diasRaw] || ['Sábado', 'Domingo'];

        let nombreProcesado = feria.NOMBRE || 'Feria';
        const originalNombre = feria.NOMBRE || '';
        if (originalNombre.toUpperCase().startsWith('FIAB')) {
            const match = originalNombre.match(/FIAB\s*(\d+)/i);
            if (match && match[1]) {
                nombreProcesado = `Feria ${match[1]}`;
            } else {
                // Fallback if FIAB but no number found, or a more generic name.
                // For now, let's use a more descriptive FIAB name if number extraction fails,
                // or simply "Feria Itinerante" and log it.
                console.warn(`FIAB item '${originalNombre}' could not extract number. Using generic name.`);
                nombreProcesado = `Feria Itinerante ${feria.ID || index + 1}`; // Make it somewhat unique
            }
        }

        return {
            id: `feria_${feria.ID || index + 1}`,
            nombre: nombreProcesado,
            direccion: feria.DIRECCION || '',
            lat: parseFloat(feria.LAT) || 0,
            lng: parseFloat(feria.LNG) || 0,
            tipo: tipo,
            categoria: 'Ferias',
            diasFuncionamiento,
            horarios: {
                apertura: '10:00',
                cierre: '18:00'
            },
            productos: tipo === 'Artesanías' ? ['Artesanías', 'Manualidades', 'Antigüedades'] :
                tipo === 'Libros' ? ['Libros', 'Revistas', 'Antigüedades'] :
                    ['Productos Varios'],
            descripcion: feria.OBSERVACIO || `Feria de ${tipo.toLowerCase()}`,
            barrio: feria.BARRIO || '',
            comuna: feria.COMUNA || '',
            etiquetas: [tipo, 'Feria', 'Público'],
            horarioTipo: 'tarde' as const,
            frecuencia: 'semanal' as const,
            especialidad: ['Tradicional', 'Local'],
            servicios: ['Accesibilidad'],
            distancia: undefined
        };
    });
};

// Función para procesar datos de espacios culturales
export const processEspaciosCulturalesData = (jsonData: EspacioCulturalData[]): Feria[] => {
    return jsonData.map((espacio) => {
        return {
            id: espacio.id,
            nombre: espacio.nombre,
            direccion: espacio.direccion,
            lat: espacio.lat,
            lng: espacio.lng,
            tipo: espacio.tipo,
            categoria: espacio.categoria,
            diasFuncionamiento: espacio.diasFuncionamiento,
            horarios: espacio.horarios,
            productos: espacio.etiquetas,
            descripcion: espacio.descripcion,
            telefono: espacio.telefono,
            barrio: espacio.barrio,
            comuna: espacio.comuna,
            etiquetas: espacio.etiquetas,
            horarioTipo: 'todo_dia' as const,
            frecuencia: 'semanal' as const,
            especialidad: ['Cultural', 'Histórico'],
            servicios: espacio.servicios,
            distancia: undefined
        };
    });
};

// Función principal para unificar todos los datos
export const unifyAllData = async (): Promise<Feria[]> => {
    try {
        // Cargar datos de mercados
        const mercadosResponse = await fetch('/mercados.csv');
        const mercadosCSV = await mercadosResponse.text();
        const mercados = processMercadosData(mercadosCSV);

        // Cargar datos de ferias CSV
        const feriasResponse = await fetch('/ferias.csv');
        const feriasCSV = await feriasResponse.text();
        const ferias = processFeriasCSVData(feriasCSV);

        // Cargar datos de espacios culturales
        const espaciosResponse = await fetch('/espacios-culturales.json');
        const espaciosData = await espaciosResponse.json();
        const espacios = processEspaciosCulturalesData(espaciosData);

        // Cargar datos de ferias GeoJSON
        console.log('🔄 Cargando datos desde ferias_geo.json...');
        const feriasGeoJson = await loadFeriasFromGeoJSON(); // Already defined in this file
        if (feriasGeoJson.length > 0) {
            console.log(`✅ Se cargaron ${feriasGeoJson.length} puntos desde ferias_geo.json`);
        } else {
            console.log('⚠️ No se encontraron datos en ferias_geo.json o hubo un error en su carga/procesamiento.');
        }

        // Unificar todos los datos usando un Map para deduplicar por ID
        const allDataMap = new Map<string, Feria>();

        const addBatchToMap = (batch: Feria[], batchName: string) => {
            let newItemsCount = 0;
            batch.forEach(item => {
                if (!item.id) {
                    console.warn(`Item sin ID en ${batchName}, se omitirá o se le asignará uno genérico si es necesario más adelante.`);
                    // Consider if items without ID should be skipped or given a generated one here
                }
                if (!allDataMap.has(item.id)) {
                    allDataMap.set(item.id, item);
                    newItemsCount++;
                } else {
                    // console.log(`ID duplicado omitido: ${item.id} de ${batchName}`);
                }
            });
            console.log(`ℹ️ ${newItemsCount} nuevos items agregados desde ${batchName}. Total en mapa: ${allDataMap.size}`);
        };

        addBatchToMap(mercados, 'mercados.csv');
        addBatchToMap(ferias, 'ferias.csv');
        addBatchToMap(espacios, 'espacios-culturales.json');
        addBatchToMap(feriasGeoJson, 'ferias_geo.json');

        const allData = Array.from(allDataMap.values());

        // Asignar IDs únicos si alguno aún no lo tiene (aunque el Map debería manejar IDs)
        // Esta parte podría ser redundante si todos los items procesados ya tienen IDs.
        return allData.map((item, index) => ({
            ...item,
            id: item.id || `item_unified_${index + 1}` // Fallback ID if still missing
        }));

    } catch (error) {
        console.error('Error al unificar todos los datos:', error);
        return [];
    }
};

// Función para obtener los 10 puntos más cercanos
export const getClosestPoints = (points: Feria[], userLat: number, userLng: number, count: number = 10): Feria[] => {
    return points
        .filter(point => point.distancia !== undefined)
        .sort((a, b) => (a.distancia || 0) - (b.distancia || 0))
        .slice(0, count);
};

// Función para filtrar por categoría
export const filterByCategory = (points: Feria[], category: string): Feria[] => {
    if (!category || category === 'Todos') {
        return points;
    }
    return points.filter(point => point.categoria === category);
};

// Distance calculation is handled by ../utils/distanceCalculator.ts