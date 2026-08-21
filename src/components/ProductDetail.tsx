import { Star, Minus, Plus, ShoppingCart, Zap, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';
import { formatPrice, discountPercent, effectivePrice } from '@/lib/format';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (quantity: number, size: string | null) => void;
  onBuyNow: (quantity: number, size: string | null) => void;
}

export default function ProductDetail({ product, onBack, onAddToCart, onBuyNow }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes.length > 0 ? product.sizes[0] : null,
  );
  const [added, setAdded] = useState(false);

  const discount = discountPercent(product.price, product.discounted_price);
  const price = effectivePrice(product);
  const outOfStock = product.stock === 0;

  function handleAddToCart() {
    onAddToCart(quantity, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mx-auto max-w-4xl px-3 pb-6 pt-3 sm:px-4">
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="relative aspect-square bg-gray-50">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                No image
              </div>
            )}
            {discount > 0 && (
              <span className="absolute left-3 top-3 badge bg-accent-500 text-white">
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {product.category}
          </span>
          <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{product.title}</h1>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded bg-success-500 px-2 py-0.5">
              <span className="text-sm font-bold text-white">{product.rating.toFixed(1)}</span>
              <Star className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            <span className="text-sm text-gray-500">
              {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(price)}</span>
            {discount > 0 && (
              <>
                <span className="text-base text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm font-semibold text-accent-600">{discount}% off</span>
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{product.description}</p>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900">Select Size</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[44px] rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900">Quantity</h3>
            <div className="mt-2 inline-flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-gray-600 transition-colors hover:text-brand-600 disabled:opacity-40"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[40px] text-center text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                className="p-2.5 text-gray-600 transition-colors hover:text-brand-600 disabled:opacity-40"
                disabled={outOfStock || quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="btn-outline flex flex-1 items-center justify-center gap-2"
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" />
                  Added!
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={() => onBuyNow(quantity, selectedSize)}
              disabled={outOfStock}
              className="btn-primary flex flex-1 items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5" />
              Abhi Kharide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
