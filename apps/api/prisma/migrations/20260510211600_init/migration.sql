-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'DEALER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "DealerStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING', 'ERROR', 'NEVER');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('B2C', 'B2B');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'PREPARING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EInvoiceStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'FULFILLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "taxNo" TEXT NOT NULL,
    "taxOffice" TEXT NOT NULL,
    "cariNo" TEXT NOT NULL,
    "cariValidated" BOOLEAN NOT NULL DEFAULT false,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'Marmara',
    "address" TEXT NOT NULL,
    "status" "DealerStatus" NOT NULL DEFAULT 'PENDING',
    "cariBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "netsisCode" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "unit" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "netsisStock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "displayStock" INTEGER NOT NULL DEFAULT 0,
    "lastNetsisSync" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minimumStock" INTEGER NOT NULL DEFAULT 0,
    "middleStock" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "purchasable" BOOLEAN NOT NULL DEFAULT true,
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'NEVER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "attributes" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerType" "CustomerType" NOT NULL,
    "dealerId" TEXT,
    "shippingCity" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "logisticsSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "eInvoiceNo" TEXT,
    "eInvoiceStatus" "EInvoiceStatus",
    "eIrsaliyeNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variationId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetsisSync" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncDuration" INTEGER NOT NULL DEFAULT 0,
    "itemsSynced" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "nextScheduledAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetsisSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalPricingSurcharge" (
    "id" TEXT NOT NULL,
    "regionKey" TEXT NOT NULL,
    "surcharge" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionalPricingSurcharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvincePricingSurcharge" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "surcharge" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProvincePricingSurcharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogisticsRule" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "cities" TEXT[],
    "baseSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perKgSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perM2Surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freeShippingThreshold" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogisticsRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "liveRate" DOUBLE PRECISION,
    "manualOverride" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCurrencyPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCurrencyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "maintenanceAllowAdmins" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_userId_key" ON "Dealer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_taxNo_key" ON "Dealer"("taxNo");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_cariNo_key" ON "Dealer"("cariNo");

-- CreateIndex
CREATE INDEX "Dealer_cariNo_idx" ON "Dealer"("cariNo");

-- CreateIndex
CREATE INDEX "Dealer_status_idx" ON "Dealer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_netsisCode_key" ON "Product"("netsisCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_netsisCode_idx" ON "Product"("netsisCode");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_syncStatus_idx" ON "Product"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariation_productId_sku_key" ON "ProductVariation"("productId", "sku");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_dealerId_idx" ON "Order"("dealerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_orderNo_idx" ON "Order"("orderNo");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "OrderLine_productId_idx" ON "OrderLine"("productId");

-- CreateIndex
CREATE INDEX "StockReservation_orderId_idx" ON "StockReservation"("orderId");

-- CreateIndex
CREATE INDEX "StockReservation_productId_idx" ON "StockReservation"("productId");

-- CreateIndex
CREATE INDEX "StockReservation_status_idx" ON "StockReservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NetsisSync_syncType_key" ON "NetsisSync"("syncType");

-- CreateIndex
CREATE UNIQUE INDEX "RegionalPricingSurcharge_regionKey_key" ON "RegionalPricingSurcharge"("regionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProvincePricingSurcharge_province_key" ON "ProvincePricingSurcharge"("province");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currency_key" ON "ExchangeRate"("currency");

-- CreateIndex
CREATE INDEX "ProductCurrencyPrice_productId_idx" ON "ProductCurrencyPrice"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCurrencyPrice_productId_currency_key" ON "ProductCurrencyPrice"("productId", "currency");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariation" ADD CONSTRAINT "ProductVariation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
