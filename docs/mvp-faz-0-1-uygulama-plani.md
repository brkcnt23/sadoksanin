# MVP Faz 0-1: Stok Modülü Uygulama Planı

**Tarih:** 2026-05-25 | **Güncelleme:** 2026-05-25 (v2 — netsisPendingQuantity + WhatsApp)  
**Kapsam:** Migration + Auth kontrolü + StockService + Admin stok sayfası + Stok formülü düzeltmesi + Stok habercisi WhatsApp

---

## ⚠️ Kritik Gereksinim Güncellemesi (v2)

### Yeni Stok Formülü

Netsis, irsaliye/fatura kesilmeden ürünü gerçek stoktan düşmez. Bu nedenle:

```
netsisStock          = Netsis'ten gelen ham stok
netsisPendingQuantity = Netsis'te bekleyen/satışta olup faturası kesilmemiş miktar
reservedQuantity     = Sitede onaylanmış ama henüz tamamlanmamış sipariş rezervasyonu

displayStock = netsisStock - netsisPendingQuantity - reservedQuantity
```

**Kural:**
- `netsisPendingQuantity` şimdilik manuel girilebilir bir alan. İleride Netsis API'den otomatik beslenecek.
- Netsis API entegrasyon kodu bu fazda YAZILMAYACAK.
- `netsisStock` Product modelinde zaten var.
- `netsisPendingQuantity` Product modeline **yeni eklenecek** (default: 0).
- `recalcDisplayStock()` formülü güncellenecek.
- `getAvailableStock()` formülü güncellenecek.

### "Gelince Haber Ver" → WhatsApp Yönlendirme

- Mevcut `NotifyRequest` modeli ve `notifications` modülü **kaldırılmayacak** ama storefront'ta stok habercisi butonu **NotifyRequest kaydı oluşturmayacak**.
- Stokta olmayan üründe buton: "Gelince Haber Ver" → WhatsApp'a yönlendirir.
- WhatsApp mesajı önceden hazırlanmış metinle açılır:

```
Merhaba, stokta olmayan şu ürün geldiğinde bilgi almak istiyorum:
Ürün: {{productName}}
Stok Kodu: {{sku}}
Link: {{productUrl}}
```

- WhatsApp numarası site ayarlarından (`SiteSettings` veya `.env`) alınır.

### Ödeme / E-Fatura

- Bu fazda **YOK**. Albaraka/Alneo ileride değerlendirilecek.
- Mevcut mock payment (`payOrder`) aynen kalır.

---

## Mevcut Durum Analizi

### Halihazırda çalışan stok altyapısı:

| Bileşen | Dosya | Ne yapıyor |
|---------|-------|-----------|
| Stok rezervasyon | `OrdersService.createOrder()` | Siparişte `StockReservation` oluşturur, `displayStock` hesaplar |
| Display stok | `OrdersService.recalcDisplayStock()` | `netsisStock - SUM(ACTIVE reservations)` |
| Müsait stok | `OrdersService.getAvailableStock()` | Ürünün satılabilir stoğunu döner |
| Stok serbest | `OrdersService.rejectOrder()`, `cancelOrder()` | Rezervasyonu RELEASED yapar |
| Stok tamamlama | `OrdersService.completeOrder()` (ship) | Rezervasyonu FULFILLED yapar |
| İade stok geri alımı | `OrdersService.approveReturn()` | `netsisStock += quantity` |
| Admin stok sayfası | `stok.vue` | Dashboard kartları, kritik stok listesi, rezervasyon tablosu |
| Stok durum renkleri | `stock-status.ts` | 3 seviye: yeşil/turuncu/kırmızı |
| Stok eşik güncelleme | `ProductsService.updateStockThresholds()` | min/middle stock değerlerini günceller |
| Netsis sync | `NetsisService` | Saatlik stok senkronizasyonu |

### Eksik olan (bu fazda yapılacak):

1. **StockMovement tablosu** — Stok değişikliklerinin log kaydı yok
2. **Manuel stok giriş/çıkış** — Admin stok ekleyip çıkaramıyor
3. **Sayım düzeltmesi** — Fiziksel sayım farkını giremiyor
4. **Fire/hasar çıkışı** — Zayi stok düşümü yok
5. **Stok hareket geçmişi** — Ürün bazında stok hareketleri görüntülenemiyor
6. **Stok hareketlerinde audit trail** — Kim, ne zaman, ne kadar değiştirdi belli değil

---

## 1. Değiştirilecek Dosyalar

| # | Dosya | Değişiklik | Risk |
|---|-------|-----------|------|
| **D1** | `apps/api/prisma/schema.prisma` | `StockMovement` modeli + enum ekle, Product'a `netsisPendingQuantity` ekle | Düşük — yeni model + 1 alan |
| **D2** | `apps/api/src/modules/orders/orders.service.ts` | `recalcDisplayStock()` ve `getAvailableStock()` formülünü güncelle (netsisPendingQuantity dahil), StockMovement logu oluştur | Orta — mevcut transaction akışına ekleme |
| **D3** | `apps/admin/app/pages/stok.vue` | Ürün listesi tablosu, hareket geçmişi drawer'ı, stok işlem modal'ları ekle | Orta — sayfa yeniden yapılanıyor |
| **D4** | `apps/admin/app/stores/stock.ts` | StockMovement'leri çekecek action'lar ekle | Düşük — store genişletme |
| **D5** | `apps/storefront/app/pages/urunler/[slug].vue` | Stok habercisi butonunu WhatsApp yönlendirmesine çevir | Düşük — buton davranışı değişikliği |
| **D6** | `apps/api/src/modules/products/products.service.ts` | `netsisPendingQuantity` alanını create/update DTO'lara ekle, export'a kolon ekle | Düşük — alan ekleme |

## 2. Yeni Eklenecek Dosyalar

| # | Dosya | Amaç |
|---|-------|------|
| **N1** | `apps/api/src/modules/stock/stock.module.ts` | Stock modülü tanımı |
| **N2** | `apps/api/src/modules/stock/stock.service.ts` | Stok hareket CRUD, manuel giriş/çıkış, sayım düzeltme |
| **N3** | `apps/api/src/modules/stock/stock.controller.ts` | Admin endpoint'leri |
| **N4** | `apps/api/src/modules/stock/dto/create-stock-movement.dto.ts` | Input validation |
| **N5** | `apps/admin/app/components/StockMovementDrawer.vue` | Ürün stok hareket geçmişi drawer'ı |
| **N6** | `apps/admin/app/components/ManualStockModal.vue` | Manuel giriş/çıkış/fire modal'ı |
| **N7** | `apps/admin/app/components/CountAdjustModal.vue` | Sayım düzeltme modal'ı |

## 3. Prisma Migration Planı

### 3.1 Eklenecek Model + Değişecek Model

**Yeni: StockMovement**

```prisma
model StockMovement {
  id            String              @id @default(cuid())
  productId     String
  product       Product             @relation(fields: [productId], references: [id])
  type          StockMovementType
  quantity      Decimal             @db.Decimal(10, 2)
  oldStock      Decimal             @db.Decimal(10, 2)
  newStock      Decimal             @db.Decimal(10, 2)
  userId        String?
  user          User?               @relation(fields: [userId], references: [id])
  referenceType String?             // "Order", "Return", "Manual", "CountAdjust"
  referenceId   String?             // Order ID, Return ID vs
  note          String?
  createdAt     DateTime            @default(now())

  @@index([productId])
  @@index([createdAt])
  @@index([type])
}

enum StockMovementType {
  MANUAL_ENTRY       // Admin manuel stok girişi
  MANUAL_EXIT        // Admin manuel stok çıkışı
  ORDER_RESERVE      // Sipariş onayı → stok rezerve
  ORDER_FULFILL      // Sipariş kargoya verildi → stok düşümü
  ORDER_CANCEL       // Sipariş iptal → rezervasyon serbest
  RETURN_RESTOCK     // İade onayı → stok geri alımı
  COUNT_ADJUST       // Fiziksel sayım düzeltmesi
  DAMAGE_LOSS        // Fire/hasar/kayıp çıkışı
}
```

**Değişiklik: Product modeline eklenecek alan**

Mevcut `Product` modelinde şu alanlar var: `netsisStock`, `reservedStock`, `displayStock`.  
Bunlara **ek olarak** eklenecek:

```prisma
model Product {
  // ... mevcut alanlar aynen kalır ...

  netsisPendingQuantity Int     @default(0)  // ← YENİ: Netsis'te bekleyen miktar
  // ileride Netsis API'den otomatik beslenecek, şimdilik manuel

  // displayStock formülü (hesaplanan, API'de güncellenir):
  // displayStock = netsisStock - netsisPendingQuantity - reservedStock
}
```

### 3.2 Migration Adımları

```bash
# 1. schema.prisma'ya StockMovement modelini ekle
# 2. Migration oluştur
cd apps/api
npx prisma migrate dev --name add_stock_movements

# 3. Prisma Client yenile (otomatik olur)
```

### 3.3 app.module.ts Güncelleme

```typescript
// apps/api/src/app.module.ts — imports array'ine ekle:
import { StockModule } from './modules/stock/stock.module';
// ...
StockModule,
```

---

## 4. StockService Metod Listesi

```typescript
// apps/api/src/modules/stock/stock.service.ts

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  // ─── Display Stok Hesaplama ─────────────────────────────────

  /**
   * Yeni formül:
   * displayStock = netsisStock - netsisPendingQuantity - SUM(ACTIVE reservations)
   * 
   * Netsis, irsaliye/fatura kesilmeden stoğu düşmez.
   * netsisPendingQuantity: Netsis'te bekleyen miktar (ileride API'den gelecek).
   * reservedQuantity: Sitede onaylanmış aktif rezervasyonlar.
   */
  async recalcDisplayStock(productId: string): Promise<void>

  // ─── Hareket Listeleme ──────────────────────────────────────

  /**
   * Belirli bir ürünün stok hareket geçmişi
   * GET /api/admin/stock/movements?productId=X&type=Y&start=Z&end=W&limit=50&offset=0
   */
  async getMovements(
    productId?: string,
    type?: StockMovementType,
    startDate?: Date,
    endDate?: Date,
    limit = 50,
    offset = 0,
  ): Promise<{ movements: StockMovement[]; total: number }>

  // ─── Manuel İşlemler ───────────────────────────────────────

  /**
   * Manuel stok girişi
   * POST /api/admin/stock/entry
   * Body: { productId, quantity, note }
   * → product.netsisStock += quantity
   * → StockMovement(type=MANUAL_ENTRY)
   * → displayStock yeniden hesaplanır
   */
  async manualEntry(productId: string, quantity: number, note: string, userId: string): Promise<StockMovement>

  /**
   * Manuel stok çıkışı (fire, hasar, kayıp)
   * POST /api/admin/stock/exit
   * Body: { productId, quantity, note }
   * → Validasyon: quantity > 0, quantity <= product.netsisStock
   * → product.netsisStock -= quantity
   * → StockMovement(type=MANUAL_EXIT veya DAMAGE_LOSS)
   */
  async manualExit(productId: string, quantity: number, note: string, userId: string, type: StockMovementType): Promise<StockMovement>

  /**
   * Sayım düzeltmesi
   * POST /api/admin/stock/count-adjust
   * Body: { productId, actualCount, note }
   * → Fark = actualCount - product.netsisStock
   * → Fark pozitifse giriş, negatifse çıkış
   * → StockMovement(type=COUNT_ADJUST)
   */
  async countAdjust(productId: string, actualCount: number, note: string, userId: string): Promise<StockMovement>

  // ─── Sipariş Kaynaklı (OrdersService'ten çağrılır) ──────────

  /**
   * Sipariş onayında stok rezerve logu
   * OrdersService.approveOrder() içinden çağrılır
   */
  async logReserve(productId: string, orderId: string, quantity: number, userId?: string): Promise<void>

  /**
   * Sipariş sevk edilince stok düşüm logu
   * OrdersService.completeOrder() içinden çağrılır
   */
  async logFulfill(productId: string, orderId: string, quantity: number, userId?: string): Promise<void>

  /**
   * Sipariş iptalinde stok geri alım logu
   * OrdersService.cancelOrder() / rejectOrder() içinden çağrılır
   */
  async logCancel(productId: string, orderId: string, quantity: number, userId?: string): Promise<void>

  /**
   * İade onayında stok geri alım logu
   * OrdersService.approveReturn() içinden çağrılır
   */
  async logReturnRestock(productId: string, orderId: string, quantity: number, userId?: string): Promise<void>
}
```

---

## 5. StockController Endpoint Listesi

| # | Method | Endpoint | Yetki | Açıklama | Body |
|---|--------|----------|-------|----------|------|
| E1 | GET | `/api/admin/stock/movements` | ADMIN, SUPER_ADMIN, WAREHOUSE_STAFF | Stok hareket listesi (filtreli) | Query: productId, type, startDate, endDate, limit, offset |
| E2 | POST | `/api/admin/stock/entry` | ADMIN, SUPER_ADMIN, WAREHOUSE_STAFF | Manuel stok girişi | `{ productId, quantity, note }` |
| E3 | POST | `/api/admin/stock/exit` | ADMIN, SUPER_ADMIN, WAREHOUSE_STAFF | Manuel stok çıkışı (fire/hasar) | `{ productId, quantity, type, note }` |
| E4 | POST | `/api/admin/stock/count-adjust` | ADMIN, SUPER_ADMIN, WAREHOUSE_STAFF | Sayım düzeltmesi | `{ productId, actualCount, note }` |

**Mevcut endpoint'ler (dokunulmayacak):**

| Endpoint | Durum |
|----------|-------|
| `GET /orders/stock/:productId` | ✅ Aynen kalır |
| `POST /products/:productId/stock-thresholds` | ✅ Aynen kalır |
| `POST /netsis/sync/stock` | ✅ Aynen kalır |
| `GET /netsis/status/stock` | ✅ Aynen kalır |

---

## 6. Admin Stok Sayfası Component Değişiklikleri

### 6.1 Mevcut stok.vue sayfasına eklenecekler

Mevcut sayfa (`stok.vue`) 3 bölümden oluşuyor:
1. StatCard'lar (üst)
2. Kritik stok uyarıları (orta, 2 sütun)
3. Rezervasyon tablosu (alt)

**Eklenecek 4. bölüm — Tüm Ürün Stok Tablosu:**

```
┌─ Stok Durumu Tablosu ──────────────────────────────────────────┐
│ [Arama: SKU/ürün adı...] [Kategori ▼] [Stok Durumu ▼]         │
├─────────┬──────────────┬────────┬───────┬────────┬─────────────┤
│ SKU     │ Ürün         │ Birim  │ Stok  │ Durum  │ Aksiyon     │
├─────────┼──────────────┼────────┼───────┼────────┼─────────────┤
│ SRM-001 │ Seramik Bej  │ m²     │ 250   │ 🟢     │ [Hareketler]│
│ BTM-045 │ Batarya Krom │ adet   │ 15    │ 🟡     │ [Hareketler]│
│ SLK-112 │ Silikon      │ adet   │ 0     │ 🔴     │ [Hareketler]│
└─────────┴──────────────┴────────┴───────┴────────┴─────────────┘
                                        < 1  2  3 ... 42 >
```

**"Hareketler" butonu:** Tıklanınca StockMovementDrawer açılır (E1 endpoint'ini kullanır).

**Header aksiyon butonları:**
- [Stok Girişi] → ManualStockModal açar
- [Stok Çıkışı] → ManualStockModal açar
- [Sayım Düzelt] → CountAdjustModal açar

### 6.2 StockMovementDrawer.vue (yeni)

```
┌─ Sağ Panel (500px) ─────────────────────────────┐
│ Stok Hareketleri — [Ürün Adı]               [✕] │
│ SKU: SRM-001                    Mevcut Stok: 250 │
├──────────────────────────────────────────────────┤
│ Filtre: [Tarih ▼] [Tip ▼]                       │
├──────┬──────────┬────────┬──────────┬───────────┤
│Tarih │ İşlem    │ Miktar │ Esk→Yeni │ Kullanıcı │
├──────┼──────────┼────────┼──────────┼───────────┤
│25.05 │Rezerve   │ -5     │255→250  │ Sistem    │
│24.05 │Sevk      │ -10    │265→255  │ admin@... │
│23.05 │Manuel Gr │ +50    │215→265  │ admin@... │
│22.05 │Sayım Dz. │ -3     │218→215  │ depo@...  │
└──────┴──────────┴────────┴──────────┴───────────┘
```

### 6.3 ManualStockModal.vue (yeni)

```
┌─ Modal — Stok Girişi / Çıkışı ──────────────────┐
│                                                  │
│ İşlem Tipi:  ○ Giriş   ○ Çıkış (Fire/Hasar)     │
│                                                  │
│ Ürün:        [Ara... dropdown searchable]        │
│                                                  │
│ Miktar:      [_____] birim                       │
│              (çıkışta max: mevcut stok kadar)     │
│                                                  │
│ Açıklama:    [___________________________]       │
│              (zorunlu, min 10 karakter)           │
│                                                  │
│                              [İptal]  [Kaydet]   │
└──────────────────────────────────────────────────┘
```

**Validasyon:**
- Ürün seçili olmalı
- Miktar > 0
- Çıkışta miktar ≤ mevcut stok
- Açıklama min 10 karakter
- İşlem sonrası toast + tablo güncelleme

### 6.4 CountAdjustModal.vue (yeni)

```
┌─ Modal — Sayım Düzeltme ─────────────────────────┐
│                                                  │
│ Ürün:        [Ara... dropdown searchable]        │
│                                                  │
│ Sistem Stok: 250 m²         (salt okunur)        │
│                                                  │
│ Sayım Sonucu:[_____] birim                       │
│              Fark: -3 (otomatik hesaplanır)       │
│                                                  │
│ Açıklama:    [___________________________]       │
│              (zorunlu, min 10 karakter)           │
│                                                  │
│                              [İptal]  [Kaydet]   │
└──────────────────────────────────────────────────┘
```

### 6.5 Mevcut stok store'da değişiklik (`stores/stock.ts`)

Eklenecek action'lar:

```typescript
// Stok hareketlerini çek
async fetchMovements(productId: string, params?: { type?, start?, end?, limit?, offset? })

// Manuel stok girişi
async manualEntry(productId: string, quantity: number, note: string): Promise<void>

// Manuel stok çıkışı
async manualExit(productId: string, quantity: number, type: string, note: string): Promise<void>

// Sayım düzeltmesi
async countAdjust(productId: string, actualCount: number, note: string): Promise<void>
```

---

## 7. OrdersService Entegrasyon Noktaları

### 7.1 Display Stock Formülü Güncellemesi

Mevcut `recalcDisplayStock()` metodu güncellenecek:

```typescript
// orders.service.ts — GÜNCEL formül
private async recalcDisplayStock(productId: string) {
  const product = await this.prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const reservations = await this.prisma.stockReservation.aggregate({
    where: { productId, status: 'ACTIVE' },
    _sum: { quantity: true },
  });
  const reserved = reservations._sum.quantity || 0;
  
  // YENİ FORMÜL: netsisStock - netsisPendingQuantity - reserved
  const displayStock = Math.max(0, product.netsisStock - product.netsisPendingQuantity - reserved);

  await this.prisma.product.update({
    where: { id: productId },
    data: { reservedStock: reserved, displayStock },
  });
}

// getAvailableStock da güncellenecek:
async getAvailableStock(productId: string): Promise<number> {
  const product = await this.prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundException(`Product ${productId} not found`);

  const reservations = await this.prisma.stockReservation.aggregate({
    where: { productId, status: 'ACTIVE' },
    _sum: { quantity: true },
  });
  const reserved = reservations._sum.quantity || 0;
  
  // YENİ: netsisPendingQuantity dahil
  return Math.max(0, product.netsisStock - product.netsisPendingQuantity - reserved);
}
```

### 7.2 StockMovement Log Entegrasyonu

| Metod | Eklenecek StockService çağrısı | StockMovementType |
|-------|-------------------------------|-------------------|
| `createOrder()` — stock reservation sonrası | `stockService.logReserve(productId, orderId, qty)` | ORDER_RESERVE |
| `completeOrder()` (ship) — fulfillment sonrası | `stockService.logFulfill(productId, orderId, qty)` | ORDER_FULFILL |
| `cancelOrder()` — release sonrası | `stockService.logCancel(productId, orderId, qty)` | ORDER_CANCEL |
| `rejectOrder()` — release sonrası | `stockService.logCancel(productId, orderId, qty)` | ORDER_CANCEL |
| `approveReturn()` — restock sonrası | `stockService.logReturnRestock(productId, orderId, qty)` | RETURN_RESTOCK |

**Dikkat:** Bu entegrasyonlar mevcut transaction akışını bozmamalı. `StockMovement` logu transaction dışında fire-and-forget olarak da yazılabilir (log kaybı kabul edilebilir, stok kaybı edilemez).

**Bağımlılık yönü:** `OrdersModule` → `StockModule`'ü import eder. `OrdersService` constructor'ına `StockService` eklenir.

---

## 8. Kabul Kriterleri

| # | Kriter | Nasıl test edilir |
|---|--------|-------------------|
| K1 | `prisma migrate dev` hatasız çalışır | Migration sonrası PostgreSQL'de `stock_movements` tablosu ve `Product.netsisPendingQuantity` sütunu oluşur |
| K2 | Admin manuel stok girişi yapabilir | Ürüne +50 stok ekle, `netsisStock` 50 artar, `displayStock` güncellenir |
| K3 | Admin manuel stok çıkışı yapabilir | Üründen -5 stok düş, `netsisStock` 5 azalır |
| K4 | Stok çıkışı mevcut stoktan fazla olamaz | 250 stoklu ürüne -300 çıkış dene, hata döner |
| K5 | Sayım düzeltmesi farkı hesaplar | Sistem 250, sayım 247 → -3 stok hareketi oluşur |
| K6 | Her stok işlemi StockMovement logu oluşturur | İşlem sonrası hareket geçmişinde yeni kayıt görünür |
| K7 | Ürün detay drawer'ında hareket geçmişi görünür | Ürüne tıkla → drawer açılır → tüm hareketler listelenir |
| K8 | Sipariş kaynaklı hareketler de loglanır | Sipariş oluştur → ORDER_RESERVE logu görünür |
| K9 | Sipariş iptalinde stok geri logu oluşur | Sipariş iptal → ORDER_CANCEL logu görünür |
| K10 | Yetkisiz kullanıcı stok endpoint'lerine erişemez | CUSTOMER rolüyle stok girişi dene → 401/403 |
| K11 | Mevcut stok sayfası bozulmaz | Kritik stok uyarıları ve rezervasyon tablosu aynen çalışır |
| K12 | Açıklama alanı zorunlu ve min 10 karakter | Boş veya kısa açıklama ile kaydet → validasyon hatası |
| K13 | **displayStock = netsisStock − netsisPendingQuantity − reserved** | netsisStock=100, netsisPendingQuantity=20, reserved=5 → displayStock=75 |
| K14 | **netsisPendingQuantity default 0, manuel değiştirilebilir** | Admin ürün düzenlemede netsisPendingQuantity alanını görür ve değiştirebilir |
| K15 | **Stok habercisi butonu WhatsApp'a yönlendirir** | Stoksuz üründe "Gelince Haber Ver"e tıkla → WhatsApp açılır, mesajda ürün adı+SKU+link hazır gelir |
| K16 | **WhatsApp numarası ayarlardan gelir** | .env veya SiteSettings'ten okunur, boşsa buton gizlenir |

---

## 9. Riskli Noktalar

| Risk | Seviye | Önlem |
|------|--------|-------|
| **OrdersModule ↔ StockModule circular dependency** | Orta | StockService OrdersService'e enjekte EDİLMEZ. Log'lar doğrudan Prisma ile yazılır. |
| **Mevcut stok sayfasının bozulması** | Orta | Yeni component'leri mevcut sayfanın ALTINA ekle, üst kısmı değiştirme. |
| **Migration'da data loss** | Düşük | Yeni tablo + 1 sütun ekleniyor, mevcut veriye dokunulmuyor. `netsisPendingQuantity` default 0. |
| **displayStock tutarsızlığı** | Orta | Formül 3 yerden çağrılabilir: OrdersService.recalcDisplayStock, StockService.recalcDisplayStock, ProductsService.updateProduct. Hepsi aynı formülü kullanmalı. |
| **Transaction içinde log kaybı** | Düşük | StockMovement logu transaction dışında fire-and-forget. Log kaybı stok tutarlılığını etkilemez. |
| **netsisPendingQuantity yanlış girilmesi** | Düşük | Default 0. Manuel değiştirilebilir. İleride Netsis API otomatik besleyecek. Admin eğitiminde açıklanacak. |
| **WhatsApp numarası tanımlı değil** | Düşük | Numara yoksa buton gizlenir, hata vermez. `.env` veya `SiteSettings`'ten okunur. |

---

## 10. Uygulama Sırası

```
ADIM 1: Prisma Migration (30 dk)
├── schema.prisma'ya StockMovement modeli + enum ekle
├── Product modeline netsisPendingQuantity alanı ekle (default: 0)
├── prisma migrate dev
└── Prisma Client'in güncellendiğini doğrula

ADIM 2: recalcDisplayStock formül güncellemesi (30 dk)
├── orders.service.ts: recalcDisplayStock() → netsisPendingQuantity dahil
├── orders.service.ts: getAvailableStock() → netsisPendingQuantity dahil
├── products.service.ts: createProduct/updateProduct → netsisPendingQuantity alanı
├── products.service.ts: exportProducts → netsisPendingQuantity kolonu ekle
└── products.service.ts: importProducts → netsisPendingQuantity alanı parse et

ADIM 3: StockModule oluştur (1 saat)
├── N1: stock.module.ts
├── N2: stock.service.ts (recalcDisplayStock, getMovements, manualEntry, manualExit, countAdjust)
├── N3: stock.controller.ts (4 endpoint)
├── N4: create-stock-movement.dto.ts
└── app.module.ts'ye StockModule ekle

ADIM 4: OrdersService StockMovement log entegrasyonu (45 dk)
├── OrdersService'e private logStockMovement() helper ekle (doğrudan Prisma)
├── 5 metoda log çağrısı ekle (reserve, fulfill, cancel ×2, return restock)
└── Circular dependency YOK — StockService enjekte edilmez

ADIM 5: Admin stock store güncelleme (30 dk)
├── stock.ts'e fetchMovements, manualEntry, manualExit, countAdjust action'ları ekle
└── API endpoint'lerini doğru çağırdığından emin ol

ADIM 6: Admin UI component'leri (3 saat)
├── N5: StockMovementDrawer.vue
├── N6: ManualStockModal.vue
├── N7: CountAdjustModal.vue
└── stok.vue'ye 4. bölüm (ürün stok tablosu) + butonları ekle

ADIM 7: Storefront WhatsApp "Gelince Haber Ver" (30 dk)
├── urunler/[slug].vue: stok yoksa NotifyRequest YERİNE WhatsApp linki
├── WhatsApp numarası .env'den (WHATSAPP_NUMBER) veya SiteSettings'ten okunur
├── Mesaj: "Merhaba, stokta olmayan şu ürün geldiğinde bilgi almak istiyorum:\nÜrün: {name}\nStok Kodu: {sku}\nLink: {url}"
└── Numara tanımlı değilse buton gizlenir

ADIM 8: Test (1 saat)
├── netsisPendingQuantity=10 iken displayStock doğru hesaplanıyor → K13
├── Manuel stok girişi/çıkışı → K2, K3, K4, K6
├── Sayım düzeltmesi → K5
├── Sipariş oluştur → ORDER_RESERVE logu → K8
├── Sipariş iptal → ORDER_CANCEL logu → K9
├── Yetkisiz erişim → K10
├── Mevcut stok sayfası bozulmamış → K11
├── WhatsApp butonu doğru çalışıyor → K15, K16
└── netsisPendingQuantity admin ürün formunda görünüyor → K14

TOPLAM TAHMİNİ SÜRE: 7-8 saat
```

---

## Ek: Circular Dependency Çözümü

OrdersModule ve StockModule arasında circular dependency riski var.
En temiz çözüm: **StockService'i OrdersService'e enjekte etme. Onun yerine StockMovement logunu doğrudan Prisma ile yaz.**

```typescript
// orders.service.ts — StockService yerine doğrudan Prisma kullan

// Constructor'a EKLEME:
// private stockService: StockService  ← BUNU YAPMA

// Bunun yerine her log noktasında:
private async logStockMovement(
  productId: string, type: StockMovementType,
  quantity: number, referenceType: string, referenceId: string,
  userId?: string, note?: string
) {
  const product = await this.prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  
  const oldStock = product.netsisStock;
  const newStock = type === 'ORDER_FULFILL' ? oldStock - quantity 
    : type === 'RETURN_RESTOCK' ? oldStock + quantity
    : oldStock; // Reserve/Cancel: stock doesn't change, only reservation

  await this.prisma.stockMovement.create({
    data: { productId, type, quantity, oldStock, newStock, userId, referenceType, referenceId, note },
  }).catch(err => this.logger.error(`Failed to log stock movement: ${err.message}`));
}
```

Bu yaklaşım:
- Circular dependency'yi tamamen önler
- Log kaybı durumunda stok işlemi etkilenmez (catch)
- StockService sadece admin manuel işlemleri için kullanılır
- OrdersService içinde tek bir helper metod tüm log'ları halleder

---

**Plan sonu. Onay verirsen ADIM 1'den başlayarak kodlamaya geçiyorum.**
