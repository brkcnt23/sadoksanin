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

  async seedProvinces() {
    const provinces = [
      'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir',
      'Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli',
      'Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari',
      'Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir',
      'Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş','Nevşehir',
      'Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat',
      'Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman',
      'Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
    ];
    const items: { province: string; surcharge: number; description: string }[] = [];

    for (const p of provinces) {
      // Base: 150-300 TL randomly
      const surcharge = Math.round((150 + Math.random() * 150) * 100) / 100;
      items.push({ province: p, surcharge, description: `${p} lojistik ek ücreti` });
    }

    // Upsert all
    let added = 0;
    for (const item of items) {
      await this.prisma.provincePricingSurcharge.upsert({
        where: { province: item.province },
        create: item,
        update: { surcharge: item.surcharge },
      });
      added++;
    }

    this.logger.log(`Seeded ${added} province pricing surcharges`);
    return { provinces: added };
  }
}
