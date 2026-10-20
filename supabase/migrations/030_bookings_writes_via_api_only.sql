-- FRE0008 / F008: students had ALL on their bookings without WITH CHECK
-- (could insert 'confirmed' bookings, confirm their own requests or change
-- tutor_id) and tutors could update any column of their bookings.
--
-- Every booking transition now goes through the API routes, which use the
-- service role (request, custom-request, student/cancel, tutor/respond and
-- the WhatsApp webhook). Clients keep read access only.

drop policy if exists "Students can manage their own bookings" on public.bookings;
drop policy if exists bookings_student_manage on public.bookings;
drop policy if exists bookings_tutor_update on public.bookings;

drop policy if exists bookings_student_view on public.bookings;
create policy bookings_student_view
on public.bookings
for select
to authenticated
using (auth.uid() = student_id);

revoke insert, update, delete on public.bookings from anon, authenticated;
