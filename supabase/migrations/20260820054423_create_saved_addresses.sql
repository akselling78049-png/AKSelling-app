/*
# Create saved_addresses table

1. New Tables
- `saved_addresses`
- id (uuid, PK)
- user_id (uuid, FK to auth.users, defaults to auth.uid())
- name (text) — recipient name
- phone (text) — contact phone
- pincode (text) — delivery pincode
- address (text) — full address line
- city (text, nullable)
- state (text, nullable)
- created_at (timestamptz)

2. Security
- Enable RLS on saved_addresses.
- Owner-scoped CRUD: each authenticated user can only access their own addresses.
- user_id defaults to auth.uid() so inserts without explicit user_id succeed.
*/

CREATE TABLE IF NOT EXISTS saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  pincode text NOT NULL,
  address text NOT NULL,
  city text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_addresses" ON saved_addresses;
CREATE POLICY "select_own_addresses" ON saved_addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_addresses" ON saved_addresses;
CREATE POLICY "insert_own_addresses" ON saved_addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_addresses" ON saved_addresses;
CREATE POLICY "update_own_addresses" ON saved_addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_addresses" ON saved_addresses;
CREATE POLICY "delete_own_addresses" ON saved_addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
