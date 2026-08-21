DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seller_verifications' AND column_name = 'mobile_number'
  ) THEN
    ALTER TABLE seller_verifications ADD COLUMN mobile_number text;
  END IF;
END $$;
