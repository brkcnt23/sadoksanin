import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mailer')
@UseGuards(JwtAuthGuard)
export class MailerController {
  constructor(private mailerService: MailerService) {}

  /**
   * Send a test email (logged to console).
   */
  @Post('send')
  async sendEmail(@Body() body: { to: string; subject: string; body: string }) {
    await this.mailerService.send(body);
    return { success: true, message: 'Email logged (SMTP not configured)' };
  }

  /**
   * Trigger cart reminder emails for users with abandoned carts.
   */
  @Post('cart-reminders')
  async sendCartReminders(@Query('hours') hours: string) {
    const hoursAgo = parseInt(hours || '24', 10);
    const abandoned = await this.mailerService.findAbandonedCarts(hoursAgo);

    let sent = 0;
    for (const user of abandoned) {
      await this.mailerService.sendCartReminder(user.email, user.name, 0, 0);
      sent++;
    }

    return {
      success: true,
      abandonedCarts: abandoned.length,
      remindersSent: sent,
      message: `${sent} hatırlatma maili gönderildi (loglandı).`,
    };
  }
}
