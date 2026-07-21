// The setup SQL shown (with a COPY button) in the wizard and /admin/config.
// Kept in sync with supabase/setup.sql — this is the copy the app displays.
export const SETUP_SQL = `-- OPEN STORE — run this in Supabase → SQL Editor → New query → Run
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
alter table orders add column if not exists customer_email text default '';

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

insert into settings (key, value) values
  ('store_name', 'OPEN STORE'),
  ('admin_email', ''),
  ('admin_password_hash', 'c7e616822f366fb1b5e0756af498cc11d2c0862edcb32ca65882f622ff39de1b'),
  ('theme', 'clean'),
  ('whatsapp_number', ''),
  ('currency', 'Rs.'),
  ('banner_text', ''),
  ('logo_url', ''),
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

alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;

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

create policy "public read products" on products for select using (true);
create policy "public read settings" on settings for select using (true);
create policy "public insert orders" on orders for insert with check (true);
create policy "anon write products" on products for all using (true) with check (true);
create policy "anon write settings" on settings for all using (true) with check (true);
create policy "anon read orders" on orders for select using (true);
create policy "anon update orders" on orders for update using (true);
create policy "public read images" on storage.objects for select using (bucket_id = 'store-images');
create policy "anon upload images" on storage.objects for insert with check (bucket_id = 'store-images');

-- Customer accounts (shoppers) — DB-backed profile, cart and favorites.
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
`;
