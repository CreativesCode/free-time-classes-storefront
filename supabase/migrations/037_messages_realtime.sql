-- FRE0015 / F028: direct messages had no realtime (only notifications were
-- published), so new messages only appeared after a reload. Publish
-- `messages`; Realtime applies the existing SELECT policy, so each user only
-- receives messages from their own conversations.

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$migration$;
