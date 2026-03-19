import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface Evidencia {
  id: string;
  archivo: File;
  preview: string;
  tipo: 'imagen' | 'pdf';
  subido: boolean;
  storage_path?: string;
}

interface UploaderEvidenciaProps {
  registroId?: string;
  onEvidenciasChange?: (evidencias: Evidencia[]) => void;
  maxEvidencias?: number;
}

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_TAMANO_MB = 10;
const MAX_TAMANO_BYTES = MAX_TAMANO_MB * 1024 * 1024;

export function UploaderEvidencia({
  registroId,
  onEvidenciasChange,
  maxEvidencias = 5,
}: UploaderEvidenciaProps) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const inputCameraRef = useRef<HTMLInputElement>(null);

  const validarArchivo = (archivo: File): string | null => {
    // Validar tipo
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return 'Solo se permiten archivos JPG, PNG o PDF';
    }

    // Validar tamaño
    if (archivo.size > MAX_TAMANO_BYTES) {
      return `El archivo excede el tamaño máximo de ${MAX_TAMANO_MB} MB`;
    }

    return null;
  };

  const generarPreview = async (archivo: File): Promise<string> => {
    if (archivo.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(archivo);
      });
    } else {
      // Ícono para PDF
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNCAySDZhMiAyIDAgMCAwLTIgMnYxNmEyIDIgMCAwIDAgMiAyaDEyYTIgMiAwIDAgMCAyLTJWOHoiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSIxNCAyIDE0IDggMjAgOCI+PC9wb2x5bGluZT48L3N2Zz4=';
    }
  };

  const agregarArchivos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;

    setError(null);

    // Validar límite de evidencias
    if (evidencias.length + archivos.length > maxEvidencias) {
      setError(`Solo se permiten hasta ${maxEvidencias} evidencias por registro`);
      return;
    }

    const nuevasEvidencias: Evidencia[] = [];

    for (let i = 0; i < archivos.length; i++) {
      const archivo = archivos[i];

      // Validar archivo
      const errorValidacion = validarArchivo(archivo);
      if (errorValidacion) {
        setError(errorValidacion);
        return;
      }

      // Generar preview
      const preview = await generarPreview(archivo);

      nuevasEvidencias.push({
        id: `temp-${Date.now()}-${i}`,
        archivo,
        preview,
        tipo: archivo.type.startsWith('image/') ? 'imagen' : 'pdf',
        subido: false,
      });
    }

    const evidenciasActualizadas = [...evidencias, ...nuevasEvidencias];
    setEvidencias(evidenciasActualizadas);

    if (onEvidenciasChange) {
      onEvidenciasChange(evidenciasActualizadas);
    }
  };

  const eliminarEvidencia = (id: string) => {
    const evidenciasActualizadas = evidencias.filter((e) => e.id !== id);
    setEvidencias(evidenciasActualizadas);

    if (onEvidenciasChange) {
      onEvidenciasChange(evidenciasActualizadas);
    }
  };

  const subirEvidencias = async () => {
    if (!registroId) {
      setError('No hay un registro asociado');
      return;
    }

    setSubiendo(true);
    setError(null);

    try {
      for (const evidencia of evidencias) {
        if (evidencia.subido) continue;

        // Generar nombre único para el archivo
        const extension = evidencia.archivo.name.split('.').pop();
        const nombreArchivo = `${registroId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        // Subir a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('evidencias')
          .upload(nombreArchivo, evidencia.archivo, {
            contentType: evidencia.archivo.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Guardar registro en la tabla evidencias
        const { error: insertError } = await supabase
          .from('evidencias')
          .insert([{
            registro_id: registroId,
            storage_path: nombreArchivo,
            nombre_archivo: evidencia.archivo.name,
            tipo_mime: evidencia.archivo.type,
            tamano_bytes: evidencia.archivo.size,
          }]);

        if (insertError) throw insertError;

        // Marcar como subido
        evidencia.subido = true;
        evidencia.storage_path = nombreArchivo;
      }

      setEvidencias([...evidencias]);
      alert('Evidencias subidas correctamente');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    agregarArchivos(e.target.files);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    agregarArchivos(e.target.files);
    if (inputCameraRef.current) {
      inputCameraRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Botones de carga */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputFileRef.current?.click()}
          disabled={evidencias.length >= maxEvidencias || subiendo}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📁 Seleccionar Archivos
        </button>

        <button
          type="button"
          onClick={() => inputCameraRef.current?.click()}
          disabled={evidencias.length >= maxEvidencias || subiendo}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📷 Tomar Foto
        </button>

        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <input
          ref={inputCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />
      </div>

      <p className="text-sm text-gray-600">
        {evidencias.length} / {maxEvidencias} evidencias • Máximo {MAX_TAMANO_MB} MB por archivo • JPG, PNG, PDF
      </p>

      {/* Lista de evidencias */}
      {evidencias.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {evidencias.map((evidencia) => (
            <div
              key={evidencia.id}
              className="relative border rounded-md overflow-hidden bg-gray-50"
            >
              {/* Preview */}
              <div className="aspect-square flex items-center justify-center bg-gray-100">
                {evidencia.tipo === 'imagen' ? (
                  <img
                    src={evidencia.preview}
                    alt={evidencia.archivo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4">
                    <img
                      src={evidencia.preview}
                      alt="PDF"
                      className="w-16 h-16 opacity-50"
                    />
                    <p className="text-xs text-gray-600 mt-2 text-center break-all">
                      {evidencia.archivo.name}
                    </p>
                  </div>
                )}
              </div>

              {/* Información */}
              <div className="p-2 bg-white">
                <p className="text-xs text-gray-600 truncate">
                  {evidencia.archivo.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(evidencia.archivo.size / 1024).toFixed(1)} KB
                </p>
                {evidencia.subido && (
                  <p className="text-xs text-green-600 font-medium">✓ Subido</p>
                )}
              </div>

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => eliminarEvidencia(evidencia.id)}
                disabled={subiendo}
                className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón subir */}
      {registroId && evidencias.length > 0 && evidencias.some(e => !e.subido) && (
        <button
          type="button"
          onClick={subirEvidencias}
          disabled={subiendo}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {subiendo ? 'Subiendo...' : 'Subir Evidencias'}
        </button>
      )}
    </div>
  );
}
