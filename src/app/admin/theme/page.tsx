'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { Check } from 'lucide-react';
import { ThemeMiniCard } from '@/components/ThemeMiniCard';
import { THEMES, applyTheme, DEFAULT_THEME_ID } from '@/lib/themes';
import { getSettings, saveSettings } from '@/lib/store';
import { useT } from '@/components/LanguageProvider';

export default function ThemePage() {
  return (
    <AdminShell>
      <ThemePicker />
    </AdminShell>
  );
}

function ThemePicker() {
  const toast = useToast();
  const S = useT();
  const [current, setCurrent] = useState(DEFAULT_THEME_ID);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    getSettings().then((s) => {
      setCurrent(s.theme || DEFAULT_THEME_ID);
      setLoading(false);
    });
  }, []);

  async function pick(id: string) {
    setCurrent(id);
    applyTheme(id); // instant preview
    setSaving(id);
    const ok = await saveSettings({ theme: id });
    setSaving('');
    if (!ok) toast('Could not save theme', 'error');
    else toast('Theme applied', 'success');
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner size={18} /> Loading…
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="page-title mb-1">{S.theme}</h1>
      <p className="mb-4 text-sm text-muted">
        Click a theme to apply it instantly. Changes are live for visitors on next load.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {THEMES.map((t) => (
          <div key={t.id} className="relative">
            <ThemeMiniCard theme={t} active={current === t.id} onClick={() => pick(t.id)} />
            {saving === t.id && (
              <div className="absolute inset-0 flex items-center justify-center rounded-theme bg-black/20">
                <Spinner size={20} />
              </div>
            )}
            {current === t.id && saving !== t.id && (
              <div
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                <Check size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
