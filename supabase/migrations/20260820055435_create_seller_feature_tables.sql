/*
# Create seller feature tables

1. New Tables
- `seller_pricing_rules` — bulk pricing rules per product (min_qty, discount_percent)
- `seller_claims` — claims for damaged returns, lost shipments, RTO disputes
- `seller_warehouses` — warehouse locations for fulfillment
- `seller_promotions` — promotional campaigns and discount codes
- `seller_influencer_campaigns` — influencer marketing campaigns
- `seller_instant_cash` — instant cash advance requests on pending orders
- `seller_quality_scores` — quality metrics (rating, return rate, quality score)
- `seller_payments` — payment schedule and payout history
- `seller_catalog_uploads` — catalog upload tracking (CSV/Excel)
- `seller_image_uploads` — image bulk upload tracking
- `seller_settings` — seller notification/privacy preferences
- `seller_notices` — platform announcements visible to sellers
- `seller_learning` — learning hub articles

2. Security
- All tables have RLS enabled.
- Owner-scoped CRUD: each authenticated seller can only access their own rows.
- user_id columns default to auth.uid() so inserts without explicit user_id succeed.
- seller_notices and seller_learning are read-only for all authenticated sellers (shared content).
*/

-- Pricing rules
CREATE TABLE IF NOT EXISTS seller_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  label text NOT NULL,
  min_qty integer NOT NULL DEFAULT 1,
  discount_percent numeric NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_pricing_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_pricing" ON seller_pricing_rules;
CREATE POLICY "select_own_pricing" ON seller_pricing_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_pricing" ON seller_pricing_rules;
CREATE POLICY "insert_own_pricing" ON seller_pricing_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_pricing" ON seller_pricing_rules;
CREATE POLICY "update_own_pricing" ON seller_pricing_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_pricing" ON seller_pricing_rules;
CREATE POLICY "delete_own_pricing" ON seller_pricing_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Claims
CREATE TABLE IF NOT EXISTS seller_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  claim_type text NOT NULL CHECK (claim_type IN ('damaged', 'lost', 'rto', 'other')),
  description text NOT NULL,
  claim_amount numeric NOT NULL DEFAULT 0 CHECK (claim_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_claims" ON seller_claims;
CREATE POLICY "select_own_claims" ON seller_claims FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_claims" ON seller_claims;
CREATE POLICY "insert_own_claims" ON seller_claims FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_claims" ON seller_claims;
CREATE POLICY "update_own_claims" ON seller_claims FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_claims" ON seller_claims;
CREATE POLICY "delete_own_claims" ON seller_claims FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Warehouses
CREATE TABLE IF NOT EXISTS seller_warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  pincode text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_warehouses" ON seller_warehouses;
CREATE POLICY "select_own_warehouses" ON seller_warehouses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_warehouses" ON seller_warehouses;
CREATE POLICY "insert_own_warehouses" ON seller_warehouses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_warehouses" ON seller_warehouses;
CREATE POLICY "update_own_warehouses" ON seller_warehouses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_warehouses" ON seller_warehouses;
CREATE POLICY "delete_own_warehouses" ON seller_warehouses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Promotions
CREATE TABLE IF NOT EXISTS seller_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  promo_code text NOT NULL,
  discount_percent numeric NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_promos" ON seller_promotions;
CREATE POLICY "select_own_promos" ON seller_promotions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_promos" ON seller_promotions;
CREATE POLICY "insert_own_promos" ON seller_promotions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_promos" ON seller_promotions;
CREATE POLICY "update_own_promos" ON seller_promotions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_promos" ON seller_promotions;
CREATE POLICY "delete_own_promos" ON seller_promotions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Influencer campaigns
CREATE TABLE IF NOT EXISTS seller_influencer_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  influencer_name text NOT NULL,
  platform text,
  budget numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_influencer_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_influencer" ON seller_influencer_campaigns;
CREATE POLICY "select_own_influencer" ON seller_influencer_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_influencer" ON seller_influencer_campaigns;
CREATE POLICY "insert_own_influencer" ON seller_influencer_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_influencer" ON seller_influencer_campaigns;
CREATE POLICY "update_own_influencer" ON seller_influencer_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_influencer" ON seller_influencer_campaigns;
CREATE POLICY "delete_own_influencer" ON seller_influencer_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Instant cash
CREATE TABLE IF NOT EXISTS seller_instant_cash (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_amount numeric NOT NULL DEFAULT 0 CHECK (requested_amount >= 0),
  fee_percent numeric NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_instant_cash ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_cash" ON seller_instant_cash;
CREATE POLICY "select_own_cash" ON seller_instant_cash FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cash" ON seller_instant_cash;
CREATE POLICY "insert_own_cash" ON seller_instant_cash FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_cash" ON seller_instant_cash;
CREATE POLICY "update_own_cash" ON seller_instant_cash FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cash" ON seller_instant_cash;
CREATE POLICY "delete_own_cash" ON seller_instant_cash FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Quality scores
CREATE TABLE IF NOT EXISTS seller_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_rating numeric NOT NULL DEFAULT 4.0,
  return_rate numeric NOT NULL DEFAULT 0,
  quality_score numeric NOT NULL DEFAULT 80,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_quality" ON seller_quality_scores;
CREATE POLICY "select_own_quality" ON seller_quality_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_quality" ON seller_quality_scores;
CREATE POLICY "insert_own_quality" ON seller_quality_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_quality" ON seller_quality_scores;
CREATE POLICY "update_own_quality" ON seller_quality_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_quality" ON seller_quality_scores;
CREATE POLICY "delete_own_quality" ON seller_quality_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Payments (payout history)
CREATE TABLE IF NOT EXISTS seller_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start timestamptz,
  period_end timestamptz,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_payments" ON seller_payments;
CREATE POLICY "select_own_payments" ON seller_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_payments" ON seller_payments;
CREATE POLICY "insert_own_payments" ON seller_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_payments" ON seller_payments;
CREATE POLICY "update_own_payments" ON seller_payments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_payments" ON seller_payments;
CREATE POLICY "delete_own_payments" ON seller_payments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Catalog uploads
CREATE TABLE IF NOT EXISTS seller_catalog_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_catalog_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_catalog" ON seller_catalog_uploads;
CREATE POLICY "select_own_catalog" ON seller_catalog_uploads FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_catalog" ON seller_catalog_uploads;
CREATE POLICY "insert_own_catalog" ON seller_catalog_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_catalog" ON seller_catalog_uploads;
CREATE POLICY "update_own_catalog" ON seller_catalog_uploads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_catalog" ON seller_catalog_uploads;
CREATE POLICY "delete_own_catalog" ON seller_catalog_uploads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Image uploads
CREATE TABLE IF NOT EXISTS seller_image_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  image_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_image_uploads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_images" ON seller_image_uploads;
CREATE POLICY "select_own_images" ON seller_image_uploads FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_images" ON seller_image_uploads;
CREATE POLICY "insert_own_images" ON seller_image_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_images" ON seller_image_uploads;
CREATE POLICY "update_own_images" ON seller_image_uploads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_images" ON seller_image_uploads;
CREATE POLICY "delete_own_images" ON seller_image_uploads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seller settings
CREATE TABLE IF NOT EXISTS seller_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  sms_notifications boolean NOT NULL DEFAULT true,
  order_alerts boolean NOT NULL DEFAULT true,
  return_alerts boolean NOT NULL DEFAULT true,
  payment_alerts boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_settings" ON seller_settings;
CREATE POLICY "select_own_settings" ON seller_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON seller_settings;
CREATE POLICY "insert_own_settings" ON seller_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON seller_settings;
CREATE POLICY "update_own_settings" ON seller_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON seller_settings;
CREATE POLICY "delete_own_settings" ON seller_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notices (shared, read-only for all authenticated)
CREATE TABLE IF NOT EXISTS seller_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  notice_type text NOT NULL DEFAULT 'info' CHECK (notice_type IN ('info', 'warning', 'update', 'event')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_all_notices" ON seller_notices;
CREATE POLICY "read_all_notices" ON seller_notices FOR SELECT TO authenticated USING (true);

-- Learning hub (shared, read-only for all authenticated)
CREATE TABLE IF NOT EXISTS seller_learning (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_learning ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_all_learning" ON seller_learning;
CREATE POLICY "read_all_learning" ON seller_learning FOR SELECT TO authenticated USING (true);

-- Insert sample notices
INSERT INTO seller_notices (title, body, notice_type) VALUES
  ('New Shipping Rates', 'Updated shipping rates effective from September 1, 2026. Check the shipping calculator for details.', 'update'),
  ('Festive Sale Coming Soon', 'Get ready for the big festive sale in October. List your best products now!', 'event'),
  ('Quality Guidelines Updated', 'Product image quality guidelines have been updated. Please review the new requirements.', 'warning')
ON CONFLICT DO NOTHING;

-- Insert sample learning articles
INSERT INTO seller_learning (title, body, category) VALUES
  ('How to List Your First Product', 'Go to Inventory tab, click Add Product, fill in title, price, stock, category, and image URL. Your product goes live immediately.', 'getting_started'),
  ('Pricing Strategy for New Sellers', 'Start with competitive pricing. Use the Price Recommendation tool to get AI-powered suggestions based on market trends.', 'pricing'),
  ('Reducing Return Rates', 'Ensure accurate product descriptions, clear images, and correct sizing. Monitor return reasons in the Returns tab.', 'quality'),
  ('Boost Sales with Promotions', 'Create promotional campaigns and discount codes in the Promotions section to attract more buyers.', 'marketing')
ON CONFLICT DO NOTHING;
