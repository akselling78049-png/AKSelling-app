import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, size: string | null) => void;
  removeFromCart: (productId: string, size: string | null) => void;
  updateQuantity: (productId: string, size: string | null, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('akselling_cart');
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  function persist(next: CartItem[]) {
    setItems(next);
    localStorage.setItem('akselling_cart', JSON.stringify(next));
  }

  function addToCart(product: Product, quantity: number, size: string | null) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.size === size);
      let next: CartItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
      } else {
        next = [...prev, { product, quantity, size }];
      }
      persist(next);
      return next;
    });
  }

  function removeFromCart(productId: string, size: string | null) {
    setItems((prev) => {
      const next = prev.filter((i) => !(i.product.id === productId && i.size === size));
      persist(next);
      return next;
    });
  }

  function updateQuantity(productId: string, size: string | null, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setItems((prev) => {
      const next = prev.map((i) =>
        i.product.id === productId && i.size === size ? { ...i, quantity } : i,
      );
      persist(next);
      return next;
    });
  }

  function clearCart() {
    persist([]);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => {
    const price = i.product.discounted_price && i.product.discounted_price < i.product.price
      ? i.product.discounted_price
      : i.product.price;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
