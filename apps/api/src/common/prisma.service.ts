import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma 7 client wrapper.
 *
 * Prisma 7 dropped `datasource.url` from schema.prisma and requires the
 * runtime client to be constructed with a driver adapter. We use the native
 * Postgres adapter (`@prisma/adapter-pg`) which speaks the wire protocol
 * directly via `pg` — no Prisma query engine binary at runtime.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined. Set it in the workspace .env file.');
    }
    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
