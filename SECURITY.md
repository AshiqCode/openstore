# Security — honest notes

OPEN STORE trades some security hardness for radical simplicity: **no server, no build step,
no login system to manage.** This is the right call for a small student/seller store, but you
should understand exactly what that means.

## What protects your store

- **Supabase Row Level Security (RLS)** is the real boundary. The SQL in `supabase/setup.sql`
  enables RLS on every table and defines exactly what the public anon key can do.
- **Public visitors can:** read products & settings, place (insert) orders, view images.
- **Public visitors cannot:** read other people's orders through the normal store.

## The honest trade-offs

1. **The anon key is public by design.** It ships inside `config.json` in your deployed folder.
   That's expected — it's called the *anon public* key for a reason. RLS, not secrecy, is what
   keeps data safe.

2. **Admin login = email + password, and only the owner can create it.** There is **no public
   sign-up**. The admin row is created by a SQL script that the app generates with your chosen
   email + password (bcrypt-hashed by Postgres). You run that script in the **Supabase SQL Editor** —
   and since running SQL requires Supabase project access, only the store owner can ever create an
   admin. The anon key can only `admin_login` / `admin_change_password` / `admin_exists`; it cannot
   create accounts. The Supabase keys only *connect* the app — they are not the login. A 30-day
   session flag is kept in the browser's `localStorage`.

   The remaining trade-off: table **writes still allow the anon role** (so the no-server admin panel
   can function). A determined person with your anon key could write to product/order/settings rows
   directly — but they **cannot** read admin password hashes, forge a login, or create an admin.

3. **Orders are readable with the anon key** (the admin panel lists them without a server). Don't
   collect data you wouldn't want a determined person to see. Customer name, phone, and address are
   stored — that's inherent to taking delivery orders.

4. **Guard your keys and password.** The anon key is public by design (it connects the store); never
   expose your **service_role** key. Use a strong admin password — there is no email-based reset.

## Recommendations

- Use a strong, unique admin password — there is no email-based recovery.
- Keep the generated setup SQL private (it contains your password) and don't save it in a public place.
- Never expose your Supabase **service_role** key anywhere in this app.
- Don't reuse your Supabase database password anywhere else.
- Keep your Supabase project's **service_role** key secret — it is *never* used by this app and
  must never be placed in `config.json`.
- If you handle sensitive data or real payment info, this project is **not** the right tool —
  use a hosted platform with server-side auth and PCI compliance.

## Reporting

Found a real vulnerability beyond these documented trade-offs? Open an issue (without exploit
details) or contact the maintainer privately.
