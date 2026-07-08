-- Bayi başına sorumlu plasiyer (satış temsilcisi) ataması
ALTER TABLE "Dealer" ADD COLUMN "salesRepId" TEXT;

CREATE INDEX "Dealer_salesRepId_idx" ON "Dealer"("salesRepId");

ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_salesRepId_fkey"
  FOREIGN KEY ("salesRepId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
