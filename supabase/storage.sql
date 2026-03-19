-- ============================================
-- Cuadre Automático - Configuración de Storage
-- ============================================

-- NOTA: El bucket 'evidencias' debe crearse manualmente desde la interfaz de Supabase
-- Storage > New bucket > Name: evidencias, Public: false

-- Políticas de acceso para el bucket evidencias

-- Permitir subir evidencias a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir evidencias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidencias');

-- Permitir ver evidencias según el rol
CREATE POLICY "Usuarios pueden ver sus propias evidencias"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidencias' AND (
    -- Dueño puede ver todas las evidencias
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Dueño'
    OR
    -- Usuario_Ingresos puede ver evidencias de registros de tipo ingreso
    (
      (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Usuario_Ingresos'
      AND EXISTS (
        SELECT 1 FROM evidencias e
        JOIN registros r ON e.registro_id = r.id
        WHERE e.storage_path = name
        AND r.tipo = 'ingreso'
      )
    )
    OR
    -- Usuario_Egresos puede ver evidencias de registros de tipo egreso
    (
      (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Usuario_Egresos'
      AND EXISTS (
        SELECT 1 FROM evidencias e
        JOIN registros r ON e.registro_id = r.id
        WHERE e.storage_path = name
        AND r.tipo = 'egreso'
      )
    )
  )
);

-- Permitir eliminar evidencias (solo Dueño)
CREATE POLICY "Solo el Dueño puede eliminar evidencias"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias'
  AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'Dueño'
);

-- Comentarios para documentación
COMMENT ON POLICY "Usuarios autenticados pueden subir evidencias" ON storage.objects IS 'Permite a usuarios autenticados subir evidencias al bucket';
COMMENT ON POLICY "Usuarios pueden ver sus propias evidencias" ON storage.objects IS 'Controla el acceso a evidencias según el rol del usuario';
COMMENT ON POLICY "Solo el Dueño puede eliminar evidencias" ON storage.objects IS 'Solo el Dueño puede eliminar evidencias del sistema';
