import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { NetsisModule } from './modules/netsis/netsis.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ProformaModule } from './modules/proforma/proforma.module';
import { DealerModule } from './modules/dealer/dealer.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { PromoModule } from './modules/promo/promo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ProformaModule,
    DealerModule,
    LogisticsModule,
    PromoModule,
    CommonModule,
    AuthModule,
    NetsisModule,
    OrdersModule,
    ProductsModule,
    FavoritesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
