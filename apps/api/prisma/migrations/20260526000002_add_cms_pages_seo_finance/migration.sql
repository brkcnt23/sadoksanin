-- CMS Pages (dinamik sayfalar)
CREATE TABLE "CmsPage" (
    "id" TEXT NOT NULL, "title" TEXT NOT NULL, "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT, "seoMeta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CmsPage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CmsPage_slug_key" ON "CmsPage"("slug");
CREATE INDEX "CmsPage_isActive_idx" ON "CmsPage"("isActive");

-- SEO Redirects (301 yönlendirme)
CREATE TABLE "SeoRedirect" (
    "id" TEXT NOT NULL, "oldUrl" TEXT NOT NULL, "newUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoRedirect_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SeoRedirect_oldUrl_key" ON "SeoRedirect"("oldUrl");

-- Balance Transaction (açık hesap / bayi cari hareket)
CREATE TABLE "BalanceTransaction" (
    "id" TEXT NOT NULL, "dealerId" TEXT NOT NULL, "orderId" TEXT,
    "type" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL, "balanceAfter" DOUBLE PRECISION NOT NULL,
    "description" TEXT, "referenceType" TEXT, "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BalanceTransaction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BalanceTransaction_dealerId_idx" ON "BalanceTransaction"("dealerId");
CREATE INDEX "BalanceTransaction_createdAt_idx" ON "BalanceTransaction"("createdAt");
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BalanceTransaction" ADD CONSTRAINT "BalanceTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- E-Document Log (e-fatura, e-arşiv, e-irsaliye entegratör logu)
CREATE TABLE "EdocumentLog" (
    "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING', "externalId" TEXT, "externalUuid" TEXT,
    "requestPayload" JSONB, "responsePayload" JSONB, "errorMessage" TEXT,
    "submittedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EdocumentLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EdocumentLog_orderId_idx" ON "EdocumentLog"("orderId");
CREATE INDEX "EdocumentLog_status_idx" ON "EdocumentLog"("status");
ALTER TABLE "EdocumentLog" ADD CONSTRAINT "EdocumentLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bank Transfer (havale bildirimi)
CREATE TABLE "BankTransfer" (
    "id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "bank" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
    "senderName" TEXT NOT NULL, "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT, "approvedAt" TIMESTAMP(3), "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BankTransfer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BankTransfer_orderId_idx" ON "BankTransfer"("orderId");
CREATE INDEX "BankTransfer_status_idx" ON "BankTransfer"("status");
ALTER TABLE "BankTransfer" ADD CONSTRAINT "BankTransfer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BankTransfer" ADD CONSTRAINT "BankTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SiteSettings genişletme (entegrasyon API anahtarları)
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "alneoApiUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "alneoApiKey" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "albarakaApiUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "albarakaMerchantId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netsisApiUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "netsisUsername" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;

-- Order genişletme (e-arşiv + admin notları)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eArchiveNo" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "eArchiveStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "adminNotes" JSONB;
