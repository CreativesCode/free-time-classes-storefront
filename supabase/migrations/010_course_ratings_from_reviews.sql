-- Free Time Classes - Supabase Migration
-- 010 - Agregar rating/reseñas por curso a partir de reviews

-- 1) Campos agregados en cursos
alter table public.courses
  add column if not exists rating float4 not null default 0,
  add column if not exists total_reviews int not null default 0;

-- 2) Vincular reseña a curso (nullable para compatibilidad con esquemas legacy)
do $$
declare
  v_courses_id_type text;
begin
  select format_type(a.atttypid, a.atttypmod)
  into v_courses_id_type
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'courses'
    and a.attname = 'id'
    and a.attnum > 0
    and not a.attisdropped;

  if v_courses_id_type is null then
    raise exception 'No se pudo detectar el tipo de public.courses.id';
  end if;

  execute format(
    'alter table public.reviews add column if not exists course_id %s',
    v_courses_id_type
  );

  if not exists (
    select 1
    from pg_constraint
    where conname = 'reviews_course_id_fkey'
  ) then
    execute 'alter table public.reviews add constraint reviews_course_id_fkey foreign key (course_id) references public.courses(id) on delete set null';
  end if;
end
$$;

create index if not exists reviews_course_id_idx on public.reviews(course_id);

-- 3) Antes de insertar reseña, intentar inferir el course_id desde booking -> lesson
--    (si lessons.course_id existe en esta instancia).
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

  if v_has_lessons_course_id then
    execute $q$
      select l.course_id
      from public.bookings b
      join public.lessons l on l.id = b.lesson_id
      where b.id = $1
    $q$
    into new.course_id
    using new.booking_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists before_review_set_course on public.reviews;
create trigger before_review_set_course
before insert on public.reviews
for each row execute procedure public.set_review_course_id_from_booking();

-- 4) Recalcular rating/total_reviews del curso tras cambios en reviews
create or replace function public.update_course_rating_from_reviews()
returns trigger as $$
declare
  v_course_id public.reviews.course_id%TYPE;
begin
  if tg_op = 'INSERT' then
    v_course_id := new.course_id;
    if v_course_id is not null then
      update public.courses
      set
        rating = coalesce(
          (select avg(r.rating)::float4 from public.reviews r where r.course_id = v_course_id),
          0
        ),
        total_reviews = coalesce(
          (select count(*) from public.reviews r where r.course_id = v_course_id),
          0
        )
      where id = v_course_id;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Si cambió de curso, recalcular ambos.
    if old.course_id is distinct from new.course_id then
      if old.course_id is not null then
        update public.courses
        set
          rating = coalesce((select avg(r.rating)::float4 from public.reviews r where r.course_id = old.course_id), 0),
          total_reviews = coalesce((select count(*) from public.reviews r where r.course_id = old.course_id), 0)
        where id = old.course_id;
      end if;

      if new.course_id is not null then
        update public.courses
        set
          rating = coalesce((select avg(r.rating)::float4 from public.reviews r where r.course_id = new.course_id), 0),
          total_reviews = coalesce((select count(*) from public.reviews r where r.course_id = new.course_id), 0)
        where id = new.course_id;
      end if;
    elsif new.course_id is not null then
      update public.courses
      set
        rating = coalesce((select avg(r.rating)::float4 from public.reviews r where r.course_id = new.course_id), 0),
        total_reviews = coalesce((select count(*) from public.reviews r where r.course_id = new.course_id), 0)
      where id = new.course_id;
    end if;

    return new;
  end if;

  -- DELETE
  v_course_id := old.course_id;
  if v_course_id is not null then
    update public.courses
    set
      rating = coalesce((select avg(r.rating)::float4 from public.reviews r where r.course_id = v_course_id), 0),
      total_reviews = coalesce((select count(*) from public.reviews r where r.course_id = v_course_id), 0)
    where id = v_course_id;
  end if;

  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists after_review_change_update_course_rating on public.reviews;
create trigger after_review_change_update_course_rating
after insert or update or delete on public.reviews
for each row execute procedure public.update_course_rating_from_reviews();

-- 5) Backfill course_id para reviews existentes, si lessons.course_id existe
do $$
declare
  v_has_lessons_course_id boolean := false;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'lessons'
      and column_name = 'course_id'
  )
  into v_has_lessons_course_id;

  if v_has_lessons_course_id then
    execute $q$
      update public.reviews r
      set course_id = l.course_id
      from public.bookings b
      join public.lessons l on l.id = b.lesson_id
      where r.booking_id = b.id
        and r.course_id is null
        and l.course_id is not null
    $q$;
  end if;
end
$$;

-- 6) Backfill rating/total_reviews de todos los cursos
update public.courses c
set
  rating = coalesce((select avg(r.rating)::float4 from public.reviews r where r.course_id = c.id), 0),
  total_reviews = coalesce((select count(*) from public.reviews r where r.course_id = c.id), 0);

