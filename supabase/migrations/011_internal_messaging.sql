-- 011 - Internal messaging (direct conversations)

create table if not exists public.conversations (
  id bigserial primary key,
  type text not null default 'direct' check (type in ('direct')),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table if exists public.conversation_participants
  add column if not exists conversation_id bigint;
alter table if exists public.conversation_participants
  add column if not exists user_id uuid;
alter table if exists public.conversation_participants
  add column if not exists last_read_at timestamptz;
alter table if exists public.conversation_participants
  add column if not exists joined_at timestamptz default now();

create table if not exists public.messages (
  id bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

alter table if exists public.messages
  add column if not exists conversation_id bigint;
alter table if exists public.messages
  add column if not exists sender_id uuid;
alter table if exists public.messages
  add column if not exists content text;
alter table if exists public.messages
  add column if not exists created_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversation_participants_conversation_id_fkey'
  ) then
    alter table public.conversation_participants
      add constraint conversation_participants_conversation_id_fkey
      foreign key (conversation_id) references public.conversations(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversation_participants_user_id_fkey'
  ) then
    alter table public.conversation_participants
      add constraint conversation_participants_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_conversation_id_fkey'
  ) then
    alter table public.messages
      add constraint messages_conversation_id_fkey
      foreign key (conversation_id) references public.conversations(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_sender_id_fkey'
  ) then
    alter table public.messages
      add constraint messages_sender_id_fkey
      foreign key (sender_id) references public.users(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_conversation_participants_user_id
  on public.conversation_participants (user_id);

create index if not exists idx_messages_conversation_created_at
  on public.messages (conversation_id, created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists conversations_select_participants on public.conversations;
create policy conversations_select_participants
on public.conversations
for select
to authenticated
using (
  id in (
    select cp.conversation_id
    from public.conversation_participants cp
    where cp.user_id = auth.uid()
  )
);

drop policy if exists conversations_insert_authenticated on public.conversations;
create policy conversations_insert_authenticated
on public.conversations
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists conversation_participants_select_own on public.conversation_participants;
create policy conversation_participants_select_own
on public.conversation_participants
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists conversation_participants_insert_own on public.conversation_participants;
create policy conversation_participants_insert_own
on public.conversation_participants
for insert
to authenticated
with check (
  user_id = auth.uid()
  or conversation_id in (
    select c.id
    from public.conversations c
    where c.created_by = auth.uid()
  )
);

drop policy if exists conversation_participants_update_own on public.conversation_participants;
create policy conversation_participants_update_own
on public.conversation_participants
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
on public.messages
for select
to authenticated
using (
  conversation_id in (
    select cp.conversation_id
    from public.conversation_participants cp
    where cp.user_id = auth.uid()
  )
);

drop policy if exists messages_insert_sender_participant on public.messages;
create policy messages_insert_sender_participant
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and conversation_id in (
    select cp.conversation_id
    from public.conversation_participants cp
    where cp.user_id = auth.uid()
  )
);

create or replace function public.touch_conversation_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation_updated_at on public.messages;
create trigger trg_touch_conversation_updated_at
after insert on public.messages
for each row execute function public.touch_conversation_updated_at();

drop function if exists public.get_or_create_direct_conversation(uuid);
create or replace function public.get_or_create_direct_conversation(other_user uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_user uuid := auth.uid();
  convo_id bigint;
begin
  if v_current_user is null then
    raise exception 'Unauthenticated';
  end if;

  if $1 is null or $1::uuid = v_current_user then
    raise exception 'Invalid participant';
  end if;

  select c.id
    into convo_id
  from public.conversations c
  join public.conversation_participants cp1
    on cp1.conversation_id = c.id and cp1.user_id = v_current_user
  join public.conversation_participants cp2
    on cp2.conversation_id = c.id and cp2.user_id = $1::uuid
  where c.type = 'direct'
    and (
      select count(*)
      from public.conversation_participants cp
      where cp.conversation_id = c.id
    ) = 2
  limit 1;

  if convo_id is not null then
    return convo_id;
  end if;

  insert into public.conversations (type, created_by)
  values ('direct', v_current_user)
  returning id into convo_id;

  insert into public.conversation_participants (conversation_id, user_id)
  values (convo_id, v_current_user), (convo_id, $1::uuid)
  on conflict do nothing;

  return convo_id;
end;
$$;

grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
