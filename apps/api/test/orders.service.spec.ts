import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock Prisma with chainable methods
const mockPrisma: any = {
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  orderStatusHistory: {
    create: jest.fn(),
  },
  stockReservation: {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
  logisticsRule: {
    findMany: jest.fn(),
  },
};

const mockPromoService: any = {
  validatePromoCode: jest.fn(),
};
const mockProformaService: any = {
  createProformaFromOrder: jest.fn().mockResolvedValue(undefined),
};

const { OrdersService } = require('../src/modules/orders/orders.service');

describe('OrdersService', () => {
  let service: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(mockPrisma, mockPromoService, mockProformaService);
  });

  describe('createOrder', () => {
    const validDto = {
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: 320, taxRate: 0.2 }],
      customerType: 'B2C' as const,
      shippingCity: 'Istanbul',
      shippingAddress: 'Test Adres',
    };

    it('should throw if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.createOrder(validDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if insufficient stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Test', netsisStock: 1 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      await expect(service.createOrder(validDto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should create B2C order as APPROVED', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Test', netsisStock: 10 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 2 } });
      mockPrisma.logisticsRule.findMany.mockResolvedValue([]);
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-1', orderNo: 'SDK-2026-00001', status: 'APPROVED',
        subtotal: 640, tax: 128, total: 768,
      });
      mockPrisma.stockReservation.create.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});

      const result = await service.createOrder(validDto, 'user-1');
      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.stockReservation.create).toHaveBeenCalled();
    });

    it('should create B2B order as PENDING_APPROVAL', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Test', netsisStock: 50 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 5 } });
      mockPrisma.logisticsRule.findMany.mockResolvedValue([]);
      mockPrisma.order.create.mockResolvedValue({
        id: 'order-2', orderNo: 'SDK-2026-00002', status: 'PENDING_APPROVAL',
        subtotal: 640, tax: 128, total: 768,
      });
      mockPrisma.stockReservation.create.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});

      const dto = { ...validDto, customerType: 'B2B' as const, dealerId: 'dealer-1' };
      const result = await service.createOrder(dto, 'user-1');
      expect(result.status).toBe('PENDING_APPROVAL');
    });

    it('should set payment fields when paymentMethod provided', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', name: 'Test', netsisStock: 10 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      mockPrisma.logisticsRule.findMany.mockResolvedValue([]);
      let createdData: any = null;
      mockPrisma.order.create.mockImplementation((args: any) => {
        createdData = args.data;
        return { id: 'order-3', ...args.data };
      });
      mockPrisma.stockReservation.create.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});

      await service.createOrder({ ...validDto, paymentMethod: 'CREDIT_CARD' as any }, 'user-1');
      expect(createdData.paymentMethod).toBe('CREDIT_CARD');
      expect(createdData.paymentStatus).toBe('PENDING');
    });

    it('should recalc display stock after reservation', async () => {
      mockPrisma.product.findUnique
        .mockResolvedValueOnce({ id: 'prod-1', name: 'Test', netsisStock: 10 }) // stock check
        .mockResolvedValueOnce({ id: 'prod-1', netsisStock: 10 }); // recalc
      mockPrisma.stockReservation.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 0 } }) // stock check
        .mockResolvedValueOnce({ _sum: { quantity: 2 } }); // recalc
      mockPrisma.logisticsRule.findMany.mockResolvedValue([]);
      mockPrisma.order.create.mockResolvedValue({ id: 'order-4', status: 'APPROVED' });
      mockPrisma.stockReservation.create.mockResolvedValue({});
      mockPrisma.product.update.mockResolvedValue({});

      await service.createOrder(validDto, 'user-1');
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reservedStock: 2, displayStock: 8 }),
        }),
      );
    });
  });

  describe('payOrder (mock)', () => {
    it('should set paymentStatus to PAID', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', customerId: 'user-1', customerType: 'B2C', status: 'APPROVED',
      });
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1', paymentStatus: 'PAID', status: 'APPROVED',
      });

      const result = await service.payOrder('order-1', 'user-1');
      expect(result.paymentStatus).toBe('PAID');
    });

    it('should throw if order belongs to different user', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', customerId: 'other-user',
      });
      await expect(service.payOrder('order-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveOrder', () => {
    it('should approve PENDING_APPROVAL order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', customerType: 'B2B', status: 'PENDING_APPROVAL',
      });
      mockPrisma.order.update.mockResolvedValue({
        id: 'order-1', status: 'APPROVED', approvedBy: 'admin-1',
        lines: [], dealer: null,
      });

      const result = await service.approveOrder('order-1', 'admin-1');
      expect(result.status).toBe('APPROVED');
    });

    it('should throw for non-B2B order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', customerType: 'B2C', status: 'PENDING_APPROVAL',
      });
      await expect(service.approveOrder('order-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectOrder', () => {
    it('should reject and release stock', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'order-1', status: 'PENDING_APPROVAL',
      });
      mockPrisma.stockReservation.findMany.mockResolvedValue([{ productId: 'prod-1' }]);
      mockPrisma.stockReservation.updateMany.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'REJECTED' });
      mockPrisma.product.findUnique.mockResolvedValue({ netsisStock: 10 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      mockPrisma.product.update.mockResolvedValue({});

      const result = await service.rejectOrder('order-1', 'admin-1', 'Test reason');
      expect(result.status).toBe('REJECTED');
      expect(mockPrisma.stockReservation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'RELEASED' } }),
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel and release stock', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1', status: 'APPROVED' });
      mockPrisma.stockReservation.findMany.mockResolvedValue([{ productId: 'prod-1' }]);
      mockPrisma.stockReservation.updateMany.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' });
      mockPrisma.product.findUnique.mockResolvedValue({ netsisStock: 10 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      mockPrisma.product.update.mockResolvedValue({});

      const result = await service.cancelOrder('order-1', 'Test reason');
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('completeOrder (ship)', () => {
    it('should ship and fulfill stock', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ id: 'order-1' });
      mockPrisma.stockReservation.findMany.mockResolvedValue([{ productId: 'prod-1' }]);
      mockPrisma.stockReservation.updateMany.mockResolvedValue({});
      mockPrisma.order.update.mockResolvedValue({ id: 'order-1', status: 'SHIPPED' });
      mockPrisma.product.findUnique.mockResolvedValue({ netsisStock: 10 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
      mockPrisma.product.update.mockResolvedValue({});

      const result = await service.completeOrder('order-1');
      expect(result.status).toBe('SHIPPED');
      expect(mockPrisma.stockReservation.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'FULFILLED' } }),
      );
    });
  });

  describe('getAvailableStock', () => {
    it('should return netsisStock minus active reservations', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', netsisStock: 100 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 25 } });
      const result = await service.getAvailableStock('prod-1');
      expect(result).toBe(75);
    });

    it('should return 0 if reserved exceeds stock', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: 'prod-1', netsisStock: 10 });
      mockPrisma.stockReservation.aggregate.mockResolvedValue({ _sum: { quantity: 30 } });
      const result = await service.getAvailableStock('prod-1');
      expect(result).toBe(0);
    });
  });
});
