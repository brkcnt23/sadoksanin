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
import { DiscountsModule } from './modules/discounts/discounts.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { CmsModule } from './modules/cms/cms.module';
import { PopupModule } from './modules/popup/popup.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

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
    DiscountsModule,
    MailerModule,
    CmsModule,
    CommonModule,
    AuthModule,
    NetsisModule,
    OrdersModule,
    ProductsModule,
    FavoritesModule,
    PopupModule,
    PricingModule,
    AuditModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
