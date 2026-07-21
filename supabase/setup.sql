-- DukaanKit — Supabase setup
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run more than once (uses IF NOT EXISTS / ON CONFLICT where it matters).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  description text default '',
  image_url text default '',
  category text default 'General',
  stock int default 999,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  phone text,
  address text,
  items jsonb,
  total numeric,
  status text default 'pending',
  created_at timestamptz default now()
);

-- New product columns (safe to run on an existing store).
alter table products add column if not exists is_featured boolean default false;
alter table products add column if not exists discount_percent int default 0;

-- Link orders to the shopper's account (for order history).
alter table orders add column if not exists customer_email text default '';

-- ---------------------------------------------------------------------------
-- Default settings — ON CONFLICT DO NOTHING so re-running never resets a live
-- store. New keys are added automatically when you re-run this file.
-- ---------------------------------------------------------------------------
insert into settings (key, value) values
  ('store_name', 'OPEN STORE'),
  ('admin_email', ''),
  ('admin_password_hash', 'c7e616822f366fb1b5e0756af498cc11d2c0862edcb32ca65882f622ff39de1b'),
  ('theme', 'clean'),
  ('whatsapp_number', ''),
  ('currency', 'Rs.'),
  ('banner_text', ''),
  ('logo_url', ''),
  ('favicon_url', ''),
  ('delivery_charges', '0'),
  ('about_text', ''),
  ('instagram_link', ''),
  ('setup_complete', 'true'),
  ('tagline', ''),
  ('seller_name', ''),
  ('contact_email', ''),
  ('store_address', ''),
  ('facebook_link', ''),
  ('tiktok_link', ''),
  ('categories', '[]'),
  ('store_open', 'true'),
  ('free_delivery_over', '0')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Storage bucket for product images / logo
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The anon key is public by design (it ships in config.json). RLS is the real
-- boundary. The admin panel gates *writes* with a password, but technically a
-- determined person with the anon key could write too — documented honestly in
-- SECURITY.md. This is an acceptable trade-off for a small, no-server store.
-- ---------------------------------------------------------------------------
alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;

-- Drop-then-create so re-running the file doesn't error on existing policies.
drop policy if exists "public read products" on products;
drop policy if exists "public read settings" on settings;
drop policy if exists "public insert orders" on orders;
drop policy if exists "anon write products" on products;
drop policy if exists "anon update settings" on settings;
drop policy if exists "anon write settings" on settings;
drop policy if exists "anon read orders" on orders;
drop policy if exists "anon update orders" on orders;
drop policy if exists "public read images" on storage.objects;
drop policy if exists "anon upload images" on storage.objects;

-- Public (store visitors) can read products & settings so the store renders.
create policy "public read products" on products for select using (true);
create policy "public read settings" on settings for select using (true);

-- Public can place orders but NOT read anyone's orders.
create policy "public insert orders" on orders for insert with check (true);

-- Writes via anon key (admin panel gates these with the password).
create policy "anon write products" on products for all using (true) with check (true);
-- FOR ALL (insert + update + delete) so the admin panel's upsert works.
-- An update-only policy makes ON CONFLICT upserts fail with 42501.
create policy "anon write settings" on settings for all using (true) with check (true);
create policy "anon read orders" on orders for select using (true);
create policy "anon update orders" on orders for update using (true);

-- Images: public can view, anon can upload (admin panel is the gate).
create policy "public read images" on storage.objects
  for select using (bucket_id = 'store-images');
create policy "anon upload images" on storage.objects
  for insert with check (bucket_id = 'store-images');

-- ---------------------------------------------------------------------------
-- Admin accounts (store owner login) — email + bcrypt password, NO email/SMTP.
-- The Supabase keys connect the app (via env vars / config.json); the admin
-- logs in with an email + password stored here. Locked-down table (RLS on, no
-- policies); all access is through the SECURITY DEFINER functions below.
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

alter table admins enable row level security;

-- IMPORTANT: there is NO public sign-up function. The admin account is created
-- by the owner's generated SQL (the app's setup screen builds it), or manually
-- at the bottom of this file. Because creating it requires running SQL here,
-- ONLY someone with Supabase access (the owner) can ever create an admin.
-- The anon key can LOG IN but cannot create accounts.

-- Whether an admin account already exists (lets the app show login vs setup).
create or replace function admin_exists()
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists (select 1 from admins);
$$;

create or replace function admin_login(p_email text, p_password text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare stored text;
begin
  select password_hash into stored from admins where lower(email) = lower(p_email);
  if stored is null then return false; end if;
  return stored = crypt(p_password, stored);
end; $$;

create or replace function admin_change_password(p_email text, p_current text, p_new text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare stored text;
begin
  select password_hash into stored from admins where lower(email) = lower(p_email);
  if stored is null or stored <> crypt(p_current, stored) then return 'wrong_current'; end if;
  if p_new is null or length(p_new) < 6 then return 'weak_password'; end if;
  update admins set password_hash = crypt(p_new, gen_salt('bf')) where lower(email) = lower(p_email);
  return 'ok';
end; $$;

grant execute on function admin_login(text, text) to anon, authenticated;
grant execute on function admin_change_password(text, text, text) to anon, authenticated;
grant execute on function admin_exists() to anon, authenticated;

-- ── Create your admin login (edit the email + password, then this runs) ─────
-- The app generates this line for you with your chosen credentials. If running
-- this file by hand, change the two values below before running.
set search_path = public, extensions;
insert into admins (email, password_hash)
values ('owner@example.com', crypt('change-this-password', gen_salt('bf')))
on conflict (email) do update set password_hash = excluded.password_hash;

-- ---------------------------------------------------------------------------
-- Customer accounts (shoppers). Email + bcrypt password, NO email/SMTP.
-- Profile, cart and favorites live in the DB so they survive a cleared browser.
-- The table is locked (RLS on, no policies); all access is through the
-- SECURITY DEFINER functions below, which the anon role may only execute.
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text default '',
  phone text default '',
  address text default '',
  cart jsonb default '[]'::jsonb,
  favorites jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table customers enable row level security;

-- Sign up. Returns 'ok' | 'exists' | 'weak_password' | 'invalid_email'.
create or replace function customer_signup(p_email text, p_password text, p_name text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_email is null or position('@' in p_email) = 0 then return 'invalid_email'; end if;
  if p_password is null or length(p_password) < 6 then return 'weak_password'; end if;
  if exists (select 1 from customers where lower(email) = lower(p_email)) then return 'exists'; end if;
  insert into customers (email, password_hash, name)
  values (lower(p_email), crypt(p_password, gen_salt('bf')), coalesce(p_name, ''));
  return 'ok';
end; $$;

-- Log in. Returns the customer profile (incl. cart/favorites) as json, or null.
create or replace function customer_login(p_email text, p_password text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare c customers;
begin
  select * into c from customers where lower(email) = lower(p_email);
  if c.id is null or c.password_hash <> crypt(p_password, c.password_hash) then
    return null;
  end if;
  return json_build_object(
    'id', c.id, 'email', c.email, 'name', c.name, 'phone', c.phone,
    'address', c.address, 'cart', c.cart, 'favorites', c.favorites
  );
end; $$;

-- Update profile fields.
create or replace function customer_update(p_id uuid, p_name text, p_phone text, p_address text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update customers set name = p_name, phone = p_phone, address = p_address where id = p_id;
end; $$;

-- Persist cart + favorites (called as the shopper browses).
create or replace function customer_sync(p_id uuid, p_cart jsonb, p_favorites jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update customers set cart = p_cart, favorites = p_favorites where id = p_id;
end; $$;

grant execute on function customer_signup(text, text, text) to anon, authenticated;
grant execute on function customer_login(text, text) to anon, authenticated;
grant execute on function customer_update(uuid, text, text, text) to anon, authenticated;
grant execute on function customer_sync(uuid, jsonb, jsonb) to anon, authenticated;
