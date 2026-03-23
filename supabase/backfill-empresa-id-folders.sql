-- BACKFILL v2: Manejar duplicados en semanas_laborales antes del backfill
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  v_empresa_id UUID;
  rec RECORD;
BEGIN
  -- Obtener empresa_id activa
  SELECT id INTO v_empresa_id FROM empresas LIMIT 1;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ninguna empresa';
  END IF;
  RAISE NOTICE 'empresa_id: %', v_empresa_id;

  -- ── PASO 1: Semanas laborales ──────────────────────────────────────────
  -- Para cada semana con empresa_id NULL, verificar si ya existe una con empresa_id
  FOR rec IN
    SELECT s_null.id AS id_null, s_ok.id AS id_ok
    FROM semanas_laborales s_null
    JOIN semanas_laborales s_ok
      ON s_ok.empresa_id = v_empresa_id
      AND s_ok.fecha_inicio = s_null.fecha_inicio
      AND s_ok.fecha_fin    = s_null.fecha_fin
    WHERE s_null.empresa_id IS NULL
  LOOP
    -- Redirigir los folders que apuntan a la semana NULL hacia la semana correcta
    UPDATE folders_diarios
    SET semana_laboral_id = rec.id_ok
    WHERE semana_laboral_id = rec.id_null;

    -- Eliminar la semana duplicada con NULL
    DELETE FROM semanas_laborales WHERE id = rec.id_null;

    RAISE NOTICE 'Semana % reemplazada por %', rec.id_null, rec.id_ok;
  END LOOP;

  -- Actualizar semanas que quedaron sin empresa_id y no tienen conflicto
  UPDATE semanas_laborales SET empresa_id = v_empresa_id WHERE empresa_id IS NULL;
  RAISE NOTICE 'Semanas restantes actualizadas';

  -- ── PASO 2: Folders diarios ────────────────────────────────────────────
  -- Para cada folder con empresa_id NULL, verificar si ya existe uno con empresa_id para esa fecha
  FOR rec IN
    SELECT f_null.id AS id_null, f_ok.id AS id_ok
    FROM folders_diarios f_null
    JOIN folders_diarios f_ok
      ON f_ok.empresa_id = v_empresa_id
      AND f_ok.fecha_laboral = f_null.fecha_laboral
    WHERE f_null.empresa_id IS NULL
  LOOP
    -- Mover los registros del folder NULL al folder correcto
    UPDATE registros
    SET folder_diario_id = rec.id_ok
    WHERE folder_diario_id = rec.id_null;

    -- Eliminar el folder duplicado con NULL
    DELETE FROM folders_diarios WHERE id = rec.id_null;

    RAISE NOTICE 'Folder % reemplazado por %', rec.id_null, rec.id_ok;
  END LOOP;

  -- Actualizar folders que quedaron sin empresa_id y no tienen conflicto
  UPDATE folders_diarios SET empresa_id = v_empresa_id WHERE empresa_id IS NULL;
  RAISE NOTICE 'Folders restantes actualizados';

  -- ── PASO 3: Registros ──────────────────────────────────────────────────
  UPDATE registros SET empresa_id = v_empresa_id WHERE empresa_id IS NULL;
  RAISE NOTICE 'Registros actualizados';

  -- ── PASO 4: Depositos ──────────────────────────────────────────────────
  UPDATE depositos SET empresa_id = v_empresa_id WHERE empresa_id IS NULL;
  RAISE NOTICE 'Depositos actualizados';

  RAISE NOTICE '✅ Backfill completado';
END $$;

-- Verificar resultado final
SELECT
  'semanas_laborales' as tabla,
  COUNT(*) FILTER (WHERE empresa_id IS NULL) as sin_empresa_id,
  COUNT(*) FILTER (WHERE empresa_id IS NOT NULL) as con_empresa_id
FROM semanas_laborales
UNION ALL
SELECT 'folders_diarios',
  COUNT(*) FILTER (WHERE empresa_id IS NULL),
  COUNT(*) FILTER (WHERE empresa_id IS NOT NULL)
FROM folders_diarios
UNION ALL
SELECT 'registros',
  COUNT(*) FILTER (WHERE empresa_id IS NULL),
  COUNT(*) FILTER (WHERE empresa_id IS NOT NULL)
FROM registros;
