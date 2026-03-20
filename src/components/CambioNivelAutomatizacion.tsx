import { useState } from 'react';
import { tenantService } from '../services/TenantService';
import { useAuth } from '../hooks/useAuth';
import type { Empresa, NivelAutomatizacion } from '../types';

interface CambioNivelAutomatizacionProps {
  empresa: Empresa;
  onCambioExitoso: () => void;
}

export function CambioNivelAutomatizacion({ empresa, onCambioExitoso }: CambioNivelAutomatizacionProps) {
  const { user } = useAuth();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoNivel, setNuevoNivel] = useState<NivelAutomatizacion>(empresa.nivel_automatizacion);
  const [loading, setLoading] = useState(false);

  const handleCambiarNivel = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await tenantService.changeAutomationLevel(empresa.id, nuevoNivel, user.id);
      
      alert('Nivel de automatización actualizado exitosamente');
      setMostrarModal(false);
      onCambioExitoso();
    } catch (error: any) {
      console.error('Error al cambiar nivel:', error);
      alert(error.message || 'Error al cambiar el nivel de automatización');
    } finally {
      setLoading(false);
    }
  };

  const nivelActual = empresa.nivel_automatizacion;

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Nivel de Automatización</h2>
        
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-700">Nivel actual:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              nivelActual === 'parcial' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-purple-100 text-purple-800'
            }`}>
              {nivelActual === 'parcial' ? 'Automatización Parcial' : 'Automatización Completa'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600">
            {nivelActual === 'parcial' 
              ? 'Sistema actual de cuadre automático con folders diarios y semanas laborales.'
              : 'Sistema completo con hojas de ruta digitales, gestión de facturas y gastos en tiempo real.'}
          </p>
        </div>

        {nivelActual === 'parcial' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">
              ¿Quieres actualizar a Automatización Completa?
            </h3>
            <p className="text-sm text-purple-800 mb-3">
              La automatización completa incluye:
            </p>
            <ul className="text-sm text-purple-800 space-y-1 mb-4 ml-4">
              <li>• Hojas de ruta digitales para empleados</li>
              <li>• Gestión de facturas con seguimiento de entrega y cobro</li>
              <li>• Registro de gastos con evidencias fotográficas</li>
              <li>• Balance en tiempo real por moneda (RD$ y USD)</li>
              <li>• Cierre automático de rutas con cálculo de diferencias</li>
            </ul>
            <button
              onClick={() => {
                setNuevoNivel('completa');
                setMostrarModal(true);
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Actualizar a Automatización Completa
            </button>
          </div>
        )}

        {nivelActual === 'completa' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-green-900">
                  Automatización Completa Activa
                </h3>
                <p className="text-sm text-green-800 mt-1">
                  Esta empresa tiene acceso a todas las funcionalidades avanzadas de la plataforma.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirmar Cambio de Nivel</h3>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Advertencia</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Este cambio activará nuevas funcionalidades en la plataforma. Los usuarios de esta empresa verán nuevos menús y opciones.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nivel actual:</span>
                  <span className="font-semibold">
                    {nivelActual === 'parcial' ? 'Automatización Parcial' : 'Automatización Completa'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nuevo nivel:</span>
                  <span className="font-semibold text-purple-600">
                    {nuevoNivel === 'parcial' ? 'Automatización Parcial' : 'Automatización Completa'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCambiarNivel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Actualizando...' : 'Confirmar Cambio'}
              </button>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setNuevoNivel(nivelActual);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
