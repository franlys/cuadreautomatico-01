import { useEffect, useState } from 'react';
import { tenantService } from '../services/TenantService';
import { userService } from '../services/UserService';
import type { Empresa } from '../types';

interface SelectorContextoEmpresaProps {
  onContextChange?: (empresaId: string | null) => void;
}

export function SelectorContextoEmpresa({ onContextChange }: SelectorContextoEmpresaProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mostrarSelector, setMostrarSelector] = useState(false);

  useEffect(() => {
    verificarPermisos();
  }, []);

  const verificarPermisos = async () => {
    try {
      const esSuperAdmin = await userService.isSuperAdmin();
      setIsSuperAdmin(esSuperAdmin);

      if (esSuperAdmin) {
        const empresasData = await tenantService.getAllEmpresas();
        setEmpresas(empresasData.filter((e) => e.activa));
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarEmpresa = (empresaId: string | null) => {
    setEmpresaSeleccionada(empresaId);
    setMostrarSelector(false);
    onContextChange?.(empresaId);
  };

  const empresaActual = empresas.find((e) => e.id === empresaSeleccionada);

  // No mostrar el selector si no es Super Admin
  if (!isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Botón selector */}
      <button
        onClick={() => setMostrarSelector(!mostrarSelector)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <div className="text-left">
          <p className="text-xs text-gray-500">Contexto</p>
          <p className="text-sm font-medium text-gray-900">
            {empresaActual ? empresaActual.nombre : 'Vista Global'}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            mostrarSelector ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {mostrarSelector && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setMostrarSelector(false)}
          ></div>

          {/* Menú desplegable */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Seleccionar Empresa
              </div>

              {/* Opción: Vista Global */}
              <button
                onClick={() => handleSeleccionarEmpresa(null)}
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 ${
                  !empresaSeleccionada ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Vista Global</p>
                    <p className="text-xs text-gray-500">Todas las empresas</p>
                  </div>
                  {!empresaSeleccionada && (
                    <svg
                      className="w-5 h-5 text-indigo-600 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>

              <div className="my-2 border-t border-gray-200"></div>

              {/* Lista de empresas */}
              <div className="max-h-64 overflow-y-auto">
                {empresas.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-gray-500 text-center">
                    No hay empresas activas
                  </p>
                ) : (
                  empresas.map((empresa) => (
                    <button
                      key={empresa.id}
                      onClick={() => handleSeleccionarEmpresa(empresa.id)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 ${
                        empresaSeleccionada === empresa.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {empresa.logo_url ? (
                          <img
                            src={empresa.logo_url}
                            alt={empresa.nombre}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-sm">
                              {empresa.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{empresa.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {empresa.nivel_automatizacion === 'completa'
                              ? 'Automatización Completa'
                              : 'Automatización Parcial'}
                          </p>
                        </div>
                        {empresaSeleccionada === empresa.id && (
                          <svg
                            className="w-5 h-5 text-indigo-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
