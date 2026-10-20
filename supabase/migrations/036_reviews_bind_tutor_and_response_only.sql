-- FRE0008 / F035: the review INSERT policy never tied reviews.tutor_id to the
-- reviewed booking/lesson (the lesson branch compared l.tutor_id with
-- itself), so a student could rate any tutor; course_id was unchecked; and
-- the tutor UPDATE policy let tutors rewrite course_id/student_id/booking_id.
--
-- Which booking/lesson statuses may be reviewed is left unchanged (pending
-- product decision #8 in FRE0007).

drop policy if exists reviews_student_insert on public.reviews;
create policy reviews_student_insert
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = student_id
  and (
    (
      booking_id is not null and lesson_id is null
      and exists (
        select 1
        from public.bookings b
        where b.id = reviews.booking_id
          and b.student_id = auth.uid()
          and b.tutor_id = reviews.tutor_id
          and (
            b.status in ('completed', 'confirmed')
            or (
              b.status = 'pending'
              and exists (
                select 1
                from public.lessons l
                where l.id = b.lesson_id
                  and l.student_id = auth.uid()
                  and l.status = 'completed'
              )
            )
          )
      )
    )
    or (
      lesson_id is not null and booking_id is null
      and exists (
        select 1
        from public.lessons l
        where l.id = reviews.lesson_id
          and l.student_id = auth.uid()
          and l.tutor_id = reviews.tutor_id
          and l.status = 'completed'
      )
    )
  )
  and (
    course_id is null
    or exists (
      select 1 from public.courses c
      where c.id = reviews.course_id and c.tutor_id = reviews.tutor_id
    )
  )
);

-- Tutors may only write their public response.
revoke update, delete on public.reviews from anon, authenticated;
grant update (tutor_response) on public.reviews to authenticated;
