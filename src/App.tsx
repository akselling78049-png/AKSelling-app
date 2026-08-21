import { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import WhatsAppButton from '@/components/WhatsAppButton';
import HomePage from '@/pages/HomePage';
import CategoriesPage from '@/pages/CategoriesPage';
import DealsPage from '@/pages/DealsPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AccountPage from '@/pages/AccountPage';
import SellerDashboard from '@/pages/SellerDashboard';
import SellerRegistration from '@/pages/SellerRegistration';
import ProductDetail from '@/components/ProductDetail';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import type { Product, PageTab } from '@/types';

type View =
  | { type: 'tab'; tab: PageTab }
  | { type: 'product'; product: Product }
  | { type: 'checkout' }
  | { type: 'seller' }
  | { type: 'seller_registration' };

function AppContent() {
  const [view, setView] = useState<View>({ type: 'tab', tab: 'home' });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const { totalItems, addToCart } = useCart();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();

    // Real-time subscription: instantly reflect any product INSERT / UPDATE / DELETE
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
        setProducts((prev) => {
          if (prev.some((p) => p.id === (payload.new as Product).id)) return prev;
          return [payload.new as Product, ...prev];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setProducts((prev) => prev.map((p) => (p.id === (payload.new as Product).id ? (payload.new as Product) : p)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload) => {
        setProducts((prev) => prev.filter((p) => p.id !== (payload.old as Product).id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProducts]);

  const activeTab: PageTab =
    view.type === 'tab'
      ? view.tab
      : view.type === 'checkout'
        ? 'cart'
        : view.type === 'seller' || view.type === 'seller_registration'
          ? 'account'
          : 'home';

  function navigate(tab: PageTab) {
    setView({ type: 'tab', tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openProduct(product: Product) {
    setView({ type: 'product', product });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAddToCart(quantity: number, size: string | null) {
    if (view.type === 'product') {
      addToCart(view.product, quantity, size);
    }
  }

  function handleBuyNow(quantity: number, size: string | null) {
    if (view.type === 'product') {
      addToCart(view.product, quantity, size);
      setView({ type: 'checkout' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleVideoBuyNow(product: Product) {
    addToCart(product, 1, product.sizes.length > 0 ? product.sizes[0] : null);
    setView({ type: 'checkout' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header onNavigate={navigate} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="flex-1 pb-20">
        {view.type === 'product' ? (
          <ProductDetail
            product={view.product}
            onBack={() => setView({ type: 'tab', tab: 'home' })}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        ) : view.type === 'checkout' ? (
          <CheckoutPage onBack={() => setView({ type: 'tab', tab: 'cart' })} onNavigate={navigate} />
        ) : view.type === 'seller' ? (
          <SellerDashboard onNavigate={navigate} />
        ) : view.type === 'seller_registration' ? (
          <SellerRegistration
            onBack={() => setView({ type: 'tab', tab: 'account' })}
            onComplete={() => setView({ type: 'seller' })}
            onNavigate={navigate}
          />
        ) : view.tab === 'home' ? (
          <HomePage
            products={filteredProducts}
            loading={loading}
            onProductClick={openProduct}
            onCategoryClick={(cat) => {
              setCategoryFilter(cat);
              setView({ type: 'tab', tab: 'categories' });
            }}
            onSeeDeals={() => setView({ type: 'tab', tab: 'deals' })}
            onBuyNow={handleVideoBuyNow}
          />
        ) : view.tab === 'categories' ? (
          <CategoriesPage
            products={products}
            loading={loading}
            onProductClick={openProduct}
            initialCategory={categoryFilter}
          />
        ) : view.tab === 'deals' ? (
          <DealsPage products={products} loading={loading} onProductClick={openProduct} />
        ) : view.tab === 'cart' ? (
          <CartPage onNavigate={navigate} onCheckout={() => setView({ type: 'checkout' })} />
        ) : view.tab === 'account' ? (
          <AccountPage
            onNavigate={navigate}
            onOpenSeller={() => setView({ type: 'seller' })}
            onRegisterSeller={() => setView({ type: 'seller_registration' })}
          />
        ) : null}
      </main>

      <BottomNav activeTab={activeTab} onNavigate={navigate} cartCount={totalItems} />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
