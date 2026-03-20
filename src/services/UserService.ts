import { supabase } from '../lib/supabase';
import type { Perfil, CreateUserInput } from '../types';

/**
 * Servicio para gestión de usuarios multi-tenant
 */
export class UserService {
  /**
   * Crea un nuevo usuario asociado a una empresa
   * @param data Datos del usuario a crear
   * @returns El perfil del usuario creado
   */
  async createUser(data: CreateUserInput): Promise<Perfil> {
    // Verificar que la empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, activa')
      .eq('id', data.empresa_id)
      .single();

    if (empresaError || !empresa) {
      throw new Error('Empresa no encontrada');
    }

    if (!empresa.activa) {
      throw new Error('No se pueden crear usuarios en empresas desactivadas');
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          rol: data.rol,
          empresa_id: data.empresa_id
        }
      }
    });

    if (authError) {
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // Crear perfil asociado
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        id: authData.user.id,
        nombre: data.nombre,
        rol: data.rol,
        empresa_id: data.empresa_id,
        intentos_fallidos: 0,
        bloqueado_hasta: null
      })
      .select()
      .single();

    if (perfilError) {
      throw new Error(`Error al crear perfil: ${perfilError.message}`);
    }

    return perfil;
  }

  /**
   * Actualiza el rol de un usuario
   * @param userId ID del usuario
   * @param rol Nuevo rol a asignar
   */
  async updateUserRole(userId: string, rol: Perfil['rol']): Promise<void> {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }
  }

  /**
   * Desactiva un usuario (marca como bloqueado indefinidamente)
   * @param userId ID del usuario a desactivar
   */
  async deactivateUser(userId: string): Promise<void> {
    // Marcar como bloqueado indefinidamente (año 2099)
    const { error } = await supabase
      .from('perfiles')
      .update({ 
        bloqueado_hasta: '2099-12-31T23:59:59Z'
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al desactivar usuario: ${error.message}`);
    }
  }

  /**
   * Reactiva un usuario previamente desactivado
   * @param userId ID del usuario a reactivar
   */
  async reactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('perfiles')
      .update({ 
        bloqueado_hasta: null,
        intentos_fallidos: 0
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al reactivar usuario: ${error.message}`);
    }
  }

  /**
   * Obtiene todos los usuarios de una empresa
   * @param empresaId ID de la empresa
   * @returns Lista de usuarios de la empresa
   */
  async getUsersByEmpresa(empresaId: string): Promise<Perfil[]> {
    const { data: usuarios, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nombre');

    if (error) {
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }

    return usuarios || [];
  }

  /**
   * Valida si un usuario tiene acceso a una empresa específica
   * @param userId ID del usuario
   * @param empresaId ID de la empresa
   * @returns true si el usuario tiene acceso, false en caso contrario
   */
  async validateUserAccess(userId: string, empresaId: string): Promise<boolean> {
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('empresa_id, rol')
      .eq('id', userId)
      .single();

    if (error || !perfil) {
      return false;
    }

    // Super Admin tiene acceso a todas las empresas
    if (perfil.rol === 'Super_Admin') {
      return true;
    }

    // Otros usuarios solo tienen acceso a su empresa
    return perfil.empresa_id === empresaId;
  }

  /**
   * Obtiene el perfil de un usuario por ID
   * @param userId ID del usuario
   * @returns El perfil del usuario
   */
  async getUserById(userId: string): Promise<Perfil> {
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }

    return perfil;
  }

  /**
   * Obtiene el perfil del usuario autenticado actualmente
   * @returns El perfil del usuario actual o null si no está autenticado
   */
  async getCurrentUser(): Promise<Perfil | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    return this.getUserById(user.id);
  }

  /**
   * Verifica si el usuario actual es Super Admin
   * @returns true si es Super Admin, false en caso contrario
   */
  async isSuperAdmin(): Promise<boolean> {
    const perfil = await this.getCurrentUser();
    return perfil?.rol === 'Super_Admin';
  }
}

// Exportar instancia singleton
export const userService = new UserService();
