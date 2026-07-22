'use client';

import { useEffect, useMemo, useState } from 'react';
import { StoreNav } from '@/components/StoreNav';
import { StoreFooter } from '@/components/StoreFooter';
import { ProductCard } from '@/components/ProductCard';
import { FullPageSpinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getActiveProducts, getSettings } from '@/lib/store';
import { Store, Star, Search, X, ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/Select';
import { DEFAULT_SETTINGS, parseCategories, effectivePrice, type Product, type Settings } from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

type SortKey = 'featured' | 'newest' | 'price_asc' | 'price_desc';

export default function HomePage() {
  const guard = useConfigGuard();
  const S = useT();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>('__all__');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');

  useEffect(() => {
    if (guard !== 'ready') return;
    Promise.all([getSettings(), getActiveProducts()]).then(([s, p]) => {
      setSettings(s);
      setProducts(p);
      setLoading(false);
    });
  }, [guard]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    // Only show categories that actually have visible products.
    products.forEach((p) => p.category && set.add(p.category));
    const managed = parseCategories(settings.categories);
    return Array.from(set)
      .sort((a, b) => {
        // Admin-ordered categories first, then the rest alphabetically.
        const ia = managed.indexOf(a);
        const ib = managed.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [products, settings.categories]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => {
      const catOk = activeCat === '__all__' || p.category === activeCat;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return catOk && qOk;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'price_asc') return effectivePrice(a) - effectivePrice(b);
      if (sort === 'price_desc') return effectivePrice(b) - effectivePrice(a);
      if (sort === 'newest')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      // featured: featured first, then existing order
      return Number(b.is_featured) - Number(a.is_featured);
    });
    return list;
  }, [products, activeCat, query, sort]);

  const featured = useMemo(() => products.filter((p) => p.is_featured), [products]);
  const storeClosed = settings.store_open === 'false';
  const searching = query.trim().length > 0;

  if (guard === 'unconfigured') return <StoreUnavailable />;
  if (guard !== 'ready') return <FullPageSpinner />;

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} loading={loading} />

      {storeClosed && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
          🛑 The store is currently closed — you can browse, but ordering is paused.
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Hero banner */}
        <section className="hero-tint card relative mb-6 overflow-hidden p-8 sm:p-12">
          {loading ? (
            // Skeleton while store data loads — avoids flashing default placeholder text.
            <div className="relative z-10 max-w-2xl">
              <div className="skeleton mb-3 h-6 w-32 rounded-full" />
              <div className="skeleton h-9 w-2/3 max-w-sm" />
              <div className="skeleton mt-4 h-4 w-full max-w-md" />
            </div>
          ) : (
            <div className="relative z-10 max-w-2xl">
              <span className="chip mb-3 inline-flex items-center gap-1.5 text-xs">
                <Store size={13} /> {settings.tagline || 'Online store'}
              </span>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                {settings.store_name || 'OPEN STORE'}
              </h1>
              {settings.about_text ? (
                <p className="mt-3 text-base text-muted">{settings.about_text}</p>
              ) : (
                <p className="mt-3 text-base text-muted">{S.welcomeBrowse}</p>
              )}
            </div>
          )}
        </section>

        {/* Featured (hidden while searching / filtering) */}
        {!loading && featured.length > 0 && activeCat === '__all__' && !searching && (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <Star size={18} className="text-primary" /> Featured
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featured.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} currency={settings.currency} />
              ))}
            </div>
          </section>
        )}

        {/* Search + sort */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9 pr-9"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {searching && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <Select
            value={sort}
            onChange={setSort}
            icon={<ArrowUpDown size={15} className="shrink-0 text-muted" />}
            className="w-full sm:w-56"
            options={[
              { value: 'featured', label: 'Featured' },
              { value: 'newest', label: 'Newest' },
              { value: 'price_asc', label: 'Price: low to high' },
              { value: 'price_desc', label: 'Price: high to low' },
            ]}
          />
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
            <button
              className={`chip ${activeCat === '__all__' ? 'chip-active' : ''}`}
              onClick={() => setActiveCat('__all__')}
            >
              {S.all}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${activeCat === c ? 'chip-active' : ''}`}
                onClick={() => setActiveCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-square w-full" />
                <div className="space-y-2 p-3">
                  <div className="skeleton h-3.5 w-3/4" />
                  <div className="skeleton h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="card flex flex-col items-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg text-muted">
              <Search size={24} />
            </div>
            <p className="font-medium">{searching ? 'No matches' : 'No products'}</p>
            <p className="mt-1 text-sm text-muted">
              {searching ? 'Try a different search.' : S.noProducts}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter settings={settings} />
    </div>
  );
}
