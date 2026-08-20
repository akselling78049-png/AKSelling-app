import {
  Clock, Download, PackageX, AlertTriangle, ScanLine, TrendingUp, TrendingDown,
  ShoppingBag, IndianRupee, Loader2, Diamond, ChevronRight,
} from 'lucide-react';
import type { Product, Order, ReturnRecord, SellerBusinessProfile } from '@/types';
import { formatPrice } from '@/lib/format';

interface SellerHomeProps {
  products: Product[];
  orders: (Order & { items?: any[] })[];
  returns: ReturnRecord[];
  businessProfile: SellerBusinessProfile | null;
  loading: boolean;
  onNavigateTab: (tab: 'home' | 'orders' | 'returns' | 'inventory' | 'menu') => void;
}

export default function SellerHome({ products, orders, returns, businessProfile, loading, onNavigateTab }: SellerHomeProps) {
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const readyToShip = orders.filter((o) => o.status === 'ready_to_ship');

  // Business insights (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentOrders = orders.filter(
    (o) => new Date(o.created_at) >= thirtyDaysAgo && o.status !== 'cancelled' && o.status !== 'rto',
  );
  const totalSales = recentOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalOrders = recentOrders.length;

  // Previous 30 days for comparison
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const prevOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo && o.status !== 'cancelled' && o.status !== 'rto';
  });
  const prevSales = prevOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const salesGrowth = prevSales > 0 ? Math.round(((totalSales - prevSales) / prevSales) * 100) : 0;
  const ordersGrowth = prevOrders.length > 0 ? Math.round(((totalOrders - prevOrders.length) / prevOrders.length) * 100) : 0;

  // Simple sales graph data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayOrders = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od.toDateString() === d.toDateString() && o.status !== 'cancelled' && o.status !== 'rto';
    });
    return {
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      count: dayOrders.length,
    };
  });
  const maxBar = Math.max(...last7Days.map((d) => d.value), 1);

  const todoCards = [
    { label: 'Pending Orders', count: pendingOrders.length, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50', tab: 'orders' as const },
    { label: 'Download Labels', count: readyToShip.length, icon: Download, color: 'text-brand-600', bg: 'bg-brand-50', tab: 'orders' as const },
    { label: 'Out of Stock', count: outOfStock.length, icon: PackageX, color: 'text-error-600', bg: 'bg-error-50', tab: 'inventory' as const },
    { label: 'Low Stock', count: lowStock.length, icon: AlertTriangle, color: 'text-accent-600', bg: 'bg-accent-50', tab: 'inventory' as const },
    { label: 'Branded Packets', count: 0, icon: ScanLine, color: 'text-success-600', bg: 'bg-success-50', tab: 'orders' as const },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Business branding header — clean top, no clutter */}
      {businessProfile && (
        <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Diamond className="h-6 w-6 fill-white/90 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-extrabold">{businessProfile.business_name}</h2>
              {businessProfile.tagline && (
                <p className="text-xs text-white/80">{businessProfile.tagline}</p>
              )}
            </div>
            <span className="badge bg-white/15 text-white">
              Diamond L{businessProfile.diamond_level}
            </span>
          </div>
        </div>
      )}

      {/* Sales Graph — summary at top, clean */}
      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Sales Tracking (Last 7 Days)</h3>
          <button onClick={() => onNavigateTab('menu')} className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Full Dashboard →
          </button>
        </div>
        <div className="flex items-end justify-between gap-2" style={{ height: '140px' }}>
          {last7Days.map((day, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all hover:from-brand-700 hover:to-brand-500"
                  style={{ height: `${(day.value / maxBar) * 100}%`, minHeight: day.value > 0 ? '8px' : '2px' }}
                  title={`${day.label}: ${formatPrice(day.value)} (${day.count} orders)`}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-400">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card flex items-center gap-2 p-3">
          <ShoppingBag className="h-4 w-4 text-brand-600" />
          <div>
            <p className="text-xs text-gray-500">Products</p>
            <p className="text-sm font-bold text-gray-900">{products.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-2 p-3">
          <IndianRupee className="h-4 w-4 text-success-600" />
          <div>
            <p className="text-xs text-gray-500">Avg Order</p>
            <p className="text-sm font-bold text-gray-900">{formatPrice(totalOrders > 0 ? totalSales / totalOrders : 0)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-2 p-3">
          <PackageX className="h-4 w-4 text-error-600" />
          <div>
            <p className="text-xs text-gray-500">RTO/Returns</p>
            <p className="text-sm font-bold text-gray-900">{returns.length}</p>
          </div>
        </div>
        <button onClick={() => onNavigateTab('returns')} className="card flex items-center gap-2 p-3 transition-all hover:shadow-md">
          <ChevronRight className="h-4 w-4 text-brand-600" />
          <div>
            <p className="text-xs text-gray-500">Return Rate</p>
            <p className="text-sm font-bold text-gray-900">
              {orders.length > 0 ? Math.round((returns.length / orders.length) * 100) : 0}%
            </p>
          </div>
        </button>
      </div>

      {/* Business Insights — moved down */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-900">Business Insights</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Views */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Views (30 days)</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders * 15}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${ordersGrowth >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {ordersGrowth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(ordersGrowth)}%
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Orders</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${ordersGrowth >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {ordersGrowth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(ordersGrowth)}%
              </div>
            </div>
          </div>

          {/* Sales */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Sales (30 days)</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatPrice(totalSales)}</p>
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold ${salesGrowth >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {salesGrowth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(salesGrowth)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* To-Do List Cards — moved to bottom */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-gray-900">To-Do List</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {todoCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => onNavigateTab(card.tab)}
                className="card flex flex-col items-center gap-2 p-4 transition-all hover:shadow-md active:scale-95"
              >
                <div className={`rounded-full ${card.bg} p-2.5`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className="text-2xl font-extrabold text-gray-900">{card.count}</span>
                <span className="text-center text-xs font-medium text-gray-500">{card.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
