-- CreateEnum
CREATE TYPE "PopupAudience" AS ENUM ('ALL', 'B2C', 'B2B', 'SPECIFIC_DEALER');

-- CreateTable
CREATE TABLE "Popup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaUrl" TEXT,
    "audience" "PopupAudience" NOT NULL DEFAULT 'ALL',
    "dealerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "showOnce" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Popup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotifyRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "NotifyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Popup_isActive_idx" ON "Popup"("isActive");

-- CreateIndex
CREATE INDEX "Popup_audience_idx" ON "Popup"("audience");

-- CreateIndex
CREATE INDEX "NotifyRequest_productId_idx" ON "NotifyRequest"("productId");

-- CreateIndex
CREATE INDEX "NotifyRequest_status_idx" ON "NotifyRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotifyRequest_productId_userId_channel_key" ON "NotifyRequest"("productId", "userId", "channel");
