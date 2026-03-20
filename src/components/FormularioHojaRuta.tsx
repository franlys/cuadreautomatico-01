import { useState, useEffect } from 'react';
import { routeService } from '../services/RouteService';
import { supabase } from '../lib/supabase';
import type { Moneda } from '../types';

interface Factura {
  numero: string;
  monto: number;
  moneda: Moneda;
  estado_pago: 'pendiente' | 'pagada';
}

interface FormularioHojaRutaProps {
  onHojaCreada?: (hojaRutaId: string) => void;
}

export function FormularioHojaRuta({ onHojaCreada }: FormularioHojaRutaProps) {
  const [empleados, setEmpleados] = useState<Array<{ id: string; nombre: string; apellido: string }>>([]);
  const [rutas, setRutas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [empleadoId, setEmpleadoId] = useState('');
  const [rutaId, setRutaId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [montoAsignado, setMontoAsignado] = useState('');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para nueva factura
  const [nuevaFactura, setNuevaFactura] = useState<Factura>({
    numero: '',
    monto: 0,
    moneda: 'RD$',
    estado_pago: 'pendiente'
  });

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [{ data: empleadosData }, { data: rutasData }] = await Promise.all([
        supabase.from('empleados').select('id, nombre, apellido').eq('activo', true).order('nombre'),
        supabase.from('rutas').select('id, nombre').eq('activo', true).order('nombre')
      ]);

      setEmpleados(empleadosData || []);
      setRutas(rutasData || []);
    } catch (err: any) {
      setError(`Error al cargar catálogos: ${err.message}`);
    }
  };

  const agregarFactura = () => {
    if (!nuevaFactura.numero.trim()) {
      alert('El número de factura es requerido');
      return;
    }
    if (nuevaFactura.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    setFacturas([...facturas, { ...nuevaFactura }]);
    setNuevaFactura({
      numero: '',
      monto: 0,
      moneda: 'RD$',
      estado_pago: 'pendiente'
    });
  };

  const eliminarFactura = (index: number) => {
    setFacturas(facturas.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const totalRD = facturas
      .filter(f => f.moneda === 'RD$')
      .reduce((sum, f) => sum + f.monto, 0);
    const totalUSD = facturas
      .filter(f => f.moneda === 'USD')
      .reduce((sum, f) => sum + f.monto, 0);
    return { totalRD, totalUSD };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!empleadoId) {
      setError('Debe seleccionar un empleado');
      return;
    }
    if (!rutaId) {
      setError('Debe seleccionar una ruta');
      return;
    }
    if (!fecha) {
      setError('Debe seleccionar una fecha');
      return;
    }
    if (facturas.length === 0) {
      setError('Debe agregar al menos una factura');
      return;
    }

    try {
      setLoading(true);
      const hojaRuta = await routeService.createHojaRuta({
        empleado_id: empleadoId,
        ruta_id: rutaId,
        fecha,
        monto_asignado_rdp: parseFloat(montoAsignado) || 0,
        facturas
      });

      alert('Hoja de ruta creada exitosamente');
      
      // Limpiar formulario
      setEmpleadoId('');
      setRutaId('');
      setFecha(new Date().toISOString().split('T')[0]);
      setMontoAsignado('');
      setFacturas([]);

      if (onHojaCreada) {
        onHojaCreada(hojaRuta.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Selector de Empleado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Empleado *
        </label>
        <select
          value={empleadoId}
          onChange={(e) => setEmpleadoId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">Seleccionar empleado...</option>
          {empleados.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre} {emp.apellido}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Ruta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ruta *
        </label>
        <select
          value={rutaId}
          onChange={(e) => setRutaId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        >
          <option value="">Seleccionar ruta...</option>
          {rutas.map(ruta => (
            <option key={ruta.id} value={ruta.id}>
              {ruta.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha *
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      {/* Monto Asignado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto Asignado (RD$)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">RD$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={montoAsignado}
            onChange={(e) => setMontoAsignado(e.target.value)}
            placeholder="0.00"
            className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Lista de Facturas */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Facturas</h3>
        
        {/* Formulario para agregar factura */}
        <div className="bg-gray-50 p-4 rounded-md space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Factura
              </label>
              <input
                type="text"
                value={nuevaFactura.numero}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, numero: e.target.value })}
                placeholder="Ej: FAC-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={nuevaFactura.monto || ''}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, monto: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={nuevaFactura.moneda}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, moneda: e.target.value as Moneda })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="RD$">RD$</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={nuevaFactura.estado_pago}
                onChange={(e) => setNuevaFactura({ ...nuevaFactura, estado_pago: e.target.value as 'pendiente' | 'pagada' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada (PA)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={agregarFactura}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Agregar Factura
          </button>
        </div>

        {/* Lista de facturas agregadas */}
        {facturas.length > 0 && (
          <div className="space-y-2">
            {facturas.map((factura, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{factura.numero}</p>
                  <p className="text-sm text-gray-600">
                    {factura.moneda} {factura.monto.toFixed(2)} - {factura.estado_pago === 'pagada' ? 'PA' : 'Pendiente'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => eliminarFactura(index)}
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Totales */}
        {facturas.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Totales de Facturas</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700">Total RD$:</span>
                <span className="ml-2 font-semibold text-blue-900">RD$ {totales.totalRD.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-blue-700">Total USD:</span>
                <span className="ml-2 font-semibold text-blue-900">USD {totales.totalUSD.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={loading || facturas.length === 0}
        className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creando Hoja de Ruta...' : 'Crear Hoja de Ruta'}
      </button>
    </form>
  );
}
