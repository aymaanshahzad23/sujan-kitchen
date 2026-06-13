-- Migrate dish margin % + selling price → cost_price (Rs per portion)
-- Safe if 003 was only applied as RENAME (cost_price still holds margin %)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dishes' AND column_name = 'price'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dishes' AND column_name = 'margin'
  ) THEN
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS cost_price_rs numeric;
    UPDATE dishes
    SET cost_price_rs = ROUND(price * (1 - margin / 100.0))
    WHERE price IS NOT NULL AND margin IS NOT NULL;
    ALTER TABLE dishes DROP COLUMN margin;
    ALTER TABLE dishes DROP COLUMN price;
    ALTER TABLE dishes RENAME COLUMN cost_price_rs TO cost_price;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dishes' AND column_name = 'price'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dishes' AND column_name = 'cost_price'
  ) THEN
    -- 003 RENAME only: cost_price column still contains margin %
    UPDATE dishes
    SET cost_price = ROUND(price * (1 - cost_price / 100.0))
    WHERE price IS NOT NULL AND cost_price IS NOT NULL AND cost_price <= 85;
    UPDATE dishes
    SET cost_price = ROUND(price * (1 - cost_price / 100.0))
    WHERE price IS NOT NULL AND cost_price IS NOT NULL AND cost_price > 85 AND cost_price < 200;
    ALTER TABLE dishes DROP COLUMN IF EXISTS price;
  END IF;
END $$;

ALTER TABLE dishes ALTER COLUMN cost_price SET DEFAULT 200;
UPDATE dishes SET cost_price = 200 WHERE cost_price IS NULL OR cost_price <= 0;
ALTER TABLE dishes ALTER COLUMN cost_price SET NOT NULL;
