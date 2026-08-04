import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { PrismaService } from '../../common/prisma.service'
import type {
  NetsisLoginRequest,
  NetsisTokenResponse,
  NetsisApiResponse,
  NetsisItemResponse,
  NetsisItemTemelBilgi,
  NetsisItemEkBilgi,
  NetsisItemPrimInfo,
  NetsisARPsResponse,
  NetsisCariTemelBilgi,
  NetsisExRate,
  NetsisForEx,
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
  /** Devam eden token isteği — eşzamanlı çağrılar bunu bekler (bkz. getAccessToken) */
  private tokenInFlight: Promise<string> | null = null

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
      // DbType=1 (vtMSSQL) sabit kodluydu ve 2026-07-31'de KARARSIZ çıktı:
      // bazen token veriyor, bazen "Login Failed / DB Kullanıcı Adı-Şifre
      // Kontrol Ediniz" hatası (bu yüzden scheduler saatlerce aralıklı
      // başarısız oldu). DbType=0 aynı hesapla defalarca test edildi,
      // hep güvenilir. Env ile override edilebilir, varsayılan artık 0.
      DbType: Number(this.configService.get<string>('NETSIS_DB_TYPE') ?? '0'),
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

    // EŞZAMANLILIK KORUMASI (singleflight): saat başında stok+ürün+cari
    // sync'leri AYNI ANDA tetikleniyor. Bu koruma olmadan üçü de cache boş
    // görüp ayrı ayrı token isteği atıyordu; Netsis eşzamanlı login'leri
    // reddedip 401 döndürüyordu (2026-08-01: scheduler saatlerce
    // "Request failed with status code 401" veriyordu, manuel sync ise
    // sorunsuz çalışıyordu — fark tam olarak buydu). Artık ilk çağrı token
    // isterken diğerleri aynı promise'i bekler, tek istek gider.
    if (this.tokenInFlight) {
      return this.tokenInFlight
    }
    this.tokenInFlight = this.requestNewToken().finally(() => {
      this.tokenInFlight = null
    })
    return this.tokenInFlight
  }

  /** Netsis'ten yeni token alır (yalnızca getAccessToken çağırmalı). */
  private async requestNewToken(): Promise<string> {
    this.logger.debug('Yeni access token alınıyor...')

    try {
      // NetOpenX REST token endpoint'i OAuth2 password grant formatında
      // application/x-www-form-urlencoded bekler (JSON değil!)
      const params = new URLSearchParams()
      params.append('grant_type', 'password')
      params.append('username', this.loginRequest.NetsisUser)
      params.append('password', this.loginRequest.NetsisPassword)
      params.append('DbName', this.loginRequest.DbName)
      params.append('DbUser', this.loginRequest.DbUser)
      params.append('DbPassword', this.loginRequest.DbPassword)
      params.append('BranchCode', String(this.loginRequest.BranchCode))
      params.append('DbType', String(this.loginRequest.DbType))

      const res = await axios.post<NetsisTokenResponse>(
        `${this.apiUrl}/token`,
        params.toString(),
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
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
        await axios.get(`${this.apiUrl}/revoke`, {
          headers: { Authorization: `Bearer ${this.tokenCache.accessToken}` },
          timeout: 5000,
        })
      } catch { /* revoke başarısız olursa önemsiz */ }
    }
    this.tokenCache = null
    return this.getAccessToken()
  }

  /**
   * Aktif token'ı Netsis'te iptal eder ve cache'i temizler.
   *
   * NEDEN ÖNEMLİ: Netsis lisansı EŞZAMANLI kullanıcı (koltuk) sayısıyla
   * sınırlı. Her token bir koltuk tutar. Sync işi bitince token'ı bırakmazsak
   * koltuk 20 dk boşuna dolu kalır ve fabrikanın muhasebe/entegra kullanıcıları
   * "SsoMaxUserCountExceeded" hatası alabilir. Bu yüzden her sync turundan sonra
   * token bırakılır — koltuk yalnızca senkron süresince (saniyeler) tutulur.
   *
   * Best-effort: iptal başarısız olsa da cache temizlenir (token 20 dk sonra
   * zaten kendiliğinden düşer).
   */
  async releaseToken(): Promise<void> {
    if (!this.tokenCache?.accessToken) return
    try {
      await axios.get(`${this.apiUrl}/revoke`, {
        headers: { Authorization: `Bearer ${this.tokenCache.accessToken}` },
        timeout: 5000,
      })
    } catch { /* önemsiz */ }
    this.tokenCache = null
  }

  // ─── Sipariş Yazma (Sadoksan → Netsis, ftSSip Satış Siparişi) ───────────

  /**
   * Sadoksan siparişini Netsis'e SATIŞ SİPARİŞİ (ftSSip) olarak yazar.
   * Fatura/irsaliye KESMEZ — onları muhasebe programı Netsis'te kendi keser.
   *
   * ⚠️ ÖZELLİK BAYRAĞI: Yalnızca NETSIS_ORDER_PUSH_ENABLED=true iken çalışır.
   * Varsayılan KAPALI — çünkü canlı SADOKSAN2026'ya yanlış sipariş yazmak
   * geri alınamaz. Önce SADOKSAN_TEST (SADOKSAN2026 kopyası) üzerinde test
   * edilecek, sonra açılacak.
   *
   * Payload yapısı 2026-07-24'te ENTEGRE9'da gerçek API ile doğrulandı:
   * belge no TAM 15 karakter, depo 0, StokKodu=product.netsisCode.
   */
  async pushSalesOrder(orderId: string): Promise<{ ok: boolean; netsisNo?: string; error?: string }> {
    if (process.env.NETSIS_ORDER_PUSH_ENABLED !== 'true') {
      this.logger.debug('Netsis sipariş push kapalı (NETSIS_ORDER_PUSH_ENABLED != true)')
      return { ok: false, error: 'push_disabled' }
    }
    if (!this.configured) return { ok: false, error: 'netsis_not_configured' }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: { include: { product: true } }, dealer: true },
    })
    if (!order) return { ok: false, error: 'order_not_found' }
    if (!order.dealer?.cariNo) return { ok: false, error: 'dealer_cariNo_missing' }

    // Depo: Fabrika depoyu ELLE girmek istiyor (personel kararı). Ancak Netsis
    // API'si sipariş oluştururken GEÇERLİ bir depo kodu ZORUNLU kılıyor
    // (2026-07-29 test: boş/null/0/-1 hepsi "Kalem Depo Kodu Geçersiz" ile
    // reddedildi). Bu yüzden sipariş, geçici bir depoyla (varsayılan 15610 —
    // ana satış deposu, mevcut tüm site siparişlerinin kullandığı) yazılır;
    // personel Netsis'te asıl depoyu elle değiştirir/onaylar. NETSIS_ORDER_DEPO_KODU
    // ile değiştirilebilir.
    const depoKodu = parseInt(process.env.NETSIS_ORDER_DEPO_KODU || '15610', 10)

    try {
      const client = await this.apiClient()

      const kalems: any[] = []
      for (let i = 0; i < order.lines.length; i++) {
        const line = order.lines[i]
        const stokKodu = line.product?.netsisCode
        if (!stokKodu) {
          return { ok: false, error: `line_${i}_netsisCode_missing (${line.product?.name})` }
        }
        const kdvOrani = Math.round((line.product?.taxRate ?? 0.2) * 100)
        kalems.push({
          StokKodu: stokKodu,
          Sira: i + 1,
          DEPO_KODU: depoKodu,
          STra_GCMIK: line.quantity,
          STra_NF: line.unitPrice,
          STra_BF: line.unitPrice,
          STra_KDV: kdvOrani,
          STra_DOVTIP: 0,
          STra_HTUR: 'H', // Hareket türü — gerçek ftSSip siparişinden (2026-07-29)
        })
      }

      const now = new Date()
      const d = now.toISOString().slice(0, 10) + ' 00:00:00'
      const belgeNo = this.buildNetsisOrderNo(order.orderNo)

      const payload = {
        Seri: 'A',
        FatUst: {
          Sube_Kodu: 0,
          CariKod: order.dealer.cariNo,
          FATIRS_NO: belgeNo,
          Tarih: d, ENTEGRE_TRH: d, FiiliTarih: d, SIPARIS_TEST: d,
          // Tip: 7 = SATIŞ SİPARİŞİ. 2026-07-29 SADOKSANTEST'te gerçek ftSSip
          // siparişinden doğrulandı. Tip: 2 FATURA demek — o değerle Netsis
          // "sipariş bağlantısız fatura kaydı yapamazsınız" hatası veriyordu.
          Tip: 7, TIPI: 2, KOD2: '2', EXPORTTYPE: 0,
          KDV_DAHILMI: false,
          DOVIZTIP: 0,
        },
        Kalems: kalems,
        docType: 'ftSSip',
      }

      const res = await client.post('/ItemSlips?docType=ftSSip', payload)
      const ok = res.data?.IsSuccessful === true
      if (ok) {
        this.logger.log(`Sipariş ${order.orderNo} → Netsis ftSSip yazıldı: ${belgeNo}`)
        // Netsis sipariş numarasını sakla (eIrsaliyeNo alanı — ayrı alan
        // eklenene kadar pragmatik; TODO: dedike netsisOrderNo alanı)
        await this.prisma.order.update({
          where: { id: orderId },
          data: { eIrsaliyeNo: belgeNo },
        }).catch(() => {})
        return { ok: true, netsisNo: belgeNo }
      }
      const err = String(res.data?.ErrorDesc || 'bilinmeyen hata').split('\r')[0]
      this.logger.error(`Sipariş ${order.orderNo} → Netsis reddedildi: ${err}`)
      return { ok: false, error: err }
    } catch (e) {
      const msg = (e as Error).message
      this.logger.error(`Sipariş ${order.orderNo} → Netsis push hatası: ${msg}`)
      return { ok: false, error: msg }
    } finally {
      await this.releaseToken()
    }
  }

  /**
   * Netsis belge numarası TAM 15 karakter olmalı (2026-07-24 doğrulandı,
   * hata kodu 204). Fabrikanın gerçek site siparişleri "ENT1-0000000864"
   * formatında (2026-07-29 doğrulandı): önek + sıfır dolgulu sıra no.
   *
   * Önek NETSIS_ORDER_PREFIX ile ayarlanır (varsayılan "ENT1-"). Sadoksan
   * orderNo rakamları kalan haneye sıfır dolgusuyla yazılır. Sadoksan
   * numaraları (SDK-2026-5001 → büyük) mevcut İdeasoft ENT1- sırasından
   * (küçük: 864, 879) farklı aralıkta olduğu için çakışma olmaz.
   * NOT: Canlıya geçişte İdeasoft'un ENT1- sıra sayacıyla çakışmama
   * stratejisi muhasebeyle son kez teyit edilecek (açık madde).
   */
  private buildNetsisOrderNo(orderNo: string): string {
    const prefix = process.env.NETSIS_ORDER_PREFIX || 'ENT1-'
    const width = Math.max(1, 15 - prefix.length)
    const digits = (orderNo.match(/\d+/g) || []).join('').slice(-width)
    return (prefix + digits.padStart(width, '0')).slice(0, 15)
  }

  /**
   * Bir carinin Netsis hesap ekstresini (ARPTransactions) çeker.
   * Bayi kendi dashboard'unda gerçek borç/alacak hareketlerini görsün diye.
   * Netsis yapılandırılmamışsa veya kod boşsa boş dizi döner (çağıran taraf
   * yerel veriye düşer).
   */
  async getCariTransactions(cariNo: string, limit = 50): Promise<Array<{
    date: string | null; description: string; debit: number; credit: number; dueDate: string | null
  }>> {
    if (!this.configured) return []
    const code = this.normalizeCode(cariNo)
    if (!code) return []
    try {
      const client = await this.apiClient()
      const res = await client.get(
        `/ARPTransactions?cariKod=${encodeURIComponent(code)}&limit=${limit}&sort=${encodeURIComponent('Tarih DESC')}`,
      )
      const rows = res.data?.Data || []
      return rows.map((r: any) => ({
        date: r.Tarih ?? null,
        description: (r.Aciklama || '').trim(),
        debit: r.Borc || 0,
        credit: r.Alacak || 0,
        dueDate: r.Vade_Tarihi ?? null,
      }))
    } catch (e) {
      this.logger.error(`Cari hareket çekilemedi [${code}]: ${(e as Error).message}`)
      return []
    } finally {
      await this.releaseToken()
    }
  }

  /**
   * Netsis'te bir cari kodunun gerçekten var olup olmadığını doğrular ve
   * bulursa ünvan/bakiye bilgisini döner (CM_BORCT = cari borç bakiyesi).
   *
   * Panelde yeni bayi eklenirken cari no doğrulaması için kullanılır — eskiden
   * böyle bir uç yoktu ve panel sessizce sahte (regex) doğrulamaya düşüyordu.
   */
  async lookupCari(cariNo: string): Promise<{
    valid: boolean
    reason?: string
    company?: string
    balance?: number
  }> {
    if (!this.configured) {
      return { valid: false, reason: 'Netsis bağlantısı yapılandırılmadı' }
    }
    const code = this.normalizeCode(cariNo)
    if (!code) {
      return { valid: false, reason: 'Cari kodu boş' }
    }
    try {
      const client = await this.apiClient()
      const q = encodeURIComponent(`CARI_KOD='${code.replace(/'/g, "''")}'`)
      const res = await client.get(`/ARPs?q=${q}&limit=1`)
      const row = (res.data?.Data || [])[0]
      const t = row?.CariTemelBilgi
      if (!t) {
        return { valid: false, reason: 'Netsis cari hesabı bulunamadı' }
      }
      return {
        valid: true,
        company: (t.CARI_ISIM || '').trim() || undefined,
        balance: typeof t.CM_BORCT === 'number' ? t.CM_BORCT : undefined,
      }
    } catch (e) {
      this.logger.error(`Cari doğrulanamadı [${code}]: ${(e as Error).message}`)
      return { valid: false, reason: 'Netsis sorgusu başarısız' }
    } finally {
      await this.releaseToken()
    }
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
   * NetOpenX REST response formatı: { IsSuccessful: true, Data: [...], TotalCount: N }
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
        const res = await client.get<NetsisApiResponse<T>>(url)
        const body = res.data

        if (!body.IsSuccessful) {
          this.logger.warn(`${endpoint}: IsSuccessful=false, ${body.ErrorDesc || ''}`)
          break
        }

        const items = body.Data || []
        all.push(...items)
        offset += items.length
        hasMore = items.length === pageSize
      } catch (err) {
        // Token expired → refresh and retry once
        if ((err as any)?.response?.status === 401) {
          this.logger.debug('Token expired, yenileniyor...')
          this.tokenCache = null
          const newClient = await this.apiClient()
          const retryRes = await newClient.get<NetsisApiResponse<T>>(url)
          const body = retryRes.data
          if (body.IsSuccessful) {
            const items = body.Data || []
            all.push(...items)
            offset += items.length
            hasMore = items.length === pageSize
          }
          continue
        }
        throw err
      }
    }

    return all
  }

  // ─── Sync: Ürünler (Items → Product) ────────────────────────────────────

  /**
   * Netsis kod alanlarını normalize eder.
   *
   * Netsis gerçek verisinde kodlar baş/son boşluk ve TAB içeriyor
   * (ör. " 5082-3065-02-00014\t"). Trim edilmezse aynı ürün için
   * mükerrer kayıt oluşur ve eşleşmeler tutmaz.
   *
   * Boş/eksik kod null döner — çağıran taraf bu kaydı ATLAMALI.
   * Kritik: Prisma'da `where: { alan: undefined }` filtreyi tamamen
   * yok sayar, updateMany o durumda TÜM tabloyu günceller.
   */
  private normalizeCode(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  /**
   * Netsis KDV oranını Sadoksan formatına çevirir.
   * Netsis yüzde olarak verir (20.0), şemamız oran bekler (0.20).
   */
  private normalizeTaxRate(value: unknown): number | undefined {
    if (typeof value !== 'number' || !isFinite(value)) return undefined
    return value > 1 ? value / 100 : value
  }

  /**
   * Netsis'ten tüm stok kartlarını çeker, Product tablosuna yazar.
   *
   * Netsis → Sadoksan mapping:
   *   Stok_Kodu    → netsisCode, sku (trim edilir)
   *   Stok_Adi     → name
   *   Miktar       → netsisStock, displayStock hesaplanır
   *   KDV_Orani    → taxRate (yüzde → oran)
   *   Satis_Fiat1  → basePrice
   */
  async syncProducts(): Promise<NetsisSyncResult> {
    const startTime = Date.now()

    if (!this.configured) {
      this.logger.warn('Netsis yapılandırılmadı — ürün sync atlandı')
      return { syncType: 'products', status: 'skipped', itemsSynced: 0, errors: 0, duration: 0 }
    }

    await this.markSyncRunning('products')

    try {
      // Items endpoint'i her kaydı {StokTemelBilgi, StokEkBilgi} olarak döner
      const items = await this.fetchAllPages<NetsisItemResponse>('/Items', 500)

      let created = 0, updated = 0, errors = 0

      let skipped = 0

      for (const row of items) {
        const item = row.StokTemelBilgi
        const code = this.normalizeCode(item?.Stok_Kodu)
        if (!code) {
          skipped++
          continue
        }

        const name = this.normalizeCode(item.Stok_Adi) || code
        const taxRate = this.normalizeTaxRate(item.KDV_Orani)

        try {
          await this.prisma.product.upsert({
            where: { netsisCode: code },
            create: {
              netsisCode: code,
              sku: code,
              name,
              brand: '',
              category: '',
              unit: 'adet',
              basePrice: item.Satis_Fiat1 || 0,
              taxRate: taxRate ?? 0.2,
              netsisStock: Math.round(item.Miktar || 0),
              displayStock: Math.round(item.Miktar || 0),
              syncStatus: 'SYNCED',
              lastNetsisSync: new Date(),
              // Netsis'ten YENİ gelen ürün asla otomatik yayına girmez:
              // markası/kategorisi/görseli/açıklaması yok. Admin panelden
              // tamamlanıp elle görünür yapılır. (Product.visible default'u
              // true — burada açıkça ezilmezse SADOKSAN2026'daki 5000+ kayıt
              // storefront'a çöp ürün olarak düşer.)
              visible: false,
              purchasable: false,
            },
            update: {
              name,
              basePrice: item.Satis_Fiat1 ?? undefined,
              taxRate,
              netsisStock: Math.round(item.Miktar || 0),
              syncStatus: 'SYNCED',
              lastNetsisSync: new Date(),
            },
          })
          updated++
        } catch (err) {
          errors++
          this.logger.error(`Ürün sync hatası [${code}]:`, (err as Error).message)
        }
      }

      if (skipped > 0) {
        this.logger.warn(`Ürün sync: ${skipped} kayıt geçersiz stok kodu nedeniyle atlandı`)
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
      const items = await this.fetchAllPages<NetsisItemPrimInfo>('/Items/PrimInfo', 1000)

      let updated = 0, errors = 0

      let skipped = 0

      for (const item of items) {
        const code = this.normalizeCode(item?.Stok_Kodu)
        if (!code) {
          skipped++
          continue
        }

        try {
          await this.prisma.product.updateMany({
            where: { netsisCode: code },
            data: {
              netsisStock: Math.round(item.Miktar || 0),
              lastNetsisSync: new Date(),
            },
          })
          updated++
        } catch (err) {
          errors++
          this.logger.error(`Stok sync hatası [${code}]:`, (err as Error).message)
        }
      }

      if (skipped > 0) {
        this.logger.warn(`Stok sync: ${skipped} kayıt geçersiz stok kodu nedeniyle atlandı`)
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
   *   CARI_KOD  → cariNo ile eşleştirme (sadece doğrulama)
   *
   * cariBalance / creditLimit BU SYNC'TE YAZILMAZ — gerekçe için
   * aşağıdaki uygulama notuna bakın.
   */
  async syncCari(): Promise<NetsisSyncResult> {
    const startTime = Date.now()

    if (!this.configured) {
      this.logger.warn('Netsis yapılandırılmadı — cari sync atlandı')
      return { syncType: 'cari', status: 'skipped', itemsSynced: 0, errors: 0, duration: 0 }
    }

    await this.markSyncRunning('cari')

    try {
      const arpsList = await this.fetchAllPages<NetsisARPsResponse>('/ARPs', 500)

      let updated = 0, errors = 0

      let skipped = 0

      for (const row of arpsList) {
        const arp: Record<string, unknown> = (row.CariTemelBilgi ?? {}) as any
        // Gerçek SADOKSAN2026 verisinde alan adı CARI_KOD (tamamen büyük harf).
        // Eski kod Cari_Kod okuyordu → undefined → Prisma filtreyi yok sayıp
        // TÜM bayileri güncelliyordu. Her iki yazımı da tolere ediyoruz.
        const cariKod = this.normalizeCode(arp.CARI_KOD ?? arp.Cari_Kod)
        if (!cariKod) {
          skipped++
          continue
        }

        // Bakiye kaynağı = CM_BORCT (Cari Muhasebe Borç Toplamı).
        // 2026-07-24 gerçek SADOKSAN2026 verisiyle doğrulandı: 466 bayide
        // sıfır-olmayan, gerçekçi değerler (ör. 1.6M, 321K TL). Pozitif =
        // bize borçlu (bizim cariBalance konvansiyonuyla aynı). Eski denenen
        // yollar yanlıştı: ARPs/Risk hep 0 (limit aşım riski), ARPTransactions
        // ham toplamı döviz karışımından şişiyordu. CM_BORCT authoritative.
        // Kredi limiti Netsis'ten GELMEZ — panelden manuel ayarlanıyor
        // (updateCreditLimit), o yüzden burada limit'e DOKUNULMUYOR.
        const cmBorct = typeof arp.CM_BORCT === 'number' ? arp.CM_BORCT : null

        try {
          const result = await this.prisma.dealer.updateMany({
            where: { cariNo: cariKod },
            data: {
              cariValidated: true,
              ...(cmBorct !== null ? { cariBalance: cmBorct } : {}),
            },
          })
          updated += result.count
        } catch (err) {
          errors++
          this.logger.error(`Cari sync hatası [${cariKod}]:`, (err as Error).message)
        }
      }

      if (skipped > 0) {
        this.logger.warn(`Cari sync: ${skipped} kayıt geçersiz cari kod nedeniyle atlandı`)
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
      // ExRates ve ForExs'i paralel çek — ExRates'te ISIM yok, ForExs ile Sira üzerinden eşleşir
      const [rates, forexList] = await Promise.all([
        this.fetchAllPages<NetsisExRate>('/ExRates', 100),
        this.fetchAllPages<NetsisForEx>('/ForExs', 100),
      ])

      // Sira → ISIM map
      const forexMap = new Map<number, string>()
      for (const fx of forexList) {
        forexMap.set(fx.Sira, fx.ISIM)
      }

      let updated = 0, errors = 0

      for (const rate of rates) {
        const currency = forexMap.get(rate.Sira)
        if (!currency || !rate.DOV_ALIS) continue
        try {
          await this.prisma.exchangeRate.upsert({
            where: { currency: currency.toUpperCase() },
            create: {
              currency: currency.toUpperCase(),
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
          this.logger.error(`Kur sync hatası [${currency}]:`, (err as Error).message)
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

    try {
      results.push(await this.syncProducts())
      results.push(await this.syncCari())
      results.push(await this.syncExchangeRates())
    } finally {
      // Koltuğu bırak — hepsi tek token'ı paylaştı, iş bitti (bkz. releaseToken)
      await this.releaseToken()
    }

    return results
  }

  // ─── Yardımcı ───────────────────────────────────────────────────────────

  async getStatus(syncType: string) {
    return this.prisma.netsisSync.findUnique({ where: { syncType } })
  }

  async getAllStatus() {
    return this.prisma.netsisSync.findMany({ orderBy: { syncType: 'asc' } })
  }

  /**
   * Stok verisinin tazeliğini raporlar.
   *
   * Neden gerekli: Netsis bağlantısı koptuğunda site çalışmaya devam eder
   * ama stok/fiyat dondurulmuş kalır — Netsis'te biten mal sitede "var"
   * görünür ve olmayan mal satılır. 2026-07'de tünel 9 gün kopuk kaldı ve
   * bu durum panelden görülemiyordu.
   *
   * Eşikler: 1 günden yeni = taze, 3 güne kadar = uyarı, sonrası = bayat.
   */
  async getDataFreshness(): Promise<{
    lastSync: Date | null
    hoursStale: number | null
    daysStale: number | null
    status: 'fresh' | 'warning' | 'stale' | 'never'
    syncedProducts: number
    message: string
  }> {
    const agg = await this.prisma.product.aggregate({
      _max: { lastNetsisSync: true },
      _count: { lastNetsisSync: true },
    })

    const lastSync = agg._max.lastNetsisSync
    const syncedProducts = agg._count.lastNetsisSync

    if (!lastSync) {
      return {
        lastSync: null,
        hoursStale: null,
        daysStale: null,
        status: 'never',
        syncedProducts: 0,
        message: 'Netsis senkronizasyonu hiç çalışmadı.',
      }
    }

    const hoursStale = Math.floor((Date.now() - lastSync.getTime()) / 3_600_000)
    const daysStale = Math.floor(hoursStale / 24)

    const status: 'fresh' | 'warning' | 'stale' =
      hoursStale < 24 ? 'fresh' : daysStale < 3 ? 'warning' : 'stale'

    const message =
      status === 'fresh'
        ? 'Stok verisi güncel.'
        : status === 'warning'
          ? `Stok verisi ${daysStale} gündür güncellenmedi.`
          : `Stok verisi ${daysStale} gündür güncellenmedi — ` +
            `Netsis bağlantısı kopuk olabilir. Stok ve fiyatlar gerçeği yansıtmıyor olabilir.`

    return { lastSync, hoursStale, daysStale, status, syncedProducts, message }
  }

  /** API bağlantısını test et — ping atar */
  async healthCheck(): Promise<{ ok: boolean; version?: string; error?: string }> {
    if (!this.configured) {
      return { ok: false, error: 'Netsis API yapılandırılmadı' }
    }

    try {
      const client = await this.apiClient()
      const [pingRes, versionRes] = await Promise.all([
        client.get('/public/Ping'),
        client.get('/public/Version'),
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

  // ─── Push: Fabrika PC'den veri kabul etme ──────────────────────────────

  /**
   * Fabrikadaki push-agent'tan gelen stok kartlarını alır, Product tablosuna yazar.
   * Pull-sync'ten farklı olarak Netsis API'yi çağırmaz — veri zaten hazır gelir.
   */
  async pushProducts(items: NetsisItemTemelBilgi[]): Promise<NetsisSyncResult> {
    const startTime = Date.now()
    let created = 0, updated = 0, errors = 0

    await this.markSyncRunning('products-push')

    for (const item of items) {
      try {
        await this.prisma.product.upsert({
          where: { netsisCode: item.Stok_Kodu },
          create: {
            netsisCode: item.Stok_Kodu,
            sku: item.Stok_Kodu,
            name: item.Stok_Adi || item.Stok_Kodu,
            brand: '',
            category: '',
            unit: 'adet',
            basePrice: item.Satis_Fiat1 || 0,
            taxRate: item.KDV_Orani || 0.2,
            netsisStock: Math.round(item.Miktar || 0),
            displayStock: Math.round(item.Miktar || 0),
            syncStatus: 'SYNCED',
            lastNetsisSync: new Date(),
          },
          update: {
            name: item.Stok_Adi || undefined,
            basePrice: item.Satis_Fiat1 ?? undefined,
            taxRate: item.KDV_Orani ?? undefined,
            netsisStock: Math.round(item.Miktar || 0),
            syncStatus: 'SYNCED',
            lastNetsisSync: new Date(),
          },
        })
        updated++
      } catch (err) {
        errors++
        this.logger.error(`Push ürün hatası [${item.Stok_Kodu}]:`, (err as Error).message)
      }
    }

    const duration = Date.now() - startTime
    await this.updateSyncStatus('products', updated, errors, 'success', duration)
    this.logger.log(`Push ürün tamamlandı: ${updated} kayıt, ${errors} hata, ${duration}ms`)
    return { syncType: 'products', status: 'success', itemsSynced: updated, errors, duration }
  }

  /**
   * Fabrikadaki push-agent'tan gelen stok özetlerini alır.
   */
  async pushStock(items: NetsisItemPrimInfo[]): Promise<NetsisSyncResult> {
    const startTime = Date.now()
    let updated = 0, errors = 0

    await this.markSyncRunning('stock-push')

    for (const item of items) {
      try {
        const result = await this.prisma.product.updateMany({
          where: { netsisCode: item.Stok_Kodu },
          data: {
            netsisStock: Math.round(item.Miktar || 0),
            lastNetsisSync: new Date(),
          },
        })
        updated += result.count
      } catch (err) {
        errors++
        this.logger.error(`Push stok hatası [${item.Stok_Kodu}]:`, (err as Error).message)
      }
    }

    // displayStock = netsisStock - pending - reserved
    await this.prisma.$executeRawUnsafe(`
      UPDATE "Product"
      SET "displayStock" = "netsisStock" - "netsisPendingQuantity" - "reservedStock"
      WHERE "lastNetsisSync" >= NOW() - INTERVAL '2 minutes'
    `)

    const duration = Date.now() - startTime
    await this.updateSyncStatus('stock', updated, errors, 'success', duration)
    this.logger.log(`Push stok tamamlandı: ${updated} kayıt, ${duration}ms`)
    return { syncType: 'stock', status: 'success', itemsSynced: updated, errors, duration }
  }

  /**
   * Fabrikadaki push-agent'tan gelen cari hesap verilerini alır.
   */
  async pushCari(arpsList: NetsisCariTemelBilgi[]): Promise<NetsisSyncResult> {
    const startTime = Date.now()
    let updated = 0, errors = 0

    await this.markSyncRunning('cari-push')

    for (const arp of arpsList) {
      try {
        const result = await this.prisma.dealer.updateMany({
          where: { cariNo: arp.Cari_Kod },
          data: {
            cariBalance: -(arp.Borclanan_Tutar || 0),
            creditLimit: arp.Kredi_Limiti || 0,
            cariValidated: true,
          },
        })
        updated += result.count
      } catch (err) {
        errors++
        this.logger.error(`Push cari hatası [${arp.Cari_Kod}]:`, (err as Error).message)
      }
    }

    const duration = Date.now() - startTime
    await this.updateSyncStatus('cari', updated, errors, 'success', duration)
    this.logger.log(`Push cari tamamlandı: ${updated} bayi, ${duration}ms`)
    return { syncType: 'cari', status: 'success', itemsSynced: updated, errors, duration }
  }

  /**
   * Fabrikadaki push-agent'tan gelen döviz kurlarını alır.
   */
  async pushExchangeRates(rates: NetsisExRate[]): Promise<NetsisSyncResult> {
    const startTime = Date.now()
    let updated = 0, errors = 0

    await this.markSyncRunning('exchangeRates-push')

    // Not: ExRates'te ISIM yok. Push-agent forexMap'i zaten çözmüş olarak
    // her rate'e currency eklemiş olmalı. Biz (rate as any).currency bekleriz.
    for (const rate of rates) {
      const currency = (rate as any).currency || (rate as any).ISIM
      if (!currency || !rate.DOV_ALIS) continue
      try {
        await this.prisma.exchangeRate.upsert({
          where: { currency: currency.toUpperCase() },
          create: {
            currency: currency.toUpperCase(),
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
        this.logger.error(`Push kur hatası [${currency}]:`, (err as Error).message)
      }
    }

    const duration = Date.now() - startTime
    await this.updateSyncStatus('exchangeRates', updated, errors, 'success', duration)
    this.logger.log(`Push kur tamamlandı: ${updated} kur, ${duration}ms`)
    return { syncType: 'exchangeRates', status: 'success', itemsSynced: updated, errors, duration }
  }

  // ─── Bayi İçe Aktarma (ARPs → Dealer) ───────────────────────────────────

  /** İl → lojistik bölge eşlemesi (Dealer.region). */
  private static readonly IL_BOLGE: Record<string, string> = {
    İSTANBUL: 'Marmara', BURSA: 'Marmara', KOCAELİ: 'Marmara', BALIKESİR: 'Marmara',
    TEKİRDAĞ: 'Marmara', EDİRNE: 'Marmara', KIRKLARELİ: 'Marmara', ÇANAKKALE: 'Marmara',
    YALOVA: 'Marmara', BİLECİK: 'Marmara', SAKARYA: 'Marmara',
    İZMİR: 'Ege', MANİSA: 'Ege', AYDIN: 'Ege', DENİZLİ: 'Ege', MUĞLA: 'Ege',
    AFYONKARAHİSAR: 'Ege', KÜTAHYA: 'Ege', UŞAK: 'Ege',
    ANTALYA: 'Akdeniz', ADANA: 'Akdeniz', MERSİN: 'Akdeniz', HATAY: 'Akdeniz',
    ISPARTA: 'Akdeniz', BURDUR: 'Akdeniz', OSMANİYE: 'Akdeniz', KAHRAMANMARAŞ: 'Akdeniz',
    ANKARA: 'İç Anadolu', KONYA: 'İç Anadolu', KAYSERİ: 'İç Anadolu', ESKİŞEHİR: 'İç Anadolu',
    SİVAS: 'İç Anadolu', YOZGAT: 'İç Anadolu', AKSARAY: 'İç Anadolu', KARAMAN: 'İç Anadolu',
    KIRIKKALE: 'İç Anadolu', KIRŞEHİR: 'İç Anadolu', NEVŞEHİR: 'İç Anadolu',
    NİĞDE: 'İç Anadolu', ÇANKIRI: 'İç Anadolu',
    SAMSUN: 'Karadeniz', TRABZON: 'Karadeniz', ORDU: 'Karadeniz', RİZE: 'Karadeniz',
    GİRESUN: 'Karadeniz', TOKAT: 'Karadeniz', AMASYA: 'Karadeniz', ÇORUM: 'Karadeniz',
    KASTAMONU: 'Karadeniz', SİNOP: 'Karadeniz', BARTIN: 'Karadeniz', ZONGULDAK: 'Karadeniz',
    KARABÜK: 'Karadeniz', BOLU: 'Karadeniz', DÜZCE: 'Karadeniz', ARTVİN: 'Karadeniz',
    GÜMÜŞHANE: 'Karadeniz', BAYBURT: 'Karadeniz',
    ERZURUM: 'Doğu Anadolu', VAN: 'Doğu Anadolu', MALATYA: 'Doğu Anadolu',
    ELAZIĞ: 'Doğu Anadolu', ERZİNCAN: 'Doğu Anadolu', AĞRI: 'Doğu Anadolu',
    KARS: 'Doğu Anadolu', MUŞ: 'Doğu Anadolu', BİTLİS: 'Doğu Anadolu',
    HAKKARİ: 'Doğu Anadolu', IĞDIR: 'Doğu Anadolu', ARDAHAN: 'Doğu Anadolu',
    BİNGÖL: 'Doğu Anadolu', TUNCELİ: 'Doğu Anadolu',
    GAZİANTEP: 'Güneydoğu', ŞANLIURFA: 'Güneydoğu', DİYARBAKIR: 'Güneydoğu',
    MARDİN: 'Güneydoğu', BATMAN: 'Güneydoğu', ADIYAMAN: 'Güneydoğu',
    SİİRT: 'Güneydoğu', ŞIRNAK: 'Güneydoğu', KİLİS: 'Güneydoğu',
  }

  private ilToBolge(il?: string | null): string {
    if (!il) return 'Marmara'
    return NetsisService.IL_BOLGE[il.trim().toLocaleUpperCase('tr-TR')] || 'Marmara'
  }

  /**
   * Netsis cari hesaplarını (ARPs) Dealer olarak içe aktarır.
   *
   * MANUEL çağrılır — otomatik scheduler'a BAĞLI DEĞİL. Netsis'te binlerce
   * cari var ve hepsi bayi değil; kendiliğinden bayi üretmesi istenmez.
   *
   * FİLTRE: CARI_TIP === 'A' (Alıcı/buyer). 2026-07-31 gerçek SADOKSANTEST
   * verisiyle doğrulandı: 1486 ARPs kaydının 1466'sı TIP='A', 16'sı 'S'
   * (satıcı/tedarikçi), kalan 4 diğer. ÖNCEDEN cariNo öneki ('120.' ile
   * başlıyor mu) kullanılıyordu — bu YANLIŞTI: gerçek aktif bayilerin
   * çoğu (~174/271 sipariş veren cari) '2517-N'/'N2517-' önekli, '120.'
   * değil, ve bazı '320.' önekli cariler de TIP='A' (satıcı değil,
   * gerçek alıcı) çıktı. Önek kodlama serisi güvenilir değil, CARI_TIP
   * güvenilir — bu yüzden filtre değiştirildi.
   *
   * Güvenlik davranışı:
   *   - Varsayılan `dryRun: true` — hiçbir şey yazmaz, sadece ne olacağını raporlar
   *   - Sadece CARI_TIP='A' (alıcı) hesaplar — satıcı/tedarikçi alınmaz
   *   - Vergi no'su olmayan kayıt atlanır (taxNo @unique, boşlar çakışır)
   *   - Mevcut cariNo/taxNo varsa DOKUNULMAZ (mevcut bayi ezilmez)
   *   - Oluşan bayi `PENDING` durumunda gelir — admin onaylayana kadar pasif
   *
   * Netsis'te e-posta alanı yok; giriş için yer tutucu bir adres üretilir
   * (`cari-<kod>@netsis.local`) ve şifre rastgele atanır. Bayi gerçekten
   * kullanacaksa admin e-postayı düzeltip şifre sıfırlatmalı.
   */
  async importDealers(options?: {
    dryRun?: boolean
    limit?: number
  }): Promise<{
    dryRun: boolean
    totalFetched: number
    eligible: number
    created: number
    skipped: { existing: number; noCode: number; notBuyerType: number }
    /** Atlanmadı — VKN'si olmadığı için yer tutucu vergi no atanan bayi sayısı */
    placeholderTaxNo: number
    errors: number
    samples: Array<{ cariNo: string; company: string; city: string; region: string; taxNo: string }>
  }> {
    const dryRun = options?.dryRun !== false // varsayılan: TRUE (güvenli)

    if (!this.configured) {
      throw new Error('Netsis yapılandırılmadı — bayi içe aktarma yapılamaz')
    }

    const arpsList = await this.fetchAllPages<NetsisARPsResponse>('/ARPs', 500)

    const skipped = { existing: 0, noCode: 0, notBuyerType: 0 }
    let placeholderTaxNo = 0
    const samples: Array<{ cariNo: string; company: string; city: string; region: string; taxNo: string }> = []
    let eligible = 0, created = 0, errors = 0

    for (const row of arpsList) {
      if (options?.limit && created >= options.limit) break

      const arp: Record<string, any> = (row.CariTemelBilgi ?? {}) as any
      const cariNo = this.normalizeCode(arp.CARI_KOD ?? arp.Cari_Kod)
      if (!cariNo) { skipped.noCode++; continue }
      const cariTip = this.normalizeCode(arp.CARI_TIP ?? arp.Cari_Tip)
      if (cariTip !== 'A') { skipped.notBuyerType++; continue }

      // Vergi no'su OLMAYAN bayiler atlanmaz — 2026-07-31 tespiti: sipariş
      // veren 271 carinin 161'i (%59) VKN'siz (şahıs firmaları, Netsis'te
      // TC ile kayıtlı). Eskiden bunlar atlanıyordu, yani gerçek
      // müşterilerin çoğu içeri alınmıyordu. Dealer.taxNo @unique+zorunlu
      // olduğu için VKN yoksa cari koddan benzersiz yer tutucu üretilir;
      // admin gerçek VKN/TC'yi panelden düzeltebilir.
      const realTaxNo = this.normalizeCode(arp.VERGI_NUMARASI ?? arp.Vergi_No)
      const taxNo = realTaxNo || `VKNYOK-${cariNo}`
      if (!realTaxNo) placeholderTaxNo++ // atlanmadı, sadece yer tutucu VKN aldı

      const company = this.normalizeCode(arp.CARI_ISIM ?? arp.Cari_Isim) || cariNo
      const city = this.normalizeCode(arp.CARI_IL) || ''
      const region = this.ilToBolge(city)

      // Mevcut kayıt kontrolü — cariNo VEYA taxNo eşleşirse dokunma
      const exists = await this.prisma.dealer.findFirst({
        where: { OR: [{ cariNo }, { taxNo }] },
        select: { id: true },
      })
      if (exists) { skipped.existing++; continue }

      eligible++
      if (samples.length < 10) {
        samples.push({ cariNo, company, city, region, taxNo })
      }

      if (dryRun) continue

      try {
        const placeholderEmail = `cari-${cariNo.toLowerCase()}@netsis.local`
        const randomPw = await bcrypt.hash(randomBytes(16).toString('hex'), 10)

        await this.prisma.user.create({
          data: {
            email: placeholderEmail,
            password: randomPw,
            name: company,
            role: 'DEALER',
            phone: this.normalizeCode(arp.CARI_TEL) || undefined,
            city: city || undefined,
            dealer: {
              create: {
                name: company,
                company,
                taxNo,
                taxOffice: this.normalizeCode(arp.VERGI_DAIRESI) || '-',
                cariNo,
                cariValidated: true,
                contactPerson: company,
                phone: this.normalizeCode(arp.CARI_TEL) || '-',
                city: city || '-',
                region,
                address: this.normalizeCode(arp.CARI_ADRES) || '-',
                status: 'PENDING', // admin onaylayana kadar pasif
              },
            },
          },
        })
        created++
      } catch (err) {
        errors++
        this.logger.error(`Bayi import hatası [${cariNo}]:`, (err as Error).message)
      }
    }

    const result = {
      dryRun,
      totalFetched: arpsList.length,
      eligible,
      created,
      skipped,
      placeholderTaxNo,
      errors,
      samples,
    }

    this.logger.log(
      `Bayi import ${dryRun ? '(DENEME)' : '(UYGULANDI)'}: ` +
      `${arpsList.length} cari tarandı, ${eligible} uygun, ${created} oluşturuldu, ` +
      `atlanan(mevcut:${skipped.existing} alıcı değil:${skipped.notBuyerType}), ` +
      `yer tutucu VKN:${placeholderTaxNo}, ${errors} hata`,
    )

    return result
  }
}
