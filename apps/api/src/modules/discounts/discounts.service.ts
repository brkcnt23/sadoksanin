import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class DiscountsService {
  private readonly logger = new Logger(DiscountsService.name);

  constructor(private prisma: PrismaService) {}

  async listAll() {
    return this.prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: {
    type: 'PRODUCT' | 'CATEGORY' | 'BRAND';
    targetId: string;
    targetName: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    validUntil?: string;
  }) {
    return this.prisma.discount.create({
      data: {
        type: data.type,
        targetId: data.targetId,
        targetName: data.targetName,
        discountType: data.discountType,
        value: data.value,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });
  }

  async update(id: string, data: {
    isActive?: boolean;
    value?: number;
    validUntil?: string;
  }) {
    const d = await this.prisma.discount.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('İndirim bulunamadı');
    return this.prisma.discount.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.discount.delete({ where: { id } });
  }

  /**
   * Calculate the effective price for a product considering all active discounts.
   * Priority: product-level > category-level > brand-level (first match wins).
   */
  async getDiscountedPrice(product: {
    id: string;
    basePrice: number;
    category: string;
    brand: string;
  }): Promise<{ price: number; discount: { type: string; targetName: string; value: number; discountType: string } | null }> {
    const now = new Date();

    const activeDiscounts = await this.prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
    });

    // Product-level discount (highest priority)
    const productDiscount = activeDiscounts.find(
      (d) => d.type === 'PRODUCT' && d.targetId === product.id,
    );
    if (productDiscount) {
      return {
        price: this.applyDiscount(product.basePrice, productDiscount),
        discount: {
          type: 'PRODUCT',
          targetName: productDiscount.targetName,
          value: productDiscount.value,
          discountType: productDiscount.discountType,
        },
      };
    }

    // Category-level discount
    const catDiscount = activeDiscounts.find(
      (d) => d.type === 'CATEGORY' && d.targetId.toLowerCase() === product.category.toLowerCase(),
    );
    if (catDiscount) {
      return {
        price: this.applyDiscount(product.basePrice, catDiscount),
        discount: {
          type: 'CATEGORY',
          targetName: catDiscount.targetName,
          value: catDiscount.value,
          discountType: catDiscount.discountType,
        },
      };
    }

    // Brand-level discount
    const brandDiscount = activeDiscounts.find(
      (d) => d.type === 'BRAND' && d.targetId.toLowerCase() === product.brand.toLowerCase(),
    );
    if (brandDiscount) {
      return {
        price: this.applyDiscount(product.basePrice, brandDiscount),
        discount: {
          type: 'BRAND',
          targetName: brandDiscount.targetName,
          value: brandDiscount.value,
          discountType: brandDiscount.discountType,
        },
      };
    }

    return { price: product.basePrice, discount: null };
  }

  private applyDiscount(basePrice: number, discount: { discountType: string; value: number }): number {
    if (discount.discountType === 'PERCENTAGE') {
      return Math.round(basePrice * (1 - discount.value / 100) * 100) / 100;
    }
    return Math.max(0, basePrice - discount.value);
  }
}
