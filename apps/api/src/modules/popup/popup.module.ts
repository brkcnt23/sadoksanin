import { Module } from '@nestjs/common';
import { PopupController } from './popup.controller';
import { PopupService } from './popup.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [PopupController],
  providers: [PopupService, PrismaService],
  exports: [PopupService],
})
export class PopupModule {}
