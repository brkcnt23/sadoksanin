-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PRODUCT', 'CATEGORY', 'BRAND');

-- CreateEnum
CREATE TYPE "DiscountKind" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- DropIndex
DROP INDEX "Proforma_proformaNumber_idx";

-- DropIndex
DROP INDEX "Proforma_status_idx";

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "discountType" "DiscountKind" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Discount_type_idx" ON "Discount"("type");

-- CreateIndex
CREATE INDEX "Discount_isActive_idx" ON "Discount"("isActive");
