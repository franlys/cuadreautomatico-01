-- BACKFILL: Asignar empresa_id a folders y registros que tienen NULL
-- Ejecutar en Supabase SQL Editor
-- Esto soluciona los datos ingresados antes del fix de empresa_id

DO $$
DECLARE
  v_empresa_id UUID;
  v_folders_actualizados INT;
  v_registros_actualizados INT;
BEGIN
  -- Obtener el empresa_id de la única empresa activa
  SELECT id INTO v_empresa_id FROM empresas LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ninguna empresa en la tabla empresas';
  END IF;

  RAISE NOTICE 'Usando empresa_id: %', v_empresa_id;

  -- Actualizar semanas_laborales sin empresa_id
  UPDATE semanas_laborales
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  RAISE NOTICE 'Semanas actualizadas: %', ROW_COUNT;

  -- Actualizar folders_diarios sin empresa_id
  UPDATE folders_diarios
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  GET DIAGNOSTICS v_folders_actualizados = ROW_COUNT;
  RAISE NOTICE 'Folders actualizados: %', v_folders_actualizados;

  -- Actualizar registros sin empresa_id
  UPDATE registros
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  GET DIAGNOSTICS v_registros_actualizados = ROW_COUNT;
  RAISE NOTICE 'Registros actualizados: %', v_registros_actualizados;

  -- Actualizar depositos sin empresa_id
  UPDATE depositos
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;
  RAISE NOTICE 'Depositos actualizados: %', ROW_COUNT;

  RAISE NOTICE '✅ Backfill completado. Folders: %, Registros: %',
    v_folders_actualizados, v_registros_actualizados;
END $$;

-- Verificar resultado
SELECT
  'folders_diarios' as tabla,
  COUNT(*) FILTER (WHERE empresa_id IS NULL) as sin_empresa_id,
  COUNT(*) FILTER (WHERE empresa_id IS NOT NULL) as con_empresa_id
FROM folders_diarios
UNION ALL
SELECT
  'registros',
  COUNT(*) FILTER (WHERE empresa_id IS NULL),
  COUNT(*) FILTER (WHERE empresa_id IS NOT NULL)
FROM registros;
