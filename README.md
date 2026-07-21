# 🛍️ DukaanKit — apna online store, 10 minute mein

**DukaanKit** ek free, open-source online store hai jo aap bina coding ke, bina terminal ke,
sirf drag-and-drop se launch kar sakte hain. Students aur chhote sellers ke liye banaya gaya —
orders seedha WhatsApp par aate hain.

> **DukaanKit** is a free, open-source e-commerce store you can deploy by drag-and-drop — no
> terminal, no Git, no coding. Built for students and small sellers. Orders come straight to
> your WhatsApp.

---

## 🟢 Easiest way — one-click deploy (no settings, no coding)

> Replace `AshiqCode/openstore` in the button below with **your** GitHub repo, then anyone can
> click it to get their own store.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAshiqCode%2Fopenstore&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Your%20Supabase%20Project%20URL%20and%20anon%20public%20key%20(Supabase%20%E2%86%92%20Project%20Settings%20%E2%86%92%20API)&envLink=https%3A%2F%2Fgithub.com%2FAshiqCode%2Fopenstore%2Fblob%2Fmain%2F.env.example)

**What the person does — 3 simple steps:**

1. **Click the button** → sign in to Vercel (free). It copies the store into their account.
2. Vercel shows a **short form** asking for two things. They paste them from
   **Supabase → Project Settings → API**:
   - **Project URL**  → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   > First need a database? Create a free project at [supabase.com](https://supabase.com) (takes ~1 min).
3. Click **Deploy**. When it's live, open **`your-site.vercel.app/admin`**, click **Copy SQL** and
   run it once in Supabase. 🎉 The store is now live for everyone — no config files, no env-var menus.

That's it. All store settings (name, logo, products, prices, categories, discounts…) are managed
from the **/admin** dashboard afterward — no coding ever again.

---

## ⚡ Or deploy by drag-and-drop (no GitHub)

1. **Download** the latest release ZIP from the [Releases page](../../releases) and unzip it.
2. Go to **[vercel.com/new](https://vercel.com/new)** and sign in (free).
3. Click **Add New → Project**, then **drag the `out` folder** into the upload area.
4. Vercel deploys it and gives you a link. Open it.
5. It redirects you to the setup wizard.
6. Follow the wizard — it links your free Supabase account and runs the setup SQL. You log in with
   your **Supabase Project URL + anon key** (no separate password to remember).
7. On the last step, **download `config.json`**, replace the empty one in your folder, and drag
   the folder to Vercel one more time. Ab har visitor ke liye store ready hai! 🎉

> _Screenshot placeholders — replace with real screenshots for your community:_
> `[ vercel drag-drop ]` · `[ wizard step 4: keys ]` · `[ wizard step 5: run SQL ]` · `[ done ]`

---

## 🚀 Deploy from GitHub to Vercel (recommended)

If you deploy from a GitHub repo instead of drag-and-drop, use **environment variables** — then
every visitor gets a working store automatically, with no `config.json` step.

1. **Fork / import** this repo into Vercel: [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
2. Before (or after) the first deploy, open **Project → Settings → Environment Variables** and add:

   | Name | Value (from Supabase → Project Settings → API) |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL, e.g. `https://xxxx.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your **anon public** key |

3. **Redeploy** (Deployments → ⋯ → Redeploy). Env vars are baked in at build time, so a redeploy
   is required for them to take effect.
4. Open your site → go to **`/admin`** → run the setup SQL once (the "First time?" panel gives you
   a Copy button + a link to the Supabase SQL Editor) → log in with the same keys.

> **How config is found:** the app resolves Supabase config in this order — **env vars →
> your browser's saved login → baked `config.json`**. So env vars always win, and no visitor ever
> needs to type keys. The `anon` key is public by design; **never** use the `service_role` key.
>
> Prefer not to use env vars? The drag-and-drop flow above (with the downloaded `config.json`)
> still works exactly the same.

---

## ❓ FAQ

**Q: Admin mein login kaise karun?**
`yoursite.com/admin` kholein → apna Supabase **Project URL + anon key** paste karein → **Login**.
Ye keys hi aapki admin login hain — koi alag password nahi.

**Q: Kisi aur device se login?**
Wohi keys kisi bhi browser mein daal kar login kar sakte hain. Keys Supabase → Project Settings →
API se milti hain.

**Q: Phone se products add kar sakta hun?**
Haan — admin panel poora mobile-first hai. `yoursite.com/admin` kholein.

**Q: "Config missing" ya store khaali dikh raha hai?**
Iska matlab `config.json` file update nahi hui. Admin → **Config** → **Download config.json**,
purani file replace karein, aur folder dobara Vercel par drag karein.

**Q: Naya version kaise update karun?**
Naya release ZIP download karein, apni `config.json` (jisme keys hain) usme copy karein, phir
`out` folder dobara Vercel par drag karein. Aapka data Supabase mein safe rehta hai.

**Q: Kya ye sach mein free hai?**
Haan. Vercel free hosting deta hai, Supabase free database + image storage. MIT license.

---

## 🎨 Features

- 10 built-in themes — ek click mein poora store re-skin
- Products: add / edit / delete / hide / reorder, image upload with auto-compression
- Cart + checkout → order Supabase mein save + WhatsApp par pre-filled message
- Orders admin: status update, tap-to-call, per-order WhatsApp
- Settings: store name, logo, banner, delivery charges, currency, about, Instagram
- Password-protected admin, no server needed

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

## 📄 License

MIT — free to use, modify, and sell. Credits appreciated but not required.

Built with ❤️ using [Next.js](https://nextjs.org) + [Supabase](https://supabase.com).
