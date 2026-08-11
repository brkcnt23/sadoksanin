import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * API Key Guard — makinelerarası (M2M) kimlik doğrulama.
 * Header: x-api-key veya Authorization: Bearer <key>
 *
 * .env:
 *   NETSIS_PUSH_API_KEY=...
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name)

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const expectedKey = this.configService.get<string>('NETSIS_PUSH_API_KEY')

    if (!expectedKey) {
      this.logger.warn('NETSIS_PUSH_API_KEY tanımlanmamış — API key auth devre dışı')
      // API key tanımlanmamışsa, JWT guard ile birlikte kullanılabilir diye izin ver
      return true
    }

    // 1. x-api-key header
    const apiKey = request.headers['x-api-key']
    if (apiKey && apiKey === expectedKey) {
      return true
    }

    // 2. Authorization: Bearer <api-key> (JWT değil, API key)
    const authHeader = request.headers['authorization']
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      if (token === expectedKey) return true
    }

    throw new UnauthorizedException('Geçersiz API anahtarı')
  }
}
