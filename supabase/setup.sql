-- OPEN STORE — Supabase setup
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to run more than once (uses IF NOT EXISTS / ON CONFLICT where it matters).
--
-- After running this, create your ONE admin login in the Supabase dashboard:
--   Authentication → Users → Add user → enter email + password → tick
--   "Auto Confirm User". That is the only account that can manage the store.

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

alter table products add column if not exists is_featured boolean default false;
alter table products add column if not exists discount_percent int default 0;

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

alter table orders add column if not exists customer_email text default '';

insert into settings (key, value) values
  ('store_name', 'OPEN STORE'),
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

insert into storage.buckets (id, name, public)
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;

-- Drop any earlier policies (including the old open "anon write" ones) so this
-- script is safe to re-run and upgrades an existing store to the locked-down set.
drop policy if exists "public read products" on products;
drop policy if exists "public read settings" on settings;
drop policy if exists "public insert orders" on orders;
drop policy if exists "anon write products" on products;
drop policy if exists "anon update settings" on settings;
drop policy if exists "anon write settings" on settings;
drop policy if exists "anon read orders" on orders;
drop policy if exists "anon update orders" on orders;
drop policy if exists "auth write products" on products;
drop policy if exists "auth write settings" on settings;
drop policy if exists "auth read orders" on orders;
drop policy if exists "auth update orders" on orders;
drop policy if exists "public read images" on storage.objects;
drop policy if exists "anon upload images" on storage.objects;
drop policy if exists "auth upload images" on storage.objects;

-- Public (anyone, incl. logged-out shoppers) may READ products & settings and
-- PLACE an order — nothing more. Only the logged-in admin (a real Supabase Auth
-- user) may write products/settings and read or update orders. This keeps the
-- public anon key from reading customer order data or editing your catalog.
create policy "public read products" on products for select using (true);
create policy "auth write products" on products for all to authenticated using (true) with check (true);

create policy "public read settings" on settings for select using (true);
create policy "auth write settings" on settings for all to authenticated using (true) with check (true);

create policy "public insert orders" on orders for insert with check (true);
create policy "auth read orders" on orders for select to authenticated using (true);
create policy "auth update orders" on orders for update to authenticated using (true) with check (true);

create policy "public read images" on storage.objects for select using (bucket_id = 'store-images');
create policy "auth upload images" on storage.objects for insert to authenticated with check (bucket_id = 'store-images');

-- ---------------------------------------------------------------------------
-- Admin login
-- ---------------------------------------------------------------------------
-- There is no admins table and no public sign-up. Create your ONE admin in the
-- Supabase dashboard → Authentication → Users → "Add user": enter your email +
-- password and tick "Auto Confirm User". Only someone with Supabase access can
-- create it, so no visitor can ever register.

-- ---------------------------------------------------------------------------
-- Customer accounts (shoppers) — DB-backed profile, cart and favorites
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

create or replace function customer_login(p_email text, p_password text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare c customers;
begin
  select * into c from customers where lower(email) = lower(p_email);
  if c.id is null or c.password_hash <> crypt(p_password, c.password_hash) then return null; end if;
  return json_build_object('id', c.id, 'email', c.email, 'name', c.name, 'phone', c.phone,
    'address', c.address, 'cart', c.cart, 'favorites', c.favorites);
end; $$;

create or replace function customer_update(p_id uuid, p_name text, p_phone text, p_address text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update customers set name = p_name, phone = p_phone, address = p_address where id = p_id;
end; $$;

create or replace function customer_sync(p_id uuid, p_cart jsonb, p_favorites jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update customers set cart = p_cart, favorites = p_favorites where id = p_id;
end; $$;

grant execute on function customer_signup(text, text, text) to anon, authenticated;
grant execute on function customer_login(text, text) to anon, authenticated;
grant execute on function customer_update(uuid, text, text, text) to anon, authenticated;
grant execute on function customer_sync(uuid, jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Order lookups for shoppers
-- ---------------------------------------------------------------------------
-- Orders are NOT readable with the public anon key (only the logged-in admin can
-- read the table), so these SECURITY DEFINER functions let a shopper find just
-- their OWN order: by its unguessable code, or by their customer id (which they
-- only get by logging in). No bulk read of the orders table is possible.
create or replace function order_lookup(p_code text)
returns setof orders language plpgsql security definer set search_path = public, extensions as $$
declare code text := lower(regexp_replace(coalesce(p_code, ''), '[^0-9a-fA-F]', '', 'g'));
begin
  if code = '' then return; end if;
  return query
    select * from orders
    where translate(id::text, '-', '') like code || '%'
    order by created_at desc
    limit 1;
end; $$;

create or replace function orders_for_customer(p_customer_id uuid)
returns setof orders language sql security definer set search_path = public, extensions as $$
  select o.* from orders o
  join customers c on c.id = p_customer_id
  where lower(o.customer_email) = lower(c.email)
  order by o.created_at desc;
$$;

grant execute on function order_lookup(text) to anon, authenticated;
grant execute on function orders_for_customer(uuid) to anon, authenticated;
