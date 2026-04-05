-- =============================================================================
-- 019: Corregir lecciones donde tutor_id = student_id (datos de seed incorrectos)
--
-- El seed de demo creaba lecciones, bookings y reviews con el mismo usuario
-- como tutor y estudiante. Esta migración:
--   1. Elimina reviews donde tutor_id = student_id
--   2. Elimina bookings donde tutor_id = student_id
--   3. Elimina lessons donde tutor_id = student_id
--   4. Agrega un CHECK constraint para evitar que vuelva a pasar
-- =============================================================================

-- 1. Eliminar reviews donde el tutor y el estudiante son la misma persona
DELETE FROM reviews
WHERE tutor_id = student_id;

-- 2. Eliminar bookings donde el tutor y el estudiante son la misma persona
DELETE FROM bookings
WHERE tutor_id = student_id;

-- 3. Eliminar lessons donde el tutor y el estudiante son la misma persona
DELETE FROM lessons
WHERE tutor_id = student_id;

-- 4. Agregar constraint para que no vuelva a ocurrir
ALTER TABLE lessons
  ADD CONSTRAINT lessons_tutor_neq_student
  CHECK (tutor_id IS DISTINCT FROM student_id);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_tutor_neq_student
  CHECK (tutor_id IS DISTINCT FROM student_id);

ALTER TABLE reviews
  ADD CONSTRAINT reviews_tutor_neq_student
  CHECK (tutor_id IS DISTINCT FROM student_id);
