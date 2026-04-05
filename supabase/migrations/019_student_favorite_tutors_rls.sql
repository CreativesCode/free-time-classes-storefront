-- Favoritos de tutor: tabla + RLS para que el estudiante pueda leer/insertar/borrar solo sus filas.
-- Sin política de DELETE el botón de quitar favorito no persiste y un refresh vuelve a mostrar al tutor.

create table if not exists public.student_favorite_tutors (
  student_id uuid not null references public.student_profiles (id) on delete cascade,
  tutor_id uuid not null references public.tutor_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, tutor_id)
);

create index if not exists student_favorite_tutors_tutor_id_idx
  on public.student_favorite_tutors (tutor_id);

alter table public.student_favorite_tutors enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_favorite_tutors'
      and policyname = 'student_favorite_tutors_select_own'
  ) then
    create policy "student_favorite_tutors_select_own"
      on public.student_favorite_tutors
      for select
      to authenticated
      using (auth.uid() = student_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_favorite_tutors'
      and policyname = 'student_favorite_tutors_insert_own'
  ) then
    create policy "student_favorite_tutors_insert_own"
      on public.student_favorite_tutors
      for insert
      to authenticated
      with check (auth.uid() = student_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'student_favorite_tutors'
      and policyname = 'student_favorite_tutors_delete_own'
  ) then
    create policy "student_favorite_tutors_delete_own"
      on public.student_favorite_tutors
      for delete
      to authenticated
      using (auth.uid() = student_id);
  end if;
end
$$;
