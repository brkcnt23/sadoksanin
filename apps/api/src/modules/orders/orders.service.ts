import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PromoService } from '../promo/promo.service';
import { ProformaService } from '../proforma/proforma.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class OrdersService {
  private logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private promoService: PromoService,
    private proformaService: ProformaService,
    private mailerService: MailerService,
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
      await this.logStockMovement(item.productId, 'ORDER_RESERVE', item.quantity, 'Order', order.id, customerId, `Sipariş ${orderNo}`);
    }

    this.logger.log(`Order ${order.id} created with ${items.length} items`);
    await this.logStatusChange(order.id, order.status, undefined, customerId, undefined);
    // Fire-and-forget email notification
    const customer = await this.prisma.user.findUnique({ where: { id: customerId }, select: { email: true, name: true } });
    if (customer) this.mailerService.sendOrderCreated(customer.email, customer.name, orderNo, total).catch(() => {});
    return order;
  }

  /**
   * Recalculate Product.displayStock
   * Formula: netsisStock - netsisPendingQuantity - ACTIVE reservations
   * netsisPendingQuantity: Netsis'te bekleyen (faturası kesilmemiş) miktar
   */
  private async recalcDisplayStock(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return;

    const reservations = await this.prisma.stockReservation.aggregate({
      where: { productId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });
    const reserved = reservations._sum.quantity || 0;
    const displayStock = Math.max(0, product.netsisStock - product.netsisPendingQuantity - reserved);

    await this.prisma.product.update({
      where: { id: productId },
      data: { reservedStock: reserved, displayStock },
    });
  }

  /**
   * Get available stock (netsisStock - netsisPendingQuantity - active reservations)
   */
  async getAvailableStock(productId: string): Promise<number> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const reservations = await this.prisma.stockReservation.aggregate({
      where: { productId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });

    const reserved = reservations._sum.quantity || 0;
    return Math.max(0, product.netsisStock - product.netsisPendingQuantity - reserved);
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

    // Kredi limiti kontrolü — bayi bakiyesi + yeni sipariş limiti aşmamalı
    if (order.dealerId) {
      const dealer = await this.prisma.dealer.findUnique({
        where: { id: order.dealerId },
        select: { creditLimit: true, cariBalance: true, company: true },
      });

      if (dealer && dealer.creditLimit > 0) {
        const newBalance = dealer.cariBalance + order.total;
        if (newBalance > dealer.creditLimit) {
          const asim = newBalance - dealer.creditLimit;
          throw new BadRequestException(
            `Kredi limiti aşıldı! ${dealer.company} — Mevcut bakiye: ${this.formatTL(dealer.cariBalance)}, Limit: ${this.formatTL(dealer.creditLimit)}, Sipariş: ${this.formatTL(order.total)}, Aşım: ${this.formatTL(asim)}`,
          );
        }
      }
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
    const cust = await this.prisma.user.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } });
    if (cust) this.mailerService.sendOrderApproved(cust.email, cust.name, order.orderNo).catch(() => {});

    // Dealer istatistiklerini güncelle
    if (order.dealerId) {
      await this.prisma.dealer.update({
        where: { id: order.dealerId },
        data: {
          totalOrders: { increment: 1 },
          totalRevenue: { increment: order.total },
          cariBalance: { increment: order.total },
          lastOrderAt: new Date(),
        },
      });
    }

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
      select: { productId: true, quantity: true },
    });
    await this.prisma.stockReservation.updateMany({
      where: { orderId },
      data: { status: 'RELEASED' },
    });
    for (const r of reservations) {
      await this.recalcDisplayStock(r.productId);
      await this.logStockMovement(r.productId, 'ORDER_CANCEL', r.quantity, 'Order', orderId, rejectingUserId, `Ret: ${reason}`);
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
   * Undo approval — revert APPROVED back to PENDING_APPROVAL
   */
  async unapproveOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.status !== 'APPROVED') {
      throw new BadRequestException(`Sadece APPROVED durumundaki siparişler geri alınabilir. Mevcut: ${order.status}`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PENDING_APPROVAL', approvedAt: null, approvedBy: null },
    });

    this.logger.log(`Order ${orderId} approval undone by ${userId}`);
    await this.logStatusChange(orderId, 'PENDING_APPROVAL', 'Onay geri alındı', userId, undefined);
    return updated;
  }

  /**
   * Mark order as shipped
   * Release stock reservations when Netsis syncs "shipped" status
   */
  async completeOrder(orderId: string, trackingNumber?: string, cargoCompany?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Release all active stock reservations (become fulfilled)
    const reservations = await this.prisma.stockReservation.findMany({
      where: { orderId, status: 'ACTIVE' },
      select: { productId: true, quantity: true },
    });
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'FULFILLED' },
    });
    for (const r of reservations) {
      await this.recalcDisplayStock(r.productId);
      await this.logStockMovement(r.productId, 'ORDER_FULFILL', r.quantity, 'Order', orderId, undefined, `Sevk: ${order.orderNo}`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        trackingNumber: trackingNumber || undefined,
        cargoCompany: cargoCompany || undefined,
      },
    });

    const trackInfo = trackingNumber ? ` (${cargoCompany || 'Kargo'}: ${trackingNumber})` : '';
    this.logger.log(`Order ${orderId} shipped${trackInfo}, stock reservations fulfilled`);
    await this.logStatusChange(orderId, 'SHIPPED', trackingNumber ? `${cargoCompany}: ${trackingNumber}` : undefined, undefined, undefined);
    const cust2 = await this.prisma.user.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } });
    if (cust2) this.mailerService.sendOrderShipped(cust2.email, cust2.name, order.orderNo, trackingNumber, cargoCompany).catch(() => {});
    return updated;
  }

  /**
   * Mark order as COMPLETED (delivery confirmed)
   */
  async markCompleted(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== 'SHIPPED') {
      throw new BadRequestException('Sadece SHIPPED durumundaki siparişler tamamlanabilir');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    this.logger.log(`Order ${orderId} completed`);
    await this.logStatusChange(orderId, 'COMPLETED', undefined, undefined, undefined);
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
      select: { productId: true, quantity: true },
    });
    await this.prisma.stockReservation.updateMany({
      where: { orderId, status: 'ACTIVE' },
      data: { status: 'RELEASED' },
    });
    for (const r of reservations) {
      await this.recalcDisplayStock(r.productId);
      await this.logStockMovement(r.productId, 'ORDER_CANCEL', r.quantity, 'Order', orderId, undefined, `İptal: ${reason}`);
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
    const cust3 = await this.prisma.user.findUnique({ where: { id: order.customerId }, select: { email: true, name: true } });
    if (cust3) this.mailerService.sendOrderCancelled(cust3.email, cust3.name, order.orderNo, reason).catch(() => {});
    return updated;
  }

  /**
   * Mock payment — always succeeds, no real API call
   */
  async submitBankTransfer(orderId: string, body: { bank: string; amount: number; senderName: string; note?: string }, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const bt = await this.prisma.bankTransfer.create({
      data: { orderId, bank: body.bank, amount: body.amount, senderName: body.senderName, note: body.note, userId, status: 'PENDING' },
    });
    this.logger.log(`Bank transfer submitted for order ${orderId} by ${userId}`);
    return bt;
  }

  async listBankTransfers(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.bankTransfer.findMany({
      where,
      include: { order: { select: { orderNo: true, total: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveBankTransfer(orderId: string, adminId: string) {
    const bt = await this.prisma.bankTransfer.findFirst({ where: { orderId, status: 'PENDING' } });
    if (!bt) throw new NotFoundException('Bekleyen havale bildirimi bulunamadı');
    await this.prisma.bankTransfer.update({ where: { id: bt.id }, data: { status: 'APPROVED', approvedBy: adminId, approvedAt: new Date() } });
    await this.prisma.order.update({ where: { id: orderId }, data: { paymentStatus: 'PAID' } });
    return { success: true };
  }

  async rejectBankTransfer(orderId: string, reason: string, adminId: string) {
    const bt = await this.prisma.bankTransfer.findFirst({ where: { orderId, status: 'PENDING' } });
    if (!bt) throw new NotFoundException('Bekleyen havale bildirimi bulunamadı');
    return this.prisma.bankTransfer.update({ where: { id: bt.id }, data: { status: 'REJECTED', approvedBy: adminId, rejectionReason: reason } });
  }

  // Demo test kartı — sunum için, gerçek POS gelince kalkacak
  private readonly DEMO_CARD = {
    number: '4111111111111111',
    expiry: '12/28',
    cvv: '123',
    holder: 'Test Kart',
  };

  /** Herhangi bir kart numarasını temel formatta kabul et (13-19 hane) */
  private isValidCardNumber(cardNumber?: string): boolean {
    const clean = (cardNumber || '').replace(/\s/g, '');
    return /^\d{13,19}$/.test(clean);
  }

  /** Sadece demo kartın B2B otomatik onay ayrıcalığı için tam eşleşme */
  private isDemoCard(cardNumber?: string): boolean {
    const clean = (cardNumber || '').replace(/\s/g, '');
    return clean === this.DEMO_CARD.number;
  }

  async payOrder(
    orderId: string,
    userId: string,
    cardDetails?: { cardNumber?: string; expiry?: string; cvv?: string; cardHolder?: string },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    if (order.customerId !== userId) throw new BadRequestException('Bu sipariş size ait değil');

    if (!cardDetails?.cardNumber || !this.isValidCardNumber(cardDetails.cardNumber)) {
      throw new BadRequestException('Geçersiz kart numarası');
    }

    const isDemo = this.isDemoCard(cardDetails.cardNumber);

    // Demo kartla ödeme → B2B siparişler de otomatik onaylanır
    const newStatus = order.customerType === 'B2C' || isDemo
      ? 'APPROVED'
      : order.status;

    // Kredi limiti kontrolü — demo kart ile B2B auto-approval
    if (isDemo && newStatus === 'APPROVED' && order.customerType === 'B2B' && order.dealerId) {
      const dealer = await this.prisma.dealer.findUnique({
        where: { id: order.dealerId },
        select: { creditLimit: true, cariBalance: true, company: true },
      });
      if (dealer && dealer.creditLimit > 0) {
        const newBalance = dealer.cariBalance + order.total;
        if (newBalance > dealer.creditLimit) {
          const asim = newBalance - dealer.creditLimit;
          throw new BadRequestException(
            `Kredi limiti aşıldı! ${dealer.company} — Mevcut bakiye: ${this.formatTL(dealer.cariBalance)}, Limit: ${this.formatTL(dealer.creditLimit)}, Sipariş: ${this.formatTL(order.total)}, Aşım: ${this.formatTL(asim)}`,
          );
        }
      }
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        status: newStatus,
        approvedAt: newStatus === 'APPROVED' ? new Date() : order.approvedAt,
      },
      include: { lines: { include: { product: true } } },
    });

    // B2B onaylandıysa bayi cari bakiyesini ve istatistiklerini güncelle
    if (isDemo && order.customerType === 'B2B' && order.dealerId) {
      await this.prisma.dealer.update({
        where: { id: order.dealerId },
        data: {
          cariBalance: { increment: order.total },
          totalOrders: { increment: 1 },
          totalRevenue: { increment: order.total },
          lastOrderAt: new Date(),
        },
      });
    }

    // Status history
    if (newStatus !== order.status) {
      await this.logStatusChange(orderId, newStatus, undefined, userId, undefined);
    }

    this.logger.log(`Order ${orderId} payment ${isDemo ? '(demo card)' : '(mock)'}: PAID → ${newStatus}`);
    return {
      ...updated,
      paymentMessage: isDemo
        ? `✅ Demo kart ile ödeme alındı! Sipariş ${newStatus === 'APPROVED' ? 'otomatik onaylandı' : 'güncellendi'}.`
        : 'Ödeme alındı.',
      cardLast4: isDemo ? '1111' : (cardDetails.cardNumber || '').slice(-4),
      autoApproved: isDemo,
    };
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
          dealer: { select: { company: true, cariNo: true, contactPerson: true, city: true } },
          customer: { select: { name: true, email: true } },
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

  async updateStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    });
    await this.logStatusChange(orderId, status, undefined, undefined, undefined);
    return updated;
  }

  async addNote(orderId: string, note: string, userId: string, userEmail: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Sipariş bulunamadı');

    const existingNotes = (order as any).adminNotes || [];
    const newNote = { note, userId, userEmail, createdAt: new Date().toISOString() };
    await this.prisma.order.update({
      where: { id: orderId },
      data: { adminNotes: [...existingNotes, newNote] } as any,
    });
    return newNote;
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
      await this.logStockMovement(r.productId, 'RETURN_RESTOCK', r.quantity, 'Return', orderId, adminId, `İade onay: ${order.orderNo}`);
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

  private async logStockMovement(
    productId: string,
    type: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
    userId?: string,
    note?: string,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) return;
    const oldStock = product.netsisStock;
    // netsisStock only changes for RETURN_RESTOCK (physical return to inventory).
    // ORDER_RESERVE / ORDER_FULFILL / ORDER_CANCEL only affect reservations,
    // not the physical netsisStock which is synced from Netsis ERP.
    const newStock =
      type === 'RETURN_RESTOCK' ? oldStock + quantity
      : oldStock;

    await this.prisma.stockMovement.create({
      data: { productId, type: type as any, quantity, oldStock, newStock, userId, referenceType, referenceId, note },
    }).catch(err => this.logger.error(`StockMovement log failed: ${err.message}`));
  }

  private formatTL(value: number): string {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(value);
  }
}
