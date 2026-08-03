import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Public endpoint: erişim HER ZAMAN serbest. Ancak istekte geçerli bir
      // token varsa `req.user`'ı yine de doldururuz ("opsiyonel auth").
      //
      // NEDEN: Eskiden burada doğrudan `return true` vardı, yani Passport hiç
      // çalışmıyor ve public endpoint'lerde req.user DAİMA undefined kalıyordu.
      // Bu yüzden GET /admin/popups/active kullanıcının rolünü asla göremiyor,
      // B2B / B2C / SPECIFIC_DEALER hedefli popup'lar HİÇ KİMSEYE
      // gösterilemiyordu — yalnızca audience=ALL çalışıyordu (2026-08-01).
      //
      // Token yoksa veya geçersizse hata YUTULUR; misafir kullanıcı public
      // endpoint'e erişmeye devam eder.
      try {
        await super.canActivate(context);
      } catch {
        /* misafir / geçersiz token — public erişim engellenmez */
      }
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
