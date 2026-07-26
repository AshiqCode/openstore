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

-- Card payments (Stripe). 'cod' orders are paid in cash on delivery, so they
-- stay 'unpaid' until the seller collects; 'card' orders are flipped to 'paid'
-- by the Stripe webhook once the money actually clears.
alter table orders add column if not exists payment_method text default 'cod';
alter table orders add column if not exists payment_status text default 'unpaid';
alter table orders add column if not exists stripe_session_id text default '';

insert into settings (key, value) values
  ('store_name', 'OPEN STORE'),
  ('theme', 'clean'),
  ('whatsapp_number', ''),
  ('currency', 'Rs.'),
  ('currency_code', 'pkr'),
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

-- ---------------------------------------------------------------------------
-- Customer management — ADMIN ONLY
-- ---------------------------------------------------------------------------
-- The customers table has no RLS policy at all, so it cannot be read with the
-- public anon key. These two SECURITY DEFINER functions are granted only to the
-- `authenticated` role, and because shoppers log in against the bcrypt
-- customers table rather than Supabase Auth, `authenticated` means the store
-- admin and nobody else.

-- Both functions check the caller's role THEMSELVES, not just via GRANTs.
-- Supabase's default privileges automatically grant EXECUTE on every new
-- function in `public` to anon, so revoking is easy to get wrong — this guard
-- means a mistake there still can't leak customer data.
create or replace function assert_admin() returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if coalesce(
       nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role',
       ''
     ) not in ('authenticated', 'service_role')
  then
    raise exception 'admin only';
  end if;
end; $$;

create or replace function customers_admin_list()
returns table (
  id uuid,
  email text,
  name text,
  phone text,
  address text,
  created_at timestamptz,
  orders_total bigint,
  orders_active bigint,
  orders_delivered bigint
)
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform assert_admin();
  -- Customer contact details are personal data: owner/manager only, not 'staff'.
  if not staff_can_manage_store() then raise exception 'not allowed'; end if;
  return query
    select
      c.id, c.email, c.name, c.phone, c.address, c.created_at,
      count(o.id),
      count(o.id) filter (where o.status in ('pending', 'confirmed')),
      count(o.id) filter (where o.status = 'delivered')
    from customers c
    left join orders o on lower(o.customer_email) = lower(c.email)
    group by c.id, c.email, c.name, c.phone, c.address, c.created_at
    order by c.created_at desc;
end; $$;

-- Deletes a shopper account, but ONLY when none of their orders is still in
-- flight. Enforced here in the database, so it holds even if the check is
-- bypassed in the browser. Delivered and cancelled orders do not block it —
-- those are finished, and the orders themselves are kept either way.
create or replace function customer_admin_delete(p_id uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  c customers;
  active_count int;
begin
  perform assert_admin();
  if not staff_can_manage_store() then raise exception 'not allowed'; end if;

  select * into c from customers where id = p_id;
  if c.id is null then return 'not_found'; end if;

  select count(*) into active_count
    from orders
   where lower(customer_email) = lower(c.email)
     and status in ('pending', 'confirmed');

  if active_count > 0 then return 'has_active_orders'; end if;

  delete from customers where id = p_id;
  return 'ok';
end; $$;

-- Supabase grants EXECUTE to anon by default on new public functions, so the
-- anon role must be revoked EXPLICITLY — revoking from PUBLIC alone leaves that
-- direct grant in place and the functions stay callable by any visitor.
revoke execute on function assert_admin() from public, anon;
revoke execute on function customers_admin_list() from public, anon;
revoke execute on function customer_admin_delete(uuid) from public, anon;
grant execute on function customers_admin_list() to authenticated;
grant execute on function customer_admin_delete(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Team — staff accounts with roles
-- ---------------------------------------------------------------------------
-- Everyone on the team is a real Supabase Auth user (that is what RLS keys off).
-- This table adds the ROLE on top:
--   owner    — everything, including inviting and removing people
--   manager  — products, settings, orders, customers; cannot manage the team
--   staff    — orders only; cannot change the catalogue, settings or the team
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text default '',
  role text not null default 'staff',
  status text not null default 'invited', -- 'invited' until they set a password
  invited_by text default '',
  created_at timestamptz default now()
);

alter table staff enable row level security;

-- Any signed-in team member may READ the team list (the admin UI shows it).
-- Writes only happen through the SECURITY DEFINER functions below, so no
-- insert/update/delete policy is granted to anyone.
drop policy if exists "auth read staff" on staff;
create policy "auth read staff" on staff for select to authenticated using (true);

-- Seed the team from the logins that already exist, the first time this table is
-- created. Whoever could already sign in before the team feature existed IS the
-- owner, so they must be recorded explicitly.
--
-- Only CONFIRMED logins are seeded, and only while the table is still empty.
-- That deliberately excludes half-finished invitations (created but never
-- accepted) — otherwise a stale invite would be promoted to owner.
insert into staff (email, role, status)
select lower(u.email), 'owner', 'active'
  from auth.users u
 where u.email is not null
   and u.email_confirmed_at is not null
   and not exists (select 1 from staff)
on conflict (email) do nothing;

-- The signed-in user's role, or NULL if they are not on the team.
--
-- NULL means no access. Membership is never inferred from the absence of a row:
-- an Auth user with no staff row (a leftover invite, or an account created
-- directly in the Supabase dashboard) gets nothing until an owner gives them a
-- role. The seed above is what preserves the original owner's access.
create or replace function staff_role() returns text
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  claims json;
  jwt_role text;
  jwt_email text;
  found_role text;
begin
  claims := nullif(current_setting('request.jwt.claims', true), '')::json;
  jwt_role := coalesce(claims ->> 'role', '');

  -- The service role key is server-side only and already bypasses RLS.
  if jwt_role = 'service_role' then return 'owner'; end if;
  if jwt_role <> 'authenticated' then return null; end if;

  jwt_email := lower(coalesce(claims ->> 'email', ''));
  select s.role into found_role from staff s where lower(s.email) = jwt_email;
  return found_role;
end; $$;

-- On the team at all, in any role.
create or replace function staff_is_member() returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select staff_role() is not null;
$$;

-- May change the catalogue and store settings.
create or replace function staff_can_manage_store() returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select staff_role() in ('owner', 'manager');
$$;

create or replace function assert_owner() returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if staff_role() <> 'owner' then
    raise exception 'only the owner can manage the team';
  end if;
end; $$;

-- Products and settings: owner/manager only. Orders stay open to every role,
-- since handling orders is the whole point of a 'staff' account.
drop policy if exists "auth write products" on products;
drop policy if exists "role write products" on products;
create policy "role write products" on products for all to authenticated
  using (staff_can_manage_store()) with check (staff_can_manage_store());

drop policy if exists "auth write settings" on settings;
drop policy if exists "role write settings" on settings;
create policy "role write settings" on settings for all to authenticated
  using (staff_can_manage_store()) with check (staff_can_manage_store());

-- Orders: every role handles orders — but a login that is NOT on the team gets
-- nothing, so a leftover invitation can never read customer orders.
drop policy if exists "auth read orders" on orders;
drop policy if exists "role read orders" on orders;
create policy "role read orders" on orders for select to authenticated
  using (staff_is_member());

drop policy if exists "auth update orders" on orders;
drop policy if exists "role update orders" on orders;
create policy "role update orders" on orders for update to authenticated
  using (staff_is_member()) with check (staff_is_member());

-- Team management functions. Creating and deleting the Auth user itself needs
-- the Admin API, so that part runs in /api/team/* with the service role key;
-- these keep the roles table in step.
create or replace function staff_upsert(p_email text, p_role text, p_status text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare inviter text;
begin
  perform assert_owner();
  if p_role not in ('owner', 'manager', 'staff') then return 'bad_role'; end if;
  if p_email is null or position('@' in p_email) = 0 then return 'invalid_email'; end if;

  inviter := lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''));

  insert into staff (email, role, status, invited_by)
  values (lower(p_email), p_role, coalesce(p_status, 'invited'), inviter)
  on conflict (email) do update
    set role = excluded.role,
        status = case when staff.status = 'active' then 'active' else excluded.status end;
  return 'ok';
end; $$;

create or replace function staff_remove(p_email text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare me text;
begin
  perform assert_owner();
  me := lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''));
  -- Removing yourself would lock you out of your own store.
  if lower(p_email) = me then return 'cannot_remove_self'; end if;
  delete from staff where lower(email) = lower(p_email);
  return 'ok';
end; $$;

-- Marks an invited member active once they've set their password.
create or replace function staff_activate_self()
returns text language plpgsql security definer set search_path = public, extensions as $$
declare me text;
begin
  me := lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'email', ''));
  if me = '' then return 'not_signed_in'; end if;
  update staff set status = 'active' where lower(email) = me;
  return 'ok';
end; $$;

revoke execute on function staff_role() from public, anon;
revoke execute on function staff_is_member() from public, anon;
revoke execute on function staff_can_manage_store() from public, anon;
revoke execute on function assert_owner() from public, anon;
revoke execute on function staff_upsert(text, text, text) from public, anon;
revoke execute on function staff_remove(text) from public, anon;
revoke execute on function staff_activate_self() from public, anon;
grant execute on function staff_role() to authenticated;
grant execute on function staff_is_member() to authenticated;
grant execute on function staff_can_manage_store() to authenticated;
grant execute on function staff_upsert(text, text, text) to authenticated;
grant execute on function staff_remove(text) to authenticated;
grant execute on function staff_activate_self() to authenticated;
