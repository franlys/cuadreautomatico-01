import { useAuth } from './useAuth';
import type { NivelAutomatizacion } from '../types';

/**
 * Hook para gestión de permisos basados en rol y nivel de automatización
 * 
 * Valida permisos según:
 * - Rol del usuario (Super_Admin, Encargado_Almacén, Secretaria, etc.)
 * - Nivel de automatización de la empresa (parcial o completa)
 * 
 * Requirements: 11.1-11.7, 18.1-18.6
 */
export function usePermissions() {
  const { perfil } = useAuth();

  /**
   * Obtiene el nivel de automatización de la empresa del usuario
   * TODO: Implementar cuando se agregue empresa al perfil
   */
  const getNivelAutomatizacion = (): NivelAutomatizacion => {
    // Por ahora retornamos 'parcial' como default
    // Esto se actualizará cuando perfil incluya empresa con nivel_automatizacion
    return 'parcial';
  };

  const nivelAutomatizacion = getNivelAutomatizacion();

  /**
   * Verifica si el usuario tiene permiso para realizar una acción sobre un recurso
   * 
   * @param action - Acción a realizar (create, read, update, delete, close)
   * @param resource - Recurso sobre el que se realiza la acción
   * @returns true si tiene permiso, false en caso contrario
   */
  const hasPermission = (
    action: 'create' | 'read' | 'update' | 'delete' | 'close',
    resource: string
  ): boolean => {
    if (!perfil) return false;

    const rol = perfil.rol;

    // Super_Admin tiene acceso completo a todo
    if (rol === 'Super_Admin') return true;

    // Permisos para hojas de ruta (solo disponibles en automatización completa)
    if (resource === 'hoja_ruta') {
      // Si la empresa tiene automatización parcial, nadie puede acceder a hojas de ruta
      if (nivelAutomatizacion === 'parcial') return false;

      switch (rol) {
        case 'Encargado_Almacén':
          // Puede crear, editar y ver todas las hojas de ruta (Req 11.1)
          return ['create', 'read', 'update', 'delete'].includes(action);
        
        case 'Secretaria':
          // Puede crear y ver hojas de ruta sin poder cerrarlas (Req 11.2)
          return ['create', 'read'].includes(action);
        
        case 'Empleado_Ruta':
          // Puede ver únicamente sus hojas asignadas y modificar solo las no cerradas (Req 11.3, 11.4)
          // La validación de "sus hojas" y "no cerradas" debe hacerse en el componente/servicio
          return ['read', 'update'].includes(action);
        
        case 'Usuario_Completo':
          // Puede cerrar hojas de ruta (Req 11.5)
          return action === 'close' || action === 'read';
        
        case 'Dueño':
          // Puede ver todas las hojas sin poder modificarlas (Req 11.6)
          return action === 'read';
        
        default:
          return false;
      }
    }

    // Permisos para registros manuales (ingresos/egresos)
    if (resource === 'registro') {
      switch (rol) {
        case 'Usuario_Ingresos':
          return action === 'create' || action === 'read';
        
        case 'Usuario_Egresos':
          return action === 'create' || action === 'read';
        
        case 'Usuario_Completo':
          return ['create', 'read', 'update', 'delete'].includes(action);
        
        case 'Dueño':
          return action === 'read';
        
        default:
          return false;
      }
    }

    // Permisos para catálogos (empleados, rutas, conceptos)
    if (['empleado', 'ruta', 'concepto'].includes(resource)) {
      switch (rol) {
        case 'Usuario_Completo':
        case 'Encargado_Almacén':
        case 'Secretaria':
          return ['create', 'read', 'update', 'delete'].includes(action);
        
        case 'Dueño':
        case 'Usuario_Ingresos':
        case 'Usuario_Egresos':
        case 'Empleado_Ruta':
          return action === 'read';
        
        default:
          return false;
      }
    }

    // Permisos para folders diarios
    if (resource === 'folder_diario') {
      switch (rol) {
        case 'Usuario_Completo':
          return ['create', 'read', 'update', 'close'].includes(action);
        
        case 'Usuario_Ingresos':
        case 'Usuario_Egresos':
          return ['read', 'update'].includes(action);
        
        case 'Dueño':
          return action === 'read' || action === 'close';
        
        default:
          return false;
      }
    }

    // Permisos para depósitos
    if (resource === 'deposito') {
      switch (rol) {
        case 'Usuario_Completo':
          return ['create', 'read', 'update', 'delete'].includes(action);
        
        case 'Dueño':
          return action === 'read';
        
        default:
          return false;
      }
    }

    // Permisos para gestión de empresas (solo Super_Admin)
    if (resource === 'empresa') {
      return false; // Solo Super_Admin, ya validado arriba
    }

    // Permisos para gestión de usuarios
    if (resource === 'usuario') {
      return rol === 'Dueño';
    }

    // Por defecto, denegar acceso
    return false;
  };

  /**
   * Verifica si el usuario puede acceder a una ruta específica
   * 
   * @param routePath - Ruta a validar (ej: '/hojas-ruta', '/catalogos')
   * @returns true si puede acceder, false en caso contrario
   */
  const canAccessRoute = (routePath: string): boolean => {
    if (!perfil) return false;

    const rol = perfil.rol;

    // Ruta de dashboard Super Admin
    if (routePath === '/super-admin') {
      return rol === 'Super_Admin';
    }

    // Super_Admin puede acceder a todas las rutas
    if (rol === 'Super_Admin') return true;

    // Rutas de hojas de ruta (solo en automatización completa)
    if (routePath.startsWith('/hojas-ruta')) {
      if (nivelAutomatizacion === 'parcial') return false;
      
      return [
        'Encargado_Almacén',
        'Secretaria',
        'Empleado_Ruta',
        'Usuario_Completo',
        'Dueño'
      ].includes(rol);
    }

    // Ruta de dashboard Dueño
    if (routePath === '/dashboard') {
      return rol === 'Dueño';
    }

    // Rutas de catálogos
    if (routePath === '/catalogos') {
      return [
        'Usuario_Completo',
        'Encargado_Almacén',
        'Secretaria',
        'Dueño',
        'Usuario_Ingresos',
        'Usuario_Egresos',
        'Empleado_Ruta'
      ].includes(rol);
    }

    // Rutas de folder diario
    if (routePath === '/folder') {
      return [
        'Usuario_Completo',
        'Usuario_Ingresos',
        'Usuario_Egresos',
        'Dueño'
      ].includes(rol);
    }

    // Rutas de resumen semanal
    if (routePath === '/resumen') {
      return [
        'Usuario_Completo',
        'Usuario_Ingresos',
        'Usuario_Egresos',
        'Dueño'
      ].includes(rol);
    }

    // Rutas de depósitos
    if (routePath === '/depositos') {
      return ['Usuario_Completo', 'Dueño'].includes(rol);
    }

    // Por defecto, permitir acceso a ruta de inicio
    if (routePath === '/' || routePath === '/inicio') {
      return true;
    }

    return false;
  };

  /**
   * Obtiene las acciones disponibles para un recurso según el rol del usuario
   * Útil para mostrar/ocultar botones en la UI de forma dinámica
   * 
   * @param resource - Recurso para el que se consultan las acciones
   * @returns Array de acciones disponibles
   */
  const getAvailableActions = (
    resource: string
  ): Array<'create' | 'read' | 'update' | 'delete' | 'close'> => {
    const actions: Array<'create' | 'read' | 'update' | 'delete' | 'close'> = [];

    if (hasPermission('create', resource)) actions.push('create');
    if (hasPermission('read', resource)) actions.push('read');
    if (hasPermission('update', resource)) actions.push('update');
    if (hasPermission('delete', resource)) actions.push('delete');
    if (hasPermission('close', resource)) actions.push('close');

    return actions;
  };

  /**
   * Verifica si el usuario es Super Admin
   */
  const isSuperAdmin = (): boolean => {
    return perfil?.rol === 'Super_Admin';
  };

  /**
   * Verifica si la empresa tiene automatización completa habilitada
   */
  const hasAutomacionCompleta = (): boolean => {
    return nivelAutomatizacion === 'completa';
  };

  /**
   * Verifica si la empresa tiene automatización parcial
   */
  const hasAutomacionParcial = (): boolean => {
    return nivelAutomatizacion === 'parcial';
  };

  return {
    hasPermission,
    canAccessRoute,
    getAvailableActions,
    isSuperAdmin,
    hasAutomacionCompleta,
    hasAutomacionParcial,
    nivelAutomatizacion,
  };
}
