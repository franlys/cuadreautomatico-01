-- ============================================
-- Multi-Tenant Platform - Tabla Empresas
-- ============================================
-- Este archivo crea la tabla base empresas que será el núcleo del sistema multi-tenant.
-- Cada empresa tendrá su propio nivel de automatización y límites de storage.
-- Requirements: 1.2, 1.3, 2.1

-- Crear tipo ENUM para nivel de automatización
CREATE TYPE nivel_automatizacion_enum AS ENUM ('parcial', 'completa');

-- Tabla de empresas (tenants)
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  nivel_automatizacion nivel_automatizacion_enum NOT NULL DEFAULT 'parcial',
  logo_url TEXT,
  activa BOOLEAN DEFAULT TRUE,
  limite_storage_mb INT DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices necesarios
CREATE INDEX IF NOT EXISTS idx_empresas_activa ON empresas(activa);
CREATE INDEX IF NOT EXISTS idx_empresas_nivel ON empresas(nivel_automatizacion);
CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas(nombre);

-- Comentarios para documentación
COMMENT ON TABLE empresas IS 'Tabla de empresas (tenants) del sistema multi-tenant';
COMMENT ON COLUMN empresas.nombre IS 'Nombre de la empresa';
COMMENT ON COLUMN empresas.nivel_automatizacion IS 'Nivel de automatización: parcial (sistema actual) o completa (con hojas de ruta digitales)';
COMMENT ON COLUMN empresas.logo_url IS 'URL del logo de la empresa en Supabase Storage';
COMMENT ON COLUMN empresas.activa IS 'Indica si la empresa está activa o desactivada';
COMMENT ON COLUMN empresas.limite_storage_mb IS 'Límite de almacenamiento en MB para archivos de la empresa';
