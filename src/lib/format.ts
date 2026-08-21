import type { Product } from '@/types';

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountPercent(price: number, discounted: number | null): number {
  if (!discounted || discounted >= price) return 0;
  return Math.round(((price - discounted) / price) * 100);
}

export function effectivePrice(product: Pick<Product, 'price' | 'discounted_price'>): number {
  return product.discounted_price && product.discounted_price < product.price
    ? product.discounted_price
    : product.price;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
