// Módulo de autenticación offline
import { db } from './db';
import type { CredencialesCache } from './db';

// Función simple de hash (NO usar en producción real, solo para demo)
// En producción, usar una librería de criptografía adecuada
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

// Guardar credenciales en caché (después de login exitoso online)
export async function guardarCredencialesCache(
  email: string,
  password: string,
  perfil: any
): Promise<void> {
  try {
    // Encriptar password (en producción usar crypto real)
    const encrypted_token = simpleHash(password);

    // Verificar si ya existe una entrada para este email
    const existente = await db.credenciales_cache
      .where('email')
      .equals(email)
      .first();

    if (existente) {
      // Actualizar
      await db.credenciales_cache.update(existente.id!, {
        encrypted_token,
        perfil,
        ultima_actualizacion: new Date().toISOString(),
      });
    } else {
      // Crear nueva
      await db.credenciales_cache.add({
        email,
        encrypted_token,
        perfil,
        ultima_actualizacion: new Date().toISOString(),
      });
    }

    console.log('Credenciales guardadas en caché para modo offline');
  } catch (error) {
    console.error('Error al guardar credenciales en caché:', error);
  }
}

// Verificar credenciales offline
export async function verificarCredencialesOffline(
  email: string,
  password: string
): Promise<{ valido: boolean; perfil?: any }> {
  try {
    // Buscar credenciales en caché
    const credenciales = await db.credenciales_cache
      .where('email')
      .equals(email)
      .first();

    if (!credenciales) {
      return { valido: false };
    }

    // Verificar password
    const encrypted_token = simpleHash(password);
    if (credenciales.encrypted_token !== encrypted_token) {
      return { valido: false };
    }

    // Verificar que las credenciales no sean muy antiguas (máximo 7 días)
    const ultimaActualizacion = new Date(credenciales.ultima_actualizacion);
    const diasDesdeActualizacion = (Date.now() - ultimaActualizacion.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diasDesdeActualizacion > 7) {
      console.warn('Credenciales en caché muy antiguas (>7 días)');
      return { valido: false };
    }

    return {
      valido: true,
      perfil: credenciales.perfil,
    };
  } catch (error) {
    console.error('Error al verificar credenciales offline:', error);
    return { valido: false };
  }
}

// Limpiar credenciales en caché (al hacer logout)
export async function limpiarCredencialesCache(email?: string): Promise<void> {
  try {
    if (email) {
      // Limpiar solo las credenciales de este email
      await db.credenciales_cache
        .where('email')
        .equals(email)
        .delete();
    } else {
      // Limpiar todas las credenciales
      await db.credenciales_cache.clear();
    }

    console.log('Credenciales en caché limpiadas');
  } catch (error) {
    console.error('Error al limpiar credenciales en caché:', error);
  }
}

// Verificar si hay credenciales en caché
export async function tieneCredencialesCache(email: string): Promise<boolean> {
  try {
    const credenciales = await db.credenciales_cache
      .where('email')
      .equals(email)
      .first();

    return !!credenciales;
  } catch (error) {
    console.error('Error al verificar credenciales en caché:', error);
    return false;
  }
}
