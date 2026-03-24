-- Add meet_link column to lessons table for video call support
-- The tutor can paste any video call URL (Google Meet, Zoom, Jitsi, Teams, etc.)
-- when confirming a booking.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS meet_link text;

COMMENT ON COLUMN public.lessons.meet_link IS
  'URL de videollamada proporcionada por el tutor al confirmar la reserva';
