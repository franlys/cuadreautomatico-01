import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { BotonesExportacion } from '../components/BotonesExportacion';
import { supabase } from '../lib/supabase';
import { formatearFecha, obtenerNombreDia } from '../utils/fechaLaboral';
import type { SemanaLaboral, FolderDiario, Registro } from '../types';

export function DashboardDueno() {
  const [semanas, setSemanas] = useState<SemanaLaboral[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<SemanaLaboral | null>(null);
  const [folders, setFolders] = useState<FolderDiario[]>([]);
  const [registrosPorFolder, setRegistrosPorFolder] = useState<Record<string, Registro[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSemanas();
  }, []);

  useEffect(() => {
    if (semanaSeleccionada) {
      cargarDatosSemana();
      
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('dashboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'folders_diarios',
            filter: `semana_laboral_id=eq.${semanaSeleccionada.id}`,
          },
          () => {
            cargarDatosSemana();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'semanas_laborales',
            filter: `id=eq.${semanaSeleccionada.id}`,
          },
          () => {
            cargarSemanas();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [semanaSeleccionada?.id]);

  const cargarSemanas = async () => {
    try {
      const { data, error } = await supabase
        .from('semanas_laborales')
        .select('*')
        .order('fecha_inicio', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSemanas(data || []);
      
      // Seleccionar la semana más reciente si no hay una seleccionada
      if (!semanaSeleccionada && data && data.length > 0) {
        setSemanaSeleccionada(data[0]);
      } else if (semanaSeleccionada) {
        // Actualizar la semana seleccionada con datos frescos
        const semanaActualizada = data?.find(s => s.id === semanaSeleccionada.id);
        if (semanaActualizada) {
          setSemanaSeleccionada(semanaActualizada);
        }
      }
    } catch (err) {
      console.error('Error al cargar semanas:', err);
    }
  };

  const cargarDatosSemana = async () => {
    if (!semanaSeleccionada) return;

    try {
      setLoading(true);

      // Cargar folders de la semana
      const { data: foldersData, error: foldersError } = await supabase
        .from('folders_diarios')
        .select('*')
        .eq('semana_laboral_id', semanaSeleccionada.id)
        .order('fecha_laboral', { ascending: true });

      if (foldersError) throw foldersError;
      setFolders(foldersData || []);

      // Cargar registros de cada folder
      const registrosPorFolderTemp: Record<string, Registro[]> = {};
      
      for (const folder of foldersData || []) {
        const { data: registrosData, error: registrosError } = await supabase
          .from('registros')
          .select('*')
          .eq('folder_diario_id', folder.id)
          .order('created_at', { ascending: false });

        if (registrosError) throw registrosError;
        registrosPorFolderTemp[folder.id] = registrosData || [];
      }

      setRegistrosPorFolder(registrosPorFolderTemp);
    } catch (err) {
      console.error('Error al cargar datos de la semana:', err);
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorBalance = (balance: number) => {
    if (balance > 0) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (balance < 0) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-gray-700 bg-gray-50 border-gray-200';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard del Dueño</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vista consolidada con datos en tiempo real
            </p>
          </div>

          <div className="flex gap-4">
            {/* Botones de exportación */}
            {semanaSeleccionada && (
              <div className="w-80">
                <BotonesExportacion semana={semanaSeleccionada} />
              </div>
            )}

            {/* Selector de semana */}
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semana Laboral
              </label>
              <select
                value={semanaSeleccionada?.id || ''}
                onChange={(e) => {
                  const semana = semanas.find(s => s.id === e.target.value);
                  setSemanaSeleccionada(semana || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {semanas.map((semana) => (
                  <option key={semana.id} value={semana.id}>
                    {formatearFecha(semana.fecha_inicio)} - {formatearFecha(semana.fecha_fin)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {semanaSeleccionada && (
          <>
            {/* Resumen semanal */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <p className="text-sm text-green-600 font-medium">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-700">
                  ${semanaSeleccionada.total_ingresos?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="p-4 bg-red-50 rounded-md border border-red-200">
                <p className="text-sm text-red-600 font-medium">Total Egresos</p>
                <p className="text-2xl font-bold text-red-700">
                  ${semanaSeleccionada.total_egresos?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className={`p-4 rounded-md border ${obtenerColorBalance(semanaSeleccionada.balance_neto || 0)}`}>
                <p className="text-sm font-medium">Balance Neto</p>
                <p className="text-2xl font-bold">
                  ${semanaSeleccionada.balance_neto?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Total Depositado</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${semanaSeleccionada.total_depositos?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-md border border-indigo-200">
                <p className="text-sm text-indigo-600 font-medium">Saldo Disponible</p>
                <p className="text-2xl font-bold text-indigo-700">
                  ${semanaSeleccionada.saldo_disponible?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Folders diarios con desglose */}
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Desglose por Día
                </h2>

                {folders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay folders para esta semana
                  </p>
                ) : (
                  folders.map((folder) => {
                    const registros = registrosPorFolder[folder.id] || [];
                    const ingresos = registros.filter(r => r.tipo === 'ingreso');
                    const egresos = registros.filter(r => r.tipo === 'egreso');

                    return (
                      <div
                        key={folder.id}
                        className="bg-white rounded-lg shadow border border-gray-200"
                      >
                        {/* Encabezado del folder */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {obtenerNombreDia(folder.fecha_laboral)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {folder.fecha_laboral}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              {folder.cerrado && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                  Cerrado
                                </span>
                              )}
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Balance</p>
                                <p className={`text-xl font-bold ${
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

                        {/* Desglose de registros */}
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Ingresos */}
                            <div>
                              <h4 className="text-sm font-semibold text-green-700 mb-2">
                                Ingresos ({ingresos.length})
                              </h4>
                              {ingresos.length === 0 ? (
                                <p className="text-sm text-gray-500">Sin ingresos</p>
                              ) : (
                                <div className="space-y-2">
                                  {ingresos.map((registro) => (
                                    <div
                                      key={registro.id}
                                      className="p-2 bg-green-50 rounded border border-green-200"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {registro.concepto}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {registro.empleado} • {registro.ruta}
                                          </p>
                                        </div>
                                        <p className="text-sm font-bold text-green-700">
                                          ${registro.monto.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-green-200">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium text-green-700">Total</p>
                                  <p className="text-lg font-bold text-green-700">
                                    ${folder.total_ingresos?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Egresos */}
                            <div>
                              <h4 className="text-sm font-semibold text-red-700 mb-2">
                                Egresos ({egresos.length})
                              </h4>
                              {egresos.length === 0 ? (
                                <p className="text-sm text-gray-500">Sin egresos</p>
                              ) : (
                                <div className="space-y-2">
                                  {egresos.map((registro) => (
                                    <div
                                      key={registro.id}
                                      className="p-2 bg-red-50 rounded border border-red-200"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {registro.concepto}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {registro.empleado} • {registro.ruta}
                                          </p>
                                        </div>
                                        <p className="text-sm font-bold text-red-700">
                                          ${registro.monto.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t border-red-200">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium text-red-700">Total</p>
                                  <p className="text-lg font-bold text-red-700">
                                    ${folder.total_egresos?.toFixed(2) || '0.00'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
