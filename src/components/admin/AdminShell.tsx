'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  Package,
  Users,
  UsersRound,
  Settings as SettingsIcon,
  Palette,
  KeyRound,
  Menu,
  LogOut,
  ShieldOff,
  ExternalLink,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { verifySession, signOut, getAdminEmail } from '@/lib/auth';
import { getMyRole, ROLE_LABELS, type TeamRole } from '@/lib/team';
import { FullPageSpinner } from '@/components/Spinner';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useT } from '@/components/LanguageProvider';

// Which admin pages each role may open. Dashboard, orders and the password page
// are available to everyone on the team.
const OWNER_ONLY = ['/admin/team'];
const STORE_MANAGER_ONLY = [
  '/admin/products',
  '/admin/customers',
  '/admin/settings',
  '/admin/theme',
];

function canAccess(pathname: string, role: TeamRole): boolean {
  const path = pathname.replace(/\/$/, '');
  if (OWNER_ONLY.some((p) => path.startsWith(p))) return role === 'owner';
  if (STORE_MANAGER_ONLY.some((p) => path.startsWith(p))) {
    return role === 'owner' || role === 'manager';
  }
  return true;
}

// Wraps every authenticated admin page: guards the session and renders the
// professional sidebar + top bar shell.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const S = useT();
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Roles are enforced in the database; this only avoids showing a teammate
  // links that would fail. 'staff' handles orders, 'manager' runs the store,
  // 'owner' also manages the team.
  const canManageStore = role === 'owner' || role === 'manager';
  const nav: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/admin/dashboard', label: S.dashboard, icon: LayoutGrid },
    ...(canManageStore
      ? [{ href: '/admin/products', label: S.products, icon: ShoppingBag }]
      : []),
    { href: '/admin/orders', label: S.orders, icon: Package },
    ...(canManageStore
      ? [
          { href: '/admin/customers', label: 'Customers', icon: Users },
          { href: '/admin/settings', label: S.settings, icon: SettingsIcon },
          { href: '/admin/theme', label: S.theme, icon: Palette },
        ]
      : []),
    ...(role === 'owner' ? [{ href: '/admin/team', label: 'Team', icon: UsersRound }] : []),
    { href: '/admin/password', label: S.changePassword, icon: KeyRound },
  ];

  // Re-checks who this is and what they may still do.
  //
  // Access can be taken away WHILE someone is using the panel — an owner removes
  // them, or changes their role. So this doesn't run only at login: it runs on
  // every navigation, whenever the tab regains focus, and on a timer. A removed
  // person is signed out and bounced to the login screen rather than left
  // clicking around a panel where nothing works.
  const revalidate = useCallback(
    async (isMounted: () => boolean) => {
      const stillValid = await verifySession();
      if (!isMounted()) return;

      if (!stillValid) {
        // The account is gone or disabled — clear the dead token so they don't
        // land back here on the next page load.
        await signOut();
        router.replace('/admin');
        return;
      }

      const [mail, myRole] = await Promise.all([getAdminEmail(), getMyRole()]);
      if (!isMounted()) return;
      setEmail(mail);
      setRole(myRole);
      setChecked(true);

      // Their role may have been lowered while this page was open. Hiding the
      // nav link isn't enough — move them off the page itself. (The database
      // would refuse their writes regardless; this stops them staring at a
      // screen that silently fails.)
      if (myRole && !canAccess(pathname, myRole)) {
        router.replace('/admin/dashboard');
      }
    },
    [router, pathname]
  );

  useEffect(() => {
    let active = true;
    const isMounted = () => active;

    void revalidate(isMounted);

    // Coming back to the tab is the moment a stale panel is most likely to be
    // shown, so check then — plus a slow poll for a tab left open all day.
    const onWake = () => {
      if (document.visibilityState === 'visible') void revalidate(isMounted);
    };
    window.addEventListener('focus', onWake);
    document.addEventListener('visibilitychange', onWake);
    const timer = window.setInterval(() => void revalidate(isMounted), 60_000);

    return () => {
      active = false;
      window.removeEventListener('focus', onWake);
      document.removeEventListener('visibilitychange', onWake);
      window.clearInterval(timer);
    };
  }, [revalidate, pathname]);

  if (!checked) return <FullPageSpinner />;

  // Signed in, but not on the team — e.g. a login created directly in the
  // Supabase dashboard, or a leftover invitation. The database gives them
  // nothing, so say that plainly instead of rendering an admin panel where
  // every query silently returns empty.
  if (role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg text-muted">
            <ShieldOff size={22} />
          </div>
          <h1 className="text-lg font-bold">This account has no access</h1>
          <p className="mt-2 text-sm text-muted">
            {email ? <b className="text-ink">{email}</b> : 'You'} can sign in, but hasn&apos;t been
            given a role yet. Ask the store owner to invite you from Admin → Team.
          </p>
          <button
            className="btn btn-outline mt-5 w-full"
            onClick={async () => {
              await signOut();
              router.replace('/admin');
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    );
  }

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
              <div className="text-sm font-bold">
                Admin{role ? ` · ${ROLE_LABELS[role]}` : ''}
              </div>
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
              onClick={async () => {
                await signOut();
                router.replace('/admin');
              }}
            >
              <LogOut size={15} /> {S.logout}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20">
            <NavList />
          </div>
        </aside>

        {/* Mobile drawer (portaled to body) */}
        <MobileDrawer
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          header={
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[color:var(--color-primary-fg)]">
                <Store size={16} />
              </div>
              <span className="font-bold">Admin</span>
            </div>
          }
        >
          <div className="p-3">
            <NavList />
          </div>
        </MobileDrawer>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
