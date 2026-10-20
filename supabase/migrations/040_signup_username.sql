-- FRE0009 / F045: sign-up never stored a name, so most users had no username
-- and showed up as "Student"/"Tutor". The trigger now takes the name sent in
-- the sign-up metadata (or the Google profile name). users.username is
-- UNIQUE: a taken name gets a short suffix, and any failure leaves it null so
-- the sign-up itself never breaks. Also pins search_path (F101).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_is_student boolean := coalesce((new.raw_user_meta_data->>'is_student')::boolean, false);
  v_is_tutor boolean := coalesce((new.raw_user_meta_data->>'is_tutor')::boolean, false);
  v_name text := nullif(
    left(
      btrim(coalesce(
        new.raw_user_meta_data->>'username',
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        ''
      )),
      60
    ),
    ''
  );
begin
  if v_name is not null and exists (
    select 1 from public.users u where lower(u.username) = lower(v_name) and u.id <> new.id
  ) then
    v_name := v_name || '-' || left(new.id::text, 4);
  end if;

  begin
    insert into public.users (id, email, is_student, is_tutor, username)
    values (new.id, new.email, v_is_student, v_is_tutor, v_name)
    on conflict (id) do update
      set
        email = excluded.email,
        is_student = excluded.is_student,
        is_tutor = excluded.is_tutor,
        username = coalesce(public.users.username, excluded.username),
        updated_at = now();
  exception when unique_violation then
    insert into public.users (id, email, is_student, is_tutor)
    values (new.id, new.email, v_is_student, v_is_tutor)
    on conflict (id) do update
      set
        email = excluded.email,
        is_student = excluded.is_student,
        is_tutor = excluded.is_tutor,
        updated_at = now();
  end;

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
$function$;
