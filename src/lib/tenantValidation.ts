import { supabase } from './supabase';

/**
 * Middleware de validación de empresa_id para operaciones multi-tenant
 * Garantiza que todas las operaciones incluyan y validen empresa_id
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  empresaId?: string;
}

/**
 * Obtiene el empresa_id del usuario autenticado actual
 */
export async function getCurrentUserEmpresaId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('empresa_id, rol')
      .eq('id', user.id)
      .single();

    if (error || !perfil) {
      console.error('Error al obtener perfil del usuario:', error);
      return null;
    }

    return perfil.empresa_id;
  } catch (error) {
    console.error('Error en getCurrentUserEmpresaId:', error);
    return null;
  }
}

/**
 * Valida que una operación de lectura incluya filtro por empresa_id
 */
export async function validateReadOperation(
  tableName: string,
  filters: Record<string, any>
): Promise<ValidationResult> {
  const empresaId = await getCurrentUserEmpresaId();

  if (!empresaId) {
    return {
      valid: false,
      error: 'Usuario no autenticado o sin empresa asignada'
    };
  }

  // Verificar que el filtro incluya empresa_id
  if (!filters.empresa_id) {
    return {
      valid: false,
      error: `Operación de lectura en ${tableName} debe incluir filtro por empresa_id`
    };
  }

  // Verificar que el empresa_id del filtro coincida con el del usuario
  if (filters.empresa_id !== empresaId) {
    // Verificar si el usuario es Super_Admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (perfil?.rol !== 'Super_Admin') {
      return {
        valid: false,
        error: 'Intento de acceso cross-tenant no autorizado'
      };
    }
  }

  return {
    valid: true,
    empresaId
  };
}

/**
 * Valida que una operación de inserción incluya empresa_id del usuario
 */
export async function validateInsertOperation(
  tableName: string,
  data: Record<string, any>
): Promise<ValidationResult> {
  const empresaId = await getCurrentUserEmpresaId();

  if (!empresaId) {
    return {
      valid: false,
      error: 'Usuario no autenticado o sin empresa asignada'
    };
  }

  // Verificar que los datos incluyan empresa_id
  if (!data.empresa_id) {
    return {
      valid: false,
      error: `Operación de inserción en ${tableName} debe incluir empresa_id`
    };
  }

  // Verificar que el empresa_id coincida con el del usuario
  if (data.empresa_id !== empresaId) {
    // Verificar si el usuario es Super_Admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (perfil?.rol !== 'Super_Admin') {
      return {
        valid: false,
        error: 'Intento de inserción cross-tenant no autorizado'
      };
    }
  }

  return {
    valid: true,
    empresaId
  };
}

/**
 * Valida que una operación de actualización no cambie empresa_id
 */
export async function validateUpdateOperation(
  tableName: string,
  recordId: string,
  updates: Record<string, any>
): Promise<ValidationResult> {
  const empresaId = await getCurrentUserEmpresaId();

  if (!empresaId) {
    return {
      valid: false,
      error: 'Usuario no autenticado o sin empresa asignada'
    };
  }

  // Verificar que no se intente cambiar empresa_id
  if (updates.empresa_id && updates.empresa_id !== empresaId) {
    return {
      valid: false,
      error: 'No se permite cambiar empresa_id de un registro existente'
    };
  }

  // Verificar que el registro pertenece a la empresa del usuario
  const { data: record, error } = await supabase
    .from(tableName)
    .select('empresa_id')
    .eq('id', recordId)
    .single();

  if (error) {
    return {
      valid: false,
      error: `Error al verificar registro: ${error.message}`
    };
  }

  if (record.empresa_id !== empresaId) {
    // Verificar si el usuario es Super_Admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (perfil?.rol !== 'Super_Admin') {
      return {
        valid: false,
        error: 'Intento de actualización cross-tenant no autorizado'
      };
    }
  }

  return {
    valid: true,
    empresaId
  };
}

/**
 * Valida que una operación de eliminación sea sobre un registro de la empresa del usuario
 */
export async function validateDeleteOperation(
  tableName: string,
  recordId: string
): Promise<ValidationResult> {
  const empresaId = await getCurrentUserEmpresaId();

  if (!empresaId) {
    return {
      valid: false,
      error: 'Usuario no autenticado o sin empresa asignada'
    };
  }

  // Verificar que el registro pertenece a la empresa del usuario
  const { data: record, error } = await supabase
    .from(tableName)
    .select('empresa_id')
    .eq('id', recordId)
    .single();

  if (error) {
    return {
      valid: false,
      error: `Error al verificar registro: ${error.message}`
    };
  }

  if (record.empresa_id !== empresaId) {
    // Verificar si el usuario es Super_Admin
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (perfil?.rol !== 'Super_Admin') {
      return {
        valid: false,
        error: 'Intento de eliminación cross-tenant no autorizado'
      };
    }
  }

  return {
    valid: true,
    empresaId
  };
}

/**
 * Registra un intento de acceso (exitoso o fallido) en audit_logs
 */
export async function logAccessAttempt(
  accion: string,
  recurso: string,
  exitoso: boolean,
  detalles?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const empresaId = await getCurrentUserEmpresaId();

    await supabase.from('audit_logs').insert({
      empresa_id: empresaId,
      usuario_id: user?.id,
      accion,
      recurso,
      detalles,
      exitoso,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar en audit_logs:', error);
    // No lanzar error para no interrumpir el flujo
  }
}
