import { useState } from 'react';
import {
  ArrowLeft, ShieldCheck, FileText, Building2, Loader2, CheckCircle2, AlertCircle,
  Wallet, Save,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { SellerVerification, PageTab } from '@/types';

interface SellerRegistrationProps {
  onBack: () => void;
  onComplete: () => void;
  onNavigate: (tab: PageTab) => void;
}

type Step = 'method' | 'gst_form' | 'document_form' | 'bank_details' | 'done';

export default function SellerRegistration({ onBack, onComplete, onNavigate }: SellerRegistrationProps) {
  const { session, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<'gst' | 'document' | null>(null);
  const [gstNumber, setGstNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [gstMobile, setGstMobile] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank details form
  const [bankForm, setBankForm] = useState({
    account_holder: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    upi_id: '',
  });

  async function submitVerification() {
    if (!session?.user) {
      setError('Please sign in first.');
      return;
    }
    if (method === 'gst' && (!gstNumber.trim() || !businessName.trim() || !gstMobile.trim())) {
      setError('GST number, business name, and mobile number are all required.');
      return;
    }
    if (method === 'document' && (!panNumber.trim() || !idNumber.trim() || !mobileNumber.trim())) {
      setError('PAN card, Aadhaar card, and mobile number are all required.');
      return;
    }
    if (method === 'gst' && !/^\d{10}$/.test(gstMobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (method === 'document' && !/^\d{10}$/.test(mobileNumber.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: Omit<SellerVerification, 'id' | 'created_at' | 'status'> = {
      user_id: session.user.id,
      verification_method: method!,
      gst_number: method === 'gst' ? gstNumber.trim().toUpperCase() : null,
      business_name: method === 'gst' ? businessName.trim() : null,
      pan_number: method === 'document' ? panNumber.trim().toUpperCase() : null,
      id_type: method === 'document' ? 'aadhaar' : null,
      id_number: method === 'document' ? idNumber.trim() : null,
      mobile_number: method === 'gst' ? gstMobile.trim() : mobileNumber.trim(),
    };

    const { error: insertError } = await supabase.from('seller_verifications').insert({
      ...payload,
      status: 'pending',
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', session.user.id);

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    const bizName = method === 'gst' ? businessName.trim() : (profile?.full_name ?? session.user.email ?? 'My Business');
    await supabase.from('seller_business_profiles').insert({
      user_id: session.user.id,
      business_name: bizName,
      diamond_level: 1,
    }).then(() => {});

    await refreshProfile();
    setSubmitting(false);
    setStep('bank_details');
  }

  async function saveBankDetails() {
    if (!session?.user) return;
    if (!bankForm.account_holder.trim() || !bankForm.account_number.trim() || !bankForm.ifsc_code.trim() || !bankForm.bank_name.trim()) {
      setError('Account holder, account number, IFSC code, and bank name are all required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      user_id: session.user.id,
      account_holder: bankForm.account_holder.trim(),
      account_number: bankForm.account_number.trim(),
      ifsc_code: bankForm.ifsc_code.trim().toUpperCase(),
      bank_name: bankForm.bank_name.trim(),
      upi_id: bankForm.upi_id.trim() || null,
    };

    const { error: bankError } = await supabase.from('seller_bank_details').insert(payload);

    setSubmitting(false);
    if (bankError) {
      setError(bankError.message);
      return;
    }

    setStep('done');
  }

  // ---------- Done screen ----------
  if (step === 'done') {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-success-500" />
          <h1 className="text-lg font-bold text-gray-900">Seller Account Activated!</h1>
          <p className="text-sm text-gray-600">
            Your seller account is now active with your bank details saved. Your earnings will be
            sent directly to your bank account. You can start adding products and managing your
            store right away.
          </p>
          <button onClick={onComplete} className="btn-primary">
            Go to Seller Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ---------- Bank details step ----------
  if (step === 'bank_details') {
    return (
      <div className="mx-auto max-w-lg px-3 py-4 sm:px-4">
        <button
          onClick={() => setStep('done')}
          className="mb-3 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Skip for now
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-6 w-6 text-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Bank Details</h1>
        </div>

        <div className="mb-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">
          <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
          Registration successful! Now add your bank details to receive your earnings directly.
        </div>

        <div className="card p-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Account Holder Name *</label>
              <input
                type="text"
                value={bankForm.account_holder}
                onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}
                placeholder="Account holder name"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Account Number *</label>
              <input
                type="text"
                value={bankForm.account_number}
                onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value.replace(/\D/g, '').slice(0, 18) })}
                placeholder="Bank account number"
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">IFSC Code *</label>
                <input
                  type="text"
                  value={bankForm.ifsc_code}
                  onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value.toUpperCase().slice(0, 11) })}
                  placeholder="SBIN0001234"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Bank Name *</label>
                <input
                  type="text"
                  value={bankForm.bank_name}
                  onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                  placeholder="State Bank of India"
                  className="input-field"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">UPI ID (optional)</label>
              <input
                type="text"
                value={bankForm.upi_id}
                onChange={(e) => setBankForm({ ...bankForm, upi_id: e.target.value })}
                placeholder="name@upi"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={saveBankDetails}
          disabled={submitting}
          className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Save Bank Details & Activate
            </>
          )}
        </button>
      </div>
    );
  }

  // ---------- Method selection + forms ----------
  return (
    <div className="mx-auto max-w-lg px-3 py-4 sm:px-4">
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-brand-600" />
        <h1 className="text-xl font-bold text-gray-900">AKSeling par beche</h1>
      </div>

      {!session?.user ? (
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-warning-600" />
          <p className="text-sm text-gray-600">Please sign in first to register as a seller.</p>
          <button onClick={() => onNavigate('account')} className="btn-primary">
            Go to Sign In
          </button>
        </div>
      ) : (
        <>
          {/* Method selection */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Choose your verification method to get started:</p>

              <button
                onClick={() => { setMethod('gst'); setStep('gst_form'); }}
                className="card flex w-full items-center gap-3 p-4 text-left transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="rounded-lg bg-brand-50 p-3">
                  <Building2 className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">GST Se Register Karein</h3>
                  <p className="text-xs text-gray-500">GSTIN, Business Name aur Mobile number daal kar turant register karein.</p>
                </div>
              </button>

              <button
                onClick={() => { setMethod('document'); setStep('document_form'); }}
                className="card flex w-full items-center gap-3 p-4 text-left transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="rounded-lg bg-accent-50 p-3">
                  <FileText className="h-6 w-6 text-accent-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">PAN + Aadhaar + Mobile Se Register Karein</h3>
                  <p className="text-xs text-gray-500">Jinke paas GST nahi hai, unke liye PAN card number, Aadhaar ke last 4 digit, aur linked mobile number daal kar register karein.</p>
                </div>
              </button>
            </div>
          )}

          {/* GST form */}
          {step === 'gst_form' && (
            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-600" />
                <h2 className="text-sm font-bold text-gray-900">GST Verification</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">GST Number *</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value.toUpperCase().slice(0, 15))}
                    placeholder="22AAAAA0000A1Z5"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your registered business name"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mobile Number *</label>
                  <input
                    type="tel"
                    value={gstMobile}
                    onChange={(e) => setGstMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Document form */}
          {step === 'document_form' && (
            <div className="card p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-600" />
                <h2 className="text-sm font-bold text-gray-900">PAN + Aadhaar + Mobile Verification</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">PAN Card Number *</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Aadhaar Card Number (last 4 digits) *</label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="XXXX"
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-gray-400">For your security, only enter the last 4 digits of your Aadhaar.</p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Mobile Number (linked with PAN & Aadhaar) *</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-gray-400">This mobile number must be linked to both your PAN and Aadhaar.</p>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-accent-50 p-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent-600 mt-0.5" />
                  <p className="text-xs text-accent-700">Your PAN, Aadhaar, and mobile number will be verified to ensure they are linked. This is required for seller activation.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {(step === 'gst_form' || step === 'document_form') && (
            <div className="mt-4 space-y-3">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <button
                onClick={submitVerification}
                disabled={submitting}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit & Activate Seller Account'
                )}
              </button>
              <button
                onClick={() => { setStep('method'); setError(null); }}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Choose different method
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
