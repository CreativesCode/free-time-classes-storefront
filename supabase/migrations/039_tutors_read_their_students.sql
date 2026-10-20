-- FRE0012 / F016, F082: public.users rows are only readable for tutors (and
-- for the owner), so a tutor could not see the name or avatar of the students
-- who booked with them: Mis Reservas showed "Student" and the dashboard showed
-- raw ids. Let a tutor read the users rows of students that have at least one
-- booking with them. Column-level grants (migration 032) still limit what is
-- readable to the public profile columns.

create or replace function public.is_tutor_of_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    where b.tutor_id = auth.uid()
      and b.student_id = p_student_id
  );
$$;

revoke all on function public.is_tutor_of_student(uuid) from public;
grant execute on function public.is_tutor_of_student(uuid) to authenticated;

drop policy if exists users_select_own_students on public.users;
create policy users_select_own_students
on public.users
for select
to authenticated
using (public.is_tutor_of_student(id));
