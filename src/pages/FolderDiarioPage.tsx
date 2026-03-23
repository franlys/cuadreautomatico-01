import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { FormularioRegistro } from '../components/FormularioRegistro';
import { ListaRegistros } from '../components/ListaRegistros';
import { useFolderStore } from '../stores/folderStore';
import { useAuth } from '../hooks/useAuth';
import { obtenerFechaLaboral, obtenerNombreDia, formatearFecha } from '../utils/fechaLaboral';
import type { FolderDiario } from '../types';

function esDomingo(): boolean {
  return new Date().getDay() === 0;
}

function esLunes(): boolean {
  return new Date().getDay() === 1;
}

export function FolderDiarioPage() {
  const { perfil } = useAuth();
  const {
    folderActual,
    foldersRecientes,
    loading,
    error,
    obtenerOCrearFolderActual,
    cerrarFolder,
    cargarFoldersRecientes,
    seleccionarFolder,
    refrescarFolderActual,
  } = useFolderStore();

  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const puedeRegistrarIngresos = perfil?.rol === 'Usuario_Ingresos' || perfil?.rol === 'Usuario_Completo';
  const puedeRegistrarEgresos = perfil?.rol === 'Usuario_Egresos' || perfil?.rol === 'Usuario_Completo';
  const puedeCerrar = perfil?.rol === 'Usuario_Completo';

  const fechaLaboralHoy = obtenerFechaLaboral(new Date());

  // Al montar: cargar historial y, si hay folder activo de hoy, seleccionarlo
  useEffect(() => {
    cargarFoldersRecientes().then(() => {
      // Si ya hay un folder para hoy en recientes, seleccionarlo automáticamente
      const store = useFolderStore.getState();
      const folderDeHoy = store.foldersRecientes.find(
        f => f.fecha_laboral === fechaLaboralHoy
      );
      if (folderDeHoy && !store.folderActual) {
        seleccionarFolder(folderDeHoy);
      }
    });
  }, []);

  const handleAbrirDia = async () => {
    setAbriendo(true);
    await obtenerOCrearFolderActual();
    await cargarFoldersRecientes();
    setAbriendo(false);
  };

  const handleCerrarFolder = async () => {
    if (!folderActual) return;
    if (!confirm('¿Cerrar este folder? Ya no se podrán agregar registros.')) return;
    setCerrando(true);
    try {
      await cerrarFolder(folderActual.id);
      await cargarFoldersRecientes();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCerrando(false);
    }
  };

  const handleSeleccionarFolder = (folder: FolderDiario) => {
    seleccionarFolder(folder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Domingo ─────────────────────────────────────────────────────────────
  if (esDomingo()) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Folder Diario</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-4xl mb-3">🌅</p>
            <p className="text-xl font-semibold text-blue-800">Hoy es domingo</p>
            <p className="text-blue-600 mt-1">No hay trabajo programado. ¡Descansa!</p>
          </div>
          <HistorialFolders
            folders={foldersRecientes}
            folderActual={folderActual}
            fechaLaboralHoy={fechaLaboralHoy}
            onSeleccionar={handleSeleccionarFolder}
          />
        </div>
      </Layout>
    );
  }

  const folderDeHoy = foldersRecientes.find(f => f.fecha_laboral === fechaLaboralHoy);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Folder Diario</h1>
            {esLunes() && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Lunes: los registros de hoy pertenecen al sábado anterior ({fechaLaboralHoy})
              </p>
            )}
          </div>

          {/* Botón Abrir Día — solo si no existe folder para hoy */}
          {!folderDeHoy && (
            <button
              onClick={handleAbrirDia}
              disabled={abriendo || loading}
              className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {abriendo ? 'Abriendo...' : '+ Abrir Día'}
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        )}

        {/* Folder activo seleccionado */}
        {folderActual ? (
          <div className="space-y-6">
            {/* Info del folder */}
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">
                    Folder activo
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 mt-0.5 capitalize">
                    {obtenerNombreDia(folderActual.fecha_laboral)} — {formatearFecha(folderActual.fecha_laboral)}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {folderActual.cerrado ? (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full font-medium">
                      🔒 Cerrado
                    </span>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                        ✓ Abierto
                      </span>
                      {puedeCerrar && (
                        <button
                          onClick={handleCerrarFolder}
                          disabled={cerrando}
                          className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-full hover:bg-red-700 disabled:opacity-50"
                        >
                          {cerrando ? 'Cerrando...' : 'Cerrar día'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-xs text-green-600 font-medium">Ingresos</p>
                  <p className="text-xl font-bold text-green-700">
                    ${folderActual.total_ingresos?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-xs text-red-600 font-medium">Egresos</p>
                  <p className="text-xl font-bold text-red-700">
                    ${folderActual.total_egresos?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg text-center ${
                  (folderActual.balance_diario || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  <p className={`text-xs font-medium ${
                    (folderActual.balance_diario || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>Balance</p>
                  <p className={`text-xl font-bold ${
                    (folderActual.balance_diario || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    ${folderActual.balance_diario?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Formularios — solo si el folder está abierto */}
            {!folderActual.cerrado && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {puedeRegistrarIngresos && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-base font-semibold text-green-700 mb-4">
                      Registrar Ingreso
                    </h3>
                    <FormularioRegistro
                      tipo="ingreso"
                      onRegistroCreado={refrescarFolderActual}
                    />
                  </div>
                )}
                {puedeRegistrarEgresos && (
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-base font-semibold text-red-700 mb-4">
                      Registrar Egreso
                    </h3>
                    <FormularioRegistro
                      tipo="egreso"
                      onRegistroCreado={refrescarFolderActual}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Registros del día */}
            <div className="bg-white rounded-lg shadow p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Registros del Día
              </h3>
              <ListaRegistros />
            </div>
          </div>
        ) : (
          /* Sin folder activo */
          !folderDeHoy && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-400 text-4xl mb-3">📂</p>
              <p className="text-gray-600 font-medium">No hay un día abierto</p>
              <p className="text-sm text-gray-400 mt-1">
                Presiona "Abrir Día" para comenzar a registrar
              </p>
            </div>
          )
        )}

        {/* Historial de folders */}
        <HistorialFolders
          folders={foldersRecientes}
          folderActual={folderActual}
          fechaLaboralHoy={fechaLaboralHoy}
          onSeleccionar={handleSeleccionarFolder}
        />
      </div>
    </Layout>
  );
}

// ── Componente de historial ──────────────────────────────────────────────────
interface HistorialProps {
  folders: FolderDiario[];
  folderActual: FolderDiario | null;
  fechaLaboralHoy: string;
  onSeleccionar: (f: FolderDiario) => void;
}

function HistorialFolders({ folders, folderActual, fechaLaboralHoy, onSeleccionar }: HistorialProps) {
  // Excluir domingos (artefactos del código anterior)
  const foldersFiltrados = folders.filter(f => {
    const dia = new Date(f.fecha_laboral + 'T12:00:00').getDay();
    return dia !== 0;
  });

  if (foldersFiltrados.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Historial de Días</h3>
      <div className="space-y-2">
        {foldersFiltrados.map(folder => {
          const esActivo = folderActual?.id === folder.id;
          const esHoy = folder.fecha_laboral === fechaLaboralHoy;
          return (
            <button
              key={folder.id}
              onClick={() => onSeleccionar(folder)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                esActivo
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 capitalize text-sm">
                    {obtenerNombreDia(folder.fecha_laboral)}
                  </span>
                  <span className="text-xs text-gray-500">{folder.fecha_laboral}</span>
                  {esHoy && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">
                      Hoy
                    </span>
                  )}
                  {folder.cerrado ? (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      🔒 Cerrado
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                      Abierto
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-xs font-medium">
                  <span className="text-green-700">
                    +${folder.total_ingresos?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-red-700">
                    -${folder.total_egresos?.toFixed(2) || '0.00'}
                  </span>
                  <span className={`font-bold ${
                    (folder.balance_diario || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    =${folder.balance_diario?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
