import { supabase } from './client';
import { Feria } from '../../types';
import type { TablesInsert, TablesUpdate } from './types';

export interface FeriasService {
    getAllFerias(): Promise<Feria[]>;
    getFeriasByLocation(lat: number, lng: number, radiusMeters: number): Promise<Feria[]>;
    getFeriasByTipo(tipo: string): Promise<Feria[]>;
    getFeriasByDia(dia: string): Promise<Feria[]>;
    searchFerias(query: string): Promise<Feria[]>;
    insertFeria(feria: TablesInsert<'ferias'>): Promise<Feria | null>;
    updateFeria(id: string, feria: TablesUpdate<'ferias'>): Promise<Feria | null>;
    deleteFeria(id: string): Promise<boolean>;
}

// Requiere haber aplicado 002_align_ferias_schema.sql (columnas categoria,
// etiquetas, horario_tipo, frecuencia, especialidad, servicios).
const normalizeHorarios = (value: unknown): { apertura: string; cierre: string } => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const o = value as Record<string, unknown>;
        if (typeof o.apertura === 'string' && typeof o.cierre === 'string') {
            return { apertura: o.apertura, cierre: o.cierre };
        }
    }
    return { apertura: '08:00', cierre: '18:00' };
};

interface FeriaDbRow {
    id: string;
    nombre: string;
    direccion: string;
    lat: number;
    lng: number;
    tipo: string;
    categoria?: string | null;
    dias_funcionamiento: string[];
    horarios: unknown;
    productos: string[];
    etiquetas?: string[] | null;
    horario_tipo?: string | null;
    frecuencia?: string | null;
    especialidad?: string[] | null;
    servicios?: string[] | null;
    descripcion?: string | null;
    telefono?: string | null;
    barrio?: string | null;
    comuna?: string | null;
    observaciones?: string | null;
}

const supabaseToFeria = (row: FeriaDbRow): Feria => ({
    id: row.id,
    nombre: row.nombre,
    direccion: row.direccion,
    lat: row.lat,
    lng: row.lng,
    tipo: row.tipo,
    categoria: row.categoria || 'Ferias',
    diasFuncionamiento: row.dias_funcionamiento ?? [],
    horarios: normalizeHorarios(row.horarios),
    productos: row.productos ?? [],
    etiquetas: row.etiquetas ?? [],
    horarioTipo: (row.horario_tipo as Feria['horarioTipo']) || 'todo_dia',
    frecuencia: (row.frecuencia as Feria['frecuencia']) || 'semanal',
    especialidad: row.especialidad ?? [],
    servicios: row.servicios ?? [],
    descripcion: row.descripcion || undefined,
    telefono: row.telefono || undefined,
    barrio: row.barrio || undefined,
    comuna: row.comuna || undefined,
    observaciones: row.observaciones || undefined,
    distancia: undefined // Se calcula dinámicamente en el cliente
});

const toFeriaOrNull = (data: unknown): Feria | null =>
    data ? supabaseToFeria(data as FeriaDbRow) : null;

export const feriasService: FeriasService = {
    async getAllFerias(): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .order('nombre');

            if (error) {
                console.error('Error fetching ferias:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getAllFerias:', error);
            return [];
        }
    },

    async getFeriasByLocation(lat: number, lng: number, radiusMeters: number): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .rpc('nearby_ferias', {
                    p_lat: lat,
                    p_lng: lng,
                    p_radius_m: radiusMeters
                });

            if (error) {
                console.error('Error fetching ferias by location:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getFeriasByLocation:', error);
            return [];
        }
    },

    async getFeriasByTipo(tipo: string): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .eq('tipo', tipo)
                .order('nombre');

            if (error) {
                console.error('Error fetching ferias by tipo:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getFeriasByTipo:', error);
            return [];
        }
    },

    async getFeriasByDia(dia: string): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .contains('dias_funcionamiento', [dia])
                .order('nombre');

            if (error) {
                console.error('Error fetching ferias by dia:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in getFeriasByDia:', error);
            return [];
        }
    },

    async searchFerias(query: string): Promise<Feria[]> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .select('*')
                .textSearch('nombre', query, {
                    type: 'websearch',
                    config: 'spanish'
                })
                .order('nombre');

            if (error) {
                console.error('Error searching ferias:', error);
                return [];
            }

            return data.map(supabaseToFeria);
        } catch (error) {
            console.error('Error in searchFerias:', error);
            return [];
        }
    },

    async insertFeria(feria: TablesInsert<'ferias'>): Promise<Feria | null> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .insert(feria)
                .select()
                .single();

            if (error) {
                console.error('Error inserting feria:', error);
                return null;
            }

            return toFeriaOrNull(data);
        } catch (error) {
            console.error('Error in insertFeria:', error);
            return null;
        }
    },

    async updateFeria(id: string, feria: TablesUpdate<'ferias'>): Promise<Feria | null> {
        try {
            const { data, error } = await supabase
                .from('ferias')
                .update(feria)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating feria:', error);
                return null;
            }

            return toFeriaOrNull(data);
        } catch (error) {
            console.error('Error in updateFeria:', error);
            return null;
        }
    },

    async deleteFeria(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('ferias')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting feria:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteFeria:', error);
            return false;
        }
    }
};
