import { useAuthStore } from '../stores/authStore';
import type { Perfil } from '../types';

export function useAuth() {
  const { user, perfil, loading, error } = useAuthStore();

  const isAuthenticated = !!user && !!perfil;
  
  const hasRole = (role: Perfil['rol']) => {
    return perfil?.rol === role;
  };

  const hasAnyRole = (roles: Array<Perfil['rol']>) => {
    return perfil ? roles.includes(perfil.rol) : false;
  };

  const isUsuarioIngresos = hasRole('Usuario_Ingresos');
  const isUsuarioEgresos = hasRole('Usuario_Egresos');
  const isUsuarioCompleto = hasRole('Usuario_Completo');
  const isDueno = hasRole('Dueño');
  const isSuperAdmin = hasRole('Super_Admin');
  const isEncargadoAlmacen = hasRole('Encargado_Almacén');
  const isSecretaria = hasRole('Secretaria');
  const isEmpleadoRuta = hasRole('Empleado_Ruta');

  return {
    user,
    perfil,
    loading,
    error,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isUsuarioIngresos,
    isUsuarioEgresos,
    isUsuarioCompleto,
    isDueno,
    isSuperAdmin,
    isEncargadoAlmacen,
    isSecretaria,
    isEmpleadoRuta,
  };
}
