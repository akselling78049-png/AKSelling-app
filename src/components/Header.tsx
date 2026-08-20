import { useState, useRef } from 'react';
import { Search, Mic, Camera, MapPin, ShoppingCart, Store, X, Upload, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { PageTab } from '@/types';

interface HeaderProps {
  onNavigate: (tab: PageTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function Header({ onNavigate, searchQuery, onSearchChange }: HeaderProps) {
  const { totalItems } = useCart();
  const [pincode] = useState('560001');
  const [listening, setListening] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  function startVoiceSearch() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleImageSearch(file: File) {
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCameraImage(dataUrl);
      setShowCamera(true);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  }

  function searchByImage() {
    if (!cameraImage) return;
    // For now, search by product category keywords extracted from filename
    // In a real app this would call an image recognition API
    onSearchChange('image search');
    setShowCamera(false);
    setCameraImage(null);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-brand-600 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Store className="h-6 w-6 sm:h-7 sm:w-7" />
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">AKSeling</span>
            </button>

            <div className="relative flex-1 max-w-2xl">
              <div className="flex items-center rounded-lg bg-white shadow-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Product ya T-shirt search karein..."
                  className="w-full rounded-lg py-2.5 pl-4 pr-24 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
                <div className="flex items-center gap-1 pr-2">
                  <button
                    onClick={startVoiceSearch}
                    className={`rounded-md p-1.5 transition-colors ${
                      listening
                        ? 'bg-error-500 text-white animate-pulse'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-brand-600'
                    }`}
                    aria-label="Voice Search"
                    title={listening ? 'Listening... tap to stop' : 'Voice Search'}
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600"
                    aria-label="Camera Search"
                    title="Search by Photo"
                  >
                    {uploadingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  </button>
                  <button
                    className="rounded-md p-1.5 text-brand-600 transition-colors hover:bg-brand-50"
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-1.5 text-sm shrink-0 sm:flex">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{pincode}</span>
            </div>

            <button
              onClick={() => onNavigate('cart')}
              className="relative shrink-0 rounded-lg p-2 transition-colors hover:bg-brand-500"
              aria-label="Cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {listening && (
          <div className="bg-brand-700 px-4 py-1.5 text-center text-xs text-white/90">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              Listening... speak now (Hindi/English)
            </span>
          </div>
        )}
      </header>

      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageSearch(file);
        }}
      />

      {/* Image search preview modal */}
      {showCamera && cameraImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-sm rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Search by Photo</h3>
              <button
                onClick={() => { setShowCamera(false); setCameraImage(null); }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-3 overflow-hidden rounded-lg">
              <img src={cameraImage} alt="Search" className="max-h-64 w-full object-cover" />
            </div>
            <p className="mb-3 text-xs text-gray-500">
              We'll search for similar products based on your photo.
            </p>
            <button
              onClick={searchByImage}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3"
            >
              <Search className="h-5 w-5" />
              Search Similar Products
            </button>
          </div>
        </div>
      )}
    </>
  );
}
