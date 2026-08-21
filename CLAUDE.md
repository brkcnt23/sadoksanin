# CLAUDE.md — Sadoksan ERP

**Son güncelleme:** 2026-07-04
**Ana görev listesi:** YAPILACAKLAR.md (her oturum başı OKU)
**Oturum geçmişi:** docs/oturum-ozetleri.md
**Master context:** docs/SADOKSAN-CLAUDE.md (sunucu bilgisi + test hesapları + kapsamlı referans)

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Storefront | Nuxt 4 (SSR) | B2B dealer portal + plasiyer paneli |
| Admin Panel | Nuxt 4 (SPA) | `/sadoksan-panel` login |
| Backend API | NestJS 11 | ALL business logic |
| Database | PostgreSQL 15 | Primary data store |
| ORM | Prisma 7.8 | 34 models, 20+ migrations |
| Queue | Redis + BullMQ | Background jobs |
| PDF | Python Flask | Proforma PDFs (ReportLab) |
| Container | Docker | Multi-stage prod compose |

## Project Structure

```
sadoksan/ (monorepo root)
├── apps/
│   ├── storefront/     # Nuxt 4 SSR (ana site + bayi + plasiyer)
│   ├── admin/           # Nuxt 4 SPA (yönetim paneli)
│   └── api/             # NestJS — ALL business logic
├── packages/
│   ├── shared/          # Common types, Prisma schema
│   └── ui/              # Shared Vue components
├── python-service/      # Proforma PDF generator (Flask + ReportLab)
├── scripts/             # Backup, seed, import scripts
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── nginx.prod.conf
```

## Veritabanı — Güncel Durum

| Metrik | Değer |
|--------|-------|
| Toplam ürün | **1,181** (285 görünür + 896 Netsis import, gizli) |
| Ürün varyasyonu | 0 (sistem hazır, henüz veri yok) |
| Kullanıcı | 8 (5 bayi + 1 plasiyer + 1 admin + 1 super_admin) |
| Prisma model | 34 |
| API modülü | 18 |

**896 gizli ürün:** Netsis'ten Excel ile içeri aktarıldı, gerçek stok kodları (`A5A0209C00`, `3011.0Y050K.010.1` formatında), henüz fiyat/kategori/görsel atanmadı, `visible=false`. Netsis senkronizasyonu başladığında `netsisCode` eşleşmesiyle otomatik güncellenecek.

### Marka & Kategori Mimarisi (Denormalize + Relation)

Hem marka hem kategori **çift katmanlı** çalışır:

```
Product.brand (string, denormalize)  ←→  Product.brandId  →  Brand tablosu
Product.category (string)            ←→  Product.categoryId → Category tablosu
```

- **Brand tablosu** (`model Brand`): id, name, slug, description, logoUrl → `products[]` relation. Tam CRUD: `GET/POST /products/brands`, `PATCH/DELETE /products/brands/:id`
- **Category tablosu** (`model Category`): id, name, slug, parentId (self-relation) → `products[]` + `children[]`. Tam CRUD: `GET/POST /products/categories`, `PATCH/DELETE /products/categories/:id`
- **Seed endpoint'i**: `POST /api/products/seed-categories-brands` → mevcut `Product.brand` ve `Product.category` string'lerinden Brand/Category tablolarını toplu doldurur + `brandId`/`categoryId` bağlantılarını kurar
- **Güncelleme zinciri**: Marka adı değişince → Brand tablosu güncellenir → o markaya bağlı tüm Product.brand string'leri de güncellenir (`updateMany`)
- **Hızlı ekleme**: Ürün formunda "+ Yeni" butonu → `POST /products/brands` (veya `/categories`) → oluşan kayıt dropdown'a anında yansır

## Backend Modules (18)

| Module | Status | Description |
|--------|--------|-------------|
| `auth` | ✅ | JWT auth, register/login, PLASIYER + adminCreateUser, address book |
| `products` | ✅ | CRUD, variations (Faz 3: modüler grid), categories (CRUD + seed), **brands (tam CRUD: Brand tablosu + seed + hızlı ekleme)**, bulk ops, Excel import/export, marka filtresi |
| `orders` | ✅ | Full lifecycle: create→approve→ship→complete, cart, stock reservation, banka havalesi onayı, @media print |
| `dealer` | ✅ | Profile, cari, reports (8 types), approval flow, risk score, **aktif/terkedilen sepet görüntüleme** |
| `proforma` | ✅ | PDF via Python, approval workflow (draft→pending→approved→downloaded) |
| `discounts` | ✅ | Product/category/brand discounts (% or fixed) |
| `promo` | ✅ | Promo code validation |
| `popup` | ✅ | Campaign popups with audience targeting |
| `pricing` | ✅ | Regional/province surcharges, logistics rules |
| `notifications` | ✅ | Back-in-stock notify requests |
| `audit` | ✅ | Full audit log with filtering |
| `cms` | ✅ | Hero banner, site settings, maintenance mode, introEnabled dashboard toggle |
| `mailer` | ✅ | Console logger (SMTP ready) |
| `favorites` | ✅ | Wishlist CRUD |
| `reports` | ✅ | 8 endpoints: plasiyer-sales, order-pipeline, dealer-risk, critical-stock, slow-moving, credit-usage, plasiyer-dashboard, plasiyers |
| `netsis` | 🟡 | NetOpenX REST: OAuth2 token, 4 sync, **896 ürün import edildi**, push-agent planı hazır (NETSIS-ENTEGRASYON-PLANI.md) |
| `stock` | ✅ | StockMovement model + tablo, manuel stok giriş/çıkış, stok uyarı sayfalama, gizli ürün filtreleme |
| `logistics` | ✅ | Logistics rules |
| `alneo` | 🔴 | E-invoice (API bekleniyor) |

## Environment / URLs

| Servis | URL |
|--------|-----|
| Storefront | https://sadoksan.smartinnventory.com/ |
| Admin Panel | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| API Health | https://sadoksan.smartinnventory.com/api/health |

## Docker Containers (Production)

| Container | Host Port | Internal |
|-----------|-----------|----------|
| sadoksan-storefront-prod | 3011 | 3000 |
| sadoksan-admin-prod | 3012 | 3002 |
| sadoksan-api-prod | 3010 | 3001 |
| sadoksan-postgres-prod | — | 5432 |
| sadoksan-redis-prod | — | 6379 |
| sadoksan-python-prod | 3013 | 5000 |

## Nginx Reverse Proxy

```
Browser (HTTPS) → nginx → /api/* → api:3001
                         → /sadoksan-panel/* → admin:3002
                         → /* → storefront:3000
```

## Test Hesapları

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@admin.com | asd123 |
| Bayi | bayi@test.com | asd123 |
| Bayi | ankara-yapi@test.com | test123 |
| Bayi | izmir-ticaret@test.com | test123 |
| Bayi | bursa-insaat@test.com | test123 |
| Bayi | erzurum-yapi@test.com | test123 |
| Plasiyer | plasiyer@test.com | asd123 |
| Plasiyer | ahmet.satis@test.com | test123 |

## Demo Kart (Sunum)

```
Kart No: 4111 1111 1111 1111 / SKT: 12/28 / CVV: 123
```

---

## 🆕 Son Geliştirmeler (2026-06-18 → 2026-07-04)

### Modüler Varyant Sistemi — Faz 3 (e5a8d92)
- Varyant tipi tanımlama: Renk/Ebat/Desen/Özel preset + serbest özellik ekleme
- Grid ile toplu oluşturma: değerleri virgülle gir, kartezyen çarpımla tüm kombinasyonlar otomatik üretilir (3 renk × 2 ebat = 6 varyant)
- Mükerrer kombinasyon önleme + çoklu-özellik varyasyonlar badge olarak gösteriliyor
- Stok alanı varyasyon düzenlemesine eklendi, Hızlı Ekle formu korundu

### Netsis Entegrasyonu — Planlama + Import (6a5b967, 441953b)
- **NETSIS-ENTEGRASYON-PLANI.md**: Fabrika ziyareti hazırlık dokümanı — NetOpenX REST, push-agent mimarisi, e-fatura akışı, açık kararlar
- **896 ürün Excel'den içeri aktarıldı** (`import-netsis-stock-excel.js`): gerçek Netsis stok kodları, gizli (visible=false), Netsis sync ile otomatik eşleşecek
- Push-agent tasarımı: fabrikadaki Windows PC → HTTPS POST → Sadoksan API (router/VPN gerekmez)

### Admin Panel — Yeni Özellikler
- **Ürün listesine marka filtresi** eklendi (7157ce1)
- **Ürün formunda hızlı marka/kategori ekleme**: "+ Yeni" butonu ile formdan çıkmadan yeni marka veya kategori oluşturma, `createCategory` parentId desteği (fc0f245)
- **Bayi aktif/terkedilen sepet görünümü**: `GET /dealer/carts` endpoint + bayiler.vue widget — 3+ gün güncellenmemiş sepetler "terkedilmiş" sayılır (3076388)
- **Sipariş yazdırma**: `@media print` CSS ile OrderDetailDrawer'dan temiz çıktı, butonlar/aksiyonlar gizlenir (a4dda03)

### Bug Fix'ler
- **Stok uyarı listeleri**: 896 gizli ürün (stok=0, min=0) "kritik" görünüyordu → `visible=true` filtresi eklendi + sayfalama (10'ar) (0ceb0a9)
- **Sipariş filtreleri**: Enum casing uyuşmazlığı nedeniyle hiç çalışmıyordu, düzeltildi (1c29403)
- **Banka havalesi**: Onaylanınca bayi cari bakiyesi düşürülmüyordu (fbf790f)
- **Cari bakiye çift-sayım**: Bayi bakiye hesaplamasında mükerrer sayım bug'ı + rapor tarih aralığı varsayılanı düzeltildi (e5d0736)
- **Kategori sayacı rollup**: Alt kategori ürün sayıları üst kategoriye yansımıyordu (441953b)
- **Storefront kategori filtresi**: categoryId kayboluyordu (da190e0)
- **CSV export**: Windows Excel'de tek sütuna sıkışıyordu, BOM + separator düzeltildi (91c08d0)
- **Görsel yükleme limiti**: Admin ve storefront arasında eşitlendi + varyasyona görsel ekleme + kayıt bug fix (1d4bfe6)

---

## ⚠️ Gotcha'lar

1. **Admin panel SPA'dır** → `.env` değişikliğinde REBUILD şart, restart yetmez
2. **Storefront SSR'dır** → Her değişiklikte rebuild gerekir
3. **Prisma migration prod'da** → `migrate deploy` kullan, `migrate dev` YOK
4. **NestJS global prefix** → `app.setGlobalPrefix('api')` aktif, controller'larda `api/` prefix'i YOK
5. **Proforma controller route sıralaması** → `pending`/`my` route'ları `:id`'den ÖNCE olmalı (BUG-1)
6. **896 gizli ürün**: `visible=false`, fiyat/kategori atanana kadar storefront'ta görünmez. Stok uyarılarında filtrelenir.

## Recent Fixes

### Global Prefix Fix (2026-06-02)
- Controller'ların yarısı `api/` prefix'liydi, yarısı değildi
- `main.ts` → `app.setGlobalPrefix('api')` eklendi
- 9 controller'dan `api/` prefix'i kaldırıldı
- Host nginx `proxy_pass` trailing slash kaldırıldı

### Admin Mixed Content Fix (2026-06-02)
- `ADMIN_API_BASE="/api"` (relative) → tarayıcı origin'e göre çözümler

## Son Commit'ler

```
3076388 feat: bayi aktif/terkedilen sepet gorunumu (GET /dealer/carts + bayiler.vue widget)
a4dda03 feat: siparis yazdirma icin @media print CSS eklendi
fc0f245 feat: urun formunda yeni marka/kategori hizli ekleme (createCategory parentId destegi)
7157ce1 feat: urun listesine marka filtresi eklendi (admin panel)
1c29403 fix: siparis filtreleri hic calismiyordu (enum casing uyusmazligi)
fbf790f fix: banka havalesi onaylaninca bayi cari bakiyesi dusurulmuyordu
e5d0736 fix: bayi cari bakiye cifte-sayim bug'i + rapor tarih araligi varsayilani
6a5b967 docs: Netsis entegrasyon planlama dokumani
0ceb0a9 fix: stok uyari listeleri + gizli urunler kritik gorunme bug'i
441953b fix: kategori sayaci rollup + urun karti linki + Netsis stok import
da190e0 fix: storefront kategori filtresi categoryId kaybi
91c08d0 fix: urun export CSV'si Windows Excel uyumlulugu
e5a8d92 feat: modüler varyant sistemi - tip tanımla + grid ile toplu oluşturma (Faz 3)
1d4bfe6 fix: gorsel yukleme limiti + varyasyona gorsel + kayit bug fix
08dd21a feat: bayi/plasiyer yonetimi, kredi limiti, proforma onay akisi, rapor
75f2d6d feat: Production hardening + 192 ürün görsel + Prisma 7.8
```

## Önemli Dosyalar

| Dosya | İçerik |
|-------|--------|
| `CLAUDE.md` | **BU DOSYA** — Teknik context (AI için) |
| `docs/SADOKSAN-CLAUDE.md` | Master context (sunucu + test hesapları + kapsamlı referans) |
| `YAPILACAKLAR.md` | Görev listesi + yapılanlar |
| `info.md` | Hızlı referans / giriş bilgileri |
| `NETSIS-ENTEGRASYON-PLANI.md` | Netsis entegrasyon planı (fabrika ziyareti hazırlığı) |
| `docs/sadoksan-sistem-tasarimi.md` | 35 bölümlü sistem tasarımı |
| `docs/raporlar.md` | 16 rapor kataloğu |
| `docs/urun-katalogu.md` | 98 ürünlük Ideasoft kataloğu (eski, referans) |
| `apps/api/prisma/schema.prisma` | DB şeması (912 satır, 34 model) |
| `apps/api/src/scripts/import-netsis-stock-excel.js` | Netsis stok Excel import scripti |
| `/home/can/netopenx.md` | Netsis NetOpenX REST tam referans (738KB) |
