import { useState, useEffect } from 'react';
import { estaOnline, sincronizarTodo, type ConflictoSincronizacion, resolverConflicto } from '../lib/sync';
import { db } from '../lib/db';

export function EstadoSincronizacion() {
  const [online, setOnline] = useState(estaOnline());
  const [sincronizando, setSincronizando] = useState(false);
  const [registrosPendientes, setRegistrosPendientes] = useState(0);
  const [evidenciasPendientes, setEvidenciasPendientes] = useState(0);
  const [conflictos, setConflictos] = useState<ConflictoSincronizacion[]>([]);
  const [mostrarConflictos, setMostrarConflictos] = useState(false);

  useEffect(() => {
    // Actualizar estado de conexión
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cargar contadores iniciales
    cargarContadores();

    // Actualizar contadores cada 10 segundos
    const interval = setInterval(cargarContadores, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const cargarContadores = async () => {
    try {
      const registros = await db.registros_pendientes
        .where('sincronizado')
        .equals(0)
        .count();
      
      const evidencias = await db.evidencias_pendientes
        .where('sincronizado')
        .equals(0)
        .count();

      setRegistrosPendientes(registros);
      setEvidenciasPendientes(evidencias);
    } catch (error: any) {
      // Si hay error de esquema de base de datos, silenciar el error
      // El usuario puede limpiar IndexedDB manualmente si necesita modo offline
      if (error?.name === 'DatabaseClosedError' || error?.name === 'DataError') {
        // No hacer nada, el componente simplemente no mostrará contadores
        return;
      }
      console.error('Error al cargar contadores:', error);
    }
  };

  const handleSincronizar = async () => {
    if (!online) {
      alert('No hay conexión a internet');
      return;
    }

    try {
      setSincronizando(true);
      const resultado = await sincronizarTodo();

      if (resultado.registros.conflictos.length > 0) {
        setConflictos(resultado.registros.conflictos);
        setMostrarConflictos(true);
      } else {
        alert(
          `Sincronización exitosa:\n` +
          `- ${resultado.registros.exitosos} registros\n` +
          `- ${resultado.evidencias.exitosos} evidencias`
        );
      }

      await cargarContadores();
    } catch (error: any) {
      console.error('Error al sincronizar:', error);
      alert(`Error al sincronizar: ${error.message}`);
    } finally {
      setSincronizando(false);
    }
  };

  const handleResolverConflicto = async (
    conflicto: ConflictoSincronizacion,
    version: 'local' | 'servidor'
  ) => {
    try {
      await resolverConflicto(conflicto, version);
      setConflictos(prev => prev.filter(c => c.registro_local.id !== conflicto.registro_local.id));
      
      if (conflictos.length === 1) {
        setMostrarConflictos(false);
        alert('Todos los conflictos han sido resueltos');
      }
    } catch (error: any) {
      alert(`Error al resolver conflicto: ${error.message}`);
    }
  };

  const totalPendientes = registrosPendientes + evidenciasPendientes;

  if (totalPendientes === 0 && online && !mostrarConflictos) {
    return null; // No mostrar nada si todo está sincronizado
  }

  return (
    <>
      {/* Indicador de estado */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`rounded-lg shadow-lg p-4 ${online ? 'bg-white' : 'bg-yellow-50 border-2 border-yellow-400'}`}>
          <div className="flex items-center gap-3">
            {/* Indicador de conexión */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {online ? 'En línea' : 'Sin conexión'}
              </span>
            </div>

            {/* Contador de pendientes */}
            {totalPendientes > 0 && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-300">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm text-gray-700">
                  {totalPendientes} pendiente{totalPendientes !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Botón de sincronizar */}
            {online && totalPendientes > 0 && (
              <button
                onClick={handleSincronizar}
                disabled={sincronizando}
                className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sincronizando ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            )}
          </div>

          {/* Detalles de pendientes */}
          {totalPendientes > 0 && (
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              {registrosPendientes > 0 && (
                <div>• {registrosPendientes} registro{registrosPendientes !== 1 ? 's' : ''}</div>
              )}
              {evidenciasPendientes > 0 && (
                <div>• {evidenciasPendientes} evidencia{evidenciasPendientes !== 1 ? 's' : ''}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de conflictos */}
      {mostrarConflictos && conflictos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Conflictos de Sincronización
              </h2>
              <p className="text-gray-600 mb-6">
                Se encontraron {conflictos.length} conflicto{conflictos.length !== 1 ? 's' : ''}.
                Por favor, selecciona qué versión deseas conservar para cada registro.
              </p>

              <div className="space-y-6">
                {conflictos.map((conflicto, index) => (
                  <div key={conflicto.registro_local.id} className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Conflicto {index + 1}: {conflicto.registro_local.concepto}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Versión local */}
                      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
                        <h4 className="font-medium text-blue-900 mb-2">Versión Local</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Tipo:</strong> {conflicto.registro_local.tipo}</p>
                          <p><strong>Concepto:</strong> {conflicto.registro_local.concepto}</p>
                          <p><strong>Empleado:</strong> {conflicto.registro_local.empleado}</p>
                          <p><strong>Ruta:</strong> {conflicto.registro_local.ruta}</p>
                          <p><strong>Monto:</strong> ${conflicto.registro_local.monto.toFixed(2)}</p>
                          <p><strong>Actualizado:</strong> {new Date(conflicto.registro_local.updated_at).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleResolverConflicto(conflicto, 'local')}
                          className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Usar esta versión
                        </button>
                      </div>

                      {/* Versión servidor */}
                      <div className="border border-green-300 rounded-lg p-4 bg-green-50">
                        <h4 className="font-medium text-green-900 mb-2">Versión Servidor</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Tipo:</strong> {conflicto.registro_servidor.tipo}</p>
                          <p><strong>Concepto:</strong> {conflicto.registro_servidor.concepto}</p>
                          <p><strong>Empleado:</strong> {conflicto.registro_servidor.empleado}</p>
                          <p><strong>Ruta:</strong> {conflicto.registro_servidor.ruta}</p>
                          <p><strong>Monto:</strong> ${conflicto.registro_servidor.monto.toFixed(2)}</p>
                          <p><strong>Actualizado:</strong> {new Date(conflicto.registro_servidor.updated_at).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleResolverConflicto(conflicto, 'servidor')}
                          className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Usar esta versión
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setMostrarConflictos(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
