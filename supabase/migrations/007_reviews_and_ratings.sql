-- Free Time Classes - Supabase Migration
-- 007 - Valoraciones y reseñas

-- 1) Tabla: reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id int not null references public.bookings(id) on delete cascade unique,
  student_id uuid not null references public.student_profiles(id) on delete cascade,
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  tutor_response text,
  created_at timestamptz default now()
);

-- 2) Trigger: recalcular rating / total_reviews del tutor
create or replace function public.update_tutor_rating()
returns trigger as $$
begin
  update public.tutor_profiles
  set
    rating = coalesce(
      (select avg(rating)::float from public.reviews where tutor_id = NEW.tutor_id),
      0
    ),
    total_reviews = coalesce(
      (select count(*) from public.reviews where tutor_id = NEW.tutor_id),
      0
    )
  where id = NEW.tutor_id;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists after_review_insert on public.reviews;
create trigger after_review_insert
after insert on public.reviews
for each row execute procedure public.update_tutor_rating();

-- 3) Proteger que el estudiante no edite rating/comment tras crear la reseña.
--    (El tutor puede responder actualizando `tutor_response`).
create or replace function public.prevent_review_rating_comment_updates()
returns trigger as $$
begin
  if (NEW.rating <> OLD.rating) then
    raise exception 'rating cannot be modified after creation';
  end if;

  if (coalesce(NEW.comment, '') <> coalesce(OLD.comment, '')) then
    raise exception 'comment cannot be modified after creation';
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists before_review_rating_comment_update on public.reviews;
create trigger before_review_rating_comment_update
before update of rating, comment on public.reviews
for each row execute procedure public.prevent_review_rating_comment_updates();

-- 4) Row Level Security (RLS) + políticas
alter table public.reviews enable row level security;

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
on public.reviews
for select
using (true);

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
      and b.status = 'completed'
  )
);

drop policy if exists "reviews_tutor_update_response" on public.reviews;
create policy "reviews_tutor_update_response"
on public.reviews
for update
using (auth.uid() = tutor_id)
with check (auth.uid() = tutor_id);

