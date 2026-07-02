const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const data = JSON.parse(fs.readFileSync('./netsis-import.json', 'utf-8'));
  console.log('İşlenecek kayıt:', data.length);

  let created = 0, skipped = 0, errors = 0;

  for (const item of data) {
    try {
      const existing = await prisma.product.findUnique({ where: { netsisCode: item.code } });
      if (existing) { skipped++; continue; }

      await prisma.product.create({
        data: {
          netsisCode: item.code,
          sku: item.code,
          name: item.name,
          brand: '',
          category: '',
          unit: 'adet',
          basePrice: 0,
          taxRate: 0.2,
          netsisStock: item.stock,
          displayStock: item.stock,
          minimumStock: 0,
          visible: false,
          purchasable: false,
          syncStatus: 'NEVER',
        },
      });
      created++;
    } catch (err) {
      errors++;
      console.error(`Hata [${item.code}]:`, err.message);
    }
  }

  console.log(`Tamamlandı: ${created} oluşturuldu, ${skipped} zaten vardı (atlandı), ${errors} hata`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
