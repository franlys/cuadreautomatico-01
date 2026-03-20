import { type ReactNode, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { auditService } from '../services/AuditService';

interface ProtectedRouteProps {
  children: ReactNode;
  routePath: string;
  fallback?: ReactNode;
}

/**
 * Componente que protege rutas validando permisos antes de renderizar
 * 
 * - Valida permisos antes de renderizar ruta (Req 11.7)
 * - Redirige a página de acceso denegado si no tiene permisos
 * - Registra intento de acceso no autorizado en audit_logs (Req 11.7, 19.4)
 * 
 * @example
 * <ProtectedRoute routePath="/hojas-ruta">
 *   <HojasRutaPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ 
  children, 
  routePath,
  fallback 
}: ProtectedRouteProps) {
  const { canAccessRoute } = usePermissions();
  const hasAccess = canAccessRoute(routePath);

  useEffect(() => {
    // Registrar intento de acceso no autorizado
    if (!hasAccess) {
      auditService.logSecurityViolation(
        `route:${routePath}`,
        {
          tipo: 'acceso_ruta_no_autorizado',
          ruta: routePath,
          timestamp: new Date().toISOString()
        }
      );
    }
  }, [hasAccess, routePath]);

  // Si no tiene acceso, mostrar página de acceso denegado
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Acceso Denegado
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              No tienes permisos para acceder a esta página.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Si crees que esto es un error, contacta al administrador.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene acceso, renderizar el contenido
  return <>{children}</>;
}
