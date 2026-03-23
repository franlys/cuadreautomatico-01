import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { exportarPDF, exportarXLSX } from '../utils/exportador';
import type { SemanaLaboral, FolderDiario, Registro } from '../types';

interface BotonesExportacionProps {
  semana: SemanaLaboral;
  /** Folders ya cargados en el store — evita re-query y garantiza mismos datos que la UI */
  folders?: FolderDiario[];
}

export function BotonesExportacion({ semana, folders: foldersProps }: BotonesExportacionProps) {
  const { perfil } = useAuth();
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarDatosCompletos = async () => {
    try {
      // Usar folders del store si están disponibles; si no, consultarlos
      let carpetas: FolderDiario[] = foldersProps && foldersProps.length > 0
        ? foldersProps
        : [];

      if (carpetas.length === 0) {
        const { data: foldersDB, error: foldersError } = await supabase
          .from('folders_diarios')
          .select('*')
          .eq('semana_laboral_id', semana.id)
          .order('fecha_laboral', { ascending: true });
        if (foldersError) throw foldersError;
        carpetas = foldersDB || [];
      }

      // Cargar TODOS los registros de la semana en una sola query (igual que ResumenSemanal)
      const registrosPorFolder: Record<string, Registro[]> = {};
      if (carpetas.length > 0) {
        const folderIds = carpetas.map(f => f.id);
        const { data: registrosData, error: registrosError } = await supabase
          .from('registros')
          .select('*')
          .in('folder_diario_id', folderIds)
          .order('created_at', { ascending: true });
        if (registrosError) throw registrosError;
        // Agrupar por folder_diario_id
        for (const r of (registrosData || [])) {
          if (!registrosPorFolder[r.folder_diario_id]) {
            registrosPorFolder[r.folder_diario_id] = [];
          }
          registrosPorFolder[r.folder_diario_id].push(r);
        }
      }

      // Cargar depósitos (para Dueño y Usuario_Completo)
      let depositos = undefined;
      if (perfil?.rol === 'Dueño' || perfil?.rol === 'Usuario_Completo') {
        const { data: depositosData, error: depositosError } = await supabase
          .from('depositos')
          .select('monto, fecha_deposito, banco, nota')
          .eq('semana_laboral_id', semana.id)
          .order('fecha_deposito', { ascending: true });

        if (depositosError) throw depositosError;
        depositos = depositosData || [];
      }

      // Cargar nombre de empresa
      let nombreEmpresa: string | undefined;
      if (perfil?.empresa_id) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('nombre')
          .eq('id', perfil.empresa_id)
          .single();
        nombreEmpresa = empresaData?.nombre;
      }

      return {
        semana,
        folders: carpetas,
        registrosPorFolder,
        depositos,
        nombreEmpresa,
      };
    } catch (err: any) {
      throw new Error(`Error al cargar datos: ${err.message}`);
    }
  };

  const handleExportarPDF = async () => {
    try {
      setExportando(true);
      setError(null);

      const datos = await cargarDatosCompletos();
      exportarPDF(datos, perfil?.rol || 'Usuario_Ingresos');

      alert('Reporte PDF generado correctamente');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setExportando(false);
    }
  };

  const handleExportarXLSX = async () => {
    try {
      setExportando(true);
      setError(null);

      const datos = await cargarDatosCompletos();
      exportarXLSX(datos, perfil?.rol || 'Usuario_Ingresos');

      alert('Reporte XLSX generado correctamente');
    } catch (err: any) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleExportarPDF}
          disabled={exportando}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {exportando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generando...
            </>
          ) : (
            <>
              📄 Exportar PDF
            </>
          )}
        </button>

        <button
          onClick={handleExportarXLSX}
          disabled={exportando}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {exportando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generando...
            </>
          ) : (
            <>
              📊 Exportar XLSX
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-600 text-center">
        {perfil?.rol === 'Dueño' || perfil?.rol === 'Usuario_Completo'
          ? 'Exportarás todos los registros y depósitos'
          : perfil?.rol === 'Usuario_Ingresos'
          ? 'Exportarás solo los ingresos'
          : 'Exportarás solo los egresos'}
      </p>
    </div>
  );
}
