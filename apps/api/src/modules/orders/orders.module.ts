import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CommonModule } from '../../common/common.module';
import { PromoModule } from '../promo/promo.module';
import { ProformaModule } from '../proforma/proforma.module';

@Module({
  imports: [CommonModule, PromoModule, ProformaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
