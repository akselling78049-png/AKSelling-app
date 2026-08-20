/*
# Professional Seller System — Business Profiles, Catalog, Orders, Returns

## Overview
Expands AKSelling with Meesho/Flipkart-style seller management:
- Seller business profiles with branding
- Product catalog status and SKU IDs
- Expanded order statuses (ready_to_ship, shipped, cancelled, on_hold)
- Returns/RTO tracking with claim support
- Product view analytics for business insights

## New Tables

### seller_business_profiles
Business name and branding for sellers.
- id (uuid, PK)
- user_id (uuid, FK to auth.users, unique)
- business_name (text) — e.g. "AK Yadav Prints"
- logo_url (text, nullable)
- diamond_level (int, default 1) — seller tier/branding
- tagline (text, nullable)

### returns
Return/RTO tracking for orders.
- id (uuid, PK)
- order_id (uuid, FK to orders)
- return_reason (text)
- return_status (text: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded')
- claim_status (text: 'none' | 'pending' | 'approved' | 'rejected')
- claim_amount (numeric, default 0)
- created_at (timestamptz)

### product_views
Daily view analytics per product for business insights.
- id (uuid, PK)
- product_id (uuid, FK to products)
- view_date (date)
- view_count (int, default 1)
- unique (product_id, view_date)

## Modified Tables

### orders
- Expanded status CHECK to include: pending, ready_to_ship, shipped, cancelled, on_hold, delivered, rto

### products
- Added sku_id (text, nullable) for SKU search
- Added catalog_status (text: 'active' | 'activation_pending' | 'blocked' | 'paused', default 'active')

## Security (RLS)
- seller_business_profiles: owner-scoped CRUD
- returns: seller can SELECT all (via is_seller), owner can SELECT/INSERT own
- product_views: public INSERT (logged from browse), seller can SELECT their products' views
*/

-- ---------- seller_business_profiles ----------
CREATE TABLE IF NOT EXISTS seller_business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  logo_url text,
  diamond_level int NOT NULL DEFAULT 1,
  tagline text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seller_business_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_business" ON seller_business_profiles;
CREATE POLICY "select_own_business" ON seller_business_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_business" ON seller_business_profiles;
CREATE POLICY "insert_own_business" ON seller_business_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_business" ON seller_business_profiles;
CREATE POLICY "update_own_business" ON seller_business_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- returns ----------
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  return_reason text,
  return_status text NOT NULL DEFAULT 'requested' CHECK (return_status IN ('requested', 'approved', 'rejected', 'received', 'refunded')),
  claim_status text NOT NULL DEFAULT 'none' CHECK (claim_status IN ('none', 'pending', 'approved', 'rejected')),
  claim_amount numeric NOT NULL DEFAULT 0 CHECK (claim_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_seller_returns" ON returns;
CREATE POLICY "select_own_or_seller_returns" ON returns FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = returns.order_id AND orders.user_id = auth.uid())
    OR public.is_seller()
  );

DROP POLICY IF EXISTS "insert_own_returns" ON returns;
CREATE POLICY "insert_own_returns" ON returns FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = returns.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "seller_update_returns" ON returns;
CREATE POLICY "seller_update_returns" ON returns FOR UPDATE
  TO authenticated USING (public.is_seller()) WITH CHECK (public.is_seller());

-- ---------- product_views ----------
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count int NOT NULL DEFAULT 1,
  UNIQUE (product_id, view_date)
);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert view records (for analytics tracking)
DROP POLICY IF EXISTS "insert_product_views" ON product_views;
CREATE POLICY "insert_product_views" ON product_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Sellers can read views for their products
DROP POLICY IF EXISTS "select_product_views" ON product_views;
CREATE POLICY "select_product_views" ON product_views FOR SELECT
  TO authenticated USING (public.is_seller());

-- ---------- Modify orders: expand status ----------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_status_check'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'ready_to_ship', 'shipped', 'cancelled', 'on_hold', 'delivered', 'rto'));

-- ---------- Modify products: add sku_id and catalog_status ----------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sku_id'
  ) THEN
    ALTER TABLE products ADD COLUMN sku_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'catalog_status'
  ) THEN
    ALTER TABLE products ADD COLUMN catalog_status text NOT NULL DEFAULT 'active'
      CHECK (catalog_status IN ('active', 'activation_pending', 'blocked', 'paused'));
  END IF;
END $$;

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product_date ON product_views(product_id, view_date);
CREATE INDEX IF NOT EXISTS idx_products_sku_id ON products(sku_id);
CREATE INDEX IF NOT EXISTS idx_products_catalog_status ON products(catalog_status);