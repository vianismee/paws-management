-- Migration: Update products table structure for IDR pricing and volume
-- This migration removes price fields and adds volume and price_notes fields

-- Drop price-related columns (they will be deprecated)
ALTER TABLE "products" DROP COLUMN IF EXISTS "unit_price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "retail_price";
ALTER TABLE "products" DROP COLUMN IF EXISTS "wholesale_price";

-- Add new columns
ALTER TABLE "products" ADD COLUMN "volume" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "price_notes" TEXT;

-- Update indexes since we removed price-based sorting
DROP INDEX IF EXISTS "products_unit_price_idx";

-- Add comments for documentation
COMMENT ON COLUMN "products"."volume" IS 'Volume per product in the specified unit';
COMMENT ON COLUMN "products"."price_notes" IS 'Notes about pricing calculation for IDR currency';