import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';

/**
 * Componente de depuración para verificar el estado de autenticación
 * TEMPORAL - Solo para diagnóstico
 * 
 * Para usar: Agregar <DebugAuth /> en cualquier página
 */
export function DebugAuth() {
  const { user, perfil, loading, error, isAuthenticated } = useAuth();
  const authState = useAuthStore();

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="text-lg font-bold text-blue-700 mb-2">
        🔍 Debug Auth
      </h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Loading:</strong> {loading ? '✅ Sí' : '❌ No'}
        </div>
        
        <div>
          <strong>Authenticated:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || '❌ No hay user'}
        </div>
        
        <div>
          <strong>User Email:</strong> {user?.email || '❌ No hay email'}
        </div>
        
        <div className="border-t pt-2">
          <strong>Perfil ID:</strong> {perfil?.id || '❌ No hay perfil'}
        </div>
        
        <div>
          <strong>Perfil Nombre:</strong> {perfil?.nombre || '❌ No hay nombre'}
        </div>
        
        <div className="text-lg font-bold">
          <strong>ROL:</strong> {perfil?.rol || '❌ NO HAY ROL'}
        </div>
        
        {error && (
          <div className="border-t pt-2 text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="border-t pt-2">
          <strong>Bloqueado hasta:</strong> {perfil?.bloqueado_hasta || 'No bloqueado'}
        </div>
        
        <div>
          <strong>Intentos fallidos:</strong> {perfil?.intentos_fallidos || 0}
        </div>
      </div>
      
      <button
        onClick={() => {
          console.log('=== AUTH STATE ===');
          console.log('User:', user);
          console.log('Perfil:', perfil);
          console.log('Loading:', loading);
          console.log('Error:', error);
          console.log('Auth Store:', authState);
        }}
        className="mt-3 w-full bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700"
      >
        Log to Console
      </button>
    </div>
  );
}
