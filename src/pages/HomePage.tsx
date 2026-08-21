import { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Truck, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import VideoFeed from '@/components/VideoFeed';

interface HomePageProps {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  onCategoryClick: (category: string) => void;
  onSeeDeals: () => void;
  onBuyNow: (product: Product) => void;
}

const categories = [
  { name: 'Fashion', icon: '👕' },
  { name: 'Footwear', icon: '👟' },
  { name: 'Electronics', icon: '📱' },
  { name: 'Accessories', icon: '⌚' },
];

const banners = [
  {
    title: 'Mega Fashion Sale',
    subtitle: 'Up to 70% OFF on trending styles',
    bg: 'from-brand-600 to-brand-800',
  },
  {
    title: 'Electronics Bonanza',
    subtitle: 'Latest gadgets at unbeatable prices',
    bg: 'from-accent-500 to-accent-700',
  },
  {
    title: 'New Season Arrivals',
    subtitle: 'Fresh styles just dropped — shop now',
    bg: 'from-success-500 to-success-700',
  },
];

function BannerCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div
            key={i}
            className={`relative flex w-full shrink-0 flex-col justify-center bg-gradient-to-br ${banner.bg} p-6 text-white shadow-lg`}
            style={{ minHeight: '120px' }}
          >
            <Sparkles className="mb-1 h-6 w-6 opacity-80" />
            <h2 className="text-lg font-extrabold sm:text-xl">{banner.title}</h2>
            <p className="text-sm text-white/90">{banner.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/50"
        aria-label="Previous banner"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white/50"
        aria-label="Next banner"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              current === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
            }`}
            aria-label={`Banner ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function ProductGrid({ products, loading, onProductClick, skeletonCount = 8 }: {
  products: Product[];
  loading: boolean;
  onProductClick: (p: Product) => void;
  skeletonCount?: number;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="aspect-square bg-gray-100" />
            <div className="space-y-2 p-2.5">
              <div className="h-3 w-3/4 rounded bg-gray-100" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
              <div className="h-4 w-1/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No products available yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
      ))}
    </div>
  );
}

export default function HomePage({ products, loading, onProductClick, onCategoryClick, onSeeDeals, onBuyNow }: HomePageProps) {
  // Only show active products on the customer-facing home page
  const activeProducts = products.filter((p) => p.catalog_status === 'active');

  const featured = activeProducts.filter((p) => p.is_featured).slice(0, 8);
  const featuredDisplay = featured.length > 0 ? featured : activeProducts.slice(0, 8);

  // Latest Arrivals — newest products first (already sorted by created_at desc from App)
  const latestArrivals = activeProducts.slice(0, 10);

  // All Products
  const allProducts = activeProducts;

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
      {/* Auto-sliding promo banners */}
      <BannerCarousel />

      {/* Trust badges */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="card flex flex-col items-center gap-1 p-3 text-center">
          <Truck className="h-5 w-5 text-brand-600" />
          <span className="text-xs font-medium text-gray-700">Fast Delivery</span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-3 text-center">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <span className="text-xs font-medium text-gray-700">Secure Payment</span>
        </div>
        <div className="card flex flex-col items-center gap-1 p-3 text-center">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <span className="text-xs font-medium text-gray-700">Best Prices</span>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-5">
        <h2 className="mb-3 text-base font-bold text-gray-900">Shop by Category</h2>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategoryClick(cat.name)}
              className="card flex flex-col items-center gap-1.5 p-3 transition-all hover:shadow-md active:scale-95"
            >
              <span className="text-2xl sm:text-3xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Video Feed section */}
      <div className="mt-6">
        <VideoFeed products={activeProducts} onBuyNow={onBuyNow} />
      </div>

      {/* Featured products */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Featured Products</h2>
          <button onClick={onSeeDeals} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Best Deals →
          </button>
        </div>
        <ProductGrid products={featuredDisplay} loading={loading} onProductClick={onProductClick} />
      </div>

      {/* Latest Arrivals */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold text-gray-900">Latest Arrivals</h2>
        <ProductGrid products={latestArrivals} loading={loading} onProductClick={onProductClick} skeletonCount={4} />
      </div>

      {/* All Products */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-bold text-gray-900">All Products</h2>
        <ProductGrid products={allProducts} loading={loading} onProductClick={onProductClick} />
      </div>
    </div>
  );
}
