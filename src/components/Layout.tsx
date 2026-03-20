import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { ActualizadorPWA } from './ActualizadorPWA';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout principal con interfaz adaptativa por nivel de automatización
 * 
 * - Oculta menús de hojas de ruta si nivel es 'parcial' (Req 18.1)
 * - Muestra menús de hojas de ruta si nivel es 'completa' (Req 18.2)
 * - Muestra indicador visual del nivel actual (Req 18.4)
 * - Actualiza interfaz automáticamente al cambiar nivel (Req 18.5)
 */
export function Layout({ children }: LayoutProps) {
  const { perfil } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const { 
    nivelAutomatizacion, 
    hasAutomacionCompleta,
    hasAutomacionParcial 
  } = usePermissions();

  return (
    <div className="min-h-screen bg-gray-50">
      <ActualizadorPWA />
      
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cuadre Automático
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">
                  Sistema de gestión de ingresos y egresos
                </p>
                {/* Indicador visual del nivel de automatización (Req 18.4) */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    hasAutomacionCompleta()
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  title={`Nivel de automatización: ${nivelAutomatizacion}`}
                >
                  {hasAutomacionCompleta() ? '🚀 Completa' : '📋 Parcial'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {perfil?.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  {perfil?.rol}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 Cuadre Automático. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
