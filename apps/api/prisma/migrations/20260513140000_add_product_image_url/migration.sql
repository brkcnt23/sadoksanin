-- Adds optional product image URL/data-URI used by proforma PDF and storefront cards
ALTER TABLE "Product" ADD COLUMN "imageUrl" TEXT;
