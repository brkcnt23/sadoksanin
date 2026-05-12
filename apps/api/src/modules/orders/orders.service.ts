import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private logger = new Logger(OrdersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new order and reserve stock
   * B2C: status APPROVED immediately
   * B2B: status PENDING_APPROVAL for admin approval
   */
  async createOrder(createOrderDto: CreateOrderDto, customerId: string) {
    const { items, dealerId, customerType, shippingCity, shippingAddress } = createOrderDto;

    // Validate stock availability
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
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

    const logisticsSurcharge = createOrderDto.logisticsSurcharge || 0;
    const total = subtotal + tax + logisticsSurcharge;

    // Generate unique order number: SDK-{year}-{random}
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    const orderNo = `SDK-${year}-${random}`;

    // Create order
    const order = await this.prisma.order.create({
      data: {
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
        lines: {
          create: orderLines,
        },
      },
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
    }

    this.logger.log(`Order ${order.id} created with ${items.length} items`);
    return order;
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
    });

    this.logger.log(`Order ${orderId} approved by ${approvingUserId}`);
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
    await this.prisma.stockReservation.updateMany({
      where: { orderId },
      data: { status: 'RELEASED' },
    });

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    this.logger.log(`Order ${orderId} rejected by ${rejectingUserId}: ${reason}`);
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
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'FULFILLED' },
    });

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
      },
    });

    this.logger.log(`Order ${orderId} shipped, stock reservations fulfilled`);
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
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'RELEASED' },
    });

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason,
      },
    });

    this.logger.log(`Order ${orderId} cancelled: ${reason}`);
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
}
