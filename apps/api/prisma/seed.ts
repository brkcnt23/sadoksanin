/**
 * Database seed.
 *
 * Idempotent — uses upsert with stable unique keys (email, sku, taxNo).
 * Re-runs are safe; existing rows get refreshed instead of duplicated.
 *
 * Run from apps/api:
 *   pnpm db:seed
 *
 * Defaults (DEV ONLY — change before any prod deploy):
 *   admin@admin.com / asd123      (UserRole.ADMIN)
 *   bayi@test.com  / asd123       (UserRole.DEALER, linked Dealer ACTIVE)
 *   test@test.com  / asd123       (UserRole.CUSTOMER)
 */
import 'dotenv/config';
import * as path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

// Workspace .env lives at repo root, not apps/api
loadEnv({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined. Check workspace .env.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('asd123', 10);

  // ─── Admin user ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: { password: passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@admin.com',
      password: passwordHash,
      name: 'Sadöksan Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin user: ${admin.email} (${admin.id})`);

  // ─── B2C customer ────────────────────────────────────────────────────────
  const customer = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: { password: passwordHash, role: 'CUSTOMER' },
    create: {
      email: 'test@test.com',
      password: passwordHash,
      name: 'Ahmet Yılmaz',
      role: 'CUSTOMER',
      phone: '0539 654 17 20',
      city: 'İstanbul',
      address: 'Test Caddesi No: 5',
    },
  });
  console.log(`✓ Customer user: ${customer.email} (${customer.id})`);

  // ─── B2B dealer ──────────────────────────────────────────────────────────
  const dealerUser = await prisma.user.upsert({
    where: { email: 'bayi@test.com' },
    update: { password: passwordHash, role: 'DEALER' },
    create: {
      email: 'bayi@test.com',
      password: passwordHash,
      name: 'Mehmet Demir',
      role: 'DEALER',
      phone: '0532 100 20 30',
      city: 'Ankara',
    },
  });
  console.log(`✓ Dealer user: ${dealerUser.email} (${dealerUser.id})`);

  await prisma.dealer.upsert({
    where: { userId: dealerUser.id },
    update: { status: 'ACTIVE' },
    create: {
      userId: dealerUser.id,
      name: 'Mehmet Demir',
      company: 'Demir Yapı Malzemeleri',
      taxNo: '1234567890',
      taxOffice: 'Çankaya',
      cariNo: 'CARI-001',
      cariValidated: true,
      contactPerson: 'Mehmet Demir',
      phone: '0532 100 20 30',
      city: 'Ankara',
      region: 'İç Anadolu',
      address: 'Atatürk Bulvarı No: 100',
      status: 'ACTIVE',
      creditLimit: 50000,
    },
  });
  console.log(`✓ Dealer record linked to ${dealerUser.email}`);

  // ─── Sample products ─────────────────────────────────────────────────────
  const products = [
    {
      sku: '9110',
      netsisCode: 'NTS-9110',
      name: '60X120N PK LF EVEREST BEIGE 1.K SR',
      brand: 'AKGÜN',
      category: 'Seramik',
      basePrice: 320,
      unit: 'm²',
      netsisStock: 45,
      displayStock: 45,
      description: 'Premium seramik kaplama, 60x120 cm, mat finish',
    },
    {
      sku: '9097',
      netsisCode: 'NTS-9097',
      name: '60X120N PK LF NAVAS SIYAH 1.K SR',
      brand: 'AKGÜN',
      category: 'Seramik',
      basePrice: 315,
      unit: 'm²',
      netsisStock: 38,
      displayStock: 38,
      description: 'Siyah seramik kaplama, 60x120 cm, premium kalite',
    },
    {
      sku: '9057',
      netsisCode: 'NTS-9057',
      name: '60X120N PK LF LOFT GRI 1.K SR',
      brand: 'AKGÜN',
      category: 'Seramik',
      basePrice: 325,
      unit: 'm²',
      netsisStock: 52,
      displayStock: 52,
      description: 'Gri tonlu loft tarzı seramik, 60x120 cm',
    },
    {
      sku: '8938',
      netsisCode: 'NTS-8938',
      name: '60X120N PK LF NEO CAL GOLD 1.K SR',
      brand: 'AKGÜN',
      category: 'Seramik',
      basePrice: 340,
      unit: 'm²',
      netsisStock: 22,
      displayStock: 22,
      description: 'Kalahari altın tonlu, premium seramik',
    },
    {
      sku: 'VTR-001',
      netsisCode: 'NTS-VTR-001',
      name: 'VITRA NORMUS LAVABO 60CM',
      brand: 'VITRA',
      category: 'Vitrifiye',
      basePrice: 1850,
      unit: 'adet',
      netsisStock: 12,
      displayStock: 12,
      description: 'Beyaz porselen lavabo, 60cm, batarya delikli',
    },
    {
      sku: 'ECA-001',
      netsisCode: 'NTS-ECA-001',
      name: 'ECA MITOS LAVABO BATARYASI KROM',
      brand: 'ECA',
      category: 'Batarya ve Musluklar',
      basePrice: 1240,
      unit: 'adet',
      netsisStock: 18,
      displayStock: 18,
      description: 'Krom lavabo bataryası, mitos serisi',
    },
    {
      sku: 'ART-001',
      netsisCode: 'NTS-ART-001',
      name: 'ARTEMA STARLINE DUŞ KABİNİ 90X90',
      brand: 'ARTEMA',
      category: 'Banyo Grubu & Kabin',
      basePrice: 8950,
      unit: 'adet',
      netsisStock: 4,
      displayStock: 4,
      description: 'Köşe duş kabini, 90x90, temperli cam',
      minimumStock: 5,
    },
    {
      sku: 'RTR-001',
      netsisCode: 'NTS-RTR-001',
      name: 'RTRMAX SİLİKON ŞEFFAF 280ML',
      brand: 'RTRMAX',
      category: 'Silikon & Köpük & Sprey Boya',
      basePrice: 65,
      unit: 'adet',
      netsisStock: 240,
      displayStock: 240,
      description: 'Şeffaf silikon, 280ml kartuş',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { ...p, syncStatus: 'SYNCED', visible: true, purchasable: true },
      create: { ...p, syncStatus: 'SYNCED', visible: true, purchasable: true },
    });
  }
  console.log(`✓ Seeded ${products.length} products`);

  console.log('🌱 Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
