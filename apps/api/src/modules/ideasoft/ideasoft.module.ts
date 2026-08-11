import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { IdeasoftBearerGuard } from './guards/ideasoft-bearer.guard';
import { IdMapService } from './id-map.service';
import { IdeasoftAdminController } from './ideasoft-admin.controller';
import { IdeasoftAdminService } from './ideasoft-admin.service';

/**
 * Ideasoft Admin API taklidi.
 *
 * Faz 1: OAuth2 (bu modül) — Entegra'nın auth alması.
 * Faz 2: /admin-api/* endpoint'leri (ileride eklenecek controller'lar).
 *
 * JWT imzası servis içinde açık secret ile yapıldığından JwtModule minimal
 * kayıtlıdır; sadece JwtService'i sağlar.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [OAuthController, IdeasoftAdminController],
  providers: [
    OAuthService,
    IdeasoftBearerGuard,
    IdMapService,
    IdeasoftAdminService,
    PrismaService,
  ],
  exports: [OAuthService, IdeasoftBearerGuard],
})
export class IdeasoftModule {}
