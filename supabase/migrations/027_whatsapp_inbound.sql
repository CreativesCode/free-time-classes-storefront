-- ============================================================
-- 027 · WhatsApp inbound (OpenWA) — webhook events
-- ============================================================
-- Stores processed inbound webhook events for idempotency + auditing.
-- The unique idempotency_key is the dedup guard: OpenWA may resend the
-- same event (and may even send a constant idempotencyKey of "msg_unknown"),
-- so we build our own key from data.id / deliveryId and rely on the unique
-- constraint to reject re-processing atomically.
-- See docs/OPENWA_IMPLEMENTATION_PLAN.md (Phase 2) and guide §5.5.

create table if not exists public.wa_inbound_events (
  id              bigserial primary key,
  idempotency_key text not null unique,       -- our own key (msgid:<id> / dlv:<deliveryId>)
  from_id         text,                        -- data.from (often an @lid, NOT a phone)
  body            text,                        -- raw message body
  booking_id      bigint,                      -- resolved booking, if any
  action          text,                        -- 'confirm' | 'reject' | 'unrecognized' | 'no_match' | …
  created_at      timestamptz not null default now()
);

create index if not exists idx_wa_inbound_events_created
  on public.wa_inbound_events (created_at desc);

-- ── RLS ──────────────────────────────────────────────────────
-- Server-side only (service role). No policies for authenticated users.
alter table public.wa_inbound_events enable row level security;
