import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NetsisService } from './netsis.service'
import { MailerService } from '../mailer/mailer.service'
import { PrismaService } from '../../common/prisma.service'
import type { NetsisSyncResult } from './netsis.types'

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
 *
 * ARIZA UYARISI: Sync üst üste ARIZA_ESIGI kez başarısız olursa yöneticilere
 * e-posta gider. 2026-07'de fabrika SSH tüneli koptu ve sync 10 gün boyunca
 * her 30 dakikada bir hata verdi — kimse fark etmedi. Uyarı bunun tekrarını
 * önlemek için var.
 */
@Injectable()
export class NetsisScheduler {
  private readonly logger = new Logger(NetsisScheduler.name)

  /** Kaç ardışık hatadan sonra uyarı gitsin. 3 = stok için ~1.5 saat. */
  private static readonly ARIZA_ESIGI = 3

  /** Sync tipi → ardışık hata sayacı. */
  private ardisikHata = new Map<string, number>()

  /** Uyarısı gönderilmiş sync tipleri (düzelene kadar tekrar gönderilmez). */
  private uyariGonderildi = new Set<string>()

  constructor(
    private readonly netsisService: NetsisService,
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Sync sonucunu değerlendirir; ardışık hatalar eşiği geçerse tek seferlik
   * uyarı gönderir, başarıda sayacı ve uyarı durumunu sıfırlar.
   */
  private async sonucuDegerlendir(etiket: string, result: NetsisSyncResult) {
    if (result.status === 'skipped') return

    if (result.status === 'success') {
      const oncekiHata = this.ardisikHata.get(result.syncType) ?? 0
      this.ardisikHata.set(result.syncType, 0)

      // Arıza sonrası toparlanma — daha önce uyarı gittiyse haber ver
      if (this.uyariGonderildi.has(result.syncType)) {
        this.uyariGonderildi.delete(result.syncType)
        this.logger.log(`${etiket} sync toparlandı (${oncekiHata} hatadan sonra)`)
        await this.uyariGonder(
          `Netsis ${etiket} sync düzeldi`,
          `${etiket} senkronizasyonu tekrar çalışıyor. ` +
            `${result.itemsSynced} kayıt işlendi.`,
        )
      }
      return
    }

    // status === 'error'
    const sayac = (this.ardisikHata.get(result.syncType) ?? 0) + 1
    this.ardisikHata.set(result.syncType, sayac)

    if (sayac >= NetsisScheduler.ARIZA_ESIGI && !this.uyariGonderildi.has(result.syncType)) {
      this.uyariGonderildi.add(result.syncType)
      const mesaj =
        `Netsis ${etiket} senkronizasyonu ${sayac} kez üst üste başarısız oldu.\n\n` +
        `Son hata: ${result.errorMessage || 'bilinmiyor'}\n\n` +
        `Olası sebep: fabrika PC'deki SSH tüneli kapalı olabilir.\n` +
        `Sunucuda kontrol: sudo ss -tlnp | grep 17070\n` +
        `Tünel yoksa fabrika PC'de NetsisTunel zamanlanmış görevi çalışmıyordur.`
      this.logger.error(`ARIZA UYARISI gönderiliyor: ${etiket} (${sayac} ardışık hata)`)
      await this.uyariGonder(`Netsis ${etiket} sync ARIZASI`, mesaj)
    }
  }

  /** Yönetici rollerine e-posta gönderir (hata olursa sessizce yutar). */
  private async uyariGonder(konu: string, mesaj: string) {
    try {
      const adminler = await this.prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { email: true },
      })
      for (const a of adminler) {
        await this.mailerService.sendNotification(a.email, konu, mesaj).catch(() => {})
      }
    } catch (err) {
      this.logger.error('Arıza uyarısı gönderilemedi:', (err as Error).message)
    }
  }

  @Cron('0 */30 * * * *') // Her 30 dk
  async syncStock() {
    this.logger.log('Planlı stok sync başlıyor...')
    try {
      const result = await this.netsisService.syncStock()
      if (result.status !== 'skipped') {
        this.logger.log(`Stok sync: ${result.status} (${result.itemsSynced} kayıt, ${result.duration}ms)`)
      }
      await this.sonucuDegerlendir('stok', result)
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
      await this.sonucuDegerlendir('ürün', result)
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
      await this.sonucuDegerlendir('cari', result)
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
      await this.sonucuDegerlendir('döviz kuru', result)
    } catch (err) {
      this.logger.error('Planlı kur sync başarısız:', (err as Error).message)
    }
  }
}
