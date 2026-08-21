import { useState } from 'react';
import {
  ArrowLeft, ShieldCheck, Smartphone, Banknote, CheckCircle2, Loader2, MapPin, CreditCard,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import type { PageTab } from '@/types';

interface CheckoutPageProps {
  onBack: () => void;
  onNavigate: (tab: PageTab) => void;
}

export default function CheckoutPage({ onBack, onNavigate }: CheckoutPageProps) {
  const { items, totalAmount, clearCart } = useCart();
  const { profile, session } = useAuth();

  const [step, setStep] = useState<'address' | 'payment'>('address');
  const [fullName, setFullName] = useState(profile?.full_name ?? session?.user?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'cod'>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const phoneValid = /^\d{10}$/.test(phone);
  const pincodeValid = /^\d{6}$/.test(pincode);
  const addressValid = fullName.trim() && phoneValid && address.trim() && pincodeValid && items.length > 0;

  async function placeOrder() {
    if (!session?.user) {
      setError('Please sign in to place an order.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          user_name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          pincode: pincode.trim(),
          payment_mode: paymentMode,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_title: item.product.title,
        quantity: item.quantity,
        price:
          item.product.discounted_price && item.product.discounted_price < item.product.price
            ? item.product.discounted_price
            : item.product.price,
        size: item.size,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Trigger SMS notification edge function (best-effort)
      try {
        const funcUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`;
        await fetch(funcUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone.trim(),
            orderId: order.id,
            amount: totalAmount,
            name: fullName.trim(),
          }),
        });
      } catch {
        // SMS failure should not block order
      }

      if (profile && !profile.phone) {
        await supabase.from('profiles').update({ phone: phone.trim() }).eq('id', profile.id);
      }

      clearCart();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-success-500" />
          <h1 className="text-xl font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="text-sm text-gray-600">
            Thank you, {fullName.split(' ')[0]}! Your order has been confirmed. You will receive an SMS
            with tracking details on <span className="font-semibold">{phone}</span> shortly.
          </p>
          <button onClick={() => onNavigate('home')} className="btn-primary mt-2">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-4 sm:px-4">
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 'payment' ? 'Back to Address' : 'Back to Cart'}
      </button>

      <h1 className="mb-4 text-lg font-bold text-gray-900">Checkout</h1>

      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'address' ? 'text-brand-600' : 'text-gray-400'}`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 'address' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          Address
        </div>
        <div className="h-0.5 flex-1 bg-gray-200" />
        <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'payment' ? 'text-brand-600' : 'text-gray-400'}`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === 'payment' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
          Payment
        </div>
      </div>

      {/* Step 1: Address */}
      {step === 'address' && (
        <>
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <MapPin className="h-4 w-4 text-brand-600" />
              Delivery Details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Verified Mobile Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className={`input-field ${phone && !phoneValid ? 'border-error-400' : ''}`}
                />
                {phone && !phoneValid && (
                  <p className="mt-1 text-xs text-error-500">Enter a valid 10-digit mobile number.</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Complete Address *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House no, street, area, city, state"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Pincode *</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit pincode"
                  className={`input-field ${pincode && !pincodeValid ? 'border-error-400' : ''}`}
                />
                {pincode && !pincodeValid && (
                  <p className="mt-1 text-xs text-error-500">Enter a valid 6-digit pincode.</p>
                )}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="card mt-4 p-4">
            <h2 className="mb-3 text-sm font-bold text-gray-900">Order Summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-sm text-gray-600">
                  <span className="line-clamp-1 pr-2">
                    {item.product.title}
                    {item.size ? ` (${item.size})` : ''} x {item.quantity}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(
                      (item.product.discounted_price && item.product.discounted_price < item.product.price
                        ? item.product.discounted_price
                        : item.product.price) * item.quantity,
                    )}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
          )}

          <button
            onClick={() => {
              if (!addressValid) {
                setError('Please fill all required fields correctly.');
                return;
              }
              setError(null);
              setStep('payment');
            }}
            disabled={!addressValid}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 text-base"
          >
            Continue to Payment
          </button>

          {!session?.user && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Please sign in from the Account tab to place an order.
            </p>
          )}
        </>
      )}

      {/* Step 2: Payment */}
      {step === 'payment' && (
        <>
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
              <CreditCard className="h-4 w-4 text-brand-600" />
              Payment Method
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMode('razorpay')}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                  paymentMode === 'razorpay' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className={`h-5 w-5 ${paymentMode === 'razorpay' ? 'text-brand-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Online Payment — UPI / PhonePe / Google Pay / Cards</div>
                  <div className="text-xs text-gray-500">Fast & secure via Razorpay</div>
                </div>
                <div className={`ml-auto h-5 w-5 rounded-full border-2 ${paymentMode === 'razorpay' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
                  {paymentMode === 'razorpay' && <div className="m-auto mt-1 h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>

              <button
                onClick={() => setPaymentMode('cod')}
                className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                  paymentMode === 'cod' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className={`h-5 w-5 ${paymentMode === 'cod' ? 'text-brand-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-900">Cash on Delivery (COD)</div>
                  <div className="text-xs text-gray-500">Pay when you receive your order</div>
                </div>
                <div className={`ml-auto h-5 w-5 rounded-full border-2 ${paymentMode === 'cod' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'}`}>
                  {paymentMode === 'cod' && <div className="m-auto mt-1 h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          </div>

          {/* Delivery address summary */}
          <div className="card mt-4 p-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{fullName}</p>
                <p className="text-gray-600">{address}, {pincode}</p>
                <p className="text-gray-600">Mobile: {phone}</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="card mt-4 p-4">
            <div className="flex justify-between font-bold text-gray-900">
              <span>Total Amount</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>
          )}

          <button
            onClick={placeOrder}
            disabled={submitting}
            className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Place Order — ${formatPrice(totalAmount)}`
            )}
          </button>
        </>
      )}
    </div>
  );
}
