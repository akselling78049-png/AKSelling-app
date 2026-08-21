import { useState } from 'react';
import { Store, Home, Truck, RotateCcw, Package, Menu as MenuIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSellerData } from '@/hooks/useSellerData';
import SellerHome from '@/components/seller/SellerHome';
import SellerOrders from '@/components/seller/SellerOrders';
import SellerReturns from '@/components/seller/SellerReturns';
import SellerInventory from '@/components/seller/SellerInventory';
import SellerMenu from '@/components/seller/SellerMenu';
import type { PageTab, SellerDashboardTab } from '@/types';

interface SellerDashboardProps {
  onNavigate: (tab: PageTab) => void;
}

const navTabs: { id: SellerDashboardTab; label: string; icon: typeof Store }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'orders', label: 'Orders', icon: Truck },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'menu', label: 'Menu', icon: MenuIcon },
];

export default function SellerDashboard({ onNavigate }: SellerDashboardProps) {
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<SellerDashboardTab>('home');
  const sellerData = useSellerData();

  if (authLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  if (profile?.role !== 'seller') {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <div className="rounded-full bg-warning-50 p-4"><Store className="h-8 w-8 text-warning-600" /></div>
          <h1 className="text-lg font-bold text-gray-900">Seller Access Required</h1>
          <p className="text-sm text-gray-500">Sign in and complete seller registration from the Account tab.</p>
          <button onClick={() => onNavigate('account')} className="btn-primary">Go to Account</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-2">
        <Store className="h-6 w-6 text-brand-600" />
        <h1 className="text-xl font-bold text-gray-900">AKSeling Seller</h1>
      </div>

      {/* Tab navigation */}
      <div className="no-scrollbar -mx-3 mb-4 flex gap-1 overflow-x-auto px-3">
        {navTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === t.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'home' && (
        <SellerHome
          products={sellerData.products}
          orders={sellerData.orders}
          returns={sellerData.returns}
          businessProfile={sellerData.businessProfile}
          loading={sellerData.loading}
          onNavigateTab={setTab}
        />
      )}
      {tab === 'orders' && (
        <SellerOrders
          orders={sellerData.orders}
          loading={sellerData.loading}
          onOrdersChanged={sellerData.reload}
        />
      )}
      {tab === 'returns' && (
        <SellerReturns
          returns={sellerData.returns}
          orders={sellerData.orders}
          loading={sellerData.loading}
          onReturnsChanged={sellerData.reload}
        />
      )}
      {tab === 'inventory' && (
        <SellerInventory
          products={sellerData.products}
          loading={sellerData.loading}
          onProductsChanged={sellerData.reload}
        />
      )}
      {tab === 'menu' && (
        <SellerMenu
          businessProfile={sellerData.businessProfile}
          bankDetails={sellerData.bankDetails}
          onReloadBusiness={sellerData.reloadBusiness}
          products={sellerData.products}
          orders={sellerData.orders}
          returns={sellerData.returns}
        />
      )}
    </div>
  );
}
