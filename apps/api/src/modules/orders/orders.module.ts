import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CommonModule } from '../../common/common.module';
import { PromoModule } from '../promo/promo.module';
import { ProformaModule } from '../proforma/proforma.module';

@Module({
  imports: [CommonModule, PromoModule, ProformaModule],
  controllers: [OrdersController, CartController],
  providers: [OrdersService, CartService],
  exports: [OrdersService, CartService],
})
export class OrdersModule {}
