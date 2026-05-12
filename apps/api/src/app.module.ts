import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common/common.module';
import { NetsisModule } from './modules/netsis/netsis.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { FavoritesModule } from './modules/favorites/favorites.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
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
