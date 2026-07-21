'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StoreNav } from '@/components/StoreNav';
import { StoreFooter } from '@/components/StoreFooter';
import { FullPageSpinner } from '@/components/Spinner';
import { StoreUnavailable } from '@/components/StoreUnavailable';
import { useConfigGuard } from '@/lib/useConfigGuard';
import { getProduct, getActiveProducts, getSettings } from '@/lib/store';
import { addToCart } from '@/lib/cart';
import { isFavorite, toggleFavorite } from '@/lib/favorites';
import { money } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Plus, Minus, Heart, Share2 } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { DEFAULT_SETTINGS, effectivePrice, type Product, type Settings } from '@/lib/types';
import { useT } from '@/components/LanguageProvider';

// useSearchParams needs a Suspense boundary under static export.
export default function ProductPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <ProductInner />
    </Suspense>
  );
}

function ProductInner() {
  const guard = useConfigGuard();
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const toast = useToast();
  const S = useT();

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [product, setProduct] = useState<Product | null>(null);
  const [all, setAll] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guard !== 'ready') return;
    Promise.all([
      getSettings(),
      id ? getProduct(id) : Promise.resolve(null),
      getActiveProducts(),
    ]).then(([s, p, list]) => {
      setSettings(s);
      setProduct(p);
      setAll(list);
      setFav(p ? isFavorite(p.id) : false);
      setLoading(false);
    });
  }, [guard, id]);

  function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      navigator.share({ title: product?.name, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast('Link copied', 'success');
    }
  }

  if (guard === 'unconfigured') return <StoreUnavailable />;
  if (guard !== 'ready' || loading) return <FullPageSpinner />;

  const related = product
    ? all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4)
    : [];

  return (
    <div className="min-h-screen">
      <StoreNav settings={settings} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
          <ArrowLeft size={15} /> {S.continueShopping}
        </Link>

        {!product ? (
          <div className="card mt-4 p-10 text-center text-muted">Product not found.</div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="card aspect-square overflow-hidden bg-bg">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="chip w-fit">{product.category}</span>
              <h1 className="mt-3 text-2xl font-bold">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {money(effectivePrice(product), settings.currency)}
                </span>
                {product.discount_percent > 0 && (
                  <>
                    <span className="text-lg text-muted line-through">
                      {money(product.price, settings.currency)}
                    </span>
                    <span className="badge bg-red-600 text-white">
                      -{product.discount_percent}%
                    </span>
                  </>
                )}
              </div>
              {product.description ? (
                <p className="mt-4 whitespace-pre-line text-muted">{product.description}</p>
              ) : null}

              {product.stock <= 0 ? (
                <div className="mt-6 font-medium text-red-600">{S.outOfStock}</div>
              ) : (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="label mb-0">{S.qty}</span>
                    <div className="flex items-center overflow-hidden rounded-full border border-line">
                      <button
                        className="flex h-10 w-10 items-center justify-center text-ink hover:bg-bg active:scale-95"
                        aria-label="Decrease quantity"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        <Minus size={18} strokeWidth={2.5} />
                      </button>
                      <span className="w-10 text-center font-bold">{qty}</span>
                      <button
                        className="flex h-10 w-10 items-center justify-center text-[color:var(--color-primary-fg)] active:scale-95"
                        style={{ background: 'var(--color-primary)' }}
                        aria-label="Increase quantity"
                        onClick={() => setQty((q) => q + 1)}
                      >
                        <Plus size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      addToCart(
                        { id: product.id, name: product.name, price: effectivePrice(product) },
                        qty
                      );
                      toast(`${product.name} — ${S.addedToCart}`, 'success');
                    }}
                  >
                    {S.addToCart}
                  </button>
                  <div className="flex gap-2">
                    <Link href="/cart" className="btn btn-outline flex-1">
                      {S.cart}
                    </Link>
                    <button
                      className="btn btn-outline"
                      aria-label="Add to favorites"
                      onClick={() => setFav(toggleFavorite(product.id))}
                    >
                      <Heart size={17} className={fav ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                    <button className="btn btn-outline" aria-label="Share" onClick={share}>
                      <Share2 size={17} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-bold">You may also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} currency={settings.currency} />
              ))}
            </div>
          </section>
        )}
      </main>
      <StoreFooter settings={settings} />
    </div>
  );
}
