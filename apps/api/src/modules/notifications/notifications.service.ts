import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}

  async create(userId: string, productId: string, channel: 'email' | 'whatsapp' = 'email') {
    return this.prisma.notifyRequest.upsert({
      where: { productId_userId_channel: { productId, userId, channel } },
      create: { userId, productId, channel },
      update: { status: 'pending', notifiedAt: null },
    });
  }

  async listAll(params: {
    status?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.productId) where.productId = params.productId;

    const requests = await this.prisma.notifyRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with product/user data via separate queries
    const productIds = [...new Set(requests.map((r) => r.productId))];
    const userIds = [...new Set(requests.map((r) => r.userId))];

    const [products, users] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, displayStock: true, netsisStock: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true, phone: true },
      }),
    ]);

    const productMap = new Map(products.map((p) => [p.id, p]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return requests.map((r) => ({
      ...r,
      product: productMap.get(r.productId) ?? null,
      user: userMap.get(r.userId) ?? null,
    }));
  }

  async listByProduct(productId: string) {
    const requests = await this.prisma.notifyRequest.findMany({
      where: { productId, status: 'pending' },
    });
    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true, phone: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return requests.map((r) => ({ ...r, user: userMap.get(r.userId) ?? null }));
  }

  async sendForProduct(productId: string) {
    const requests = await this.listByProduct(productId);
    if (requests.length === 0) return { sent: 0 };

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    let sent = 0;
    for (const req of requests) {
      try {
        const email = (req as any).user?.email;
        const name = (req as any).user?.name;
        if (email) {
          await this.mailer.sendNotification(
            email,
            `${product.name} tekrar stokta!`,
            `Merhaba ${name},\n\nTakip ettiğiniz ${product.name} ürünü stoklarımıza geri geldi.\n\nMevcut stok: ${product.displayStock}\n\nÜrünü görüntülemek için: /urunler/${product.id}\n\nSadoksan İnşaat`,
          );
        }
        await this.prisma.notifyRequest.update({
          where: { id: req.id },
          data: { status: 'notified', notifiedAt: new Date() },
        });
        sent++;
      } catch (e) {
        this.logger.error(`Notify send failed for ${req.id}: ${(e as any).message}`);
      }
    }

    return { sent, total: requests.length };
  }

  async cancel(id: string) {
    return this.prisma.notifyRequest.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
