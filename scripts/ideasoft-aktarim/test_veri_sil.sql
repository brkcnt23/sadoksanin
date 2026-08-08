-- Test verisi temizligi
-- KORUNAN: admin@admin.com (tek yonetici hesabi), Netsis'ten aktarilan 1879 siparis (NTS-*)
-- SILINEN: SDK-* test siparisleri, @test.com hesaplari, claude-verify dogrulama hesabi
BEGIN;

-- 1) test siparislerinin kalemleri ve kendileri
DELETE FROM "OrderStatusHistory" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "orderNo" LIKE 'SDK-%');
DELETE FROM "OrderLine" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "orderNo" LIKE 'SDK-%');
DELETE FROM "Order" WHERE "orderNo" LIKE 'SDK-%';

-- 2) test hesaplarina bagli yardimci kayitlar
CREATE TEMP TABLE _test_users AS
SELECT id FROM "User"
WHERE email LIKE '%@test.com'
   OR email = 'claude-verify@sadoksan.internal';

DELETE FROM "CartItem" WHERE "userId" IN (SELECT id FROM _test_users);
DELETE FROM "Favorite" WHERE "userId" IN (SELECT id FROM _test_users);
DELETE FROM "Address" WHERE "userId" IN (SELECT id FROM _test_users);
DELETE FROM "StockReservation" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "orderNo" LIKE 'SDK-%');
DELETE FROM "BalanceTransaction" WHERE "dealerId" IN (SELECT id FROM "Dealer" WHERE "userId" IN (SELECT id FROM _test_users));
DELETE FROM "ProformaItem" WHERE "proformaId" IN (SELECT id FROM "Proforma" WHERE "dealerId" IN (SELECT id FROM "Dealer" WHERE "userId" IN (SELECT id FROM _test_users)));
DELETE FROM "Proforma" WHERE "dealerId" IN (SELECT id FROM "Dealer" WHERE "userId" IN (SELECT id FROM _test_users));

-- 3) bayi kayitlari, sonra kullanicilar
DELETE FROM "Dealer" WHERE "userId" IN (SELECT id FROM _test_users);
DELETE FROM "User" WHERE id IN (SELECT id FROM _test_users);

COMMIT;

-- sonuc
SELECT
  (SELECT count(*) FROM "Order")   AS siparis,
  (SELECT count(*) FROM "User")    AS kullanici,
  (SELECT count(*) FROM "Dealer")  AS bayi,
  (SELECT count(*) FROM "User" WHERE role::text LIKE '%ADMIN%') AS yonetici;
