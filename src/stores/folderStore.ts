import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import type { FolderDiario, SemanaLaboral } from '../types';
import { obtenerFechaLaboral, obtenerRangoSemanaLaboral } from '../utils/fechaLaboral';

/** Obtiene empresa_id del perfil activo en el store de auth */
function getEmpresaId(): string | undefined {
  return useAuthStore.getState().perfil?.empresa_id ?? undefined;
}

interface FolderState {
  folderActual: FolderDiario | null;
  semanaActual: SemanaLaboral | null;
  folders: FolderDiario[];
  foldersRecientes: FolderDiario[];
  loading: boolean;
  error: string | null;

  // Acciones
  obtenerOCrearFolderActual: () => Promise<FolderDiario | null>;
  obtenerOCrearSemanaActual: (fecha?: Date) => Promise<SemanaLaboral | null>;
  cerrarFolder: (folderId: string) => Promise<void>;
  cargarFoldersSemana: (semanaId: string) => Promise<void>;
  cargarFoldersRecientes: () => Promise<void>;
  seleccionarFolder: (folder: FolderDiario) => void;
  refrescarFolderActual: () => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folderActual: null,
  semanaActual: null,
  folders: [],
  foldersRecientes: [],
  loading: false,
  error: null,

  obtenerOCrearSemanaActual: async (fecha?: Date) => {
    try {
      set({ loading: true, error: null });

      const hoy = fecha ?? new Date();
      const { inicio, fin } = obtenerRangoSemanaLaboral(hoy);
      
      const empresaId = getEmpresaId();

      // Buscar semana laboral existente
      let queryBuscar = supabase
        .from('semanas_laborales')
        .select('*')
        .eq('fecha_inicio', inicio)
        .eq('fecha_fin', fin);
      if (empresaId) queryBuscar = queryBuscar.eq('empresa_id', empresaId);
      const { data: semanaExistente, error: buscarError } = await queryBuscar.single();

      if (buscarError && buscarError.code !== 'PGRST116') {
        throw buscarError;
      }

      if (semanaExistente) {
        set({ semanaActual: semanaExistente, loading: false });
        return semanaExistente;
      }

      // Crear nueva semana laboral
      const insertSemana: any = { fecha_inicio: inicio, fecha_fin: fin };
      if (empresaId) insertSemana.empresa_id = empresaId;

      const { data: nuevaSemana, error: crearError } = await supabase
        .from('semanas_laborales')
        .insert([insertSemana])
        .select()
        .single();
      
      if (crearError) throw crearError;
      
      set({ semanaActual: nuevaSemana, loading: false });
      return nuevaSemana;
      
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  obtenerOCrearFolderActual: async () => {
    try {
      set({ loading: true, error: null });

      const hoy = new Date();
      const fechaLaboral = obtenerFechaLaboral(hoy);

      const empresaId = getEmpresaId();

      // Buscar folder por fecha_laboral + empresa_id (sin filtrar por semana
      // para evitar conflicto cuando el lunes busca el sábado de la semana anterior)
      let queryFolder = supabase
        .from('folders_diarios')
        .select('*')
        .eq('fecha_laboral', fechaLaboral);
      if (empresaId) queryFolder = queryFolder.eq('empresa_id', empresaId);
      const { data: folderExistente, error: buscarError } = await queryFolder
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (buscarError) throw buscarError;

      if (folderExistente) {
        set({ folderActual: folderExistente, loading: false });
        return folderExistente;
      }

      // Calcular la semana que corresponde a fechaLaboral (no a "hoy")
      // Importante: el lunes usa la semana del sábado anterior
      const fechaLaboralDate = new Date(fechaLaboral + 'T12:00:00');
      const semanaCorrecta = await get().obtenerOCrearSemanaActual(fechaLaboralDate);
      if (!semanaCorrecta) throw new Error('No se pudo obtener la semana laboral');

      // Crear nuevo folder diario
      const insertFolder: any = {
        semana_laboral_id: semanaCorrecta.id,
        fecha_laboral: fechaLaboral,
        cerrado: false,
      };
      if (empresaId) insertFolder.empresa_id = empresaId;

      const { data: nuevoFolder, error: crearError } = await supabase
        .from('folders_diarios')
        .insert([insertFolder])
        .select()
        .single();

      // Si hay duplicate key, alguien más lo creó en paralelo — obtener el existente
      if (crearError) {
        if (crearError.code === '23505') {
          let qRetry = supabase
            .from('folders_diarios')
            .select('*')
            .eq('fecha_laboral', fechaLaboral);
          if (empresaId) qRetry = qRetry.eq('empresa_id', empresaId);
          const { data: existente } = await qRetry.limit(1).maybeSingle();
          if (existente) {
            set({ folderActual: existente, loading: false });
            return existente;
          }
        }
        throw crearError;
      }

      set({ folderActual: nuevoFolder, loading: false });
      return nuevoFolder;
      
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  cerrarFolder: async (folderId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error: cerrarError } = await supabase
        .from('folders_diarios')
        .update({ cerrado: true })
        .eq('id', folderId);
      
      if (cerrarError) throw cerrarError;
      
      // Refrescar folder actual
      await get().refrescarFolderActual();
      
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  cargarFoldersSemana: async (semanaId: string) => {
    try {
      set({ loading: true, error: null });
      
      const empresaId = getEmpresaId();
      let queryCarga = supabase
        .from('folders_diarios')
        .select('*')
        .eq('semana_laboral_id', semanaId)
        .order('fecha_laboral', { ascending: true });
      if (empresaId) queryCarga = queryCarga.eq('empresa_id', empresaId);
      const { data: folders, error: cargarError } = await queryCarga;
      
      if (cargarError) throw cargarError;
      
      set({ folders: folders || [], loading: false });
      
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  cargarFoldersRecientes: async () => {
    try {
      const empresaId = getEmpresaId();
      let q = supabase
        .from('folders_diarios')
        .select('*')
        .order('fecha_laboral', { ascending: false })
        .limit(30);
      // Incluir también folders con empresa_id NULL (datos migrados antes del fix)
      if (empresaId) {
        q = q.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      }
      const { data, error } = await q;
      if (error) throw error;
      // Filtrar duplicados: si hay folder con empresa_id y otro sin él para la misma fecha,
      // preferir el que tiene empresa_id
      const porFecha = new Map<string, typeof data[0]>();
      for (const f of data || []) {
        const existing = porFecha.get(f.fecha_laboral);
        if (!existing || (f.empresa_id && !existing.empresa_id)) {
          porFecha.set(f.fecha_laboral, f);
        }
      }
      set({ foldersRecientes: Array.from(porFecha.values()).sort(
        (a, b) => b.fecha_laboral.localeCompare(a.fecha_laboral)
      )});
    } catch (error: any) {
      console.error('Error al cargar folders recientes:', error);
    }
  },

  seleccionarFolder: (folder: FolderDiario) => {
    set({ folderActual: folder });
  },

  refrescarFolderActual: async () => {
    const { folderActual } = get();
    if (!folderActual) return;
    
    try {
      const { data: folder, error } = await supabase
        .from('folders_diarios')
        .select('*')
        .eq('id', folderActual.id)
        .single();
      
      if (error) throw error;
      
      set({ folderActual: folder });
      
    } catch (error: any) {
      console.error('Error al refrescar folder:', error);
    }
  },
}));
