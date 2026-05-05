-- ============================================================
-- 024 · Custom class requests
-- ------------------------------------------------------------
-- Permite a un estudiante solicitar una clase a un profesor en
-- un horario en el que el profesor NO tiene disponibilidad
-- publicada. El registro se almacena en `bookings` con
-- `lesson_id IS NULL` y los nuevos campos `requested_*` rellenos.
-- Cuando el profesor acepta, el endpoint backend crea la lesson
-- correspondiente y enlaza `bookings.lesson_id`.
-- ============================================================

alter table public.bookings
  add column if not exists requested_subject_id integer
    references public.subjects(id),
  add column if not exists requested_scheduled_date_time timestamp,
  add column if not exists requested_duration_minutes integer
    check (requested_duration_minutes is null
           or requested_duration_minutes in (15, 30, 45, 60, 90, 120));

-- Asegura que `lesson_id` puede ser NULL (los flujos de
-- custom-request no parten de un lesson preexistente).
alter table public.bookings
  alter column lesson_id drop not null;

-- Integridad: en una request `pending`, o hay lesson_id o hay
-- los tres campos `requested_*`. Otros estados no se restringen
-- para no romper datos históricos.
alter table public.bookings
  drop constraint if exists bookings_pending_has_target_chk;
alter table public.bookings
  add constraint bookings_pending_has_target_chk
  check (
    status <> 'pending'
    or lesson_id is not null
    or (
      requested_subject_id is not null
      and requested_scheduled_date_time is not null
      and requested_duration_minutes is not null
    )
  );

-- Index para filtrar pendientes y custom requests rapidamente.
create index if not exists idx_bookings_tutor_status_pending_custom
  on public.bookings (tutor_id, status, requested_scheduled_date_time)
  where status = 'pending' and lesson_id is null;
