/**
 * FULL CYCLE INTEGRATION TEST
 * Gerçek bayi → sipariş → onay → sevk → tamamlanma
 * Tüm işlemler gerçek DB ve gerçek servisler üzerinden test edilir.
 *
 * Çalıştırma: pnpm exec jest test/full-cycle.spec.ts --forceExit
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { OrdersService } from '../src/modules/orders/orders.service';
import { DealerService } from '../src/modules/dealer/dealer.service';
import { ProductsService } from '../src/modules/products/products.service';

describe('Full Cycle: Bayi → Sipariş → Onay → Sevk → Tamamlandı', () => {
  let app: TestingModule;
  let prisma: PrismaService;
  let authService: AuthService;
  let ordersService: OrdersService;
  let dealerService: DealerService;
  let productsService: ProductsService;

  const createdIds: { users: string[]; dealers: string[]; orders: string[] } = {
    users: [], dealers: [], orders: [],
  };

  let adminId: string;
  let dealerUserId: string;
  let dealerId: string;
  let dealerEmail: string;
  let productId: string;

  // ──────────────────────────────────────────
  // Setup
  // ──────────────────────────────────────────
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
    prisma = app.get(PrismaService);
    authService = app.get(AuthService);
    ordersService = app.get(OrdersService);
    dealerService = app.get(DealerService);
    productsService = app.get(ProductsService);

    const admin = await prisma.user.findUnique({ where: { email: 'admin@admin.com' } });
    if (!admin) throw new Error('Admin kullanıcısı bulunamadı — önce seed çalıştırın');
    adminId = admin.id;
  });

  afterAll(async () => {
    for (const oid of createdIds.orders) {
      await prisma.stockReservation.deleteMany({ where: { orderId: oid } }).catch(() => {});
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: oid } }).catch(() => {});
      await prisma.order.deleteMany({ where: { id: oid } }).catch(() => {});
    }
    for (const did of createdIds.dealers) {
      await prisma.dealer.deleteMany({ where: { id: did } }).catch(() => {});
    }
    for (const uid of createdIds.users) {
      await prisma.user.deleteMany({ where: { id: uid } }).catch(() => {});
    }
    await app.close();
  });

  // ──────────────────────────────────────────
  // ADIM 1: Bayi Kaydı
  // ──────────────────────────────────────────
  describe('Step 1 — Bayi Kaydı', () => {
    it('yeni bayi kaydolur (DEALER rolü, PENDING durumu)', async () => {
      const ts = Date.now();
      dealerEmail = `test-bayi-${ts}@sadoksan.com`;

      const result = await authService.register({
        email: dealerEmail,
        password: 'Test1234!',
        name: 'Test Bayi Yetkilisi',
        phone: '05551234567',
        role: 'DEALER',
        company: 'Test İnşaat Ltd. Şti.',
        taxNo: `TX${ts}`,
        taxOffice: 'İstanbul',
        cariNo: `CR${ts}`,
        contactPerson: 'Test Bayi Yetkilisi',
        city: 'İstanbul',
        region: 'Marmara',
        address: 'Test Mah. İnşaat Sk. No:42 İstanbul',
      } as any);

      expect(result.access_token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.role).toBe('DEALER');

      dealerUserId = result.user.id;
      createdIds.users.push(dealerUserId);

      // Dealer kaydı DB'de oluştu mu?
      const dealer = await prisma.dealer.findUnique({ where: { userId: dealerUserId } });
      expect(dealer).toBeDefined();
      expect(dealer!.status).toBe('PENDING');
      expect(dealer!.company).toBe('Test İnşaat Ltd. Şti.');

      dealerId = dealer!.id;
      createdIds.dealers.push(dealerId);
    });

    it('DEALER rolüyle login olabilir', async () => {
      const loginResult = await authService.login({
        email: dealerEmail,
        password: 'Test1234!',
      });
      expect(loginResult.access_token).toBeDefined();
      expect(loginResult.user.role).toBe('DEALER');
    });
  });

  // ──────────────────────────────────────────
  // ADIM 2: Admin Bayi Onayı
  // ──────────────────────────────────────────
  describe('Step 2 — Admin Bayi Onayı', () => {
    it('admin PENDING bayi\'yi ACTIVE yapar', async () => {
      const result = await dealerService.approveDealer(dealerId, adminId);

      expect(result.status).toBe('ACTIVE');
      expect(result.cariValidated).toBe(true);
      expect(result.approvedBy).toBe(adminId);
      expect(result.approvedAt).toBeDefined();

      // Onay tarihi bugün olmalı
      const approvedDate = new Date(result.approvedAt!);
      const today = new Date();
      expect(approvedDate.getFullYear()).toBe(today.getFullYear());
      expect(approvedDate.getMonth()).toBe(today.getMonth());
      expect(approvedDate.getDate()).toBe(today.getDate());
    });

    it('PENDING olmayan bayi onaylanamaz', async () => {
      await expect(
        dealerService.approveDealer(dealerId, adminId),
      ).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────
  // ADIM 3: Bayi Profili & Ürün Kataloğu
  // ──────────────────────────────────────────
  describe('Step 3 — Bayi Profili & Ürün Kataloğu', () => {
    it('bayi profili doğru görüntülenir', async () => {
      const profile = await dealerService.getDealerProfile(dealerUserId);

      expect(profile.company).toBe('Test İnşaat Ltd. Şti.');
      expect(profile.city).toBe('İstanbul');
      expect(profile.region).toBe('Marmara');
      expect(profile.status).toBe('ACTIVE');
      expect(profile.totalOrders).toBe(0);
      expect(profile.cariBalance).toBe(0);
    });

    it('ürün kataloğu dolu ve fiyatlı', async () => {
      const { products } = await productsService.getAllProducts(50, 0);
      expect(products.length).toBeGreaterThan(0);

      productId = products[0].id;
      expect(products[0].name).toBeDefined();
      expect(products[0].basePrice).toBeGreaterThan(0);
      expect(products[0].displayStock).toBeGreaterThanOrEqual(0);
    });
  });

  // ──────────────────────────────────────────
  // ADIM 4: Bayi Sipariş Oluşturma
  // ──────────────────────────────────────────
  describe('Step 4 — Bayi Sipariş Oluşturma', () => {
    it('B2B sipariş PENDING_APPROVAL olarak oluşur, stok rezerve edilir', async () => {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      expect(product).toBeDefined();

      const beforeStock = await ordersService.getAvailableStock(productId);
      expect(beforeStock).toBeGreaterThan(0);

      const order = await ordersService.createOrder(
        {
          items: [{ productId, quantity: 2, unitPrice: product!.basePrice, taxRate: 0.2 }],
          customerType: 'B2B',
          dealerId,
          shippingCity: 'İstanbul',
          shippingAddress: 'Test Mah. İnşaat Sk. No:42 İstanbul',
          notes: 'Full cycle test siparişi',
        },
        dealerUserId,
      );

      createdIds.orders.push(order.id);

      // Sipariş doğru oluştu mu?
      expect(order.id).toBeDefined();
      expect(order.orderNo).toMatch(/^SDK-\d{4}-\d{5}$/);
      expect(order.status).toBe('PENDING_APPROVAL');
      expect(order.customerType).toBe('B2B');
      expect(order.dealerId).toBe(dealerId);
      expect(order.total).toBeGreaterThan(0);
      expect(order.lines).toHaveLength(1);

      // Sipariş tarihi bugün olmalı
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      expect(orderDate.getFullYear()).toBe(today.getFullYear());
      expect(orderDate.getMonth()).toBe(today.getMonth());
      expect(orderDate.getDate()).toBe(today.getDate());

      // Stok rezerve edildi mi?
      const afterStock = await ordersService.getAvailableStock(productId);
      expect(afterStock).toBe(beforeStock - 2);

      // Rezervasyon kaydı
      const reservations = await prisma.stockReservation.findMany({
        where: { orderId: order.id },
      });
      expect(reservations).toHaveLength(1);
      expect(reservations[0].quantity).toBe(2);
      expect(reservations[0].status).toBe('ACTIVE');
    });

    it('stok yetersizse sipariş reddedilir', async () => {
      await expect(
        ordersService.createOrder(
          {
            items: [{ productId, quantity: 999999, unitPrice: 100, taxRate: 0.2 }],
            customerType: 'B2B',
            dealerId,
            shippingCity: 'İstanbul',
            shippingAddress: 'Test',
          },
          dealerUserId,
        ),
      ).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────
  // ADIM 5: Admin Sipariş Onayı
  // ──────────────────────────────────────────
  describe('Step 5 — Admin Sipariş Onayı', () => {
    let orderId: string;
    let dealerBeforeBalance: number;

    beforeAll(async () => {
      orderId = createdIds.orders[0];
      const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
      dealerBeforeBalance = dealer!.cariBalance;
    });

    it('admin B2B siparişi APPROVED yapar', async () => {
      const result = await ordersService.approveOrder(orderId, adminId);

      expect(result.status).toBe('APPROVED');
      expect(result.approvedBy).toBe(adminId);
      expect(result.approvedAt).toBeDefined();

      const apprDate = new Date(result.approvedAt!);
      const today = new Date();
      expect(apprDate.getFullYear()).toBe(today.getFullYear());
    });

    it('onay sonrası cari bakiye sipariş toplamı kadar artar', async () => {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });

      expect(dealer!.cariBalance).toBeGreaterThan(dealerBeforeBalance);
      expect(dealer!.cariBalance).toBe(dealerBeforeBalance + order!.total);
    });

    it('onaylanan sipariş tekrar onaylanamaz', async () => {
      await expect(
        ordersService.approveOrder(orderId, adminId),
      ).rejects.toThrow();
    });

    it('status history kaydı oluşur', async () => {
      const history = await prisma.orderStatusHistory.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
      });
      const statuses = history.map((h) => h.status);
      expect(statuses).toContain('PENDING_APPROVAL');
      expect(statuses).toContain('APPROVED');
    });
  });

  // ──────────────────────────────────────────
  // ADIM 6: Admin Sevk (SHIPPED)
  // ──────────────────────────────────────────
  describe('Step 6 — Sipariş Sevk (SHIPPED)', () => {
    let orderId: string;

    beforeAll(() => {
      orderId = createdIds.orders[0];
    });

    it('admin siparişi SHIPPED yapar, stok rezervasyonu FULFILLED olur', async () => {
      const result = await ordersService.completeOrder(orderId);

      expect(result.status).toBe('SHIPPED');

      const reservations = await prisma.stockReservation.findMany({
        where: { orderId },
      });
      expect(reservations.length).toBeGreaterThan(0);
      expect(reservations.every((r) => r.status === 'FULFILLED')).toBe(true);
    });

    it('sevk sonrası status history güncellenir', async () => {
      const history = await prisma.orderStatusHistory.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' },
      });
      expect(history.map((h) => h.status)).toContain('SHIPPED');
    });
  });

  // ──────────────────────────────────────────
  // ADIM 7: Admin Tamamlama (COMPLETED)
  // ──────────────────────────────────────────
  describe('Step 7 — Sipariş Tamamlama (COMPLETED)', () => {
    let orderId: string;

    beforeAll(() => {
      orderId = createdIds.orders[0];
    });

    it('admin siparişi COMPLETED yapar', async () => {
      const result = await ordersService.markCompleted(orderId);

      expect(result.status).toBe('COMPLETED');

      const completedOrder = await prisma.order.findUnique({ where: { id: orderId } });
      expect(completedOrder!.completedAt).toBeDefined();

      const compDate = new Date(completedOrder!.completedAt!);
      const today = new Date();
      expect(compDate.getFullYear()).toBe(today.getFullYear());
    });

    it('tamamlanan sipariş bayi istatistiklerine yansır', async () => {
      const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
      expect(dealer!.totalOrders).toBeGreaterThanOrEqual(1);
      expect(dealer!.totalRevenue).toBeGreaterThan(0);
      expect(dealer!.lastOrderAt).toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  // ADIM 8: Bayi Sipariş Geçmişi & Raporlar
  // ──────────────────────────────────────────
  describe('Step 8 — Bayi Sipariş Geçmişi & Raporlar', () => {
    it('bayi kendi siparişlerini listeler', async () => {
      const { orders }: any = await ordersService.getOrders(dealerUserId);

      expect(orders.length).toBeGreaterThan(0);

      const ourOrder = orders.find((o: any) => o.id === createdIds.orders[0]);
      expect(ourOrder).toBeDefined();
      expect(ourOrder!.status).toBe('COMPLETED');
    });

    it('bayi cari hareketlerini görür', async () => {
      const transactions = await dealerService.getCariTransactions(dealerUserId);
      expect(transactions.length).toBeGreaterThan(0);

      const ourTx = transactions.find(
        (tx: any) => tx.description?.includes('SDK-'),
      );
      expect(ourTx).toBeDefined();
    });

    it('bayi tüm rapor tiplerini indirebilir', async () => {
      for (const type of ['monthly', 'yearly', 'invoice', 'detailed', 'stock']) {
        const buffer = await dealerService.generateReport(dealerUserId, type);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        const content = buffer.toString('utf-8');
        expect(content.length).toBeGreaterThan(10);
      }
    });
  });
});
