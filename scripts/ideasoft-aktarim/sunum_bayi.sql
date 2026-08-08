-- Sunum icin bayi girisi hazirligi
-- Bayi: ERZMEKANIK DUNYA MUHENDISLIK (cari 120.AE.25.0052, 75 gercek siparis)
-- Giris: bayi@sadoksan.com / sunum2026
-- Kredi limiti sunum icin yukseltildi (mevcut bakiye 7.4M TL borc)
BEGIN;

UPDATE "User"
SET email = 'bayi@sadoksan.com',
    password = '$2b$10$5dKDx38atScOzsj4VUVHNOxJRgncFipRw6NjdX29UFKh4PFNOv2uq',
    "updatedAt" = now()
WHERE id = (SELECT "userId" FROM "Dealer" WHERE id = 'cmsdc2e430bwm01qh3uki6lxt');

UPDATE "Dealer"
SET status = 'APPROVED',
    "creditLimit" = 15000000,
    "approvedAt" = now(),
    "updatedAt" = now()
WHERE id = 'cmsdc2e430bwm01qh3uki6lxt';

COMMIT;

SELECT u.email,
       left(d.company, 34) AS bayi,
       d.status::text      AS durum,
       d."creditLimit"::bigint AS kredi_limiti,
       d."cariBalance"::bigint AS bakiye,
       (d."creditLimit" - d."cariBalance")::bigint AS kullanilabilir,
       (SELECT count(*) FROM "Order" o WHERE o."dealerId" = d.id) AS siparis
FROM "Dealer" d
JOIN "User" u ON u.id = d."userId"
WHERE d.id = 'cmsdc2e430bwm01qh3uki6lxt';
