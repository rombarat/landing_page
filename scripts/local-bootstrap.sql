-- Minimal Supabase-compatible roles/schemas for local testing on plain Postgres.
-- Mirrors what a hosted Supabase project provides out of the box.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    create role supabase_auth_admin login createrole password 'local-auth-admin';
  end if;
end $$;

create schema if not exists auth authorization supabase_auth_admin;
create schema if not exists extensions;
grant usage on schema extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant create on database postgres to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;
