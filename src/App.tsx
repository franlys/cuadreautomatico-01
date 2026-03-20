import { useState, useEffect } from 'react';
import { AuthGuard } from './components/AuthGuard';
import { EstadoSincronizacion } from './components/EstadoSincronizacion';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './stores/authStore';
import { usePermissions } from './hooks/usePermissions';
import { Catalogos } from './pages/Catalogos';
import { FolderDiarioPage } from './pages/FolderDiarioPage';
import { ResumenSemanal } from './pages/ResumenSemanal';
import { Depositos } from './pages/Depositos';
import { DashboardDueno } from './pages/DashboardDueno';
import HojasRutaPage from './pages/HojasRutaPage';
import { DashboardSuperAdmin } from './pages/DashboardSuperAdmin';
import { configurarSincronizacionAutomatica } from './lib/sync';

function App() {
  useEffect(() => {
    // Configurar sincronización automática al montar la app
    configurarSincronizacionAutomatica();
  }, []);

  return (
    <AuthGuard>
      <MainApp />
      <EstadoSincronizacion />
    </AuthGuard>
  );
}

type Vista = 'inicio' | 'catalogos' | 'folder' | 'resumen' | 'depositos' | 'dashboard' | 'hojas-ruta' | 'super-admin';

function MainApp() {
  const { perfil } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const { 
    canAccessRoute, 
    hasAutomacionCompleta,
    isSuperAdmin 
  } = usePermissions();
  const [vistaActual, setVistaActual] = useState<Vista>('inicio');
  
  const esDueno = perfil?.rol === 'Dueño';
  const esSuperAdmin = isSuperAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Cuadre Automático
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {perfil?.nombre} ({perfil?.rol})
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
          
          {/* Menú de navegación con interfaz adaptativa (Req 18.1-18.6) */}
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setVistaActual('inicio')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                vistaActual === 'inicio'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inicio
            </button>
            
            {/* Dashboard Super Admin - solo visible para Super_Admin */}
            {esSuperAdmin && canAccessRoute('/super-admin') && (
              <button
                onClick={() => setVistaActual('super-admin')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'super-admin'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Super Admin
              </button>
            )}
            
            {/* Dashboard Dueño */}
            {esDueno && canAccessRoute('/dashboard') && (
              <button
                onClick={() => setVistaActual('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'dashboard'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dashboard
              </button>
            )}
            
            {/* Hojas de Ruta - solo visible en automatización completa (Req 18.2) */}
            {hasAutomacionCompleta() && canAccessRoute('/hojas-ruta') && (
              <button
                onClick={() => setVistaActual('hojas-ruta')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'hojas-ruta'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🚀 Hojas de Ruta
              </button>
            )}
            
            {canAccessRoute('/folder') && (
              <button
                onClick={() => setVistaActual('folder')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'folder'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Folder Diario
              </button>
            )}
            
            {canAccessRoute('/resumen') && (
              <button
                onClick={() => setVistaActual('resumen')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'resumen'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Resumen Semanal
              </button>
            )}
            
            {canAccessRoute('/depositos') && (
              <button
                onClick={() => setVistaActual('depositos')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'depositos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Depósitos
              </button>
            )}
            
            {canAccessRoute('/catalogos') && (
              <button
                onClick={() => setVistaActual('catalogos')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  vistaActual === 'catalogos'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Catálogos
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {vistaActual === 'inicio' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bienvenido al Sistema
            </h2>
            <p className="text-gray-600 mb-4">
              Sistema de cuadre automático para gestión de ingresos y egresos diarios.
            </p>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-md">
                <h3 className="text-sm font-semibold text-green-900 mb-2">
                  ✓ Módulos Implementados
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Autenticación con Supabase Auth</li>
                  <li>• Control de roles (Usuario_Ingresos, Usuario_Egresos, Dueño)</li>
                  <li>• Bloqueo por 3 intentos fallidos (15 minutos)</li>
                  <li>• Notificación al Dueño por correo cuando un usuario es bloqueado</li>
                  <li>• Sesión activa por 8 horas de inactividad</li>
                  <li>• Gestión de catálogos (Empleados, Rutas, Conceptos)</li>
                  <li>• Validación de unicidad en catálogos</li>
                  <li>• Búsqueda en tiempo real</li>
                  <li>• Gestión de Folders Diarios</li>
                  <li>• Regla del Lunes (registros del lunes → sábado anterior)</li>
                  <li>• Cálculo automático de balances diarios</li>
                  <li>• Cierre de folders (solo Dueño)</li>
                  <li>• Carga de evidencias (JPG, PNG, PDF)</li>
                  <li>• Actualización en tiempo real con Supabase Realtime</li>
                  <li>• Resumen semanal consolidado</li>
                  <li>• Registro y seguimiento de depósitos bancarios</li>
                  <li>• Cálculo automático de saldo disponible</li>
                  <li>• Dashboard del Dueño con datos en tiempo real</li>
                  <li>• Navegación entre semanas históricas</li>
                  <li>• Desglose detallado por día y tipo</li>
                  <li>• Exportación de reportes en PDF y XLSX</li>
                  <li>• Filtrado de datos por rol de usuario</li>
                  <li>• Sistema de permisos por rol y nivel de automatización</li>
                  <li>• Interfaz adaptativa según nivel de automatización</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-md">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  📋 Próximos Pasos
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Notificaciones por correo y WhatsApp</li>
                  <li>• Modo offline (PWA)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {vistaActual === 'super-admin' && esSuperAdmin && <DashboardSuperAdmin />}
        
        {vistaActual === 'catalogos' && <Catalogos />}
        
        {vistaActual === 'folder' && <FolderDiarioPage />}
        
        {vistaActual === 'resumen' && <ResumenSemanal />}
        
        {vistaActual === 'depositos' && <Depositos />}
        
        {vistaActual === 'dashboard' && esDueno && <DashboardDueno />}
        
        {vistaActual === 'hojas-ruta' && hasAutomacionCompleta() && <HojasRutaPage />}
      </div>
    </div>
  );
}

export default App;
