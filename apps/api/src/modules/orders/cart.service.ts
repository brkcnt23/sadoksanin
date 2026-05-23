import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { addedAt: 'asc' },
    });
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new BadRequestException('Ürün bulunamadı');

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: { userId, productId, quantity },
      include: { product: true },
    });
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) return this.removeItem(userId, productId);

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) throw new BadRequestException('Ürün sepette bulunamadı');

    return this.prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, productId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!item) throw new BadRequestException('Ürün sepette bulunamadı');
    return this.prisma.cartItem.delete({ where: { id: item.id } });
  }

  async clearCart(userId: string) {
    return this.prisma.cartItem.deleteMany({ where: { userId } });
  }

  async mergeCart(userId: string, items: { productId: string; quantity: number }[]) {
    let added = 0;
    for (const item of items) {
      try {
        await this.addItem(userId, item.productId, item.quantity);
        added++;
      } catch { /* skip invalid products */ }
    }
    this.logger.log(`Merged ${added}/${items.length} items for user ${userId}`);
    return this.getCart(userId);
  }
}
