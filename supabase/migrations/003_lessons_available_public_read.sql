-- Allow authenticated users to read available lesson slots.
-- This keeps booked/private lesson rows protected by existing policies.

alter table public.lessons enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'lessons'
      and policyname = 'lessons_available_public_read'
  ) then
    create policy "lessons_available_public_read"
      on public.lessons
      for select
      using (status = 'available');
  end if;
end
$$;

