import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ManualStockEntryDto, ManualStockExitDto, CountAdjustDto } from './dto/create-stock-movement.dto';

@Injectable()
export class StockService {
  private logger = new Logger(StockService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Hareket Listeleme ────────────────────────────────────────────────

  async getMovements(
    productId?: string,
    type?: string,
    startDate?: string,
    endDate?: string,
    limit = 50,
    offset = 0,
  ) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, sku: true, name: true, unit: true } },
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { movements, total };
  }

  // ─── Manuel Giriş ─────────────────────────────────────────────────────

  async manualEntry(dto: ManualStockEntryDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    // Aktif rezervasyonları hesapla
    const reservations = await this.prisma.stockReservation.aggregate({
      where: { productId: dto.productId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });
    const reserved = reservations._sum.quantity || 0;

    const oldStock = product.netsisStock;
    const newStock = oldStock + dto.quantity;
    const displayStock = Math.max(0, newStock - product.netsisPendingQuantity - reserved);

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: 'MANUAL_ENTRY',
          quantity: dto.quantity,
          oldStock,
          newStock,
          userId,
          referenceType: 'Manual',
          note: dto.note,
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { netsisStock: newStock, reservedStock: reserved, displayStock },
      }),
    ]);

    this.logger.log(`Manual entry: +${dto.quantity} → ${product.sku} (${oldStock}→${newStock}) by ${userId}`);
    return movement;
  }

  // ─── Manuel Çıkış ─────────────────────────────────────────────────────

  async manualExit(dto: ManualStockExitDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    // Aktif rezervasyonları hesapla
    const reservations = await this.prisma.stockReservation.aggregate({
      where: { productId: dto.productId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });
    const activeReserved = reservations._sum.quantity || 0;

    // Kullanılabilir stok: netsisStock - netsisPendingQuantity - activeReserved
    const availableStock = product.netsisStock - product.netsisPendingQuantity - activeReserved;

    if (dto.quantity > availableStock) {
      throw new BadRequestException(
        `Kullanılabilir stoktan fazla çıkış yapılamaz. Kullanılabilir: ${availableStock}, istenen: ${dto.quantity}`,
      );
    }

    const oldStock = product.netsisStock;
    const newStock = oldStock - dto.quantity;
    const displayStock = Math.max(0, newStock - product.netsisPendingQuantity - activeReserved);

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: -dto.quantity,
          oldStock,
          newStock,
          userId,
          referenceType: 'Manual',
          note: dto.note,
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { netsisStock: newStock, reservedStock: activeReserved, displayStock },
      }),
    ]);

    this.logger.log(`Manual exit: -${dto.quantity} → ${product.sku} (${oldStock}→${newStock}) by ${userId}`);
    return movement;
  }

  // ─── Sayım Düzeltme ──────────────────────────────────────────────────

  async countAdjust(dto: CountAdjustDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    // Aktif rezervasyonları hesapla
    const reservations = await this.prisma.stockReservation.aggregate({
      where: { productId: dto.productId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });
    const reserved = reservations._sum.quantity || 0;

    const oldStock = product.netsisStock;
    const delta = dto.actualCount - oldStock;

    if (delta === 0) {
      throw new BadRequestException('Sayım sonucu mevcut stokla aynı. Düzeltme gerekmez.');
    }

    const displayStock = Math.max(0, dto.actualCount - product.netsisPendingQuantity - reserved);

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          type: 'COUNT_ADJUST',
          quantity: delta,
          oldStock,
          newStock: dto.actualCount,
          userId,
          referenceType: 'CountAdjust',
          note: dto.note,
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { netsisStock: dto.actualCount, reservedStock: reserved, displayStock },
      }),
    ]);

    this.logger.log(`Count adjust: ${delta > 0 ? '+' : ''}${delta} → ${product.sku} (${oldStock}→${dto.actualCount}) by ${userId}`);
    return movement;
  }
}
