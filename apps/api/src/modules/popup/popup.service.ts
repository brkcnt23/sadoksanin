import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PopupService {
  private readonly logger = new Logger(PopupService.name);

  constructor(private prisma: PrismaService) {}

  async listAll() {
    return this.prisma.popup.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getActive(userId?: string, userRole?: string, dealerId?: string) {
    const now = new Date();

    const allActive = await this.prisma.popup.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by audience client-side (Prisma can't filter array fields easily)
    return allActive.filter((popup) => {
      if (popup.audience === 'ALL') return true;
      if (popup.audience === 'B2C' && userRole === 'DEALER') return true;
      if (popup.audience === 'B2B' && userRole === 'DEALER') return true;
      if (
        popup.audience === 'SPECIFIC_DEALER' &&
        dealerId &&
        popup.dealerIds.includes(dealerId)
      )
        return true;
      return false;
    });
  }

  async getById(id: string) {
    const popup = await this.prisma.popup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException('Popup bulunamadı');
    return popup;
  }

  async create(data: {
    title: string;
    bodyHtml?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
    audience?: 'ALL' | 'B2C' | 'B2B' | 'SPECIFIC_DEALER';
    dealerIds?: string[];
    isActive?: boolean;
    showOnce?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    return this.prisma.popup.create({
      data: {
        title: data.title,
        bodyHtml: data.bodyHtml,
        imageUrl: data.imageUrl,
        ctaText: data.ctaText,
        ctaUrl: data.ctaUrl,
        audience: data.audience ?? 'ALL',
        dealerIds: data.dealerIds ?? [],
        isActive: data.isActive ?? false,
        showOnce: data.showOnce ?? true,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    bodyHtml?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
    audience?: 'ALL' | 'B2C' | 'B2B' | 'SPECIFIC_DEALER';
    dealerIds?: string[];
    isActive?: boolean;
    showOnce?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const popup = await this.prisma.popup.findUnique({ where: { id } });
    if (!popup) throw new NotFoundException('Popup bulunamadı');

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return this.prisma.popup.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    await this.getById(id);
    return this.prisma.popup.delete({ where: { id } });
  }

  async trackImpression(id: string) {
    return this.prisma.popup.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });
  }

  async trackClick(id: string) {
    return this.prisma.popup.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });
  }
}
