export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  discounted_price: number | null;
  stock: number;
  image_url: string | null;
  category: string;
  sizes: string[];
  rating: number;
  is_featured: boolean;
  is_deal: boolean;
  sku_id: string | null;
  catalog_status: 'active' | 'activation_pending' | 'blocked' | 'paused';
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  user_name: string;
  phone: string;
  address: string;
  pincode: string;
  payment_mode: 'razorpay' | 'cod';
  total_amount: number;
  status: 'pending' | 'ready_to_ship' | 'shipped' | 'cancelled' | 'on_hold' | 'delivered' | 'rto';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  quantity: number;
  price: number;
  size: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'seller';
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string | null;
}

export interface SellerVerification {
  id: string;
  user_id: string;
  verification_method: 'gst' | 'document';
  gst_number: string | null;
  business_name: string | null;
  pan_number: string | null;
  id_type: 'aadhaar' | 'voter' | 'driving' | 'passport' | null;
  id_number: string | null;
  mobile_number: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface ProductVideo {
  id: string;
  user_id: string;
  product_id: string | null;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  created_at: string;
}

export interface SellerBankDetails {
  id: string;
  user_id: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  upi_id: string | null;
  created_at: string;
}

export interface SellerBusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  logo_url: string | null;
  diamond_level: number;
  tagline: string | null;
  created_at: string;
}

export interface ReturnRecord {
  id: string;
  order_id: string;
  return_reason: string | null;
  return_status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';
  claim_status: 'none' | 'pending' | 'approved' | 'rejected';
  claim_amount: number;
  created_at: string;
}

export interface ProductView {
  id: string;
  product_id: string;
  view_date: string;
  view_count: number;
}

export type PageTab = 'home' | 'categories' | 'deals' | 'account' | 'cart';

export type SellerDashboardTab = 'home' | 'orders' | 'returns' | 'inventory' | 'menu';
