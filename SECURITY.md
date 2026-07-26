# Security — honest notes

The store runs almost entirely in the browser, talking straight to Supabase, and keeps your data
private by relying on **Supabase Auth + Row Level Security (RLS)** — the database itself enforces who
can do what. The one exception is `src/app/api/**`, the small server-side piece that card payments
require (a Stripe secret key can never be shipped to a browser).

## What protects your store

- **Row Level Security (RLS)** is the real boundary. The SQL in `supabase/setup.sql` enables RLS on
  every table and defines exactly what each role can do.
- **The public anon key can:** read products & settings, place (insert) orders, view images, and sign
  up / log in *customer* accounts. Nothing else.
- **The public anon key CANNOT:** read orders (customer names, phones, addresses), edit or delete
  products, change settings, or upload images. Those require a logged-in admin.
- **Admin = a real Supabase Auth user.** Logging in issues a JWT, and the write/read-orders policies
  are scoped `to authenticated`. So only the logged-in owner can manage the store or see orders.

## The API routes

There are five, and each is protected by what it actually needs:

| Route | Who may call it | How it's enforced |
|---|---|---|
| `POST /api/checkout` | anyone (shoppers aren't logged in) | Prices recomputed from the database; the order must exist and be unpaid; 12 requests/min per IP |
| `GET /api/checkout` | anyone | Returns only whether card payment is switched on |
| `POST /api/checkout/confirm` | anyone | The session is fetched from Stripe and its stored `order_id` must match; 20/min per IP |
| `POST /api/stripe/webhook` | Stripe only | Stripe signature verified against `STRIPE_WEBHOOK_SECRET` |
| `POST /api/team/invite`, `/api/team/remove` | the owner only | Bearer token verified with Supabase, role read server-side, and the SQL functions re-check with `assert_owner()` |

Two things worth being explicit about:

- **The two public payment routes cannot be made login-only** — a shopper checking out has no Supabase
  session. They are safe because they never trust a number from the browser: the browser sends product
  ids and quantities, and the server derives every price, and payment is only ever confirmed by asking
  Stripe.
- **Rate limiting is in-memory**, so on Vercel it is per serverless instance. It stops a simple loop
  against one endpoint; it is not a substitute for a WAF if you are being targeted.

Admin pages are also served with `X-Robots-Tag: noindex` and `Cache-Control: no-store`, and every
response carries `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, a strict
`Referrer-Policy` and a `Permissions-Policy` that denies camera/mic/geolocation/payment/USB.

There is deliberately **no Content-Security-Policy**: the store redirects to Stripe, loads product
images from arbitrary storage URLs and themes with inline styles, so a policy written without testing
against a real store would break working pages. Add one once you know your own image hosts.

## Who can reach the admin panel

Anyone can *load* `/admin` — it's a page, and the real boundary is the database, not the URL. Signing
in requires a Supabase Auth user, and access requires a **role** in the `staff` table:

- `owner` — everything, including the team
- `manager` — products, settings, orders, customers
- `staff` — orders only

A login with no role gets nothing: row-level security refuses it, and the panel says so instead of
showing empty screens. That matters because an abandoned invitation, or an account added by hand in
the Supabase dashboard, is a login that nobody deliberately granted access to.

## How the admin is created

There is **no public sign-up**. You create your single admin in the Supabase dashboard
(**Authentication → Users → Add user**). Since that requires Supabase project access, only the store
owner can ever create an admin. The Supabase keys only *connect* the app — they are not the login.

## The honest trade-offs

1. **The anon key is public by design.** It's inlined into the site's JavaScript (it's called the
   *anon public* key for a reason). That's expected and safe — **RLS, not secrecy, is what protects
   data.** With the policies above, a person holding your anon key still cannot read orders or edit
   your catalog.

2. **`service_role` must stay secret.** It bypasses RLS entirely. Only one place uses it — the Stripe
   webhook (`src/app/api/stripe/webhook/`), which needs it to mark an order paid because RLS lets
   nobody but the logged-in admin update orders. It is read from `SUPABASE_SERVICE_ROLE_KEY` on the
   server only. Never place it in `config.json`, in a `NEXT_PUBLIC_` variable, or anywhere the browser
   can reach. If you don't enable card payments, don't set it at all.

4. **Card payments never touch this app.** Card numbers are entered on Stripe's own hosted Checkout
   page, so no card data reaches your site, your database, or your logs. Two rules make the money side
   trustworthy:
   - Every price is recomputed server-side from your `products` table — the browser only ever sends
     product ids and quantities.
   - An order is marked **paid** only after the server itself confirms with Stripe. There are exactly
     two ways in: a signature-verified webhook, or the return-trip check, which retrieves the session
     from Stripe by id and requires both that Stripe reports it `paid` **and** that the session's
     stored `order_id` matches the order being updated. Visiting the success URL by hand proves
     nothing, and a genuine paid session id can't be replayed against a different order.

3. **Customer accounts** (shoppers) use a lightweight bcrypt table via `SECURITY DEFINER` functions,
   not Supabase Auth. Passwords are hashed; the functions never return the hash. This is honest,
   lightweight security appropriate for a small store — not a bank.

## Recommendations

- Use a strong, unique admin password. Reset it in **Authentication → Users** if needed.
- Keep the **service_role**, **Stripe secret** and **webhook signing** keys in Vercel environment
  variables only. They are server-side secrets; if one leaks, roll it immediately.
- Re-run `supabase/setup.sql` if you deployed an older version — it upgrades the old open policies to
  the locked-down set (it drops the previous `anon write` / `anon read orders` policies).
- Test card payments with Stripe's test keys (`sk_test_…`) and test cards before switching to live
  keys. Check that an order flips to **Paid** in Admin → Orders — if it doesn't, your webhook URL or
  signing secret is wrong.
- This project deliberately stores no card data of any kind; leave it that way. If you need to handle
  highly sensitive data beyond orders, that's outside this project's scope.

## Reporting

Found a real vulnerability beyond these documented trade-offs? Open an issue (without exploit
details) or contact the maintainer privately.
