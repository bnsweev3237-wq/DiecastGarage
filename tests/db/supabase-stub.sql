-- Stand-ins for the parts of Supabase the migrations rely on (roles, auth, storage), so the
-- migrations can run on plain Postgres for the database tests.
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

create schema if not exists extensions;
create schema if not exists storage;
create table if not exists storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, created_at timestamptz default now(), metadata jsonb);
do $$ begin create role service_role; exception when duplicate_object then null; end $$;
alter table storage.objects add column if not exists created_at timestamptz default now(); alter table storage.objects add column if not exists bucket_id text; alter table storage.objects add column if not exists name text; alter table storage.objects add column if not exists metadata jsonb;

-- Two-step sign-in (0036): the session's claims, and each user's authenticator apps.
create or replace function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create table if not exists auth.mfa_factors (id uuid primary key default gen_random_uuid(), user_id uuid not null, factor_type text not null default 'totp', status text not null default 'unverified');
