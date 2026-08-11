import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_CODE_TTL_SECONDS,
  DEFAULT_SCOPE,
  ENTEGRA_CLIENT_ID_ENV,
  ENTEGRA_CLIENT_SECRET_ENV,
  IDEASOFT_JWT_SECRET_ENV,
  IDEASOFT_TOKEN_TYPE,
  REFRESH_TOKEN_TTL_DAYS,
} from './ideasoft.constants';
import { IdeasoftTokenResponse } from './types';

/**
 * Ideasoft OAuth2 taklidi — authorization_code + refresh_token akışları.
 *
 * Entegra kendi (eski Ideasoft'a kayıtlı) client_id/client_secret'ı ile auth alır;
 * bu değerler env'den okunur (ENTEGRA_CLIENT_ID / ENTEGRA_CLIENT_SECRET).
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger('IdeasoftOAuth');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get clientId(): string {
    const v = this.config.get<string>(ENTEGRA_CLIENT_ID_ENV);
    if (!v) {
      throw new BadRequestException(
        'ENTEGRA_CLIENT_ID tanımlı değil — OAuth taklidi çalışamaz',
      );
    }
    return v;
  }

  private get clientSecret(): string {
    const v = this.config.get<string>(ENTEGRA_CLIENT_SECRET_ENV);
    if (!v) {
      throw new BadRequestException('ENTEGRA_CLIENT_SECRET tanımlı değil');
    }
    return v;
  }

  private get jwtSecret(): string {
    return (
      this.config.get<string>(IDEASOFT_JWT_SECRET_ENV) ||
      this.config.get<string>('JWT_SECRET') ||
      'your-secret-key-change-in-env'
    );
  }

  /** Sabit-zamanlı string karşılaştırma (timing attack'e karşı). */
  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a ?? '', 'utf8');
    const bb = Buffer.from(b ?? '', 'utf8');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  }

  /** Entegra client_id/client_secret doğrula. Yanlışsa OAuth invalid_client. */
  private assertClient(clientId?: string, clientSecret?: string): void {
    const idOk = !!clientId && this.safeEqual(clientId, this.clientId);
    const secretOk =
      !!clientSecret && this.safeEqual(clientSecret, this.clientSecret);
    if (!idOk || !secretOk) {
      throw new UnauthorizedException('invalid_client');
    }
  }

  /** client_id geçerli mi (secret olmadan, /panel/auth için). */
  isKnownClient(clientId?: string): boolean {
    return !!clientId && this.safeEqual(clientId, this.clientId);
  }

  // ─── Authorization code (GET/POST /panel/auth) ───────────────────────────────

  /**
   * Admin kimliğini doğrula (yalnızca ADMIN / SUPER_ADMIN yetkilendirebilir).
   */
  async validateAdmin(email: string, password: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email: (email ?? '').toLowerCase().trim() },
    });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new UnauthorizedException('Yetkisiz kullanıcı');
    }
    const ok = await bcrypt.compare(password ?? '', user.password);
    if (!ok) {
      throw new UnauthorizedException('Hatalı şifre');
    }
    return user.id;
  }

  /** Tek kullanımlık authorization code üret ve sakla. */
  async createAuthCode(params: {
    clientId: string;
    redirectUri: string;
    scope?: string;
    userId: string;
  }): Promise<string> {
    const code = randomBytes(48).toString('hex');
    await this.prisma.ideasoftAuthCode.create({
      data: {
        code,
        clientId: params.clientId,
        redirectUri: params.redirectUri,
        scope: params.scope || DEFAULT_SCOPE,
        userId: params.userId,
        expiresAt: new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000),
      },
    });
    return code;
  }

  // ─── Token endpoint (POST /oauth/v2/token) ───────────────────────────────────

  async exchange(params: {
    grantType?: string;
    clientId?: string;
    clientSecret?: string;
    code?: string;
    redirectUri?: string;
    refreshToken?: string;
  }): Promise<IdeasoftTokenResponse> {
    switch (params.grantType) {
      case 'authorization_code':
        return this.grantAuthorizationCode(params);
      case 'refresh_token':
        return this.grantRefreshToken(params);
      default:
        throw new BadRequestException('unsupported_grant_type');
    }
  }

  private async grantAuthorizationCode(params: {
    clientId?: string;
    clientSecret?: string;
    code?: string;
    redirectUri?: string;
  }): Promise<IdeasoftTokenResponse> {
    this.assertClient(params.clientId, params.clientSecret);
    if (!params.code) throw new BadRequestException('invalid_request');

    const record = await this.prisma.ideasoftAuthCode.findUnique({
      where: { code: params.code },
    });
    if (
      !record ||
      record.usedAt ||
      record.expiresAt < new Date() ||
      !this.safeEqual(record.clientId, params.clientId!)
    ) {
      throw new UnauthorizedException('invalid_grant');
    }
    // redirect_uri gönderildiyse eşleşmeli (Ideasoft/RFC gereği)
    if (params.redirectUri && record.redirectUri !== params.redirectUri) {
      throw new UnauthorizedException('invalid_grant');
    }

    // Tek kullanım: kodu tüket
    await this.prisma.ideasoftAuthCode.update({
      where: { code: record.code },
      data: { usedAt: new Date() },
    });

    return this.issueTokens({
      clientId: record.clientId,
      scope: record.scope,
      userId: record.userId ?? undefined,
    });
  }

  private async grantRefreshToken(params: {
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
  }): Promise<IdeasoftTokenResponse> {
    this.assertClient(params.clientId, params.clientSecret);
    if (!params.refreshToken) throw new BadRequestException('invalid_request');

    const token = await this.prisma.ideasoftToken.findUnique({
      where: { refreshToken: params.refreshToken },
    });
    if (
      !token ||
      token.revokedAt ||
      token.expiresAt < new Date() ||
      !this.safeEqual(token.clientId, params.clientId!)
    ) {
      throw new UnauthorizedException('invalid_grant');
    }

    // Rotasyon: eski refresh token'ı iptal et, yenisini ver
    await this.prisma.ideasoftToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });

    return this.issueTokens({
      clientId: token.clientId,
      scope: token.scope,
      userId: token.userId ?? undefined,
    });
  }

  /** Access (JWT) + refresh (DB) token üret. */
  private async issueTokens(params: {
    clientId: string;
    scope: string;
    userId?: string;
  }): Promise<IdeasoftTokenResponse> {
    const accessToken = this.jwt.sign(
      {
        sub: params.userId || params.clientId,
        client_id: params.clientId,
        scope: params.scope,
        type: IDEASOFT_TOKEN_TYPE,
      },
      { secret: this.jwtSecret, expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );

    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.ideasoftToken.create({
      data: {
        refreshToken,
        clientId: params.clientId,
        scope: params.scope,
        userId: params.userId,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      access_token: accessToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      token_type: 'bearer',
      scope: params.scope,
      refresh_token: refreshToken,
    };
  }

  /** Bearer guard için access token doğrula. */
  verifyAccessToken(token: string): {
    clientId: string;
    scope: string;
    userId?: string;
  } {
    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.jwtSecret });
    } catch {
      throw new UnauthorizedException('invalid_token');
    }
    if (payload?.type !== IDEASOFT_TOKEN_TYPE) {
      throw new UnauthorizedException('invalid_token');
    }
    return {
      clientId: payload.client_id,
      scope: payload.scope ?? '',
      userId: payload.sub,
    };
  }
}
