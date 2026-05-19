import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PromoService {
  private readonly logger = new Logger(PromoService.name);

  constructor(private prisma: PrismaService) {}

  async validatePromoCode(
    code: string,
    orderTotal: number,
    isDealer: boolean,
  ): Promise<{
    valid: boolean;
    discountType?: string;
    discountValue?: number;
    discountAmount: number;
    finalTotal: number;
    message?: string;
  }> {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promo) {
      return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: 'Kod bulunamadı' };
    }

    if (!promo.isActive) {
      return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: 'Bu kod artık geçerli değil' };
    }

    const now = new Date();
    if (promo.validFrom > now) {
      return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: 'Bu kod henüz aktif değil' };
    }

    if (promo.validUntil && promo.validUntil < now) {
      return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: 'Bu kodun süresi dolmuş' };
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: 'Bu kodun kullanım limiti dolmuş' };
    }

    if (promo.dealerOnly && !isDealer) {
      return { valid: false, discountAmount: 0, finalTotal: orderTotal, message: 'Bu kod sadece bayiler için geçerlidir' };
    }

    if (promo.minOrderAmount && orderTotal < Number(promo.minOrderAmount)) {
      return {
        valid: false,
        discountAmount: 0,
        finalTotal: orderTotal,
        message: `Bu kod için minimum sipariş tutarı ${promo.minOrderAmount} TL'dir`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = (orderTotal * Number(promo.discountValue)) / 100;
    } else {
      discountAmount = Number(promo.discountValue);
    }

    // Don't let discount exceed order total
    discountAmount = Math.min(discountAmount, orderTotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount,
      finalTotal: Math.round((orderTotal - discountAmount) * 100) / 100,
    };
  }
}
