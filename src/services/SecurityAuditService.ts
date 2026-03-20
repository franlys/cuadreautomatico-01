import { supabase } from '../lib/supabase';
import { logAccessAttempt } from '../lib/tenantValidation';
import type { AuditLog } from '../types';

/**
 * Servicio de auditoría de seguridad para la plataforma multi-tenant
 * Registra y monitorea violaciones de seguridad y accesos no autorizados
 */
export class SecurityAuditService {
  /**
   * Registra un intento de acceso cross-tenant no autorizado
   */
  async logCrossTenantViolation(
    usuarioId: string,
    empresaIdUsuario: string,
    empresaIdObjetivo: string,
    recurso: string,
    accion: string
  ): Promise<void> {
    await logAccessAttempt(
      `cross_tenant_violation_${accion}`,
      recurso,
      false,
      {
        empresa_usuario: empresaIdUsuario,
        empresa_objetivo: empresaIdObjetivo,
        tipo_violacion: 'cross_tenant_access'
      }
    );

    console.warn('🚨 Violación de seguridad cross-tenant detectada:', {
      usuarioId,
      empresaIdUsuario,
      empresaIdObjetivo,
      recurso,
      accion
    });
  }

  /**
   * Registra una violación de RLS (Row Level Security)
   */
  async logRLSViolation(
    usuarioId: string,
    tabla: string,
    operacion: string,
    detalles?: Record<string, any>
  ): Promise<void> {
    await logAccessAttempt(
      `rls_violation_${operacion}`,
      tabla,
      false,
      {
        tipo_violacion: 'rls_policy',
        ...detalles
      }
    );

    console.warn('🚨 Violación de RLS detectada:', {
      usuarioId,
      tabla,
      operacion,
      detalles
    });
  }

  /**
   * Registra un intento de modificación de empresa_id
   */
  async logEmpresaIdModificationAttempt(
    usuarioId: string,
    tabla: string,
    recordId: string,
    empresaIdOriginal: string,
    empresaIdNuevo: string
  ): Promise<void> {
    await logAccessAttempt(
      'empresa_id_modification_attempt',
      tabla,
      false,
      {
        record_id: recordId,
        empresa_id_original: empresaIdOriginal,
        empresa_id_nuevo: empresaIdNuevo,
        tipo_violacion: 'empresa_id_modification'
      }
    );

    console.warn('🚨 Intento de modificación de empresa_id detectado:', {
      usuarioId,
      tabla,
      recordId,
      empresaIdOriginal,
      empresaIdNuevo
    });
  }

  /**
   * Obtiene violaciones de seguridad recientes
   */
  async getRecentViolations(
    empresaId?: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('exitoso', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener violaciones: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene estadísticas de violaciones por empresa
   */
  async getViolationStats(empresaId: string): Promise<{
    total_violaciones: number;
    violaciones_por_tipo: Record<string, number>;
    ultimas_24h: number;
  }> {
    const hace24h = new Date();
    hace24h.setHours(hace24h.getHours() - 24);

    // Total de violaciones
    const { count: totalViolaciones } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .eq('exitoso', false);

    // Violaciones en últimas 24h
    const { count: violaciones24h } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId)
      .eq('exitoso', false)
      .gte('created_at', hace24h.toISOString());

    // Violaciones por tipo
    const { data: violaciones } = await supabase
      .from('audit_logs')
      .select('accion')
      .eq('empresa_id', empresaId)
      .eq('exitoso', false);

    const violacionesPorTipo: Record<string, number> = {};
    violaciones?.forEach(v => {
      violacionesPorTipo[v.accion] = (violacionesPorTipo[v.accion] || 0) + 1;
    });

    return {
      total_violaciones: totalViolaciones || 0,
      violaciones_por_tipo: violacionesPorTipo,
      ultimas_24h: violaciones24h || 0
    };
  }

  /**
   * Crea una alerta para Super Admin sobre violaciones críticas
   */
  async createSecurityAlert(
    empresaId: string,
    tipo: string,
    mensaje: string,
    detalles?: Record<string, any>
  ): Promise<void> {
    // Registrar la alerta en audit_logs
    await supabase.from('audit_logs').insert({
      empresa_id: empresaId,
      accion: 'security_alert',
      recurso: 'security',
      detalles: {
        tipo_alerta: tipo,
        mensaje,
        ...detalles
      },
      exitoso: true,
      created_at: new Date().toISOString()
    });

    console.error('🚨 ALERTA DE SEGURIDAD:', {
      empresaId,
      tipo,
      mensaje,
      detalles
    });

    // En producción, aquí se enviaría una notificación real
    // (email, SMS, webhook, etc.)
  }

  /**
   * Ejecuta validación periódica de integridad de datos
   */
  async validateDataIntegrity(empresaId: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Verificar que todos los registros tengan empresa_id
      const tablas = [
        'perfiles',
        'empleados',
        'rutas',
        'conceptos',
        'semanas_laborales',
        'folders_diarios',
        'registros',
        'depositos',
        'evidencias'
      ];

      for (const tabla of tablas) {
        const { count } = await supabase
          .from(tabla)
          .select('*', { count: 'exact', head: true })
          .eq('empresa_id', empresaId)
          .is('empresa_id', null);

        if (count && count > 0) {
          issues.push(`Tabla ${tabla} tiene ${count} registros sin empresa_id`);
        }
      }

      // Verificar que no haya registros huérfanos (referencias a empresa_id inexistente)
      for (const tabla of tablas) {
        const { data: registros } = await supabase
          .from(tabla)
          .select('empresa_id')
          .eq('empresa_id', empresaId)
          .limit(1);

        if (registros && registros.length > 0) {
          const { data: empresa } = await supabase
            .from('empresas')
            .select('id')
            .eq('id', empresaId)
            .single();

          if (!empresa) {
            issues.push(`Tabla ${tabla} tiene registros con empresa_id inexistente: ${empresaId}`);
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues
      };
    } catch (error: any) {
      issues.push(`Error durante validación: ${error.message}`);
      return {
        valid: false,
        issues
      };
    }
  }
}

// Exportar instancia singleton
export const securityAuditService = new SecurityAuditService();
