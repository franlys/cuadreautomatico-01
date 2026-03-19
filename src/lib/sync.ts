// Módulo de sincronización para modo offline
import { supabase } from './supabase';
import { db, type RegistroPendiente, type EvidenciaPendiente } from './db';

export interface ConflictoSincronizacion {
  registro_local: RegistroPendiente;
  registro_servidor: any;
  tipo: 'modificacion' | 'eliminacion';
}

// Detectar si hay conexión a internet
export function estaOnline(): boolean {
  return navigator.onLine;
}

// Sincronizar registros pendientes
export async function sincronizarRegistrosPendientes(): Promise<{
  exitosos: number;
  fallidos: number;
  conflictos: ConflictoSincronizacion[];
}> {
  const resultado = {
    exitosos: 0,
    fallidos: 0,
    conflictos: [] as ConflictoSincronizacion[],
  };

  try {
    // Obtener registros pendientes
    const registrosPendientes = await db.registros_pendientes
      .where('sincronizado')
      .equals(0)
      .toArray();

    if (registrosPendientes.length === 0) {
      return resultado;
    }

    console.log(`Sincronizando ${registrosPendientes.length} registros pendientes...`);

    for (const registro of registrosPendientes) {
      try {
        // Verificar si el registro ya existe en el servidor
        const { data: registroExistente, error: errorBusqueda } = await supabase
          .from('registros')
          .select('*')
          .eq('id', registro.id)
          .maybeSingle();

        if (errorBusqueda) {
          throw errorBusqueda;
        }

        // Si existe en el servidor, verificar conflictos
        if (registroExistente) {
          // Comparar timestamps
          const timestampLocal = new Date(registro.updated_at).getTime();
          const timestampServidor = new Date(registroExistente.updated_at).getTime();

          if (timestampServidor > timestampLocal) {
            // Conflicto: el servidor tiene una versión más reciente
            resultado.conflictos.push({
              registro_local: registro,
              registro_servidor: registroExistente,
              tipo: 'modificacion',
            });
            continue;
          }
        }

        // Insertar o actualizar en el servidor
        const { error: errorUpsert } = await supabase
          .from('registros')
          .upsert({
            id: registro.id,
            folder_diario_id: registro.folder_diario_id,
            tipo: registro.tipo,
            concepto: registro.concepto,
            empleado: registro.empleado,
            ruta: registro.ruta,
            monto: registro.monto,
            creado_por: registro.creado_por,
            created_at: registro.created_at,
            updated_at: registro.updated_at,
          });

        if (errorUpsert) {
          throw errorUpsert;
        }

        // Marcar como sincronizado
        await db.registros_pendientes.update(registro.id!, {
          sincronizado: 1 as any,
          intentos_sincronizacion: (registro.intentos_sincronizacion || 0) + 1,
        });

        resultado.exitosos++;
      } catch (error: any) {
        console.error(`Error al sincronizar registro ${registro.id}:`, error);
        
        // Actualizar intentos de sincronización
        await db.registros_pendientes.update(registro.id!, {
          intentos_sincronizacion: (registro.intentos_sincronizacion || 0) + 1,
          ultimo_error: error.message,
        });

        resultado.fallidos++;
      }
    }

    return resultado;
  } catch (error) {
    console.error('Error en sincronización de registros:', error);
    return resultado;
  }
}

// Sincronizar evidencias pendientes
export async function sincronizarEvidenciasPendientes(): Promise<{
  exitosos: number;
  fallidos: number;
}> {
  const resultado = {
    exitosos: 0,
    fallidos: 0,
  };

  try {
    const evidenciasPendientes = await db.evidencias_pendientes
      .where('sincronizado')
      .equals(0)
      .toArray();

    if (evidenciasPendientes.length === 0) {
      return resultado;
    }

    console.log(`Sincronizando ${evidenciasPendientes.length} evidencias pendientes...`);

    for (const evidencia of evidenciasPendientes) {
      try {
        // Subir archivo a Supabase Storage
        const filePath = `${evidencia.registro_id}/${Date.now()}-${evidencia.nombre_archivo}`;
        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(filePath, evidencia.blob, {
            contentType: evidencia.tipo_mime,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Crear registro en la tabla evidencias
        const { error: insertError } = await supabase
          .from('evidencias')
          .insert({
            registro_id: evidencia.registro_id,
            storage_path: filePath,
            nombre_archivo: evidencia.nombre_archivo,
            tipo_mime: evidencia.tipo_mime,
            tamano_bytes: evidencia.blob.size,
          });

        if (insertError) {
          throw insertError;
        }

        // Marcar como sincronizado
        await db.evidencias_pendientes.update(evidencia.id!, {
          sincronizado: 1 as any,
        });

        resultado.exitosos++;
      } catch (error: any) {
        console.error(`Error al sincronizar evidencia ${evidencia.id}:`, error);
        resultado.fallidos++;
      }
    }

    return resultado;
  } catch (error) {
    console.error('Error en sincronización de evidencias:', error);
    return resultado;
  }
}

// Sincronizar catálogos desde el servidor
export async function sincronizarCatalogos(): Promise<void> {
  try {
    // Sincronizar empleados
    const { data: empleados, error: errorEmpleados } = await supabase
      .from('empleados')
      .select('*')
      .eq('activo', true);

    if (!errorEmpleados && empleados) {
      await db.catalogos_cache.bulkPut(
        empleados.map(e => ({
          id: e.id,
          tipo: 'empleado' as const,
          nombre: e.nombre,
          apellido: e.apellido,
          activo: e.activo,
          ultima_actualizacion: new Date().toISOString(),
        }))
      );
    }

    // Sincronizar rutas
    const { data: rutas, error: errorRutas } = await supabase
      .from('rutas')
      .select('*')
      .eq('activo', true);

    if (!errorRutas && rutas) {
      await db.catalogos_cache.bulkPut(
        rutas.map(r => ({
          id: r.id,
          tipo: 'ruta' as const,
          nombre: r.nombre,
          activo: r.activo,
          ultima_actualizacion: new Date().toISOString(),
        }))
      );
    }

    // Sincronizar conceptos
    const { data: conceptos, error: errorConceptos } = await supabase
      .from('conceptos')
      .select('*')
      .eq('activo', true);

    if (!errorConceptos && conceptos) {
      await db.catalogos_cache.bulkPut(
        conceptos.map(c => ({
          id: c.id,
          tipo: 'concepto' as const,
          descripcion: c.descripcion,
          activo: c.activo,
          ultima_actualizacion: new Date().toISOString(),
        }))
      );
    }

    console.log('Catálogos sincronizados exitosamente');
  } catch (error) {
    console.error('Error al sincronizar catálogos:', error);
  }
}

// Sincronización completa
export async function sincronizarTodo(): Promise<{
  registros: { exitosos: number; fallidos: number; conflictos: ConflictoSincronizacion[] };
  evidencias: { exitosos: number; fallidos: number };
}> {
  console.log('Iniciando sincronización completa...');

  // Sincronizar catálogos primero
  await sincronizarCatalogos();

  // Sincronizar registros
  const resultadoRegistros = await sincronizarRegistrosPendientes();

  // Sincronizar evidencias
  const resultadoEvidencias = await sincronizarEvidenciasPendientes();

  console.log('Sincronización completa finalizada:', {
    registros: resultadoRegistros,
    evidencias: resultadoEvidencias,
  });

  return {
    registros: resultadoRegistros,
    evidencias: resultadoEvidencias,
  };
}

// Configurar listener para detectar cuando se recupera la conexión
export function configurarSincronizacionAutomatica(): void {
  window.addEventListener('online', async () => {
    console.log('Conexión recuperada, iniciando sincronización automática...');
    
    try {
      const resultado = await sincronizarTodo();
      
      // Mostrar notificación al usuario
      if (resultado.registros.conflictos.length > 0) {
        alert(
          `Sincronización completada con ${resultado.registros.conflictos.length} conflictos.\n` +
          `Por favor, revisa los registros en conflicto.`
        );
      } else if (resultado.registros.exitosos > 0 || resultado.evidencias.exitosos > 0) {
        alert(
          `Sincronización exitosa:\n` +
          `- ${resultado.registros.exitosos} registros sincronizados\n` +
          `- ${resultado.evidencias.exitosos} evidencias sincronizadas`
        );
      }
    } catch (error) {
      console.error('Error en sincronización automática:', error);
    }
  });

  // Sincronizar catálogos periódicamente (cada 5 minutos)
  setInterval(async () => {
    if (estaOnline()) {
      await sincronizarCatalogos();
    }
  }, 5 * 60 * 1000);
}

// Resolver conflicto manualmente
export async function resolverConflicto(
  conflicto: ConflictoSincronizacion,
  usarVersion: 'local' | 'servidor'
): Promise<void> {
  try {
    if (usarVersion === 'local') {
      // Forzar actualización con versión local
      const { error } = await supabase
        .from('registros')
        .update({
          tipo: conflicto.registro_local.tipo,
          concepto: conflicto.registro_local.concepto,
          empleado: conflicto.registro_local.empleado,
          ruta: conflicto.registro_local.ruta,
          monto: conflicto.registro_local.monto,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conflicto.registro_local.id);

      if (error) throw error;

      // Marcar como sincronizado
      await db.registros_pendientes.update(conflicto.registro_local.id!, {
        sincronizado: 1 as any,
      });
    } else {
      // Usar versión del servidor, descartar local
      await db.registros_pendientes.update(conflicto.registro_local.id!, {
        sincronizado: 1 as any,
      });
    }

    console.log(`Conflicto resuelto usando versión ${usarVersion}`);
  } catch (error) {
    console.error('Error al resolver conflicto:', error);
    throw error;
  }
}
