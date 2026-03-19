import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFolderStore } from '../stores/folderStore';
import { useAuth } from '../hooks/useAuth';
import { VisorEvidencias } from './VisorEvidencias';
import type { Registro } from '../types';

export function ListaRegistros() {
  const { perfil } = useAuth();
  const { folderActual, refrescarFolderActual } = useFolderStore();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'ingreso' | 'egreso'>('todos');

  useEffect(() => {
    if (folderActual) {
      cargarRegistros();
      
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('registros-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registros',
            filter: `folder_diario_id=eq.${folderActual.id}`,
          },
          () => {
            cargarRegistros();
            refrescarFolderActual();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [folderActual?.id]);

  const cargarRegistros = async () => {
    if (!folderActual) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registros')
        .select('*')
        .eq('folder_diario_id', folderActual.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err) {
      console.error('Error al cargar registros:', err);
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = registros.filter(registro => {
    if (filtro === 'todos') return true;
    return registro.tipo === filtro;
  });

  // Filtrar por permisos de rol
  const registrosVisibles = registrosFiltrados.filter(registro => {
    if (perfil?.rol === 'Dueño') return true;
    if (perfil?.rol === 'Usuario_Ingresos') return registro.tipo === 'ingreso';
    if (perfil?.rol === 'Usuario_Egresos') return registro.tipo === 'egreso';
    return false;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      {perfil?.rol === 'Dueño' && (
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filtro === 'todos'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todos ({registros.length})
          </button>
          <button
            onClick={() => setFiltro('ingreso')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filtro === 'ingreso'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Ingresos ({registros.filter(r => r.tipo === 'ingreso').length})
          </button>
          <button
            onClick={() => setFiltro('egreso')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filtro === 'egreso'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Egresos ({registros.filter(r => r.tipo === 'egreso').length})
          </button>
        </div>
      )}

      {/* Lista de registros */}
      {registrosVisibles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay registros para mostrar
        </div>
      ) : (
        <div className="space-y-2">
          {registrosVisibles.map((registro) => (
            <div
              key={registro.id}
              className={`p-4 border rounded-md ${
                registro.tipo === 'ingreso'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        registro.tipo === 'ingreso'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {registro.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(registro.created_at).toLocaleString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  
                  <p className="font-medium text-gray-900 mb-1">
                    {registro.concepto}
                  </p>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Empleado:</span> {registro.empleado}
                    </p>
                    <p>
                      <span className="font-medium">Ruta:</span> {registro.ruta}
                    </p>
                  </div>

                  {/* Evidencias */}
                  <div className="mt-3">
                    <VisorEvidencias registroId={registro.id} />
                  </div>
                </div>
                
                <div className="text-right">
                  <p
                    className={`text-2xl font-bold ${
                      registro.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    ${registro.monto.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
