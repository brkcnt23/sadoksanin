import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { PrismaService } from '../../common/prisma.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [MailerModule],
  controllers: [ContactController],
  providers: [PrismaService],
})
export class ContactModule {}
