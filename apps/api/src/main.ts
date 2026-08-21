import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: false, // Nuxt SSR needs inline scripts
    crossOriginEmbedderPolicy: false,
  }));

  // Body-parser limits for proforma images
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ limit: '15mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global API prefix — all controllers inherit /api
  // Nginx preserves the prefix, so both internal and external calls work.
  // Ideasoft-taklit route'ları HARİÇ: Entegra birebir /oauth/v2/token ve
  // /panel/auth bekler, prefix'siz olmalı. (Faz 2'de /admin-api/* eklenecek.)
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'oauth/v2/token', method: RequestMethod.POST },
      { path: 'panel/auth', method: RequestMethod.GET },
      { path: 'panel/auth', method: RequestMethod.POST },
      // /admin-api/* — tüm alt route'lar (v8 named wildcard), tüm metodlar
      { path: 'admin-api/*path', method: RequestMethod.ALL },
    ],
  });

  // CORS — prod domain'leri env'den, dev fallback localhost
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:3002'];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Rate limiting — özellikle auth endpoint'lerinde
  if (process.env.NODE_ENV === 'production') {
    // KRITIK: nginx'in arkasindayiz. trust proxy ayarlanmazsa express her
    // istegi nginx'in IP'sinden gelmis sayar ve rate-limit kovasi TUM
    // KULLANICILAR ICIN ORTAK olur — 11. giris denemesi, kim yaparsa yapsin,
    // 15 dakika boyunca herkesi kilitler. 1400+ bayiye giris acilirken bu
    // sistemi tamamen kullanilamaz hale getirir.
    // '1' = tek proxy hop (nginx). API yalnizca 127.0.0.1'e bagli oldugu ve
    // disaridan tek yol nginx oldugu icin X-Forwarded-For guvenilir.
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    const rateLimit = (await import('express-rate-limit')).default;
    app.use(
      '/api/auth/login',
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 dk
        // Artik IP basina. Ayni ofisten (tek NAT) birden fazla bayi
        // girebilsin diye 10 yerine 20.
        max: 20,
        message: { message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.', statusCode: 429 },
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  const port = process.env.API_PORT || 3001;
  const host = process.env.API_HOST || 'localhost';

  await app.listen(port, host);
  console.log(`🚀 API running on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
