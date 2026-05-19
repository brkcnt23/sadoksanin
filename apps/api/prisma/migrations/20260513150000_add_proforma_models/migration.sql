-- CreateTable Proforma
CREATE TABLE "Proforma" (
    "id" TEXT NOT NULL,
    "proformaNumber" TEXT NOT NULL,
    "dealerId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "customerCity" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "templateType" TEXT NOT NULL DEFAULT 'LOCAL',
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyBank" TEXT,
    "companyBankAccount" TEXT,
    "internationalInvoiceNumber" TEXT,
    "internationalInvoiceDate" TIMESTAMP(3),
    "exporterRef" TEXT,
    "countryOrigin" TEXT,
    "countryDestination" TEXT,
    "preCarriage" TEXT,
    "portLoading" TEXT,
    "portDischarge" TEXT,
    "vessel" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "generatedBy" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProformaItem
CREATE TABLE "ProformaItem" (
    "id" TEXT NOT NULL,
    "proformaId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "brand" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProformaItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_proformaNumber_key" ON "Proforma"("proformaNumber");

-- CreateIndex
CREATE INDEX "Proforma_dealerId_idx" ON "Proforma"("dealerId");

-- CreateIndex
CREATE INDEX "Proforma_customerId_idx" ON "Proforma"("customerId");

-- CreateIndex
CREATE INDEX "Proforma_templateType_idx" ON "Proforma"("templateType");

-- CreateIndex
CREATE INDEX "Proforma_generatedAt_idx" ON "Proforma"("generatedAt");

-- CreateIndex
CREATE INDEX "Proforma_proformaNumber_idx" ON "Proforma"("proformaNumber");

-- CreateIndex
CREATE INDEX "Proforma_status_idx" ON "Proforma"("status");

-- CreateIndex
CREATE INDEX "ProformaItem_proformaId_idx" ON "ProformaItem"("proformaId");

-- CreateIndex
CREATE INDEX "ProformaItem_sku_idx" ON "ProformaItem"("sku");

-- AddForeignKey
ALTER TABLE "ProformaItem" ADD CONSTRAINT "ProformaItem_proformaId_fkey" FOREIGN KEY ("proformaId") REFERENCES "Proforma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
