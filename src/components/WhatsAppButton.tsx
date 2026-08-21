import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const whatsappNumber = '919999999999';
  const defaultMessage = 'Hi AKSelling team, I have a question about your products.';

  function send() {
    const text = encodeURIComponent(message.trim() || defaultMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setMessage('');
    }, 1500);
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-72 rounded-2xl bg-white shadow-2xl animate-slide-up sm:w-80">
          <div className="flex items-center justify-between rounded-t-2xl bg-[#075E54] p-4 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-bold">AKSelling Support</p>
                <p className="text-xs text-white/80">Typically replies in minutes</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="rounded-full bg-success-50 p-3">
                  <MessageCircle className="h-8 w-8 text-success-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">Opening WhatsApp...</p>
              </div>
            ) : (
              <>
                <div className="mb-3 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                  Hello! How can we help you today? Send us a message and we'll get back to you on WhatsApp.
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={defaultMessage}
                  rows={3}
                  className="input-field resize-none text-sm"
                />
                <button
                  onClick={send}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1ebd5c] active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  Send on WhatsApp
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-600/30 transition-all hover:scale-110 active:scale-95 animate-fade-in"
        aria-label="WhatsApp Support"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m0-21.79c-6.631 0-12 5.369-12 12 0 2.115.551 4.173 1.6 6L.391 24l6.18-1.62a11.95 11.95 0 005.4 1.272h.003c6.631 0 12-5.369 12-12 0-3.2-1.246-6.21-3.514-8.486A11.938 11.938 0 0012.051 0"/>
          </svg>
        )}
      </button>
    </>
  );
}
