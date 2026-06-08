import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NetsisService } from './netsis.service'

/**
 * Netsis periyodik sync zamanlayıcı.
 *
 * Varsayılan aralıklar:
 *   - Stok: her 30 dk (en sık değişen veri)
 *   - Ürün: saatte bir (yeni ürün/fiyat değişikliği)
 *   - Cari: 2 saatte bir (bakiye/limit)
 *   - Döviz: 6 saatte bir (günde 4 kez)
 *
 * Netsis yapılandırılmamışsa (NETSIS_API_URL boş) sync'ler sessizce atlanır.
 */
@Injectable()
export class NetsisScheduler {
  private readonly logger = new Logger(NetsisScheduler.name)

  constructor(private readonly netsisService: NetsisService) {}

  @Cron('0 */30 * * * *') // Her 30 dk
  async syncStock() {
    this.logger.log('Planlı stok sync başlıyor...')
    try {
      const result = await this.netsisService.syncStock()
      if (result.status !== 'skipped') {
        this.logger.log(`Stok sync: ${result.status} (${result.itemsSynced} kayıt, ${result.duration}ms)`)
      }
    } catch (err) {
      this.logger.error('Planlı stok sync başarısız:', (err as Error).message)
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async syncProducts() {
    this.logger.log('Planlı ürün sync başlıyor...')
    try {
      const result = await this.netsisService.syncProducts()
      if (result.status !== 'skipped') {
        this.logger.log(`Ürün sync: ${result.status} (${result.itemsSynced} kayıt, ${result.duration}ms)`)
      }
    } catch (err) {
      this.logger.error('Planlı ürün sync başarısız:', (err as Error).message)
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async syncCari() {
    this.logger.log('Planlı cari sync başlıyor...')
    try {
      const result = await this.netsisService.syncCari()
      if (result.status !== 'skipped') {
        this.logger.log(`Cari sync: ${result.status} (${result.itemsSynced} bayi, ${result.duration}ms)`)
      }
    } catch (err) {
      this.logger.error('Planlı cari sync başarısız:', (err as Error).message)
    }
  }

  @Cron('0 0 */6 * * *') // Her 6 saatte bir (00:00, 06:00, 12:00, 18:00)
  async syncExchangeRates() {
    this.logger.log('Planlı döviz kuru sync başlıyor...')
    try {
      const result = await this.netsisService.syncExchangeRates()
      if (result.status !== 'skipped') {
        this.logger.log(`Kur sync: ${result.status} (${result.itemsSynced} kur, ${result.duration}ms)`)
      }
    } catch (err) {
      this.logger.error('Planlı kur sync başarısız:', (err as Error).message)
    }
  }
}
