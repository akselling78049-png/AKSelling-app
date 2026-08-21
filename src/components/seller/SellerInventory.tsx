import { useState, useMemo, useRef } from 'react';
import {
  Package, Plus, Pencil, Trash2, X, Loader2, Save, AlertCircle, Upload, Search, Camera,
} from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface SellerInventoryProps {
  products: Product[];
  loading: boolean;
  onProductsChanged: () => void;
}

type CatalogStatusFilter = 'all' | 'active' | 'activation_pending' | 'blocked' | 'paused';
type StockFilter = 'all' | 'out_of_stock' | 'low_stock' | 'in_stock';

const emptyForm = {
  id: null as string | null,
  title: '',
  description: '',
  price: '',
  discounted_price: '',
  stock: '',
  image_url: '',
  category: '',
  sizes: '',
  sku_id: '',
  is_featured: false,
  is_deal: false,
  catalog_status: 'active' as Product['catalog_status'],
};

export default function SellerInventory({ products, loading, onProductsChanged }: SellerInventoryProps) {
  const [statusFilter, setStatusFilter] = useState<CatalogStatusFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setForm((prev) => ({ ...prev, image_url: dataUrl }));
      setUploadingPhoto(false);
    };
    reader.onerror = () => {
      setFormError('Failed to read image. Please try again.');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  }

  const filtered = useMemo(() => {
    let result = products;
    if (statusFilter !== 'all') result = result.filter((p) => p.catalog_status === statusFilter);
    if (stockFilter === 'out_of_stock') result = result.filter((p) => p.stock === 0);
    else if (stockFilter === 'low_stock') result = result.filter((p) => p.stock > 0 && p.stock <= 10);
    else if (stockFilter === 'in_stock') result = result.filter((p) => p.stock > 10);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.sku_id?.toLowerCase().includes(q));
    }
    return result;
  }, [products, statusFilter, stockFilter, search]);

  function openAdd() {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? '',
      price: String(p.price),
      discounted_price: p.discounted_price ? String(p.discounted_price) : '',
      stock: String(p.stock),
      image_url: p.image_url ?? '',
      category: p.category,
      sizes: p.sizes.join(', '),
      sku_id: p.sku_id ?? '',
      is_featured: p.is_featured,
      is_deal: p.is_deal,
      catalog_status: p.catalog_status,
    });
    setFormError(null);
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim() || !form.category.trim() || !form.price) {
      setFormError('Title, category, and price are required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      discounted_price: form.discounted_price ? parseFloat(form.discounted_price) : null,
      stock: form.stock ? parseInt(form.stock, 10) : 0,
      image_url: form.image_url.trim() || null,
      category: form.category.trim(),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      sku_id: form.sku_id.trim() || null,
      is_featured: form.is_featured,
      is_deal: form.is_deal,
      catalog_status: form.catalog_status,
    };
    if (payload.discounted_price !== null && payload.discounted_price >= payload.price) {
      setFormError('Discounted price must be less than original price.');
      setSaving(false);
      return;
    }
    let error;
    if (form.id) ({ error } = await supabase.from('products').update(payload).eq('id', form.id));
    else ({ error } = await supabase.from('products').insert(payload));
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setShowForm(false);
    onProductsChanged();
  }

  async function remove(id: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    onProductsChanged();
  }

  const statusTabs: { id: CatalogStatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'activation_pending', label: 'Activation Pending' },
    { id: 'blocked', label: 'Blocked' },
    { id: 'paused', label: 'Paused' },
  ];

  const stockTabs: { id: StockFilter; label: string }[] = [
    { id: 'all', label: 'All Stock' },
    { id: 'out_of_stock', label: 'Out of Stock' },
    { id: 'low_stock', label: 'Low Stock' },
    { id: 'in_stock', label: 'In Stock' },
  ];

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <button onClick={openAdd} className="btn-primary flex items-center gap-2">
        <Upload className="h-5 w-5" />
        Upload New Catalog
      </button>

      {/* Status filters */}
      <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              statusFilter === tab.id ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stock filters */}
      <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
        {stockTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStockFilter(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              stockFilter === tab.id ? 'bg-accent-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or SKU ID..."
          className="input-field pl-10"
        />
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <Package className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No products found. Upload your first catalog!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <div key={p.id} className="card flex gap-3 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                {p.image_url && <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />}
              </div>
              <div className="flex flex-1 flex-col">
                <h3 className="line-clamp-1 text-sm font-medium text-gray-900">{p.title}</h3>
                <p className="text-xs text-gray-500">{p.category} • Stock: {p.stock}</p>
                {p.sku_id && <p className="text-xs text-gray-400">SKU: {p.sku_id}</p>}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{formatPrice(p.discounted_price ?? p.price)}</span>
                  <span className={`badge text-xs ${
                    p.catalog_status === 'active' ? 'bg-success-50 text-success-700'
                    : p.catalog_status === 'activation_pending' ? 'bg-warning-50 text-warning-600'
                    : p.catalog_status === 'blocked' ? 'bg-error-50 text-error-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>{p.catalog_status.replace('_', ' ')}</span>
                </div>
                <div className="mt-auto flex gap-2 pt-2">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-600">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => remove(p.id)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-error-300 hover:text-error-600">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Product Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Product title" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description" rows={2} className="input-field resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Price (Rs) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="599" className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Discounted Price (Rs)</label>
                  <input type="number" value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} placeholder="299" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Stock Quantity</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Category *</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Fashion" className="input-field" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">SKU ID</label>
                <input type="text" value={form.sku_id} onChange={(e) => setForm({ ...form, sku_id: e.target.value })} placeholder="AKY-001" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Product Photo</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    <Camera className="h-4 w-4" />
                    Camera
                  </button>
                </div>
                {form.image_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
                      <img src={form.image_url} alt="Product" className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="text-xs font-medium text-error-600 hover:text-error-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  value={form.image_url.startsWith('data:') ? '' : form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="Or paste image URL..."
                  className="input-field mt-2"
                />
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Sizes (comma-separated)</label>
                <input type="text" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Catalog Status</label>
                <select value={form.catalog_status} onChange={(e) => setForm({ ...form, catalog_status: e.target.value as Product['catalog_status'] })} className="input-field">
                  <option value="active">Active</option>
                  <option value="activation_pending">Activation Pending</option>
                  <option value="paused">Paused</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.is_deal} onChange={(e) => setForm({ ...form, is_deal: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" /> Best Deal
                </label>
              </div>
              {formError && (
                <div className="flex items-center gap-2 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700"><AlertCircle className="h-4 w-4 shrink-0" />{formError}</div>
              )}
              <button onClick={save} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 py-3">
                {saving ? <><Loader2 className="h-5 w-5 animate-spin" />Saving...</> : <><Save className="h-5 w-5" />{form.id ? 'Update Product' : 'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
