import { GestionCatalogo } from '../components/GestionCatalogo';
import { Layout } from '../components/Layout';

export function Catalogos() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Catálogos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra los catálogos de empleados, rutas y conceptos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GestionCatalogo tipo="empleados" titulo="Empleados" />
          <GestionCatalogo tipo="rutas" titulo="Rutas" />
          <GestionCatalogo tipo="conceptos" titulo="Conceptos" />
        </div>
      </div>
    </Layout>
  );
}
