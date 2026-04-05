-- Allow each participant to read every participant row in conversations they belong to.
-- The previous policy only exposed rows where user_id = auth.uid(), so the app could not
-- read the co-participant row and getUserConversations skipped all threads.
--
-- Uses SECURITY DEFINER to avoid RLS recursion when the policy references conversation_participants.

create or replace function public.user_is_conversation_participant(p_conversation_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = auth.uid()
  );
$$;

revoke all on function public.user_is_conversation_participant(bigint) from public;
grant execute on function public.user_is_conversation_participant(bigint) to authenticated;

drop policy if exists conversation_participants_select_own on public.conversation_participants;
drop policy if exists conversation_participants_select_member on public.conversation_participants;

create policy conversation_participants_select_member
on public.conversation_participants
for select
to authenticated
using (public.user_is_conversation_participant(conversation_id));
