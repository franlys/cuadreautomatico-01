import { useEffect, useState } from 'react';
import { userService } from '../services/UserService';
import type { Perfil, Empresa } from '../types';

interface GestionUsuariosEmpresaProps {
  empresaId: string;
  empresa: Empresa;
}

export function GestionUsuariosEmpresa({ empresaId, empresa }: GestionUsuariosEmpresaProps) {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Perfil['rol']>('Usuario_Completo');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, [empresaId]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsersByEmpresa(empresaId);
      setUsuarios(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const rolesDisponibles = (): Perfil['rol'][] => {
    const rolesBase: Perfil['rol'][] = [
      'Usuario_Ingresos',
      'Usuario_Egresos',
      'Usuario_Completo',
      'Dueño'
    ];

    if (empresa.nivel_automatizacion === 'completa') {
      return [
        ...rolesBase,
        'Encargado_Almacén',
        'Secretaria',
        'Empleado_Ruta'
      ];
    }

    return rolesBase;
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setGuardando(true);
      await userService.createUser({
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        rol,
        empresa_id: empresaId
      });

      // Limpiar formulario
      setNombre('');
      setEmail('');
      setPassword('');
      setRol('Usuario_Completo');
      setMostrarFormulario(false);

      // Recargar lista
      await cargarUsuarios();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarRol = async (usuarioId: string, nuevoRol: Perfil['rol']) => {
    try {
      await userService.updateUserRole(usuarioId, nuevoRol);
      await cargarUsuarios();
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      setError('Error al cambiar rol del usuario');
    }
  };

  const handleDesactivarUsuario = async (usuarioId: string) => {
    if (!confirm('¿Está seguro de desactivar este usuario?')) {
      return;
    }

    try {
      await userService.deactivateUser(usuarioId);
      await cargarUsuarios();
    } catch (err) {
      console.error('Error al desactivar usuario:', err);
      setError('Error al desactivar usuario');
    }
  };

  const handleReactivarUsuario = async (usuarioId: string) => {
    try {
      await userService.reactivateUser(usuarioId);
      await cargarUsuarios();
    } catch (err) {
      console.error('Error al reactivar usuario:', err);
      setError('Error al reactivar usuario');
    }
  };

  const estaDesactivado = (usuario: Perfil): boolean => {
    if (!usuario.bloqueado_hasta) return false;
    return new Date(usuario.bloqueado_hasta) > new Date();
  };

  const obtenerNombreRol = (rol: Perfil['rol']): string => {
    const nombres: Record<Perfil['rol'], string> = {
      'Super_Admin': 'Super Admin',
      'Usuario_Ingresos': 'Usuario Ingresos',
      'Usuario_Egresos': 'Usuario Egresos',
      'Usuario_Completo': 'Usuario Completo',
      'Dueño': 'Dueño',
      'Encargado_Almacén': 'Encargado Almacén',
      'Secretaria': 'Secretaria',
      'Empleado_Ruta': 'Empleado Ruta'
    };
    return nombres[rol] || rol;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios de {empresa.nombre}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona los usuarios y sus roles en esta empresa
          </p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {mostrarFormulario ? 'Cancelar' : 'Crear Usuario'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Formulario de creación */}
      {mostrarFormulario && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
          <form onSubmit={handleCrearUsuario} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: Juan Pérez"
                required
                disabled={guardando}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="usuario@ejemplo.com"
                required
                disabled={guardando}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={guardando}
              />
            </div>

            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as Perfil['rol'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={guardando}
              >
                {rolesDisponibles().map((r) => (
                  <option key={r} value={r}>
                    {obtenerNombreRol(r)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No hay usuarios en esta empresa</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => {
                const desactivado = estaDesactivado(usuario);
                return (
                  <tr key={usuario.id} className={desactivado ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={usuario.rol}
                        onChange={(e) => handleCambiarRol(usuario.id, e.target.value as Perfil['rol'])}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={desactivado}
                      >
                        {rolesDisponibles().map((r) => (
                          <option key={r} value={r}>
                            {obtenerNombreRol(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          desactivado
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {desactivado ? 'Desactivado' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {desactivado ? (
                        <button
                          onClick={() => handleReactivarUsuario(usuario.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Reactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDesactivarUsuario(usuario.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
