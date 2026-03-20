-- Free Time Classes - 006 - User privacy settings
-- Adds profile visibility preference and keeps it editable from the /settings page.

alter table public.users
  add column if not exists profile_visibility text
  not null
  default 'public';

