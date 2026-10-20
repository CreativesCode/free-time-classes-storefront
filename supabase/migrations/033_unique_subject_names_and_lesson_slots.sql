-- FRE0008 / F006: subject names must be unique ignoring case and outer
-- spaces (the existing subjects_name_key is case-sensitive), so concurrent
-- creations cannot produce "English" and "english".
create unique index if not exists subjects_name_lower_key
  on public.subjects (lower(btrim(name)));

-- FRE0011 / F001: the daily cron and the rules API insert slots idempotently;
-- this guarantees a tutor never gets two live lessons at the same start time
-- (cancelled lessons do not block the slot).
create unique index if not exists lessons_tutor_start_live_key
  on public.lessons (tutor_id, scheduled_date_time)
  where status <> 'cancelled';
