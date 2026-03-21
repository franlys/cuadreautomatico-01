-- ============================================
-- MIGRACIÓN COMPLETA: Crear Empresa 1 y Migrar Datos Existentes
-- ============================================

-- PASO 1: Crear "Empresa 1" con nivel parcial
INSERT INTO empresas (id, nombre, nivel_automatizacion, activa, limite_storage_mb, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Empresa 1',
  'parcial',
  true,
  1000,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id, nombre, nivel_automatizacion;

-- Guardar el ID de Empresa 1 en una variable temporal
DO $$
DECLARE
  v_empresa_id UUID;
  v_total_perfiles INT;
  v_total_empleados INT;
  v_total_rutas INT;
  v_total_conceptos INT;
  v_total_semanas INT;
  v_total_folders INT;
  v_total_registros INT;
  v_total_depositos INT;
  v_total_evidencias INT;
BEGIN
  -- Obtener el ID de Empresa 1
  SELECT id INTO v_empresa_id
  FROM empresas
  WHERE nombre = 'Empresa 1'
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'ERROR: No se pudo crear o encontrar Empresa 1';
  END IF;

  RAISE NOTICE '✅ Empresa 1 encontrada con ID: %', v_empresa_id;

  -- PASO 2: Migrar perfiles (usuarios) a Empresa 1
  -- Excluir Super_Admin (que no tiene empresa)
  UPDATE perfiles
  SET empresa_id = v_empresa_id, updated_at = NOW()
  WHERE empresa_id IS NULL
    AND rol != 'Super_Admin';

  GET DIAGNOSTICS v_total_perfiles = ROW_COUNT;
  RAISE NOTICE '✅ Migrados % perfiles a Empresa 1', v_total_perfiles;

  -- PASO 3: Migrar empleados a Empresa 1
  UPDATE empleados
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_empleados = ROW_COUNT;
  RAISE NOTICE '✅ Migrados % empleados a Empresa 1', v_total_empleados;

  -- PASO 4: Migrar rutas a Empresa 1
  UPDATE rutas
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_rutas = ROW_COUNT;
  RAISE NOTICE '✅ Migradas % rutas a Empresa 1', v_total_rutas;

  -- PASO 5: Migrar conceptos a Empresa 1
  UPDATE conceptos
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_conceptos = ROW_COUNT;
  RAISE NOTICE '✅ Migrados % conceptos a Empresa 1', v_total_conceptos;

  -- PASO 6: Migrar semanas laborales a Empresa 1
  UPDATE semanas_laborales
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_semanas = ROW_COUNT;
  RAISE NOTICE '✅ Migradas % semanas laborales a Empresa 1', v_total_semanas;

  -- PASO 7: Migrar folders diarios a Empresa 1
  UPDATE folders_diarios
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_folders = ROW_COUNT;
  RAISE NOTICE '✅ Migrados % folders diarios a Empresa 1', v_total_folders;

  -- PASO 8: Migrar registros a Empresa 1
  UPDATE registros
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_registros = ROW_COUNT;
  RAISE NOTICE '✅ Migrados % registros a Empresa 1', v_total_registros;

  -- PASO 9: Migrar depósitos a Empresa 1
  UPDATE depositos
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_depositos = ROW_COUNT;
  RAISE NOTICE '✅ Migrados % depósitos a Empresa 1', v_total_depositos;

  -- PASO 10: Migrar evidencias a Empresa 1
  UPDATE evidencias
  SET empresa_id = v_empresa_id
  WHERE empresa_id IS NULL;

  GET DIAGNOSTICS v_total_evidencias = ROW_COUNT;
  RAISE NOTICE '✅ Migradas % evidencias a Empresa 1', v_total_evidencias;

  -- Registrar migración en audit_logs
  INSERT INTO audit_logs (
    empresa_id,
    usuario_id,
    accion,
    recurso,
    detalles,
    exitoso,
    created_at
  ) VALUES (
    v_empresa_id,
    NULL,
    'migracion_multi_tenant',
    'empresas',
    jsonb_build_object(
      'empresa_nombre', 'Empresa 1',
      'perfiles_migrados', v_total_perfiles,
      'empleados_migrados', v_total_empleados,
      'rutas_migradas', v_total_rutas,
      'conceptos_migrados', v_total_conceptos,
      'semanas_migradas', v_total_semanas,
      'folders_migrados', v_total_folders,
      'registros_migrados', v_total_registros,
      'depositos_migrados', v_total_depositos,
      'evidencias_migradas', v_total_evidencias
    ),
    TRUE,
    NOW()
  );

  RAISE NOTICE '✅ Migración registrada en audit_logs';
END $$;

-- PASO 11: Verificar la migración
SELECT 
  'Empresa 1' as verificacion,
  e.id as empresa_id,
  e.nombre,
  e.nivel_automatizacion,
  e.activa,
  COUNT(DISTINCT p.id) as total_usuarios,
  COUNT(DISTINCT em.id) as total_empleados,
  COUNT(DISTINCT r.id) as total_rutas,
  COUNT(DISTINCT c.id) as total_conceptos
FROM empresas e
LEFT JOIN perfiles p ON p.empresa_id = e.id
LEFT JOIN empleados em ON em.empresa_id = e.id
LEFT JOIN rutas r ON r.empresa_id = e.id
LEFT JOIN conceptos c ON c.empresa_id = e.id
WHERE e.nombre = 'Empresa 1'
GROUP BY e.id, e.nombre, e.nivel_automatizacion, e.activa;

-- PASO 12: Listar usuarios de Empresa 1
SELECT 
  p.id,
  u.email,
  p.nombre,
  p.rol,
  p.empresa_id,
  e.nombre as empresa_nombre
FROM perfiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN empresas e ON p.empresa_id = e.id
WHERE p.empresa_id = (SELECT id FROM empresas WHERE nombre = 'Empresa 1' LIMIT 1)
ORDER BY p.rol, p.nombre;

-- PASO 13: Verificar Super_Admin (debe tener empresa_id = NULL)
SELECT 
  p.id,
  u.email,
  p.nombre,
  p.rol,
  p.empresa_id,
  CASE 
    WHEN p.empresa_id IS NULL THEN '✅ Correcto (sin empresa)'
    ELSE '❌ ERROR: Super_Admin no debe tener empresa'
  END as validacion
FROM perfiles p
JOIN auth.users u ON p.id = u.id
WHERE p.rol = 'Super_Admin';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

-- Deberías ver:
-- ✅ Empresa 1 creada con nivel 'parcial'
-- ✅ Todos los usuarios (excepto Super_Admin) asociados a Empresa 1
-- ✅ Todos los datos históricos asociados a Empresa 1
-- ✅ Super_Admin con empresa_id = NULL
-- ✅ Contadores de registros migrados

-- ============================================
-- PRÓXIMOS PASOS
-- ============================================

-- 1. Verificar que todos los usuarios pueden iniciar sesión
-- 2. Verificar que ven sus datos históricos
-- 3. Como Super_Admin, deberías ver "Empresa 1" en el dashboard
-- 4. Puedes crear una segunda empresa de prueba
-- 5. Puedes cambiar el nivel de "Empresa 1" a "completa" para activar hojas de ruta
