import { useState, useEffect } from 'react';
import {
  User, Package, LogOut, Mail, Phone, ShieldCheck, Loader2, Store,
  ChevronRight, MapPin, CreditCard, Globe, Edit3, ArrowLeftRight, X, Save,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate } from '@/lib/format';
import type { Order, OrderItem, PageTab } from '@/types';

interface AccountPageProps {
  onNavigate: (tab: PageTab) => void;
  onOpenSeller: () => void;
  onRegisterSeller: () => void;
}

type ModalType = 'edit_profile' | 'addresses' | 'payments' | 'language' | null;

export default function AccountPage({ onNavigate, onOpenSeller, onRegisterSeller }: AccountPageProps) {
  const { session, profile, loading, signIn, signUp, signOut, refreshProfile } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [orders, setOrders] = useState<(Order & { items?: OrderItem[] })[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [language, setLanguage] = useState('English');

  // Address form
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    pincode: '',
    address: '',
    city: '',
    state: '',
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data: addrRows } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setSavedAddresses(addrRows ?? []);
    })();
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    setOrdersLoading(true);
    (async () => {
      const { data: orderRows } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (orderRows && orderRows.length > 0) {
        const orderIds = orderRows.map((o) => o.id);
        const { data: itemRows } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);

        const itemsByOrder = (itemRows ?? []).reduce<Record<string, OrderItem[]>>((acc, item) => {
          const key = (item as OrderItem).order_id;
          (acc[key] ??= []).push(item as OrderItem);
          return acc;
        }, {});

        setOrders(orderRows.map((o) => ({ ...(o as Order), items: itemsByOrder[o.id] ?? [] })));
      } else {
        setOrders([]);
      }
      setOrdersLoading(false);
    })();
  }, [session?.user]);

  async function handleAuth() {
    setAuthError(null);
    setAuthLoading(true);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);
    setAuthLoading(false);
    if (result.error) {
      setAuthError(result.error);
    } else if (mode === 'signup') {
      setAuthError('Account created! Please sign in.');
      setMode('signin');
    }
  }

  function openEditModal() {
    setEditName(profile?.full_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setModalError(null);
    setModalSuccess(false);
    setOpenModal('edit_profile');
  }

  async function saveProfile() {
    if (!session?.user) return;
    if (!editName.trim()) { setModalError('Name is required.'); return; }
    setSaving(true);
    setModalError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName.trim(), phone: editPhone.trim() || null })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) { setModalError(error.message); return; }
    await refreshProfile();
    setModalSuccess(true);
    setTimeout(() => { setModalSuccess(false); setOpenModal(null); }, 1500);
  }

  function openAddressModal() {
    setAddressForm({ name: '', phone: '', pincode: '', address: '', city: '', state: '' });
    setModalError(null);
    setOpenModal('addresses');
  }

  async function saveAddress() {
    if (!session?.user) return;
    if (!addressForm.name.trim() || !addressForm.phone.trim() || !addressForm.pincode.trim() || !addressForm.address.trim()) {
      setModalError('Name, phone, pincode, and address are required.');
      return;
    }
    setSaving(true);
    setModalError(null);
    const { data, error } = await supabase
      .from('saved_addresses')
      .insert({
        user_id: session.user.id,
        name: addressForm.name.trim(),
        phone: addressForm.phone.trim(),
        pincode: addressForm.pincode.trim(),
        address: addressForm.address.trim(),
        city: addressForm.city.trim() || null,
        state: addressForm.state.trim() || null,
      })
      .select();
    setSaving(false);
    if (error) { setModalError(error.message); return; }
    setSavedAddresses([...savedAddresses, data?.[0]]);
    setModalSuccess(true);
    setTimeout(() => { setModalSuccess(false); setOpenModal(null); }, 1500);
  }

  async function saveLanguage() {
    setSaving(true);
    setModalError(null);
    // Language is stored client-side only (no DB column needed)
    localStorage.setItem('app_language', language);
    setSaving(false);
    setModalSuccess(true);
    setTimeout(() => { setModalSuccess(false); setOpenModal(null); }, 1000);
  }

  useEffect(() => {
    const saved = localStorage.getItem('app_language');
    if (saved) setLanguage(saved);
  }, []);

  const accountSections: { id: ModalType; label: string; icon: typeof Edit3; desc: string }[] = [
    { id: 'edit_profile', label: 'Edit Profile', icon: Edit3, desc: 'Name, phone, email' },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin, desc: 'Manage delivery addresses' },
    { id: 'payments', label: 'Saved Payments', icon: CreditCard, desc: 'Cards, UPI, wallets' },
    { id: 'language', label: 'Language Settings', icon: Globe, desc: 'Choose your language' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="card p-6">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-brand-50 p-3">
              <User className="h-8 w-8 text-brand-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === 'signin'
                ? 'Sign in to track orders and checkout faster'
                : 'Join AKSeling to start shopping'}
            </p>
          </div>

          <div className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="input-field"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>

            {authError && (
              <div className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700">{authError}</div>
            )}

            <button
              onClick={handleAuth}
              disabled={authLoading || !email || !password}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3"
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Please wait...
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-center text-sm text-gray-500">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setAuthError(null);
                }}
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4">
      {/* Profile card with Exchange button */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
            {(profile?.full_name ?? session.user.email ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{profile?.full_name ?? 'User'}</h1>
            <div className="mt-1 flex flex-col gap-0.5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {session.user.email}
              </span>
              {profile?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </span>
              )}
            </div>
          </div>
          {/* Exchange / Switch Mode button */}
          {profile?.role === 'seller' && (
            <button
              onClick={onOpenSeller}
              className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100 active:scale-95"
              title="Switch to Seller Dashboard"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Exchange
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {profile?.role !== 'seller' && (
            <button
              onClick={onRegisterSeller}
              className="btn-outline flex items-center justify-center gap-2 text-sm"
            >
              <Store className="h-4 w-4" />
              AKSeling par beche
            </button>
          )}
          {profile?.role === 'seller' && (
            <button
              onClick={onOpenSeller}
              className="btn-primary flex items-center justify-center gap-2 text-sm"
            >
              <Store className="h-4 w-4" />
              Open Seller Dashboard
            </button>
          )}
          <button
            onClick={signOut}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Settings sections — Flipkart style */}
      <div className="mt-5">
        <h2 className="mb-3 text-base font-bold text-gray-900">Account Settings</h2>
        <div className="card divide-y divide-gray-100">
          {accountSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setModalError(null);
                  setModalSuccess(false);
                  if (section.id === 'edit_profile') openEditModal();
                  else if (section.id === 'addresses') openAddressModal();
                  else if (section.id === 'payments') setOpenModal('payments');
                  else if (section.id === 'language') setOpenModal('language');
                }}
                className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-gray-50"
              >
                <div className="rounded-lg bg-brand-50 p-2">
                  <Icon className="h-4 w-4 text-brand-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{section.label}</p>
                  <p className="text-xs text-gray-400">{section.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders */}
      <div className="mt-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
          <Package className="h-5 w-5 text-brand-600" />
          My Orders
        </h2>

        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <Package className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No orders yet. Start shopping!</p>
            <button onClick={() => onNavigate('home')} className="btn-primary">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400">Order ID: {order.id.slice(0, 8)}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(order.created_at)}</p>
                  </div>
                  <span
                    className={`badge ${
                      order.status === 'delivered'
                        ? 'bg-success-50 text-success-700'
                        : order.status === 'shipped'
                          ? 'bg-warning-50 text-warning-600'
                          : order.status === 'cancelled' || order.status === 'rto'
                            ? 'bg-error-50 text-error-700'
                            : 'bg-gray-100 text-gray-600'
                    } capitalize`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span className="line-clamp-1 pr-2">
                        {item.product_title}
                        {item.size ? ` (${item.size})` : ''} x {item.quantity}
                      </span>
                      <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                  </span>
                  <span className="text-base font-bold text-gray-900">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {openModal === 'edit_profile' && 'Edit Profile'}
                {openModal === 'addresses' && 'Saved Addresses'}
                {openModal === 'payments' && 'Saved Payments'}
                {openModal === 'language' && 'Language Settings'}
              </h2>
              <button onClick={() => setOpenModal(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Edit Profile */}
            {openModal === 'edit_profile' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Full Name *</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Email (not editable)</label>
                  <input type="email" value={session.user.email ?? ''} disabled className="input-field bg-gray-100 text-gray-400" />
                </div>
                <button onClick={saveProfile} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
                  {saving ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save</>}
                </button>
              </div>
            )}

            {/* Saved Addresses */}
            {openModal === 'addresses' && (
              <div className="space-y-3">
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    {savedAddresses.map((addr, i) => (
                      <div key={i} className="rounded-lg border border-gray-200 p-3 text-sm">
                        <p className="font-medium text-gray-900">{addr.name} - {addr.phone}</p>
                        <p className="text-gray-500">{addr.address}, {addr.city ?? ''} - {addr.pincode}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Add New Address</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Name" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} className="input-field" />
                      <input type="tel" placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="input-field" />
                    </div>
                    <input type="text" placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="input-field" />
                    <textarea placeholder="Full address" value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} className="input-field min-h-[60px]" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} className="input-field" />
                      <input type="text" placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} className="input-field" />
                    </div>
                    <button onClick={saveAddress} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
                      {saving ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save Address</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Saved Payments */}
            {openModal === 'payments' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Your saved payment methods will appear here.</p>
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                  <CreditCard className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-400">No saved payment methods yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Saved cards and UPI IDs from checkout will appear here.</p>
                </div>
              </div>
            )}

            {/* Language Settings */}
            {openModal === 'language' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Choose your preferred language:</p>
                {['English', 'हिन्दी (Hindi)', 'தமிழ் (Tamil)', 'తెలుగు (Telugu)', 'বাংলা (Bengali)', 'मराठी (Marathi)'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-sm transition-all ${
                      language === lang ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {lang}
                    {language === lang && <ShieldCheck className="h-4 w-4 text-brand-600" />}
                  </button>
                ))}
                <button onClick={saveLanguage} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
                  {saving ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save</>}
                </button>
              </div>
            )}

            {modalError && <div className="mt-3 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700">{modalError}</div>}
            {modalSuccess && <div className="mt-3 rounded-lg bg-success-50 px-4 py-2.5 text-sm text-success-700">Saved successfully!</div>}
          </div>
        </div>
      )}
    </div>
  );
}
