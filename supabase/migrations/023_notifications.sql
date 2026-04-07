-- ============================================================
-- 023 · Internal notifications
-- ============================================================

-- Drop existing table and recreate cleanly
drop table if exists public.notifications cascade;

create table public.notifications (
  id          bigserial primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,               -- booking_request | booking_confirmed | booking_rejected | booking_cancelled
  title       text not null,
  body        text not null default '',
  data        jsonb not null default '{}',  -- arbitrary payload (booking_id, lesson_id, actor name …)
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index for fast per-user queries ordered by newest first
create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- Index for unread count badge
create index if not exists idx_notifications_user_unread
  on public.notifications (user_id) where is_read = false;

-- ── RLS ──────────────────────────────────────────────────────
alter table public.notifications enable row level security;

-- Users can only read their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can mark their own notifications as read
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only the service role (API routes) inserts notifications
-- No insert policy for authenticated = server-side only via service role key

-- ── Enable Realtime ──────────────────────────────────────────
alter publication supabase_realtime add table public.notifications;
