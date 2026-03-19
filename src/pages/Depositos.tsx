import { Layout } from '../components/Layout';
import { FormularioDeposito } from '../components/FormularioDeposito';
import { HistorialDepositos } from '../components/HistorialDepositos';
import { useFolderStore } from '../stores/folderStore';
import { useEffect } from 'react';

export function Depositos() {
  const { semanaActual, obtenerOCrearSemanaActual } = useFolderStore();

  useEffect(() => {
    obtenerOCrearSemanaActual();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depósitos Bancarios</h1>
          <p className="mt-1 text-sm text-gray-600">
            Registra y da seguimiento a los depósitos realizados
          </p>
        </div>

        {/* Información de saldo disponible */}
        {semanaActual && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow p-6 border border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Balance Neto Semanal</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${semanaActual.balance_neto?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Depositado</p>
                <p className="text-2xl font-bold text-purple-700">
                  ${semanaActual.total_depositos?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-indigo-600 font-medium">Saldo Disponible</p>
                <p className="text-3xl font-bold text-indigo-700">
                  ${semanaActual.saldo_disponible?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Balance Neto - Total Depositado
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de registro */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registrar Depósito
            </h3>
            <FormularioDeposito
              onDepositoCreado={() => obtenerOCrearSemanaActual()}
            />
          </div>

          {/* Historial */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Historial de Depósitos
            </h3>
            <HistorialDepositos />
          </div>
        </div>
      </div>
    </Layout>
  );
}
