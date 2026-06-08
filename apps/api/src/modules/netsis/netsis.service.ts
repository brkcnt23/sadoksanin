import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { PrismaService } from '../../common/prisma.service'
import type {
  NetsisLoginRequest,
  NetsisTokenResponse,
  NetsisItem,
  NetsisItemPrimInfo,
  NetsisARPs,
  NetsisExRate,
  NetsisSyncResult,
} from './netsis.types'

// ─── Token Cache ────────────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string
  expiresAt: number // epoch ms
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class NetsisService {
  private readonly logger = new Logger(NetsisService.name)
  private readonly apiUrl: string
  private readonly loginRequest: NetsisLoginRequest
  private readonly configured: boolean
  private tokenCache: TokenCache | null = null

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiUrl = (this.configService.get<string>('NETSIS_API_URL') || '').replace(/\/+$/, '')
    this.loginRequest = {
      BranchCode: Number(this.configService.get<string>('NETSIS_BRANCH_CODE') || '0'),
      NetsisUser: this.configService.get<string>('NETSIS_USER')
        || this.configService.get<string>('NETSIS_USERNAME') // eski .env uyumluluğu
        || '',
      NetsisPassword: this.configService.get<string>('NETSIS_PASSWORD') || '',
      DbType: 1, // vtMSSQL
      DbName: this.configService.get<string>('NETSIS_DB_NAME') || '',
      DbUser: this.configService.get<string>('NETSIS_DB_USER') || '',
      DbPassword: this.configService.get<string>('NETSIS_DB_PASSWORD') || '',
    }

    this.configured = !!(
      this.apiUrl &&
      this.loginRequest.NetsisUser &&
      this.loginRequest.DbName
    )

    if (!this.configured) {
      this.logger.warn(
        'Netsis API yapılandırması eksik — sync işlemleri atlanacak. ' +
        'NETSIS_API_URL, NETSIS_USER, NETSIS_DB_NAME değişkenlerini .env dosyasında tanımlayın.',
      )
    } else {
      this.logger.log(`Netsis API yapılandırıldı: ${this.apiUrl} (DB: ${this.loginRequest.DbName})`)
    }
  }

  // ─── Token Management ───────────────────────────────────────────────────

  /**
   * NetOpenX REST token alır veya cache'deki geçerli token'ı döner.
   * Token süresi default 20 dk (Manager'dan ayarlanabilir).
   */
  private async getAccessToken(): Promise<string> {
    // Cache'de geçerli token varsa döndür (5 sn buffer)
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt - 5000) {
      return this.tokenCache.accessToken
    }

    this.logger.debug('Yeni access token alınıyor...')

    try {
      const res = await axios.post<NetsisTokenResponse>(
        `${this.apiUrl}/token`,
        this.loginRequest,
        { timeout: 15000 },
      )

      const { access_token, expires_in } = res.data

      this.tokenCache = {
        accessToken: access_token,
        expiresAt: Date.now() + (expires_in || 1200) * 1000,
      }

      this.logger.debug(`Token alındı, ${expires_in || 1200}s geçerli`)
      return access_token
    } catch (err) {
      this.logger.error('Token alma başarısız:', (err as Error).message)
      throw new Error(`Netsis token alınamadı: ${(err as Error).message}`)
    }
  }

  /**
   * Token'ı geçersiz kılıp yeniden al.
   */
  private async refreshToken(): Promise<string> {
    // Önce varsa revoke et (best-effort)
    if (this.tokenCache?.accessToken) {
      try {
        await axios.get(`${this.apiUrl}/api/v2/revoke`, {
          headers: { Authorization: `Bearer ${this.tokenCache.accessToken}` },
          timeout: 5000,
        })
      } catch { /* revoke başarısız olursa önemsiz */ }
    }
    this.tokenCache = null
    return this.getAccessToken()
  }

  // ─── HTTP Helpers ───────────────────────────────────────────────────────

  /**
   * Bearer token'lı axios instance oluşturur.
   */
  private async apiClient(): Promise<AxiosInstance> {
    const token = await this.getAccessToken()
    return axios.create({
      baseURL: this.apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    })
  }

  /**
   * Sayfalı GET isteği yapar — tüm kayıtları toplar.
   */
  private async fetchAllPages<T>(
    endpoint: string,
    pageSize: number = 500,
    extraParams: Record<string, string> = {},
  ): Promise<T[]> {
    const client = await this.apiClient()
    const all: T[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset), ...extraParams })
      const url = `${endpoint}?${params.toString()}`

      try {
        const res = await client.get<T[]>(url)

        // NetOpenX REST farklı response formatları dönebilir:
        // - direkt array: [...]
        // - DataList içeren obje: { DataList: [...], Count: N }
        // - Data içeren obje: { Data: [...], Count: N }
        let items: T[] = []
        if (Array.isArray(res.data)) {
          items = res.data
        } else if ((res.data as any)?.DataList) {
          items = (res.data as any).DataList
        } else if ((res.data as any)?.Data) {
          items = (res.data as any).Data
        }

        all.push(...items)
        offset += items.length
        hasMore = items.length === pageSize
      } catch (err) {
        // Token expired → refresh and retry once
        if ((err as any)?.response?.status === 401) {
          this.logger.debug('Token expired, yenileniyor...')
          this.tokenCache = null
          const newClient = await this.apiClient()
          const retryRes = await newClient.get<T[]>(url)
          let items: T[] = []
          if (Array.isArray(retryRes.data)) {
            items = retryRes.data
          } else if ((retryRes.data as any)?.DataList) {
            items = (retryRes.data as any).DataList
          } else if ((retryRes.data as any)?.Data) {
            items = (retryRes.data as any).Data
          }
          all.push(...items)
          offset += items.length
          hasMore = items.length === pageSize
          continue
        }
        throw err
      }
    }

    return all
  }

  // ─── Sync: Ürünler (Items → Product) ────────────────────────────────────

  /**
   * Netsis'ten tüm stok kartlarını çeker, Product tablosuna yazar.
   *
   * Netsis → Sadoksan mapping:
   *   STOK_KODU    → netsisCode, sku
   *   STOK_ADI     → name
   *   STOK_BAKIYE  → netsisStock, displayStock hesaplanır
   *   KDV_ORANI    → taxRate
   *   SAT_FIYAT    → basePrice
   *   BIRIM        → unit
   *   MARKA        → brand
   */
  async syncProducts(): Promise<NetsisSyncResult> {
    const startTime = Date.now()

    if (!this.configured) {
      this.logger.warn('Netsis yapılandırılmadı — ürün sync atlandı')
      return { syncType: 'products', status: 'skipped', itemsSynced: 0, errors: 0, duration: 0 }
    }

    await this.markSyncRunning('products')

    try {
      // Önce temel bilgileri al (daha hızlı)
      const items = await this.fetchAllPages<NetsisItem>('/api/v2/Items', 500)

      let created = 0, updated = 0, errors = 0

      for (const item of items) {
        try {
          await this.prisma.product.upsert({
            where: { netsisCode: item.STOK_KODU },
            create: {
              netsisCode: item.STOK_KODU,
              sku: item.STOK_KODU,
              name: item.STOK_ADI || item.STOK_KODU,
              brand: item.MARKA || '',
              category: item.KATEGORI || '',
              unit: item.BIRIM || 'adet',
              basePrice: item.SAT_FIYAT || 0,
              taxRate: item.KDV_ORANI || 0.2,
              netsisStock: Math.round(item.STOK_BAKIYE || 0),
              displayStock: Math.round(item.STOK_BAKIYE || 0),
              syncStatus: 'SYNCED',
              lastNetsisSync: new Date(),
            },
            update: {
              name: item.STOK_ADI || undefined,
              brand: item.MARKA || undefined,
              category: item.KATEGORI || undefined,
              unit: item.BIRIM || undefined,
              basePrice: item.SAT_FIYAT ?? undefined,
              taxRate: item.KDV_ORANI ?? undefined,
              netsisStock: Math.round(item.STOK_BAKIYE || 0),
              // displayStock hesapla: netsisStock - pendingQuantity - reservedStock
              syncStatus: 'SYNCED',
              lastNetsisSync: new Date(),
            },
          })
          // İlk kez oluşturuluyorsa created, varsa updated
          // (upsert'te ayırt edemesek de count için kullanacağız)
          updated++
        } catch (err) {
          errors++
          this.logger.error(`Ürün sync hatası [${item.STOK_KODU}]:`, (err as Error).message)
        }
      }

      const duration = Date.now() - startTime
      await this.updateSyncStatus('products', updated, errors, 'success', duration)
      this.logger.log(`Ürün sync tamamlandı: ${updated} kayıt, ${errors} hata, ${duration}ms`)

      return { syncType: 'products', status: 'success', itemsSynced: updated, errors, duration }
    } catch (err) {
      const duration = Date.now() - startTime
      const msg = (err as Error).message
      this.logger.error('Ürün sync başarısız:', msg)
      await this.updateSyncStatus('products', 0, 1, 'error', duration, msg)
      return { syncType: 'products', status: 'error', itemsSynced: 0, errors: 1, duration, errorMessage: msg }
    }
  }

  // ─── Sync: Stok Miktarları (Items/PrimInfo → Product.netsisStock) ───────

  /**
   * Netsis'ten sadece stok miktarlarını günceller.
   * Daha hızlıdır — tüm ürün detaylarını çekmez.
   */
  async syncStock(): Promise<NetsisSyncResult> {
    const startTime = Date.now()

    if (!this.configured) {
      this.logger.warn('Netsis yapılandırılmadı — stok sync atlandı')
      return { syncType: 'stock', status: 'skipped', itemsSynced: 0, errors: 0, duration: 0 }
    }

    await this.markSyncRunning('stock')

    try {
      const items = await this.fetchAllPages<NetsisItemPrimInfo>('/api/v2/Items/PrimInfo', 1000)

      let updated = 0, errors = 0

      for (const item of items) {
        try {
          await this.prisma.product.updateMany({
            where: { netsisCode: item.STOK_KODU },
            data: {
              netsisStock: Math.round(item.STOK_BAKIYE || 0),
              lastNetsisSync: new Date(),
              // displayStock hesabı için mevcut pending/reserved değerler korunur
            },
          })
          updated++
        } catch (err) {
          errors++
          this.logger.error(`Stok sync hatası [${item.STOK_KODU}]:`, (err as Error).message)
        }
      }

      // displayStock = netsisStock - netsisPendingQuantity - reservedStock
      await this.prisma.$executeRawUnsafe(`
        UPDATE "Product"
        SET "displayStock" = "netsisStock" - "netsisPendingQuantity" - "reservedStock"
        WHERE "lastNetsisSync" >= NOW() - INTERVAL '2 minutes'
      `)

      const duration = Date.now() - startTime
      await this.updateSyncStatus('stock', updated, errors, 'success', duration)
      this.logger.log(`Stok sync tamamlandı: ${updated} kayıt, ${duration}ms`)

      return { syncType: 'stock', status: 'success', itemsSynced: updated, errors, duration }
    } catch (err) {
      const duration = Date.now() - startTime
      const msg = (err as Error).message
      this.logger.error('Stok sync başarısız:', msg)
      await this.updateSyncStatus('stock', 0, 1, 'error', duration, msg)
      return { syncType: 'stock', status: 'error', itemsSynced: 0, errors: 1, duration, errorMessage: msg }
    }
  }

  // ─── Sync: Cari Hesaplar (ARPs → Dealer) ────────────────────────────────

  /**
   * Netsis'ten cari hesap bilgilerini çeker, Dealer tablosuna yazar.
   *
   * Netsis → Sadoksan mapping:
   *   CARI_KOD         → cariNo
   *   CARI_ISIM        → company (ünvan)
   *   VERGI_NO         → taxNo (doğrulama)
   *   BORCLANAN_TUTAR  → cariBalance (-borç = bize borçlu)
   *   KREDI_LIMITI     → creditLimit
   */
  async syncCari(): Promise<NetsisSyncResult> {
    const startTime = Date.now()

    if (!this.configured) {
      this.logger.warn('Netsis yapılandırılmadı — cari sync atlandı')
      return { syncType: 'cari', status: 'skipped', itemsSynced: 0, errors: 0, duration: 0 }
    }

    await this.markSyncRunning('cari')

    try {
      const arpsList = await this.fetchAllPages<NetsisARPs>('/api/v2/ARPs', 500)

      let updated = 0, errors = 0

      for (const arp of arpsList) {
        try {
          const result = await this.prisma.dealer.updateMany({
            where: { cariNo: arp.CARI_KOD },
            data: {
              cariBalance: -(arp.BORCLANAN_TUTAR || 0), // -borç = bize borçlu
              creditLimit: arp.KREDI_LIMITI || 0,
              cariValidated: true,
            },
          })
          updated += result.count
        } catch (err) {
          errors++
          this.logger.error(`Cari sync hatası [${arp.CARI_KOD}]:`, (err as Error).message)
        }
      }

      const duration = Date.now() - startTime
      await this.updateSyncStatus('cari', updated, errors, 'success', duration)
      this.logger.log(`Cari sync tamamlandı: ${updated} bayi güncellendi, ${duration}ms`)

      return { syncType: 'cari', status: 'success', itemsSynced: updated, errors, duration }
    } catch (err) {
      const duration = Date.now() - startTime
      const msg = (err as Error).message
      this.logger.error('Cari sync başarısız:', msg)
      await this.updateSyncStatus('cari', 0, 1, 'error', duration, msg)
      return { syncType: 'cari', status: 'error', itemsSynced: 0, errors: 1, duration, errorMessage: msg }
    }
  }

  // ─── Sync: Döviz Kurları (ExRates → ExchangeRate) ───────────────────────

  /**
   * Netsis'ten döviz kurlarını çeker.
   */
  async syncExchangeRates(): Promise<NetsisSyncResult> {
    const startTime = Date.now()

    if (!this.configured) {
      return { syncType: 'exchangeRates', status: 'skipped', itemsSynced: 0, errors: 0, duration: 0 }
    }

    await this.markSyncRunning('exchangeRates')

    try {
      const rates = await this.fetchAllPages<NetsisExRate>('/api/v2/ExRates', 100)

      let updated = 0, errors = 0

      for (const rate of rates) {
        if (!rate.ISIM || !rate.DOV_ALIS) continue
        try {
          await this.prisma.exchangeRate.upsert({
            where: { currency: rate.ISIM.toUpperCase() },
            create: {
              currency: rate.ISIM.toUpperCase(),
              rate: rate.DOV_ALIS,
              liveRate: rate.DOV_ALIS,
              source: 'netsis',
              lastUpdated: new Date(),
            },
            update: {
              rate: rate.DOV_ALIS,
              liveRate: rate.DOV_ALIS,
              source: 'netsis',
              lastUpdated: new Date(),
            },
          })
          updated++
        } catch (err) {
          errors++
          this.logger.error(`Kur sync hatası [${rate.ISIM}]:`, (err as Error).message)
        }
      }

      const duration = Date.now() - startTime
      await this.updateSyncStatus('exchangeRates', updated, errors, 'success', duration)
      this.logger.log(`Döviz kuru sync tamamlandı: ${updated} kur, ${duration}ms`)

      return { syncType: 'exchangeRates', status: 'success', itemsSynced: updated, errors, duration }
    } catch (err) {
      const duration = Date.now() - startTime
      const msg = (err as Error).message
      this.logger.error('Kur sync başarısız:', msg)
      await this.updateSyncStatus('exchangeRates', 0, 1, 'error', duration, msg)
      return { syncType: 'exchangeRates', status: 'error', itemsSynced: 0, errors: 1, duration, errorMessage: msg }
    }
  }

  // ─── Sync: Tümü ─────────────────────────────────────────────────────────

  /**
   * Sıralı olarak tüm sync işlemlerini çalıştırır.
   */
  async syncAll(): Promise<NetsisSyncResult[]> {
    const results: NetsisSyncResult[] = []

    results.push(await this.syncProducts())
    results.push(await this.syncCari())
    results.push(await this.syncExchangeRates())

    return results
  }

  // ─── Yardımcı ───────────────────────────────────────────────────────────

  async getStatus(syncType: string) {
    return this.prisma.netsisSync.findUnique({ where: { syncType } })
  }

  async getAllStatus() {
    return this.prisma.netsisSync.findMany({ orderBy: { syncType: 'asc' } })
  }

  /** API bağlantısını test et — ping atar */
  async healthCheck(): Promise<{ ok: boolean; version?: string; error?: string }> {
    if (!this.configured) {
      return { ok: false, error: 'Netsis API yapılandırılmadı' }
    }

    try {
      const client = await this.apiClient()
      const [pingRes, versionRes] = await Promise.all([
        client.get('/api/v2/public/Ping'),
        client.get('/api/v2/public/Version'),
      ])
      return { ok: true, version: versionRes.data }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private async markSyncRunning(syncType: string) {
    await this.prisma.netsisSync.upsert({
      where: { syncType },
      create: { syncType, status: 'running' },
      update: { status: 'running' },
    })
  }

  private async updateSyncStatus(
    syncType: string,
    itemsSynced: number,
    errors: number,
    status: string,
    duration: number,
    errorMessage?: string,
  ) {
    await this.prisma.netsisSync.upsert({
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
        nextScheduledAt: this.calculateNext(syncType),
      },
    })
  }

  private calculateNext(syncType: string): Date {
    const next = new Date()
    switch (syncType) {
      case 'stock': next.setMinutes(next.getMinutes() + 30); break       // 30 dk
      case 'cari': next.setHours(next.getHours() + 2); break             // 2 saat
      case 'exchangeRates': next.setHours(next.getHours() + 6); break    // 6 saat
      default: next.setHours(next.getHours() + 1); break                 // 1 saat (products)
    }
    return next
  }
}
