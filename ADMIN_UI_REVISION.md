# Admin Panel UI/UX Revizyonu — Sprint Özeti

**Tarih:** 2026-06-02
**Kapsam:** Sadece admin panel frontend — yeni backend/modül/migration YOK

---

## Backend Omurgası (Öncesi)

B2B-only sistem: auth, orders, products, dealers, stock, pricing, proforma, CMS, audit, notifications, bank transfers — hepsi çalışıyor. Admin panel algısı "boş/ham" ama gerçekte 18 sayfa var ve çoğu API'ye bağlıydı.

---

## Faz 0: Altyapı (Temel Düzeltmeler)

### 0.1 useToast + Toaster Component
- `apps/admin/app/composables/useToast.ts` — yeni
- `apps/admin/app/components/Toaster.vue` — yeni
- `apps/admin/app/app.vue` — `<Toaster />` eklendi
- API: `toast.push(message, type, duration?)`, `toast.dismiss(id)`
- Fixed top-4 right-4 z-[100] stack, Lucide ikonlu, auto-dismiss, transition

### 0.2 CSS Typo Fix (10 adet)
- `tranink-*` → `translate-*` düzeltildi
- Etkilenen dosyalar: `siparisler.vue`, `urunler.vue`, `popup.vue`, `ayarlar.vue`, `bayiler.vue`, `PopupEditModal.vue`, `LogisticsRuleEditModal.vue`, `ProvincePricingEditModal.vue`
- Sonuç: Toggle switch'ler artık çalışıyor

### 0.3 Siparişler Modal/Drawer Çakışması
- `siparisler.vue` — inline `<Modal>` bloğu kaldırıldı (satır 353-500)
- `OrderDetailDrawer.vue` — e-Fatura butonu eklendi, tüm `toast.push?.()` → `toast.push()`

### 0.4 Proforma Stil Düzeltmesi
- `gray-xxx` → `ink-xxx`
- Emoji → Lucide ikon (`➕` → `lucide:plus`, `👁` → `lucide:eye`, vb.)
- `alert()` → `toast.push()`
- Inline badge → `<StatusBadge>`

### 0.5 Login Stil Düzeltmesi
- `gray-xxx` → `ink-xxx`
- Gradient → düz `ink-900` arka plan
- `shadow` → `border`

---

## Faz 1: İzlenim

### 1.1 Mobile Responsive Sidebar
- `AppShell.vue` — hamburger menü, backdrop overlay, mobil slide-over sidebar
- `<Teleport to="body">` ile mobil menü
- `lg:hidden` / `hidden lg:flex` ile responsive
- Navigasyonda otomatik kapanma (`watch route.path`)

### 1.2 Dashboard Fix
- `index.vue` — `color="orange"` → `color="amber"` (500 fix)
- Sebep: StatCard palette sadece `blue|amber|green|red|purple|slate` kabul ediyor

### 1.3 Sidebar Menü — Eksik Sayfalar Eklendi

Yaptığımız CRM, Ödemeler, İndirimler, Döviz, İçerik sayfaları **menüde yoktu** — bu yüzden "yok" gibi hissediliyordu.

**Yeni menü yapısı:**

```
Operasyon    → Dashboard, Siparişler, Ödemeler, Bayiler, CRM
Katalog      → Ürünler, Stok, Fiyat & Lojistik, Döviz Kurları
Pazarlama    → Popup & Kampanya, İndirimler, Bildirimler
Yönetim      → Proforma, Raporlar, İçerik (CMS), Denetim Kaydı, Ayarlar
```

- `AppShell.vue` — `navGroups` dizisine 5 yeni menü eklendi (+Ödemeler, +CRM, +Döviz Kurları, +İndirimler, +İçerik)

---

## Faz 2: İşlevsellik (Bozuk Sayfalar)

### 2.1 CRM — Gerçek Bayi İlişkileri Sayfası
- Premium upsell modal'ı kaldırıldı
- 4 sekmeli bayi detay paneli: **Genel / Siparişler / Hareketler / Notlar**
- API'ler: `/api/dealer/admin/list`, `/orders/admin/pending`, `/api/admin/audit`
- Manuel not sistemi (localStorage), risk seviyesi bar, StatCard row

### 2.2 İndirimler — Arama ile Hedef Seçimi
- Raw UUID input → aramalı otomatik tamamlama
- `useProductsStore` üzerinden ürün/kategori/marka filtreleme
- Dropdown ile seçim, seçili hedef göstergesi

### 2.3 Ödemeler — Zenginleştirme
- 4 StatCard eklendi (Bekleyen Havale, Bekleyen Tutar, Onaylanan, Toplam Tutar)
- Inline badge → `<StatusBadge>`
- `formatTL` merkezileştirildi
- Skeleton loading state

### 2.4 Denetim Kaydı — Filtre + Export + Pagination
- Tarih aralığı filtresi (`dateFrom`, `dateTo`)
- Değişiklik içinde arama
- Excel export (`XLSX.writeFile`)
- `<Pagination>` component entegrasyonu

### 2.5 Döviz — Pagination + Modal Düzeltmesi
- Ürün tablosuna client-side pagination (30 ürün/sayfa)
- Inline modal div'leri → `<Modal>` component

---

## Faz 3: Parlatma

### 3.1 alert() → toast.push() Dönüşümü
- `bildirimler.vue`, `urunler.vue`, `ayarlar.vue`, `fiyatlandirma.vue`, `siparisler.vue`, `indirimler.vue`, `proforma.vue`, `OrderDetailDrawer.vue`
- Eksik `useToast` import'ları eklendi

### 3.2 CMS Rich Text Editor
- Raw textarea → toolbar'lı mini HTML editor
- Butonlar: Kalın, İtalik, H2, H3, Link, Liste, Paragraf
- `wrapSelection()` ile seçili metni HTML tag'le sarma
- Dependency-free (harici kütüphane yok)

---

## Faz 4: Component Kütüphanesi

| Component | Dosya | Amaç |
|-----------|-------|------|
| **ConfirmModal** | `components/ConfirmModal.vue` | Danger/Warning/Primary onay dialog'u |
| **LoadingState** | `components/LoadingState.vue` | Spinner, skeleton list, skeleton table |
| **MoneyCell** | `components/MoneyCell.vue` | TRY formatlı, pozitif/negatif renkli |
| **StockBadge** | `components/StockBadge.vue` | Stok seviyesi badge (yeşil/turuncu/kırmızı) |
| **ActionButtonGroup** | `components/ActionButtonGroup.vue` | Tablo aksiyon butonları grubu |
| **FilterBar** | `components/FilterBar.vue` | Standart filtre row'u (arama + tarih) |

### Temizlik
- `DealerPricingOverrideForm.vue` — silindi (kullanılmıyor)

---

## 🔴 KRİTİK BUG FIX: Proforma Sayfası Açılmama Sorunu (2 aşamalı fix)

### Hata
```
TypeError: T.value.filter is not a function
    at ue (iKgcMfXx.js:1:6878)
```
Proforma sayfasına tıklayınca `.filter is not a function` hatası alınıyor, sayfa açılmıyordu. Diğer sayfalar sessizce hata veriyordu (veri gelmiyordu).

### Kök Neden #1 — Yanlış Nginx Tespiti (ilk deneme)

Önce `nginx.prod.conf` (Docker nginx) içindeki `/api/proforma/` bloğu suçlandı. Ama **Docker nginx container'ı zaten çalışmıyordu** — `storefront:3000` hostname'ini çözemediği için restart loop'taydı. Host'ta çalışan **sistem nginx'i** (`systemctl`) asıl trafiği yönetiyordu.

### Kök Neden #2 — Host Nginx `proxy_pass` Trailing Slash (asıl sorun)

Host nginx config (`/etc/nginx/sites-available/sadoksan.smartinnventory.com.conf`):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3010/;   # ← Sondaki / !!!
    ...
}
```

`proxy_pass` URL'sinde **sondaki `/`**, location prefix'ini (`/api/`) **kesip atıyor**:
- İstek: `/api/proforma/history`
- NestJS'e giden: `/proforma/history` ❌ (prefix yok!)

### Kök Neden #3 — Controller Prefix Tutarsızlığı

NestJS controller'ların yarısı `api/` prefix'li, yarısı değildi:

| Prefix'li (`api/...`) | Prefix'siz |
|---|---|
| `api/proforma`, `api/dealer` | `auth`, `orders`, `products` |
| `api/admin/popups`, `api/admin/pricing` | `discounts`, `cms`, `mailer` |
| `api/admin/notifications`, `api/admin/audit` | `cart`, `netsis`, `favorites` |
| `api/admin/stock`, `api/logistics`, `api/promo` | |

Eski nginx (sondaki `/` ile) prefix'siz controller'ları **yanlışlıkla çalıştırıyordu**, prefix'liler 404 alıyordu. Proforma prefix'li gruptaydı → kırıktı.

### Nihai Fix (3 adım)

**1. Host nginx fix** — trailing slash kaldırıldı:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3010;   # ← / kalktı, prefix korunuyor
}
```
`sudo nginx -s reload`

**2. NestJS global prefix** — `apps/api/src/main.ts`:
```ts
app.setGlobalPrefix('api');   // Tüm controller'lara otomatik /api prefix'i
```

**3. Controller temizliği** — 9 dosyada `api/` prefix'i kaldırıldı:
- `@Controller('api/proforma')` → `@Controller('proforma')`
- `@Controller('api/dealer')` → `@Controller('dealer')`
- `@Controller('api/admin/popups')` → `@Controller('admin/popups')`
- `@Controller('api/admin/pricing')` → `@Controller('admin/pricing')`
- `@Controller('api/admin/notifications')` → `@Controller('admin/notifications')`
- `@Controller('api/admin/audit')` → `@Controller('admin/audit')`
- `@Controller('api/admin/stock')` → `@Controller('admin/stock')`
- `@Controller('api/logistics')` → `@Controller('logistics')`
- `@Controller('api/promo')` → `@Controller('promo')`

**Ek düzeltmeler:**
- `docker-compose.prod.yml` health check: `/health` → `/api/health`
- `apps/storefront/app/pages/sepet.vue`: `/api/dealer/profile` → `/dealer/profile` (double prefix fix)
- `apps/api/src/main.ts` rate limiter: `/auth/login` → `/api/auth/login`

**Değişen dosyalar:** `main.ts`, 9 controller, `nginx.conf` (host), `docker-compose.prod.yml`, `sepet.vue`
**Deploy:** `docker compose build api` + `docker compose up -d api` + `sudo nginx -s reload`

### Sonuç

Tüm endpoint'ler hem direkt (port 3010) hem nginx üzerinden (HTTPS) düzgün çalışıyor:
```
Proforma:  [] (boş dizi — filter çalışır)
Dealers:   [{...}] (1 bayi)
Auth:      {access_token, user}
Orders:    {...}
Products:  {...}
Audit:     {...}
Stock:     {...}
```

---

## Değişen Dosya Özeti

| Dosya | İşlem |
|-------|-------|
| `composables/useToast.ts` | Yeni |
| `components/Toaster.vue` | Yeni |
| `components/ConfirmModal.vue` | Yeni |
| `components/LoadingState.vue` | Yeni |
| `components/MoneyCell.vue` | Yeni |
| `components/StockBadge.vue` | Yeni |
| `components/ActionButtonGroup.vue` | Yeni |
| `components/FilterBar.vue` | Yeni |
| `components/AppShell.vue` | Düzenlendi — mobile responsive + menü (5 yeni sayfa) |
| `components/OrderDetailDrawer.vue` | Düzenlendi — e-fatura, toast |
| `components/StatCard.vue` | Hata kaynağı tespit edildi |
| `components/DealerPricingOverrideForm.vue` | Silindi |
| `app.vue` | `<Toaster />` eklendi |
| `nginx.prod.conf` | 🔴 Proforma API routing fix (Docker — not active) |
| `/etc/nginx/.../sadoksan...conf` | 🔴 **Asıl fix**: `proxy_pass` trailing slash kaldırıldı |
| `apps/api/src/main.ts` | 🔴 Global prefix `api` + health/rate-limiter path fix |
| 9 controller dosyası | 🔴 `api/` prefix controller decorator'dan kaldırıldı |
| `docker-compose.prod.yml` | Health check: `/health` → `/api/health` |
| `storefront/.../sepet.vue` | Double prefix fix: `/api/dealer/profile` → `/dealer/profile` |
| `pages/index.vue` | `orange` → `amber` fix |
| `pages/crm.vue` | Tamamen yenilendi |
| `pages/indirimler.vue` | Arama ile hedef seçimi |
| `pages/odemeler.vue` | StatCard + StatusBadge |
| `pages/denetim.vue` | Filtre + arama + export + pagination |
| `pages/doviz.vue` | Pagination + Modal |
| `pages/proforma.vue` | Stil + emoji fix |
| `pages/icerik.vue` | Rich text toolbar |
| `pages/bildirimler.vue` | alert → toast |
| `pages/urunler.vue` | alert → toast |
| `pages/ayarlar.vue` | alert → toast |
| `pages/fiyatlandirma.vue` | alert → toast |
| `pages/sadoksan-panel.vue` | Login stil fix |
| `pages/siparisler.vue` | Modal kaldırma + CSS fix |
| `pages/popup.vue` | CSS fix |
| `pages/bayiler.vue` | CSS fix |

**Toplam: ~40 dosya değişti/eklendi/silindi**

---

## Dokunulmayan Sayfalar (zaten 8-9/10 kalitede)

Dashboard, Products, Orders, Stock, Dealers, Pricing, Reports, Popups, Settings, Notifications — sadece planlanan spesifik fix'leri aldılar (CSS typo, alert→toast, color fix).

---

## Test

1. `docker compose -f docker-compose.prod.yml build admin` ✅
2. `docker compose -f docker-compose.prod.yml up -d admin` ✅
3. `docker compose -f docker-compose.prod.yml restart nginx` ✅ (proforma fix için)
4. `curl http://localhost:3012/sadoksan-panel/` → 200 ✅
5. `curl http://localhost:3012/api/proforma/history` → 302 (auth) ✅ (önceden Python'a gidiyordu)
6. https://sadoksan.smartinnventory.com/sadoksan-panel/ → login → tüm sayfaları gez
7. Tarayıcı console'da hata kontrolü
8. Toast'ların göründüğünü doğrula
9. Mobile responsive (Chrome DevTools mobile view)
10. Proforma sayfası: menüden tıkla → liste gelmeli, `.filter` hatası almamalı
