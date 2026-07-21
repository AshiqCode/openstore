'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingCart, Heart, Home, PackageSearch, Info, User } from 'lucide-react';
import { cartCount, onCartChange } from '@/lib/cart';
import { favoritesCount, onFavoritesChange } from '@/lib/favorites';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useCustomer } from '@/components/CustomerProvider';
import type { Settings } from '@/lib/types';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/track', label: 'Track order', icon: PackageSearch },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/account', label: 'Account', icon: User },
  { href: '/about', label: 'About', icon: Info },
];

export function StoreNav({ settings }: { settings: Settings }) {
  const pathname = usePathname();
  const customer = useCustomer();
  const [count, setCount] = useState(0);
  const [favs, setFavs] = useState(0);

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

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.store_name}
              className="h-9 w-9 rounded-theme object-cover"
            />
          ) : null}
          <span className="truncate text-lg font-bold tracking-tight">
            {settings.store_name || 'OPEN STORE'}
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageToggle />
          <Link
            href="/account"
            className="btn-icon text-ink hover:bg-bg"
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

      {/* Secondary nav links */}
      <nav className="border-t border-line">
        <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-2 py-1">
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

    </header>
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
