-- Free Time Classes - Supabase Migration
-- 001 - Create/Update auth trigger to:
-- - create row in public.users
-- - set is_student / is_tutor from auth.users metadata
-- - create student_profiles / tutor_profiles rows accordingly
--
-- Execute in Supabase SQL Editor.

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_is_student boolean := coalesce((new.raw_user_meta_data->>'is_student')::boolean, false);
  v_is_tutor boolean := coalesce((new.raw_user_meta_data->>'is_tutor')::boolean, false);
begin
  -- Ensure public.users row exists and store role flags
  insert into public.users (id, email, is_student, is_tutor)
  values (new.id, new.email, v_is_student, v_is_tutor)
  on conflict (id) do update
    set
      email = excluded.email,
      is_student = excluded.is_student,
      is_tutor = excluded.is_tutor,
      updated_at = now();

  -- Create role profiles (id is both PK and FK to public.users)
  if v_is_student then
    insert into public.student_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  if v_is_tutor then
    insert into public.tutor_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

