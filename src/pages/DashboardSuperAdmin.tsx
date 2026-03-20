import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { tenantService } from '../services/TenantService';
import type { Empresa, EmpresaStats } from '../types';

interface EmpresaConStats extends Empresa {
  stats?: EmpresaStats;
}

export function DashboardSuperAdmin() {
  const [empresas, setEmpresas] = useState<EmpresaConStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'fecha' | 'actividad'>('nombre');

  useEffect(() => {
    cargarEmpresas();
  }, []);

  const cargarEmpresas = async () => {
    try {
      setLoading(true);
      const empresasData = await tenantService.getAllEmpresas();
      
      // Cargar estadísticas para cada empresa
      const empresasConStats = await Promise.all(
        empresasData.map(async (empresa) => {
          try {
            const stats = await tenantService.getEmpresaStats(empresa.id);
            return { ...empresa, stats };
          } catch (error) {
            console.error(`Error al cargar stats de ${empresa.nombre}:`, error);
            return empresa;
          }
        })
      );

      setEmpresas(empresasConStats);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const empresasFiltradas = empresas
    .filter((empresa) =>
      empresa.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      switch (ordenamiento) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'fecha':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'actividad':
          const fechaA = a.stats?.ultima_actividad?.getTime() || 0;
          const fechaB = b.stats?.ultima_actividad?.getTime() || 0;
          return fechaB - fechaA;
        default:
          return 0;
      }
    });

  const empresasActivas = empresas.filter((e) => e.activa).length;
  const empresasInactivas = empresas.filter((e) => !e.activa).length;

  const formatearFecha = (fecha: string | Date | null | undefined) => {
    if (!fecha) return 'Sin actividad';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Super Admin</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestión de empresas en la plataforma multi-tenant
          </p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Empresas Activas</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{empresasActivas}</p>
          </div>

          <div className="p-6 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-600 font-medium">Empresas Desactivadas</p>
            <p className="text-3xl font-bold text-red-700 mt-2">{empresasInactivas}</p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm text-indigo-600 font-medium">Total Empresas</p>
            <p className="text-3xl font-bold text-indigo-700 mt-2">{empresas.length}</p>
          </div>
        </div>

        {/* Controles de búsqueda y ordenamiento */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar empresa por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="nombre">Ordenar por Nombre</option>
            <option value="fecha">Ordenar por Fecha de Creación</option>
            <option value="actividad">Ordenar por Última Actividad</option>
          </select>
        </div>

        {/* Lista de empresas */}
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : empresasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {busqueda ? 'No se encontraron empresas' : 'No hay empresas registradas'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuarios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {empresa.logo_url ? (
                          <img
                            src={empresa.logo_url}
                            alt={empresa.nombre}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold text-lg">
                              {empresa.nombre.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {empresa.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            Creada: {formatearFecha(empresa.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          empresa.nivel_automatizacion === 'completa'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {empresa.nivel_automatizacion === 'completa' ? 'Completa' : 'Parcial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empresa.stats?.total_usuarios || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {empresa.stats?.storage_usado_mb.toFixed(2) || '0.00'} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatearFecha(empresa.stats?.ultima_actividad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          empresa.activa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {empresa.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
