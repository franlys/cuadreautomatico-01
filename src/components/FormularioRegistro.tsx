import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { estaOnline } from '../lib/sync';
import { SelectorCatalogo } from './SelectorCatalogo';
import { UploaderEvidencia } from './UploaderEvidencia';
import { useFolderStore } from '../stores/folderStore';
import { useAuth } from '../hooks/useAuth';

interface FormularioRegistroProps {
  tipo: 'ingreso' | 'egreso';
  onRegistroCreado?: () => void;
}

export function FormularioRegistro({ tipo, onRegistroCreado }: FormularioRegistroProps) {
  const { perfil } = useAuth();
  const { folderActual } = useFolderStore();
  
  const [concepto, setConcepto] = useState('');
  const [empleado, setEmpleado] = useState('');
  const [ruta, setRuta] = useState('');
  const [monto, setMonto] = useState('');
  const [registroCreado, setRegistroCreado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!concepto.trim()) {
      nuevosErrores.concepto = 'El concepto es requerido';
    }

    if (!empleado.trim()) {
      nuevosErrores.empleado = 'El empleado es requerido';
    }

    if (!ruta.trim()) {
      nuevosErrores.ruta = 'La ruta es requerida';
    }

    if (!monto.trim()) {
      nuevosErrores.monto = 'El monto es requerido';
    } else {
      const montoNum = parseFloat(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        nuevosErrores.monto = 'El monto debe ser mayor a 0';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    if (!folderActual) {
      setError('No hay un folder diario activo');
      return;
    }

    if (folderActual.cerrado) {
      setError('El folder diario está cerrado. No se pueden agregar más registros.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const montoNum = parseFloat(monto);
      const online = estaOnline();

      if (online) {
        // Modo online: guardar directamente en Supabase
        const { data: nuevoRegistro, error: insertError } = await supabase
          .from('registros')
          .insert([{
            folder_diario_id: folderActual.id,
            tipo,
            concepto: concepto.trim(),
            empleado: empleado.trim(),
            ruta: ruta.trim(),
            monto: montoNum,
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        // Guardar ID del registro para subir evidencias
        setRegistroCreado(nuevoRegistro.id);

        alert(`${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} registrado correctamente. Ahora puedes agregar evidencias.`);
      } else {
        // Modo offline: guardar en IndexedDB
        const registroId = crypto.randomUUID();
        const ahora = new Date().toISOString();

        await db.registros_pendientes.add({
          id: registroId,
          folder_diario_id: folderActual.id,
          tipo,
          concepto: concepto.trim(),
          empleado: empleado.trim(),
          ruta: ruta.trim(),
          monto: montoNum,
          creado_por: perfil?.id || null,
          created_at: ahora,
          updated_at: ahora,
          sincronizado: 0, // 0 = false
          intentos_sincronizacion: 0,
        });

        setRegistroCreado(registroId);

        alert(
          `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} guardado localmente (sin conexión).\n` +
          `Se sincronizará automáticamente cuando recuperes la conexión.`
        );
      }

      // Limpiar formulario
      setConcepto('');
      setEmpleado('');
      setRuta('');
      setMonto('');
      setErrores({});

      // Notificar que se creó el registro
      if (onRegistroCreado) {
        onRegistroCreado();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar permisos según rol
  const puedeRegistrar = 
    (tipo === 'ingreso' && (perfil?.rol === 'Usuario_Ingresos' || perfil?.rol === 'Usuario_Completo' || perfil?.rol === 'Dueño')) ||
    (tipo === 'egreso' && (perfil?.rol === 'Usuario_Egresos' || perfil?.rol === 'Usuario_Completo' || perfil?.rol === 'Dueño'));

  if (!puedeRegistrar) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          No tienes permisos para registrar {tipo === 'ingreso' ? 'ingresos' : 'egresos'}.
        </p>
      </div>
    );
  }

  if (folderActual?.cerrado) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-sm text-gray-700">
          El folder diario está cerrado. No se pueden agregar más registros.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Concepto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Concepto *
        </label>
        <SelectorCatalogo
          tipo="conceptos"
          value={concepto}
          onChange={setConcepto}
          placeholder="Seleccionar o escribir concepto..."
          permitirManual={true}
          error={errores.concepto}
        />
      </div>

      {/* Empleado */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Empleado *
        </label>
        <SelectorCatalogo
          tipo="empleados"
          value={empleado}
          onChange={setEmpleado}
          placeholder="Seleccionar empleado..."
          error={errores.empleado}
        />
      </div>

      {/* Ruta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ruta *
        </label>
        <SelectorCatalogo
          tipo="rutas"
          value={ruta}
          onChange={setRuta}
          placeholder="Seleccionar ruta..."
          error={errores.ruta}
        />
      </div>

      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monto *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errores.monto ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
        {errores.monto && (
          <p className="mt-1 text-sm text-red-600">{errores.monto}</p>
        )}
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={loading || registroCreado !== null}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          tipo === 'ingreso'
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-red-600 hover:bg-red-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading
          ? 'Guardando...'
          : registroCreado
          ? 'Registro Guardado'
          : `Registrar ${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
      </button>

      {/* Uploader de evidencias */}
      {registroCreado && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Evidencias (Opcional)
          </h4>
          <UploaderEvidencia registroId={registroCreado} />
          
          <button
            type="button"
            onClick={() => {
              setRegistroCreado(null);
              if (onRegistroCreado) {
                onRegistroCreado();
              }
            }}
            className="mt-4 w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Crear Nuevo Registro
          </button>
        </div>
      )}
    </form>
  );
}
