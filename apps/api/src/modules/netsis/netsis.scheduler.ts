import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NetsisService } from './netsis.service';

@Injectable()
export class NetsisScheduler {
  private logger = new Logger(NetsisScheduler.name);

  constructor(private netsisService: NetsisService) {}

  /**
   * Sync products every hour at :00 minutes
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncProducts() {
    this.logger.log('Running scheduled product sync...');
    try {
      await this.netsisService.syncProducts();
    } catch (error) {
      this.logger.error('Scheduled product sync failed:', error);
    }
  }

  /**
   * Sync stock every 30 minutes
   */
  @Cron('0 */30 * * * *') // Every 30 minutes
  async syncStock() {
    this.logger.log('Running scheduled stock sync...');
    try {
      await this.netsisService.syncStock();
    } catch (error) {
      this.logger.error('Scheduled stock sync failed:', error);
    }
  }

  /**
   * Sync cari (customer accounts) every 2 hours
   */
  @Cron(CronExpression.EVERY_2_HOURS)
  async syncCari() {
    this.logger.log('Running scheduled cari sync...');
    try {
      await this.netsisService.syncCari();
    } catch (error) {
      this.logger.error('Scheduled cari sync failed:', error);
    }
  }
}
