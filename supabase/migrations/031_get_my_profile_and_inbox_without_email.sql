-- FRE0008 / F037 (part 1, additive): prepare for hiding private user columns.
--
-- * get_my_profile(): the session user's full row (email, phone, notification
--   preferences...). Migration 032 revokes direct SELECT on those columns, so
--   the app reads its own profile through this function.
-- * list_my_conversation_inbox(): stop returning the other participant's
--   email (it only needs id, username and avatar).
--
-- Safe to apply before the matching app deploy: nothing is removed that the
-- current code depends on.

create or replace function public.get_my_profile()
returns setof public.users
language sql
stable
security definer
set search_path = public
as $$
  select * from public.users where id = auth.uid();
$$;

revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

CREATE OR REPLACE FUNCTION public.list_my_conversation_inbox()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

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

$function$;
