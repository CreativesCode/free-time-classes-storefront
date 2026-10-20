-- PRP-001 (FRE0013 F021/F022), phase 1 — additive part.
-- The course becomes the booking unit: a class and its booking point to the
-- course whose price and duration they copy. The tutor availability becomes
-- a pure time window (subject/duration/price no longer required there).
-- Restrictive steps (course writes only through the API, retiring the
-- pre-generated free slots) ship in a later migration, after the code.

-- 1. Course on lessons and bookings. RESTRICT: a course with history is
--    archived (is_active = false), never deleted (F062).
alter table public.lessons
  add column if not exists course_id integer references public.courses(id) on delete restrict;
alter table public.bookings
  add column if not exists course_id integer references public.courses(id) on delete restrict;
create index if not exists lessons_course_id_idx on public.lessons (course_id);
create index if not exists bookings_course_id_idx on public.bookings (course_id);

-- 2. Availability rules are only time windows now.
alter table public.tutor_availability
  alter column subject_id drop not null,
  alter column duration_minutes drop not null,
  alter column price drop not null;
alter table public.tutor_availability
  drop constraint if exists tutor_availability_window_fits_duration;
alter table public.tutor_availability
  drop constraint if exists tutor_availability_window_valid;
alter table public.tutor_availability
  add constraint tutor_availability_window_valid check (end_time > start_time);

-- 3. Valid course values (product decisions 2026-10-20): fixed durations,
--    price required and > 0 (no free courses, F061).
alter table public.courses
  drop constraint if exists courses_duration_allowed,
  drop constraint if exists courses_price_valid;
alter table public.courses
  add constraint courses_duration_allowed
    check (duration_minutes in (30, 45, 60, 90, 120)),
  add constraint courses_price_valid
    check (price_per_session > 0 and price_per_session <= 500);

-- 4. A tutor can never have two overlapping committed classes, even with
--    concurrent requests (findScheduleConflict stays as the friendly check).
create extension if not exists btree_gist with schema extensions;
alter table public.lessons
  drop constraint if exists lessons_tutor_no_overlap;
alter table public.lessons
  add constraint lessons_tutor_no_overlap
  exclude using gist (
    tutor_id with =,
    tsrange(
      scheduled_date_time,
      scheduled_date_time + make_interval(mins => duration_minutes)
    ) with &&
  )
  where (status in ('scheduled', 'in_progress'));
