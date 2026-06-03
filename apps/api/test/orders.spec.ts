/**
 * Orders unit tests.
 * Run: docker exec sadoksan-api-prod sh -c "cd /app/apps/api && npx jest test/orders.spec.ts --forceExit"
 */

// ---- mocks -----------------------------------------------------------
const mockOrderFindMany = jest.fn();
const mockOrderFindUnique = jest.fn();
const mockOrderCreate = jest.fn();
const mockOrderUpdate = jest.fn();
const mockOrderCount = jest.fn();

const mockPrisma = {
  order: {
    findMany: mockOrderFindMany,
    findUnique: mockOrderFindUnique,
    create: mockOrderCreate,
    update: mockOrderUpdate,
    count: mockOrderCount,
  },
  stockReservation: {
    create: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
  },
  orderStatusHistory: { create: jest.fn() },
  dealer: {
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn(),
  },
  user: { findUnique: jest.fn().mockResolvedValue({ id: 'u-1', email: 'test@test.com' }) },
  auditLog: { create: jest.fn() },
  product: { findUnique: jest.fn().mockResolvedValue({ id: 'p-1', basePrice: 100, displayStock: 50 }) },
};

const mockConfigService = {};
const mockProductsService = {
  getProduct: jest.fn().mockResolvedValue({ id: 'p-1', basePrice: 100, displayStock: 50 }),
};
const mockDiscountsService = { getDiscountedPrice: jest.fn().mockResolvedValue({ price: 100, discount: null }) };

const { OrdersService } = require('../src/modules/orders/orders.service');

describe('OrdersService', () => {
  let service: any;

  beforeAll(() => {
    service = new OrdersService(
      mockPrisma,
      mockConfigService,
      mockProductsService,
      mockDiscountsService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── createOrder ────────────────────────────────────────────────────
  describe('createOrder', () => {
    const mockCustomer = { id: 'cust-1', email: 'test@test.com', city: 'İstanbul' };
    const items = [{ productId: 'p-1', quantity: 2, unitPrice: 100 }];

    it('creates B2C order with APPROVED status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p-1', basePrice: 100, displayStock: 50, name: 'Test Ürün', baseUnit: 'adet' });
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1',
        orderNo: 'SDK-2026-0001',
        status: 'APPROVED',
        total: 319,
      });

      const result = await service.createOrder({
        customerId: 'cust-1',
        items,
        shippingCity: 'İstanbul',
        shippingAddress: 'Test Adres',
      });

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.stockReservation.create).toHaveBeenCalled();
    });

    it('creates B2B order with PENDING_APPROVAL status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p-1', basePrice: 100, displayStock: 50, name: 'Test', baseUnit: 'adet' });
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'dealer-1', status: 'ACTIVE' });
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-2',
        orderNo: 'SDK-2026-0002',
        status: 'PENDING_APPROVAL',
      });

      const result = await service.createOrder({
        customerId: 'cust-1',
        dealerId: 'dealer-1',
        items,
        shippingCity: 'Ankara',
        shippingAddress: 'Bayi Adres',
      });

      expect(result.status).toBe('PENDING_APPROVAL');
    });

    it('throws when customer not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createOrder({
        customerId: 'bad-id',
        items,
        shippingCity: 'İstanbul',
        shippingAddress: 'Adres',
      })).rejects.toThrow();
    });

    it('throws when item quantity exceeds stock', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'p-1', basePrice: 100, displayStock: 1, name: 'Az Stok', baseUnit: 'adet' });

      await expect(service.createOrder({
        customerId: 'cust-1',
        items: [{ productId: 'p-1', quantity: 10, unitPrice: 100 }],
        shippingCity: 'İstanbul',
        shippingAddress: 'Adres',
      })).rejects.toThrow(/stok/i);
    });
  });

  // ─── getPendingOrders ───────────────────────────────────────────────
  describe('getPendingOrders', () => {
    it('returns pending approval orders', async () => {
      mockOrderFindMany.mockResolvedValue([
        { id: 'o-1', orderNo: 'SDK-001', status: 'PENDING_APPROVAL', customerType: 'B2B' },
      ]);
      mockOrderCount.mockResolvedValue(1);

      const result = await service.getPendingOrders(50, 0);

      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].status).toBe('PENDING_APPROVAL');
    });

    it('returns empty when no pending orders', async () => {
      mockOrderFindMany.mockResolvedValue([]);
      mockOrderCount.mockResolvedValue(0);

      const result = await service.getPendingOrders(50, 0);

      expect(result.orders).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─── approveOrder ───────────────────────────────────────────────────
  describe('approveOrder', () => {
    it('approves PENDING_APPROVAL order and reserves stock', async () => {
      mockOrderFindUnique.mockResolvedValue({
        id: 'o-1',
        status: 'PENDING_APPROVAL',
        customerType: 'B2B',
        dealerId: 'dealer-1',
        lines: [{ productId: 'p-1', quantity: 5 }],
      });
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'dealer-1', totalOrders: 0, totalRevenue: 0 });
      mockOrderUpdate.mockResolvedValue({ id: 'o-1', status: 'APPROVED' });

      const result = await service.approveOrder('o-1', 'admin-1', 'admin@admin.com');

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.stockReservation.create).toHaveBeenCalled();
      expect(mockPrisma.orderStatusHistory.create).toHaveBeenCalled();
    });

    it('throws when order is not in PENDING_APPROVAL status', async () => {
      mockOrderFindUnique.mockResolvedValue({ id: 'o-1', status: 'SHIPPED' });

      await expect(service.approveOrder('o-1', 'admin-1', 'admin@admin.com'))
        .rejects.toThrow();
    });
  });

  // ─── shipOrder ──────────────────────────────────────────────────────
  describe('shipOrder', () => {
    it('ships an APPROVED order with tracking info', async () => {
      mockOrderFindUnique.mockResolvedValue({
        id: 'o-1',
        status: 'APPROVED',
        lines: [{ productId: 'p-1', quantity: 5 }],
      });
      mockOrderUpdate.mockResolvedValue({
        id: 'o-1',
        status: 'SHIPPED',
        trackingNumber: 'TRK123',
        cargoCompany: 'MNG Kargo',
      });

      const result = await service.shipOrder('o-1', 'TRK123', 'MNG Kargo', 'admin-1', 'admin@admin.com');

      expect(result.status).toBe('SHIPPED');
      expect(result.trackingNumber).toBe('TRK123');
    });
  });

  // ─── completeOrder ──────────────────────────────────────────────────
  describe('completeOrder', () => {
    it('completes a SHIPPED order and updates dealer stats', async () => {
      mockOrderFindUnique.mockResolvedValue({
        id: 'o-1',
        status: 'SHIPPED',
        total: 1000,
        dealerId: 'dealer-1',
        customerType: 'B2B',
        lines: [{ productId: 'p-1', quantity: 5 }],
      });
      mockPrisma.dealer.findUnique.mockResolvedValue({ id: 'dealer-1', totalOrders: 3, totalRevenue: 5000 });
      mockPrisma.stockReservation.updateMany.mockResolvedValue({ count: 1 });
      mockOrderUpdate.mockResolvedValue({ id: 'o-1', status: 'COMPLETED' });

      const result = await service.completeOrder('o-1', 'admin-1');

      expect(result.status).toBe('COMPLETED');
    });

    it('throws when order is not SHIPPED', async () => {
      mockOrderFindUnique.mockResolvedValue({ id: 'o-1', status: 'APPROVED' });

      await expect(service.completeOrder('o-1', 'admin-1')).rejects.toThrow();
    });
  });

  // ─── cancelOrder ────────────────────────────────────────────────────
  describe('cancelOrder', () => {
    it('cancels an order and releases stock reservations', async () => {
      mockOrderFindUnique.mockResolvedValue({
        id: 'o-1',
        status: 'APPROVED',
        lines: [{ productId: 'p-1', quantity: 5 }],
      });
      mockPrisma.stockReservation.updateMany.mockResolvedValue({ count: 1 });
      mockOrderUpdate.mockResolvedValue({ id: 'o-1', status: 'CANCELLED' });

      const result = await service.cancelOrder('o-1', 'admin-1', 'admin@admin.com', 'Müşteri talebi');

      expect(result.status).toBe('CANCELLED');
    });

    it('throws when order is already COMPLETED', async () => {
      mockOrderFindUnique.mockResolvedValue({ id: 'o-1', status: 'COMPLETED' });

      await expect(service.cancelOrder('o-1', 'admin-1', 'admin@admin.com', ''))
        .rejects.toThrow(/tamamlanmış/i);
    });
  });
});
