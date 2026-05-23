import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
    const rateLimit = (await import('express-rate-limit')).default;
    app.use(
      '/auth/login',
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 dk
        max: 10, // 10 deneme
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
