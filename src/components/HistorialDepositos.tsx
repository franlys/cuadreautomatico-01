import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFolderStore } from '../stores/folderStore';

interface Deposito {
  id: string;
  monto: number;
  fecha_deposito: string;
  banco: string | null;
  nota: string | null;
  created_at: string;
}

export function HistorialDepositos() {
  const { semanaActual } = useFolderStore();
  const [depositos, setDepositos] = useState<Deposito[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (semanaActual) {
      cargarDepositos();
      
      // Suscribirse a cambios en tiempo real
      const subscription = supabase
        .channel('depositos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'depositos',
            filter: `semana_laboral_id=eq.${semanaActual.id}`,
          },
          () => {
            cargarDepositos();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [semanaActual?.id]);

  const cargarDepositos = async () => {
    if (!semanaActual) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('depositos')
        .select('*')
        .eq('semana_laboral_id', semanaActual.id)
        .order('fecha_deposito', { ascending: false });

      if (error) throw error;
      setDepositos(data || []);
    } catch (err) {
      console.error('Error al cargar depósitos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (depositos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay depósitos registrados para esta semana
      </div>
    );
  }

  const totalDepositos = depositos.reduce((sum, d) => sum + d.monto, 0);

  return (
    <div className="space-y-4">
      {/* Total de depósitos */}
      <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
        <p className="text-sm text-purple-600 font-medium">Total Depositado</p>
        <p className="text-2xl font-bold text-purple-700">
          ${totalDepositos.toFixed(2)}
        </p>
      </div>

      {/* Lista de depósitos */}
      <div className="space-y-2">
        {depositos.map((deposito) => (
          <div
            key={deposito.id}
            className="p-4 border border-purple-200 rounded-md bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    Depósito
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(deposito.fecha_deposito + 'T00:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                
                {deposito.banco && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Banco:</span> {deposito.banco}
                  </p>
                )}
                
                {deposito.nota && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nota:</span> {deposito.nota}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Registrado: {new Date(deposito.created_at).toLocaleString('es-MX', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-700">
                  ${deposito.monto.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
