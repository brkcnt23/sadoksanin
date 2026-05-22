import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MailerService } from '../mailer/mailer.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, MailerService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
