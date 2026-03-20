import Dexie, { type EntityTable } from 'dexie';
import type { Registro, FolderDiario, SemanaLaboral } from '../types';

// Interfaces para datos offline
export interface RegistroPendiente extends Registro {
  sincronizado: number; // 0 = false, 1 = true (IndexedDB no soporta boolean en índices)
  intentos_sincronizacion: number;
  ultimo_error?: string;
}

export interface EvidenciaPendiente {
  id?: number;
  empresa_id?: string; // Para validación multi-tenant
  registro_id: string;
  blob: Blob;
  nombre_archivo: string;
  tipo_mime: string;
  sincronizado: number; // 0 = false, 1 = true (IndexedDB no soporta boolean en índices)
}

export interface CatalogoCache {
  id: string;
  empresa_id?: string; // Para filtrado multi-tenant
  tipo: 'empleado' | 'ruta' | 'concepto';
  nombre?: string;
  apellido?: string;
  descripcion?: string;
  activo: boolean;
  ultima_actualizacion: string;
}

export interface CredencialesCache {
  id?: number;
  email: string;
  encrypted_token: string;
  perfil: any;
  ultima_actualizacion: string;
}

// Esquema local para modo offline
export class CuadreAutomaticoDatabase extends Dexie {
  registros_pendientes!: EntityTable<RegistroPendiente, 'id'>;
  folders_cache!: EntityTable<FolderDiario, 'id'>;
  semanas_cache!: EntityTable<SemanaLaboral, 'id'>;
  catalogos_cache!: EntityTable<CatalogoCache, 'id'>;
  evidencias_pendientes!: EntityTable<EvidenciaPendiente, 'id'>;
  credenciales_cache!: EntityTable<CredencialesCache, 'id'>;

  constructor() {
    super('CuadreAutomatico');
    
    // Versión 2: Corregir esquema de registros_pendientes (id es UUID string, no autoincremento)
    this.version(2).stores({
      registros_pendientes: 'id, folder_diario_id, tipo, sincronizado, created_at',
      folders_cache: 'id, fecha_laboral, semana_id, created_at',
      semanas_cache: 'id, fecha_inicio, fecha_fin, created_at',
      catalogos_cache: 'id, tipo, nombre, ultima_actualizacion',
      evidencias_pendientes: '++id, registro_id, sincronizado',
      credenciales_cache: '++id, email',
    }).upgrade(tx => {
      // Limpiar registros pendientes para evitar conflictos de esquema
      return tx.table('registros_pendientes').clear();
    });

    // Versión 3: Agregar índices de empresa_id para multi-tenant
    this.version(3).stores({
      registros_pendientes: 'id, folder_diario_id, tipo, sincronizado, created_at, empresa_id',
      folders_cache: 'id, fecha_laboral, semana_id, created_at, empresa_id',
      semanas_cache: 'id, fecha_inicio, fecha_fin, created_at, empresa_id',
      catalogos_cache: 'id, tipo, nombre, ultima_actualizacion, empresa_id',
      evidencias_pendientes: '++id, registro_id, sincronizado, empresa_id',
      credenciales_cache: '++id, email',
    }).upgrade(async tx => {
      // Limpiar datos locales para forzar re-sincronización con empresa_id
      console.log('Actualizando IndexedDB a versión 3 (multi-tenant)...');
      await tx.table('registros_pendientes').clear();
      await tx.table('folders_cache').clear();
      await tx.table('semanas_cache').clear();
      await tx.table('catalogos_cache').clear();
      await tx.table('evidencias_pendientes').clear();
      console.log('✅ IndexedDB actualizado para multi-tenant');
    });
  }
}

// Función para limpiar y recrear la base de datos si hay error de esquema
async function inicializarBaseDatos(): Promise<CuadreAutomaticoDatabase> {
  try {
    const database = new CuadreAutomaticoDatabase();
    // Intentar abrir la base de datos
    await database.open();
    return database;
  } catch (error: any) {
    console.warn('Error al abrir base de datos, limpiando y recreando...', error);
    
    // Si hay error de esquema, eliminar la base de datos y recrear
    if (error?.name === 'UpgradeError' || error?.inner?.name === 'UpgradeError') {
      try {
        // Cerrar cualquier conexión abierta
        Dexie.delete('CuadreAutomatico');
        
        // Esperar un momento para que se complete la eliminación
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Crear nueva instancia
        const database = new CuadreAutomaticoDatabase();
        await database.open();
        
        console.log('✅ Base de datos recreada exitosamente');
        return database;
      } catch (deleteError) {
        console.error('Error al recrear base de datos:', deleteError);
        throw deleteError;
      }
    }
    
    throw error;
  }
}

// Exportar instancia (se inicializa de forma lazy)
export const db = new CuadreAutomaticoDatabase();

// Inicializar la base de datos cuando se importe el módulo
inicializarBaseDatos().catch(console.error);
