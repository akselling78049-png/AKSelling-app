/*
# AKSelling E-Commerce Schema

## Overview
Creates the full database schema for AKSelling, a Flipkart-style e-commerce app
with customer shopping and a seller/admin management dashboard.

## New Tables

### profiles
Extends Supabase auth.users with app-specific data.
- id (uuid, FK to auth.users, PK)
- full_name (text)
- phone (text, verified mobile number)
- role (text: 'customer' | 'seller', default 'customer')
- created_at (timestamptz)

### products
The product catalog. Publicly readable; only sellers can write.
- id (uuid, PK)
- title (text, not null)
- description (text)
- price (numeric, not null) — original price
- discounted_price (numeric) — sale price (nullable)
- stock (integer, default 0)
- image_url (text)
- category (text, not null)
- sizes (text[]) — available sizes for apparel
- rating (numeric, default 4.0)
- is_featured (boolean, default false) — shown on home banner grid
- is_deal (boolean, default false) — shown in Best Deals tab
- created_at (timestamptz)

### orders
Customer orders. Customers see their own; sellers see all.
- id (uuid, PK)
- user_id (uuid, FK to auth.users, the customer who placed it)
- user_name (text, not null)
- phone (text, not null)
- address (text, not null)
- pincode (text, not null)
- payment_mode (text: 'razorpay' | 'cod', not null)
- total_amount (numeric, not null)
- status (text: 'pending' | 'dispatched' | 'delivered', default 'pending')
- created_at (timestamptz)

### order_items
Line items per order.
- id (uuid, PK)
- order_id (uuid, FK to orders, cascade delete)
- product_id (uuid, FK to products)
- product_title (text) — snapshot at order time
- quantity (integer)
- price (numeric) — snapshot at order time
- size (text) — selected size if applicable

## Security (RLS)
- profiles: owner-scoped CRUD for authenticated users.
- products: public SELECT (anon + authenticated) so browsing works without
  login; INSERT/UPDATE/DELETE restricted to authenticated users with role
  'seller' (checked via a SECURITY DEFINER helper for safety).
- orders: authenticated users can SELECT/INSERT their own; sellers can SELECT
  all and UPDATE status.
- order_items: authenticated users can SELECT their own (via order ownership)
  and INSERT; sellers can SELECT all.

## Helper Functions
- is_seller() — returns true if the current auth user has role 'seller'.
  SECURITY DEFINER so it can read profiles regardless of RLS.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'seller')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- is_seller helper ----------
-- SECURITY DEFINER so it can read profiles even when RLS would block.
CREATE OR REPLACE FUNCTION public.is_seller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'seller'
  );
$$;

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  discounted_price numeric CHECK (discounted_price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  category text NOT NULL,
  sizes text[] DEFAULT '{}',
  rating numeric DEFAULT 4.0,
  is_featured boolean NOT NULL DEFAULT false,
  is_deal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read so browsing works without sign-in
DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- Only sellers can write
DROP POLICY IF EXISTS "seller_insert_products" ON products;
CREATE POLICY "seller_insert_products" ON products FOR INSERT
  TO authenticated WITH CHECK (public.is_seller());

DROP POLICY IF EXISTS "seller_update_products" ON products;
CREATE POLICY "seller_update_products" ON products FOR UPDATE
  TO authenticated USING (public.is_seller()) WITH CHECK (public.is_seller());

DROP POLICY IF EXISTS "seller_delete_products" ON products;
CREATE POLICY "seller_delete_products" ON products FOR DELETE
  TO authenticated USING (public.is_seller());

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  pincode text NOT NULL,
  payment_mode text NOT NULL CHECK (payment_mode IN ('razorpay', 'cod')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'delivered')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_seller_orders" ON orders;
CREATE POLICY "select_own_or_seller_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_seller());

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "seller_update_order_status" ON orders;
CREATE POLICY "seller_update_order_status" ON orders FOR UPDATE
  TO authenticated USING (public.is_seller()) WITH CHECK (public.is_seller());

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  size text
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_seller_order_items" ON order_items;
CREATE POLICY "select_own_or_seller_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
    OR public.is_seller()
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_deal ON products(is_deal);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ---------- auto-create profile on signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), 'customer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();