import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFolderStore } from '../stores/folderStore';
import { formatearFecha, obtenerNombreDia } from '../utils/fechaLaboral';

export function SemanaLaboral() {
  const { semanaActual, folders, cargarFoldersSemana } = useFolderStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (semanaActual) {
      cargarFolders();
      
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('semana-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'folders_diarios',
            filter: `semana_laboral_id=eq.${semanaActual.id}`,
          },
          () => {
            cargarFolders();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'semanas_laborales',
            filter: `id=eq.${semanaActual.id}`,
          },
          () => {
            cargarFolders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [semanaActual?.id]);

  const cargarFolders = async () => {
    if (!semanaActual) return;
    
    setLoading(true);
    await cargarFoldersSemana(semanaActual.id);
    setLoading(false);
  };

  if (!semanaActual) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const obtenerColorBalance = (balance: number) => {
    if (balance > 0) return 'text-blue-700 bg-blue-50';
    if (balance < 0) return 'text-orange-700 bg-orange-50';
    return 'text-gray-700 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Semana Laboral
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {formatearFecha(semanaActual.fecha_inicio)} - {formatearFecha(semanaActual.fecha_fin)}
        </p>
      </div>

      {/* Resumen semanal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-md">
          <p className="text-sm text-green-600 font-medium">Total Ingresos</p>
          <p className="text-xl font-bold text-green-700">
            ${semanaActual.total_ingresos?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className="p-4 bg-red-50 rounded-md">
          <p className="text-sm text-red-600 font-medium">Total Egresos</p>
          <p className="text-xl font-bold text-red-700">
            ${semanaActual.total_egresos?.toFixed(2) || '0.00'}
          </p>
        </div>
        
        <div className={`p-4 rounded-md ${obtenerColorBalance(semanaActual.balance_neto || 0)}`}>
          <p className="text-sm font-medium">Balance Neto</p>
          <p className="text-xl font-bold">
            ${semanaActual.balance_neto?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-md">
          <p className="text-sm text-purple-600 font-medium">Saldo Disponible</p>
          <p className="text-xl font-bold text-purple-700">
            ${semanaActual.saldo_disponible?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Folders diarios */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Folders Diarios
        </h3>
        
        {folders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No hay folders para esta semana
          </p>
        ) : (
          <div className="space-y-2">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`p-4 border rounded-md ${
                  folder.cerrado ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-gray-900">
                        {obtenerNombreDia(folder.fecha_laboral)}
                      </p>
                      <span className="text-sm text-gray-600">
                        {folder.fecha_laboral}
                      </span>
                      {folder.cerrado && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          Cerrado
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Ingresos</p>
                        <p className="font-semibold text-green-700">
                          ${folder.total_ingresos?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Egresos</p>
                        <p className="font-semibold text-red-700">
                          ${folder.total_egresos?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Balance</p>
                        <p className={`font-semibold ${
                          (folder.balance_diario || 0) > 0
                            ? 'text-blue-700'
                            : (folder.balance_diario || 0) < 0
                            ? 'text-orange-700'
                            : 'text-gray-700'
                        }`}>
                          ${folder.balance_diario?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
