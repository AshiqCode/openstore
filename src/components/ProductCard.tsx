'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Star, Heart } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { isFavorite, toggleFavorite, onFavoritesChange } from '@/lib/favorites';
import { money } from '@/lib/format';
import { useToast } from '@/components/Toast';
import { useT } from '@/components/LanguageProvider';
import { effectivePrice, type Product } from '@/lib/types';

function isNew(createdAt: string): boolean {
  try {
    return new Date(createdAt).getTime() > new Date().getTime() - 7 * 86400000;
  } catch {
    return false;
  }
}

export function ProductCard({ product, currency }: { product: Product; currency: string }) {
  const toast = useToast();
  const S = useT();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFavorite(product.id));
    return onFavoritesChange(() => setFav(isFavorite(product.id)));
  }, [product.id]);

  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const discounted = product.discount_percent > 0;
  const fresh = isNew(product.created_at);
  const finalPrice = effectivePrice(product);

  return (
    <div className="product-card card relative flex flex-col overflow-hidden">
      <Link href={`/product?id=${product.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden bg-bg">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="product-img h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {discounted && (
              <span className="badge bg-red-600 text-white shadow">-{product.discount_percent}%</span>
            )}
            {product.is_featured && (
              <span
                className="badge shadow"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}
              >
                <Star size={11} /> Featured
              </span>
            )}
            {fresh && !discounted && (
              <span className="badge bg-emerald-600 text-white shadow">New</span>
            )}
          </div>

          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <span className="badge bg-white/90 text-ink">{S.outOfStock}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Favorite heart */}
      <button
        type="button"
        aria-label="Add to favorites"
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 shadow backdrop-blur transition hover:scale-110"
        onClick={() => {
          const now = toggleFavorite(product.id);
          setFav(now);
        }}
      >
        <Heart size={16} className={fav ? 'fill-red-500 text-red-500' : 'text-muted'} />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/product?id=${product.id}`} className="line-clamp-2 font-medium">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{money(finalPrice, currency)}</span>
          {discounted && (
            <span className="text-sm text-muted line-through">{money(product.price, currency)}</span>
          )}
        </div>
        {lowStock && <span className="text-xs font-medium text-amber-600">Only {product.stock} left</span>}

        <button
          className="btn btn-primary mt-2 w-full"
          disabled={soldOut}
          onClick={() => {
            addToCart({ id: product.id, name: product.name, price: finalPrice, image_url: product.image_url });
            toast(`${product.name} — ${S.addedToCart}`, 'success');
          }}
        >
          {soldOut ? S.outOfStock : S.addToCart}
        </button>
      </div>
    </div>
  );
}
