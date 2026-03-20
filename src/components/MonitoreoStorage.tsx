import { useState, useEffect } from 'react';
import { tenantService } from '../services/TenantService';
import type { Empresa } from '../types';

interface MonitoreoStorageProps {
  empresaId: string;
}

export function MonitoreoStorage({ empresaId }: MonitoreoStorageProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [storageUsado, setStorageUsado] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nuevoLimite, setNuevoLimite] = useState<number>(0);

  useEffect(() => {
    cargarDatos();
  }, [empresaId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [empresaData, stats] = await Promise.all([
        tenantService.getEmpresaById(empresaId),
        tenantService.getEmpresaStats(empresaId)
      ]);
      
      setEmpresa(empresaData);
      setStorageUsado(stats.storage_usado_mb);
      setNuevoLimite(empresaData.limite_storage_mb);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarLimite = async () => {
    if (!empresa) return;

    try {
      await tenantService.updateEmpresa(empresa.id, {
        limite_storage_mb: nuevoLimite
      });
      
      await cargarDatos();
      setEditando(false);
    } catch (error) {
      console.error('Error al actualizar límite:', error);
      alert('Error al actualizar el límite de storage');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="text-center p-8 text-gray-500">
        No se pudo cargar la información de la empresa
      </div>
    );
  }

  const porcentajeUsado = (storageUsado / empresa.limite_storage_mb) * 100;
  const colorBarra = porcentajeUsado > 90 ? 'bg-red-600' : porcentajeUsado > 75 ? 'bg-yellow-600' : 'bg-green-600';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">Monitoreo de Storage</h2>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Uso de Storage
          </span>
          <span className="text-sm font-medium text-gray-700">
            {storageUsado.toFixed(2)} MB / {empresa.limite_storage_mb} MB
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`${colorBarra} h-4 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(porcentajeUsado, 100)}%` }}
          ></div>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {porcentajeUsado.toFixed(1)}% utilizado
        </div>
      </div>

      {/* Alertas */}
      {porcentajeUsado > 90 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Límite de storage casi alcanzado</h3>
              <p className="text-sm text-red-700 mt-1">
                El storage está al {porcentajeUsado.toFixed(1)}%. Considera aumentar el límite o eliminar archivos antiguos.
              </p>
            </div>
          </div>
        </div>
      )}

      {porcentajeUsado > 75 && porcentajeUsado <= 90 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Advertencia de storage</h3>
              <p className="text-sm text-yellow-700 mt-1">
                El storage está al {porcentajeUsado.toFixed(1)}%. Monitorea el uso para evitar problemas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuración de límite */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Configuración de Límite</h3>
        
        {!editando ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Límite actual</p>
              <p className="text-2xl font-semibold">{empresa.limite_storage_mb} MB</p>
            </div>
            <button
              onClick={() => setEditando(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ajustar Límite
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuevo límite (MB)
              </label>
              <input
                type="number"
                value={nuevoLimite}
                onChange={(e) => setNuevoLimite(Number(e.target.value))}
                min={storageUsado}
                step={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Mínimo: {storageUsado.toFixed(2)} MB (uso actual)
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={actualizarLimite}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setEditando(false);
                  setNuevoLimite(empresa.limite_storage_mb);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas adicionales */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium mb-4">Estadísticas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Espacio disponible</p>
            <p className="text-xl font-semibold">
              {(empresa.limite_storage_mb - storageUsado).toFixed(2)} MB
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Porcentaje libre</p>
            <p className="text-xl font-semibold">
              {(100 - porcentajeUsado).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
