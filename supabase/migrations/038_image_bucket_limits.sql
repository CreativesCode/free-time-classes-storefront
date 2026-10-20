-- FRE0014 / F033: course covers accepted any file type and no image bucket
-- had a size limit. The app now downscales images before uploading (covers
-- 1600px, avatars 512px), so these limits only stop abuse.

update storage.buckets
set file_size_limit = 5 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'course_covers';

update storage.buckets
set file_size_limit = 2 * 1024 * 1024
where id = 'avatars';
