import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private prisma: PrismaService) {}

  // ── Regional Surcharges ──

  async listRegional() {
    return this.prisma.regionalPricingSurcharge.findMany({ orderBy: { regionKey: 'asc' } });
  }

  async upsertRegional(data: {
    regionKey: string;
    surcharge: number;
    description?: string;
    active?: boolean;
  }) {
    return this.prisma.regionalPricingSurcharge.upsert({
      where: { regionKey: data.regionKey },
      create: { regionKey: data.regionKey, surcharge: data.surcharge, description: data.description ?? '', active: data.active },
      update: { surcharge: data.surcharge, description: data.description, active: data.active },
    });
  }

  async deleteRegional(regionKey: string) {
    return this.prisma.regionalPricingSurcharge.delete({ where: { regionKey } });
  }

  // ── Province Surcharges ──

  async listProvince() {
    return this.prisma.provincePricingSurcharge.findMany({ orderBy: { province: 'asc' } });
  }

  async upsertProvince(data: {
    province: string;
    surcharge: number;
    description?: string;
    active?: boolean;
  }) {
    return this.prisma.provincePricingSurcharge.upsert({
      where: { province: data.province },
      create: { province: data.province, surcharge: data.surcharge, description: data.description ?? '', active: data.active },
      update: { surcharge: data.surcharge, description: data.description, active: data.active },
    });
  }

  async deleteProvince(province: string) {
    return this.prisma.provincePricingSurcharge.delete({ where: { province } });
  }

  // ── Logistics Rules ──

  async listLogisticsRules() {
    return this.prisma.logisticsRule.findMany({ orderBy: { region: 'asc' } });
  }

  async upsertLogisticsRule(data: {
    region: string;
    cities?: string[];
    baseSurcharge?: number;
    perKgSurcharge?: number;
    perM2Surcharge?: number;
    freeShippingThreshold?: number;
    active?: boolean;
  }) {
    return this.prisma.logisticsRule.upsert({
      where: { id: data.region },
      create: {
        region: data.region,
        cities: data.cities ?? [],
        baseSurcharge: data.baseSurcharge ?? 0,
        perKgSurcharge: data.perKgSurcharge ?? 0,
        perM2Surcharge: data.perM2Surcharge ?? 0,
        freeShippingThreshold: data.freeShippingThreshold,
        active: data.active ?? true,
      },
      update: {
        cities: data.cities,
        baseSurcharge: data.baseSurcharge,
        perKgSurcharge: data.perKgSurcharge,
        perM2Surcharge: data.perM2Surcharge,
        freeShippingThreshold: data.freeShippingThreshold,
        active: data.active,
      },
    });
  }

  async deleteLogisticsRule(id: string) {
    return this.prisma.logisticsRule.delete({ where: { id } });
  }
}
