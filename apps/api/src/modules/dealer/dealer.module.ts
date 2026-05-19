import { Module } from '@nestjs/common';
import { DealerController } from './dealer.controller';
import { DealerService } from './dealer.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [DealerController],
  providers: [DealerService, PrismaService],
  exports: [DealerService],
})
export class DealerModule {}
