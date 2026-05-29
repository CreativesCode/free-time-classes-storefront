-- ============================================================
-- 026 · WhatsApp notifications (OpenWA) — outbound
-- ============================================================
-- Adds a per-user opt-in for WhatsApp notifications and a tracking
-- table for every outbound message. The tracking table is seeded now
-- (Phase 1) so the inbound webhook (Phase 2) can match a tutor's reply
-- against the @lid that OpenWA reports — which is NOT the phone number.
-- See docs/OPENWA_IMPLEMENTATION_PLAN.md.

-- ── Per-user opt-in ──────────────────────────────────────────
-- Dedicated flag (NOT reusing receive_sms_notifications, which has
-- different semantics). Defaults true so existing users with a phone
-- on file get WhatsApp once they add a number.
alter table public.users
  add column if not exists receive_whatsapp_notifications boolean not null default true;

-- ── Outbound message tracking ────────────────────────────────
create table if not exists public.wa_messages (
  id              bigserial primary key,
  message_id      text,                       -- id returned by OpenWA on send (carries the delivered @lid)
  user_id         uuid references public.users(id) on delete set null,
  notification_id bigint references public.notifications(id) on delete set null,
  booking_id      bigint,                     -- related booking, for matching replies in Phase 2
  direction       text not null default 'outbound',
  chat_id         text,                       -- chatId used to send (digit-suffix fallback for matching)
  created_at      timestamptz not null default now()
);

-- Match an inbound reply's @lid against the delivered message_id (Phase 2)
create index if not exists idx_wa_messages_message_id
  on public.wa_messages (message_id);

-- Per-user history / auditing
create index if not exists idx_wa_messages_user_created
  on public.wa_messages (user_id, created_at desc);

-- Resolve which booking a reply belongs to (Phase 2)
create index if not exists idx_wa_messages_booking
  on public.wa_messages (booking_id) where booking_id is not null;

-- ── RLS ──────────────────────────────────────────────────────
-- Server-side only: inserted/read via the service role key from API
-- routes. No policies for authenticated users.
alter table public.wa_messages enable row level security;
