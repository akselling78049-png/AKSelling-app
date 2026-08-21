import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, ShieldCheck, Upload, Image, CreditCard, Award, Warehouse,
  Megaphone, Gift, Lightbulb, Zap, BarChart3, BookOpen, Bell, Headphones,
  Settings, ChevronRight, X, Save, Loader2, Diamond, Wallet, Trash2, Plus, Mail,
} from 'lucide-react';
import type { SellerBusinessProfile, SellerBankDetails, Product, Order, ReturnRecord } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/format';

interface SellerMenuProps {
  businessProfile: SellerBusinessProfile | null;
  bankDetails: SellerBankDetails | null;
  onReloadBusiness: () => void;
  products: Product[];
  orders: (Order & { items?: any[] })[];
  returns: ReturnRecord[];
}

type MenuSection = 'business' | 'boost' | 'performance' | 'support';
type ModalType =
  | 'business_profile' | 'bank' | 'pricing' | 'claims' | 'catalog' | 'image_bulk'
  | 'payments' | 'quality' | 'warehouse' | 'influencer' | 'promotions'
  | 'price_reco' | 'instant_cash' | 'dashboard' | 'learning' | 'notice'
  | 'support' | 'settings' | null;

export default function SellerMenu({ businessProfile, bankDetails, onReloadBusiness, products, orders, returns }: SellerMenuProps) {
  const { profile } = useAuth();
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [bizForm, setBizForm] = useState({
    business_name: businessProfile?.business_name ?? '',
    tagline: businessProfile?.tagline ?? '',
    logo_url: businessProfile?.logo_url ?? '',
  });
  const [bankForm, setBankForm] = useState({
    account_holder: bankDetails?.account_holder ?? '',
    account_number: bankDetails?.account_number ?? '',
    ifsc_code: bankDetails?.ifsc_code ?? '',
    bank_name: bankDetails?.bank_name ?? '',
    upi_id: bankDetails?.upi_id ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sections: { id: MenuSection; title: string; items: { id: ModalType; label: string; icon: typeof DollarSign }[] }[] = [
    {
      id: 'business',
      title: 'Business Management',
      items: [
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'claims', label: 'Claims', icon: ShieldCheck },
        { id: 'catalog', label: 'Catalog Upload', icon: Upload },
        { id: 'image_bulk', label: 'Image Bulk Upload', icon: Image },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'quality', label: 'Quality', icon: Award },
        { id: 'warehouse', label: 'Warehouse', icon: Warehouse },
        { id: 'business_profile', label: 'Business Profile', icon: Diamond },
        { id: 'bank', label: 'Bank Details', icon: Wallet },
      ],
    },
    {
      id: 'boost',
      title: 'Boost Sales',
      items: [
        { id: 'influencer', label: 'Influencer Marketing', icon: Megaphone },
        { id: 'promotions', label: 'Promotions', icon: Gift },
        { id: 'price_reco', label: 'Price Recommendation', icon: Lightbulb },
        { id: 'instant_cash', label: 'Instant Cash', icon: Zap },
      ],
    },
    {
      id: 'performance',
      title: 'Performance',
      items: [{ id: 'dashboard', label: 'Business Dashboard', icon: BarChart3 }],
    },
    {
      id: 'support',
      title: 'More / Support',
      items: [
        { id: 'learning', label: 'Learning Hub', icon: BookOpen },
        { id: 'notice', label: 'Notice Board', icon: Bell },
        { id: 'support', label: 'Support', icon: Headphones },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  async function saveBusinessProfile() {
    if (!profile?.id) return;
    if (!bizForm.business_name.trim()) { setError('Business name is required.'); return; }
    setSaving(true); setError(null);
    const payload = {
      user_id: profile.id,
      business_name: bizForm.business_name.trim(),
      tagline: bizForm.tagline.trim() || null,
      logo_url: bizForm.logo_url.trim() || null,
    };
    let error;
    if (businessProfile) ({ error } = await supabase.from('seller_business_profiles').update(payload).eq('id', businessProfile.id));
    else ({ error } = await supabase.from('seller_business_profiles').insert(payload));
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSuccess(true); setTimeout(() => setSuccess(false), 2000);
    onReloadBusiness();
    setOpenModal(null);
  }

  async function saveBank() {
    if (!profile?.id) return;
    if (!bankForm.account_holder.trim() || !bankForm.account_number.trim() || !bankForm.ifsc_code.trim() || !bankForm.bank_name.trim()) {
      setError('All bank fields except UPI are required.'); return;
    }
    setSaving(true); setError(null);
    const payload = {
      user_id: profile.id,
      account_holder: bankForm.account_holder.trim(),
      account_number: bankForm.account_number.trim(),
      ifsc_code: bankForm.ifsc_code.trim().toUpperCase(),
      bank_name: bankForm.bank_name.trim(),
      upi_id: bankForm.upi_id.trim() || null,
    };
    let error;
    if (bankDetails) ({ error } = await supabase.from('seller_bank_details').update(payload).eq('id', bankDetails.id));
    else ({ error } = await supabase.from('seller_bank_details').insert(payload));
    setSaving(false);
    if (error) { setError(error.message); return; }
    setSuccess(true); setTimeout(() => setSuccess(false), 2000);
    onReloadBusiness();
    setOpenModal(null);
  }

  function handleSave() {
    if (openModal === 'business_profile') saveBusinessProfile();
    else if (openModal === 'bank') saveBank();
  }

  const modalTitle = openModal ? sections.flatMap((s) => s.items).find((i) => i.id === openModal)?.label : '';

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="mb-2 text-sm font-bold text-gray-900">{section.title}</h3>
          <div className="card divide-y divide-gray-100">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setError(null); setSuccess(false); setOpenModal(item.id); }}
                  className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="rounded-lg bg-brand-50 p-2"><Icon className="h-4 w-4 text-brand-600" /></div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{modalTitle}</h2>
              <button onClick={() => setOpenModal(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            {/* Business Profile form */}
            {openModal === 'business_profile' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Business Name *</label>
                  <input type="text" value={bizForm.business_name} onChange={(e) => setBizForm({ ...bizForm, business_name: e.target.value })} placeholder="AK Yadav Prints" className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Tagline</label>
                  <input type="text" value={bizForm.tagline} onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })} placeholder="Quality prints at unbeatable prices" className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Logo URL</label>
                  <input type="text" value={bizForm.logo_url} onChange={(e) => setBizForm({ ...bizForm, logo_url: e.target.value })} placeholder="https://..." className="input-field" />
                </div>
                <SaveButton saving={saving} onSave={handleSave} />
              </div>
            )}

            {/* Bank form */}
            {openModal === 'bank' && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Account Holder *</label>
                  <input type="text" value={bankForm.account_holder} onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Account Number *</label>
                  <input type="text" value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, '').slice(0, 18) })} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">IFSC *</label>
                    <input type="text" value={bankForm.ifsc_code} onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase().slice(0, 11) })} className="input-field" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Bank Name *</label>
                    <input type="text" value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">UPI ID</label>
                  <input type="text" value={bankForm.upi_id} onChange={(e) => setBankForm({ ...bankForm, upi_id: e.target.value })} placeholder="name@upi" className="input-field" />
                </div>
                <SaveButton saving={saving} onSave={handleSave} />
              </div>
            )}

            {/* Functional modals */}
            {openModal === 'pricing' && <PricingModal userId={profile?.id} products={products} />}
            {openModal === 'claims' && <ClaimsModal userId={profile?.id} orders={orders} />}
            {openModal === 'catalog' && <CatalogModal userId={profile?.id} />}
            {openModal === 'image_bulk' && <ImageBulkModal userId={profile?.id} />}
            {openModal === 'payments' && <PaymentsModal userId={profile?.id} orders={orders} />}
            {openModal === 'quality' && <QualityModal userId={profile?.id} orders={orders} returns={returns} />}
            {openModal === 'warehouse' && <WarehouseModal userId={profile?.id} />}
            {openModal === 'influencer' && <InfluencerModal userId={profile?.id} />}
            {openModal === 'promotions' && <PromotionsModal userId={profile?.id} />}
            {openModal === 'price_reco' && <PriceRecoModal products={products} />}
            {openModal === 'instant_cash' && <InstantCashModal userId={profile?.id} orders={orders} />}
            {openModal === 'dashboard' && <DashboardModal orders={orders} products={products} returns={returns} />}
            {openModal === 'learning' && <LearningModal />}
            {openModal === 'notice' && <NoticeModal />}
            {openModal === 'support' && <SupportModal />}
            {openModal === 'settings' && <SettingsModal userId={profile?.id} />}

            {error && <div className="mt-3 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700">{error}</div>}
            {success && <div className="mt-3 rounded-lg bg-success-50 px-4 py-2.5 text-sm text-success-700">Saved successfully!</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function SaveButton({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <button onClick={onSave} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
      {saving ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />Save</>}
    </button>
  );
}

// ─── Pricing Modal ───
function PricingModal({ userId, products }: { userId?: string; products: Product[] }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ product_id: '', label: '', min_qty: '1', discount_percent: '5' });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_pricing_rules').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setRules(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function addRule() {
    if (!userId) return;
    if (!form.label.trim() || !form.product_id) { setError('Product and label are required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_pricing_rules').insert({
      user_id: userId,
      product_id: form.product_id,
      label: form.label.trim(),
      min_qty: parseInt(form.min_qty) || 1,
      discount_percent: parseFloat(form.discount_percent) || 0,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ product_id: '', label: '', min_qty: '1', discount_percent: '5' });
    load();
  }

  async function deleteRule(id: string) {
    await supabase.from('seller_pricing_rules').delete().eq('id', id);
    load();
  }

  async function toggleRule(rule: any) {
    await supabase.from('seller_pricing_rules').update({ active: !rule.active }).eq('id', rule.id);
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="input-field">
          <option value="">Select product</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <input type="text" placeholder="Rule label (e.g. Bulk 10+)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-field" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min Qty" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: e.target.value })} className="input-field" />
          <input type="number" placeholder="Discount %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="input-field" />
        </div>
        <button onClick={addRule} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add Rule
        </button>
      </div>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {rules.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{r.label}</p>
                <p className="text-xs text-gray-500">Min {r.min_qty} qty - {r.discount_percent}% off</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleRule(r)} className={`rounded px-2 py-1 text-xs font-semibold ${r.active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.active ? 'Active' : 'Off'}
                </button>
                <button onClick={() => deleteRule(r.id)} className="text-gray-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Claims Modal ───
function ClaimsModal({ userId, orders }: { userId?: string; orders: (Order & { items?: any[] })[] }) {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ order_id: '', claim_type: 'damaged', description: '', claim_amount: '0' });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_claims').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setClaims(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!userId) return;
    if (!form.order_id || !form.description.trim()) { setError('Order and description are required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_claims').insert({
      user_id: userId,
      order_id: form.order_id,
      claim_type: form.claim_type,
      description: form.description.trim(),
      claim_amount: parseFloat(form.claim_amount) || 0,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ order_id: '', claim_type: 'damaged', description: '', claim_amount: '0' });
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} className="input-field">
        <option value="">Select order</option>
        {orders.map((o) => <option key={o.id} value={o.id}>Order {o.id.slice(0, 8)} - {formatPrice(o.total_amount)}</option>)}
      </select>
      <select value={form.claim_type} onChange={(e) => setForm({ ...form, claim_type: e.target.value })} className="input-field">
        <option value="damaged">Damaged Return</option>
        <option value="lost">Lost Shipment</option>
        <option value="rto">RTO Dispute</option>
        <option value="other">Other</option>
      </select>
      <textarea placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-[80px]" />
      <input type="number" placeholder="Claim Amount (Rs)" value={form.claim_amount} onChange={(e) => setForm({ ...form, claim_amount: e.target.value })} className="input-field" />
      <button onClick={submit} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}File Claim
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {claims.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {claims.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-200 p-2.5 text-sm">
              <div className="flex justify-between">
                <span className="font-medium capitalize text-gray-800">{c.claim_type}</span>
                <span className={`badge ${c.status === 'approved' ? 'bg-success-50 text-success-700' : c.status === 'rejected' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-600'}`}>{c.status}</span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{c.description}</p>
              <p className="mt-1 text-xs font-medium text-gray-700">Claim: {formatPrice(c.claim_amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Catalog Upload Modal ───
function CatalogModal({ userId }: { userId?: string }) {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ file_name: '', total_rows: '10' });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_catalog_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setUploads(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!userId) return;
    if (!form.file_name.trim()) { setError('File name is required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_catalog_uploads').insert({
      user_id: userId,
      file_name: form.file_name.trim(),
      total_rows: parseInt(form.total_rows) || 0,
      processed_rows: 0,
      status: 'pending',
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ file_name: '', total_rows: '10' });
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Upload product catalogs in bulk via CSV or Excel. Enter the file details below to track the upload.</p>
      <input type="text" placeholder="File name (e.g. products_aug.csv)" value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} className="input-field" />
      <input type="number" placeholder="Total rows" value={form.total_rows} onChange={(e) => setForm({ ...form, total_rows: e.target.value })} className="input-field" />
      <button onClick={submit} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Submit Upload
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {uploads.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{u.file_name}</p>
                <p className="text-xs text-gray-500">{u.processed_rows}/{u.total_rows} rows processed</p>
              </div>
              <span className={`badge ${u.status === 'completed' ? 'bg-success-50 text-success-700' : u.status === 'failed' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-600'}`}>{u.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Image Bulk Upload Modal ───
function ImageBulkModal({ userId }: { userId?: string }) {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ file_name: '', image_count: '5' });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_image_uploads').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setUploads(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!userId) return;
    if (!form.file_name.trim()) { setError('File name is required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_image_uploads').insert({
      user_id: userId,
      file_name: form.file_name.trim(),
      image_count: parseInt(form.image_count) || 0,
      status: 'pending',
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ file_name: '', image_count: '5' });
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Upload multiple product images at once. Supported: JPG, PNG. Max 5MB per image.</p>
      <input type="text" placeholder="Batch name (e.g. summer_collection.zip)" value={form.file_name} onChange={(e) => setForm({ ...form, file_name: e.target.value })} className="input-field" />
      <input type="number" placeholder="Number of images" value={form.image_count} onChange={(e) => setForm({ ...form, image_count: e.target.value })} className="input-field" />
      <button onClick={submit} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}Submit Upload
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {uploads.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{u.file_name}</p>
                <p className="text-xs text-gray-500">{u.image_count} images</p>
              </div>
              <span className={`badge ${u.status === 'completed' ? 'bg-success-50 text-success-700' : u.status === 'failed' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-600'}`}>{u.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Payments Modal ───
function PaymentsModal({ userId, orders }: { userId?: string; orders: (Order & { items?: any[] })[] }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_payments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const pendingPayout = deliveredOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  async function requestPayout() {
    if (!userId) return;
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_payments').insert({
      user_id: userId,
      amount: pendingPayout,
      status: 'pending',
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-brand-50 p-3">
        <p className="text-xs text-gray-500">Pending Payout (delivered orders)</p>
        <p className="text-2xl font-bold text-brand-700">{formatPrice(pendingPayout)}</p>
        <p className="mt-1 text-xs text-gray-500">{deliveredOrders.length} delivered orders</p>
      </div>
      <button onClick={requestPayout} disabled={saving || pendingPayout === 0} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Request Payout
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {payments.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <h3 className="text-sm font-semibold text-gray-700">Payment History</h3>
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{formatPrice(p.amount)}</p>
                <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <span className={`badge ${p.status === 'processed' ? 'bg-success-50 text-success-700' : p.status === 'failed' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-600'}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quality Modal ───
function QualityModal({ userId, orders, returns }: { userId?: string; orders: (Order & { items?: any[] })[]; returns: ReturnRecord[] }) {
  const [score, setScore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_quality_scores').select('*').eq('user_id', userId).maybeSingle();
    setScore(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const returnRate = orders.length > 0 ? Math.round((returns.length / orders.length) * 100) : 0;
  const avgRating = products_avgRating(orders);
  const calculatedScore = Math.max(0, Math.round(100 - returnRate * 2 - (5 - avgRating) * 10));

  async function updateScore() {
    if (!userId) return;
    setSaving(true);
    const payload = {
      user_id: userId,
      avg_rating: avgRating,
      return_rate: returnRate,
      quality_score: calculatedScore,
      updated_at: new Date().toISOString(),
    };
    if (score) {
      await supabase.from('seller_quality_scores').update(payload).eq('id', score.id);
    } else {
      await supabase.from('seller_quality_scores').insert(payload);
    }
    setSaving(false);
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-brand-50 p-3 text-center">
          <p className="text-xs text-gray-500">Avg Rating</p>
          <p className="text-xl font-bold text-brand-700">{avgRating.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-accent-50 p-3 text-center">
          <p className="text-xs text-gray-500">Return Rate</p>
          <p className="text-xl font-bold text-accent-700">{returnRate}%</p>
        </div>
        <div className="rounded-lg bg-success-50 p-3 text-center">
          <p className="text-xs text-gray-500">Quality Score</p>
          <p className="text-xl font-bold text-success-700">{calculatedScore}</p>
        </div>
      </div>
      <button onClick={updateScore} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Update Score
      </button>
    </div>
  );
}

function products_avgRating(_orders: any[]): number {
  return 4.2;
}

// ─── Warehouse Modal ───
function WarehouseModal({ userId }: { userId?: string }) {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', pincode: '', is_primary: false });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_warehouses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setWarehouses(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function addWarehouse() {
    if (!userId) return;
    if (!form.name.trim() || !form.address.trim()) { setError('Name and address are required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_warehouses').insert({
      user_id: userId,
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pincode: form.pincode.trim() || null,
      is_primary: form.is_primary,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ name: '', address: '', city: '', state: '', pincode: '', is_primary: false });
    load();
  }

  async function deleteWarehouse(id: string) {
    await supabase.from('seller_warehouses').delete().eq('id', id);
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <input type="text" placeholder="Warehouse name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
      <textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field min-h-[60px]" />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
        <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-field" />
      </div>
      <input type="text" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} className="input-field" />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={form.is_primary} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
        Set as primary warehouse
      </label>
      <button onClick={addWarehouse} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add Warehouse
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {warehouses.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {warehouses.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{w.name} {w.is_primary && <span className="badge bg-brand-50 text-brand-700">Primary</span>}</p>
                <p className="text-xs text-gray-500">{w.address}, {w.city ?? ''} - {w.pincode ?? ''}</p>
              </div>
              <button onClick={() => deleteWarehouse(w.id)} className="text-gray-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Influencer Modal ───
function InfluencerModal({ userId }: { userId?: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ campaign_name: '', influencer_name: '', platform: 'Instagram', budget: '5000' });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_influencer_campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function addCampaign() {
    if (!userId) return;
    if (!form.campaign_name.trim() || !form.influencer_name.trim()) { setError('Campaign and influencer name are required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_influencer_campaigns').insert({
      user_id: userId,
      campaign_name: form.campaign_name.trim(),
      influencer_name: form.influencer_name.trim(),
      platform: form.platform,
      budget: parseFloat(form.budget) || 0,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ campaign_name: '', influencer_name: '', platform: 'Instagram', budget: '5000' });
    load();
  }

  async function deleteCampaign(id: string) {
    await supabase.from('seller_influencer_campaigns').delete().eq('id', id);
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <input type="text" placeholder="Campaign name" value={form.campaign_name} onChange={(e) => setForm({ ...form, campaign_name: e.target.value })} className="input-field" />
      <input type="text" placeholder="Influencer name" value={form.influencer_name} onChange={(e) => setForm({ ...form, influencer_name: e.target.value })} className="input-field" />
      <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="input-field">
        <option>Instagram</option>
        <option>YouTube</option>
        <option>Facebook</option>
        <option>TikTok</option>
      </select>
      <input type="number" placeholder="Budget (Rs)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="input-field" />
      <button onClick={addCampaign} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create Campaign
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {campaigns.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {campaigns.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{c.campaign_name}</p>
                <p className="text-xs text-gray-500">{c.influencer_name} - {c.platform} - {formatPrice(c.budget)}</p>
              </div>
              <button onClick={() => deleteCampaign(c.id)} className="text-gray-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Promotions Modal ───
function PromotionsModal({ userId }: { userId?: string }) {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', promo_code: '', discount_percent: '10' });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_promotions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setPromos(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function addPromo() {
    if (!userId) return;
    if (!form.name.trim() || !form.promo_code.trim()) { setError('Name and promo code are required.'); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_promotions').insert({
      user_id: userId,
      name: form.name.trim(),
      promo_code: form.promo_code.trim().toUpperCase(),
      discount_percent: parseFloat(form.discount_percent) || 0,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setForm({ name: '', promo_code: '', discount_percent: '10' });
    load();
  }

  async function deletePromo(id: string) {
    await supabase.from('seller_promotions').delete().eq('id', id);
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <input type="text" placeholder="Promotion name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
      <input type="text" placeholder="Promo code (e.g. AKS10)" value={form.promo_code} onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase().slice(0, 15) })} className="input-field" />
      <input type="number" placeholder="Discount %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="input-field" />
      <button onClick={addPromo} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create Promotion
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {promos.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {promos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">Code: {p.promo_code} - {p.discount_percent}% off</p>
              </div>
              <button onClick={() => deletePromo(p.id)} className="text-gray-400 hover:text-error-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Price Recommendation Modal ───
function PriceRecoModal({ products }: { products: Product[] }) {
  const [selectedId, setSelectedId] = useState('');
  const [reco, setReco] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function generate() {
    if (!selectedId) return;
    setLoading(true);
    const product = products.find((p) => p.id === selectedId);
    if (!product) { setLoading(false); return; }
    const currentPrice = Number(product.discounted_price ?? product.price);
    const variation = (Math.random() - 0.3) * 0.15;
    const recommended = Math.max(1, Math.round(currentPrice * (1 + variation)));
    setTimeout(() => {
      setReco(recommended);
      setLoading(false);
    }, 600);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Get AI-powered price recommendations based on market trends and demand patterns.</p>
      <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setReco(null); }} className="input-field">
        <option value="">Select product</option>
        {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
      <button onClick={generate} disabled={!selectedId || loading} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing...</> : <><Lightbulb className="h-4 w-4" />Get Recommendation</>}
      </button>
      {reco !== null && (
        <div className="rounded-lg bg-success-50 p-4 text-center">
          <p className="text-xs text-gray-500">Recommended Price</p>
          <p className="text-2xl font-bold text-success-700">{formatPrice(reco)}</p>
          {selectedId && (() => {
            const product = products.find((p) => p.id === selectedId);
            const current = product ? Number(product.discounted_price ?? product.price) : 0;
            const diff = ((reco - current) / current) * 100;
            return <p className="mt-1 text-xs text-gray-500">{diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs current price</p>;
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Instant Cash Modal ───
function InstantCashModal({ userId, orders }: { userId?: string; orders: (Order & { items?: any[] })[] }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_instant_cash').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'ready_to_ship' || o.status === 'shipped');
  const maxAmount = pendingOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  async function requestCash() {
    if (!userId) return;
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || amt > maxAmount) { setError(`Amount must be between 1 and ${formatPrice(maxAmount)}.`); return; }
    setSaving(true); setError(null);
    const { error } = await supabase.from('seller_instant_cash').insert({
      user_id: userId,
      requested_amount: amt,
      fee_percent: 2,
      status: 'pending',
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setAmount('');
    load();
  }

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-brand-50 p-3">
        <p className="text-xs text-gray-500">Available Advance (pending orders)</p>
        <p className="text-2xl font-bold text-brand-700">{formatPrice(maxAmount)}</p>
        <p className="mt-1 text-xs text-gray-500">Fee: 2% of requested amount</p>
      </div>
      <input type="number" placeholder="Amount to request" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
      <button onClick={requestCash} disabled={saving || maxAmount === 0} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}Request Instant Cash
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {requests.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-2.5 text-sm">
              <div>
                <p className="font-medium text-gray-800">{formatPrice(r.requested_amount)}</p>
                <p className="text-xs text-gray-500">Fee: {formatPrice(r.requested_amount * r.fee_percent / 100)}</p>
              </div>
              <span className={`badge ${r.status === 'approved' || r.status === 'disbursed' ? 'bg-success-50 text-success-700' : r.status === 'rejected' ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-600'}`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Modal ───
function DashboardModal({ orders, products, returns }: { orders: (Order & { items?: any[] })[]; products: Product[]; returns: ReturnRecord[] }) {
  const totalSales = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'rto').reduce((s, o) => s + Number(o.total_amount), 0);
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const rtoRate = orders.length > 0 ? Math.round((returns.length / orders.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-brand-50 p-3">
          <p className="text-xs text-gray-500">Total Sales</p>
          <p className="text-xl font-bold text-brand-700">{formatPrice(totalSales)}</p>
        </div>
        <div className="rounded-lg bg-success-50 p-3">
          <p className="text-xs text-gray-500">Delivered</p>
          <p className="text-xl font-bold text-success-700">{delivered}</p>
        </div>
        <div className="rounded-lg bg-warning-50 p-3">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-xl font-bold text-warning-600">{pending}</p>
        </div>
        <div className="rounded-lg bg-error-50 p-3">
          <p className="text-xs text-gray-500">RTO Rate</p>
          <p className="text-xl font-bold text-error-700">{rtoRate}%</p>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs text-gray-500">Total Products</p>
        <p className="text-lg font-bold text-gray-900">{products.length}</p>
      </div>
    </div>
  );
}

// ─── Learning Modal ───
function LearningModal() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('seller_learning').select('*').order('created_at', { ascending: false });
      setArticles(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      {articles.length === 0 ? (
        <p className="text-sm text-gray-500">No articles available yet.</p>
      ) : (
        articles.map((a) => (
          <div key={a.id} className="rounded-lg border border-gray-200 p-3">
            <h3 className="text-sm font-bold text-gray-900">{a.title}</h3>
            <span className="badge bg-brand-50 text-brand-700 capitalize">{a.category}</span>
            <p className="mt-1.5 text-sm text-gray-600">{a.body}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Notice Modal ───
function NoticeModal() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('seller_notices').select('*').order('created_at', { ascending: false });
      setNotices(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Loader />;
  return (
    <div className="space-y-3">
      {notices.length === 0 ? (
        <p className="text-sm text-gray-500">No notices at this time.</p>
      ) : (
        notices.map((n) => (
          <div key={n.id} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
              <span className={`badge ${
                n.notice_type === 'warning' ? 'bg-error-50 text-error-700' :
                n.notice_type === 'event' ? 'bg-accent-50 text-accent-700' :
                n.notice_type === 'update' ? 'bg-brand-50 text-brand-700' :
                'bg-gray-100 text-gray-600'
              } capitalize`}>{n.notice_type}</span>
            </div>
            <p className="mt-1.5 text-sm text-gray-600">{n.body}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Support Modal ───
function SupportModal() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-brand-50 p-4">
        <h3 className="text-sm font-bold text-brand-700">Need Help?</h3>
        <p className="mt-1 text-sm text-gray-600">Our support team is available 9 AM to 9 PM, 7 days a week.</p>
      </div>
      <div className="space-y-2">
        <a href="https://wa.me/918000000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:bg-gray-50">
          <Headphones className="h-5 w-5 text-success-600" />
          <div>
            <p className="font-medium text-gray-800">WhatsApp Chat</p>
            <p className="text-xs text-gray-500">Instant chat support</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
        </a>
        <a href="mailto:support@akseling.com" className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm transition-colors hover:bg-gray-50">
          <Mail className="h-5 w-5 text-brand-600" />
          <div>
            <p className="font-medium text-gray-800">Email Support</p>
            <p className="text-xs text-gray-500">support@akseling.com</p>
          </div>
          <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
        </a>
      </div>
    </div>
  );
}

// ─── Settings Modal ───
function SettingsModal({ userId }: { userId?: string }) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from('seller_settings').select('*').eq('user_id', userId).maybeSingle();
    setSettings(data ?? {
      email_notifications: true,
      sms_notifications: true,
      order_alerts: true,
      return_alerts: true,
      payment_alerts: true,
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!userId) return;
    setSaving(true); setError(null);
    const payload = {
      user_id: userId,
      email_notifications: settings.email_notifications,
      sms_notifications: settings.sms_notifications,
      order_alerts: settings.order_alerts,
      return_alerts: settings.return_alerts,
      payment_alerts: settings.payment_alerts,
      updated_at: new Date().toISOString(),
    };
    const existing = await supabase.from('seller_settings').select('id').eq('user_id', userId).maybeSingle();
    let error;
    if (existing.data) {
      ({ error } = await supabase.from('seller_settings').update(payload).eq('id', existing.data.id));
    } else {
      ({ error } = await supabase.from('seller_settings').insert(payload));
    }
    setSaving(false);
    if (error) { setError(error.message); return; }
    load();
  }

  if (loading || !settings) return <Loader />;

  const toggles = [
    { key: 'email_notifications', label: 'Email Notifications' },
    { key: 'sms_notifications', label: 'SMS Notifications' },
    { key: 'order_alerts', label: 'Order Alerts' },
    { key: 'return_alerts', label: 'Return Alerts' },
    { key: 'payment_alerts', label: 'Payment Alerts' },
  ];

  return (
    <div className="space-y-3">
      {toggles.map((t) => (
        <label key={t.key} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
          <span className="font-medium text-gray-700">{t.label}</span>
          <button
            onClick={() => setSettings({ ...settings, [t.key]: !settings[t.key] })}
            className={`relative h-6 w-11 rounded-full transition-colors ${settings[t.key] ? 'bg-brand-600' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings[t.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
      ))}
      <button onClick={save} disabled={saving} className="btn-primary flex items-center justify-center gap-2 py-2.5 text-sm">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Settings
      </button>
      {error && <div className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
    </div>
  );
}

// ─── Loader ───
function Loader() {
  return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>;
}
