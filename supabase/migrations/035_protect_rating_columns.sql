-- FRE0008 / F024 + G-priv-2: tutors could set their own rating and
-- total_reviews on courses and tutor_profiles (their UPDATE/INSERT policies
-- cover whole rows). Those columns are maintained by the reviews triggers,
-- which run as the function owner; keep the stored values whenever a client
-- role writes the row.

create or replace function public.protect_rating_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.rating := 0;
      new.total_reviews := 0;
    else
      new.rating := old.rating;
      new.total_reviews := old.total_reviews;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_rating_columns on public.courses;
create trigger protect_rating_columns
before insert or update on public.courses
for each row execute function public.protect_rating_columns();

drop trigger if exists protect_rating_columns on public.tutor_profiles;
create trigger protect_rating_columns
before insert or update on public.tutor_profiles
for each row execute function public.protect_rating_columns();

alter table public.tutor_profiles
  drop constraint if exists tutor_profiles_hourly_rate_non_negative;
alter table public.tutor_profiles
  add constraint tutor_profiles_hourly_rate_non_negative
  check (hourly_rate is null or hourly_rate >= 0);
