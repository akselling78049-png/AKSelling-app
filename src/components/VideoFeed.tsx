import { useState, useEffect } from 'react';
import { Video, Play, Zap, Loader2, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { ProductVideo, Product } from '@/types';

interface VideoFeedProps {
  products: Product[];
  onBuyNow: (product: Product) => void;
}

export default function VideoFeed({ products, onBuyNow }: VideoFeedProps) {
  const { session } = useAuth();
  const [videos, setVideos] = useState<(ProductVideo & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadProductId, setUploadProductId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function loadVideos() {
    setLoading(true);
    const { data } = await supabase
      .from('product_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setVideos((data ?? []) as ProductVideo[]);
    setLoading(false);
  }

  useEffect(() => {
    loadVideos();
  }, []);

  async function submitVideo() {
    if (!session?.user) {
      setUploadError('Please sign in to upload a video.');
      return;
    }
    if (!uploadTitle.trim() || !uploadUrl.trim()) {
      setUploadError('Title and video URL are required.');
      return;
    }
    setUploading(true);
    setUploadError(null);

    const { error } = await supabase.from('product_videos').insert({
      user_id: session.user.id,
      product_id: uploadProductId || null,
      title: uploadTitle.trim(),
      video_url: uploadUrl.trim(),
    });

    setUploading(false);
    if (error) {
      setUploadError(error.message);
      return;
    }

    setShowUpload(false);
    setUploadTitle('');
    setUploadUrl('');
    setUploadProductId('');
    await loadVideos();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <Video className="h-5 w-5 text-brand-600" />
          Video Feed
        </h2>
        {session?.user && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-100"
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : videos.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <Video className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No videos yet. Be the first to upload!</p>
        </div>
      ) : (
        <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
          {videos.map((video) => {
            const product = products.find((p) => p.id === video.product_id);
            return (
              <div key={video.id} className="card w-64 shrink-0 overflow-hidden">
                <div className="relative aspect-[9/16] bg-gray-900">
                  <video
                    src={video.video_url}
                    poster={video.thumbnail_url ?? undefined}
                    controls
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/40 p-3">
                      <Play className="h-6 w-6 fill-white text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-medium text-gray-900">{video.title}</h3>
                  {product && (
                    <button
                      onClick={() => onBuyNow(product)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white transition-all hover:bg-brand-700 active:scale-95"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      Buy Now — {product.title.slice(0, 15)}...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Upload Product Video</h2>
              <button onClick={() => setShowUpload(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Video Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="My awesome product video"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Video URL *</label>
                <input
                  type="text"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-field"
                />
                <p className="mt-1 text-xs text-gray-400">Paste a direct link to your video file (mp4, webm)</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Link to Product (optional)</label>
                <select
                  value={uploadProductId}
                  onChange={(e) => setUploadProductId(e.target.value)}
                  className="input-field"
                >
                  <option value="">No product linked</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              {uploadError && (
                <div className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-700">{uploadError}</div>
              )}
              <button
                onClick={submitVideo}
                disabled={uploading}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
