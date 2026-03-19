import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface SelectorCatalogoProps {
  tipo: 'empleados' | 'rutas' | 'conceptos';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  permitirManual?: boolean; // Solo para conceptos
  error?: string;
}

interface ItemCatalogo {
  id: string;
  nombre: string;
  activo: boolean;
}

export function SelectorCatalogo({
  tipo,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  permitirManual = false,
  error,
}: SelectorCatalogoProps) {
  const [items, setItems] = useState<ItemCatalogo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modoManual, setModoManual] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarItems();
  }, [tipo]);

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrarOpciones(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(tipo)
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error(`Error al cargar ${tipo}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const itemsFiltrados = items.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccion = (nombre: string) => {
    onChange(nombre);
    setBusqueda('');
    setMostrarOpciones(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusqueda(valor);
    
    if (modoManual) {
      onChange(valor);
    }
    
    if (!mostrarOpciones && !modoManual) {
      setMostrarOpciones(true);
    }
  };

  const toggleModoManual = () => {
    setModoManual(!modoManual);
    setBusqueda('');
    onChange('');
    setMostrarOpciones(false);
  };

  const nombreSeleccionado = items.find(item => item.nombre === value)?.nombre || value;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={mostrarOpciones ? busqueda : nombreSeleccionado}
            onChange={handleInputChange}
            onFocus={() => !modoManual && setMostrarOpciones(true)}
            placeholder={modoManual ? 'Escribir manualmente...' : placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            readOnly={!modoManual && !mostrarOpciones}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>

        {permitirManual && tipo === 'conceptos' && (
          <button
            type="button"
            onClick={toggleModoManual}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              modoManual
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={modoManual ? 'Seleccionar del catálogo' : 'Escribir manualmente'}
          >
            {modoManual ? '📋' : '✏️'}
          </button>
        )}
      </div>

      {/* Dropdown de opciones */}
      {mostrarOpciones && !modoManual && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="p-3 text-center text-gray-500">
              {busqueda ? 'No se encontraron resultados' : `No hay ${tipo} disponibles`}
            </div>
          ) : (
            <ul>
              {itemsFiltrados.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSeleccion(item.nombre)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none"
                  >
                    {item.nombre}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
