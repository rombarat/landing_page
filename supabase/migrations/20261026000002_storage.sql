-- Public-read bucket for store media (product photos, logos, hero images).
-- Writes happen only from the Next.js server with the service role, after the
-- server has verified store membership and re-encoded the image to WebP. No
-- storage.objects policies are created for anon/authenticated, so the API roles
-- cannot upload, overwrite or delete objects directly.
--
-- Skipped automatically on plain Postgres (local test stack) where the storage
-- schema does not exist.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('store-media', 'store-media', true, 2097152, array['image/webp'])
    on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;
  end if;
end;
$$;
