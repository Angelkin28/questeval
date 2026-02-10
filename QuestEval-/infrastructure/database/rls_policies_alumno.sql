-- ==========================================
-- Políticas RLS para acceso de alumnos
-- ==========================================
-- Ejecutar en el SQL Editor de Supabase después del schema.sql
-- para que los alumnos puedan leer sus grupos, proyectos y evaluaciones.

-- MIEMBROS_GRUPO: el usuario solo ve sus propias filas
DROP POLICY IF EXISTS "Alumno ve sus miembros_grupo" ON miembros_grupo;
CREATE POLICY "Alumno ve sus miembros_grupo"
  ON miembros_grupo FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

-- GRUPOS: el usuario solo ve grupos en los que es miembro
DROP POLICY IF EXISTS "Alumno ve grupos donde es miembro" ON grupos;
CREATE POLICY "Alumno ve grupos donde es miembro"
  ON grupos FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT grupo_id FROM miembros_grupo WHERE usuario_id = auth.uid()
    )
  );

-- EVALUACIONES: el usuario ve evaluaciones de proyectos de sus grupos
DROP POLICY IF EXISTS "Alumno ve evaluaciones de sus grupos" ON evaluaciones;
CREATE POLICY "Alumno ve evaluaciones de sus grupos"
  ON evaluaciones FOR SELECT TO authenticated
  USING (
    proyecto_id IN (
      SELECT p.id FROM proyectos p
      INNER JOIN miembros_grupo mg ON mg.grupo_id = p.grupo_id
      WHERE mg.usuario_id = auth.uid()
    )
  );

-- DETALLE_EVALUACIONES: el usuario ve detalle de evaluaciones que puede ver
DROP POLICY IF EXISTS "Alumno ve detalle evaluaciones" ON detalle_evaluaciones;
CREATE POLICY "Alumno ve detalle evaluaciones"
  ON detalle_evaluaciones FOR SELECT TO authenticated
  USING (
    evaluacion_id IN (
      SELECT e.id FROM evaluaciones e
      INNER JOIN proyectos p ON p.id = e.proyecto_id
      INNER JOIN miembros_grupo mg ON mg.grupo_id = p.grupo_id
      WHERE mg.usuario_id = auth.uid()
    )
  );

-- RETROALIMENTACION: el usuario ve retroalimentación de evaluaciones que puede ver
DROP POLICY IF EXISTS "Alumno ve retroalimentacion" ON retroalimentacion;
CREATE POLICY "Alumno ve retroalimentacion"
  ON retroalimentacion FOR SELECT TO authenticated
  USING (
    evaluacion_id IN (
      SELECT e.id FROM evaluaciones e
      INNER JOIN proyectos p ON p.id = e.proyecto_id
      INNER JOIN miembros_grupo mg ON mg.grupo_id = p.grupo_id
      WHERE mg.usuario_id = auth.uid()
    )
  );
