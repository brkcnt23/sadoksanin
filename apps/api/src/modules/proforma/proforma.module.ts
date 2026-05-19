import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProformaController } from './proforma.controller';
import { ProformaService } from './proforma.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [ProformaController],
  providers: [ProformaService, PrismaService],
  exports: [ProformaService],
})
export class ProformaModule {}
