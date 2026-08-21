import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaService } from '../../common/prisma.service';

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface MailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: MailAttachment[];
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter?: Transporter;
  private transporterKurulmadi = false;

  constructor(private prisma: PrismaService) {}

  /**
   * SMTP taşıyıcısı — ilk kullanımda kurulur.
   *
   * SMTP_HOST tanımlı değilse `undefined` döner ve `send()` eski davranışına
   * (yalnızca log) düşer. Böylece kimlik bilgileri gelmeden de sistem çalışır
   * ve e-posta gönderemediği için hiçbir akış kırılmaz.
   */
  private getTransporter(): Transporter | undefined {
    if (this.transporter || this.transporterKurulmadi) return this.transporter;

    const host = process.env.SMTP_HOST;
    if (!host) {
      this.transporterKurulmadi = true;
      this.logger.warn('SMTP_HOST tanımlı değil — e-postalar yalnızca loglanıyor, gönderilmiyor.');
      return undefined;
    }

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    this.transporter = nodemailer.createTransport({
      host,
      port,
      // 465 = örtük TLS. 587 STARTTLS ile yükseltir, secure=false olmalı.
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    this.logger.log(`SMTP hazır: ${host}:${port}`);
    return this.transporter;
  }

  /**
   * E-posta gönder.
   *
   * SMTP yapılandırılmışsa gerçekten gönderir; değilse yalnızca loglar ve
   * `false` döner. Her iki durumda da AuditLog'a kayıt düşer.
   * Gönderim hatası ÇAĞIRANI KIRMAZ — sipariş/proforma akışları e-posta
   * gitmedi diye durmamalı.
   */
  async send(opts: MailOptions): Promise<boolean> {
    const transporter = this.getTransporter();
    let gonderildi = false;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: opts.to,
          subject: opts.subject,
          text: opts.body,
          html: opts.html,
          attachments: opts.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
          })),
        });
        gonderildi = true;
        this.logger.log(`📧 Gönderildi → ${opts.to} — ${opts.subject}`);
      } catch (err: any) {
        this.logger.error(`E-posta gönderilemedi (${opts.to}): ${err.message}`);
      }
    } else {
      this.logger.log(`📧 EMAIL (gönderilmedi, SMTP yok) → ${opts.to}`);
      this.logger.log(`   Subject: ${opts.subject}`);
      this.logger.log(`   Body: ${opts.body.substring(0, 200)}${opts.body.length > 200 ? '...' : ''}`);
      if (opts.attachments?.length) {
        for (const a of opts.attachments) {
          this.logger.log(`   📎 Ek: ${a.filename} (${(a.content.length / 1024).toFixed(1)} KB)`);
        }
      }
    }

    // Log to DB for audit
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "AuditLog" (id, email, action, entity, "entityId", "newValue", "createdAt")
         VALUES (gen_random_uuid(), $1, 'email.send', 'Email', 'email', $2, NOW())`,
        opts.to,
        JSON.stringify({ subject: opts.subject, to: opts.to }),
      );
    } catch {
      // Don't fail if AuditLog insert fails
    }

    return gonderildi;
  }

  /**
   * Send cart reminder email to a user who left items in their cart.
   */
  async sendCartReminder(email: string, name: string, itemCount: number, cartTotal: number): Promise<boolean> {
    const subject = 'Sepetinizdeki ürünler sizi bekliyor';
    const body = `Merhaba ${name},

Sepetinizde ${itemCount} ürün (toplam ${cartTotal.toFixed(2)} TL) bulunuyor.
Siparişinizi tamamlamak için sitemizi ziyaret edin.

Saygılarımızla,
Sadöksan İnşaat`;

    return this.send({ to: email, subject, body });
  }

  /**
   * Send a generic notification email.
   */
  async sendNotification(to: string, subject: string, message: string): Promise<boolean> {
    return this.send({
      to,
      subject,
      body: message,
      html: `<div style="font-family:sans-serif;padding:20px"><p>${message}</p><p>Saygılarımızla,<br>Sadöksan İnşaat</p></div>`,
    });
  }

  // ─── Order Status Notifications ──────────────────────────────────────

  async sendOrderCreated(email: string, name: string, orderNo: string, total: number) {
    const subject = `Siparişiniz Alındı — ${orderNo}`;
    const body = `Merhaba ${name},\n\nSiparişiniz başarıyla oluşturuldu.\nSipariş No: ${orderNo}\nTutar: ${total.toFixed(2)} TL\n\nSiparişiniz incelendikten sonra onaylanacaktır.\n\nSaygılarımızla,\nSadöksan İnşaat`;
    return this.send({ to: email, subject, body });
  }

  async sendOrderApproved(email: string, name: string, orderNo: string) {
    const subject = `Siparişiniz Onaylandı — ${orderNo}`;
    const body = `Merhaba ${name},\n\n${orderNo} numaralı siparişiniz onaylanmıştır.\nSiparişiniz hazırlanıp kargoya verilecektir.\n\nSaygılarımızla,\nSadöksan İnşaat`;
    return this.send({ to: email, subject, body });
  }

  async sendOrderShipped(email: string, name: string, orderNo: string, trackingNo?: string, cargoCompany?: string) {
    const subject = `Siparişiniz Kargoya Verildi — ${orderNo}`;
    const trackInfo = trackingNo ? `\nKargo Takip No: ${trackingNo}${cargoCompany ? ` (${cargoCompany})` : ''}` : '';
    const body = `Merhaba ${name},\n\n${orderNo} numaralı siparişiniz kargoya verilmiştir.${trackInfo}\n\nSaygılarımızla,\nSadöksan İnşaat`;
    return this.send({ to: email, subject, body });
  }

  async sendOrderCancelled(email: string, name: string, orderNo: string, reason?: string) {
    const subject = `Sipariş İptali — ${orderNo}`;
    const body = `Merhaba ${name},\n\n${orderNo} numaralı siparişiniz iptal edilmiştir.${reason ? `\nSebep: ${reason}` : ''}\n\nSaygılarımızla,\nSadöksan İnşaat`;
    return this.send({ to: email, subject, body });
  }

  async sendDealerApproved(email: string, companyName: string) {
    const subject = 'Bayi Başvurunuz Onaylandı';
    const body = `Merhaba ${companyName} yetkilisi,\n\nBayi başvurunuz onaylanmıştır. Hesabınıza giriş yaparak sipariş vermeye başlayabilirsiniz.\n\nSaygılarımızla,\nSadöksan İnşaat`;
    return this.send({ to: email, subject, body });
  }

  /**
   * Find users with abandoned carts (carts modified > N hours ago, no recent orders).
   * Returns list of users who might need a reminder.
   *
   * NOTE: Cart data is currently client-side (localStorage).
   * This method uses a heuristic based on last login / profile update time
   * vs most recent order. Replace with server-side cart tracking when available.
   */
  async findAbandonedCarts(hoursAgo: number = 24): Promise<{ email: string; name: string; hoursSinceActivity: number }[]> {
    const cutoff = new Date(Date.now() - hoursAgo * 3600_000);

    // Find users who had recent activity (logged in) but no orders recently
    // This is a heuristic - real implementation needs server-side cart tracking
    const users = await this.prisma.$queryRawUnsafe<{ email: string; name: string; last_order: string | null }[]>(
      `SELECT u.email, u.name, MAX(o."createdAt") as last_order
       FROM "User" u
       LEFT JOIN "Order" o ON o."customerId" = u.id
       WHERE u.role = 'DEALER'
       GROUP BY u.id
       HAVING MAX(o."createdAt") IS NULL OR MAX(o."createdAt") < $1
       LIMIT 50`,
      cutoff,
    );

    return users.map((u) => ({
      email: u.email,
      name: u.name,
      hoursSinceActivity: u.last_order
        ? Math.round((Date.now() - new Date(u.last_order).getTime()) / 3600_000)
        : 999,
    }));
  }
}
