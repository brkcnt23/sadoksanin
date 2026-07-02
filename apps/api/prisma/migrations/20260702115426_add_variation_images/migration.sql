-- Add images (JSON array as text) to ProductVariation for per-variant image selection
ALTER TABLE "ProductVariation" ADD COLUMN IF NOT EXISTS "images" TEXT;
