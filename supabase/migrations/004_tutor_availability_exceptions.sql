-- Recurring weekly availability and exceptions (block days / extra slots).
-- Generated open slots are stored in public.lessons with availability_rule_id set.

create table if not exists public.tutor_availability (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  subject_id int not null references public.subjects (id),
  duration_minutes int not null check (duration_minutes >= 30),
  price numeric(10, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  constraint tutor_availability_time_order check (start_time < end_time),
  constraint tutor_availability_window_fits_duration check (
    end_time >= start_time + (duration_minutes * interval '1 minute')
  )
);

create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  exception_date date not null,
  start_time time,
  end_time time,
  type text not null default 'blocked' check (type in ('blocked', 'extra')),
  reason text,
  subject_id int references public.subjects (id),
  duration_minutes int,
  price numeric(10, 2),
  created_at timestamptz default now(),
  constraint availability_exceptions_extra_fields check (
    type <> 'extra'
    or (
      start_time is not null
      and end_time is not null
      and subject_id is not null
      and duration_minutes is not null
      and price is not null
      and start_time < end_time
    )
  ),
  constraint availability_exceptions_blocked_times check (
    type <> 'blocked'
    or (
      (start_time is null and end_time is null)
      or (
        start_time is not null
        and end_time is not null
        and start_time < end_time
      )
    )
  )
);

alter table public.lessons
  add column if not exists availability_rule_id uuid references public.tutor_availability (id) on delete set null;

create index if not exists lessons_availability_rule_id_idx on public.lessons (availability_rule_id);

alter table public.tutor_availability enable row level security;
alter table public.availability_exceptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_availability'
      and policyname = 'tutor_availability_tutor_manage'
  ) then
    create policy "tutor_availability_tutor_manage"
      on public.tutor_availability
      for all
      using (auth.uid() = tutor_id);
  end if;
end
$$;

-- Ensure PostgREST notices new columns immediately.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when undefined_function then
    -- pg_notify always exists, but keep migration resilient in constrained envs.
    null;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'tutor_availability'
      and policyname = 'tutor_availability_public_read'
  ) then
    create policy "tutor_availability_public_read"
      on public.tutor_availability
      for select
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'availability_exceptions'
      and policyname = 'availability_exceptions_tutor_all'
  ) then
    create policy "availability_exceptions_tutor_all"
      on public.availability_exceptions
      for all
      using (auth.uid() = tutor_id);
  end if;
end
$$;
