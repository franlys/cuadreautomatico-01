import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFolderStore } from '../stores/folderStore';
import { useAuth } from '../hooks/useAuth';
import { formatearFecha, obtenerNombreDia } from '../utils/fechaLaboral';

export function FolderDiario() {
  const { perfil } = useAuth();
  const {
    folderActual,
    semanaActual,
    loading,
    error,
    obtenerOCrearFolderActual,
    cerrarFolder,
    refrescarFolderActual,
  } = useFolderStore();
  
  const [cerrandoFolder, setCerrandoFolder] = useState(false);
  const esDueno = perfil?.rol === 'Dueño';

  useEffect(() => {
    obtenerOCrearFolderActual();
    
    // Suscribirse a cambios en tiempo real del folder actual
    if (folderActual) {
      const subscription = supabase
        .channel('folder-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'folders_diarios',
            filter: `id=eq.${folderActual.id}`,
          },
          () => {
            refrescarFolderActual();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [folderActual?.id]);

  const handleCerrarFolder = async () => {
    if (!folderActual) return;
    
    if (!confirm('¿Estás seguro de cerrar este folder? Una vez cerrado, no se podrán agregar más registros.')) {
      return;
    }
    
    try {
      setCerrandoFolder(true);
      await cerrarFolder(folderActual.id);
      alert('Folder cerrado correctamente');
    } catch (err: any) {
      alert(`Error al cerrar folder: ${err.message}`);
    } finally {
      setCerrandoFolder(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Cargando folder diario...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!folderActual || !semanaActual) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No se pudo cargar el folder diario</p>
      </div>
    );
  }

  const esLunes = new Date().getDay() === 1;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Folder Diario
          </h2>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Fecha laboral:</span>{' '}
              {formatearFecha(folderActual.fecha_laboral)} ({obtenerNombreDia(folderActual.fecha_laboral)})
            </p>
            {esLunes && (
              <p className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ⚠️ Regla del Lunes: Los registros de hoy pertenecen al sábado anterior
              </p>
            )}
            <p className="text-sm text-gray-600">
              <span className="font-medium">Semana laboral:</span>{' '}
              {formatearFecha(semanaActual.fecha_inicio)} - {formatearFecha(semanaActual.fecha_fin)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {folderActual.cerrado ? (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-md">
              🔒 Cerrado
            </span>
          ) : (
            <>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-md">
                ✓ Abierto
              </span>
              {esDueno && (
                <button
                  onClick={handleCerrarFolder}
                  disabled={cerrandoFolder}
                  className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {cerrandoFolder ? 'Cerrando...' : 'Cerrar Folder'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Resumen de balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-green-50 rounded-md">
          <p className="text-sm text-green-600 font-medium">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-700">
            ${folderActual.total_ingresos?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-md">
          <p className="text-sm text-red-600 font-medium">Total Egresos</p>
          <p className="text-2xl font-bold text-red-700">
            ${folderActual.total_egresos?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className={`p-4 rounded-md ${
          (folderActual.balance_diario || 0) > 0
            ? 'bg-blue-50'
            : (folderActual.balance_diario || 0) < 0
            ? 'bg-orange-50'
            : 'bg-gray-50'
        }`}>
          <p className={`text-sm font-medium ${
            (folderActual.balance_diario || 0) > 0
              ? 'text-blue-600'
              : (folderActual.balance_diario || 0) < 0
              ? 'text-orange-600'
              : 'text-gray-600'
          }`}>
            Balance Diario
          </p>
          <p className={`text-2xl font-bold ${
            (folderActual.balance_diario || 0) > 0
              ? 'text-blue-700'
              : (folderActual.balance_diario || 0) < 0
              ? 'text-orange-700'
              : 'text-gray-700'
          }`}>
            ${folderActual.balance_diario?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {folderActual.cerrado && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-700">
            ℹ️ Este folder está cerrado. No se pueden agregar más registros.
          </p>
        </div>
      )}
    </div>
  );
}
