# 🛍️ OPEN STORE — your online store in minutes

**OPEN STORE** is a free, open-source e-commerce store you can deploy without any coding — no
terminal, no config files to hand-edit. Built for students and small sellers. Orders come straight
to your WhatsApp, and everything is managed from a simple admin dashboard.

---

## 🚀 Deploy on Vercel

Two ways — pick one, both are free and both run on **Vercel**.

### Option A — One-click button (easiest)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAshiqCode%2Fopenstore&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Your%20Supabase%20Project%20URL%20and%20anon%20public%20key%20(Supabase%20%E2%86%92%20Project%20Settings%20%E2%86%92%20API)&envLink=https%3A%2F%2Fgithub.com%2FAshiqCode%2Fopenstore%2Fblob%2Fmain%2F.env.example)

1. **Click the button** → sign in to Vercel (free). To copy the project in, Vercel connects a free
   Git provider (**GitHub / GitLab / Bitbucket** — sign-up takes ~1 minute).
2. Vercel shows a **short form** for two values (from **Supabase → Project Settings → API**):
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Deploy** → open **`your-site.vercel.app/admin`** → click **Copy SQL** and run it once in
   Supabase. 🎉 The store is live for everyone.

> Maintainers: replace `AshiqCode/openstore` in the button link with **your** repo.

### Option B — No GitHub account (upload the folder to Vercel)

Don't want any Git account? Deploy the ready-made **`out`** folder straight to Vercel with one command —
Vercel signs you in by **email**, no Git needed.

1. Download [**`out.zip`**](../../raw/main/out.zip) and unzip it — you get an **`out`** folder.
2. Install **[Node.js](https://nodejs.org)** (free), then open a terminal in that folder and run:

   ```bash
   npx vercel deploy --prod out
   ```

   Follow the email sign-in link. Vercel uploads the folder and gives you a live `*.vercel.app` URL.
3. Open **`your-site.vercel.app/admin`** → the setup wizard links your Supabase project and gives you
   the SQL to run. On the last step, **download `config.json`**, put it in the `out` folder, and run
   the same command again so every visitor gets a working store.

> First need a database? Create a free project at [supabase.com](https://supabase.com) (~1 minute),
> then copy your **Project URL** and **anon public key** from Project Settings → API.

---

## 🚀 Deploy from GitHub with environment variables

If you connect a GitHub repo to Vercel manually, set **environment variables** so every visitor gets
a working store automatically (no `config.json` step):

1. **Import** this repo into Vercel: [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Open **Project → Settings → Environment Variables** and add:

   | Name | Value (from Supabase → Project Settings → API) |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL, e.g. `https://xxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your **anon public** key |

3. **Redeploy** (Deployments → ⋯ → Redeploy). Environment variables are baked in at build time, so a
   redeploy is required for them to take effect.
4. Open your site → go to **`/admin`** → run the setup SQL once (the "First time?" panel has a Copy
   button and a link to the Supabase SQL Editor) → log in with the same keys.

> **How config is found:** the app resolves Supabase config in this order — **environment variables →
> your browser's saved login → baked `config.json`**. Environment variables always win, so no visitor
> ever needs to type keys. The `anon` key is public by design; **never** use the `service_role` key.

---

## ❓ FAQ

**How do I set up my admin login?**
Open `your-site.com/admin` the first time. It asks for your **email + password**, then **generates
a SQL script** with your login baked in. You paste that into your **Supabase → SQL Editor** and run
it once. Because only someone with Supabase access can run SQL, **only you (the owner) can ever
create the admin** — there is no public sign-up. After that, `/admin` just shows a login form.

**How do I log in after that?**
Enter your email + password on `your-site.com/admin`. Works from any device, as long as the store
is connected (env vars or `config.json`). The Supabase keys only connect the store — they aren't
your login.

**I forgot my admin password.**
There's no email reset. Change it while logged in (Admin → Password), or reset it in Supabase's SQL
Editor: `select admin_change_password('you@example.com','oldpass','newpass');`, or delete your row
from the `admins` table and run the setup SQL again with a new password.

**Can I add products from my phone?**
Yes — the whole admin panel is mobile-first. Just open `your-site.com/admin`.

**The store looks empty / "config missing"?**
That means the keys aren't available to visitors yet. Use the one-click deploy button (recommended),
set the two environment variables in Vercel, or download `config.json` from **Admin → Config** and
re-upload your folder.

**How do I update to a new version?**
Re-deploy the latest code. Your data stays safe in Supabase, and your keys stay in your Vercel
environment variables (or `config.json`).

**Is this really free?**
Yes. Vercel offers free hosting, and Supabase offers a free database + image storage. MIT licensed.

---

## 🎨 Features

- **10 built-in themes** — re-skin the whole store with one click
- **Products** — add / edit / delete / hide / reorder, image upload with auto-compression,
  **discounts**, **featured** products, low-stock and "new" badges
- **Categories** — managed from Settings, shown as store filters
- **Cart & checkout** — order saved to Supabase, WhatsApp message pre-filled for the seller
- **Customer accounts** — shoppers sign up / log in; cart, favorites and profile are stored in the
  database, so they survive a cleared browser
- **Order tracking & history** — customers track any order and see their full history; a WhatsApp
  "track" button on pending/confirmed orders
- **Favorites / wishlist**, product **search & sort**, related products
- **Orders admin** — status updates, tap-to-call, per-order WhatsApp
- **Seller profile & branding** — store name, logo, tagline, about, social links, free-delivery
  threshold, store open/closed toggle
- **Multi-language** — English (default), Roman Urdu, Urdu
- **No server needed** — fully static, admin login via your Supabase keys

---

## 🛠️ For developers (optional)

```bash
npm install
npm run dev      # local dev at http://localhost:3000
npm run build    # static export to ./out
```

Everything runs client-side against Supabase. Static export (`output: 'export'`) — no API routes,
no server. See [`SECURITY.md`](SECURITY.md) for the honest security trade-offs.

---

## ⚠️ Disclaimer

This is free, open-source software provided **as is**, with no warranty. Each store is owned and
operated solely by the person who deploys it. The author is **not responsible** for any store, its
content, prices, orders, payments, customer data, or any misuse. Use at your own risk.

---

## 📄 License

MIT — free to use, modify, and sell. Credit is appreciated but not required.

Built with ❤️ using [Next.js](https://nextjs.org) + [Supabase](https://supabase.com).
