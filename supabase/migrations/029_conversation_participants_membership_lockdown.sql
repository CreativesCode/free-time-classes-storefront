-- FRE0008 / F007: users could add themselves to any conversation (INSERT
-- branch `user_id = auth.uid()`) or move their own participant row to another
-- conversation (UPDATE allowed changing conversation_id).
--
-- Conversations and participants are only created by the SECURITY DEFINER RPC
-- get_or_create_direct_conversation() and by API routes using the service
-- role, so clients need no INSERT at all. The browser only updates its own
-- read marker (last_read_at).

drop policy if exists conversation_participants_insert_own on public.conversation_participants;
drop policy if exists conversations_insert_authenticated on public.conversations;

revoke insert, delete on public.conversation_participants from anon, authenticated;
revoke insert, delete on public.conversations from anon, authenticated;

-- Only the read marker is writable from the client.
revoke update on public.conversation_participants from anon, authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;
