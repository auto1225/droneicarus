-- Drone Icarus — Storage buckets + policies
-- Two buckets:
--   videos   : pilot-uploaded source clips (private; signed URLs for delivery)
--   thumbs   : public thumbnails + poster frames
--   avatars  : public user avatars

insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('thumbs', 'thumbs', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- =========================================
-- Policies — storage.objects
-- =========================================

-- VIDEOS bucket
-- Owner uploads/reads; buyers can read via signed URL (policy doesn't apply to signed URLs).
-- Path convention: videos/{owner_id}/{video_id}.{ext}

drop policy if exists videos_owner_write on storage.objects;
create policy videos_owner_write on storage.objects
for all to authenticated
using (
  bucket_id = 'videos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists videos_owner_read on storage.objects;
create policy videos_owner_read on storage.objects
for select to authenticated
using (
  bucket_id = 'videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- THUMBS bucket (public-read, owner-write)
-- Path: thumbs/{owner_id}/{video_id}.jpg

drop policy if exists thumbs_public_read on storage.objects;
create policy thumbs_public_read on storage.objects
for select to public
using (bucket_id = 'thumbs');

drop policy if exists thumbs_owner_write on storage.objects;
create policy thumbs_owner_write on storage.objects
for insert to authenticated
with check (
  bucket_id = 'thumbs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists thumbs_owner_modify on storage.objects;
create policy thumbs_owner_modify on storage.objects
for update to authenticated
using (
  bucket_id = 'thumbs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists thumbs_owner_delete on storage.objects;
create policy thumbs_owner_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'thumbs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- AVATARS bucket (public-read, owner-write)
-- Path: avatars/{user_id}.jpg

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
for select to public
using (bucket_id = 'avatars');

drop policy if exists avatars_owner_write on storage.objects;
create policy avatars_owner_write on storage.objects
for all to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = replace(split_part(name, '.', 1), '/', '')
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = replace(split_part(name, '.', 1), '/', '')
);
