import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, perfil, loading, error } = useAuthStore();

  const isAuthenticated = !!user && !!perfil;
  
  const hasRole = (role: 'Usuario_Ingresos' | 'Usuario_Egresos' | 'Dueño') => {
    return perfil?.rol === role;
  };

  const hasAnyRole = (roles: Array<'Usuario_Ingresos' | 'Usuario_Egresos' | 'Dueño'>) => {
    return perfil ? roles.includes(perfil.rol) : false;
  };

  const isUsuarioIngresos = hasRole('Usuario_Ingresos');
  const isUsuarioEgresos = hasRole('Usuario_Egresos');
  const isDueno = hasRole('Dueño');

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
    isDueno,
  };
}
