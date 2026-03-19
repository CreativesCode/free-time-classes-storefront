-- Ensure avatars bucket exists (public read).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Remove old avatar policies if they exist to avoid duplicates/conflicts.
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;

-- Public read for avatars.
create policy "avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

-- Authenticated users can upload only their own avatar objects.
-- Supports both formats:
-- 1) "<uid>.<ext>"
-- 2) "<uid>/<anything>"
create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or split_part(split_part(name, '/', 1), '.', 1) = auth.uid()::text
  )
);

create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or split_part(split_part(name, '/', 1), '.', 1) = auth.uid()::text
  )
)
with check (
  bucket_id = 'avatars'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or split_part(split_part(name, '/', 1), '.', 1) = auth.uid()::text
  )
);

create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or split_part(split_part(name, '/', 1), '.', 1) = auth.uid()::text
  )
);
