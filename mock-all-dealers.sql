-- ANKARA: user=cmpe05n5100025lo8vsicjkm8 dealer=cmpe05n5p00035lo8k7rr7v3f
-- ERZURUM: user=cmpe08nhz00008zo80syzi67m dealer=cmpe08nir00018zo8yt05qhfp
-- P1(DURBAN,310) P2(NAVAS,315) P3(EVEREST,320) P4(LOFT,325) P5(GALAXY,330)

-- === ANKARA (Mehmet Demir) ===
INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", "shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, status, "approvedAt", "createdAt", "updatedAt") VALUES
('ank01','ORD-2026-201','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',6200,1240,280,7720,'COMPLETED','2026-03-05','2026-03-04','2026-03-09'),
('ank02','ORD-2026-202','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',9450,1890,360,11700,'COMPLETED','2026-03-12','2026-03-10','2026-03-15'),
('ank03','ORD-2026-203','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',4800,960,200,5960,'COMPLETED','2026-03-20','2026-03-18','2026-03-23'),
('ank04','ORD-2026-204','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',15500,3100,600,19200,'COMPLETED','2026-03-28','2026-03-26','2026-03-31'),
('ank05','ORD-2026-205','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',11200,2240,440,13880,'COMPLETED','2026-04-05','2026-04-03','2026-04-08'),
('ank06','ORD-2026-206','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',8800,1760,360,10920,'COMPLETED','2026-04-12','2026-04-10','2026-04-15'),
('ank07','ORD-2026-207','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',7200,1440,320,8960,'COMPLETED','2026-04-20','2026-04-18','2026-04-23'),
('ank08','ORD-2026-208','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',18600,3720,720,23040,'COMPLETED','2026-04-28','2026-04-25','2026-04-30'),
('ank09','ORD-2026-209','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',6500,1300,280,8080,'PENDING_APPROVAL',null,'2026-04-30','2026-04-30'),
('ank10','ORD-2026-210','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',13200,2640,520,16360,'COMPLETED','2026-05-06','2026-05-04','2026-05-09'),
('ank11','ORD-2026-211','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',9900,1980,400,12280,'COMPLETED','2026-05-10','2026-05-08','2026-05-12'),
('ank12','ORD-2026-212','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',5400,1080,240,6720,'COMPLETED','2026-05-14','2026-05-12','2026-05-16'),
('ank13','ORD-2026-213','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',16500,3300,640,20440,'PENDING_APPROVAL',null,'2026-05-16','2026-05-16'),
('ank14','ORD-2026-214','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',7800,1560,320,9680,'COMPLETED','2026-05-20','2026-05-18','2026-05-22'),
('ank15','ORD-2026-215','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',12600,2520,480,15600,'COMPLETED','2026-05-24','2026-05-22','2026-05-26'),
('ank16','ORD-2026-216','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',4400,880,200,5480,'PENDING_APPROVAL',null,'2026-05-26','2026-05-26'),
('ank17','ORD-2026-217','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',10200,2040,400,12640,'COMPLETED','2026-05-28','2026-05-27','2026-05-30'),
('ank18','ORD-2026-218','cmpe05n5100025lo8vsicjkm8','B2B','cmpe05n5p00035lo8k7rr7v3f','Ankara','Ataturk Bulvari No:100',8400,1680,360,10440,'COMPLETED','2026-05-30','2026-05-29','2026-06-01');

-- Ankara order lines
INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", "taxRate", total, "createdAt") VALUES
('ak01a','ank01','cmpe05n6a00045lo8r7bfwcv0',10,320,0.20,3200,'2026-03-04'),('ak01b','ank01','cmpe0855w0004h7o8rrcae80z',10,310,0.20,3100,'2026-03-04'),
('ak02a','ank02','cmpe05n6y00065lo8fwhr550p',15,325,0.20,4875,'2026-03-10'),('ak02b','ank02','cmpe05n6m00055lo8r3p2ng44',15,315,0.20,4725,'2026-03-10'),
('ak03a','ank03','cmpe05n6a00045lo8r7bfwcv0',15,320,0.20,4800,'2026-03-18'),
('ak04a','ank04','cmpe0855p0003h7o891o3zv4u',30,330,0.20,9900,'2026-03-26'),('ak04b','ank04','cmpe05n6y00065lo8fwhr550p',10,325,0.20,3250,'2026-03-26'),('ak04c','ank04','cmpe0855w0004h7o8rrcae80z',5,310,0.20,1550,'2026-03-26'),
('ak05a','ank05','cmpe05n6a00045lo8r7bfwcv0',25,320,0.20,8000,'2026-04-03'),('ak05b','ank05','cmpe05n6m00055lo8r3p2ng44',10,315,0.20,3150,'2026-04-03'),
('ak06a','ank06','cmpe05n6y00065lo8fwhr550p',20,325,0.20,6500,'2026-04-10'),('ak06b','ank06','cmpe0855w0004h7o8rrcae80z',10,310,0.20,3100,'2026-04-10'),
('ak07a','ank07','cmpe05n6y00065lo8fwhr550p',15,325,0.20,4875,'2026-04-18'),('ak07b','ank07','cmpe0855w0004h7o8rrcae80z',10,310,0.20,3100,'2026-04-18'),
('ak08a','ank08','cmpe0855p0003h7o891o3zv4u',40,330,0.20,13200,'2026-04-25'),('ak08b','ank08','cmpe05n6y00065lo8fwhr550p',10,325,0.20,3250,'2026-04-25'),('ak08c','ank08','cmpe05n6a00045lo8r7bfwcv0',5,320,0.20,1600,'2026-04-25'),
('ak09a','ank09','cmpe05n6y00065lo8fwhr550p',20,325,0.20,6500,'2026-04-30'),
('ak10a','ank10','cmpe0855p0003h7o891o3zv4u',25,330,0.20,8250,'2026-05-04'),('ak10b','ank10','cmpe05n6a00045lo8r7bfwcv0',15,320,0.20,4800,'2026-05-04'),
('ak11a','ank11','cmpe05n6y00065lo8fwhr550p',20,325,0.20,6500,'2026-05-08'),('ak11b','ank11','cmpe05n6m00055lo8r3p2ng44',10,315,0.20,3150,'2026-05-08'),
('ak12a','ank12','cmpe05n6a00045lo8r7bfwcv0',15,320,0.20,4800,'2026-05-12'),('ak12b','ank12','cmpe0855w0004h7o8rrcae80z',5,310,0.20,1550,'2026-05-12'),
('ak13a','ank13','cmpe0855p0003h7o891o3zv4u',30,330,0.20,9900,'2026-05-16'),('ak13b','ank13','cmpe05n6y00065lo8fwhr550p',15,325,0.20,4875,'2026-05-16'),
('ak14a','ank14','cmpe05n6m00055lo8r3p2ng44',15,315,0.20,4725,'2026-05-18'),('ak14b','ank14','cmpe0855w0004h7o8rrcae80z',10,310,0.20,3100,'2026-05-18'),
('ak15a','ank15','cmpe05n6a00045lo8r7bfwcv0',30,320,0.20,9600,'2026-05-22'),('ak15b','ank15','cmpe05n6y00065lo8fwhr550p',5,325,0.20,1625,'2026-05-22'),
('ak16a','ank16','cmpe05n6a00045lo8r7bfwcv0',10,320,0.20,3200,'2026-05-26'),('ak16b','ank16','cmpe0855w0004h7o8rrcae80z',5,310,0.20,1550,'2026-05-26'),
('ak17a','ank17','cmpe0855p0003h7o891o3zv4u',20,330,0.20,6600,'2026-05-27'),('ak17b','ank17','cmpe05n6y00065lo8fwhr550p',10,325,0.20,3250,'2026-05-27'),
('ak18a','ank18','cmpe05n6a00045lo8r7bfwcv0',20,320,0.20,6400,'2026-05-29'),('ak18b','ank18','cmpe05n6m00055lo8r3p2ng44',5,315,0.20,1575,'2026-05-29');

UPDATE "Dealer" SET "totalOrders"=(SELECT COUNT(*) FROM "Order" WHERE "dealerId"='cmpe05n5p00035lo8k7rr7v3f'), "totalRevenue"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='cmpe05n5p00035lo8k7rr7v3f' AND status='COMPLETED'), "cariBalance"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='cmpe05n5p00035lo8k7rr7v3f' AND status='COMPLETED')*-1, "lastOrderAt"='2026-05-29' WHERE id='cmpe05n5p00035lo8k7rr7v3f';

-- === ERZURUM (Ali Kaya) - add 12 more ===
INSERT INTO "Order" (id, "orderNo", "customerId", "customerType", "dealerId", "shippingCity", "shippingAddress", subtotal, tax, "logisticsSurcharge", total, status, "approvedAt", "createdAt", "updatedAt") VALUES
('erz04','ORD-2026-104','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',5600,1120,240,6960,'COMPLETED','2026-02-10','2026-02-08','2026-02-13'),
('erz05','ORD-2026-105','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',8400,1680,360,10440,'COMPLETED','2026-02-22','2026-02-20','2026-02-25'),
('erz06','ORD-2026-106','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',12800,2560,520,15880,'COMPLETED','2026-03-08','2026-03-05','2026-03-10'),
('erz07','ORD-2026-107','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',4400,880,200,5480,'COMPLETED','2026-03-18','2026-03-16','2026-03-21'),
('erz08','ORD-2026-108','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',9600,1920,400,11920,'COMPLETED','2026-03-28','2026-03-26','2026-03-31'),
('erz09','ORD-2026-109','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',7200,1440,320,8960,'COMPLETED','2026-04-10','2026-04-08','2026-04-13'),
('erz10','ORD-2026-110','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',15600,3120,600,19320,'COMPLETED','2026-04-22','2026-04-20','2026-04-25'),
('erz11','ORD-2026-111','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',4800,960,200,5960,'PENDING_APPROVAL',null,'2026-04-30','2026-04-30'),
('erz12','ORD-2026-112','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',10800,2160,440,13400,'COMPLETED','2026-05-08','2026-05-06','2026-05-10'),
('erz13','ORD-2026-113','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',6400,1280,280,7960,'COMPLETED','2026-05-16','2026-05-14','2026-05-18'),
('erz14','ORD-2026-114','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',13200,2640,520,16360,'PENDING_APPROVAL',null,'2026-05-22','2026-05-22'),
('erz15','ORD-2026-115','cmpe08nhz00008zo80syzi67m','B2B','cmpe08nir00018zo8yt05qhfp','Erzurum','Cumhuriyet Cad. No:45',9200,1840,360,11400,'COMPLETED','2026-05-28','2026-05-26','2026-05-30');

-- Erzurum order lines
INSERT INTO "OrderLine" (id, "orderId", "productId", quantity, "unitPrice", "taxRate", total, "createdAt") VALUES
('ez04a','erz04','cmpe05n6a00045lo8r7bfwcv0',10,320,0.20,3200,'2026-02-08'),('ez04b','erz04','cmpe0855w0004h7o8rrcae80z',10,310,0.20,3100,'2026-02-08'),
('ez05a','erz05','cmpe05n6y00065lo8fwhr550p',15,325,0.20,4875,'2026-02-20'),('ez05b','erz05','cmpe05n6m00055lo8r3p2ng44',10,315,0.20,3150,'2026-02-20'),
('ez06a','erz06','cmpe0855p0003h7o891o3zv4u',25,330,0.20,8250,'2026-03-05'),('ez06b','erz06','cmpe05n6y00065lo8fwhr550p',10,325,0.20,3250,'2026-03-05'),
('ez07a','erz07','cmpe05n6m00055lo8r3p2ng44',10,315,0.20,3150,'2026-03-16'),('ez07b','erz07','cmpe0855w0004h7o8rrcae80z',5,310,0.20,1550,'2026-03-16'),
('ez08a','erz08','cmpe05n6a00045lo8r7bfwcv0',20,320,0.20,6400,'2026-03-26'),('ez08b','erz08','cmpe05n6m00055lo8r3p2ng44',10,315,0.20,3150,'2026-03-26'),
('ez09a','erz09','cmpe05n6a00045lo8r7bfwcv0',15,320,0.20,4800,'2026-04-08'),('ez09b','erz09','cmpe0855w0004h7o8rrcae80z',10,310,0.20,3100,'2026-04-08'),
('ez10a','erz10','cmpe0855p0003h7o891o3zv4u',30,330,0.20,9900,'2026-04-20'),('ez10b','erz10','cmpe05n6y00065lo8fwhr550p',10,325,0.20,3250,'2026-04-20'),
('ez11a','erz11','cmpe05n6m00055lo8r3p2ng44',10,315,0.20,3150,'2026-04-30'),('ez11b','erz11','cmpe0855w0004h7o8rrcae80z',5,310,0.20,1550,'2026-04-30'),
('ez12a','erz12','cmpe05n6y00065lo8fwhr550p',20,325,0.20,6500,'2026-05-06'),('ez12b','erz12','cmpe0855p0003h7o891o3zv4u',10,330,0.20,3300,'2026-05-06'),
('ez13a','erz13','cmpe05n6a00045lo8r7bfwcv0',20,320,0.20,6400,'2026-05-14'),
('ez14a','erz14','cmpe0855p0003h7o891o3zv4u',25,330,0.20,8250,'2026-05-22'),('ez14b','erz14','cmpe05n6m00055lo8r3p2ng44',15,315,0.20,4725,'2026-05-22'),
('ez15a','erz15','cmpe05n6y00065lo8fwhr550p',20,325,0.20,6500,'2026-05-26'),('ez15b','erz15','cmpe05n6a00045lo8r7bfwcv0',5,320,0.20,1600,'2026-05-26');

UPDATE "Dealer" SET "totalOrders"=(SELECT COUNT(*) FROM "Order" WHERE "dealerId"='cmpe08nir00018zo8yt05qhfp'), "totalRevenue"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='cmpe08nir00018zo8yt05qhfp' AND status='COMPLETED'), "cariBalance"=(SELECT COALESCE(SUM(total),0) FROM "Order" WHERE "dealerId"='cmpe08nir00018zo8yt05qhfp' AND status='COMPLETED')*-1, "lastOrderAt"='2026-05-26' WHERE id='cmpe08nir00018zo8yt05qhfp';
