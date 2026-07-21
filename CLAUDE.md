# CLAUDE.md — Open Source Student Store Builder ("DukaanKit")

## What we are building

A free, open-source, self-hostable e-commerce store builder for students and small sellers in Pakistan. Anyone can take this project, deploy it to Vercel by **drag-and-drop** (no terminal, no Git, no coding), and get their own online store with a built-in admin panel.

**Core promise: ZERO manual code editing.** Everything is configured through the admin panel after deployment. Default admin password is `666`; the app forces a change after first login.

---

## Tech Stack

- **Next.js 14+** with `output: 'export'` (STATIC EXPORT — critical, see Architecture)
- **Tailwind CSS** for styling
- **Supabase** (free tier) — database, image storage
- **No backend server** — everything runs client-side against Supabase
- Minimal dependencies. No heavy component libraries.

---

## Architecture (READ THIS FIRST)

### Why static export
The user deploys by dragging a folder into Vercel's dashboard (vercel.com/new → drag & drop). This only works with static files. Therefore:

- `next.config.js` MUST have `output: 'export'` and `images: { unoptimized: true }`
- No API routes, no server-only features, no middleware
- All dynamic behavior (products, settings, orders, admin) happens client-side via the Supabase JS client
- Build output goes to `/out` — README tells users to drag the `out` folder to Vercel
- Maintainers ship a pre-built `out/` folder in every GitHub Release so users never run `npm build`

### Config bootstrap (how the app finds Supabase)
The app needs Supabase URL + anon key. Resolution order:

1. `public/config.json` — `{ "supabaseUrl": "", "supabaseAnonKey": "" }` (empty by default)
2. `localStorage` key `store_config` (set by the setup wizard)

**Flow:**
- If neither exists → every route redirects to `/admin` setup wizard
- Admin enters keys in the wizard → saved to `localStorage` → wizard tests connection
- Final wizard step shows a **"Download config.json"** button that generates the filled file, with clear instructions: replace `config.json` in the folder and drag it to Vercel again. Until then the store works on the owner's own browser; visitors need the re-upload. Make this step extremely clear, Urdu + English, with screenshot placeholders.
- The anon key is public by design; real protection is Supabase Row Level Security.

### Admin password system (NO Supabase Auth — keep it simple)
- Default admin password: **`666`**
- Stored as SHA-256 hash in the `settings` table under key `admin_password_hash`
- Before Supabase is connected, the wizard accepts `666` hard-coded so the owner can start setup (and random visitors cannot)
- The SQL seed inserts the hash of `666` as default — compute the real hash, no placeholder
- Admin login: hash entered password client-side, compare with stored hash
- **First login with `666` after setup shows a non-dismissible banner: "Change your password now"** with a change form
- Session: flag + timestamp in `sessionStorage`, expires after 24h
- Honest, lightweight security for a small store. Do NOT add JWT/OAuth complexity.

---

## Supabase Schema (put this in `supabase/setup.sql`)

The wizard shows this SQL with a big COPY button and a link to the Supabase SQL Editor.

```sql
create table products (
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

create table settings (
  key text primary key,
  value text
);

create table orders (
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
  ('store_name', 'My Store'),
  ('admin_password_hash', '<compute SHA-256 of 666 and hardcode it here>'),
  ('theme', 'clean'),
  ('whatsapp_number', ''),
  ('currency', 'Rs.'),
  ('banner_text', ''),
  ('logo_url', ''),
  ('delivery_charges', '0'),
  ('about_text', ''),
  ('instagram_link', ''),
  ('setup_complete', 'true');

insert into storage.buckets (id, name, public) values ('store-images', 'store-images', true);

alter table products enable row level security;
alter table settings enable row level security;
alter table orders enable row level security;

-- Public can read products & settings (the store must display them)
create policy "public read products" on products for select using (true);
create policy "public read settings" on settings for select using (true);

-- Public can place orders but not read them
create policy "public insert orders" on orders for insert with check (true);

-- Writes via anon key (admin panel gates via password).
-- Document this trade-off honestly in SECURITY.md.
create policy "anon write products" on products for all using (true) with check (true);
create policy "anon update settings" on settings for update using (true);
create policy "anon read orders" on orders for select using (true);
create policy "anon update orders" on orders for update using (true);

create policy "public read images" on storage.objects for select using (bucket_id = 'store-images');
create policy "anon upload images" on storage.objects for insert with check (bucket_id = 'store-images');
```

---

## Pages & Routes

### Public store
| Route | Purpose |
|---|---|
| `/` | Homepage: banner, featured products, category chips, product grid |
| `/product?id=` | Product detail (query-param pattern because of static export) |
| `/cart` | Cart (localStorage), quantities, total + delivery charges |
| `/checkout` | Name/phone/address form → saves order to Supabase → opens WhatsApp with pre-filled message |
| `/about` | About text + Instagram link from settings |

### Admin (all under `/admin`, password-gated)
| Route | Purpose |
|---|---|
| `/admin` | Login OR Setup Wizard (if not configured) |
| `/admin/dashboard` | Stats: products count, pending orders, today's orders |
| `/admin/products` | Add / edit / delete / toggle active / drag-reorder |
| `/admin/orders` | Orders list, status dropdown, per-order WhatsApp button |
| `/admin/settings` | Store name, logo upload, WhatsApp number, banner, delivery charges, about, currency, Instagram |
| `/admin/theme` | Gallery of 10 themes, click to apply instantly |
| `/admin/password` | Change admin password |
| `/admin/config` | Connection status, "Download config.json", SQL re-run instructions |

---

## Setup Wizard (the heart of the project)

Runs at `/admin` when no config exists. One screen per step, progress dots, Urdu + English labels:

1. **Welcome** — "Apka store 5 minute mein ready ho jaye ga" + what you need (a free Supabase account)
2. **Default password** — enter `666` (documented in README) so strangers can't run setup on a fresh deploy
3. **Create Supabase project** — button opening supabase.com + numbered steps with screenshot placeholders
4. **Paste keys** — inputs for Project URL and anon key + exact path (Settings → API) + **Test Connection** button with human-readable success/error
5. **Run SQL** — shows `setup.sql`, COPY button, deep link `https://supabase.com/dashboard/project/_/sql`, **Verify Tables** button (queries `settings`; success = proceed)
6. **Store basics** — store name, WhatsApp number (92-format helper), pick a theme from mini-gallery
7. **Done** — confetti, dashboard link, and the **Download config.json** step explained (with "do it later" option)

Wizard state persists in localStorage so refresh doesn't lose progress.

---

## The 10 Default Themes

Themes are pure CSS-variable presets in one `themes.ts` file: colors (primary, bg, card, text), font pairing, border radius, button style. Applied via `<html data-theme="...">`. Switching is instant — no rebuild.

| # | Name | Vibe |
|---|---|---|
| 1 | `clean` | White, minimal, sharp — default |
| 2 | `rose` | Soft pink, rounded — boutique |
| 3 | `midnight` | Dark bg, neon accent — streetwear/tech |
| 4 | `desi` | Warm orange/green, festive — food/ethnic wear |
| 5 | `luxe` | Black + gold, serif headings — premium |
| 6 | `mint` | Fresh green/white — organic, skincare |
| 7 | `ocean` | Blue/teal, calm — general retail |
| 8 | `sunset` | Coral/amber accents — youth brands |
| 9 | `mono` | Grayscale, bold typography — art/prints |
| 10 | `eid` | Emerald + cream, subtle pattern header — seasonal |

Admin gallery renders a live mini mock-card per theme using its colors (no image assets).

---

## Key Features Detail

### Products (admin)
- Fields: name, price, description, category (free text + suggestions), stock, image
- **Image upload** → Supabase Storage `store-images` → save public URL; allow external URL paste as fallback
- Client-side compression before upload (canvas, max 1200px, ~80% JPEG) to protect free-tier storage
- Drag-to-reorder writes `sort_order`; `is_active` toggle hides without deleting

### Cart & Checkout
- Cart in localStorage: `[{id, name, price, qty}]`
- Checkout saves order to Supabase, THEN opens `https://wa.me/<number>?text=<urlencoded summary>`
- Order message format:
  ```
  *New Order — <store_name>*
  <name x qty = subtotal, one per line>
  Delivery: Rs. <delivery_charges>
  *Total: Rs. <total>*
  Name / Phone / Address
  Order ID: <first 8 chars>
  ```
- If no WhatsApp number set, still save the order and show "Order received"

### Orders (admin)
- Table: date, customer, phone (tap-to-call), items, total, status dropdown (pending → confirmed → delivered → cancelled)
- Filter tabs: All / Pending / Confirmed / Delivered
- "Message on WhatsApp" per order

### Settings (admin)
Every settings key gets a form field. Logo upload uses the storage bucket. Saving shows a toast; the public store reflects changes on next load (no rebuild).

---

## File Structure

```
/
├── CLAUDE.md
├── README.md              ← user-facing, Urdu + English
├── SECURITY.md            ← honest notes on trade-offs
├── supabase/setup.sql
├── public/config.json     ← empty by default
├── src/
│   ├── app/               ← all routes above
│   ├── components/        ← ProductCard, Navbar, CartDrawer, AdminLayout, WizardStep...
│   ├── lib/
│   │   ├── supabase.ts    ← client factory (config.json → localStorage)
│   │   ├── config.ts      ← bootstrap logic
│   │   ├── auth.ts        ← password hash/check, session
│   │   └── themes.ts      ← 10 presets
│   └── styles/
└── next.config.js         ← output: 'export', images unoptimized
```

---

## README.md must include (written for a NON-TECHNICAL person)

1. What this is, in 3 lines, Urdu + English
2. **Deploy in 10 minutes:** Download ZIP → unzip → vercel.com → Add New Project → drag the `out` folder → open site → default password **666** → follow wizard
3. FAQ: change password, add products from phone, "config missing" fix, updating to new versions
4. Screenshot placeholders for every step
5. MIT license + credits

---

## Coding Guidelines

- TypeScript, pragmatic types, no over-engineering
- **Mobile-first**: owners AND customers are on phones; admin must work on a 360px screen
- Every admin action: loading state + plain-language toast ("Supabase se connection nahi ho raha — key dobara check karein", never "fetch failed 401")
- Small bundle: native APIs only, no moment/lodash
- Comment the tricky parts (config bootstrap, static-export constraints)
- Keep all UI strings in `strings.ts` for easy Urdu translation later

## Build order

1. `next.config.js` + config bootstrap + Supabase client factory
2. Setup wizard (7 steps) with connection test + SQL verify
3. Admin auth (666 default, forced change, session)
4. Products CRUD + image upload
5. Public store: home, product, cart, checkout + WhatsApp
6. Orders admin
7. Settings admin
8. Themes system + gallery (all 10)
9. README + SECURITY + polish + pre-built `out/` in Releases
