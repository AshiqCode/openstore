'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AlertTriangle, CheckCircle2, Download, ExternalLink } from 'lucide-react';
import { Spinner } from '@/components/Spinner';
import { CopyButton } from '@/components/CopyButton';
import { SETUP_SQL } from '@/lib/setupSql';
import {
  readLocalConfig,
  readPublicConfig,
  readEnvConfig,
  buildConfigFileContents,
  type StoreConfig,
} from '@/lib/config';
import { getSupabase } from '@/lib/supabase';

export default function ConfigPage() {
  return (
    <AdminShell>
      <ConfigPanel />
    </AdminShell>
  );
}

function ConfigPanel() {
  const [local, setLocal] = useState<StoreConfig | null>(null);
  const [pub, setPub] = useState<StoreConfig | null>(null);
  const [env, setEnv] = useState<StoreConfig | null>(null);
  const [status, setStatus] = useState<'checking' | 'ok' | 'fail'>('checking');

  useEffect(() => {
    setLocal(readLocalConfig());
    setEnv(readEnvConfig());
    readPublicConfig().then((p) => setPub(p.supabaseUrl ? p : null));
    getSupabase().then(async (client) => {
      if (!client) return setStatus('fail');
      const { error } = await client.from('settings').select('key').limit(1);
      setStatus(error ? 'fail' : 'ok');
    });
  }, []);

  const active = env ?? local ?? pub;
  // Visitors get a working store if config is baked in — either via env vars
  // (GitHub → Vercel) or a filled config.json (drag & drop).
  const visitorsCovered = !!env || !!pub;

  function download() {
    if (!active) return;
    const blob = new Blob([buildConfigFileContents(active)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl animate-fade-up">
      <h1 className="page-title mb-4">Connection &amp; config</h1>

      {/* Status */}
      <div className="card mb-4 flex items-center gap-3 p-4">
        <StatusDot status={status} />
        <div>
          <div className="font-medium">
            {status === 'checking'
              ? 'Checking connection…'
              : status === 'ok'
                ? 'Connected to Supabase'
                : 'Not connected'}
          </div>
          <div className="text-sm text-muted">
            {active?.supabaseUrl || 'No Supabase URL configured'}
          </div>
        </div>
      </div>

      {/* Env-var config (GitHub → Vercel) */}
      {env && (
        <div className="card mb-4 p-4">
          <div className="flex items-center gap-2 font-semibold text-green-700">
            <CheckCircle2 size={18} /> Configured via environment variables
          </div>
          <p className="mt-1 text-sm text-muted">
            Your keys are set through Vercel env vars — every visitor gets a working store, no
            config.json needed.
          </p>
        </div>
      )}

      {/* config.json sync warning (only when NOT covered by env or a baked file) */}
      {!visitorsCovered && active && (
        <div className="card mb-4 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} className="text-amber-500" /> Visitors can&apos;t see your store
            yet
          </div>
          <p className="mt-1 text-sm text-muted">
            Your keys are only saved in this browser. Either set <code>NEXT_PUBLIC_SUPABASE_URL</code>{' '}
            and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel (recommended for GitHub deploys),
            or download <code>config.json</code>, replace it in your folder and re-upload.
          </p>
          <button className="btn btn-primary mt-3 inline-flex items-center gap-1.5" onClick={download}>
            <Download size={16} /> Download config.json
          </button>
        </div>
      )}

      {!env && pub && (
        <div className="card mb-4 p-4">
          <div className="flex items-center gap-2 font-semibold text-green-700">
            <CheckCircle2 size={18} /> config.json is set up
          </div>
          <p className="mt-1 text-sm text-muted">
            Your deployed folder has valid keys — visitors can use the store.
          </p>
          <button className="btn btn-outline mt-3 inline-flex items-center gap-1.5" onClick={download}>
            <Download size={16} /> Re-download config.json
          </button>
        </div>
      )}

      {/* Re-run SQL */}
      <div className="card p-4">
        <div className="font-semibold">Re-run setup SQL</div>
        <p className="mt-1 text-sm text-muted">
          Tables missing or reset? Copy this into Supabase → SQL Editor and run it again. It&apos;s
          safe to run more than once.
        </p>
        <div className="mt-3 flex gap-2">
          <CopyButton text={SETUP_SQL} label="Copy SQL" className="btn btn-primary" />
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline inline-flex items-center gap-1.5"
          >
            Open SQL Editor <ExternalLink size={15} />
          </a>
        </div>
      </div>

    </div>
  );
}

function StatusDot({ status }: { status: 'checking' | 'ok' | 'fail' }) {
  if (status === 'checking') return <Spinner size={20} />;
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-full"
      style={{ background: status === 'ok' ? '#16a34a' : '#dc2626' }}
    />
  );
}
