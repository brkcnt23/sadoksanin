import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthService } from '../oauth.service';
import { IdeasoftAuthContext } from '../types';

/**
 * Admin-API endpoint'lerini korur. Entegra'nın `Authorization: Bearer <jwt>`
 * header'ını doğrular ve request'e `ideasoft` bağlamını iliştirir.
 */
@Injectable()
export class IdeasoftBearerGuard implements CanActivate {
  constructor(private readonly oauth: OAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers?.authorization || '';
    const [scheme, token] = header.split(' ');
    if (!/^Bearer$/i.test(scheme || '') || !token) {
      throw new UnauthorizedException('invalid_token');
    }
    const ctx = this.oauth.verifyAccessToken(token);
    (req as any).ideasoft = ctx satisfies IdeasoftAuthContext;
    return true;
  }
}
