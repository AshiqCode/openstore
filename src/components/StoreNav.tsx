'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingCart, Heart, Home, PackageSearch, Info, User, Menu, Store } from 'lucide-react';
import { cartCount, onCartChange } from '@/lib/cart';
import { favoritesCount, onFavoritesChange } from '@/lib/favorites';
import { useCustomer } from '@/components/CustomerProvider';
import { MobileDrawer } from '@/components/MobileDrawer';
import type { Settings } from '@/lib/types';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/track', label: 'Track order', icon: PackageSearch },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/account', label: 'Account', icon: User },
  { href: '/about', label: 'About', icon: Info },
];

export function StoreNav({ settings, loading = false }: { settings: Settings; loading?: boolean }) {
  const pathname = usePathname();
  const customer = useCustomer();
  const [count, setCount] = useState(0);
  const [favs, setFavs] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setCount(cartCount());
    setFavs(favoritesCount());
    const off1 = onCartChange(() => setCount(cartCount()));
    const off2 = onFavoritesChange(() => setFavs(favoritesCount()));
    return () => {
      off1();
      off2();
    };
  }, []);

  // Close the drawer when navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  const storeName = settings.store_name || 'OPEN STORE';

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            className="btn-icon text-ink hover:bg-bg md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {loading ? (
            // Skeleton while store data loads — avoids flashing the default name.
            <div className="flex items-center gap-2">
              <div className="skeleton h-9 w-9 rounded-theme" />
              <div className="skeleton h-5 w-28" />
            </div>
          ) : (
            <Link href="/" className="flex min-w-0 items-center gap-2">
              {settings.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logo_url} alt={storeName} className="h-9 w-9 rounded-theme object-cover" />
              ) : null}
              <span className="truncate text-lg font-bold tracking-tight">{storeName}</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/account"
            className="btn-icon hidden text-ink hover:bg-bg sm:inline-flex"
            aria-label="Account"
            title={customer ? customer.name || customer.email : 'Account'}
          >
            <User size={19} />
          </Link>
          <IconLink href="/favorites" label="Favorites" count={favs}>
            <Heart size={19} />
          </IconLink>
          <IconLink href="/cart" label="Cart" count={count}>
            <ShoppingCart size={19} />
          </IconLink>
        </div>
      </div>

      {/* Desktop nav links */}
      <nav className="hidden border-t border-line md:block">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-2 py-1">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-theme px-3 py-1.5 text-sm font-medium transition ${
                  active ? 'text-primary' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon size={15} /> {l.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile sidebar drawer (portaled to body) */}
      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        header={
          <div className="flex min-w-0 items-center gap-2">
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt="" className="h-8 w-8 rounded-theme object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-theme bg-primary text-[color:var(--color-primary-fg)]">
                <Store size={16} />
              </div>
            )}
            <span className="truncate font-bold">{storeName}</span>
          </div>
        }
      >
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-theme px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-primary text-[color:var(--color-primary-fg)]' : 'text-ink hover:bg-bg'
                }`}
              >
                <Icon size={18} /> {l.label}
              </Link>
            );
          })}
          <Link
            href="/cart"
            onClick={() => setMenuOpen(false)}
            className="mt-1 flex items-center justify-between rounded-theme px-3 py-2.5 text-sm font-medium text-ink hover:bg-bg"
          >
            <span className="flex items-center gap-3">
              <ShoppingCart size={18} /> Cart
            </span>
            {count > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                {count}
              </span>
            )}
          </Link>
        </nav>

        {customer && (
          <div className="border-t border-line px-4 py-3 text-xs text-muted">
            Signed in as <span className="font-medium text-ink">{customer.name || customer.email}</span>
          </div>
        )}
      </MobileDrawer>
      </header>
    </>
  );
}

function IconLink({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="btn-icon relative text-ink hover:bg-bg" aria-label={label}>
      {children}
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
