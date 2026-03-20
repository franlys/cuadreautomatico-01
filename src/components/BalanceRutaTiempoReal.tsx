import { useState, useEffect } from 'react';
import { routeService } from '../services/RouteService';
import type { BalanceRuta } from '../types';

interface BalanceRutaTiempoRealProps {
  hojaRutaId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

export function BalanceRutaTiempoReal({ 
  hojaRutaId, 
  autoRefresh = true,
  refreshInterval = 5000 
}: BalanceRutaTiempoRealProps) {
  const [balance, setBalance] = useState<BalanceRuta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  useEffect(() => {
    cargarBalance();

    // Auto-refresh si está habilitado
    if (autoRefresh) {
      const interval = setInterval(() => {
        cargarBalance();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [hojaRutaId, autoRefresh, refreshInterval]);

  const cargarBalance = async () => {
    try {
      setError(null);
      const balanceData = await routeService.calculateBalance(hojaRutaId);
      setBalance(balanceData);
      setUltimaActualizacion(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refrescarManual = () => {
    setLoading(true);
    cargarBalance();
  };

  if (loading && !balance) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Calculando balance...</span>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Balance en Tiempo Real</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Actualizado: {ultimaActualizacion.toLocaleTimeString()}
          </span>
          <button
            onClick={refrescarManual}
            disabled={loading}
            className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            title="Refrescar balance"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Facturas Cobradas */}
        <div className="border-b pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Facturas Cobradas</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-xs text-green-600 font-medium">RD$</p>
              <p className="text-xl font-bold text-green-700">
                RD$ {balance.total_facturas_rdp.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <p className="text-xs text-green-600 font-medium">USD</p>
              <p className="text-xl font-bold text-green-700">
                USD {balance.total_facturas_usd.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Gastos Registrados */}
        <div className="border-b pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Gastos Registrados</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-xs text-red-600 font-medium">RD$</p>
              <p className="text-xl font-bold text-red-700">
                RD$ {balance.total_gastos_rdp.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-xs text-red-600 font-medium">USD</p>
              <p className="text-xl font-bold text-red-700">
                USD {balance.total_gastos_usd.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Dinero Disponible */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Dinero Disponible</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-md ${
              balance.dinero_disponible_rdp >= 0 
                ? 'bg-blue-50' 
                : 'bg-orange-50'
            }`}>
              <p className={`text-xs font-medium ${
                balance.dinero_disponible_rdp >= 0 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                RD$
              </p>
              <p className={`text-2xl font-bold ${
                balance.dinero_disponible_rdp >= 0 
                  ? 'text-blue-700' 
                  : 'text-orange-700'
              }`}>
                RD$ {balance.dinero_disponible_rdp.toFixed(2)}
              </p>
              {balance.dinero_disponible_rdp < 0 && (
                <p className="text-xs text-orange-600 mt-1">⚠️ Déficit</p>
              )}
            </div>
            <div className={`p-4 rounded-md ${
              balance.dinero_disponible_usd >= 0 
                ? 'bg-blue-50' 
                : 'bg-orange-50'
            }`}>
              <p className={`text-xs font-medium ${
                balance.dinero_disponible_usd >= 0 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                USD
              </p>
              <p className={`text-2xl font-bold ${
                balance.dinero_disponible_usd >= 0 
                  ? 'text-blue-700' 
                  : 'text-orange-700'
              }`}>
                USD {balance.dinero_disponible_usd.toFixed(2)}
              </p>
              {balance.dinero_disponible_usd < 0 && (
                <p className="text-xs text-orange-600 mt-1">⚠️ Déficit</p>
              )}
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs text-gray-600">
            ℹ️ El dinero disponible se calcula como: Monto Asignado + Cobros - Gastos
          </p>
        </div>
      </div>
    </div>
  );
}
