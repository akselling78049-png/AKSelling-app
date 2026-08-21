import { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, Search, Loader2, Package, Truck, CheckCircle2, XCircle,
  PauseCircle, Clock, ClipboardCheck,
} from 'lucide-react';
import type { Order, OrderItem } from '@/types';
import { formatPrice, formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface SellerOrdersProps {
  orders: (Order & { items?: OrderItem[] })[];
  loading: boolean;
  onOrdersChanged: () => void;
}

type OrderStatusTab = 'pending' | 'ready_to_ship' | 'shipped' | 'cancelled' | 'on_hold';
type AllStatus = OrderStatusTab | 'delivered' | 'rto';

const statusTabs: { id: OrderStatusTab; label: string; icon: typeof Package }[] = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'ready_to_ship', label: 'Ready to Ship', icon: Package },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle },
  { id: 'on_hold', label: 'On Hold', icon: PauseCircle },
];

export default function SellerOrders({ orders, loading, onOrdersChanged }: SellerOrdersProps) {
  const [activeTab, setActiveTab] = useState<OrderStatusTab>('pending');
  const [skuSearch, setSkuSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const filtered = useMemo(() => {
    let result = orders.filter((o) => o.status === activeTab);
    if (skuSearch.trim()) {
      const q = skuSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.user_name.toLowerCase().includes(q) ||
          o.items?.some((item) => item.product_id?.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [orders, activeTab, skuSearch]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of statusTabs) {
      counts[t.id] = orders.filter((o) => o.status === t.id).length;
    }
    return counts;
  }, [orders]);

  // Dispatch health: ratio of shipped+delivered to total non-cancelled
  const totalShippable = orders.filter((o) => !['cancelled', 'on_hold'].includes(o.status)).length;
  const totalShipped = orders.filter((o) => ['shipped', 'delivered'].includes(o.status)).length;
  const dispatchHealth = totalShippable > 0 ? Math.round((totalShipped / totalShippable) * 100) : 0;

  async function updateStatus(orderId: string, status: AllStatus) {
    setUpdating(true);
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setUpdating(false);
    onOrdersChanged();
  }

  const statusOptions: AllStatus[] = ['pending', 'ready_to_ship', 'shipped', 'cancelled', 'on_hold', 'delivered', 'rto'];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
        {statusTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tabCounts[tab.id] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {tabCounts[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SKU search + dispatch health */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            placeholder="Search by Order ID, Customer, or SKU ID..."
            className="input-field pl-10"
          />
        </div>
        <button
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:border-brand-300 hover:text-brand-600"
          title="Dispatch Health: percentage of shippable orders that have been shipped"
        >
          <ClipboardCheck className="h-4 w-4" />
          Dispatch Health: <span className="font-bold text-brand-600">{dispatchHealth}%</span>
        </button>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No {activeTab.replace('_', ' ')} orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Package className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm font-semibold text-gray-900">{order.user_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
                  {expandedOrder === order.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-4">
                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-400">Customer</p>
                      <p className="text-gray-900">{order.user_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Mobile</p>
                      <p className="text-gray-900">{order.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-gray-400">Address</p>
                      <p className="text-gray-900">{order.address} — {order.pincode}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400">Payment</p>
                      <p className="text-gray-900">{order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'}</p>
                    </div>
                  </div>

                  <div className="mb-3 space-y-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>{item.product_title}{item.size ? ` (${item.size})` : ''} x {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-400">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order.id, status)}
                          disabled={updating}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                            order.status === status
                              ? status === 'delivered'
                                ? 'bg-success-500 text-white'
                                : status === 'shipped'
                                  ? 'bg-brand-600 text-white'
                                  : status === 'cancelled'
                                    ? 'bg-error-500 text-white'
                                    : status === 'rto'
                                      ? 'bg-error-500 text-white'
                                      : status === 'on_hold'
                                        ? 'bg-warning-500 text-white'
                                        : status === 'ready_to_ship'
                                          ? 'bg-accent-500 text-white'
                                          : 'bg-gray-600 text-white'
                              : 'border border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
