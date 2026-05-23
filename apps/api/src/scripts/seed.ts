/**
 * Database seed script — creates test users, dealers, logistics rules,
 * regional pricing, and promo codes for development.
 *
 * Usage (from apps/api directory inside Docker):
 *   npx ts-node src/scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Users ─────────────────────────────────────────────────────────────────
  const pw = await hash('asd123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sadoksan.com' },
    update: {},
    create: { email: 'admin@sadoksan.com', password: pw, name: 'Admin', role: 'ADMIN' },
  });
  console.log(`  ✅ Admin: ${admin.email}`);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@sadoksan.com' },
    update: {},
    create: { email: 'super@sadoksan.com', password: pw, name: 'Super Admin', role: 'SUPER_ADMIN' },
  });
  console.log(`  ✅ SuperAdmin: ${superAdmin.email}`);

  // ─── B2C test user ─────────────────────────────────────────────────────────
  const customer = await prisma.user.upsert({
    where: { email: 'musteri@test.com' },
    update: {},
    create: {
      email: 'musteri@test.com', password: pw, name: 'Ahmet Yılmaz',
      role: 'CUSTOMER', phone: '05321112233', city: 'İstanbul', address: 'Bağdat Cd. No:45 Kadıköy',
    },
  });
  console.log(`  ✅ B2C Müşteri: ${customer.email}`);

  // ─── Dashboard demo dealers (bayi@test.com, erzurum@test.com) ─────────────

  const erzUser = await prisma.user.upsert({
    where: { email: 'erzurum@test.com' },
    update: {},
    create: {
      email: 'erzurum@test.com', password: pw, name: 'Ali Kaya',
      role: 'DEALER', phone: '0532 111 22 33', city: 'Erzurum',
    },
  });
  const erzDealer = await prisma.dealer.upsert({
    where: { userId: erzUser.id },
    update: { status: 'ACTIVE', cariValidated: true },
    create: {
      userId: erzUser.id, name: 'Ali Kaya', company: 'Kaya İnşaat Malzemeleri',
      taxNo: '9876543210', taxOffice: 'Yakutiye', cariNo: 'CARI-003', cariValidated: true,
      contactPerson: 'Ali Kaya', phone: '0532 111 22 33', city: 'Erzurum', region: 'Doğu Anadolu',
      address: 'Cumhuriyet Cad. No:45 Erzurum', status: 'ACTIVE',
      creditLimit: 75000,
    },
  });
  console.log(`  ✅ Demo Bayi: erzurum@test.com (${erzDealer.city})`);

  const bayiUser = await prisma.user.upsert({
    where: { email: 'bayi@test.com' },
    update: {},
    create: {
      email: 'bayi@test.com', password: pw, name: 'Mehmet Demir',
      role: 'DEALER', phone: '0532 100 20 30', city: 'Ankara',
    },
  });
  const bayiDealer = await prisma.dealer.upsert({
    where: { userId: bayiUser.id },
    update: { status: 'ACTIVE', cariValidated: true },
    create: {
      userId: bayiUser.id, name: 'Bayi Test', company: 'BayiTest Yapı Malzemeleri',
      taxNo: '9990009990', taxOffice: 'Kadıköy', cariNo: 'CARI-BAYITEST', cariValidated: true,
      contactPerson: 'Bayi Test', phone: '0532 999 88 77', city: 'İstanbul', region: 'Marmara',
      address: 'Sanayi Mah. İnşaat Sk. No:42 İstanbul', status: 'ACTIVE',
      creditLimit: 250000,
    },
  });
  console.log(`  ✅ Demo Bayi: bayi@test.com (${bayiDealer.city}) — BayiTest`);

  // ─── 5 Dealers (User + Dealer) ─────────────────────────────────────────────
  const dealerDefs = [
    { email: 'ankara@test.com',   name: 'Ankara Yapı Malz.',   contact: 'Mehmet Kaya',    city: 'Ankara',  region: 'İç Anadolu', cariNo: '120.01.0001', phone: '03121112233', taxNo: '1110001111', taxOffice: 'Çankaya',     address: 'Kızılay Mah. No:12 Çankaya/Ankara' },
    { email: 'izmir@test.com',    name: 'İzmir Ticaret A.Ş.',  contact: 'Ayşe Demir',      city: 'İzmir',   region: 'Ege',         cariNo: '120.01.0002', phone: '02321112233', taxNo: '2220002222', taxOffice: 'Konak',        address: 'Alsancak Sk. No:8 Konak/İzmir' },
    { email: 'istanbul@test.com', name: 'İstanbul Yapı Market',contact: 'Ali Öztürk',      city: 'İstanbul',region: 'Marmara',     cariNo: '120.01.0003', phone: '02121112233', taxNo: '3330003333', taxOffice: 'Kadıköy',      address: 'Bağdat Cd. No:120 Kadıköy/İstanbul' },
    { email: 'bursa@test.com',    name: 'Bursa İnşaat Malz.',  contact: 'Zeynep Çelik',    city: 'Bursa',   region: 'Marmara',     cariNo: '120.01.0004', phone: '02241112233', taxNo: '4440004444', taxOffice: 'Osmangazi',    address: 'Fsm Bulvarı No:55 Osmangazi/Bursa' },
    { email: 'antalya@test.com',  name: 'Antalya Karo Center', contact: 'Can Yıldız',      city: 'Antalya', region: 'Akdeniz',    cariNo: '120.01.0005', phone: '02421112233', taxNo: '5550005555', taxOffice: 'Muratpaşa',    address: 'Lara Cd. No:33 Muratpaşa/Antalya' },
  ];

  for (const dd of dealerDefs) {
    const user = await prisma.user.upsert({
      where: { email: dd.email },
      update: {},
      create: {
        email: dd.email, password: pw, name: dd.contact,
        role: 'DEALER', phone: dd.phone, city: dd.city, address: dd.address,
      },
    });

    await prisma.dealer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: dd.name,
        company: dd.name,
        taxNo: dd.taxNo,
        taxOffice: dd.taxOffice,
        cariNo: dd.cariNo,
        cariValidated: true,
        contactPerson: dd.contact,
        phone: dd.phone,
        city: dd.city,
        region: dd.region,
        address: dd.address,
        status: 'ACTIVE',
      },
    });

    console.log(`  ✅ Bayi: ${dd.name} (${dd.city})`);
  }

  // İstanbul bayiisini PENDING yapalım (test için)
  const istDealer = await prisma.dealer.findFirst({ where: { cariNo: '120.01.0003' } });
  if (istDealer) {
    await prisma.dealer.update({ where: { id: istDealer.id }, data: { status: 'PENDING' } });
    console.log('  ℹ️  İstanbul Yapı Market → PENDING (onay bekliyor)');
  }

  // ─── Logistics Rules (7 regions) ──────────────────────────────────────────
  const logisticsRules = [
    { region: 'Marmara',     cities: ['İstanbul','Edirne','Kırklareli','Tekirdağ','Kocaeli','Sakarya','Yalova','Bursa','Bilecik','Balıkesir','Çanakkale'], baseSurcharge: 50,  perKgSurcharge: 2.5,  perM2Surcharge: 5,   freeShippingThreshold: 5000 },
    { region: 'Ege',         cities: ['İzmir','Manisa','Aydın','Denizli','Muğla','Uşak','Kütahya','Afyonkarahisar'],                                   baseSurcharge: 75,  perKgSurcharge: 3.5,  perM2Surcharge: 7,   freeShippingThreshold: 7500 },
    { region: 'İç Anadolu',  cities: ['Ankara','Konya','Kayseri','Eskişehir','Sivas','Kırıkkale','Aksaray','Niğde','Nevşehir','Yozgat','Kırşehir','Çankırı','Karaman'], baseSurcharge: 100, perKgSurcharge: 4.0, perM2Surcharge: 8, freeShippingThreshold: 10000 },
    { region: 'Akdeniz',     cities: ['Antalya','Adana','Mersin','Hatay','Isparta','Burdur','Osmaniye','Kahramanmaraş'],                             baseSurcharge: 125, perKgSurcharge: 5.0,  perM2Surcharge: 10,  freeShippingThreshold: 10000 },
    { region: 'Karadeniz',   cities: ['Trabzon','Samsun','Ordu','Giresun','Rize','Artvin','Gümüşhane','Zonguldak','Karabük','Bartın','Kastamonu','Sinop','Amasya','Tokat','Çorum','Bolu','Düzce'], baseSurcharge: 150, perKgSurcharge: 6.0, perM2Surcharge: 12, freeShippingThreshold: 15000 },
    { region: 'Doğu Anadolu',cities: ['Erzurum','Erzincan','Malatya','Elazığ','Van','Ağrı','Kars','Iğdır','Ardahan','Bingöl','Muş','Bitlis','Hakkari','Tunceli'], baseSurcharge: 175, perKgSurcharge: 7.0, perM2Surcharge: 14, freeShippingThreshold: 15000 },
    { region: 'Güneydoğu Anadolu', cities: ['Diyarbakır','Gaziantep','Şanlıurfa','Mardin','Batman','Siirt','Şırnak','Adıyaman','Kilis'],          baseSurcharge: 175, perKgSurcharge: 7.5,  perM2Surcharge: 15,  freeShippingThreshold: 15000 },
  ];

  for (const lr of logisticsRules) {
    await prisma.logisticsRule.upsert({
      where: { id: `lr-${lr.region.toLowerCase().replace(/\s/g, '-')}` },
      update: { cities: lr.cities, baseSurcharge: lr.baseSurcharge, perKgSurcharge: lr.perKgSurcharge, perM2Surcharge: lr.perM2Surcharge, freeShippingThreshold: lr.freeShippingThreshold },
      create: {
        id: `lr-${lr.region.toLowerCase().replace(/\s/g, '-')}`,
        region: lr.region,
        cities: lr.cities,
        baseSurcharge: lr.baseSurcharge,
        perKgSurcharge: lr.perKgSurcharge,
        perM2Surcharge: lr.perM2Surcharge,
        freeShippingThreshold: lr.freeShippingThreshold,
        active: true,
      },
    });
    console.log(`  ✅ Logistics: ${lr.region} (${lr.cities.length} il, ${lr.baseSurcharge}TL base + ${lr.perKgSurcharge}TL/kg)`);
  }

  // ─── Regional Pricing Surcharges ───────────────────────────────────────────
  const pricingRegions = [
    { regionKey: 'Marmara', surcharge: 0, description: 'Marmara Bölgesi — standart fiyat' },
    { regionKey: 'Ege', surcharge: 5, description: 'Ege Bölgesi +%5' },
    { regionKey: 'İç Anadolu', surcharge: 8, description: 'İç Anadolu Bölgesi +%8' },
    { regionKey: 'Akdeniz', surcharge: 10, description: 'Akdeniz Bölgesi +%10' },
    { regionKey: 'Karadeniz', surcharge: 12, description: 'Karadeniz Bölgesi +%12' },
    { regionKey: 'Doğu Anadolu', surcharge: 15, description: 'Doğu Anadolu Bölgesi +%15' },
    { regionKey: 'Güneydoğu Anadolu', surcharge: 15, description: 'Güneydoğu Anadolu Bölgesi +%15' },
  ];

  for (const rp of pricingRegions) {
    await prisma.regionalPricingSurcharge.upsert({
      where: { regionKey: rp.regionKey },
      update: { surcharge: rp.surcharge, description: rp.description },
      create: { regionKey: rp.regionKey, surcharge: rp.surcharge, description: rp.description, active: true },
    });
    console.log(`  ✅ Pricing: ${rp.regionKey} → +%${rp.surcharge}`);
  }

  // ─── Promo Codes ───────────────────────────────────────────────────────────
  const promos = [
    { code: 'HOSGELDIN', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 500, usageLimit: 100, dealerOnly: false, description: 'Yeni üyelere %10 hoşgeldin indirimi' },
    { code: 'BAYI20', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 5000, usageLimit: 50, dealerOnly: true, description: 'Bayilere özel %20 indirim' },
    { code: 'NAKIT1000', discountType: 'FIXED_AMOUNT', discountValue: 1000, minOrderAmount: 10000, usageLimit: 20, dealerOnly: false, description: '10.000TL üzeri 1.000TL indirim' },
    { code: 'KARGOBEDAVA', discountType: 'FIXED_AMOUNT', discountValue: 200, minOrderAmount: 3000, usageLimit: 200, dealerOnly: false, description: 'Kargo bedava (200TL)' },
    { code: 'VIP2026', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 0, usageLimit: 10, dealerOnly: true, description: 'VIP bayilere %15 indirim' },
  ];

  for (const promo of promos) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "PromoCode" (id, code, "discountType", "discountValue", "minOrderAmount", "usageLimit", "usedCount", "dealerOnly", "isActive", "validFrom", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0, $6, true, NOW(), NOW(), NOW())
       ON CONFLICT (code) DO NOTHING`,
      promo.code,
      promo.discountType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
      promo.discountValue,
      promo.minOrderAmount,
      promo.usageLimit,
      promo.dealerOnly,
    );
    console.log(`  ✅ Promo: ${promo.code} — ${promo.description}`);
  }

  // ─── Site Settings ─────────────────────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      maintenanceMode: false,
      maintenanceAllowAdmins: true,
    },
  });
  console.log('  ✅ SiteSettings');

  // ─── Mock Orders for demo dealers ──────────────────────────────────────────
  // Only create if no orders exist yet for the test dealer
  const existingOrders = await prisma.order.count({ where: { dealerId: testDealer.id } });
  if (existingOrders === 0) {
    console.log('\n📦 Mock siparişler oluşturuluyor...');

    // Pick 5 products with images
    const products = await prisma.product.findMany({
      where: { imageUrl: { not: null } },
      take: 5,
      orderBy: { basePrice: 'asc' },
    });

    if (products.length >= 5) {
      const [p1, p2, p3, p4, p5] = products;

      const now = new Date();
      const orderTemplates = [
        { orderNo: 'ORD-2026-001', date: new Date('2026-03-15'), status: 'COMPLETED' as const, items: [{ p: p1, qty: 2 }, { p: p3, qty: 1 }] },
        { orderNo: 'ORD-2026-002', date: new Date('2026-03-22'), status: 'COMPLETED' as const, items: [{ p: p2, qty: 3 }, { p: p5, qty: 2 }] },
        { orderNo: 'ORD-2026-003', date: new Date('2026-03-28'), status: 'COMPLETED' as const, items: [{ p: p4, qty: 3 }, { p: p1, qty: 1 }, { p: p2, qty: 1 }] },
        { orderNo: 'ORD-2026-004', date: new Date('2026-04-05'), status: 'COMPLETED' as const, items: [{ p: p3, qty: 4 }] },
        { orderNo: 'ORD-2026-005', date: new Date('2026-04-12'), status: 'COMPLETED' as const, items: [{ p: p5, qty: 3 }, { p: p4, qty: 2 }, { p: p1, qty: 1 }] },
        { orderNo: 'ORD-2026-006', date: new Date('2026-04-20'), status: 'COMPLETED' as const, items: [{ p: p4, qty: 4 }] },
        { orderNo: 'ORD-2026-007', date: new Date('2026-04-28'), status: 'PENDING_APPROVAL' as const, items: [{ p: p3, qty: 3 }, { p: p5, qty: 2 }, { p: p1, qty: 1 }] },
        { orderNo: 'ORD-2026-008', date: new Date('2026-05-05'), status: 'COMPLETED' as const, items: [{ p: p1, qty: 3 }] },
        { orderNo: 'ORD-2026-009', date: new Date('2026-05-12'), status: 'PENDING_APPROVAL' as const, items: [{ p: p2, qty: 2 }, { p: p4, qty: 2 }, { p: p3, qty: 1 }] },
        { orderNo: 'ORD-2026-010', date: new Date('2026-05-18'), status: 'PENDING_APPROVAL' as const, items: [{ p: p5, qty: 2 }, { p: p3, qty: 2 }, { p: p1, qty: 1 }] },
      ];

      let totalRevenue = 0;
      let totalOrders = 0;

      for (const tpl of orderTemplates) {
        let subtotal = 0;
        for (const item of tpl.items) {
          subtotal += item.p.basePrice * item.qty;
        }
        const logistics = tpl.items.reduce((s, i) => s + i.qty, 0) * 40;
        const tax = Math.round(subtotal * 0.20);
        const total = subtotal + tax + logistics;
        const approvedAt = tpl.status === 'COMPLETED' ? new Date(tpl.date.getTime() + 86400000) : null;

        const order = await prisma.order.create({
          data: {
            orderNo: tpl.orderNo,
            customerId: testUser.id,
            customerType: 'B2B',
            dealerId: testDealer.id,
            shippingCity: testDealer.city,
            shippingAddress: testDealer.address,
            subtotal, tax, logisticsSurcharge: logistics, total,
            status: tpl.status,
            approvedAt,
            createdAt: tpl.date,
            updatedAt: approvedAt || tpl.date,
          },
        });

        for (const item of tpl.items) {
          await prisma.orderLine.create({
            data: {
              orderId: order.id,
              productId: item.p.id,
              quantity: item.qty,
              unitPrice: item.p.basePrice,
              taxRate: 0.20,
              total: item.p.basePrice * item.qty,
              createdAt: tpl.date,
            },
          });
        }

        if (tpl.status === 'COMPLETED') {
          totalRevenue += total;
        }
        totalOrders++;
      }

      await prisma.dealer.update({
        where: { id: testDealer.id },
        data: {
          totalOrders,
          totalRevenue,
          cariBalance: -totalRevenue,
          lastOrderAt: new Date('2026-05-18'),
        },
      });
      console.log(`  ✅ Test dealer: ${totalOrders} sipariş, ${totalRevenue} TL ciro`);
    }

    // Erzurum dealer: 3 orders
    const erzProducts = await prisma.product.findMany({
      where: { imageUrl: { not: null } },
      take: 3,
      orderBy: { basePrice: 'asc' },
    });

    if (erzProducts.length >= 3) {
      const [e1, e2, e3] = erzProducts;
      const erzOrders = [
        { orderNo: 'ORD-2026-101', date: new Date('2026-04-08'), status: 'COMPLETED' as const, subtotal: 1240, tax: 248, logistics: 120, items: [{ p: e1, qty: 2 }, { p: e3, qty: 2 }] },
        { orderNo: 'ORD-2026-102', date: new Date('2026-04-28'), status: 'COMPLETED' as const, subtotal: 1575, tax: 315, logistics: 120, items: [{ p: products[4], qty: 3 }, { p: products[1], qty: 2 }] },
        { orderNo: 'ORD-2026-103', date: new Date('2026-05-15'), status: 'PENDING_APPROVAL' as const, subtotal: 960, tax: 192, logistics: 120, items: [{ p: e1, qty: 3 }] },
      ];

      let erzRevenue = 0;
      for (const tpl of erzOrders) {
        const total = tpl.subtotal + tpl.tax + tpl.logistics;
        const approvedAt = tpl.status === 'COMPLETED' ? new Date(tpl.date.getTime() + 7 * 86400000) : null;

        const order = await prisma.order.create({
          data: {
            orderNo: tpl.orderNo,
            customerId: erzUser.id,
            customerType: 'B2B',
            dealerId: erzDealer.id,
            shippingCity: erzDealer.city,
            shippingAddress: erzDealer.address,
            subtotal: tpl.subtotal, tax: tpl.tax, logisticsSurcharge: tpl.logistics, total,
            status: tpl.status,
            approvedAt,
            createdAt: tpl.date,
            updatedAt: approvedAt || tpl.date,
          },
        });

        for (const item of tpl.items) {
          await prisma.orderLine.create({
            data: {
              orderId: order.id,
              productId: item.p.id,
              quantity: item.qty,
              unitPrice: item.p.basePrice,
              taxRate: 0.20,
              total: item.p.basePrice * item.qty,
              createdAt: tpl.date,
            },
          });
        }

        if (tpl.status === 'COMPLETED') erzRevenue += total;
      }

      await prisma.dealer.update({
        where: { id: erzDealer.id },
        data: { totalOrders: 3, totalRevenue: erzRevenue, cariBalance: -erzRevenue, lastOrderAt: new Date('2026-05-15') },
      });
      console.log(`  ✅ Erzurum dealer: 3 sipariş, ${erzRevenue} TL ciro`);
    }
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin: admin@sadoksan.com / asd123');
  console.log('   Bayiler (asd123): test@test.com, erzurum@test.com, bayi@test.com');
  console.log('   Diğer: ankara@test.com, izmir@test.com, istanbul@test.com, bursa@test.com, antalya@test.com');
  console.log('   Müşteri: musteri@test.com / asd123');
  console.log('   Promo kodları: HOSGELDIN, BAYI20, NAKIT1000, KARGOBEDAVA, VIP2026');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
