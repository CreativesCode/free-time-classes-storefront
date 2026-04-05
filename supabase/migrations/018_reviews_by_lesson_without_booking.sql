-- Reseñas ligadas a lección completada cuando no hay fila en `bookings`
-- (o solo reservas no elegibles). Corrige curso_id desde `lessons` sin booking.

alter table public.reviews alter column booking_id drop not null;

alter table public.reviews
  add column if not exists lesson_id int references public.lessons(id) on delete cascade;

alter table public.reviews
  drop constraint if exists reviews_booking_or_lesson_ck;

alter table public.reviews
  add constraint reviews_booking_or_lesson_ck check (
    (booking_id is not null and lesson_id is null)
    or (booking_id is null and lesson_id is not null)
  );

create unique index if not exists reviews_student_lesson_unique
  on public.reviews (student_id, lesson_id)
  where lesson_id is not null;

-- Inferir course_id desde booking o desde lesson
create or replace function public.set_review_course_id_from_booking()
returns trigger as $$
declare
  v_has_lessons_course_id boolean := false;
begin
  if new.course_id is not null then
    return new;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'course_id'
  )
  into v_has_lessons_course_id;

  if not v_has_lessons_course_id then
    return new;
  end if;

  if new.booking_id is not null then
    select l.course_id
    into new.course_id
    from public.bookings b
    join public.lessons l on l.id = b.lesson_id
    where b.id = new.booking_id;
  elsif new.lesson_id is not null then
    select l.course_id
    into new.course_id
    from public.lessons l
    where l.id = new.lesson_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop policy if exists "reviews_student_insert" on public.reviews;

create policy "reviews_student_insert"
  on public.reviews
  for insert
  with check (
    auth.uid() = student_id
    and (
      (
        booking_id is not null
        and lesson_id is null
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
      )
      or
      (
        lesson_id is not null
        and booking_id is null
        and exists (
          select 1
          from public.lessons l
          where l.id = lesson_id
            and l.student_id = auth.uid()
            and l.status = 'completed'
            and l.tutor_id = tutor_id
        )
      )
    )
  );
