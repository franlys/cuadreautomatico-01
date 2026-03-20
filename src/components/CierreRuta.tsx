import { useState, useEffect } from 'react';
import { routeService } from '../services/RouteService';
import { auditService } from '../services/AuditService';
import type { BalanceRuta } from '../types';

interface CierreRutaProps {
  hojaRutaId: string;
  onCerrada?: () => void;
}

export function CierreRuta({ hojaRutaId, onCerrada }: CierreRutaProps) {
  const [balance, setBalance] = useState<BalanceRuta | null>(null);
  const [montoFisicoRD, setMontoFisicoRD] = useState('');
  const [montoFisicoUSD, setMontoFisicoUSD] = useState('');
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  useEffect(() => {
    cargarBalance();
  }, [hojaRutaId]);

  const cargarBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const balanceData = await routeService.calculateBalance(hojaRutaId);
      setBalance(balanceData);
      
      // Pre-llenar con el monto calculado
      setMontoFisicoRD(balanceData.dinero_disponible_rdp.toFixed(2));
      setMontoFisicoUSD(balanceData.dinero_disponible_usd.toFixed(2));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calcularDiferencias = () => {
    if (!balance) return { diferenciaRD: 0, diferenciaUSD: 0 };

    const montoFisicoRDNum = parseFloat(montoFisicoRD) || 0;
    const montoFisicoUSDNum = parseFloat(montoFisicoUSD) || 0;

    return {
      diferenciaRD: montoFisicoRDNum - balance.dinero_disponible_rdp,
      diferenciaUSD: montoFisicoUSDNum - balance.dinero_disponible_usd
    };
  };

  const handleCerrar = async () => {
    if (!balance) return;

    const montoFisicoRDNum = parseFloat(montoFisicoRD) || 0;
    const montoFisicoUSDNum = parseFloat(montoFisicoUSD) || 0;

    // Validar que al menos uno de los montos sea mayor a 0
    if (montoFisicoRDNum <= 0 && montoFisicoUSDNum <= 0) {
      alert('Debe ingresar al menos un monto físico mayor a 0');
      return;
    }

    setMostrarConfirmacion(true);
  };

  const confirmarCierre = async () => {
    try {
      setCerrando(true);
      setError(null);

      const montoFisicoRDNum = parseFloat(montoFisicoRD) || 0;
      const montoFisicoUSDNum = parseFloat(montoFisicoUSD) || 0;

      await routeService.closeRuta(hojaRutaId, {
        monto_fisico_rdp: montoFisicoRDNum,
        monto_fisico_usd: montoFisicoUSDNum
      });

      // Registrar en auditoría
      const diferencias = calcularDiferencias();
      await auditService.logRutaClosure(hojaRutaId, {
        monto_calculado_rdp: balance?.dinero_disponible_rdp,
        monto_calculado_usd: balance?.dinero_disponible_usd,
        monto_fisico_rdp: montoFisicoRDNum,
        monto_fisico_usd: montoFisicoUSDNum,
        diferencia_rdp: diferencias.diferenciaRD,
        diferencia_usd: diferencias.diferenciaUSD
      });

      alert('Hoja de ruta cerrada exitosamente. Se ha creado el registro de ingreso automáticamente.');
      
      if (onCerrada) {
        onCerrada();
      }
    } catch (err: any) {
      setError(err.message);
      alert(`Error al cerrar ruta: ${err.message}`);
    } finally {
      setCerrando(false);
      setMostrarConfirmacion(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Cargando información de cierre...</span>
        </div>
      </div>
    );
  }

  if (error && !balance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const diferencias = calcularDiferencias();
  const hayDiferencia = Math.abs(diferencias.diferenciaRD) > 0.01 || Math.abs(diferencias.diferenciaUSD) > 0.01;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Cierre de Ruta</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Cálculo Automático */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Cálculo Automático</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-600 font-medium mb-1">Monto Esperado RD$</p>
              <p className="text-2xl font-bold text-blue-700">
                RD$ {balance.dinero_disponible_rdp.toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-blue-600 space-y-1">
                <p>Facturas: +RD$ {balance.total_facturas_rdp.toFixed(2)}</p>
                <p>Gastos: -RD$ {balance.total_gastos_rdp.toFixed(2)}</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-600 font-medium mb-1">Monto Esperado USD</p>
              <p className="text-2xl font-bold text-blue-700">
                USD {balance.dinero_disponible_usd.toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-blue-600 space-y-1">
                <p>Facturas: +USD {balance.total_facturas_usd.toFixed(2)}</p>
                <p>Gastos: -USD {balance.total_gastos_usd.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monto Físico Contado */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Monto Físico Contado</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Físico RD$
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">RD$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoFisicoRD}
                  onChange={(e) => setMontoFisicoRD(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto Físico USD
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">USD</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoFisicoUSD}
                  onChange={(e) => setMontoFisicoUSD(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Diferencias */}
        {hayDiferencia && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-sm font-medium text-amber-800 mb-2">⚠️ Diferencias Detectadas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Math.abs(diferencias.diferenciaRD) > 0.01 && (
                <div>
                  <p className="text-amber-700">
                    Diferencia RD$: 
                    <span className={`ml-2 font-semibold ${
                      diferencias.diferenciaRD > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {diferencias.diferenciaRD > 0 ? '+' : ''}RD$ {diferencias.diferenciaRD.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
              {Math.abs(diferencias.diferenciaUSD) > 0.01 && (
                <div>
                  <p className="text-amber-700">
                    Diferencia USD: 
                    <span className={`ml-2 font-semibold ${
                      diferencias.diferenciaUSD > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {diferencias.diferenciaUSD > 0 ? '+' : ''}USD {diferencias.diferenciaUSD.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              {diferencias.diferenciaRD > 0 || diferencias.diferenciaUSD > 0 
                ? 'Hay más dinero físico del esperado (sobrante)' 
                : 'Hay menos dinero físico del esperado (faltante)'}
            </p>
          </div>
        )}

        {/* Botón de Cierre */}
        <button
          onClick={handleCerrar}
          disabled={cerrando}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cerrando ? 'Cerrando Ruta...' : 'Cerrar Ruta'}
        </button>

        {/* Nota informativa */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600">
            ℹ️ Al cerrar la ruta se creará automáticamente un registro de ingreso en el folder diario 
            de la fecha correspondiente. La hoja de ruta quedará bloqueada y no se podrán realizar más cambios.
          </p>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Cierre de Ruta
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-700">
                ¿Está seguro de cerrar esta ruta con los siguientes montos?
              </p>
              <div className="p-3 bg-gray-50 rounded-md space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Físico RD$:</span>
                  <span className="font-semibold">RD$ {parseFloat(montoFisicoRD || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto Físico USD:</span>
                  <span className="font-semibold">USD {parseFloat(montoFisicoUSD || '0').toFixed(2)}</span>
                </div>
              </div>
              {hayDiferencia && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ Hay diferencias entre el cálculo automático y el monto físico
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-600">
                Esta acción no se puede deshacer. Se creará un registro de ingreso automáticamente.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                disabled={cerrando}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCierre}
                disabled={cerrando}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {cerrando ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
