import { Module } from '@nestjs/common';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [MailerController],
  providers: [MailerService, PrismaService],
  exports: [MailerService],
})
export class MailerModule {}
