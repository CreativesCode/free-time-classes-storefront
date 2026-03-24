-- Google Calendar OAuth tokens for tutors + google_event_id on lessons
-- Tutors connect their Google account once via OAuth; tokens are stored here.

CREATE TABLE IF NOT EXISTS public.google_tokens (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expiry timestamptz NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_tokens_own" ON public.google_tokens
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS google_event_id text;

COMMENT ON COLUMN public.lessons.google_event_id IS
  'Google Calendar event ID, set when a Meet event is auto-created';
