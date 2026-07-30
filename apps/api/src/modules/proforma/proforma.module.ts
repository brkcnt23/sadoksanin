import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProformaController } from './proforma.controller';
import { ProformaService } from './proforma.service';
import { PrismaService } from '../../common/prisma.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [HttpModule, MailerModule],
  controllers: [ProformaController],
  providers: [ProformaService, PrismaService],
  exports: [ProformaService],
})
export class ProformaModule {}
