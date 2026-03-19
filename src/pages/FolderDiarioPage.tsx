import { Layout } from '../components/Layout';
import { FolderDiario } from '../components/FolderDiario';
import { FormularioRegistro } from '../components/FormularioRegistro';
import { ListaRegistros } from '../components/ListaRegistros';
import { DebugAuth } from '../components/DebugAuth';
import { useAuth } from '../hooks/useAuth';
import { useFolderStore } from '../stores/folderStore';

export function FolderDiarioPage() {
  const { perfil } = useAuth();
  const { refrescarFolderActual } = useFolderStore();

  const puedeRegistrarIngresos = perfil?.rol === 'Usuario_Ingresos' || perfil?.rol === 'Usuario_Completo';
  const puedeRegistrarEgresos = perfil?.rol === 'Usuario_Egresos' || perfil?.rol === 'Usuario_Completo';

  return (
    <Layout>
      <DebugAuth />
      
      <div className="space-y-6">
        <FolderDiario />
        
        {/* Formularios de registro */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {puedeRegistrarIngresos && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-green-700 mb-4">
                Registrar Ingreso
              </h3>
              <FormularioRegistro
                tipo="ingreso"
                onRegistroCreado={refrescarFolderActual}
              />
            </div>
          )}
          
          {puedeRegistrarEgresos && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4">
                Registrar Egreso
              </h3>
              <FormularioRegistro
                tipo="egreso"
                onRegistroCreado={refrescarFolderActual}
              />
            </div>
          )}
        </div>

        {/* Lista de registros */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Registros del Día
          </h3>
          <ListaRegistros />
        </div>
      </div>
    </Layout>
  );
}
