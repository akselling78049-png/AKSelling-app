import { useState } from 'react';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

interface CategoriesPageProps {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  initialCategory?: string | null;
}

export default function CategoriesPage({ products, loading, onProductClick, initialCategory }: CategoriesPageProps) {
  const allCategories = Array.from(new Set(products.map((p) => p.category)));
  const [selected, setSelected] = useState<string>(
    initialCategory && allCategories.includes(initialCategory) ? initialCategory : (allCategories[0] ?? ''),
  );

  const filtered = selected ? products.filter((p) => p.category === selected) : products;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      <h1 className="mb-4 text-lg font-bold text-gray-900">Categories</h1>

      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selected === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-300'
            }`}
          >
            {cat}
          </button>
        ))}
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
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">No products in this category.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
          ))}
        </div>
      )}
    </div>
  );
}
