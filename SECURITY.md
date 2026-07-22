# Security — honest notes

OPEN STORE runs with **no server and no build step**, yet still keeps your data private by relying on
**Supabase Auth + Row Level Security (RLS)** — the database itself enforces who can do what.

## What protects your store

- **Row Level Security (RLS)** is the real boundary. The SQL in `supabase/setup.sql` enables RLS on
  every table and defines exactly what each role can do.
- **The public anon key can:** read products & settings, place (insert) orders, view images, and sign
  up / log in *customer* accounts. Nothing else.
- **The public anon key CANNOT:** read orders (customer names, phones, addresses), edit or delete
  products, change settings, or upload images. Those require a logged-in admin.
- **Admin = a real Supabase Auth user.** Logging in issues a JWT, and the write/read-orders policies
  are scoped `to authenticated`. So only the logged-in owner can manage the store or see orders.

## How the admin is created

There is **no public sign-up**. You create your single admin in the Supabase dashboard
(**Authentication → Users → Add user**). Since that requires Supabase project access, only the store
owner can ever create an admin. The Supabase keys only *connect* the app — they are not the login.

## The honest trade-offs

1. **The anon key is public by design.** It's inlined into the site's JavaScript (it's called the
   *anon public* key for a reason). That's expected and safe — **RLS, not secrecy, is what protects
   data.** With the policies above, a person holding your anon key still cannot read orders or edit
   your catalog.

2. **`service_role` must stay secret.** It bypasses RLS entirely. This app never uses it — never place
   it in `config.json`, env vars read by the browser, or anywhere client-side.

3. **Customer accounts** (shoppers) use a lightweight bcrypt table via `SECURITY DEFINER` functions,
   not Supabase Auth. Passwords are hashed; the functions never return the hash. This is honest,
   lightweight security appropriate for a small store — not a bank.

## Recommendations

- Use a strong, unique admin password. Reset it in **Authentication → Users** if needed.
- Never expose your Supabase **service_role** key anywhere in this app.
- Re-run `supabase/setup.sql` if you deployed an older version — it upgrades the old open policies to
  the locked-down set (it drops the previous `anon write` / `anon read orders` policies).
- If you handle real payment info or highly sensitive data, use a hosted platform with server-side
  auth and PCI compliance — that's outside this project's scope.

## Reporting

Found a real vulnerability beyond these documented trade-offs? Open an issue (without exploit
details) or contact the maintainer privately.
