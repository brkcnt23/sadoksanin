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
    alneoApiUrl?: string;
    alneoApiKey?: string;
    albarakaApiUrl?: string;
    albarakaMerchantId?: string;
    netsisApiUrl?: string;
    netsisUsername?: string;
    introEnabled?: boolean;
  }) {
    return this.prisma.siteSettings.update({
      where: { id: 'main' },
      data,
    });
  }

  // ─── Pages ───────────────────────────────────────────────────────────────

  async getPages() {
    return this.prisma.cmsPage.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  async getPageBySlug(slug: string) {
    return this.prisma.cmsPage.findUnique({ where: { slug } });
  }

  async createPage(data: { title: string; slug: string; content?: string; seoTitle?: string; seoMeta?: string }) {
    return this.prisma.cmsPage.create({
      data: { ...data, content: data.content || '' },
    });
  }

  async updatePage(id: string, data: { title?: string; slug?: string; content?: string; isActive?: boolean; seoTitle?: string; seoMeta?: string }) {
    return this.prisma.cmsPage.update({ where: { id }, data });
  }

  async deletePage(id: string) {
    return this.prisma.cmsPage.delete({ where: { id } });
  }

  // ─── SEO Redirects ──────────────────────────────────────────────────────

  async getRedirects() {
    return this.prisma.seoRedirect.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createRedirect(data: { oldUrl: string; newUrl: string }) {
    const existing = await this.prisma.seoRedirect.findUnique({ where: { oldUrl: data.oldUrl } });
    if (existing) {
      return this.prisma.seoRedirect.update({ where: { id: existing.id }, data: { newUrl: data.newUrl, isActive: true } });
    }
    return this.prisma.seoRedirect.create({ data });
  }

  async deleteRedirect(id: string) {
    return this.prisma.seoRedirect.delete({ where: { id } });
  }

  async importRedirects(items: { oldUrl: string; newUrl: string }[]) {
    let created = 0; let updated = 0;
    for (const item of items) {
      if (!item.oldUrl || !item.newUrl) continue;
      const existing = await this.prisma.seoRedirect.findUnique({ where: { oldUrl: item.oldUrl } });
      if (existing) { await this.prisma.seoRedirect.update({ where: { id: existing.id }, data: { newUrl: item.newUrl } }); updated++; }
      else { await this.prisma.seoRedirect.create({ data: item }); created++; }
    }
    return { created, updated };
  }

  async findRedirect(oldUrl: string) {
    return this.prisma.seoRedirect.findUnique({ where: { oldUrl } });
  }
}
