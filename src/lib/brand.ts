// Builder credit shown in the store footer and admin.
export const BUILDER_NAME = 'M.ASHIQ';
export const BUILDER_URL = 'https://www.instagram.com/asjab_music/';

// GitHub repo (owner/name). CHANGE THIS to your own repo so the one-click
// "Deploy with Vercel" button points at the right place.
export const REPO_SLUG = 'AshiqCode/openstore';
export const REPO_URL = `https://github.com/${REPO_SLUG}`;

// One-click deploy URL. Vercel prompts the deployer for the two env vars in a
// simple form during import — the easiest path for a non-technical person.
export const VERCEL_DEPLOY_URL =
  'https://vercel.com/new/clone?repository-url=' +
  encodeURIComponent(REPO_URL) +
  '&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY' +
  '&envDescription=' +
  encodeURIComponent('Your Supabase Project URL and anon public key (Supabase → Project Settings → API)') +
  '&envLink=' +
  encodeURIComponent(`${REPO_URL}/blob/main/.env.example`);

// Open-source liability disclaimer (shown to shoppers and store owners).
export const DISCLAIMER_SHORT =
  'This is free, open-source software. The developer is not responsible for any store, its content, transactions, or misuse.';

export const DISCLAIMER_LONG =
  'This store runs on free, open-source software that anyone can deploy and use. The developer/author provides it "as is", with no warranty, and is NOT responsible in any way for how it is used — including the store\'s products, prices, orders, payments, customer data, or any misuse, loss, or dispute. Each store is owned and operated solely by the person who deployed it. Use at your own risk.';
