import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import type { PageTab } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice, effectivePrice } from '@/lib/format';

interface CartPageProps {
  onNavigate: (tab: PageTab) => void;
  onCheckout: () => void;
}

export default function CartPage({ onNavigate, onCheckout }: CartPageProps) {
  const { items, updateQuantity, removeFromCart, totalItems, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-gray-100 p-6">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-1 text-sm text-gray-500">Add some products to get started!</p>
          </div>
          <button onClick={() => onNavigate('home')} className="btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4">
      <h1 className="mb-4 text-lg font-bold text-gray-900">
        Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </h1>

      <div className="space-y-3">
        {items.map((item) => {
          const price = effectivePrice(item.product);
          return (
            <div key={`${item.product.id}-${item.size ?? ''}`} className="card flex gap-3 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                {item.product.image_url && (
                  <img
                    src={item.product.image_url}
                    alt={item.product.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{item.product.title}</h3>
                  <button
                    onClick={() => removeFromCart(item.product.id, item.size)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-error-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {item.size && (
                  <span className="mt-0.5 text-xs text-gray-500">Size: {item.size}</span>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="inline-flex items-center rounded-lg border border-gray-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                      className="p-1.5 text-gray-600 transition-colors hover:text-brand-600"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[32px] text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                      className="p-1.5 text-gray-600 transition-colors hover:text-brand-600"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <span className="text-base font-bold text-gray-900">
                    {formatPrice(price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="card mt-4 p-4">
        <h2 className="mb-3 text-sm font-bold text-gray-900">Price Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({totalItems} items)</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery</span>
            <span className="font-medium text-success-600">FREE</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 text-base"
      >
        Proceed to Checkout
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
