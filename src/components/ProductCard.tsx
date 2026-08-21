import { Star } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, discountPercent, effectivePrice } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const discount = discountPercent(product.price, product.discounted_price);
  const price = effectivePrice(product);

  return (
    <button
      onClick={onClick}
      className="card group flex flex-col overflow-hidden text-left transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            <span className="text-xs">No image</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 badge bg-accent-500 text-white">
            {discount}% OFF
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-lg bg-white px-3 py-1 text-sm font-bold text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{product.title}</h3>

        <div className="mt-1 flex items-center gap-1">
          <div className="flex items-center gap-0.5 rounded bg-success-500 px-1.5 py-0.5">
            <span className="text-xs font-bold text-white">{product.rating.toFixed(1)}</span>
            <Star className="h-3 w-3 fill-white text-white" />
          </div>
          <span className="text-xs text-gray-400">• {product.category}</span>
        </div>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-900">{formatPrice(price)}</span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
