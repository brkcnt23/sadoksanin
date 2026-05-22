import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PromoService } from '../promo/promo.service';
import { ProformaService } from '../proforma/proforma.service';

@Injectable()
export class OrdersService {
  private logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private promoService: PromoService,
    private proformaService: ProformaService,
  ) {}

  /**
   * Create a new order and reserve stock
   * B2C: status APPROVED immediately
   * B2B: status PENDING_APPROVAL for admin approval
   */
  async createOrder(createOrderDto: CreateOrderDto, customerId: string) {
    const { items, dealerId, customerType, shippingCity, shippingAddress, promoCode, notes, paymentMethod } = createOrderDto;

    // Validate stock availability
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new BadRequestException(`Ürün bulunamadı: ${item.productId}. Sepetinizi güncelleyip tekrar deneyin.`);
      }

      const available = await this.getAvailableStock(item.productId);
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${available}`,
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    let tax = 0;

    const orderLines = items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxRate || 0);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      tax += lineTax;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        total: lineTotal,
      };
    });

    // Auto-calculate logistics from shipping city
    let logisticsSurcharge = createOrderDto.logisticsSurcharge || 0;
    if (!logisticsSurcharge && shippingCity) {
      const rules = await this.prisma.logisticsRule.findMany({ where: { active: true } });
      for (const rule of rules) {
        if (rule.cities.some((c: string) => c.toLowerCase() === shippingCity.toLowerCase())) {
          const weight = items.length * 10; // 10kg per item estimate
          logisticsSurcharge = rule.baseSurcharge + weight * rule.perKgSurcharge;
          logisticsSurcharge = Math.round(logisticsSurcharge * 100) / 100;
          this.logger.debug(`Logistics for ${shippingCity}: ${logisticsSurcharge} TL (${rule.region})`);
          break;
        }
      }
    }

    let total = subtotal + tax + logisticsSurcharge;
    let discountAmount = 0;
    let appliedPromoCode: string | null = null;

    // Validate and apply promo code
    if (promoCode) {
      const isDealer = customerType === 'B2B';
      const promoResult = await this.promoService.validatePromoCode(promoCode, subtotal, isDealer);
      if (promoResult.valid) {
        discountAmount = promoResult.discountAmount;
        total = total - discountAmount;
        appliedPromoCode = promoCode.toUpperCase().trim();
        // Increment usage
        await this.prisma.promoCode.update({
          where: { code: appliedPromoCode },
          data: { usedCount: { increment: 1 } },
        });
        this.logger.log(`Promo ${appliedPromoCode} applied: -${discountAmount} TL`);
      } else {
        throw new BadRequestException(promoResult.message || 'Geçersiz promosyon kodu');
      }
    }

    // Generate unique order number: SDK-{year}-{random}
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    const orderNo = `SDK-${year}-${random}`;

    // Create order
    const createData: any = {
      orderNo,
      customerId,
      customerType,
      dealerId,
      shippingCity,
      shippingAddress,
      status: customerType === 'B2B' ? 'PENDING_APPROVAL' : 'APPROVED',
      subtotal,
      tax,
      logisticsSurcharge,
      total,
      promoCode: appliedPromoCode,
      discountAmount,
      notes: notes || undefined,
      lines: { create: orderLines },
    };
    if (paymentMethod) {
      createData.paymentMethod = paymentMethod;
      createData.paymentStatus = 'PENDING';
    }

    const order = await this.prisma.order.create({
      data: createData,
      include: {
        lines: true,
      },
    });

    // Reserve stock for all items
    for (const item of items) {
      await this.prisma.stockReservation.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          status: 'ACTIVE',
        },
      });
      await this.recalcDisplayStock(item.productId);
    }

    this.logger.log(`Order ${order.id} created with ${items.length} items`);
    await this.logStatusChange(order.id, order.status, undefined, customerId, undefined);
    return order;
  }

  /**
   * Recalculate Product.displayStock = netsisStock - ACTIVE reservations
   * Must be called after every reservation status change
   */
  private async recalcDisplayStock(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return;

    const reservations = await this.prisma.stockReservation.aggregate({
      where: { productId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });
    const reserved = reservations._sum.quantity || 0;
    const displayStock = Math.max(0, product.netsisStock - reserved);

    await this.prisma.product.update({
      where: { id: productId },
      data: { reservedStock: reserved, displayStock },
    });
  }

  /**
   * Get available stock (Netsis stock - active reservations)
   * Used to prevent overselling
   */
  async getAvailableStock(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Get total active reserved stock
    const reservations = await this.prisma.stockReservation.aggregate({
      where: {
        productId,
        status: 'ACTIVE',
      },
      _sum: {
        quantity: true,
      },
    });

    const reserved = reservations._sum.quantity || 0;
    return Math.max(0, product.netsisStock - reserved);
  }

  /**
   * Admin approves a B2B order
   */
  async approveOrder(orderId: string, approvingUserId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.customerType !== 'B2B') {
      throw new BadRequestException('Only B2B orders can be approved');
    }

    if (order.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Order cannot be approved from status: ${order.status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: approvingUserId,
      },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        dealer: true,
      },
    });

    this.logger.log(`Order ${orderId} approved by ${approvingUserId}`);
    await this.logStatusChange(orderId, 'APPROVED', undefined, approvingUserId, undefined);

    // Auto-generate proforma (fire-and-forget)
    this.proformaService.createProformaFromOrder(updated).catch((err) => {
      this.logger.error(`Auto-proforma failed for order ${orderId}: ${err.message}`);
    });

    return updated;
  }

  /**
   * Reject a B2B order and release stock reservation
   */
  async rejectOrder(orderId: string, rejectingUserId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(`Order cannot be rejected from status: ${order.status}`);
    }

    // Release all stock reservations
    const reservations = await this.prisma.stockReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
      select: { productId: true },
    });
    await this.prisma.stockReservation.updateMany({
      where: { orderId },
      data: { status: 'RELEASED' },
    });
    for (const r of reservations) {
      await this.recalcDisplayStock(r.productId);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    this.logger.log(`Order ${orderId} rejected by ${rejectingUserId}: ${reason}`);
    await this.logStatusChange(orderId, 'REJECTED', reason, rejectingUserId, undefined);
    return updated;
  }

  /**
   * Mark order as shipped
   * Release stock reservations when Netsis syncs "shipped" status
   */
  async completeOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Release all active stock reservations (become fulfilled)
    const reservations = await this.prisma.stockReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
      select: { productId: true },
    });
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'FULFILLED' },
    });
    for (const r of reservations) {
      await this.recalcDisplayStock(r.productId);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
      },
    });

    this.logger.log(`Order ${orderId} shipped, stock reservations fulfilled`);
    await this.logStatusChange(orderId, 'SHIPPED', undefined, undefined, undefined);
    return updated;
  }

  /**
   * Cancel an order and release stock
   */
  async cancelOrder(orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Release all active reservations
    const reservations = await this.prisma.stockReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
      select: { productId: true },
    });
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'RELEASED' },
    });
    for (const r of reservations) {
      await this.recalcDisplayStock(r.productId);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason,
      },
    });

    this.logger.log(`Order ${orderId} cancelled: ${reason}`);
    await this.logStatusChange(orderId, 'CANCELLED', reason, undefined, undefined);
    return updated;
  }

  /**
   * Mock payment — always succeeds, no real API call
   */
  async payOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.customerId !== userId) throw new BadRequestException('Bu sipariş size ait değil');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: order.customerType === 'B2C' ? 'APPROVED' : order.status,
      },
      include: { lines: { include: { product: true } } },
    });

    this.logger.log(`Order ${orderId} payment successful (mock)`);
    return updated;
  }

  /**
   * Get orders with filters (customer view or admin listing)
   */
  async getOrders(
    customerId?: string,
    status?: string,
    customerType?: 'B2C' | 'B2B',
    limit = 50,
    offset = 0,
  ) {
    const where: any = {};

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (customerType) where.customerType = customerType;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          lines: {
            include: { product: true },
          },
          stockReservations: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Get single order with full details
   */
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lines: {
          include: { product: true },
        },
        stockReservations: true,
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        dealer: {
          select: { id: true, name: true, cariNo: true, region: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async requestReturn(orderId: string, reason: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');
    if (order.status !== 'COMPLETED' && order.status !== 'SHIPPED') {
      throw new BadRequestException('Sadece tamamlanmış/kargodaki siparişler iade edilebilir');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURN_REQUESTED' },
    });
    await this.logStatusChange(orderId, 'RETURN_REQUESTED', reason, userId, undefined);
    this.logger.log(`Order ${orderId} return requested by ${userId}: ${reason}`);
    return updated;
  }

  async approveReturn(orderId: string, adminId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { stockReservations: { where: { status: 'FULFILLED' } } },
    });
    if (!order || order.status !== 'RETURN_REQUESTED') {
      throw new BadRequestException('İade talebi bulunamadı');
    }

    // Release fulfilled stock back to inventory
    for (const r of order.stockReservations) {
      await this.prisma.stockReservation.update({
        where: { id: r.id },
        data: { status: 'RELEASED' },
      });
      await this.prisma.product.update({
        where: { id: r.productId },
        data: { netsisStock: { increment: r.quantity } },
      });
      await this.recalcDisplayStock(r.productId);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURNED' },
    });
    await this.logStatusChange(orderId, 'RETURNED', 'İade onaylandı — stok geri alındı', adminId, undefined);
    this.logger.log(`Order ${orderId} return approved by ${adminId}`);
    return updated;
  }

  async getOrderHistory(orderId: string) {
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async logStatusChange(
    orderId: string,
    status: string,
    note?: string,
    actorId?: string,
    actorEmail?: string,
  ) {
    return this.prisma.orderStatusHistory.create({
      data: { orderId, status, note, actorId, actorEmail },
    });
  }
}
