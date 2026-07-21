# 🛍️ OPEN STORE — your online store in minutes

**OPEN STORE** is a free, open-source e-commerce store you can deploy without any coding — no
terminal, no config files to hand-edit. Built for students and small sellers. Orders come straight
to your WhatsApp, and everything is managed from a simple admin dashboard.

---

## 🟢 Easiest way — one-click deploy (no settings, no coding)

> Replace `AshiqCode/openstore` in the button below with **your** GitHub repo, then anyone can
> click it to get their own store.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAshiqCode%2Fopenstore&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Your%20Supabase%20Project%20URL%20and%20anon%20public%20key%20(Supabase%20%E2%86%92%20Project%20Settings%20%E2%86%92%20API)&envLink=https%3A%2F%2Fgithub.com%2FAshiqCode%2Fopenstore%2Fblob%2Fmain%2F.env.example)

**Three simple steps:**

1. **Click the button** → sign in to Vercel (free). It copies the store into your account.
2. Vercel shows a **short form** asking for two things. Paste them from
   **Supabase → Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   > Don't have a database yet? Create a free project at [supabase.com](https://supabase.com) (takes ~1 minute).
3. Click **Deploy**. When it's live, open **`your-site.vercel.app/admin`**, click **Copy SQL** and
   run it once in Supabase. 🎉 Your store is now live for everyone — no config files, no env-var menus.

That's it. All store settings (name, logo, products, prices, categories, discounts…) are managed
from the **/admin** dashboard afterward — no coding ever again.

---

## ⚡ Or deploy by drag-and-drop (no GitHub)

1. **Download** the latest release ZIP from the [Releases page](../../releases) and unzip it.
2. Go to **[vercel.com/new](https://vercel.com/new)** and sign in (free).
3. Click **Add New → Project**, then **drag the `out` folder** into the upload area.
4. Vercel deploys it and gives you a link. Open it.
5. It takes you to the setup wizard, which links your free Supabase account and runs the setup SQL.
   You log in with your **Supabase Project URL + anon key** (no separate password to remember).
6. On the last step, **download `config.json`**, replace the empty one in your folder, and drag the
   folder to Vercel one more time. Now the store works for every visitor. 🎉

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

**How do I log in to the admin panel?**
Open `your-site.com/admin` → paste your Supabase **Project URL + anon key** → **Login**. Those keys
are your admin login — there is no separate password.

**Can I log in from another device?**
Yes. Enter the same keys in any browser. You'll find them in Supabase → Project Settings → API.

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
no server. See [`CLAUDE.md`](CLAUDE.md) for architecture and [`SECURITY.md`](SECURITY.md) for the
honest security trade-offs.

---

## ⚠️ Disclaimer

This is free, open-source software provided **as is**, with no warranty. Each store is owned and
operated solely by the person who deploys it. The author is **not responsible** for any store, its
content, prices, orders, payments, customer data, or any misuse. Use at your own risk.

---

## 📄 License

MIT — free to use, modify, and sell. Credit is appreciated but not required.

Built with ❤️ using [Next.js](https://nextjs.org) + [Supabase](https://supabase.com).
