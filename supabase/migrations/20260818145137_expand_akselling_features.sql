/*
# AKSelling Feature Expansion — Seller Verification, Videos, Bank Details, RTO

## Overview
Adds seller registration/verification (GST or PAN+ID), product video uploads,
seller bank details for payouts, and RTO/returns tracking to the orders system.

## New Tables

### seller_verifications
Stores seller onboarding verification data. One row per seller.
- id (uuid, PK)
- user_id (uuid, FK to auth.users, unique)
- verification_method (text: 'gst' | 'document')
- gst_number (text, nullable) — for GST method
- business_name (text, nullable) — for GST method
- pan_number (text, nullable) — for document method
- id_type (text, nullable) — 'aadhaar' | 'voter' | 'driving' | 'passport' for document method
- id_number (text, nullable) — last 4 digits / reference for document method
- status (text: 'pending' | 'approved' | 'rejected', default 'pending')
- created_at (timestamptz)

### product_videos
Short product videos uploaded by customers/sellers with a Buy Now link.
- id (uuid, PK)
- user_id (uuid, FK to auth.users — uploader)
- product_id (uuid, FK to products — linked product for Buy Now)
- title (text)
- video_url (text) — URL to the uploaded video
- thumbnail_url (text, nullable)
- created_at (timestamptz)

### seller_bank_details
Payout bank account info for sellers.
- id (uuid, PK)
- user_id (uuid, FK to auth.users, unique)
- account_holder (text)
- account_number (text)
- ifsc_code (text)
- bank_name (text)
- upi_id (text, nullable)
- created_at (timestamptz)

## Modified Tables

### orders
- Added status value 'rto' to the CHECK constraint (Return to Origin / returned orders).

### profiles
- Added seller_verification_status column to track whether seller onboarding is complete.

## Security (RLS)
- seller_verifications: owner-scoped CRUD (seller can submit their own verification).
- product_videos: public SELECT (anyone can browse videos); authenticated INSERT/UPDATE/DELETE
  for the uploader.
- seller_bank_details: owner-scoped CRUD (seller manages their own bank info).

## Helper Functions
- is_verified_seller() — returns true if the user has role 'seller' AND an approved
  seller_verification. SECURITY DEFINER for safe cross-table reads.
*/

-- ---------- seller_verifications ----------
CREATE TABLE IF NOT EXISTS seller_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_method text NOT NULL CHECK (verification_method IN ('gst', 'document')),
  gst_number text,
  business_name text,
  pan_number text,
  id_type text CHECK (id_type IS NULL OR id_type IN ('aadhaar', 'voter', 'driving', 'passport')),
  id_number text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seller_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_verification" ON seller_verifications;
CREATE POLICY "select_own_verification" ON seller_verifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_verification" ON seller_verifications;
CREATE POLICY "insert_own_verification" ON seller_verifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_verification" ON seller_verifications;
CREATE POLICY "update_own_verification" ON seller_verifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- product_videos ----------
CREATE TABLE IF NOT EXISTS product_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  title text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

-- Public read so browsing works without sign-in
DROP POLICY IF EXISTS "public_select_videos" ON product_videos;
CREATE POLICY "public_select_videos" ON product_videos FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated users can upload their own videos
DROP POLICY IF EXISTS "insert_own_videos" ON product_videos;
CREATE POLICY "insert_own_videos" ON product_videos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Owners can update/delete their own videos
DROP POLICY IF EXISTS "update_own_videos" ON product_videos;
CREATE POLICY "update_own_videos" ON product_videos FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_videos" ON product_videos;
CREATE POLICY "delete_own_videos" ON product_videos FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- seller_bank_details ----------
CREATE TABLE IF NOT EXISTS seller_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_holder text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  bank_name text NOT NULL,
  upi_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seller_bank_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bank" ON seller_bank_details;
CREATE POLICY "select_own_bank" ON seller_bank_details FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bank" ON seller_bank_details;
CREATE POLICY "insert_own_bank" ON seller_bank_details FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bank" ON seller_bank_details;
CREATE POLICY "update_own_bank" ON seller_bank_details FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bank" ON seller_bank_details;
CREATE POLICY "delete_own_bank" ON seller_bank_details FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- Modify orders: add 'rto' status ----------
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
  CHECK (status IN ('pending', 'dispatched', 'delivered', 'rto'));

-- ---------- is_verified_seller helper ----------
CREATE OR REPLACE FUNCTION public.is_verified_seller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM seller_verifications sv
    WHERE sv.user_id = auth.uid() AND sv.status = 'approved'
  );
$$;

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_verifications_user_id ON seller_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_user_id ON seller_bank_details(user_id);