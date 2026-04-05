-- Permitir que el estudiante deje reseña si la lección ya está completada
-- aunque la reserva siga en `pending` (desincronización habitual).

drop policy if exists "reviews_student_insert" on public.reviews;

create policy "reviews_student_insert"
  on public.reviews
  for insert
  with check (
    auth.uid() = student_id
    and exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and b.student_id = auth.uid()
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
  );
