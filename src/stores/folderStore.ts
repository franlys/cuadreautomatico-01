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
  loading: boolean;
  error: string | null;
  
  // Acciones
  obtenerOCrearFolderActual: () => Promise<FolderDiario | null>;
  obtenerOCrearSemanaActual: () => Promise<SemanaLaboral | null>;
  cerrarFolder: (folderId: string) => Promise<void>;
  cargarFoldersSemana: (semanaId: string) => Promise<void>;
  refrescarFolderActual: () => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folderActual: null,
  semanaActual: null,
  folders: [],
  loading: false,
  error: null,

  obtenerOCrearSemanaActual: async () => {
    try {
      set({ loading: true, error: null });
      
      const hoy = new Date();
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
      
      // Primero obtener o crear la semana actual
      const semana = await get().obtenerOCrearSemanaActual();
      if (!semana) {
        throw new Error('No se pudo obtener la semana laboral');
      }
      
      const hoy = new Date();
      const fechaLaboral = obtenerFechaLaboral(hoy);
      
      const empresaId = getEmpresaId();

      // Buscar folder existente para esta fecha laboral
      let queryFolder = supabase
        .from('folders_diarios')
        .select('*')
        .eq('semana_laboral_id', semana.id)
        .eq('fecha_laboral', fechaLaboral);
      if (empresaId) queryFolder = queryFolder.eq('empresa_id', empresaId);
      const { data: folderExistente, error: buscarError } = await queryFolder.single();

      if (buscarError && buscarError.code !== 'PGRST116') {
        throw buscarError;
      }

      if (folderExistente) {
        set({ folderActual: folderExistente, loading: false });
        return folderExistente;
      }

      // Crear nuevo folder diario
      const insertFolder: any = {
        semana_laboral_id: semana.id,
        fecha_laboral: fechaLaboral,
        cerrado: false,
      };
      if (empresaId) insertFolder.empresa_id = empresaId;

      const { data: nuevoFolder, error: crearError } = await supabase
        .from('folders_diarios')
        .insert([insertFolder])
        .select()
        .single();
      
      if (crearError) throw crearError;
      
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
