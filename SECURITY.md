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

2. **Admin login = your Supabase keys.** You log into `/admin` by entering your Supabase Project
   URL + anon public key. If they connect to a set-up store, you're in; a flag is stored in the
   browser's `localStorage` for 30 days. No emails, no accounts table.

   ⚠️ **Understand this trade-off clearly:** the anon key is **public** — it ships inside
   `config.json` so the storefront can load products. That means anyone who opens
   `yoursite.com/config.json` can read the key and, in principle, use it to log into your admin
   panel. Admin access here is *convenience gating*, not a hard security boundary. This is an
   intentional choice for a tiny, low-stakes store run by one person.

   If you need a real boundary later, options are: (a) don't bake keys into `config.json` and share
   the store link only privately, or (b) move to Supabase Auth with RLS write policies limited to
   `authenticated`. Both are bigger changes and out of scope for this lightweight build.

3. **Orders are readable with the anon key** (the admin panel needs to list them without a login
   system). Don't collect data you wouldn't want a determined person to see. Customer name, phone,
   and address are stored — that's inherent to taking delivery orders.

4. **Guard your Supabase keys.** Since keys are the login, treat your Project URL + anon key like a
   password for admin purposes. Never share your **service_role** key or put it in `config.json`.

## Recommendations

- Keep your anon key private if you can (see point 2) — anyone with it can reach the admin panel.
- Never expose your Supabase **service_role** key anywhere in this app.
- Don't reuse your Supabase database password anywhere else.
- Keep your Supabase project's **service_role** key secret — it is *never* used by this app and
  must never be placed in `config.json`.
- If you handle sensitive data or real payment info, this project is **not** the right tool —
  use a hosted platform with server-side auth and PCI compliance.

## Reporting

Found a real vulnerability beyond these documented trade-offs? Open an issue (without exploit
details) or contact the maintainer privately.
