import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFolderStore } from '../stores/folderStore';

interface FormularioDepositoProps {
  onDepositoCreado?: () => void;
}

export function FormularioDeposito({ onDepositoCreado }: FormularioDepositoProps) {
  const { semanaActual } = useFolderStore();
  
  const [monto, setMonto] = useState('');
  const [fechaDeposito, setFechaDeposito] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [banco, setBanco] = useState('');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!monto.trim()) {
      nuevosErrores.monto = 'El monto es requerido';
    } else {
      const montoNum = parseFloat(monto);
      if (isNaN(montoNum) || montoNum <= 0) {
        nuevosErrores.monto = 'El monto debe ser mayor a 0';
      }
    }

    if (!fechaDeposito) {
      nuevosErrores.fechaDeposito = 'La fecha es requerida';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    if (!semanaActual) {
      setError('No hay una semana laboral activa');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const montoNum = parseFloat(monto);

      const { error: insertError } = await supabase
        .from('depositos')
        .insert([{
          semana_laboral_id: semanaActual.id,
          monto: montoNum,
          fecha_deposito: fechaDeposito,
          banco: banco.trim() || null,
          nota: nota.trim() || null,
        }]);

      if (insertError) throw insertError;

      // Limpiar formulario
      setMonto('');
      setFechaDeposito(new Date().toISOString().split('T')[0]);
      setBanco('');
      setNota('');
      setErrores({});

      // Notificar que se creó el depósito
      if (onDepositoCreado) {
        onDepositoCreado();
      }

      alert('Depósito registrado correctamente');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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

      {/* Fecha de depósito */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de Depósito *
        </label>
        <input
          type="date"
          value={fechaDeposito}
          onChange={(e) => setFechaDeposito(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errores.fechaDeposito ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errores.fechaDeposito && (
          <p className="mt-1 text-sm text-red-600">{errores.fechaDeposito}</p>
        )}
      </div>

      {/* Banco (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Banco (Opcional)
        </label>
        <input
          type="text"
          value={banco}
          onChange={(e) => setBanco(e.target.value)}
          placeholder="Nombre del banco..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Nota (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nota (Opcional)
        </label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Notas adicionales..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Guardando...' : 'Registrar Depósito'}
      </button>
    </form>
  );
}
