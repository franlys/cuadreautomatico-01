import { Layout } from '../components/Layout';
import { SemanaLaboral } from '../components/SemanaLaboral';
import { BotonesExportacion } from '../components/BotonesExportacion';
import { BotonEnviarReporte } from '../components/BotonEnviarReporte';
import { useFolderStore } from '../stores/folderStore';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Registro } from '../types';

export function ResumenSemanal() {
  const { semanaActual, folders, obtenerOCrearSemanaActual } = useFolderStore();
  const { perfil } = useAuthStore();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);

  useEffect(() => {
    obtenerOCrearSemanaActual();
  }, []);

  // Cargar registros de la semana para el botón de enviar reporte
  useEffect(() => {
    if (semanaActual && folders.length > 0) {
      cargarRegistros();
    }
  }, [semanaActual, folders]);

  const cargarRegistros = async () => {
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resumen Semanal</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vista consolidada de la semana laboral actual
            </p>
          </div>

          {/* Botones de exportación */}
          {semanaActual && (
            <div className="w-80">
              <BotonesExportacion semana={semanaActual} folders={folders} />
            </div>
          )}
        </div>

        <SemanaLaboral />

        {/* Botón Enviar Reporte - Solo para Usuario_Ingresos */}
        {perfil?.rol === 'Usuario_Ingresos' && semanaActual && !cargandoRegistros && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Envío Rápido de Reporte
            </h2>
            <BotonEnviarReporte
              semana={semanaActual}
              folders={folders}
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
