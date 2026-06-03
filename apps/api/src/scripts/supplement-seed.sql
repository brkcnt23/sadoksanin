-- ============================================================================
-- Supplementary Demo Seed v2: Sepet, Stok Rezervasyonu, Proforma, Havale
-- ============================================================================

-- 1. CART ITEMS — Demo kullanıcılara sepet (varsa atla)
-- ============================================================================
INSERT INTO "CartItem" ("id", "userId", "productId", "quantity", "addedAt")
SELECT 'cart-ahmet-1', 'cmpx4r9zh000dmeph2yp0m22h', p.id, 3, NOW() - INTERVAL '2 hours'
FROM "Product" p WHERE p.sku = '9110'
UNION ALL
SELECT 'cart-ahmet-2', 'cmpx4r9zh000dmeph2yp0m22h', p.id, 5, NOW() - INTERVAL '1 hour'
FROM "Product" p WHERE p.sku = '9057'
UNION ALL
SELECT 'cart-ayse-1', 'cmpx4ra0r000imephdzy917aj', p.id, 2, NOW() - INTERVAL '30 minutes'
FROM "Product" p WHERE p.sku = '8938'
UNION ALL
SELECT 'cart-mehmet-1', 'cmpx4ra12000lmepha54p3yyr', p.id, 1, NOW() - INTERVAL '5 hours'
FROM "Product" p WHERE p.sku = '9097'
UNION ALL
SELECT 'cart-mehmet-2', 'cmpx4ra12000lmepha54p3yyr', p.id, 2, NOW() - INTERVAL '3 hours'
FROM "Product" p WHERE p.sku = '8940'
UNION ALL
SELECT 'cart-mehmet-3', 'cmpx4ra12000lmepha54p3yyr', p.id, 4, NOW() - INTERVAL '1 hour'
FROM "Product" p WHERE p.sku = '9138'
ON CONFLICT DO NOTHING;

-- 2. STOCK RESERVATIONS — cast enum explicitly
-- ============================================================================
INSERT INTO "StockReservation" ("id", "orderId", "productId", "quantity", "status", "createdAt", "updatedAt")
SELECT 'sres-' || REPLACE(ol.id, 'cmpx', ''), ol."orderId", ol."productId", ol.quantity,
       CASE WHEN o.status IN ('APPROVED', 'PREPARING', 'PENDING_APPROVAL') THEN 'ACTIVE'::"StockReservationStatus"
            WHEN o.status IN ('SHIPPED', 'COMPLETED') THEN 'FULFILLED'::"StockReservationStatus"
            ELSE 'ACTIVE'::"StockReservationStatus" END,
       o."createdAt", o."createdAt"
FROM "OrderLine" ol
JOIN "Order" o ON o.id = ol."orderId"
ON CONFLICT DO NOTHING;

-- 3. PROFORMA — B2B completed siparişe
-- ============================================================================
INSERT INTO "Proforma" (
  "id", "proformaNumber", "dealerId", "customerId", "customerName",
  "customerAddress", "customerCity", "customerPhone", "customerEmail",
  "status", "templateType",
  "companyName", "companyAddress", "companyPhone", "companyEmail",
  "companyBank", "companyBankAccount",
  "subtotal", "shipping", "tax", "totalAmount",
  "generatedBy", "generatedAt", "createdAt", "updatedAt"
)
SELECT
  'prof-001',
  'PF-2026-0001',
  d.id,
  o."customerId",
  u.name,
  'Kordon Boyu No:78, Alsancak / İzmir',
  'İzmir',
  u.phone,
  u.email,
  'SENT',
  'B2B',
  d.company,
  d.address,
  d.phone,
  u.email,
  'Ziraat Bankası',
  'TR12 3456 7890 1234 5678 9012 34',
  o.subtotal,
  o."logisticsSurcharge",
  o.tax,
  o.total,
  'admin-1',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM "Order" o
JOIN "Dealer" d ON d.id = o."dealerId"
JOIN "User" u ON u.id = o."customerId"
WHERE o."customerType" = 'B2B' AND o.status = 'COMPLETED'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Proforma kalemleri
INSERT INTO "ProformaItem" ("id", "proformaId", "sku", "productName", "description", "brand", "quantity", "unitPrice", "lineTotal", "imageUrl", "createdAt")
SELECT
  'profi-' || REPLACE(ol.id, 'cmpx', ''),
  'prof-001',
  p.sku,
  p.name,
  p.name,
  p.brand,
  ol.quantity,
  ol."unitPrice",
  ol.total,
  p."imageUrl",
  NOW() - INTERVAL '1 day'
FROM "OrderLine" ol
JOIN "Product" p ON p.id = ol."productId"
WHERE ol."orderId" IN (
  SELECT id FROM "Order" WHERE "customerType" = 'B2B' AND status = 'COMPLETED' LIMIT 1
)
ON CONFLICT DO NOTHING;

-- 4. BANK TRANSFER — Mehmet'in onaylanmış siparişi için
-- ============================================================================
INSERT INTO "BankTransfer" ("id", "orderId", "userId", "bank", "amount", "senderName", "note", "status", "createdAt")
SELECT
  'bt-001',
  o.id,
  o."customerId",
  'Ziraat Bankası',
  o.total,
  u.name,
  'Sipariş ' || o."orderNo" || ' için havaledir. Dekont ektedir.',
  'PENDING',
  NOW() - INTERVAL '30 minutes'
FROM "Order" o
JOIN "User" u ON u.id = o."customerId"
WHERE o."customerType" = 'B2C' AND o.status = 'APPROVED' AND u.email = 'mehmet@test.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. VERIFY
-- ============================================================================
SELECT 'CartItem' as tablo, count(*) FROM "CartItem"
UNION ALL SELECT 'StockReservation', count(*) FROM "StockReservation"
UNION ALL SELECT 'Proforma', count(*) FROM "Proforma"
UNION ALL SELECT 'ProformaItem', count(*) FROM "ProformaItem"
UNION ALL SELECT 'BankTransfer', count(*) FROM "BankTransfer"
ORDER BY tablo;
