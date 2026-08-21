import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { formatPrice, discountPercent, effectivePrice } from '@/lib/format';

interface DealsPageProps {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
}

export default function DealsPage({ products, loading, onProductClick }: DealsPageProps) {
  const deals = products.filter((p) => p.is_deal || (p.discounted_price && p.discounted_price < p.price));
  const sorted = [...deals].sort((a, b) => {
    const da = discountPercent(a.price, a.discounted_price);
    const db = discountPercent(b.price, b.discounted_price);
    return db - da;
  });

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      <div className="mb-4 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 p-5 text-white shadow-lg">
        <h1 className="text-xl font-extrabold sm:text-2xl">बेहतरीन डील — Best Deals</h1>
        <p className="text-sm text-white/90">Biggest discounts on dispatched and ready-to-ship items</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="space-y-2 p-2.5">
                <div className="h-3 w-3/4 rounded bg-gray-100" />
                <div className="h-4 w-1/3 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No deals available right now.</p>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">{sorted.length} deals</span>
            <span>• sorted by biggest discount</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((product) => {
              const discount = discountPercent(product.price, product.discounted_price);
              const price = effectivePrice(product);
              return (
                <div key={product.id} className="relative">
                  <ProductCard product={product} onClick={() => onProductClick(product)} />
                  {discount > 0 && (
                    <div className="absolute bottom-2 right-2 rounded-lg bg-accent-50 px-2 py-1 text-xs font-bold text-accent-600">
                      Save {formatPrice(product.price - price)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
