import { useState, useMemo } from 'react';
import {
  RotateCcw, FileText, ShieldCheck, Loader2, Package, TrendingDown, IndianRupee, AlertCircle,
} from 'lucide-react';
import type { ReturnRecord, Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/format';

interface SellerReturnsProps {
  returns: (ReturnRecord & { order?: Order })[];
  orders: (Order & { items?: any[] })[];
  loading: boolean;
  onReturnsChanged: () => void;
}

type ReturnTab = 'overview' | 'return_tracking' | 'claim_tracking';

export default function SellerReturns({ returns, orders, loading }: SellerReturnsProps) {
  const [activeTab, setActiveTab] = useState<ReturnTab>('overview');

  const returnRate = orders.length > 0 ? Math.round((returns.length / orders.length) * 100) : 0;
  const approvedClaims = returns.filter((r) => r.claim_status === 'approved');
  const totalClaimAmount = approvedClaims.reduce((sum, r) => sum + Number(r.claim_amount), 0);
  const pendingReturns = returns.filter((r) => r.return_status === 'requested');
  const approvedReturns = returns.filter((r) => r.return_status === 'approved');
  const receivedReturns = returns.filter((r) => r.return_status === 'received');
  const pendingClaims = returns.filter((r) => r.claim_status === 'pending');

  const tabs: { id: ReturnTab; label: string; icon: typeof RotateCcw }[] = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'return_tracking', label: 'Return Tracking', icon: RotateCcw },
    { id: 'claim_tracking', label: 'Claim Tracking', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
        {tabs.map((tab) => {
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
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-error-600" />
                <span className="text-xs font-medium text-gray-500">Return Rate</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{returnRate}%</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-warning-600" />
                <span className="text-xs font-medium text-gray-500">Total Returns</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{returns.length}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <span className="text-xs font-medium text-gray-500">Approved Claims</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{approvedClaims.length}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-error-600" />
                <span className="text-xs font-medium text-gray-500">Claim Amount</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatPrice(totalClaimAmount)}</p>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-bold text-gray-900">Return Status Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending (Requested)</span>
                <span className="font-semibold text-warning-600">{pendingReturns.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved</span>
                <span className="font-semibold text-brand-600">{approvedReturns.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Received</span>
                <span className="font-semibold text-success-600">{receivedReturns.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Claims</span>
                <span className="font-semibold text-accent-600">{pendingClaims.length}</span>
              </div>
            </div>
          </div>

          {returns.length === 0 && (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <RotateCcw className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No returns recorded yet. Great job!</p>
            </div>
          )}
        </div>
      )}

      {/* Return Tracking */}
      {activeTab === 'return_tracking' && (
        <div>
          {returns.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <RotateCcw className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No returns to track.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {returns.map((ret) => (
                <div key={ret.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Return #{ret.id.slice(0, 8)}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        Order #{ret.order_id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(ret.created_at)}</p>
                    </div>
                    <span
                      className={`badge capitalize ${
                        ret.return_status === 'refunded'
                          ? 'bg-success-50 text-success-700'
                          : ret.return_status === 'received'
                            ? 'bg-brand-50 text-brand-700'
                            : ret.return_status === 'approved'
                              ? 'bg-accent-50 text-accent-700'
                              : ret.return_status === 'rejected'
                                ? 'bg-error-50 text-error-700'
                                : 'bg-warning-50 text-warning-600'
                      }`}
                    >
                      {ret.return_status}
                    </span>
                  </div>
                  {ret.return_reason && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {ret.return_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claim Tracking */}
      {activeTab === 'claim_tracking' && (
        <div>
          {returns.filter((r) => r.claim_status !== 'none').length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-8 text-center">
              <ShieldCheck className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">No claims filed yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {returns
                .filter((r) => r.claim_status !== 'none')
                .map((ret) => (
                  <div key={ret.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400">Claim #{ret.id.slice(0, 8)}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          Order #{ret.order_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(ret.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`badge capitalize ${
                            ret.claim_status === 'approved'
                              ? 'bg-success-50 text-success-700'
                              : ret.claim_status === 'rejected'
                                ? 'bg-error-50 text-error-700'
                                : 'bg-warning-50 text-warning-600'
                          }`}
                        >
                          {ret.claim_status}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{formatPrice(Number(ret.claim_amount))}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
