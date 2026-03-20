-- Free Time Classes - Supabase Migration
-- 008 - Ajuste de política para reseñas (usar `confirmed` cuando aplique)

-- Reemplaza la política de inserción del estudiante para que permita bookings
-- marcados como `confirmed` (además de `completed`, si existe en el proyecto).

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
        and b.status in ('completed', 'confirmed')
    )
  );

