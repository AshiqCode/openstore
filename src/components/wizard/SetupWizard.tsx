'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Check, ExternalLink, PartyPopper, Download } from 'lucide-react';
import { CopyButton } from '@/components/CopyButton';
import { BrandGlow } from '@/components/BrandGlow';
import { ThemeMiniCard } from '@/components/ThemeMiniCard';
import { Spinner } from '@/components/Spinner';
import { SETUP_SQL } from '@/lib/setupSql';
import { THEMES, applyTheme } from '@/lib/themes';
import { makeTempClient, resetSupabase } from '@/lib/supabase';
import { writeLocalConfig, buildConfigFileContents, type StoreConfig } from '@/lib/config';
import { saveSettings } from '@/lib/store';
import { adminSignup } from '@/lib/auth';

const WIZARD_STATE_KEY = 'wizard_state';
const TOTAL_STEPS = 6;

type WizardState = {
  step: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  storeName: string;
  whatsapp: string;
  theme: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const INITIAL: WizardState = {
  step: 1,
  supabaseUrl: '',
  supabaseAnonKey: '',
  storeName: '',
  whatsapp: '',
  theme: 'clean',
  email: '',
  password: '',
  confirmPassword: '',
};

export function SetupWizard() {
  const router = useRouter();
  const [st, setSt] = useState<WizardState>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  // Restore progress so a refresh doesn't lose the wizard.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIZARD_STATE_KEY);
      if (raw) setSt({ ...INITIAL, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // Never persist the plaintext password to localStorage.
    const { password, confirmPassword, ...persist } = st;
    void password;
    void confirmPassword;
    localStorage.setItem(WIZARD_STATE_KEY, JSON.stringify(persist));
  }, [st, loaded]);

  useEffect(() => {
    applyTheme(st.theme);
  }, [st.theme]);

  function patch(p: Partial<WizardState>) {
    setSt((s) => ({ ...s, ...p }));
  }
  const go = (step: number) => patch({ step: Math.min(TOTAL_STEPS, Math.max(1, step)) });

  if (!loaded) return null;

  return (
    <div className="relative mx-auto max-w-xl px-4 py-8">
      <BrandGlow />
      {/* Progress dots */}
      <div className="relative mb-6 flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <span
            key={i}
            className="h-2 rounded-full transition-all"
            style={{
              width: i + 1 === st.step ? 24 : 8,
              background: i + 1 <= st.step ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      <div className="card relative z-10 p-6 shadow-xl">
        {st.step === 1 && <StepWelcome onNext={() => go(2)} />}
        {st.step === 2 && <StepCreateProject onNext={() => go(3)} onBack={() => go(1)} />}
        {st.step === 3 && (
          <StepKeys
            url={st.supabaseUrl}
            anon={st.supabaseAnonKey}
            onChange={(url, anon) => patch({ supabaseUrl: url, supabaseAnonKey: anon })}
            onNext={() => go(4)}
            onBack={() => go(2)}
          />
        )}
        {st.step === 4 && (
          <StepSql
            config={{ supabaseUrl: st.supabaseUrl, supabaseAnonKey: st.supabaseAnonKey }}
            onNext={() => go(5)}
            onBack={() => go(3)}
          />
        )}
        {st.step === 5 && (
          <StepBasics
            state={st}
            patch={patch}
            onFinish={async () => {
              // 1) Persist config so getSupabase() reaches the DB.
              const config: StoreConfig = {
                supabaseUrl: st.supabaseUrl,
                supabaseAnonKey: st.supabaseAnonKey,
              };
              writeLocalConfig(config);
              resetSupabase();

              // 2) Save store basics (anon write).
              const ok = await saveSettings({
                store_name: st.storeName || 'OPEN STORE',
                whatsapp_number: st.whatsapp,
                theme: st.theme,
              });
              if (!ok) return { ok: false, error: 'Could not save — check your connection.' };

              // 3) Create the admin account (email + password) and log in.
              const res = await adminSignup(st.email, st.password);
              return res;
            }}
            onDone={() => go(6)}
            onBack={() => go(4)}
          />
        )}
        {st.step === 6 && (
          <StepDone
            config={{ supabaseUrl: st.supabaseUrl, supabaseAnonKey: st.supabaseAnonKey }}
            onFinish={() => {
              localStorage.removeItem(WIZARD_STATE_KEY);
              router.replace('/admin/dashboard');
            }}
          />
        )}
      </div>
    </div>
  );
}

// ---- Shared bits ----------------------------------------------------------

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel = 'Next →',
  nextDisabled,
  loading,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {onBack ? (
        <button className="btn btn-outline" onClick={onBack} type="button">
          ← Back
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={nextDisabled || loading}
          type="button"
        >
          {loading ? <Spinner size={18} /> : nextLabel}
        </button>
      )}
    </div>
  );
}

// ---- Steps ----------------------------------------------------------------

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <div className="mb-3 text-primary">
        <ShoppingBag size={40} />
      </div>
      <Heading
        title="Apka store 5 minute mein ready ho jaye ga"
        sub="Your online store, set up in about 5 minutes — no coding."
      />
      <ul className="mt-2 space-y-2 text-sm">
        {[
          'A free Supabase account (we’ll link it)',
          'Your WhatsApp number for orders',
          'Your Supabase keys — that’s your admin login',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check size={16} className="mt-0.5 shrink-0 text-green-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Nav onNext={onNext} nextLabel="Start setup →" />
    </div>
  );
}

function StepCreateProject({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <Heading
        title="Create a free Supabase project"
        sub="Supabase apke store ka database aur images rakhta hai. Bilkul free."
      />
      <ol className="space-y-2 text-sm">
        <li>1. Open Supabase and sign up (Google/GitHub works).</li>
        <li>
          2. Click <b>New Project</b>, pick any name, set a database password.
        </li>
        <li>3. Wait ~1 minute for it to finish setting up.</li>
      </ol>
      <div className="mt-4 rounded-theme border border-dashed border-line p-3 text-center text-xs text-muted">
        [ screenshot: Supabase &quot;New Project&quot; button ]
      </div>
      <a
        href="https://supabase.com/dashboard/projects"
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary mt-4 inline-flex w-full items-center justify-center gap-1.5"
      >
        Open Supabase <ExternalLink size={16} />
      </a>
      <Nav onBack={onBack} onNext={onNext} nextLabel="I created it →" />
    </div>
  );
}

function StepKeys({
  url,
  anon,
  onChange,
  onNext,
  onBack,
}: {
  url: string;
  anon: string;
  onChange: (url: string, anon: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'ok' | 'fail' | null>(null);
  const [msg, setMsg] = useState('');

  async function test() {
    setTesting(true);
    setResult(null);
    try {
      const client = makeTempClient({ supabaseUrl: url.trim(), supabaseAnonKey: anon.trim() });
      const { error } = await client.from('settings').select('key').limit(1);
      if (error && /invalid|jwt|api key|not authorized/i.test(error.message)) {
        setResult('fail');
        setMsg('Keys galat lag rahi hain — dobara copy karein.');
      } else {
        setResult('ok');
        setMsg('Connection ban gaya! (tables agli step mein banenge)');
      }
    } catch {
      setResult('fail');
      setMsg('Connection nahi hua — URL check karein.');
    }
    setTesting(false);
  }

  const filled = url.trim().length > 10 && anon.trim().length > 20;

  return (
    <div>
      <Heading
        title="Paste your keys"
        sub="Supabase mein: Project Settings → API. Wahan se ye do cheezein copy karein."
      />
      <label className="label">Project URL</label>
      <input
        className="input"
        placeholder="https://xxxx.supabase.co"
        value={url}
        onChange={(e) => {
          onChange(e.target.value, anon);
          setResult(null);
        }}
      />
      <label className="label mt-3">anon public key</label>
      <textarea
        className="input min-h-20 font-mono text-xs"
        placeholder="eyJhbGciOi..."
        value={anon}
        onChange={(e) => {
          onChange(url, e.target.value);
          setResult(null);
        }}
      />

      <button
        className="btn btn-outline mt-3 w-full"
        onClick={test}
        disabled={!filled || testing}
        type="button"
      >
        {testing ? <Spinner size={18} /> : 'Test Connection'}
      </button>
      {result && (
        <p className={`mt-2 text-sm ${result === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
          {msg}
        </p>
      )}

      <Nav onBack={onBack} onNext={onNext} nextDisabled={result !== 'ok'} />
    </div>
  );
}

function StepSql({
  config,
  onNext,
  onBack,
}: {
  config: StoreConfig;
  onNext: () => void;
  onBack: () => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');

  async function verify() {
    setVerifying(true);
    setOk(null);
    try {
      const client = makeTempClient(config);
      const { error } = await client.from('settings').select('key').limit(1);
      if (error) {
        setOk(false);
        setMsg('Tables abhi nahi bane — SQL run kiya? Thodi der baad dobara Verify karein.');
      } else {
        setOk(true);
        setMsg('Tables ready!');
      }
    } catch {
      setOk(false);
      setMsg('Verify nahi ho saka — dobara koshish karein.');
    }
    setVerifying(false);
  }

  return (
    <div>
      <Heading
        title="Run the setup SQL"
        sub="Ye tables aur settings banata hai. Copy karein, Supabase SQL Editor mein paste karke Run karein."
      />
      <div className="flex gap-2">
        <CopyButton text={SETUP_SQL} label="Copy SQL" className="btn btn-primary flex-1" />
        <a
          href="https://supabase.com/dashboard/project/_/sql/new"
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline inline-flex flex-1 items-center justify-center gap-1.5"
        >
          Open SQL Editor <ExternalLink size={15} />
        </a>
      </div>
      <pre className="mt-3 max-h-48 overflow-auto rounded-theme border border-line bg-bg p-3 text-[11px] leading-relaxed">
        {SETUP_SQL}
      </pre>

      <button
        className="btn btn-outline mt-3 w-full"
        onClick={verify}
        disabled={verifying}
        type="button"
      >
        {verifying ? <Spinner size={18} /> : 'Verify Tables'}
      </button>
      {ok !== null && (
        <p className={`mt-2 text-sm ${ok ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
      )}

      <Nav onBack={onBack} onNext={onNext} nextDisabled={ok !== true} />
    </div>
  );
}

function StepBasics({
  state,
  patch,
  onFinish,
  onDone,
  onBack,
}: {
  state: WizardState;
  patch: (p: Partial<WizardState>) => void;
  onFinish: () => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim());

  async function finish() {
    setErr('');
    if (!emailValid) return setErr('Please enter a valid admin email.');
    if (state.password.length < 6) return setErr('Password must be at least 6 characters.');
    if (state.password !== state.confirmPassword) return setErr('Passwords do not match.');

    setSaving(true);
    const res = await onFinish();
    setSaving(false);
    if (res.ok) onDone();
    else setErr(res.error || 'Could not finish setup — please try again.');
  }

  return (
    <div>
      <Heading title="Store basics & admin login" sub="Ye aapka store aur login banayega." />

      <label className="label">Store name</label>
      <input
        className="input"
        placeholder="Ali's Store"
        value={state.storeName}
        onChange={(e) => patch({ storeName: e.target.value })}
      />

      <label className="label mt-3">WhatsApp number</label>
      <input
        className="input"
        placeholder="03xx xxxxxxx"
        inputMode="tel"
        value={state.whatsapp}
        onChange={(e) => patch({ whatsapp: e.target.value })}
      />

      {/* Admin login (email + password stored in the admins table) */}
      <div className="mt-5 rounded-theme border border-line bg-bg p-4">
        <div className="mb-2 font-semibold">Your admin login</div>
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          placeholder="you@example.com"
          value={state.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Min 6 characters"
              value={state.password}
              onChange={(e) => patch({ password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Confirm</label>
            <input
              className="input"
              type="password"
              value={state.confirmPassword}
              onChange={(e) => patch({ confirmPassword: e.target.value })}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">Is email + password se admin panel mein login karenge.</p>
      </div>

      <label className="label mt-5">Pick a theme</label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((t) => (
          <ThemeMiniCard
            key={t.id}
            theme={t}
            active={state.theme === t.id}
            onClick={() => patch({ theme: t.id })}
          />
        ))}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <Nav onBack={onBack} onNext={finish} nextLabel="Finish →" loading={saving} />
    </div>
  );
}

function StepDone({ config, onFinish }: { config: StoreConfig; onFinish: () => void }) {
  const fileContents = buildConfigFileContents(config);

  function download() {
    const blob = new Blob([fileContents], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative">
      <Confetti />
      <div className="mb-3 flex justify-center text-primary">
        <PartyPopper size={48} />
      </div>
      <Heading title="Ho gaya! Your store is live" sub="Ab kuch products add karein aur share karein." />

      <div className="rounded-theme border border-line bg-bg p-4">
        <div className="font-semibold">One more thing (important for visitors)</div>
        <p className="mt-1 text-sm text-muted">
          Abhi store sirf <b>apke browser</b> par kaam karega. Taake har visitor ke liye chale,
          config.json download karke apne folder mein purani file ke oopar rakhein aur Vercel par
          dobara drag karein.
        </p>
        <button
          className="btn btn-primary mt-3 inline-flex w-full items-center justify-center gap-1.5"
          onClick={download}
          type="button"
        >
          <Download size={16} /> Download config.json
        </button>
        <p className="mt-2 text-xs text-muted">Later bhi kar sakte hain — Admin → Config se.</p>
      </div>

      <button className="btn btn-outline mt-5 w-full" onClick={onFinish} type="button">
        Go to dashboard →
      </button>
    </div>
  );
}

// Lightweight confetti using deterministic positions (no Math.random).
function Confetti() {
  const colors = ['#e11d73', '#22d3ee', '#f4623a', '#0f9d6e', '#c9a227'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: -10,
            left: `${(i * 37) % 100}%`,
            width: 7,
            height: 7,
            background: colors[i % colors.length],
            borderRadius: i % 2 ? '50%' : 2,
            animation: `confetti-fall ${2 + (i % 5) * 0.4}s linear ${(i % 6) * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
