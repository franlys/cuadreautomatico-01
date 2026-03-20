import { supabase } from '../lib/supabase';
import type { AuditLog } from '../types';

/**
 * Input para registrar una acción en el log de auditoría
 */
export interface LogActionInput {
  accion: string;
  recurso: string;
  detalles?: Record<string, any>;
  exitoso: boolean;
}

/**
 * Filtros para consultar logs de auditoría
 */
export interface AuditLogFilters {
  empresa_id?: string;
  usuario_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  accion?: string;
  recurso?: string;
  exitoso?: boolean;
}

/**
 * Servicio para gestión de logs de auditoría
 */
export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   * @param input Datos de la acción a registrar
   */
  async logAction(input: LogActionInput): Promise<void> {
    try {
      // Obtener información del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      let empresa_id: string | undefined;
      let usuario_id: string | undefined;

      if (user) {
        usuario_id = user.id;
        
        // Obtener empresa_id del usuario
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('empresa_id')
          .eq('id', user.id)
          .single();

        empresa_id = perfil?.empresa_id;
      }

      // Obtener información de la solicitud (si está disponible)
      const ip_address = undefined; // En navegador no tenemos acceso directo a IP
      const user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

      // Insertar log de auditoría
      await supabase
        .from('audit_logs')
        .insert({
          empresa_id,
          usuario_id,
          accion: input.accion,
          recurso: input.recurso,
          detalles: input.detalles,
          ip_address,
          user_agent,
          exitoso: input.exitoso
        });
    } catch (error) {
      // No lanzar error para no interrumpir el flujo principal
      console.error('Error al registrar log de auditoría:', error);
    }
  }

  /**
   * Registra una violación de seguridad (intento de acceso no autorizado)
   * @param recurso Recurso al que se intentó acceder
   * @param detalles Detalles adicionales del intento
   */
  async logSecurityViolation(
    recurso: string,
    detalles?: Record<string, any>
  ): Promise<void> {
    await this.logAction({
      accion: 'SECURITY_VIOLATION',
      recurso,
      detalles: {
        ...detalles,
        timestamp: new Date().toISOString(),
        tipo: 'acceso_no_autorizado'
      },
      exitoso: false
    });
  }

  /**
   * Obtiene logs de auditoría con filtros opcionales
   * @param filters Filtros para la consulta
   * @param limit Límite de registros a retornar (default: 100)
   * @param offset Offset para paginación (default: 0)
   * @returns Lista de logs de auditoría
   */
  async getAuditLogs(
    filters?: AuditLogFilters,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (filters?.empresa_id) {
      query = query.eq('empresa_id', filters.empresa_id);
    }

    if (filters?.usuario_id) {
      query = query.eq('usuario_id', filters.usuario_id);
    }

    if (filters?.accion) {
      query = query.eq('accion', filters.accion);
    }

    if (filters?.recurso) {
      query = query.eq('recurso', filters.recurso);
    }

    if (filters?.exitoso !== undefined) {
      query = query.eq('exitoso', filters.exitoso);
    }

    if (filters?.fecha_inicio) {
      query = query.gte('created_at', filters.fecha_inicio);
    }

    if (filters?.fecha_fin) {
      query = query.lte('created_at', filters.fecha_fin);
    }

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(`Error al obtener logs de auditoría: ${error.message}`);
    }

    return logs || [];
  }

  /**
   * Exporta logs de auditoría en formato CSV
   * @param filters Filtros para la consulta
   * @returns String con el contenido CSV
   */
  async exportAuditLogs(filters?: AuditLogFilters): Promise<string> {
    // Obtener todos los logs que coincidan con los filtros (sin límite)
    const logs = await this.getAuditLogs(filters, 10000, 0);

    // Generar CSV
    const headers = [
      'Fecha',
      'Empresa ID',
      'Usuario ID',
      'Acción',
      'Recurso',
      'Exitoso',
      'IP Address',
      'User Agent',
      'Detalles'
    ];

    const rows = logs.map(log => [
      log.created_at,
      log.empresa_id || '',
      log.usuario_id || '',
      log.accion,
      log.recurso,
      log.exitoso ? 'Sí' : 'No',
      log.ip_address || '',
      log.user_agent || '',
      log.detalles ? JSON.stringify(log.detalles) : ''
    ]);

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escapar comillas y envolver en comillas si contiene comas
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  /**
   * Obtiene estadísticas de auditoría para una empresa
   * @param empresaId ID de la empresa
   * @param dias Número de días hacia atrás para calcular estadísticas (default: 30)
   * @returns Estadísticas de auditoría
   */
  async getAuditStats(empresaId: string, dias: number = 30): Promise<{
    total_acciones: number;
    acciones_exitosas: number;
    acciones_fallidas: number;
    violaciones_seguridad: number;
    acciones_por_tipo: Record<string, number>;
  }> {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('accion, exitoso')
      .eq('empresa_id', empresaId)
      .gte('created_at', fechaInicio.toISOString());

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    const total_acciones = logs?.length || 0;
    const acciones_exitosas = logs?.filter(l => l.exitoso).length || 0;
    const acciones_fallidas = total_acciones - acciones_exitosas;
    const violaciones_seguridad = logs?.filter(l => l.accion === 'SECURITY_VIOLATION').length || 0;

    // Contar acciones por tipo
    const acciones_por_tipo: Record<string, number> = {};
    logs?.forEach(log => {
      acciones_por_tipo[log.accion] = (acciones_por_tipo[log.accion] || 0) + 1;
    });

    return {
      total_acciones,
      acciones_exitosas,
      acciones_fallidas,
      violaciones_seguridad,
      acciones_por_tipo
    };
  }

  /**
   * Obtiene los últimos logs de un usuario específico
   * @param usuarioId ID del usuario
   * @param limit Límite de registros (default: 50)
   * @returns Lista de logs del usuario
   */
  async getUserRecentLogs(usuarioId: string, limit: number = 50): Promise<AuditLog[]> {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error al obtener logs del usuario: ${error.message}`);
    }

    return logs || [];
  }

  /**
   * Registra el inicio de sesión de un usuario
   * @param exitoso Si el inicio de sesión fue exitoso
   * @param detalles Detalles adicionales
   */
  async logLogin(exitoso: boolean, detalles?: Record<string, any>): Promise<void> {
    await this.logAction({
      accion: 'LOGIN',
      recurso: 'auth',
      detalles,
      exitoso
    });
  }

  /**
   * Registra el cierre de sesión de un usuario
   */
  async logLogout(): Promise<void> {
    await this.logAction({
      accion: 'LOGOUT',
      recurso: 'auth',
      exitoso: true
    });
  }

  /**
   * Registra la creación de un recurso
   * @param recurso Tipo de recurso creado
   * @param detalles Detalles del recurso
   */
  async logCreate(recurso: string, detalles?: Record<string, any>): Promise<void> {
    await this.logAction({
      accion: 'CREATE',
      recurso,
      detalles,
      exitoso: true
    });
  }

  /**
   * Registra la actualización de un recurso
   * @param recurso Tipo de recurso actualizado
   * @param detalles Detalles del recurso
   */
  async logUpdate(recurso: string, detalles?: Record<string, any>): Promise<void> {
    await this.logAction({
      accion: 'UPDATE',
      recurso,
      detalles,
      exitoso: true
    });
  }

  /**
   * Registra la eliminación de un recurso
   * @param recurso Tipo de recurso eliminado
   * @param detalles Detalles del recurso
   */
  async logDelete(recurso: string, detalles?: Record<string, any>): Promise<void> {
    await this.logAction({
      accion: 'DELETE',
      recurso,
      detalles,
      exitoso: true
    });
  }

  /**
   * Registra un cambio de nivel de automatización
   * @param empresaId ID de la empresa
   * @param nivelAnterior Nivel anterior
   * @param nivelNuevo Nivel nuevo
   */
  async logAutomationLevelChange(
    empresaId: string,
    nivelAnterior: string,
    nivelNuevo: string
  ): Promise<void> {
    await this.logAction({
      accion: 'CHANGE_AUTOMATION_LEVEL',
      recurso: 'empresa',
      detalles: {
        empresa_id: empresaId,
        nivel_anterior: nivelAnterior,
        nivel_nuevo: nivelNuevo
      },
      exitoso: true
    });
  }

  /**
   * Registra el cierre de una hoja de ruta
   * @param hojaRutaId ID de la hoja de ruta
   * @param detalles Detalles del cierre
   */
  async logRutaClosure(hojaRutaId: string, detalles?: Record<string, any>): Promise<void> {
    await this.logAction({
      accion: 'CLOSE_RUTA',
      recurso: 'hoja_ruta',
      detalles: {
        hoja_ruta_id: hojaRutaId,
        ...detalles
      },
      exitoso: true
    });
  }
}

// Exportar instancia singleton
export const auditService = new AuditService();
