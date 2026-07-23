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
