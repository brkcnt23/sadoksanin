import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * İletişim formu (storefront /iletisim sayfası).
 *
 * Eskiden bu form hiçbir yere gitmiyordu: sayfadaki API çağrısı yorum
 * satırındaydı ve setTimeout ile sahte "başarılı" gösteriliyordu — müşteri
 * mesaj gönderdiğini sanıyor, mesaj sessizce kayboluyordu.
 *
 * Mesaj kaybolmasın diye iki yere birden yazılır:
 *   1) AuditLog (kalıcı kayıt — panel > Denetim Kaydı'ndan görülebilir)
 *   2) ADMIN/SUPER_ADMIN kullanıcılarına e-posta bildirimi
 * (MailerService şu an SMTP'siz çalışıyor, console+AuditLog'a yazıyor; SMTP
 *  yapılandırılınca bu kod değişmeden gerçek e-posta gönderimine geçer.)
 */
@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  @Public()
  @Post()
  async submit(
    @Body() body: { name?: string; email?: string; phone?: string; subject?: string; message?: string },
  ) {
    const name = (body?.name || '').trim();
    const email = (body?.email || '').trim();
    const message = (body?.message || '').trim();

    if (!name || !email || !message) {
      throw new BadRequestException('Ad, e-posta ve mesaj alanları zorunludur');
    }
    if (message.length > 5000) {
      throw new BadRequestException('Mesaj çok uzun (en fazla 5000 karakter)');
    }

    const payload = {
      name,
      email,
      phone: (body?.phone || '').trim() || null,
      subject: (body?.subject || '').trim() || 'İletişim Formu',
      message,
    };

    // 1) Kalıcı kayıt
    try {
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "AuditLog" (id, email, action, entity, "entityId", "newValue", "createdAt")
         VALUES (gen_random_uuid(), $1, 'contact.message', 'Contact', 'contact', $2, NOW())`,
        email,
        JSON.stringify(payload),
      );
    } catch (err) {
      // Kayıt başarısız olsa bile mesajı kaybetmemek için logla
      this.logger.error(`İletişim mesajı AuditLog'a yazılamadı: ${(err as Error).message}`);
      this.logger.log(`İLETİŞİM MESAJI: ${JSON.stringify(payload)}`);
    }

    // 2) Yöneticilere bildirim (best-effort)
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { email: true },
      });
      const text =
        `Yeni iletişim formu mesajı\n\n` +
        `Ad: ${payload.name}\n` +
        `E-posta: ${payload.email}\n` +
        `Telefon: ${payload.phone || '-'}\n` +
        `Konu: ${payload.subject}\n\n` +
        `${payload.message}`;
      for (const a of admins) {
        this.mailerService
          .sendNotification(a.email, `İletişim Formu — ${payload.subject}`, text)
          .catch(() => {});
      }
    } catch {
      /* bildirim gönderilemese de form başarılı sayılır */
    }

    this.logger.log(`İletişim mesajı alındı: ${email}`);
    return { success: true };
  }
}
