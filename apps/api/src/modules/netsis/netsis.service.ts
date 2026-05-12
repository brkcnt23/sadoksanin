import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../common/prisma.service';

interface NetsisProduct {
  kod: string; // Product code
  adi: string; // Product name
  marka: string;
  kategori: string;
  birim: string; // Unit
  liste_fiyati: number; // List price
  kdv_orani: number; // VAT rate
  stok: number; // Stock quantity
}

interface NetsisCari {
  CARIHESAPNUMARASI: string;
  UNVAN: string; // Company name
  VERGI_NO: string; // Tax ID
  BORCLANAN_TUTAR: number; // Amount owed
  KREDILIMITI: number; // Credit limit
}

@Injectable()
export class NetsisService {
  private logger = new Logger(NetsisService.name);
  private client: AxiosInstance;
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.baseUrl = this.configService.get<string>('NETSIS_API_URL') || '';
    this.username = this.configService.get<string>('NETSIS_USERNAME') || '';
    this.password = this.configService.get<string>('NETSIS_PASSWORD') || '';

    // Initialize axios with basic auth
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.username,
        password: this.password,
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch all products from Netsis
   * Should be called hourly via scheduler
   */
  async syncProducts(): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.log('Starting Netsis product sync...');

      // Placeholder: In reality, this would call Netsis API
      // For now, we'll just log that we attempted the sync
      if (!this.baseUrl || !this.username || !this.password) {
        this.logger.warn('Netsis credentials not configured - skipping sync');
        return;
      }

      const response = await this.client.get('/urunler');
      const products = response.data as NetsisProduct[];

      // Upsert products in database
      for (const product of products) {
        await this.prisma.product.upsert({
          where: { netsisCode: product.kod },
          create: {
            netsisCode: product.kod,
            sku: product.kod,
            name: product.adi,
            brand: product.marka || '',
            category: product.kategori || '',
            unit: product.birim || 'adet',
            basePrice: product.liste_fiyati,
            taxRate: product.kdv_orani || 0.2,
            netsisStock: product.stok || 0,
            syncStatus: 'SYNCED',
            lastNetsisSync: new Date(),
          },
          update: {
            netsisStock: product.stok || 0,
            syncStatus: 'SYNCED',
            lastNetsisSync: new Date(),
          },
        });
      }

      const duration = Date.now() - startTime;
      await this.updateSyncStatus('products', products.length, 0, 'success', duration);
      this.logger.log(`Synced ${products.length} products in ${duration}ms`);
    } catch (error) {
      this.logger.error('Product sync failed:', error);
      await this.updateSyncStatus('products', 0, 1, 'error', 0, error.message);
      throw error;
    }
  }

  /**
   * Fetch stock levels from Netsis
   * Should be called hourly via scheduler
   */
  async syncStock(): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.log('Starting Netsis stock sync...');

      if (!this.baseUrl || !this.username || !this.password) {
        this.logger.warn('Netsis credentials not configured - skipping sync');
        return;
      }

      // Placeholder: Call Netsis API for stock
      const response = await this.client.get('/stok');
      const stocks = response.data;

      // Update product stocks
      let updated = 0;
      for (const stock of stocks) {
        await this.prisma.product.updateMany({
          where: { netsisCode: stock.kod },
          data: {
            netsisStock: stock.stok,
            lastNetsisSync: new Date(),
          },
        });
        updated++;
      }

      const duration = Date.now() - startTime;
      await this.updateSyncStatus('stock', updated, 0, 'success', duration);
      this.logger.log(`Updated ${updated} product stocks in ${duration}ms`);
    } catch (error) {
      this.logger.error('Stock sync failed:', error);
      await this.updateSyncStatus('stock', 0, 1, 'error', 0, error.message);
      throw error;
    }
  }

  /**
   * Fetch cari (customer account) information from Netsis
   * Should be called hourly via scheduler
   */
  async syncCari(): Promise<void> {
    try {
      const startTime = Date.now();
      this.logger.log('Starting Netsis cari sync...');

      if (!this.baseUrl || !this.username || !this.password) {
        this.logger.warn('Netsis credentials not configured - skipping sync');
        return;
      }

      const response = await this.client.get('/cari');
      const cariList = response.data as NetsisCari[];

      // Update dealer cari information
      let updated = 0;
      for (const cari of cariList) {
        await this.prisma.dealer.updateMany({
          where: { cariNo: cari.CARIHESAPNUMARASI },
          data: {
            cariBalance: -cari.BORCLANAN_TUTAR, // Negative = owes us
            creditLimit: cari.KREDILIMITI,
          },
        });
        updated++;
      }

      const duration = Date.now() - startTime;
      await this.updateSyncStatus('cari', updated, 0, 'success', duration);
      this.logger.log(`Updated ${updated} dealer cari info in ${duration}ms`);
    } catch (error) {
      this.logger.error('Cari sync failed:', error);
      await this.updateSyncStatus('cari', 0, 1, 'error', 0, error.message);
      throw error;
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(syncType: string) {
    return this.prisma.netsisSync.findUnique({
      where: { syncType },
    });
  }

  /**
   * Update sync status record
   */
  private async updateSyncStatus(
    syncType: string,
    itemsSynced: number,
    errors: number,
    status: string,
    duration: number,
    errorMessage?: string,
  ) {
    return this.prisma.netsisSync.upsert({
      where: { syncType },
      create: {
        syncType,
        itemsSynced,
        errors,
        status,
        lastSyncAt: new Date(),
        lastSyncDuration: duration,
        errorMessage,
      },
      update: {
        itemsSynced,
        errors,
        status,
        lastSyncAt: new Date(),
        lastSyncDuration: duration,
        errorMessage,
        nextScheduledAt: this.getNextScheduleTime(),
      },
    });
  }

  /**
   * Calculate next scheduled sync time (1 hour from now)
   */
  private getNextScheduleTime(): Date {
    const next = new Date();
    next.setHours(next.getHours() + 1);
    return next;
  }
}
