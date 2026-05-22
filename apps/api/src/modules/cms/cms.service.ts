import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CmsService {
  private readonly logger = new Logger(CmsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Hero / Banner ────────────────────────────────────────────────────────

  async getHero() {
    let hero = await this.prisma.siteContent.findUnique({ where: { id: 'hero' } });
    if (!hero) {
      hero = await this.prisma.siteContent.create({
        data: { id: 'hero' },
      });
    }
    return hero;
  }

  async updateHero(data: {
    headline?: string;
    subheading?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    stats?: string;
  }) {
    return this.prisma.siteContent.upsert({
      where: { id: 'hero' },
      update: data,
      create: { id: 'hero', ...data },
    });
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings() {
    let s = await this.prisma.siteSettings.findUnique({ where: { id: 'main' } });
    if (!s) {
      s = await this.prisma.siteSettings.create({ data: { id: 'main' } });
    }
    return s;
  }

  async updateSettings(data: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    maintenanceAllowAdmins?: boolean;
    siteName?: string;
    contactEmail?: string;
    whatsappNumber?: string;
    defaultNotificationChannel?: string;
    cartReminderEnabled?: boolean;
    cartReminderIntervalHours?: number;
    netsisSyncInterval?: string;
    alneoTriggerEvent?: string;
  }) {
    return this.prisma.siteSettings.update({
      where: { id: 'main' },
      data,
    });
  }
}
