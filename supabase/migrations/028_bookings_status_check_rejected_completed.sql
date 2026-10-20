-- FRE0008 / F003: the live CHECK only allowed pending/confirmed/cancelled, so
-- tutors could not reject a request and nothing could be marked completed.
-- Recreate it with the full booking lifecycle used by the app.

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed'));
