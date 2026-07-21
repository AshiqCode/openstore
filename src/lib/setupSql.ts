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

-- Admin account (store owner) — email + bcrypt password login.
-- NOTE: there is NO public "sign up". The admin row is created by the owner's
-- generated SQL (see the app's setup screen), so only someone who can run SQL
-- in Supabase can create an admin. anon can only LOG IN, not create accounts.
create extension if not exists pgcrypto;

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

alter table admins enable row level security;

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

// Escape a value for a single-quoted Postgres string literal.
function sqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

// Build the FULL setup SQL with the owner's admin account baked in. The owner
// pastes this into the Supabase SQL Editor — since only someone with SQL access
// can run it, this is what guarantees only the owner can create the admin.
// The password is hashed by Postgres (bcrypt) when the script runs.
export function buildAdminSetupSql(email: string, password: string): string {
  const e = sqlLiteral(email.trim().toLowerCase());
  const p = sqlLiteral(password);
  return `${SETUP_SQL}
-- ── Create your admin login (this row is what lets you log in) ─────────────
set search_path = public, extensions;
insert into admins (email, password_hash)
values ('${e}', crypt('${p}', gen_salt('bf')))
on conflict (email) do update set password_hash = excluded.password_hash;
`;
}

