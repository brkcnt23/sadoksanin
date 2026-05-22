-- test: cmpdyhakx00015fmfoq08b2fz | dealer: dealertestdemo2026 | Istanbul
-- erz: cmpdyj7wa00008cmfqspj6ry1 | dealer: cmpdyj7x300018cmf3ppnzuwc | Erzurum
-- p1:DURBAN(310) p2:NAVAS(315) p3:EVEREST(320) p4:LOFT(325) p5:GALAXY(330)
-- March
INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", "shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, status, "approvedAt", "createdAt", "updatedAt") VALUES
('ord01z', 'ORD-2026-001', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 4650, 930, 200, 5780, 'COMPLETED', '2026-03-04 10:00:00', '2026-03-03 09:00:00', '2026-03-08 10:00:00'),
('ord02z', 'ORD-2026-002', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 7800, 1560, 320, 9680, 'COMPLETED', '2026-03-09 14:00:00', '2026-03-08 11:00:00', '2026-03-12 14:00:00'),
('ord03z', 'ORD-2026-003', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 3150, 630, 160, 3940, 'COMPLETED', '2026-03-12 09:00:00', '2026-03-10 15:00:00', '2026-03-16 09:00:00'),
('ord04z', 'ORD-2026-004', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 12400, 2480, 480, 15360, 'COMPLETED', '2026-03-17 11:00:00', '2026-03-16 08:00:00', '2026-03-20 11:00:00'),
('ord05z', 'ORD-2026-005', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 9300, 1860, 360, 11520, 'COMPLETED', '2026-03-23 10:00:00', '2026-03-21 13:00:00', '2026-03-26 10:00:00'),
('ord06z', 'ORD-2026-006', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 16000, 3200, 600, 19800, 'COMPLETED', '2026-03-26 15:00:00', '2026-03-25 10:00:00', '2026-03-30 15:00:00'),
('ord07z', 'ORD-2026-007', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 6200, 1240, 280, 7720, 'COMPLETED', '2026-03-31 09:00:00', '2026-03-29 14:00:00', '2026-04-02 09:00:00');
INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", "taxRate", total, "createdAt") VALUES
('l001a','ord01z','cmpdyhamh00045fmf9hwknthm',10,320,0.20,3200,'2026-03-03 09:00:00'),('l001b','ord01z','cmpdyixh70004dfmfxsw4y6dp',5,310,0.20,1550,'2026-03-03 09:00:00'),
('l002a','ord02z','cmpdyhan200065fmf1e9bb28j',15,325,0.20,4875,'2026-03-08 11:00:00'),('l002b','ord02z','cmpdyhamu00055fmfshr3utb9',10,315,0.20,3150,'2026-03-08 11:00:00'),
('l003a','ord03z','cmpdyhamu00055fmfshr3utb9',10,315,0.20,3150,'2026-03-10 15:00:00'),
('l004a','ord04z','cmpdyixh00003dfmfbj0pqefj',20,330,0.20,6600,'2026-03-16 08:00:00'),('l004b','ord04z','cmpdyhamh00045fmf9hwknthm',10,320,0.20,3200,'2026-03-16 08:00:00'),('l004c','ord04z','cmpdyixh70004dfmfxsw4y6dp',10,310,0.20,3100,'2026-03-16 08:00:00'),
('l005a','ord05z','cmpdyhan200065fmf1e9bb28j',20,325,0.20,6500,'2026-03-21 13:00:00'),('l005b','ord05z','cmpdyhamh00045fmf9hwknthm',10,320,0.20,3200,'2026-03-21 13:00:00'),
('l006a','ord06z','cmpdyixh00003dfmfbj0pqefj',30,330,0.20,9900,'2026-03-25 10:00:00'),('l006b','ord06z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-03-25 10:00:00'),('l006c','ord06z','cmpdyhamu00055fmfshr3utb9',10,315,0.20,3150,'2026-03-25 10:00:00'),
('l007a','ord07z','cmpdyhamh00045fmf9hwknthm',10,320,0.20,3200,'2026-03-29 14:00:00'),('l007b','ord07z','cmpdyixh70004dfmfxsw4y6dp',10,310,0.20,3100,'2026-03-29 14:00:00');
-- April
INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", "shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, status, "approvedAt", "createdAt", "updatedAt") VALUES
('ord08z', 'ORD-2026-008', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 12800, 2560, 520, 15880, 'COMPLETED', '2026-04-03 10:00:00', '2026-04-01 09:00:00', '2026-04-05 10:00:00'),
('ord09z', 'ORD-2026-009', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 9900, 1980, 400, 12280, 'COMPLETED', '2026-04-07 14:00:00', '2026-04-06 12:00:00', '2026-04-10 14:00:00'),
('ord10z', 'ORD-2026-010', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 15500, 3100, 640, 19240, 'COMPLETED', '2026-04-13 09:00:00', '2026-04-11 10:00:00', '2026-04-15 09:00:00'),
('ord11z', 'ORD-2026-011', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 4800, 960, 200, 5960, 'COMPLETED', '2026-04-15 16:00:00', '2026-04-14 08:00:00', '2026-04-18 16:00:00'),
('ord12z', 'ORD-2026-012', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 18600, 3720, 720, 23040, 'COMPLETED', '2026-04-20 11:00:00', '2026-04-18 13:00:00', '2026-04-22 11:00:00'),
('ord13z', 'ORD-2026-013', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 8000, 1600, 320, 9920, 'PENDING_APPROVAL', null, '2026-04-22 10:00:00', '2026-04-22 10:00:00'),
('ord14z', 'ORD-2026-014', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 22000, 4400, 880, 27280, 'COMPLETED', '2026-04-27 09:00:00', '2026-04-25 14:00:00', '2026-04-29 09:00:00'),
('ord15z', 'ORD-2026-015', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 9300, 1860, 400, 11560, 'PENDING_APPROVAL', null, '2026-04-29 15:00:00', '2026-04-29 15:00:00');
INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", "taxRate", total, "createdAt") VALUES
('l008a','ord08z','cmpdyixh00003dfmfbj0pqefj',25,330,0.20,8250,'2026-04-01 09:00:00'),('l008b','ord08z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-04-01 09:00:00'),('l008c','ord08z','cmpdyixh70004dfmfxsw4y6dp',5,310,0.20,1550,'2026-04-01 09:00:00'),
('l009a','ord09z','cmpdyhamh00045fmf9hwknthm',20,320,0.20,6400,'2026-04-06 12:00:00'),('l009b','ord09z','cmpdyhamu00055fmfshr3utb9',10,315,0.20,3150,'2026-04-06 12:00:00'),
('l010a','ord10z','cmpdyhan200065fmf1e9bb28j',30,325,0.20,9750,'2026-04-11 10:00:00'),('l010b','ord10z','cmpdyixh00003dfmfbj0pqefj',10,330,0.20,3300,'2026-04-11 10:00:00'),('l010c','ord10z','cmpdyhamh00045fmf9hwknthm',10,320,0.20,3200,'2026-04-11 10:00:00'),
('l011a','ord11z','cmpdyhamh00045fmf9hwknthm',15,320,0.20,4800,'2026-04-14 08:00:00'),
('l012a','ord12z','cmpdyixh00003dfmfbj0pqefj',40,330,0.20,13200,'2026-04-18 13:00:00'),('l012b','ord12z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-04-18 13:00:00'),('l012c','ord12z','cmpdyhamu00055fmfshr3utb9',10,315,0.20,3150,'2026-04-18 13:00:00'),
('l013a','ord13z','cmpdyhan200065fmf1e9bb28j',20,325,0.20,6500,'2026-04-22 10:00:00'),('l013b','ord13z','cmpdyixh70004dfmfxsw4y6dp',5,310,0.20,1550,'2026-04-22 10:00:00'),
('l014a','ord14z','cmpdyhamh00045fmf9hwknthm',50,320,0.20,16000,'2026-04-25 14:00:00'),('l014b','ord14z','cmpdyixh00003dfmfbj0pqefj',10,330,0.20,3300,'2026-04-25 14:00:00'),('l014c','ord14z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-04-25 14:00:00'),
('l015a','ord15z','cmpdyhamu00055fmfshr3utb9',20,315,0.20,6300,'2026-04-29 15:00:00'),('l015b','ord15z','cmpdyixh70004dfmfxsw4y6dp',10,310,0.20,3100,'2026-04-29 15:00:00');
-- May
INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", "shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, status, "approvedAt", "createdAt", "updatedAt") VALUES
('ord16z', 'ORD-2026-016', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 11000, 2200, 440, 13640, 'COMPLETED', '2026-05-04 10:00:00', '2026-05-02 09:00:00', '2026-05-06 10:00:00'),
('ord17z', 'ORD-2026-017', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 13500, 2700, 560, 16760, 'COMPLETED', '2026-05-08 14:00:00', '2026-05-07 12:00:00', '2026-05-11 14:00:00'),
('ord18z', 'ORD-2026-018', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 6500, 1300, 280, 8080, 'COMPLETED', '2026-05-12 09:00:00', '2026-05-10 16:00:00', '2026-05-14 09:00:00'),
('ord19z', 'ORD-2026-019', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 19200, 3840, 800, 23840, 'PENDING_APPROVAL', null, '2026-05-14 11:00:00', '2026-05-14 11:00:00'),
('ord20z', 'ORD-2026-020', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 8800, 1760, 360, 10920, 'COMPLETED', '2026-05-18 10:00:00', '2026-05-16 08:00:00', '2026-05-20 10:00:00'),
('ord21z', 'ORD-2026-021', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 16500, 3300, 640, 20440, 'COMPLETED', '2026-05-21 11:00:00', '2026-05-19 14:00:00', '2026-05-22 11:00:00'),
('ord22z', 'ORD-2026-022', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 12400, 2480, 480, 15360, 'COMPLETED', '2026-05-24 15:00:00', '2026-05-22 10:00:00', '2026-05-26 15:00:00'),
('ord23z', 'ORD-2026-023', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 7200, 1440, 280, 8920, 'PENDING_APPROVAL', null, '2026-05-26 09:00:00', '2026-05-26 09:00:00'),
('ord24z', 'ORD-2026-024', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 9600, 1920, 400, 11920, 'PENDING_APPROVAL', null, '2026-05-28 13:00:00', '2026-05-28 13:00:00'),
('ord25z', 'ORD-2026-025', 'cmpdyhakx00015fmfoq08b2fz', 'B2B', 'dealertestdemo2026', 'Istanbul', 'Bagdat Cad. No:150 Kadikoy', 21000, 4200, 800, 26000, 'COMPLETED', '2026-05-30 10:00:00', '2026-05-29 15:00:00', '2026-06-01 10:00:00');
INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", "taxRate", total, "createdAt") VALUES
('l016a','ord16z','cmpdyixh00003dfmfbj0pqefj',20,330,0.20,6600,'2026-05-02 09:00:00'),('l016b','ord16z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-05-02 09:00:00'),('l016c','ord16z','cmpdyixh70004dfmfxsw4y6dp',5,310,0.20,1550,'2026-05-02 09:00:00'),
('l017a','ord17z','cmpdyhamh00045fmf9hwknthm',30,320,0.20,9600,'2026-05-07 12:00:00'),('l017b','ord17z','cmpdyhamu00055fmfshr3utb9',10,315,0.20,3150,'2026-05-07 12:00:00'),('l017c','ord17z','cmpdyixh70004dfmfxsw4y6dp',5,310,0.20,1550,'2026-05-07 12:00:00'),
('l018a','ord18z','cmpdyhan200065fmf1e9bb28j',20,325,0.20,6500,'2026-05-10 16:00:00'),
('l019a','ord19z','cmpdyixh00003dfmfbj0pqefj',40,330,0.20,13200,'2026-05-14 11:00:00'),('l019b','ord19z','cmpdyhamh00045fmf9hwknthm',10,320,0.20,3200,'2026-05-14 11:00:00'),('l019c','ord19z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-05-14 11:00:00'),
('l020a','ord20z','cmpdyhamh00045fmf9hwknthm',20,320,0.20,6400,'2026-05-16 08:00:00'),('l020b','ord20z','cmpdyixh70004dfmfxsw4y6dp',10,310,0.20,3100,'2026-05-16 08:00:00'),
('l021a','ord21z','cmpdyixh00003dfmfbj0pqefj',30,330,0.20,9900,'2026-05-19 14:00:00'),('l021b','ord21z','cmpdyhan200065fmf1e9bb28j',15,325,0.20,4875,'2026-05-19 14:00:00'),('l021c','ord21z','cmpdyhamu00055fmfshr3utb9',5,315,0.20,1575,'2026-05-19 14:00:00'),
('l022a','ord22z','cmpdyhamh00045fmf9hwknthm',25,320,0.20,8000,'2026-05-22 10:00:00'),('l022b','ord22z','cmpdyhan200065fmf1e9bb28j',10,325,0.20,3250,'2026-05-22 10:00:00'),('l022c','ord22z','cmpdyixh70004dfmfxsw4y6dp',5,310,0.20,1550,'2026-05-22 10:00:00'),
('l023a','ord23z','cmpdyhamu00055fmfshr3utb9',15,315,0.20,4725,'2026-05-26 09:00:00'),('l023b','ord23z','cmpdyixh70004dfmfxsw4y6dp',10,310,0.20,3100,'2026-05-26 09:00:00'),
('l024a','ord24z','cmpdyhamh00045fmf9hwknthm',30,320,0.20,9600,'2026-05-28 13:00:00'),
('l025a','ord25z','cmpdyixh00003dfmfbj0pqefj',40,330,0.20,13200,'2026-05-29 15:00:00'),('l025b','ord25z','cmpdyhan200065fmf1e9bb28j',20,325,0.20,6500,'2026-05-29 15:00:00'),('l025c','ord25z','cmpdyhamh00045fmf9hwknthm',5,320,0.20,1600,'2026-05-29 15:00:00');

-- Erzurum
INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", "shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, status, "approvedAt", "createdAt", "updatedAt") VALUES
('ord101z','ORD-2026-101','cmpdyj7wa00008cmfqspj6ry1','B2B','cmpdyj7x300018cmf3ppnzuwc','Erzurum','Cumhuriyet Cad. No:45 Erzurum',1240,248,120,1608,'COMPLETED','2026-04-10 10:00:00','2026-04-08 09:00:00','2026-04-15 10:00:00'),
('ord102z','ORD-2026-102','cmpdyj7wa00008cmfqspj6ry1','B2B','cmpdyj7x300018cmf3ppnzuwc','Erzurum','Cumhuriyet Cad. No:45 Erzurum',1575,315,120,2010,'COMPLETED','2026-05-02 11:00:00','2026-04-28 14:00:00','2026-05-05 11:00:00'),
('ord103z','ORD-2026-103','cmpdyj7wa00008cmfqspj6ry1','B2B','cmpdyj7x300018cmf3ppnzuwc','Erzurum','Cumhuriyet Cad. No:45 Erzurum',960,192,120,1272,'PENDING_APPROVAL',null,'2026-05-15 10:00:00','2026-05-15 10:00:00');
INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", "taxRate", total, "createdAt") VALUES
('l101a','ord101z','cmpdyhamh00045fmf9hwknthm',2,320,0.20,640,'2026-04-08 09:00:00'),('l101b','ord101z','cmpdyhan200065fmf1e9bb28j',2,325,0.20,650,'2026-04-08 09:00:00'),
('l102a','ord102z','cmpdyixh00003dfmfbj0pqefj',3,330,0.20,990,'2026-04-28 14:00:00'),('l102b','ord102z','cmpdyhamu00055fmfshr3utb9',2,315,0.20,630,'2026-04-28 14:00:00'),
('l103a','ord103z','cmpdyhamh00045fmf9hwknthm',3,320,0.20,960,'2026-05-15 10:00:00');

UPDATE "Dealer" SET "totalOrders"=(SELECT COUNT(*) FROM "Order" WHERE "dealerId"='dealertestdemo2026'), "totalRevenue"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='dealertestdemo2026' AND status='COMPLETED'), "cariBalance"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='dealertestdemo2026' AND status='COMPLETED')*-1, "lastOrderAt"='2026-05-29 15:00:00' WHERE id='dealertestdemo2026';
UPDATE "Dealer" SET "totalOrders"=(SELECT COUNT(*) FROM "Order" WHERE "dealerId"='cmpdyj7x300018cmf3ppnzuwc'), "totalRevenue"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='cmpdyj7x300018cmf3ppnzuwc' AND status='COMPLETED'), "cariBalance"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='cmpdyj7x300018cmf3ppnzuwc' AND status='COMPLETED')*-1, "lastOrderAt"='2026-05-15 10:00:00' WHERE id='cmpdyj7x300018cmf3ppnzuwc';
