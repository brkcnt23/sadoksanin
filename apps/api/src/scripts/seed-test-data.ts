/**
 * Test verisi oluşturma — docker exec ile çalıştır:
 * docker exec sadoksan-api-prod sh -c 'cd /app/apps/api && npx tsx src/scripts/seed-test-data.ts'
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Test verisi oluşturuluyor...')

  const pw = await bcrypt.hash('test123', 10)

  // 4 Test Bayi
  const dealers: any[] = []
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

  // Plasiyer
  let plasiyer = await prisma.user.findUnique({ where: { email: 'ahmet.satis@test.com' } })
  if (!plasiyer) {
    plasiyer = await prisma.user.create({
      data: { email: 'ahmet.satis@test.com', password: pw, name: 'Ahmet Satış', role: 'PLASIYER', phone: '0532 111 2233', city: 'İstanbul' },
    })
    console.log('  ✅ Plasiyer: Ahmet Satış')
  }

  // Ürünler
  const products = await prisma.product.findMany({
    where: { displayStock: { gt: 0 }, purchasable: true },
    orderBy: { displayStock: 'desc' },
    take: 8,
  })
  console.log(`📦 ${products.length} ürün`)

  if (products.length === 0) { console.log('❌ Ürün yok!'); return }

  const admin = await prisma.user.findFirst({ where: { email: 'admin@admin.com' } })
  if (!admin) { console.log('❌ Admin yok!'); return }

  // Mevcut siparişleri temizle (test verisi)
  await prisma.orderLine.deleteMany({})
  await prisma.order.deleteMany({})
  console.log('🧹 Eski siparişler temizlendi')

  const now = new Date()
  const defs = [
    { daysAgo: 0, status: 'PENDING_APPROVAL', paid: false, didx: 0, pis: [0,1], qts: [15,8] },
    { daysAgo: 0, status: 'PENDING_APPROVAL', paid: false, didx: 2, pis: [2,3], qts: [20,12] },
    { daysAgo: 1, status: 'SHIPPED', paid: true, didx: 0, pis: [4,5], qts: [5,3], inv: 'FAT-2026-0042', dnc: true },
    { daysAgo: 1, status: 'APPROVED', paid: true, didx: 1, pis: [6], qts: [10] },
    { daysAgo: 1, status: 'COMPLETED', paid: true, didx: 3, pis: [7,0], qts: [6,4], inv: 'FAT-2026-0043', dnc: true, cash: true },
    { daysAgo: 2, status: 'SHIPPED', paid: true, didx: 1, pis: [1,3], qts: [25,15] },
    { daysAgo: 2, status: 'COMPLETED', paid: true, didx: 0, pis: [2], qts: [8], inv: 'FAT-2026-0040', cash: true },
    { daysAgo: 4, status: 'COMPLETED', paid: true, didx: 2, pis: [4,6], qts: [30,18], inv: 'FAT-2026-0035', dnc: true, cash: true },
    { daysAgo: 4, status: 'CANCELLED', paid: false, didx: 3, pis: [5], qts: [4] },
    { daysAgo: 6, status: 'COMPLETED', paid: true, didx: 1, pis: [7,0], qts: [40,22], inv: 'FAT-2026-0038', dnc: true, cash: true },
    { daysAgo: 6, status: 'COMPLETED', paid: true, didx: 0, pis: [3,5], qts: [10,7], inv: 'FAT-2026-0039', dnc: true, cash: true },
  ]

  for (let i = 0; i < defs.length; i++) {
    const d = defs[i]
    const dealer = dealers[d.didx]
    const items = d.pis.map((pi, idx) => {
      const p = products[pi]
      return { productId: p.id, quantity: d.qts[idx], unitPrice: p.basePrice, taxRate: (p as any).taxRate ?? 0.2 }
    })
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
    const tax = items.reduce((s, it) => s + it.quantity * it.unitPrice * it.taxRate, 0)
    const total = subtotal + tax
    const date = new Date(now.getTime() - d.daysAgo * 86400000)

    await prisma.order.create({
      data: {
        orderNo: `SDK-2026-${String(5001 + i)}`,
        customerId: admin.id, customerType: 'B2B', dealerId: dealer.id,
        shippingCity: dealer.city, shippingAddress: dealer.address,
        subtotal, tax, total,
        status: d.status as any,
        paymentStatus: d.paid ? 'PAID' : 'PENDING',
        paymentMethod: 'CREDIT_CARD' as any,
        approvedAt: d.status !== 'PENDING_APPROVAL' ? date : null,
        approvedBy: d.status !== 'PENDING_APPROVAL' ? admin.id : null,
        invoiceCut: !!d.inv, invoiceNo: d.inv || null, invoiceDate: d.inv ? date : null,
        cashCollected: !!d.cash, cashCollectedAt: d.cash ? new Date(date.getTime() + 86400000) : null,
        deliveryNoteCut: !!d.dnc,
        createdAt: date, updatedAt: date,
        lines: { create: items.map(it => ({ ...it, total: it.quantity * it.unitPrice })) },
      },
    })
    console.log(`  📦 SDK-2026-${5001 + i} — ${d.status} — ${d.daysAgo === 0 ? 'BUGÜN' : d.daysAgo + 'g önce'}${d.inv ? ' 🧾' : ''}${d.cash ? ' 💰' : ''}`)
  }

  console.log(`\n✅ ${dealers.length} bayi, ${defs.length} sipariş oluşturuldu`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
