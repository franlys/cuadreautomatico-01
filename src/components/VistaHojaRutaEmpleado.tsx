import { useState, useEffect } from 'react';
import { routeService } from '../services/RouteService';
import { storageService } from '../services/StorageService';
import { supabase } from '../lib/supabase';
import { BalanceRutaTiempoReal } from './BalanceRutaTiempoReal.tsx';
import type { HojaRuta, FacturaRuta, GastoRuta, Moneda } from '../types';

interface VistaHojaRutaEmpleadoProps {
  hojaRutaId: string;
}

export function VistaHojaRutaEmpleado({ hojaRutaId }: VistaHojaRutaEmpleadoProps) {
  const [hojaRuta, setHojaRuta] = useState<HojaRuta | null>(null);
  const [facturas, setFacturas] = useState<FacturaRuta[]>([]);
  const [gastos, setGastos] = useState<GastoRuta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);

  // Estado para registrar cobro
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<string | null>(null);
  const [montoCobrado, setMontoCobrado] = useState('');
  const [monedaCobrada, setMonedaCobrada] = useState<Moneda>('RD$');

  // Estado para registrar gasto
  const [tipoGasto, setTipoGasto] = useState<'fijo' | 'peaje' | 'combustible' | 'inesperado'>('fijo');
  const [descripcionGasto, setDescripcionGasto] = useState('');
  const [montoGasto, setMontoGasto] = useState('');
  const [monedaGasto, setMonedaGasto] = useState<Moneda>('RD$');
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);

  useEffect(() => {
    cargarHojaRuta();
  }, [hojaRutaId]);

  const cargarHojaRuta = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routeService.getHojaRutaById(hojaRutaId);
      setHojaRuta(data);
      setFacturas(data.facturas);
      setGastos(data.gastos);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarEntregada = async (facturaId: string) => {
    try {
      setActualizando(true);
      await routeService.markFacturaEntregada(facturaId);
      await cargarHojaRuta();
      alert('Factura marcada como entregada');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActualizando(false);
    }
  };

  const iniciarCobro = (facturaId: string, factura: FacturaRuta) => {
    setFacturaSeleccionada(facturaId);
    setMontoCobrado(factura.monto.toString());
    setMonedaCobrada(factura.moneda);
  };

  const confirmarCobro = async () => {
    if (!facturaSeleccionada) return;

    const monto = parseFloat(montoCobrado);
    if (isNaN(monto) || monto <= 0) {
      alert('El monto cobrado debe ser mayor a 0');
      return;
    }

    try {
      setActualizando(true);
      await routeService.markFacturaCobrada(facturaSeleccionada, {
        monto_cobrado: monto,
        moneda_cobrada: monedaCobrada
      });
      await cargarHojaRuta();
      setFacturaSeleccionada(null);
      setMontoCobrado('');
      alert('Cobro registrado exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActualizando(false);
    }
  };

  const registrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();

    const monto = parseFloat(montoGasto);
    if (isNaN(monto) || monto <= 0) {
      alert('El monto del gasto debe ser mayor a 0');
      return;
    }

    // Validar evidencia para gastos que la requieren
    const requiereEvidencia = tipoGasto === 'peaje' || tipoGasto === 'combustible';
    if (requiereEvidencia && !archivoEvidencia) {
      alert('Este tipo de gasto requiere foto de evidencia');
      return;
    }

    try {
      setActualizando(true);

      let evidenciaId: string | undefined;

      // Subir evidencia si existe
      if (archivoEvidencia) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('empresa_id')
          .eq('id', user.id)
          .single();

        if (!perfil?.empresa_id) throw new Error('Usuario sin empresa asociada');

        const timestamp = Date.now();
        const path = `gastos/${hojaRutaId}/${timestamp}_${archivoEvidencia.name}`;
        await storageService.uploadFile(perfil.empresa_id, archivoEvidencia, path);

        // Crear registro de evidencia
        const { data: evidencia } = await supabase
          .from('evidencias')
          .insert({
            empresa_id: perfil.empresa_id,
            storage_path: path,
            nombre_archivo: archivoEvidencia.name,
            tipo_mime: archivoEvidencia.type,
            tamano_bytes: archivoEvidencia.size
          })
          .select()
          .single();

        evidenciaId = evidencia?.id;
      }

      // Registrar gasto
      await routeService.registerGasto(hojaRutaId, {
        tipo: tipoGasto,
        descripcion: descripcionGasto || undefined,
        monto,
        moneda: monedaGasto,
        evidencia_requerida: requiereEvidencia,
        evidencia_id: evidenciaId
      });

      await cargarHojaRuta();

      // Limpiar formulario
      setTipoGasto('fijo');
      setDescripcionGasto('');
      setMontoGasto('');
      setMonedaGasto('RD$');
      setArchivoEvidencia(null);

      alert('Gasto registrado exitosamente');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActualizando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Cargando hoja de ruta...</span>
      </div>
    );
  }

  if (error || !hojaRuta) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">Error: {error || 'Hoja de ruta no encontrada'}</p>
      </div>
    );
  }

  const estaCerrada = hojaRuta.estado === 'cerrada';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-gray-900">{hojaRuta.identificador}</h2>
        <p className="text-sm text-gray-600 mt-1">
          Estado: <span className="font-medium">{hojaRuta.estado}</span>
        </p>
        {estaCerrada && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ Esta hoja de ruta está cerrada. No se pueden realizar más cambios.
          </p>
        )}
      </div>

      {/* Balance en Tiempo Real */}
      <BalanceRutaTiempoReal hojaRutaId={hojaRutaId} />

      {/* Facturas */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Facturas</h3>
        <div className="space-y-3">
          {facturas.map((factura) => (
            <div key={factura.id} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{factura.numero}</p>
                  <p className="text-sm text-gray-600">
                    {factura.moneda} {factura.monto.toFixed(2)} - {factura.estado_pago === 'pagada' ? 'PA' : 'Pendiente'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {!estaCerrada && factura.estado_entrega === 'pendiente' && (
                    <button
                      onClick={() => marcarEntregada(factura.id)}
                      disabled={actualizando}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Marcar Entregada
                    </button>
                  )}
                  {factura.estado_entrega === 'entregada' && (
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
                      ✓ Entregada
                    </span>
                  )}
                  {!estaCerrada && factura.estado_entrega === 'entregada' && factura.estado_pago === 'pendiente' && (
                    <button
                      onClick={() => iniciarCobro(factura.id, factura)}
                      disabled={actualizando}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Registrar Cobro
                    </button>
                  )}
                  {factura.estado_pago === 'pagada' && (
                    <span className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded">
                      💰 Cobrada: {factura.moneda_cobrada} {factura.monto_cobrado?.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Formulario de cobro */}
              {facturaSeleccionada === factura.id && (
                <div className="mt-3 p-3 bg-gray-50 rounded border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Registrar Cobro</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Monto Cobrado</label>
                      <input
                        type="number"
                        step="0.01"
                        value={montoCobrado}
                        onChange={(e) => setMontoCobrado(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Moneda</label>
                      <select
                        value={monedaCobrada}
                        onChange={(e) => setMonedaCobrada(e.target.value as Moneda)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="RD$">RD$</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={confirmarCobro}
                      disabled={actualizando}
                      className="flex-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setFacturaSeleccionada(null)}
                      className="flex-1 px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de Gastos */}
      {!estaCerrada && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Gasto</h3>
          <form onSubmit={registrarGasto} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto</label>
                <select
                  value={tipoGasto}
                  onChange={(e) => setTipoGasto(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="fijo">Fijo (sin evidencia)</option>
                  <option value="peaje">Peaje (requiere foto)</option>
                  <option value="combustible">Combustible (requiere foto)</option>
                  <option value="inesperado">Inesperado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montoGasto}
                  onChange={(e) => setMontoGasto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select
                  value={monedaGasto}
                  onChange={(e) => setMonedaGasto(e.target.value as Moneda)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="RD$">RD$</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {tipoGasto === 'inesperado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={descripcionGasto}
                    onChange={(e) => setDescripcionGasto(e.target.value)}
                    placeholder="Describe el gasto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>

            {(tipoGasto === 'peaje' || tipoGasto === 'combustible' || tipoGasto === 'inesperado') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto de Evidencia {(tipoGasto === 'peaje' || tipoGasto === 'combustible') && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setArchivoEvidencia(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required={tipoGasto === 'peaje' || tipoGasto === 'combustible'}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={actualizando}
              className="w-full py-2 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {actualizando ? 'Registrando...' : 'Registrar Gasto'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de Gastos Registrados */}
      {gastos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gastos Registrados</h3>
          <div className="space-y-2">
            {gastos.map((gasto) => (
              <div key={gasto.id} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{gasto.tipo}</p>
                    {gasto.descripcion && (
                      <p className="text-sm text-gray-600">{gasto.descripcion}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {gasto.moneda} {gasto.monto.toFixed(2)}
                    </p>
                  </div>
                  {gasto.evidencia_id && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      📷 Con evidencia
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
