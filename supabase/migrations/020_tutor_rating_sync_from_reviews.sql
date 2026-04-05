-- Sincronizar tutor_profiles.rating / total_reviews con la tabla reviews.
-- Problema: el trigger original solo corría en INSERT; no en UPDATE/DELETE ni había
-- backfill si las columnas quedaron en 0.

create or replace function public.recalc_tutor_rating_stats(p_tutor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tutor_id is null then
    return;
  end if;

  update public.tutor_profiles tp
  set
    rating = coalesce(
      (select avg(r.rating)::float4 from public.reviews r where r.tutor_id = p_tutor_id),
      0
    ),
    total_reviews = coalesce(
      (select count(*)::int from public.reviews r where r.tutor_id = p_tutor_id),
      0
    )
  where tp.id = p_tutor_id;
end;
$$;

create or replace function public.update_tutor_rating_from_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.recalc_tutor_rating_stats(new.tutor_id);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.tutor_id is distinct from new.tutor_id then
      perform public.recalc_tutor_rating_stats(old.tutor_id);
      perform public.recalc_tutor_rating_stats(new.tutor_id);
    else
      perform public.recalc_tutor_rating_stats(new.tutor_id);
    end if;
    return new;
  end if;

  perform public.recalc_tutor_rating_stats(old.tutor_id);
  return old;
end;
$$;

drop trigger if exists after_review_insert on public.reviews;

drop trigger if exists after_review_change_update_tutor_rating on public.reviews;

create trigger after_review_change_update_tutor_rating
after insert or update or delete on public.reviews
for each row execute procedure public.update_tutor_rating_from_reviews();

drop function if exists public.update_tutor_rating();

-- Backfill: tutores con reseñas
update public.tutor_profiles tp
set
  rating = coalesce(s.avg_rating, 0),
  total_reviews = coalesce(s.cnt, 0)
from (
  select
    tutor_id,
    avg(rating)::float4 as avg_rating,
    count(*)::int as cnt
  from public.reviews
  group by tutor_id
) s
where tp.id = s.tutor_id;

-- Tutores sin reseñas: poner a 0 si quedó basura en las columnas
update public.tutor_profiles tp
set rating = 0, total_reviews = 0
where not exists (select 1 from public.reviews r where r.tutor_id = tp.id)
  and (coalesce(tp.total_reviews, 0) <> 0 or coalesce(tp.rating, 0) <> 0);
