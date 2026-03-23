import { Layout } from '../components/Layout';
import { SemanaLaboral } from '../components/SemanaLaboral';
import { BotonesExportacion } from '../components/BotonesExportacion';
import { BotonEnviarReporte } from '../components/BotonEnviarReporte';
import { useFolderStore } from '../stores/folderStore';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Registro, SemanaLaboral as SemanaLaboralType, FolderDiario } from '../types';
import { formatearFecha } from '../utils/fechaLaboral';

export function ResumenSemanal() {
  const { semanaActual, folders: foldersActuales, obtenerOCrearSemanaActual } = useFolderStore();
  const { perfil } = useAuthStore();

  // Estado para selector de semana histórica
  const [semanas, setSemanas] = useState<SemanaLaboralType[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<SemanaLaboralType | null>(null);
  const [foldersHistorico, setFoldersHistorico] = useState<FolderDiario[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  useEffect(() => {
    obtenerOCrearSemanaActual();
    cargarSemanas();
  }, []);

  // Cuando carga la semana actual, seleccionarla por defecto
  useEffect(() => {
    if (semanaActual && !semanaSeleccionada) {
      setSemanaSeleccionada(semanaActual);
    }
  }, [semanaActual]);

  // Cuando cambia la semana seleccionada, cargar sus folders
  useEffect(() => {
    if (semanaSeleccionada) {
      const esActual = semanaActual && semanaSeleccionada.id === semanaActual.id;
      if (esActual) {
        setFoldersHistorico([]);
      } else {
        cargarFoldersHistorico(semanaSeleccionada.id);
      }
    }
  }, [semanaSeleccionada?.id]);

  // Cargar registros para el botón de enviar reporte
  useEffect(() => {
    const foldersAUsar = esVistaActual ? foldersActuales : foldersHistorico;
    if (semanaSeleccionada && foldersAUsar.length > 0) {
      cargarRegistros(foldersAUsar);
    }
  }, [semanaSeleccionada, foldersActuales, foldersHistorico]);

  const esVistaActual = !!(semanaActual && semanaSeleccionada?.id === semanaActual.id);
  const foldersActivos = esVistaActual ? foldersActuales : foldersHistorico;

  const cargarSemanas = async () => {
    const { data } = await supabase
      .from('semanas_laborales')
      .select('*')
      .order('fecha_inicio', { ascending: false })
      .limit(20);
    if (data) setSemanas(data);
  };

  const cargarFoldersHistorico = async (semanaId: string) => {
    const { data } = await supabase
      .from('folders_diarios')
      .select('*')
      .eq('semana_laboral_id', semanaId)
      .order('fecha_laboral', { ascending: true });
    setFoldersHistorico(data || []);
  };

  const cargarRegistros = async (folders: FolderDiario[]) => {
    try {
      setCargandoRegistros(true);
      const folderIds = folders.map(f => f.id);
      const { data, error } = await supabase
        .from('registros')
        .select('*')
        .in('folder_diario_id', folderIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setRegistros(data || []);
    } catch (err) {
      console.error('Error al cargar registros:', err);
    } finally {
      setCargandoRegistros(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resumen Semanal</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vista consolidada de la semana laboral
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            {/* Selector de semana */}
            {semanas.length > 1 && (
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semana
                </label>
                <select
                  value={semanaSeleccionada?.id || ''}
                  onChange={(e) => {
                    const s = semanas.find(x => x.id === e.target.value);
                    if (s) setSemanaSeleccionada(s);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {semanas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatearFecha(s.fecha_inicio)} – {formatearFecha(s.fecha_fin)}
                      {semanaActual?.id === s.id ? ' (actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botones de exportación */}
            {semanaSeleccionada && (
              <div className="w-72">
                <BotonesExportacion semana={semanaSeleccionada} folders={foldersActivos} />
              </div>
            )}
          </div>
        </div>

        {/* Vista semana actual: usa el componente SemanaLaboral con tiempo real */}
        {esVistaActual ? (
          <SemanaLaboral />
        ) : semanaSeleccionada ? (
          /* Vista semana histórica */
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Semana {formatearFecha(semanaSeleccionada.fecha_inicio)} – {formatearFecha(semanaSeleccionada.fecha_fin)}
            </h2>

            {/* Totales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-md min-w-0">
                <p className="text-sm text-green-600 font-medium whitespace-nowrap">Total Ingresos</p>
                <p className="text-xl font-bold text-green-700 truncate" title={`$${semanaSeleccionada.total_ingresos?.toFixed(2) || '0.00'}`}>
                  ${semanaSeleccionada.total_ingresos?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-md min-w-0">
                <p className="text-sm text-red-600 font-medium whitespace-nowrap">Total Egresos</p>
                <p className="text-xl font-bold text-red-700 truncate" title={`$${semanaSeleccionada.total_egresos?.toFixed(2) || '0.00'}`}>
                  ${semanaSeleccionada.total_egresos?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-md min-w-0">
                <p className="text-sm text-blue-600 font-medium whitespace-nowrap">Balance Neto</p>
                <p className="text-xl font-bold text-blue-700 truncate" title={`$${semanaSeleccionada.balance_neto?.toFixed(2) || '0.00'}`}>
                  ${semanaSeleccionada.balance_neto?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Folders */}
            {foldersHistorico.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay registros para esta semana</p>
            ) : (
              <div className="space-y-2">
                {foldersHistorico.map((folder) => (
                  <div key={folder.id} className="p-4 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-gray-900">{folder.fecha_laboral}</p>
                      <div className="flex gap-6 text-sm">
                        <span className="text-green-700 font-semibold">
                          Ing: ${folder.total_ingresos?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-red-700 font-semibold">
                          Egr: ${folder.total_egresos?.toFixed(2) || '0.00'}
                        </span>
                        {folder.cerrado && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">Cerrado</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Botón Enviar Reporte - Solo para Usuario_Ingresos en semana actual */}
        {perfil?.rol === 'Usuario_Ingresos' && esVistaActual && semanaActual && !cargandoRegistros && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Envío Rápido de Reporte
            </h2>
            <BotonEnviarReporte
              semana={semanaActual}
              folders={foldersActuales}
              registros={registros}
              destinatarioEmail={import.meta.env.VITE_DUENO_EMAIL || 'dueno@empresa.com'}
              destinatarioWhatsApp={import.meta.env.VITE_DUENO_WHATSAPP || '+521234567890'}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
