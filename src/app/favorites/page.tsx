'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { StoreNav } from '@/components/StoreNav';
import { StoreFooter } from '@/components/StoreFooter';
import { ProductCard } from '@/components/ProductCard';
import { FullPageSpinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getActiveProducts, getSettings } from '@/lib/store';
import { getFavorites, onFavoritesChange } from '@/lib/favorites';
import { DEFAULT_SETTINGS, type Product, type Settings } from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

export default function FavoritesPage() {
  const guard = useConfigGuard();
  const S = useT();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guard !== 'ready') return;
    Promise.all([getSettings(), getActiveProducts()]).then(([s, p]) => {
      setSettings(s);
      setProducts(p);
      setLoading(false);
    });
    setFavIds(getFavorites());
    return onFavoritesChange(() => setFavIds(getFavorites()));
  }, [guard]);

  if (guard === 'unconfigured') return <StoreUnavailable />;
  if (guard !== 'ready') return <FullPageSpinner />;

  const favProducts = products.filter((p) => favIds.includes(p.id));

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-5 flex items-center gap-2 text-2xl font-bold">
          <Heart size={22} className="fill-red-500 text-red-500" /> Favorites
        </h1>

        {loading ? (
          <FullPageSpinner />
        ) : favProducts.length === 0 ? (
          <div className="card flex flex-col items-center p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bg text-muted">
              <Heart size={24} />
            </div>
            <p className="font-medium">No favorites yet</p>
            <p className="mt-1 text-sm text-muted">Tap the heart on any product to save it here.</p>
            <Link href="/" className="btn btn-primary mt-5">
              {S.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {favProducts.map((p) => (
              <ProductCard key={p.id} product={p} currency={settings.currency} />
            ))}
          </div>
        )}
      </main>
      <StoreFooter settings={settings} />
    </div>
  );
}
