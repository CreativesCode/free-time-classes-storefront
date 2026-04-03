-- Imagen de portada del curso (ruta dentro del bucket course_covers).

alter table public.courses
  add column if not exists cover_image text;

comment on column public.courses.cover_image is
  'Ruta en el bucket course_covers, p. ej. {course_id}/{timestamp}.jpg';

insert into storage.buckets (id, name, public)
values ('course_covers', 'course_covers', true)
on conflict (id) do nothing;

drop policy if exists "course_covers_public_read" on storage.objects;
drop policy if exists "course_covers_insert_tutor" on storage.objects;
drop policy if exists "course_covers_update_tutor" on storage.objects;
drop policy if exists "course_covers_delete_tutor" on storage.objects;

create policy "course_covers_public_read"
on storage.objects
for select
to public
using (bucket_id = 'course_covers');

create policy "course_covers_insert_tutor"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'course_covers'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 1)
      and c.tutor_id = auth.uid()
  )
);

create policy "course_covers_update_tutor"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'course_covers'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 1)
      and c.tutor_id = auth.uid()
  )
)
with check (
  bucket_id = 'course_covers'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 1)
      and c.tutor_id = auth.uid()
  )
);

create policy "course_covers_delete_tutor"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'course_covers'
  and exists (
    select 1
    from public.courses c
    where c.id::text = split_part(name, '/', 1)
      and c.tutor_id = auth.uid()
  )
);
