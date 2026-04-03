-- Allow anon/authenticated to read tutor rows in public.users so nested embeds
-- (courses → tutor_profiles → users) return username/profile for catalog cards.
-- Mirrors the identity already shown on /tutors. Apply only if RLS is on users.

do $migration$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'users'
      and c.relrowsecurity = true
  )
  and not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_public_select_tutors'
  ) then
    create policy users_public_select_tutors
    on public.users
    for select
    to anon, authenticated
    using (coalesce(is_tutor, false) = true);
  end if;
end
$migration$;
