-- FRE0008 / G-priv-1: users could UPDATE every column of their own row,
-- including is_tutor/is_student (role gates read them), email and created_at.
-- Clients may only edit their profile and notification preferences; role
-- flags and email change through the service role (signup trigger, API).
-- Rows are created by handle_new_user() and deleted via the admin API.

revoke insert, update, delete on public.users from anon, authenticated;

grant update (
  username,
  phone,
  profile_picture,
  country,
  date_of_birth,
  receive_email_notifications,
  receive_sms_notifications,
  receive_whatsapp_notifications,
  updated_at
) on public.users to authenticated;
