/**
 * Test verisi oluşturma scripti — API container'ında tsx ile çalıştırılır.
 * docker exec sadoksan-api-prod sh -c 'cd /app/apps/api && npx tsx ../../scripts/seed-test-data.ts'
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Test verisi oluşturuluyor...')

  const pw = await bcrypt.hash('test123', 10)

  // 4 Test Bayi
  const dealers = []
  const dealerDefs = [
    { email: 'ankara-yapi@test.com', name: 'Mustafa Demir', company: 'Ankara Yapı Malz. Ltd. Şti.', taxNo: '11122233344', taxOffice: 'Ankara', phone: '0532 111 2233', city: 'Ankara', region: 'İç Anadolu', address: 'OSTİM, No: 15, Ankara', cariNo: '120.01.0101', creditLimit: 150000, cariBalance: 45000 },
    { email: 'izmir-ticaret@test.com', name: 'Hüseyin Kaya', company: 'İzmir Ticaret A.Ş.', taxNo: '22233344455', taxOffice: 'İzmir', phone: '0533 444 5566', city: 'İzmir', region: 'Ege', address: 'Kemeraltı, No: 22, İzmir', cariNo: '120.01.0102', creditLimit: 100000, cariBalance: 72000 },
    { email: 'bursa-insaat@test.com', name: 'Ali Yılmaz', company: 'Bursa İnşaat Ltd. Şti.', taxNo: '33344455566', taxOffice: 'Bursa', phone: '0534 777 8899', city: 'Bursa', region: 'Marmara', address: 'Nilüfer, No: 8, Bursa', cariNo: '120.01.0103', creditLimit: 200000, cariBalance: 180000 },
    { email: 'erzurum-yapi@test.com', name: 'Ahmet Şahin', company: 'Erzurum Yapı Market Ltd.', taxNo: '44455566677', taxOffice: 'Erzurum', phone: '0535 000 1122', city: 'Erzurum', region: 'Doğu Anadolu', address: 'Yakutiye, No: 33, Erzurum', cariNo: '120.01.0104', creditLimit: 80000, cariBalance: 15000 },
  ]

  for (const d of dealerDefs) {
    const existing = await prisma.user.findUnique({ where: { email: d.email } })
    if (existing) {
      console.log(`  ⏭️ ${d.email} zaten var`)
      const dlr = await prisma.dealer.findUnique({ where: { userId: existing.id } })
      if (dlr) dealers.push(dlr)
      continue
    }
    const user = await prisma.user.create({
      data: { email: d.email, password: pw, name: d.name, role: 'DEALER', phone: d.phone, city: d.city },
    })
    const dlr = await prisma.dealer.create({
      data: {
        userId: user.id, name: d.company, company: d.company,
        contactPerson: d.name, phone: d.phone, cariNo: d.cariNo,
        taxNo: d.taxNo, taxOffice: d.taxOffice, city: d.city, region: d.region,
        address: d.address, status: 'ACTIVE', creditLimit: d.creditLimit, cariBalance: d.cariBalance,
      },
    })
    dealers.push(dlr)
    console.log(`  ✅ ${d.company}`)
  }

  // Plasiyer kullanıcısı
  let plasiyer = await prisma.user.findUnique({ where: { email: 'ahmet.satis@test.com' } })
  if (!plasiyer) {
    plasiyer = await prisma.user.create({
      data: { email: 'ahmet.satis@test.com', password: pw, name: 'Ahmet Satış', role: 'PLASIYER', phone: '0532 111 2233', city: 'İstanbul' },
    })
    console.log('  ✅ Plasiyer: Ahmet Satış')
  }

  // Ürünleri al
  const products = await prisma.product.findMany({
    where: { displayStock: { gt: 0 }, purchasable: true },
    orderBy: { displayStock: 'desc' },
    take: 8,
  })
  console.log(`📦 ${products.length} ürün bulundu`)

  if (products.length === 0) { console.log('❌ Ürün yok!'); return }

  // Admin kullanıcısı
  const admin = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } })
  if (!admin) { console.log('❌ Admin bulunamadı!'); return }

  // Siparişleri yarat
  const now = new Date()
  const orderDefs = [
    // Bugün - 2 onay bekleyen
    { daysAgo: 0, status: 'PENDING_APPROVAL', paymentStatus: 'PENDING', dealerIdx: 0, items: [{ pi: 0, qty: 15 }, { pi: 1, qty: 8 }] },
    { daysAgo: 0, status: 'PENDING_APPROVAL', paymentStatus: 'PENDING', dealerIdx: 2, items: [{ pi: 2, qty: 20 }, { pi: 3, qty: 12 }] },
    // Dün - 3 çeşitli
    { daysAgo: 1, status: 'SHIPPED', paymentStatus: 'PAID', dealerIdx: 0, items: [{ pi: 4, qty: 5 }, { pi: 5, qty: 3 }], invoiceCut: true, invoiceNo: 'FAT-2026-0042', deliveryNoteCut: true },
    { daysAgo: 1, status: 'APPROVED', paymentStatus: 'PAID', dealerIdx: 1, items: [{ pi: 6, qty: 10 }] },
    { daysAgo: 1, status: 'COMPLETED', paymentStatus: 'PAID', dealerIdx: 3, items: [{ pi: 7, qty: 6 }, { pi: 0, qty: 4 }], invoiceCut: true, invoiceNo: 'FAT-2026-0043', deliveryNoteCut: true, cashCollected: true },
    // 2 gün önce
    { daysAgo: 2, status: 'SHIPPED', paymentStatus: 'PAID', dealerIdx: 1, items: [{ pi: 1, qty: 25 }, { pi: 3, qty: 15 }] },
    { daysAgo: 2, status: 'COMPLETED', paymentStatus: 'PAID', dealerIdx: 0, items: [{ pi: 2, qty: 8 }], invoiceCut: true, invoiceNo: 'FAT-2026-0040', cashCollected: true },
    // 4 gün önce
    { daysAgo: 4, status: 'COMPLETED', paymentStatus: 'PAID', dealerIdx: 2, items: [{ pi: 4, qty: 30 }, { pi: 6, qty: 18 }], invoiceCut: true, invoiceNo: 'FAT-2026-0035', deliveryNoteCut: true, cashCollected: true },
    { daysAgo: 4, status: 'CANCELLED', paymentStatus: 'PENDING', dealerIdx: 3, items: [{ pi: 5, qty: 4 }] },
    // 6 gün önce
    { daysAgo: 6, status: 'COMPLETED', paymentStatus: 'PAID', dealerIdx: 1, items: [{ pi: 7, qty: 40 }, { pi: 0, qty: 22 }], invoiceCut: true, invoiceNo: 'FAT-2026-0038', deliveryNoteCut: true, cashCollected: true },
    { daysAgo: 6, status: 'COMPLETED', paymentStatus: 'PAID', dealerIdx: 0, items: [{ pi: 3, qty: 10 }, { pi: 5, qty: 7 }], invoiceCut: true, invoiceNo: 'FAT-2026-0039', deliveryNoteCut: true, cashCollected: true },
  ]

  for (let i = 0; i < orderDefs.length; i++) {
    const def = orderDefs[i]
    const dealer = dealers[def.dealerIdx]
    if (!dealer) continue

    const orderDate = new Date(now.getTime() - def.daysAgo * 24 * 60 * 60 * 1000)
    const items = def.items.map(it => ({
      productId: products[it.pi].id,
      quantity: it.qty,
      unitPrice: products[it.pi].basePrice,
      taxRate: products[it.pi].taxRate,
    }))
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
    const tax = items.reduce((s, it) => s + it.quantity * it.unitPrice * it.taxRate, 0)
    const total = subtotal + tax

    const order = await prisma.order.create({
      data: {
        orderNo: `SDK-2026-${String(5000 + i).padStart(4, '0')}`,
        customerId: admin.id,
        customerType: 'B2B',
        dealerId: dealer.id,
        shippingCity: dealer.city,
        shippingAddress: dealer.address,
        subtotal, tax, total,
        status: def.status as any,
        paymentStatus: def.paymentStatus as any,
        paymentMethod: 'CREDIT_CARD',
        approvedAt: def.status !== 'PENDING_APPROVAL' ? orderDate : null,
        approvedBy: def.status !== 'PENDING_APPROVAL' ? admin.id : null,
        invoiceCut: def.invoiceCut || false,
        invoiceNo: def.invoiceNo || null,
        invoiceDate: def.invoiceCut ? orderDate : null,
        cashCollected: def.cashCollected || false,
        cashCollectedAt: def.cashCollected ? new Date(orderDate.getTime() + 1 * 24 * 60 * 60 * 1000) : null,
        deliveryNoteCut: def.deliveryNoteCut || false,
        createdAt: orderDate,
        updatedAt: orderDate,
        lines: {
          create: items.map(it => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            total: it.quantity * it.unitPrice,
          })),
        },
      },
    })
    console.log(`  📦 ${order.orderNo} — ${def.status} — ${def.daysAgo === 0 ? 'BUGÜN' : def.daysAgo + 'g önce'}`)
  }

  console.log(`\n✅ Tamamlandı: ${dealers.length} bayi, ${orderDefs.length} sipariş`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
