import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { LoginForm } from './LoginForm';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'Usuario_Ingresos' | 'Usuario_Egresos' | 'Dueño'>;
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, perfil, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login
  if (!user || !perfil) {
    return <LoginForm />;
  }

  // Si hay roles permitidos, verificar que el usuario tenga uno de ellos
  if (allowedRoles && !allowedRoles.includes(perfil.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  No tienes permisos suficientes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Tu rol ({perfil.rol}) no tiene acceso a esta sección.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con permisos correctos
  return <>{children}</>;
}
