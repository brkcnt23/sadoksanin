import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate logistics surcharge for a given city.
   * Finds the region containing the city and applies the pricing rule.
   */
  async calculateLogistics(
    city: string,
    itemCount: number,
    estimatedWeightKg?: number,
  ): Promise<{
    baseSurcharge: number;
    perKgSurcharge: number;
    totalSurcharge: number;
    region: string | null;
    freeShippingThreshold: number | null;
  }> {
    const rules = await this.prisma.logisticsRule.findMany({
      where: { active: true },
    });

    let matchedRule: any = null;

    for (const rule of rules) {
      if (rule.cities.some((c: string) => c.toLowerCase() === city.toLowerCase())) {
        matchedRule = rule;
        break;
      }
    }

    if (!matchedRule) {
      this.logger.warn(`No logistics rule found for city: ${city}`);
      return {
        baseSurcharge: 0,
        perKgSurcharge: 0,
        totalSurcharge: 0,
        region: null,
        freeShippingThreshold: null,
      };
    }

    const weight = estimatedWeightKg || itemCount * 10; // assume 10kg per item if not specified
    const totalSurcharge = matchedRule.baseSurcharge + weight * matchedRule.perKgSurcharge;

    return {
      baseSurcharge: matchedRule.baseSurcharge,
      perKgSurcharge: matchedRule.perKgSurcharge,
      totalSurcharge: Math.round(totalSurcharge * 100) / 100,
      region: matchedRule.region,
      freeShippingThreshold: matchedRule.freeShippingThreshold,
    };
  }
}
