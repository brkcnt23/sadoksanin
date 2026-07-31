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
   * Tüm aktif indirimleri TEK sorguda çeker. Ürün listelerinde (5000+ ürün)
   * her ürün için ayrı sorgu atmak yerine bunu bir kez çağırıp
   * computeDiscountedPrice() ile bellek içinde hesapla — bkz.
   * ProductsService.listProducts/getAllProducts (2026-07-30: bu ikisi eski
   * per-ürün sorgu yüzünden 5414 üründe API'yi çökertiyordu, N+1 hatası).
   */
  async getActiveDiscounts() {
    const now = new Date();
    return this.prisma.discount.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
    });
  }

  /**
   * Önceden çekilmiş aktif indirim listesiyle (bkz. getActiveDiscounts)
   * bir ürünün indirimli fiyatını SORGUSUZ, bellek içinde hesaplar.
   * Öncelik: ürün > kategori > marka (ilk eşleşen kazanır).
   */
  computeDiscountedPrice(
    product: { id: string; basePrice: number; category: string; brand: string },
    activeDiscounts: Array<{ type: string; targetId: string; targetName: string; value: number; discountType: string }>,
  ): { price: number; discount: { type: string; targetName: string; value: number; discountType: string } | null } {
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

  /**
   * Tek ürün için indirimli fiyat (geriye dönük uyumluluk — getProduct gibi
   * tek-ürün çağrılarında hâlâ kullanılır, 2 sorgu maliyeti kabul edilebilir.
   * Listelerde ASLA kullanma, getActiveDiscounts+computeDiscountedPrice kullan).
   */
  async getDiscountedPrice(product: {
    id: string;
    basePrice: number;
    category: string;
    brand: string;
  }): Promise<{ price: number; discount: { type: string; targetName: string; value: number; discountType: string } | null }> {
    const activeDiscounts = await this.getActiveDiscounts();
    return this.computeDiscountedPrice(product, activeDiscounts);
  }

  private applyDiscount(basePrice: number, discount: { discountType: string; value: number }): number {
    if (discount.discountType === 'PERCENTAGE') {
      return Math.round(basePrice * (1 - discount.value / 100) * 100) / 100;
    }
    return Math.max(0, basePrice - discount.value);
  }
}
