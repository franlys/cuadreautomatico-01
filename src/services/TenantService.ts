import { supabase } from '../lib/supabase';
import type { 
  Empresa, 
  CreateEmpresaInput, 
  UpdateEmpresaInput, 
  EmpresaStats 
} from '../types';

/**
 * Servicio para gestión de empresas (tenants) en la plataforma multi-tenant
 */
export class TenantService {
  /**
   * Crea una nueva empresa en la plataforma
   * @param data Datos de la empresa a crear
   * @returns La empresa creada
   */
  async createEmpresa(data: CreateEmpresaInput): Promise<Empresa> {
    const { data: empresa, error } = await supabase
      .from('empresas')
      .insert({
        nombre: data.nombre,
        nivel_automatizacion: data.nivel_automatizacion,
        logo_url: data.logo_url,
        limite_storage_mb: data.limite_storage_mb || 1000,
        activa: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear empresa: ${error.message}`);
    }

    return empresa;
  }

  /**
   * Actualiza los datos de una empresa existente
   * @param id ID de la empresa a actualizar
   * @param data Datos a actualizar
   * @returns La empresa actualizada
   */
  async updateEmpresa(id: string, data: UpdateEmpresaInput): Promise<Empresa> {
    const { data: empresa, error } = await supabase
      .from('empresas')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar empresa: ${error.message}`);
    }

    return empresa;
  }

  /**
   * Desactiva una empresa sin eliminar sus datos
   * @param id ID de la empresa a desactivar
   */
  async deactivateEmpresa(id: string): Promise<void> {
    const { error } = await supabase
      .from('empresas')
      .update({ 
        activa: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al desactivar empresa: ${error.message}`);
    }
  }

  /**
   * Reactiva una empresa previamente desactivada
   * @param id ID de la empresa a reactivar
   */
  async reactivateEmpresa(id: string): Promise<void> {
    const { error } = await supabase
      .from('empresas')
      .update({ 
        activa: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al reactivar empresa: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de una empresa
   * @param id ID de la empresa
   * @returns Estadísticas de la empresa
   */
  async getEmpresaStats(id: string): Promise<EmpresaStats> {
    // Obtener empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('nivel_automatizacion')
      .eq('id', id)
      .single();

    if (empresaError) {
      throw new Error(`Error al obtener empresa: ${empresaError.message}`);
    }

    // Contar usuarios
    const { count: totalUsuarios, error: usuariosError } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', id);

    if (usuariosError) {
      throw new Error(`Error al contar usuarios: ${usuariosError.message}`);
    }

    // Calcular storage usado
    const { data: evidencias, error: evidenciasError } = await supabase
      .from('evidencias')
      .select('tamano_bytes')
      .eq('empresa_id', id);

    if (evidenciasError) {
      throw new Error(`Error al calcular storage: ${evidenciasError.message}`);
    }

    const storageUsadoBytes = evidencias?.reduce((sum, e) => sum + (e.tamano_bytes || 0), 0) || 0;
    const storageUsadoMb = storageUsadoBytes / (1024 * 1024);

    // Obtener última actividad
    const { data: ultimaActividad } = await supabase
      .from('registros')
      .select('created_at')
      .eq('empresa_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      total_usuarios: totalUsuarios || 0,
      storage_usado_mb: Math.round(storageUsadoMb * 100) / 100,
      ultima_actividad: ultimaActividad ? new Date(ultimaActividad.created_at) : null,
      nivel_automatizacion: empresa.nivel_automatizacion
    };
  }

  /**
   * Cambia el contexto de empresa para Super Admin
   * @param empresaId ID de la empresa a la que cambiar contexto
   */
  async switchContext(empresaId: string): Promise<void> {
    // Verificar que el usuario es Super Admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (perfilError || perfil?.rol !== 'Super_Admin') {
      throw new Error('Solo Super Admin puede cambiar de contexto');
    }

    // Verificar que la empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      throw new Error('Empresa no encontrada');
    }

    // El cambio de contexto se maneja en el cliente mediante estado local
    // ya que RLS usa el empresa_id del perfil del usuario
  }

  /**
   * Obtiene todas las empresas (solo para Super Admin)
   * @returns Lista de todas las empresas
   */
  async getAllEmpresas(): Promise<Empresa[]> {
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre');

    if (error) {
      throw new Error(`Error al obtener empresas: ${error.message}`);
    }

    return empresas || [];
  }

  /**
   * Obtiene una empresa por ID
   * @param id ID de la empresa
   * @returns La empresa solicitada
   */
  async getEmpresaById(id: string): Promise<Empresa> {
    const { data: empresa, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener empresa: ${error.message}`);
    }

    return empresa;
  }

  /**
   * Cambia el nivel de automatización de una empresa
   * @param empresaId ID de la empresa
   * @param nuevoNivel Nuevo nivel de automatización
   * @param usuarioId ID del usuario que realiza el cambio
   * @returns La empresa actualizada
   */
  async changeAutomationLevel(
    empresaId: string, 
    nuevoNivel: 'parcial' | 'completa',
    usuarioId: string
  ): Promise<Empresa> {
    // Obtener empresa actual
    const empresaActual = await this.getEmpresaById(empresaId);
    
    if (empresaActual.nivel_automatizacion === nuevoNivel) {
      throw new Error('La empresa ya tiene ese nivel de automatización');
    }

    // Actualizar nivel
    const empresaActualizada = await this.updateEmpresa(empresaId, {
      nivel_automatizacion: nuevoNivel
    });

    // Registrar cambio en audit_logs
    try {
      await supabase.from('audit_logs').insert({
        empresa_id: empresaId,
        usuario_id: usuarioId,
        accion: 'cambio_nivel_automatizacion',
        recurso: 'empresas',
        detalles: {
          nivel_anterior: empresaActual.nivel_automatizacion,
          nivel_nuevo: nuevoNivel,
          empresa_nombre: empresaActual.nombre
        },
        exitoso: true
      });
    } catch (error) {
      console.error('Error al registrar en audit_logs:', error);
      // No lanzar error para no interrumpir el flujo
    }

    return empresaActualizada;
  }
}

// Exportar instancia singleton
export const tenantService = new TenantService();
