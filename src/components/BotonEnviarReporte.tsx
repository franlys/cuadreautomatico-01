import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { exportarPDF, exportarXLSX } from '../utils/exportador';
import type { SemanaLaboral, FolderDiario, Registro } from '../types';

interface BotonEnviarReporteProps {
  semana: SemanaLaboral;
  folders: FolderDiario[];
  registros: Registro[];
  destinatarioEmail: string;
  destinatarioWhatsApp?: string;
}

export function BotonEnviarReporte({
  semana,
  folders,
  registros,
  destinatarioEmail,
  destinatarioWhatsApp,
}: BotonEnviarReporteProps) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{
    email: { success: boolean; message: string };
    whatsapp: { success: boolean; message: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnviarReporte = async () => {
    try {
      setEnviando(true);
      setError(null);
      setResultado(null);

      // Generar PDF (sin descargar)
      const pdfBlob = exportarPDF(
        {
          semana,
          folders,
          registrosPorFolder: registros.reduce((acc, r) => {
            if (!acc[r.folder_diario_id]) acc[r.folder_diario_id] = [];
            acc[r.folder_diario_id].push(r);
            return acc;
          }, {} as Record<string, Registro[]>),
        },
        'Dueño',
        false // No descargar, solo generar Blob
      );

      // Generar XLSX (sin descargar)
      const xlsxBlob = exportarXLSX(
        {
          semana,
          folders,
          registrosPorFolder: registros.reduce((acc, r) => {
            if (!acc[r.folder_diario_id]) acc[r.folder_diario_id] = [];
            acc[r.folder_diario_id].push(r);
            return acc;
          }, {} as Record<string, Registro[]>),
        },
        'Dueño',
        false // No descargar, solo generar Blob
      );

      // Convertir blobs a base64
      const pdfBase64 = await blobToBase64(pdfBlob);
      const xlsxBase64 = await blobToBase64(xlsxBlob);

      // Llamar a la Edge Function
      const { data, error: invokeError } = await supabase.functions.invoke('notificador', {
        body: {
          semana_id: semana.id,
          destinatario_email: destinatarioEmail,
          destinatario_whatsapp: destinatarioWhatsApp || '',
          pdf_base64: pdfBase64,
          xlsx_base64: xlsxBase64,
          incluir_evidencias: false,
        },
      });

      if (invokeError) {
        throw new Error(`Error al invocar función: ${invokeError.message}`);
      }

      if (!data.success) {
        throw new Error('Error al enviar reporte');
      }

      // Guardar resultado
      setResultado({
        email: data.email,
        whatsapp: data.whatsapp,
      });

      // Mostrar mensaje de éxito
      if (data.email.success && data.whatsapp.success) {
        alert('✅ Reporte enviado exitosamente por correo y WhatsApp');
      } else if (data.email.success) {
        alert('✅ Reporte enviado por correo\n⚠️ Error en WhatsApp: ' + data.whatsapp.message);
      } else if (data.whatsapp.success) {
        alert('⚠️ Error en correo: ' + data.email.message + '\n✅ Reporte enviado por WhatsApp');
      } else {
        alert('❌ Error al enviar reporte:\nCorreo: ' + data.email.message + '\nWhatsApp: ' + data.whatsapp.message);
      }
    } catch (err: any) {
      console.error('Error al enviar reporte:', err);
      setError(err.message);
      alert(`❌ Error al enviar reporte: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón principal */}
      <button
        onClick={handleEnviarReporte}
        disabled={enviando}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
      >
        {enviando ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Enviando reporte...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Enviar Reporte al Dueño</span>
          </>
        )}
      </button>

      {/* Resultado del envío */}
      {resultado && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Estado del Envío</h4>

          {/* Estado del correo */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {resultado.email.success ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Correo Electrónico</p>
              <p className="text-sm text-gray-600">{resultado.email.message}</p>
            </div>
          </div>

          {/* Estado de WhatsApp */}
          {destinatarioWhatsApp && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {resultado.whatsapp.success ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                <p className="text-sm text-gray-600">{resultado.whatsapp.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error general */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Destinatario:</strong> {destinatarioEmail}
          {destinatarioWhatsApp && ` • ${destinatarioWhatsApp}`}
        </p>
        <p className="text-sm text-blue-700 mt-1">
          Se enviará el reporte completo con archivos PDF y XLSX adjuntos.
        </p>
      </div>
    </div>
  );
}

// Función auxiliar para convertir Blob a Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remover el prefijo "data:application/...;base64,"
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
