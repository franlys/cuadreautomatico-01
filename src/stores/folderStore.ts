import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { FolderDiario, SemanaLaboral } from '../types';
import { obtenerFechaLaboral, obtenerRangoSemanaLaboral } from '../utils/fechaLaboral';

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
      
      // Buscar semana laboral existente
      const { data: semanaExistente, error: buscarError } = await supabase
        .from('semanas_laborales')
        .select('*')
        .eq('fecha_inicio', inicio)
        .eq('fecha_fin', fin)
        .single();
      
      if (buscarError && buscarError.code !== 'PGRST116') {
        throw buscarError;
      }
      
      if (semanaExistente) {
        set({ semanaActual: semanaExistente, loading: false });
        return semanaExistente;
      }
      
      // Crear nueva semana laboral
      const { data: nuevaSemana, error: crearError } = await supabase
        .from('semanas_laborales')
        .insert([{
          fecha_inicio: inicio,
          fecha_fin: fin,
        }])
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
      
      // Buscar folder existente para esta fecha laboral
      const { data: folderExistente, error: buscarError } = await supabase
        .from('folders_diarios')
        .select('*')
        .eq('semana_laboral_id', semana.id)
        .eq('fecha_laboral', fechaLaboral)
        .single();
      
      if (buscarError && buscarError.code !== 'PGRST116') {
        throw buscarError;
      }
      
      if (folderExistente) {
        set({ folderActual: folderExistente, loading: false });
        return folderExistente;
      }
      
      // Crear nuevo folder diario
      const { data: nuevoFolder, error: crearError } = await supabase
        .from('folders_diarios')
        .insert([{
          semana_laboral_id: semana.id,
          fecha_laboral: fechaLaboral,
          cerrado: false,
        }])
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
      
      const { data: folders, error: cargarError } = await supabase
        .from('folders_diarios')
        .select('*')
        .eq('semana_laboral_id', semanaId)
        .order('fecha_laboral', { ascending: true });
      
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
