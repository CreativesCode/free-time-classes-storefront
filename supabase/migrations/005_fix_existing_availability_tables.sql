-- Fix legacy schemas where tables already existed before migration 004.
-- `create table if not exists` does not add new columns to existing tables.

alter table public.tutor_availability
  add column if not exists subject_id int references public.subjects (id),
  add column if not exists duration_minutes int,
  add column if not exists price numeric(10, 2);

-- Backfill sensible defaults for rows created before new columns.
update public.tutor_availability
set duration_minutes = coalesce(duration_minutes, 60),
    price = coalesce(price, 0)
where duration_minutes is null
   or price is null;

-- Keep nullability and constraints aligned with the new logic.
alter table public.tutor_availability
  alter column subject_id set not null,
  alter column duration_minutes set not null,
  alter column price set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tutor_availability_duration_minutes_check'
  ) then
    alter table public.tutor_availability
      add constraint tutor_availability_duration_minutes_check
      check (duration_minutes >= 30);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tutor_availability_window_fits_duration'
  ) then
    alter table public.tutor_availability
      add constraint tutor_availability_window_fits_duration
      check (end_time >= start_time + (duration_minutes * interval '1 minute'));
  end if;
end
$$;

alter table public.availability_exceptions
  add column if not exists subject_id int references public.subjects (id),
  add column if not exists duration_minutes int,
  add column if not exists price numeric(10, 2);

do $$
begin
  perform pg_notify('pgrst', 'reload schema');
end
$$;
