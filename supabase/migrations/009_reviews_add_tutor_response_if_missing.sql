-- Free Time Classes - Supabase Migration
-- 009 - Backfill tutor_response column + reload PostgREST schema cache

alter table public.reviews
  add column if not exists tutor_response text;

-- Ensure PostgREST notices schema changes quickly.
do $$
begin
  perform pg_notify('pgrst', 'reload schema');
exception
  when undefined_function then
    null;
end
$$;

