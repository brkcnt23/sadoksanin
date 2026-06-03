/**
 * Demo data seed — Sunum için eksiksiz veri seti.
 *
 * Kapsam:
 *  1. Marka seed (18 marka)
 *  2. Demo müşteriler (3 kullanıcı, adresler, favoriler)
 *  3. Demo siparişler (5 B2C + 2 B2B)
 *  4. Hero banner / CMS içeriği
 *  5. İndirimler ve kuponlar
 *
 * Usage (Docker):
 *   docker exec sadoksan-api-prod sh -c "cd /app/apps/api && npx ts-node --transpile-only src/scripts/demo-seed.ts"
 */

import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

loadEnv({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not defined.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ═══════════════════════════════════════════════════════════════════════
// 1. MARKALAR
// ═══════════════════════════════════════════════════════════════════════
async function seedBrands() {
  console.log('\n🏷️  Markalar...');

  const brands = [
    'AKGÜN', 'VITRA', 'RTRMAX', 'FISCHER', 'HILTI', 'SOUDAL',
    'ISVEA', 'ARSLANLI', 'TESKA', 'AKFİX', 'DROM', 'ECE',
    'FLEKO', 'MAXIFLOW', 'UBM BANYO', 'NSK', 'Selen', 'Roca',
  ];

  let created = 0;
  for (const name of brands) {
    // Slug: lowercase + replace Turkish chars + spaces→hyphens
    let slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Handle slug collision (e.g. "Roca" vs "ROCA" same slug "roca")
    let suffix = 1;
    let finalSlug = slug;
    while (await (prisma as any).brand.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${suffix++}`;
    }

    await (prisma as any).brand.upsert({
      where: { name },
      update: {},
      create: { name, slug: finalSlug },
    });
    created++;
  }

  // Link products to brands
  const allBrands = await (prisma as any).brand.findMany();
  let linked = 0;
  for (const b of allBrands) {
    const r = await (prisma as any).product.updateMany({
      where: { brand: b.name, brandId: null },
      data: { brandId: b.id },
    });
    linked += r.count;
  }

  console.log(`   ✅ ${created} marka, 🔗 ${linked} ürün eşleşti`);
}

// ═══════════════════════════════════════════════════════════════════════
// 2. DEMO MÜŞTERİLER
// ═══════════════════════════════════════════════════════════════════════
async function seedCustomers() {
  console.log('\n👥 Demo müşteriler...');
  const hash = await bcrypt.hash('asd123', 10);

  const customers = [
    {
      email: 'ahmet@test.com', name: 'Ahmet Yılmaz', phone: '0532 111 22 33', city: 'İstanbul',
      addresses: [
        { title: 'Ev', address: 'Bağdat Caddesi No:123 D:5, Kadıköy', city: 'İstanbul', district: 'Kadıköy', isDefault: true },
        { title: 'İş', address: 'Levent Plaza K:12, Beşiktaş', city: 'İstanbul', district: 'Beşiktaş', isDefault: false },
      ],
      favoriteSkus: ['9110', '9097', 'VTR-001'],
    },
    {
      email: 'ayse@test.com', name: 'Ayşe Demir', phone: '0533 444 55 66', city: 'Ankara',
      addresses: [
        { title: 'Ev', address: 'Tunalı Hilmi Caddesi No:45, Çankaya', city: 'Ankara', district: 'Çankaya', isDefault: true },
      ],
      favoriteSkus: ['8938', 'ECA-001'],
    },
    {
      email: 'mehmet@test.com', name: 'Mehmet Kaya', phone: '0535 777 88 99', city: 'İzmir',
      addresses: [
        { title: 'Ev', address: 'Kordon Boyu No:78, Alsancak', city: 'İzmir', district: 'Konak', isDefault: true },
        { title: 'Yazlık', address: 'Çeşme Merkez No:12', city: 'İzmir', district: 'Çeşme', isDefault: false },
      ],
      favoriteSkus: ['RTR-001', 'ART-001', '9057'],
    },
  ];

  for (const c of customers) {
    // Upsert user
    const user = await (prisma as any).user.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone, city: c.city },
      create: {
        email: c.email, password: hash, name: c.name,
        phone: c.phone, city: c.city, role: 'DEALER',
      },
    });

    // Addresses
    for (const a of c.addresses) {
      const ex = await (prisma as any).address.findFirst({ where: { userId: user.id, title: a.title } });
      if (ex) {
        await (prisma as any).address.update({ where: { id: ex.id }, data: a });
      } else {
        await (prisma as any).address.create({ data: { userId: user.id, ...a } });
      }
    }

    // Favorites
    for (const sku of c.favoriteSkus) {
      const p = await (prisma as any).product.findUnique({ where: { sku } });
      if (p) {
        const ex = await (prisma as any).favorite.findFirst({ where: { userId: user.id, productId: p.id } });
        if (!ex) await (prisma as any).favorite.create({ data: { userId: user.id, productId: p.id } });
      }
    }

    console.log(`   ✅ ${c.email} (${c.addresses.length} adres, ${c.favoriteSkus.length} favori)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 3. DEMO SİPARİŞLER
// ═══════════════════════════════════════════════════════════════════════
async function seedOrders() {
  console.log('\n📦 Demo siparişler...');

  const admin = await (prisma as any).user.findUnique({ where: { email: 'admin@admin.com' } });
  const ahmet = await (prisma as any).user.findUnique({ where: { email: 'ahmet@test.com' } });
  const ayse = await (prisma as any).user.findUnique({ where: { email: 'ayse@test.com' } });
  const mehmet = await (prisma as any).user.findUnique({ where: { email: 'mehmet@test.com' } });
  const dealerUser = await (prisma as any).user.findUnique({ where: { email: 'bayi@test.com' } });
  const dealer = await (prisma as any).dealer.findFirst();

  if (!admin || !ahmet || !ayse || !mehmet) {
    console.log('   ⚠️  Eksik kullanıcı');
    return;
  }

  const products = await (prisma as any).product.findMany({ take: 20, where: { visible: true, displayStock: { gt: 0 } } });
  if (products.length < 6) { console.log('   ⚠️  Yetersiz ürün'); return; }

  const p = products;
  const ts = Date.now();

  // Helper
  async function makeOrder(cust: any, items: { pid: string; qty: number; price: number }[], status: string, isB2B = false) {
    const orderNo = `SDK-${ts}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const sub = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
    const tax = Math.round(sub * 0.2 * 100) / 100;
    const logistics = sub > 1000 ? 0 : 79;
    const total = Math.round((sub + tax + logistics) * 100) / 100;

    return (prisma as any).order.create({
      data: {
        orderNo,
        customerId: cust.id,
        dealerId: isB2B ? dealer?.id ?? null : null,
        customerType: isB2B ? 'B2B' : 'B2C',
        shippingCity: cust.city || 'İstanbul',
        shippingAddress: 'Demo teslimat adresi',
        status,
        subtotal: sub,
        tax,
        logisticsSurcharge: logistics,
        total,
        discountAmount: 0,
        lines: {
          create: items.map((i: any) => ({
            productId: i.pid,
            quantity: i.qty,
            unitPrice: i.price,
            taxRate: 0.2,
            total: Math.round(i.price * i.qty * 1.2 * 100) / 100,
          })),
        },
        statusHistory: {
          create: {
            status,
            note: status === 'PENDING_APPROVAL' ? 'B2B sipariş onay bekliyor' : 'Sipariş oluşturuldu',
            actorId: admin.id,
            actorEmail: admin.email,
          },
        },
      },
    });
  }

  // B2C Orders
  await makeOrder(ahmet, [{ pid: p[0].id, qty: 2, price: p[0].basePrice }, { pid: p[1].id, qty: 1, price: p[1].basePrice }], 'COMPLETED');
  console.log('   ✅ B2C Tamamlandı — Ahmet Yılmaz');

  await makeOrder(ahmet, [{ pid: p[2].id, qty: 3, price: p[2].basePrice }], 'SHIPPED');
  console.log('   ✅ B2C Kargoda — Ahmet Yılmaz');

  await makeOrder(ayse, [{ pid: p[3].id, qty: 1, price: p[3].basePrice }], 'APPROVED');
  console.log('   ✅ B2C Onaylandı — Ayşe Demir');

  await makeOrder(ayse, [{ pid: p[0].id, qty: 4, price: p[0].basePrice }], 'PREPARING');
  console.log('   ✅ B2C Hazırlanıyor — Ayşe Demir');

  await makeOrder(mehmet, [{ pid: p[4].id, qty: 2, price: p[4].basePrice }, { pid: p[1].id, qty: 1, price: p[1].basePrice }], 'APPROVED');
  console.log('   ✅ B2C Onaylandı (ödeme bekliyor) — Mehmet Kaya');

  // B2B Orders
  if (dealerUser && dealer) {
    await makeOrder(dealerUser, [
      { pid: p[0].id, qty: 20, price: Math.round(p[0].basePrice * 0.85) },
      { pid: p[5].id, qty: 15, price: Math.round(p[5].basePrice * 0.85) },
    ], 'PENDING_APPROVAL', true);
    console.log('   ✅ B2B Onay bekliyor — BayiTest');

    await makeOrder(dealerUser, [
      { pid: p[2].id, qty: 50, price: Math.round(p[2].basePrice * 0.82) },
    ], 'COMPLETED', true);
    console.log('   ✅ B2B Tamamlandı — BayiTest');
  }

  const totalOrders = await (prisma as any).order.count();
  console.log(`   📊 Toplam ${totalOrders} sipariş`);
}

// ═══════════════════════════════════════════════════════════════════════
// 4. CMS / HERO BANNER
// ═══════════════════════════════════════════════════════════════════════
async function seedCMS() {
  console.log('\n🎨 CMS içeriği...');

  // Hero (single record, id="hero")
  await (prisma as any).siteContent.upsert({
    where: { id: 'hero' },
    update: {
      headline: 'Sadöksan İnşaat — Yapıda 23 Yıllık Güven',
      subheading: 'Seramikten vitrifiyeye, yapı kimyasallarından banyo mobilyalarına 4000+ ürün, 50+ marka ile hizmetinizdeyiz.',
      ctaText: 'Ürünleri Keşfedin',
      ctaLink: '/urunler',
      secondaryCtaText: 'Bayi Olun',
      secondaryCtaLink: '/bayilik',
      stats: JSON.stringify([
        { label: 'Yıl', value: '23+' },
        { label: 'Ürün', value: '4000+' },
        { label: 'Marka', value: '50+' },
        { label: 'Bayi', value: '300+' },
      ]),
    },
    create: {
      id: 'hero',
      headline: 'Sadöksan İnşaat — Yapıda 23 Yıllık Güven',
      subheading: 'Seramikten vitrifiyeye, yapı kimyasallarından banyo mobilyalarına 4000+ ürün, 50+ marka ile hizmetinizdeyiz.',
      ctaText: 'Ürünleri Keşfedin',
      ctaLink: '/urunler',
      secondaryCtaText: 'Bayi Olun',
      secondaryCtaLink: '/bayilik',
      stats: JSON.stringify([
        { label: 'Yıl', value: '23+' },
        { label: 'Ürün', value: '4000+' },
        { label: 'Marka', value: '50+' },
        { label: 'Bayi', value: '300+' },
      ]),
    },
  });
  console.log('   ✅ Hero banner güncellendi');

  // SiteSettings (single record, id="main")
  await (prisma as any).siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main' },
  });
  console.log('   ✅ Site ayarları hazır');
}

// ═══════════════════════════════════════════════════════════════════════
// 5. İNDİRİMLER VE KUPONLAR
// ═══════════════════════════════════════════════════════════════════════
async function seedDiscounts() {
  console.log('\n💰 İndirimler...');

  // Discount 1: AKGÜN markasında %15
  const akgun = await (prisma as any).brand.findFirst({ where: { name: 'AKGÜN' } });
  if (akgun) {
    await (prisma as any).discount.upsert({
      where: { id: 'disc-akgun' },
      update: { value: 15, isActive: true },
      create: {
        id: 'disc-akgun', type: 'BRAND', targetId: akgun.id, targetName: 'AKGÜN',
        discountType: 'PERCENTAGE', value: 15, isActive: true,
        validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'),
      },
    });
    console.log('   ✅ AKGÜN Seramik %15 indirim');
  }

  // Discount 2: Banyo Grubu kategorisinde 500 TL sabit
  const banyo = await (prisma as any).category.findFirst({ where: { name: 'Banyo Grubu & Kabin' } });
  if (banyo) {
    await (prisma as any).discount.upsert({
      where: { id: 'disc-banyo' },
      update: { value: 500, isActive: true },
      create: {
        id: 'disc-banyo', type: 'CATEGORY', targetId: banyo.id, targetName: 'Banyo Grubu & Kabin',
        discountType: 'FIXED_AMOUNT', value: 500, isActive: true,
        validFrom: new Date('2026-06-01'), validUntil: new Date('2026-08-31'),
      },
    });
    console.log('   ✅ Banyo Grubu 500 TL indirim');
  }

  // Kupon 1: HOSGELDIN10
  await (prisma as any).promoCode.upsert({
    where: { id: 'promo-hosgeldin' },
    update: { isActive: true },
    create: {
      id: 'promo-hosgeldin', code: 'HOSGELDIN10', discountType: 'PERCENTAGE',
      discountValue: 10, minOrderAmount: 500, usageLimit: 100, usedCount: 0,
      dealerOnly: false, isActive: true,
      validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'),
    },
  });
  console.log('   ✅ Kupon: HOSGELDIN10 (%10 indirim, min 500 TL)');

  // Kupon 2: BAYI20 (sadece B2B)
  await (prisma as any).promoCode.upsert({
    where: { id: 'promo-bayi' },
    update: { isActive: true },
    create: {
      id: 'promo-bayi', code: 'BAYI20', discountType: 'PERCENTAGE',
      discountValue: 20, minOrderAmount: 5000, usageLimit: 50, usedCount: 3,
      dealerOnly: true, isActive: true,
      validFrom: new Date('2026-01-01'), validUntil: new Date('2026-12-31'),
    },
  });
  console.log('   ✅ Kupon: BAYI20 (%20 indirim, B2B özel)');
}

// ═══════════════════════════════════════════════════════════════════════
// 6. DOĞRULAMA
// ═══════════════════════════════════════════════════════════════════════
async function verify() {
  console.log('\n🔍 Doğrulama...\n');

  const p = (prisma as any);
  const checks = [
    ['Ürün', await p.product.count()],
    ['Marka', await p.brand.count()],
    ['Kategori', await p.category.count()],
    ['Kullanıcı', await p.user.count()],
    ['Sipariş', await p.order.count()],
    ['Adres', await p.address.count()],
    ['Favori', await p.favorite.count()],
    ['İndirim', await p.discount.count()],
    ['Kupon', await p.promoCode.count()],
    ['Hero CMS', await p.siteContent.count()],
    ['SiteSetting', await p.siteSettings.count()],
    ['Audit Log', await p.auditLog.count()],
  ];

  for (const [label, count] of checks) {
    const icon = (count as number) > 0 ? '✅' : '⚠️';
    console.log(`   ${icon} ${label}: ${count}`);
  }

  const linked = await p.product.count({ where: { brandId: { not: null } } });
  const total = await p.product.count();
  console.log(`   🔗 Marka eşleşmesi: ${linked}/${total}`);
}

// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log('🚀 Sadöksan Demo Seed başlıyor...');

  await seedBrands();
  await seedCustomers();
  await seedOrders();
  await seedCMS();
  await seedDiscounts();
  await verify();

  console.log('\n🎉 Demo seed tamamlandı!');
}

main().catch((e) => {
  console.error('❌ Hata:', e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
