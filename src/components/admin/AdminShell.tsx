'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  Settings as SettingsIcon,
  Palette,
  Plug,
  KeyRound,
  Menu,
  LogOut,
  ExternalLink,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { isLoggedIn, signOut, getAdminEmail } from '@/lib/auth';
import { FullPageSpinner } from '@/components/Spinner';
import { useT } from '@/components/LanguageProvider';
import { BUILDER_NAME, BUILDER_URL } from '@/lib/brand';

// Wraps every authenticated admin page: guards the session and renders the
// professional sidebar + top bar shell.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const S = useT();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const nav: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/admin/dashboard', label: S.dashboard, icon: LayoutGrid },
    { href: '/admin/products', label: S.products, icon: ShoppingBag },
    { href: '/admin/orders', label: S.orders, icon: Package },
    { href: '/admin/settings', label: S.settings, icon: SettingsIcon },
    { href: '/admin/theme', label: S.theme, icon: Palette },
    { href: '/admin/password', label: S.changePassword, icon: KeyRound },
    { href: '/admin/config', label: S.config, icon: Plug },
  ];

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/admin');
      return;
    }
    setChecked(true);
    setEmail(getAdminEmail());
  }, [router, pathname]);

  if (!checked) return <FullPageSpinner />;

  const NavList = () => (
    <ul className="flex flex-col gap-1">
      {nav.map((n) => {
        const active = pathname === n.href;
        const Icon = n.icon;
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-theme px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-primary text-[color:var(--color-primary-fg)] shadow-sm'
                  : 'text-muted hover:bg-bg hover:text-ink'
              }`}
            >
              <Icon size={18} />
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <button
              className="btn btn-outline px-2.5 py-1.5 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[color:var(--color-primary-fg)]">
              <Store size={17} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold">Admin</div>
              {email && <div className="hidden text-[11px] text-muted sm:block">{email}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="btn btn-outline hidden items-center gap-1.5 px-3 py-1.5 text-sm sm:inline-flex"
            >
              <ExternalLink size={15} /> {S.viewStore}
            </Link>
            <button
              className="btn btn-outline inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
              onClick={() => {
                signOut();
                router.replace('/admin');
              }}
            >
              <LogOut size={15} /> {S.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20">
            <NavList />
            <div className="mt-6 border-t border-line pt-4 text-xs text-muted">
              Built by{' '}
              <a
                href={BUILDER_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {BUILDER_NAME}
              </a>
            </div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="absolute inset-x-4 top-2 z-20 rounded-theme border border-line bg-card p-2 shadow-xl md:hidden">
            <NavList />
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
