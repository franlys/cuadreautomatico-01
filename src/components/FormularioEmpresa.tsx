import { useState } from 'react';
import { tenantService } from '../services/TenantService';
import { storageService } from '../services/StorageService';
import type { Empresa, NivelAutomatizacion } from '../types';

interface FormularioEmpresaProps {
  empresa?: Empresa;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormularioEmpresa({ empresa, onSuccess, onCancel }: FormularioEmpresaProps) {
  const [nombre, setNombre] = useState(empresa?.nombre || '');
  const [nivelAutomatizacion, setNivelAutomatizacion] = useState<NivelAutomatizacion>(
    empresa?.nivel_automatizacion || 'parcial'
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(empresa?.logo_url || null);
  const [limiteStorageMb, setLimiteStorageMb] = useState(empresa?.limite_storage_mb || 1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen');
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar 2MB');
        return;
      }

      setLogoFile(file);
      setError(null);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!nombre.trim()) {
      setError('El nombre de la empresa es requerido');
      return;
    }

    try {
      setLoading(true);

      let logoUrl = empresa?.logo_url;

      // Subir logo si hay uno nuevo
      if (logoFile) {
        // Usar un ID temporal para el upload si es nueva empresa
        const empresaId = empresa?.id || 'temp';
        const timestamp = Date.now();
        const extension = logoFile.name.split('.').pop();
        const path = `logos/logo-${timestamp}.${extension}`;

        logoUrl = await storageService.uploadFile(empresaId, logoFile, path);
      }

      if (empresa) {
        // Actualizar empresa existente
        await tenantService.updateEmpresa(empresa.id, {
          nombre: nombre.trim(),
          nivel_automatizacion: nivelAutomatizacion,
          logo_url: logoUrl,
          limite_storage_mb: limiteStorageMb
        });
      } else {
        // Crear nueva empresa
        await tenantService.createEmpresa({
          nombre: nombre.trim(),
          nivel_automatizacion: nivelAutomatizacion,
          logo_url: logoUrl,
          limite_storage_mb: limiteStorageMb
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error al guardar empresa:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {empresa ? 'Editar Empresa' : 'Crear Nueva Empresa'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Nombre de la empresa */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ej: Empresa ABC"
            required
            disabled={loading}
          />
        </div>

        {/* Nivel de automatización */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nivel de Automatización *
          </label>
          <div className="space-y-3">
            <label className="flex items-start p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="nivel"
                value="parcial"
                checked={nivelAutomatizacion === 'parcial'}
                onChange={(e) => setNivelAutomatizacion(e.target.value as NivelAutomatizacion)}
                className="mt-1 mr-3"
                disabled={loading}
              />
              <div>
                <p className="font-medium text-gray-900">Parcial</p>
                <p className="text-sm text-gray-600">
                  Sistema actual de registro manual de ingresos y egresos. Ideal para empresas que
                  inician con el sistema.
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="nivel"
                value="completa"
                checked={nivelAutomatizacion === 'completa'}
                onChange={(e) => setNivelAutomatizacion(e.target.value as NivelAutomatizacion)}
                className="mt-1 mr-3"
                disabled={loading}
              />
              <div>
                <p className="font-medium text-gray-900">Completa</p>
                <p className="text-sm text-gray-600">
                  Incluye hojas de ruta digitales con seguimiento en tiempo real de entregas,
                  cobros y gastos. Para empresas con operaciones avanzadas.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo (opcional)</label>
          
          {logoPreview && (
            <div className="mb-3">
              <img
                src={logoPreview}
                alt="Preview del logo"
                className="h-24 w-24 rounded-lg object-cover border border-gray-300"
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Formatos: JPG, PNG, GIF. Tamaño máximo: 2MB
          </p>
        </div>

        {/* Límite de storage */}
        <div>
          <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">
            Límite de Almacenamiento (MB)
          </label>
          <input
            type="number"
            id="storage"
            value={limiteStorageMb}
            onChange={(e) => setLimiteStorageMb(parseInt(e.target.value) || 1000)}
            min="100"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Espacio disponible para evidencias y archivos de la empresa
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : empresa ? 'Actualizar Empresa' : 'Crear Empresa'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
