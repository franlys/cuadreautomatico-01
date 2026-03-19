import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface GestionCatalogoProps {
  tipo: 'empleados' | 'rutas' | 'conceptos';
  titulo: string;
}

interface ItemCatalogo {
  id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
}

export function GestionCatalogo({ tipo, titulo }: GestionCatalogoProps) {
  const { perfil } = useAuth();
  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const puedeEditar = perfil?.rol === 'Usuario_Completo' || perfil?.rol === 'Usuario_Ingresos' || perfil?.rol === 'Usuario_Egresos';

  useEffect(() => {
    cargarItems();
  }, [tipo]);

  const cargarItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tipo)
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const agregarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nuevoNombre.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    try {
      setError(null);
      
      // Verificar unicidad
      const nombreNormalizado = nuevoNombre.trim().toLowerCase();
      const existe = items.some(
        item => item.nombre.toLowerCase() === nombreNormalizado
      );

      if (existe) {
        setError(`Ya existe un ${tipo.slice(0, -1)} con ese nombre`);
        return;
      }

      const { error: insertError } = await supabase
        .from(tipo)
        .insert([{ nombre: nuevoNombre.trim(), activo: true }]);

      if (insertError) throw insertError;

      setNuevoNombre('');
      await cargarItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const iniciarEdicion = (item: ItemCatalogo) => {
    setEditando(item.id);
    setNombreEditado(item.nombre);
    setError(null);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setNombreEditado('');
    setError(null);
  };

  const guardarEdicion = async (id: string) => {
    if (!nombreEditado.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    try {
      setError(null);

      // Verificar unicidad (excluyendo el item actual)
      const nombreNormalizado = nombreEditado.trim().toLowerCase();
      const existe = items.some(
        item => item.id !== id && item.nombre.toLowerCase() === nombreNormalizado
      );

      if (existe) {
        setError(`Ya existe un ${tipo.slice(0, -1)} con ese nombre`);
        return;
      }

      const { error: updateError } = await supabase
        .from(tipo)
        .update({ nombre: nombreEditado.trim() })
        .eq('id', id);

      if (updateError) throw updateError;

      setEditando(null);
      setNombreEditado('');
      await cargarItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActivo = async (id: string, activoActual: boolean) => {
    try {
      setError(null);
      const { error: updateError } = await supabase
        .from(tipo)
        .update({ activo: !activoActual })
        .eq('id', id);

      if (updateError) throw updateError;
      await cargarItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const eliminarItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este elemento?')) return;

    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from(tipo)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await cargarItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const itemsFiltrados = items.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{titulo}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Formulario para agregar nuevo item */}
      {puedeEditar && (
        <form onSubmit={agregarItem} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder={`Nuevo ${tipo.slice(0, -1)}...`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Agregar
            </button>
          </div>
        </form>
      )}

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Lista de items */}
      <div className="space-y-2">
        {itemsFiltrados.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No hay {tipo} registrados
          </p>
        ) : (
          itemsFiltrados.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 border rounded-md ${
                item.activo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
              }`}
            >
              {editando === item.id ? (
                <>
                  <input
                    type="text"
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => guardarEdicion(item.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className={`flex-1 ${!item.activo ? 'text-gray-500' : ''}`}>
                    {item.nombre}
                    {!item.activo && ' (Inactivo)'}
                  </span>
                  <div className="flex gap-2">
                    {puedeEditar && (
                      <>
                        <button
                          onClick={() => iniciarEdicion(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActivo(item.id, item.activo)}
                          className={`px-3 py-1 text-white text-sm rounded-md ${
                            item.activo
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {item.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => eliminarItem(item.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {!puedeEditar && (
        <p className="mt-4 text-sm text-gray-500">
          No tienes permisos para editar o eliminar elementos del catálogo.
        </p>
      )}
    </div>
  );
}
