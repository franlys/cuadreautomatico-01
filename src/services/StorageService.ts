import { supabase } from '../lib/supabase';

/**
 * Servicio para gestión de archivos con aislamiento por tenant
 */
export class StorageService {
  private readonly BUCKET_NAME = 'evidencias';

  /**
   * Sube un archivo al storage con prefijo de empresa
   * @param empresaId ID de la empresa
   * @param file Archivo a subir
   * @param path Ruta relativa dentro de la empresa (sin incluir empresa_id)
   * @returns URL pública del archivo subido
   */
  async uploadFile(empresaId: string, file: File, path: string): Promise<string> {
    // Validar límite de storage antes de subir
    const canUpload = await this.validateStorageLimit(empresaId, file.size);
    if (!canUpload) {
      throw new Error('Límite de almacenamiento alcanzado para esta empresa');
    }

    // Construir ruta con prefijo de empresa
    const fullPath = `${empresaId}/${path}`;

    // Subir archivo
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Obtener URL pública
    const url = await this.getFileUrl(empresaId, path);
    return url;
  }

  /**
   * Obtiene la URL pública de un archivo
   * @param empresaId ID de la empresa
   * @param path Ruta relativa del archivo
   * @returns URL pública del archivo
   */
  async getFileUrl(empresaId: string, path: string): Promise<string> {
    const fullPath = `${empresaId}/${path}`;

    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fullPath);

    return data.publicUrl;
  }

  /**
   * Elimina un archivo del storage
   * @param empresaId ID de la empresa
   * @param path Ruta relativa del archivo
   */
  async deleteFile(empresaId: string, path: string): Promise<void> {
    const fullPath = `${empresaId}/${path}`;

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([fullPath]);

    if (error) {
      throw new Error(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Calcula el uso total de storage de una empresa en MB
   * @param empresaId ID de la empresa
   * @returns Uso de storage en MB
   */
  async getStorageUsage(empresaId: string): Promise<number> {
    const { data: evidencias, error } = await supabase
      .from('evidencias')
      .select('tamano_bytes')
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(`Error al calcular uso de storage: ${error.message}`);
    }

    const totalBytes = evidencias?.reduce((sum, e) => sum + (e.tamano_bytes || 0), 0) || 0;
    const totalMb = totalBytes / (1024 * 1024);

    return Math.round(totalMb * 100) / 100;
  }

  /**
   * Valida si una empresa puede subir un archivo según su límite
   * @param empresaId ID de la empresa
   * @param fileSize Tamaño del archivo en bytes
   * @returns true si puede subir, false si excede el límite
   */
  async validateStorageLimit(empresaId: string, fileSize: number): Promise<boolean> {
    // Obtener límite de la empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('limite_storage_mb')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      throw new Error('Empresa no encontrada');
    }

    // Calcular uso actual
    const usoActualMb = await this.getStorageUsage(empresaId);
    const fileSizeMb = fileSize / (1024 * 1024);

    // Validar si hay espacio suficiente
    return (usoActualMb + fileSizeMb) <= empresa.limite_storage_mb;
  }

  /**
   * Lista todos los archivos de una empresa
   * @param empresaId ID de la empresa
   * @param folder Carpeta específica (opcional)
   * @returns Lista de archivos
   */
  async listFiles(empresaId: string, folder?: string): Promise<any[]> {
    const path = folder ? `${empresaId}/${folder}` : empresaId;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(path);

    if (error) {
      throw new Error(`Error al listar archivos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene información detallada de uso de storage por tipo de archivo
   * @param empresaId ID de la empresa
   * @returns Estadísticas de uso por tipo
   */
  async getStorageStatsByType(empresaId: string): Promise<Record<string, number>> {
    const { data: evidencias, error } = await supabase
      .from('evidencias')
      .select('tipo_mime, tamano_bytes')
      .eq('empresa_id', empresaId);

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    const stats: Record<string, number> = {};

    evidencias?.forEach(e => {
      const tipo = e.tipo_mime || 'unknown';
      const sizeMb = (e.tamano_bytes || 0) / (1024 * 1024);
      stats[tipo] = (stats[tipo] || 0) + sizeMb;
    });

    // Redondear valores
    Object.keys(stats).forEach(key => {
      stats[key] = Math.round(stats[key] * 100) / 100;
    });

    return stats;
  }

  /**
   * Descarga un archivo del storage
   * @param empresaId ID de la empresa
   * @param path Ruta relativa del archivo
   * @returns Blob del archivo
   */
  async downloadFile(empresaId: string, path: string): Promise<Blob> {
    const fullPath = `${empresaId}/${path}`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(fullPath);

    if (error) {
      throw new Error(`Error al descargar archivo: ${error.message}`);
    }

    return data;
  }
}

// Exportar instancia singleton
export const storageService = new StorageService();
