import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { routeService } from '../services/RouteService';
import { supabase } from '../lib/supabase';
import { FormularioHojaRuta } from '../components/FormularioHojaRuta';
import { VistaHojaRutaEmpleado } from '../components/VistaHojaRutaEmpleado';
import { CierreRuta } from '../components/CierreRuta';
import type { HojaRuta } from '../types';

export default function HojasRutaPage() {
  const { perfil } = useAuth();
  const [hojas, setHojas] = useState<HojaRuta[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState<'lista' | 'crear' | 'ver' | 'cerrar'>('lista');
  const [hojaSeleccionada, setHojaSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    cargarHojas();
  }, []);

  const cargarHojas = async () => {
    try {
      setLoading(true);
      
      // Si es empleado de ruta, solo ver sus hojas
      if (perfil?.rol === 'Empleado_Ruta') {
        const { data: empleado } = await supabase
          .from('empleados')
          .select('id')
          .eq('nombre', perfil.nombre)
          .single();
        
        if (empleado) {
          const hojasEmpleado = await routeService.getHojasRutaByEmpleado(empleado.id);
          setHojas(hojasEmpleado);
        }
      } else {
        // Otros roles ven todas las hojas
        const todasHojas = await routeService.getAllHojasRuta();
        setHojas(todasHojas);
      }
    } catch (err: any) {
      console.error('Error al cargar hojas:', err);
    } finally {
      setLoading(false);
    }
  };

  const puedeCrear = perfil?.rol === 'Encargado_Almacén' || perfil?.rol === 'Secretaria' || perfil?.rol === 'Usuario_Completo';
  const puedeCerrar = perfil?.rol === 'Usuario_Completo' || perfil?.rol === 'Dueño';
  const esEmpleadoRuta = perfil?.rol === 'Empleado_Ruta';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hojas de Ruta Digitales</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestión de hojas de ruta con seguimiento en tiempo real
        </p>
      </div>

      {/* Navegación */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => {
            setVistaActual('lista');
            setHojaSeleccionada(null);
          }}
          className={`px-4 py-2 rounded-md font-medium ${
            vistaActual === 'lista'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Lista de Hojas
        </button>
        {puedeCrear && (
          <button
            onClick={() => setVistaActual('crear')}
            className={`px-4 py-2 rounded-md font-medium ${
              vistaActual === 'crear'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Crear Nueva Hoja
          </button>
        )}
      </div>

      {/* Contenido */}
      {vistaActual === 'lista' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {esEmpleadoRuta ? 'Mis Hojas de Ruta' : 'Todas las Hojas de Ruta'}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {hojas.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay hojas de ruta disponibles
              </div>
            ) : (
              hojas.map((hoja) => (
                <div key={hoja.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {hoja.identificador}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Estado: <span className="font-medium capitalize">{hoja.estado}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Monto asignado: RD$ {hoja.monto_asignado_rdp.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setHojaSeleccionada(hoja.id);
                          setVistaActual('ver');
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {esEmpleadoRuta ? 'Ejecutar' : 'Ver'}
                      </button>
                      {puedeCerrar && hoja.estado !== 'cerrada' && (
                        <button
                          onClick={() => {
                            setHojaSeleccionada(hoja.id);
                            setVistaActual('cerrar');
                          }}
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Cerrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {vistaActual === 'crear' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Crear Nueva Hoja de Ruta</h2>
          <FormularioHojaRuta
            onHojaCreada={() => {
              cargarHojas();
              setVistaActual('lista');
            }}
          />
        </div>
      )}

      {vistaActual === 'ver' && hojaSeleccionada && (
        <div>
          <button
            onClick={() => {
              setVistaActual('lista');
              setHojaSeleccionada(null);
            }}
            className="mb-4 text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Volver a la lista
          </button>
          <VistaHojaRutaEmpleado hojaRutaId={hojaSeleccionada} />
        </div>
      )}

      {vistaActual === 'cerrar' && hojaSeleccionada && (
        <div>
          <button
            onClick={() => {
              setVistaActual('lista');
              setHojaSeleccionada(null);
            }}
            className="mb-4 text-sm text-indigo-600 hover:text-indigo-800"
          >
            ← Volver a la lista
          </button>
          <CierreRuta
            hojaRutaId={hojaSeleccionada}
            onCerrada={() => {
              cargarHojas();
              setVistaActual('lista');
              setHojaSeleccionada(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
