-- Catalog reads for subjects on the server often use the anon key (no JWT).
-- Browser clients after sign-in use the authenticated role; without a matching
-- SELECT policy, RLS returns zero rows — e.g. empty "Materia" filter for students.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'subjects'
      and policyname = 'subjects_select_authenticated'
  ) then
    create policy "subjects_select_authenticated"
      on public.subjects
      for select
      to authenticated
      using (true);
  end if;
end
$$;
