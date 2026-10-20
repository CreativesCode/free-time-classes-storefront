-- FRE0008 / F037 (part 2, restrictive): anonymous visitors (and any signed-in
-- user) could read email, phone, date of birth and preferences of every tutor
-- through users_public_select_tutors, which exposes whole rows.
--
-- RLS filters rows, not columns, so restrict the columns instead: clients can
-- only SELECT the public profile fields. The session user's own private fields
-- come from get_my_profile() (031); server code uses the service role.
--
-- Apply ONLY after the app version that reads its own profile through
-- get_my_profile() is deployed (otherwise `select *` on users fails).

revoke select on public.users from anon, authenticated;

grant select (id, username, profile_picture, country, is_student, is_tutor)
  on public.users to anon, authenticated;
