-- Inbox list for the messaging UI. SECURITY DEFINER so we can join public.users for the
-- *other* participant: RLS on users only exposes tutors (015_users_public_select_tutors),
-- so tutors could not load student rows via PostgREST and getUserConversations dropped every thread.

create or replace function public.list_my_conversation_inbox()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(row_json order by sort_ts desc nulls last)
      from (
        select
          jsonb_build_object(
            'id', me.conversation_id,
            'other_user', jsonb_build_object(
              'id', u.id,
              'username', u.username,
              'email', u.email,
              'profile_picture', u.profile_picture
            ),
            'last_message_content', lm.content,
            'last_message_created_at', lm.created_at,
            'unread_count', (
              select count(*)::int
              from messages msg
              where msg.conversation_id = me.conversation_id
                and (me.last_read_at is null or msg.created_at > me.last_read_at)
            ),
            'updated_at', c.updated_at
          ) as row_json,
          coalesce(lm.created_at, c.updated_at) as sort_ts
        from conversation_participants me
        inner join conversations c
          on c.id = me.conversation_id and c.type = 'direct'
        inner join conversation_participants other
          on other.conversation_id = me.conversation_id
         and other.user_id <> me.user_id
        inner join users u on u.id = other.user_id
        left join lateral (
          select m.content, m.created_at
          from messages m
          where m.conversation_id = me.conversation_id
          order by m.created_at desc
          limit 1
        ) lm on true
        where me.user_id = auth.uid()
          and (
            select count(*)::int
            from conversation_participants x
            where x.conversation_id = me.conversation_id
          ) = 2
      ) sub
    ),
    '[]'::jsonb
  );
$$;

revoke all on function public.list_my_conversation_inbox() from public;
grant execute on function public.list_my_conversation_inbox() to authenticated;
