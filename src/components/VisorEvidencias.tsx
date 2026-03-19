import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Evidencia {
  id: string;
  storage_path: string;
  nombre_archivo: string;
  tipo_mime: string;
  tamano_bytes: number;
}

interface VisorEvidenciasProps {
  registroId: string;
}

export function VisorEvidencias({ registroId }: VisorEvidenciasProps) {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarEvidencias();
  }, [registroId]);

  const cargarEvidencias = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('evidencias')
        .select('*')
        .eq('registro_id', registroId);

      if (error) throw error;

      setEvidencias(data || []);

      // Obtener URLs firmadas para cada evidencia
      const urlsTemp: Record<string, string> = {};
      for (const evidencia of data || []) {
        const { data: urlData } = await supabase.storage
          .from('evidencias')
          .createSignedUrl(evidencia.storage_path, 3600); // 1 hora

        if (urlData) {
          urlsTemp[evidencia.id] = urlData.signedUrl;
        }
      }
      setUrls(urlsTemp);

    } catch (err) {
      console.error('Error al cargar evidencias:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">
        Cargando evidencias...
      </div>
    );
  }

  if (evidencias.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Sin evidencias
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        Evidencias ({evidencias.length})
      </p>
      <div className="grid grid-cols-3 gap-2">
        {evidencias.map((evidencia) => (
          <a
            key={evidencia.id}
            href={urls[evidencia.id]}
            target="_blank"
            rel="noopener noreferrer"
            className="block border rounded-md overflow-hidden hover:border-indigo-500 transition-colors"
          >
            {evidencia.tipo_mime.startsWith('image/') ? (
              <img
                src={urls[evidencia.id]}
                alt={evidencia.nombre_archivo}
                className="w-full h-20 object-cover"
              />
            ) : (
              <div className="w-full h-20 flex items-center justify-center bg-gray-100">
                <span className="text-2xl">📄</span>
              </div>
            )}
            <div className="p-1 bg-white">
              <p className="text-xs text-gray-600 truncate">
                {evidencia.nombre_archivo}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
