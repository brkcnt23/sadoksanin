# SADOKSAN ERP — Master Context (Claude için)

> **Sunucu:** 45.43.152.52 (motto-server) — Fedora 41, can kullanıcısı  
> **Son güncelleme:** 2026-07-04  
> **Bu dosya:** Tüm Sadoksan projesinin tek dosyada kuşbakışı. Oturuma başlarken OKU.

---

## 🖥️ SUNUCU BİLGİSİ

**Sen bu sunucunun İÇİNDESİN. SSH atmana gerek YOK. Doğrudan çalışıyorsun.**

| Bilgi | Değer |
|-------|-------|
| IP | 45.43.152.52 |
| Hostname | motto-server |
| OS | Fedora 41 Server |
| CPU | Intel Xeon Platinum 8168 @ 2.70GHz (18 çekirdek) |
| RAM | 94 GB |
| Disk | 500 GB |
| Kullanıcı | can |
| Proje dizini | /home/can/sadoksan |

---

## 🌐 SADOKSAN PROJESİ

### URL'ler

| Servis | URL |
|--------|-----|
| Storefront | https://sadoksan.smartinnventory.com/ |
| Admin Panel | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| API Health | https://sadoksan.smartinnventory.com/api/health |

### Tech Stack

| Layer | Tech |
|-------|------|
| Storefront | Nuxt 4.4 (SSR) |
| Admin Panel | Nuxt 4.4 (SPA) |
| Backend API | NestJS 11 |
| Database | PostgreSQL 15 (Docker) |
| ORM | Prisma 7.8 |
| Queue | Redis 7 + BullMQ |
| PDF | Python Flask + ReportLab |
| Container | Docker + docker-compose.prod.yml |

### Proje Yapısı

```
sadoksan/
├── apps/
│   ├── storefront/     # Nuxt 4 SSR
│   ├── admin/           # Nuxt 4 SPA
│   └── api/             # NestJS
├── packages/
│   ├── shared/          # Ortak tipler, Prisma schema
│   └── ui/              # Paylaşılan Vue component'leri
├── python-service/      # Flask PDF servisi
├── scripts/             # Backup, seed, import script'leri
└── docs/                # Dokümantasyon
```

---

## 🐳 DOCKER KONTEYNERLARI

| Container | Host Port | İç Port | Açıklama |
|-----------|-----------|---------|----------|
| sadoksan-storefront-prod | 3011 | 3000 | Nuxt 4 SSR |
| sadoksan-admin-prod | 3012 | 3002 | Nuxt 4 SPA admin |
| sadoksan-api-prod | 3010 | 3001 | NestJS 11 API |
| sadoksan-postgres-prod | — | 5432 | PostgreSQL 15 |
| sadoksan-redis-prod | — | 6379 | Redis 7 |
| sadoksan-python-prod | 3013 | 5000 | Flask PDF |

### Build & Deploy

```bash
cd /home/can/sadoksan

# Build
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml build admin
docker compose -f docker-compose.prod.yml build storefront

# Deploy
docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml up -d admin
docker compose -f docker-compose.prod.yml up -d storefront

# Durum
docker compose -f docker-compose.prod.yml ps
docker logs sadoksan-api-prod --tail 50
curl http://127.0.0.1:3010/api/health

# Migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# DB bağlantısı
docker exec sadoksan-postgres-prod psql -U sadoksan -d sadoksan

# Nginx
sudo nginx -t && sudo systemctl reload nginx
```

⚠️ **Admin SPA'dır** — `.env` değişikliğinde REBUILD şart, restart yetmez.  
⚠️ **Storefront SSR'dır** — Her değişiklikte rebuild gerekir.  
⚠️ **API değişikliğinde REBUILD + RESTART**

---

## 📊 VERİTABANI

### Güncel Durum (2026-07-04)

| Metrik | Değer |
|--------|-------|
| Toplam ürün | **1,181** |
| Görünür ürün | 285 (fiyat/kategori/görsel atanmış) |
| Gizli ürün | 896 (Netsis import, gerçek stok kodlu, fiyat/kategori bekliyor) |
| Ürün varyasyonu | 0 (modüler sistem hazır, henüz veri girilmedi) |
| Kullanıcı | 8 (5 bayi + 1 plasiyer + 1 admin + 1 super_admin) |
| Prisma model | 34 |
| API modülü | 18 |

### Tablolar (34)

34 model: User, Dealer, Address, CartItem, Product, ProductVariation, Category, Brand, Order, OrderLine, OrderStatusHistory, StockReservation, StockMovement, Favorite, Discount, PromoCode, Popup, NotifyRequest, SiteContent, SiteSettings, Proforma, ProformaItem, ExchangeRate, BankTransfer, BalanceTransaction, AuditLog, NetsisSync, EdocumentLog, RegionalPricingSurcharge, ProvincePricingSurcharge, LogisticsRule, ProductCurrencyPrice, SeoRedirect, CmsPage

### UserRole Enum
```
DEALER, PLASIYER, ADMIN, SUPER_ADMIN
```
(CUSTOMER rolü kaldırıldı — B2B-only sistem)

### Stok Formülü
```
displayStock = netsisStock - netsisPendingQuantity - SUM(ACTIVE reservations)
```

### Test Hesapları

| Rol | Email | Şifre | Not |
|-----|-------|-------|-----|
| Admin | admin@admin.com | asd123 | Panel girişi |
| Bayi | bayi@test.com | asd123 | Storefront bayi girişi |
| Bayi | ankara-yapi@test.com | test123 | Test bayisi |
| Bayi | izmir-ticaret@test.com | test123 | Test bayisi |
| Bayi | bursa-insaat@test.com | test123 | Test bayisi |
| Bayi | erzurum-yapi@test.com | test123 | Test bayisi |
| Plasiyer | plasiyer@test.com | asd123 | Test plasiyer |
| Plasiyer | ahmet.satis@test.com | test123 | Test plasiyer (2026-06-17 oluşturuldu) |

---

## 🔑 ÖNEMLİ VERİ

### 896 Netsis İçe Aktarılan Ürün
- **Kaynak:** Fabrikadan gelen Excel dosyası
- **Script:** `apps/api/src/scripts/import-netsis-stock-excel.js`
- **Durum:** `visible=false`, `minimumStock=0`, fiyat/kategori/görsel YOK
- **Kod formatı:** `A5A0209C00`, `3011.0Y050K.010.1` gibi karmaşık alfanumerik
- **Not:** Stok uyarı listelerinde görünmezler (sadece `visible=true` ürünler filtrelenir)
- **Gelecek:** Netsis sync başladığında `netsisCode` eşleşmesiyle otomatik güncellenecek

### 4 Bayi (Test Verisi, 2026-06-17)
| Bayi | Şehir | Kredi Limiti | Bakiye |
|------|-------|-------------|--------|
| Ankara Yapı Malz. | Ankara | 150.000 TL | ~45.000 TL |
| İzmir Ticaret A.Ş. | İzmir | 100.000 TL | ~72.000 TL |
| Bursa İnşaat Ltd. | Bursa | 200.000 TL | ~180.000 TL |
| Erzurum Yapı Market | Erzurum | 80.000 TL | ~15.000 TL |

### 11 Sipariş (test verisi)
- 2 PENDING_APPROVAL, 3 dün (SHIPPED, APPROVED, COMPLETED), 2 iki gün önce, 2 dört gün önce, 2 altı gün önce
- Her siparişte: `invoiceCut`, `invoiceNo`, `cashCollected`, `deliveryNoteCut` takip alanları

---

## 📁 ÖNEMLİ DOSYALAR

| Dosya | İçerik |
|-------|--------|
| `/home/can/sadoksan/CLAUDE.md` | Ana teknik context (AI için) |
| `/home/can/sadoksan/docs/SADOKSAN-CLAUDE.md` | **BU DOSYA** — Master context |
| `/home/can/sadoksan/YAPILACAKLAR.md` | Görev listesi + yapılanlar |
| `/home/can/sadoksan/info.md` | Hızlı referans / giriş bilgileri |
| `/home/can/sadoksan/NETSIS-ENTEGRASYON-PLANI.md` | Netsis fabrika ziyareti planı (2026-07-02) |
| `/home/can/sadoksan/docs/blok1.md` | Kök MD'lerin toparlanmış hali |
| `/home/can/sadoksan/docs/blok2.md` | Tasarım & planlama MD'leri |
| `/home/can/sadoksan/docs/blok3.md` | Uygulama planları & prod checklist |
| `/home/can/sadoksan/docs/sadoksan-sistem-tasarimi.md` | 35 bölümlü sistem tasarımı |
| `/home/can/sadoksan/docs/raporlar.md` | Rapor kataloğu (16 rapor) |
| `/home/can/sadoksan/docs/raporlar_update.md` | Plasiyer + rapor planı |
| `/home/can/sadoksan/docs/urun-katalogu.md` | 98 ürünlük Ideasoft kataloğu (referans) |
| `/home/can/sadoksan/docs/urun-katalogu.json` | Ürün kataloğu JSON (1346 satır) |
| `/home/can/sadoksan/docs/gelistirici-uygulama-rehberi.md` | 20 task breakdown |
| `/home/can/sadoksan/docs/mvp-faz-0-1-uygulama-plani.md` | Stok modülü MVPP planı |
| `/home/can/sadoksan/docs/b2b-only-refactor-plani.md` | B2B-only CUSTOMER temizliği |
| `/home/can/sadoksan/docs/production-release-checklist.md` | Prod çıkış checklist |
| `/home/can/sadoksan/docs/deployment-31mayis2026.md` | ⚠️ ESKİ — subpath routing dönemi |
| `/home/can/sadoksan/docs/oturum-ozetleri.md` | Oturum geçmişi |
| `/home/can/sadoksan/docs/musteri-istekleri.md` | Müşteri istekleri (2026-06-18) |
| `/home/can/sadoksan/apps/api/prisma/schema.prisma` | DB şeması (912 satır, 34 model) |
| `/home/can/sadoksan/.env` | Tüm secret'lar |
| `/home/can/netopenx.md` | Netsis NetOpenX dokümanı (738KB) |
| `/home/can/can-scrap/netsis-netopenx-docs.md` | Netsis API detay özeti |
| `/home/can/NIHAI.md` | Tüm sunucu projeleri haritası |

---

## 🧩 MEVCUT ÖZELLİKLER (2026-07-04)

### Admin Panel Sayfaları (19)
Dashboard, Siparişler, Ödemeler, **Bayiler** (sepet görünümü widget), **Plasiyerler**, CRM, **Ürünler** (marka filtresi + hızlı marka/kategori ekleme), Stok (uyarı sayfalama), Fiyat & Lojistik, Döviz Kurları, Popup & Kampanya, İndirimler, Bildirimler, Proforma, Raporlar, İçerik (CMS), Denetim Kaydı, Ayarlar

### Yeni Eklenen Özellikler (2026-06-18 → 2026-07-04)

- **Modüler Varyant Sistemi (Faz 3):** Varyant tipi tanımlama (Renk/Ebat/Desen/Özel) + grid ile toplu oluşturma. Değerleri virgülle gir, kartezyen çarpım tüm kombinasyonları otomatik üretir. Mükerrer önleme, çoklu-özellik badge gösterimi, stok alanı düzenleme. Hızlı Ekle korundu.
- **Bayi Sepet Görünümü:** Admin → Bayiler sayfasında her bayinin aktif/terkedilen sepeti. 3+ gün güncellenmemiş sepetler "terkedilmiş". `GET /dealer/carts` endpoint'i.
- **Marka Filtresi:** Admin ürün listesinde marka bazlı filtreleme. `GET /products/brands` endpoint'i Brand tablosundan beslenir.
- **Hızlı Marka/Kategori Ekleme:** Ürün formunda "+ Yeni" butonuyla formdan çıkmadan yeni marka veya kategori oluşturma. `createCategory` parentId desteği. `POST /products/brands` → Brand tablosuna yeni satır ekler, dropdown anında güncellenir.
- **Brand & Kategori Tam CRUD:** `Brand` ve `Category` tabloları için tam yönetim: oluşturma, güncelleme (isim değişince Product'taki denormalize string'ler de otomatik güncellenir), silme. `POST /api/products/seed-categories-brands` ile mevcut Product string'lerinden toplu popülasyon + brandId/categoryId bağlama.
- **Sipariş Yazdırma:** OrderDetailDrawer'da `@media print` CSS ile temiz çıktı, butonlar gizlenir.
- **Stok Uyarı Sayfalama:** Orta Uyarı ve Kritik Stok listeleri 10'ar sayfalı, gizli ürünler filtreleniyor.
- **Netsis Stok Import:** 896 gerçek ürün Excel'den içeri aktarıldı, push-agent planı hazır.

### Öne Çıkan Mevcut Özellikler
- **Test Siparişi Modal'ı:** Siparişler sayfasında "Test Siparişi" butonu → B2C/B2B seçimi, ürün, kart bilgisi → otomatik oluştur + öde
- **Toplu Onay:** Siparişler sayfasında "Tümünü Onayla" (pendingCount gösterir)
- **Test Bayi/Plasiyer:** Bayiler ve Plasiyerler sayfasında test verisi pre-filled modal (`DealerCreateModal.vue`, `userRole` prop ile hem DEALER hem PLASIYER destekler)
- **Dashboard Hızlı Test:** Tek tık B2C test siparişi (ilk stoktaki ürünle, demo kartla)
- **Dashboard Tanıtım Panosu (`IntroBanner.vue`):** 4 sekmeli (Genel Bakış/Modüller/Raporlama/Entegrasyon) koyu tema sistem tanıtım kartı. Ayarlar → toggle ile aç/kapat.
- **Kredi Limiti Inline Edit:** Bayi detay modal'ında kalem ikonu → inline input → Enter ile kaydet
- **Finansal Takip:** Her siparişte Fatura/Nakit/İrsaliye durumu yeşil/kırmızı dot ile OrderDetailDrawer'da
- **Rapor Formülleri:** 8 raporun hesaplama matematiği her kartın altında 📐 kutusunda. "Önizle" butonu → modal'da örnek veri + formül.
- **Dış Bayi Başvurusu:** Kapatıldı (`/bayilik` sayfası bilgi sayfasına dönüştü)
- **Kart Doğrulama Gevşetildi:** `payOrder` her kartı kabul ediyor, demo kart B2B auto-approve

### Backend Modülleri (18)
auth, products, orders, dealer, proforma, discounts, promo, popup, pricing, notifications, audit, cms, mailer, favorites, reports, netsis (🟡 API bekliyor), stock, logistics

---

## 📋 DOĞRULANMIŞ MODÜL DURUMU (Kod + DB kontrolü — 2026-07-04)

| Modül | MD'de yazan | Gerçek durum | Kanıt |
|-------|------------|-------------|-------|
| B2B-only refactor | YAPILACAKLAR.md'de ⬜ | ✅ TAMAM | UserRole'da CUSTOMER yok |
| Stok MVPP (StockMovement) | "Eklenecek" | ✅ TAMAM | Model + tablo + service + controller + UI |
| StockService | "Yapılacak" | ✅ TAMAM | `stock.module.ts`, `stock.service.ts`, `stock.controller.ts`, `ManualStockModal.vue`, `StockMovementDrawer.vue` |
| Modüler Varyant Sistemi | "Yapılacak" | ✅ TAMAM (Faz 3) | `ProductVariationEditor.vue` — tip tanımla + grid toplu oluşturma |
| netsisPendingQuantity | "Eklenecek" | ✅ TAMAM | Product modelinde `Int @default(0)` |
| Netsis stok import | "Planlandı" | ✅ TAMAM | 896 ürün içeri aktarıldı, `import-netsis-stock-excel.js` |
| Marka filtresi (admin) | Yoktu | ✅ YENİ | `urunler.vue` + `stores/products.ts` + `GET /products/brands` |
| Brand tablosu + CRUD | Yoktu | ✅ YENİ | `Brand` modeli + `createBrand/updateBrand/deleteBrand` + `seedCategoriesAndBrands()` |
| Hızlı marka/kategori ekleme | Yoktu | ✅ YENİ | `ProductFormModal.vue` "+ Yeni" butonları → `POST /products/brands`, `POST /products/categories` |
| Bayi sepet görünümü | Yoktu | ✅ YENİ | `GET /dealer/carts` + `bayiler.vue` widget |
| Sipariş yazdırma | Yoktu | ✅ YENİ | `@media print` CSS `OrderDetailDrawer.vue` |
| CountAdjustModal | Planlanmış | ❌ YOK | Planlanmış ama implemente edilmemiş |
| PaymentLog tablosu | TASK-01 | ❌ YOK | Planlanmış ama yok |
| ImportJob tablosu | TASK-01 | ❌ YOK | Planlanmış ama yok |
| Plasiyer test hesabı | CLAUDE.md'de var | ✅ MEVCUT | 2026-06-17 oluşturuldu |
| Roller (tasarım vs kod) | 9 rol planlanmış | 4 rol var | DEALER, PLASIYER, ADMIN, SUPER_ADMIN |

---

## 🟢 YAPILAN İŞLER (Kronolojik)

| Tarih | Olay |
|-------|------|
| 2026-05-31 | İlk deployment, 19 migration, 48 kategori, subpath routing |
| 2026-06-02/03 | Admin UI revizyonu (~15 commit), global prefix fix |
| 2026-06-05 | UI fixes, kategori menü, CMS sayfaları (5 commit) |
| 2026-06-08 | Netsis, Plasiyer, Rapor, Proforma onay (7 commit) |
| 2026-06-09 | 5 bug fix + kredi limiti + ürün filtre + MD toparlama |
| 2026-06-10 | Prod hardening + 192 görsel + Prisma 7.8 + 285 ürün |
| 2026-06-11 | Bayi login fix (kullanıcı adı + email) |
| 2026-06-17 | Test butonları, bayi/plasiyer yönetimi, tanıtım panosu, rapor formülleri, 11 sipariş + 4 bayi, finansal takip |
| **2026-06-18 → 07-02** | **Görsel yükleme fix, varyant sistemi Faz 3, CSV export fix, kategori/storefront filtre fixleri, stok uyarı sayfalama + gizli ürün filtresi, Netsis planlama + 896 ürün import, cari bakiye bug fix'leri** |
| **2026-07-04** | **Sipariş filtre fix (enum casing), marka filtresi, hızlı marka/kategori ekleme, sipariş yazdırma (@media print), bayi sepet görünümü, MD'ler güncellendi** |

---

## 🔴 PRODUCTION HARDENING — Güncel Durum

| # | Madde | Durum |
|---|-------|-------|
| H1 | JWT_SECRET güçlü | ✅ |
| H2 | Admin şifresi değişti | ✅ (elle) |
| H3 | POSTGRES_PASSWORD güçlü | ✅ |
| H4 | CORS_ORIGINS domain | ✅ |
| H5 | Test hesapları sil | 🔴 bayi@test.com hala DB'de |
| H6 | Backup cron | ✅ `0 2 * * *` aktif |

---

## 🟡 EKSİK TASK'LER (20 task'in durumu — 2026-07-04)

| # | Task | Durum |
|---|------|-------|
| TASK-01 | DB Migration (StockMovement ✅, PaymentLog ❌, ImportJob ❌) | KISMEN |
| TASK-02 | StockService | ✅ |
| TASK-03 | Admin Stok Sayfası | ✅ |
| TASK-04 | Havale Bildirim UI | KISMEN (BankTransfer var, UI eksik) |
| TASK-06 | CMS Sayfa Yönetimi | ✅ |
| TASK-07 | SEO 301 Yönlendirme | ❌ |
| TASK-08 | Checkout Sayfası | ❓ |
| TASK-09 | Admin Kullanıcı Yönetimi | ❌ |
| TASK-11 | Varyant Sistemi | ✅ (Faz 3 — modüler grid) |
| TASK-12 | Excel Import Wizard | ❌ |
| TASK-16 | Kupon Admin CRUD | ❌ |
| TASK-17 | Online Ödeme | 🔴 Mock only |
| TASK-19 | İade Yönetimi | ❌ |
| TASK-20 | SEO Migration Script | ❌ |

---

## 🗂️ YENİ EKLENEN COMPONENT'LER (2026-06-18 sonrası)

| Dosya | Ne işe yarar |
|-------|-------------|
| `ProductVariationEditor.vue` | **Yeniden yazıldı** — Varyant tipi tanımlama + grid ile toplu kartezyen üretim |
| `ProductFormModal.vue` | **Güncellendi** — Hızlı marka/kategori ekleme ("+ Yeni" butonları) |

## 🗂️ YENİ EKLENEN DOSYALAR (2026-06-18 → 2026-07-04)

| Dosya | Ne işe yarar |
|-------|-------------|
| `NETSIS-ENTEGRASYON-PLANI.md` | Fabrika ziyareti hazırlık — push-agent, sorular, API referans |
| `apps/api/src/scripts/import-netsis-stock-excel.js` | 896 ürünü Netsis Excel'den DB'ye aktaran script |
| `docs/musteri-istekleri.md` | Müşteri istekleri dokümanı (2026-06-18) |

## 🗂️ DEĞİŞTİRİLEN DOSYALAR (2026-06-18 → 2026-07-04)

| Dosya | Değişiklik |
|-------|-----------|
| `dealer.controller.ts` | `GET /dealer/carts` endpoint eklendi |
| `dealer.service.ts` | `getDealerCarts()` — aktif/terkedilen sepet analizi |
| `orders.service.ts` | Banka havalesi onayı → cari bakiye düşümü fix |
| `products.controller.ts` | `createCategory` + `createBrand` endpoint'leri eklendi |
| `products.service.ts` | `createCategory` parentId desteği, marka oluşturma |
| `ProductFormModal.vue` | Hızlı marka/kategori ekleme UI |
| `ProductVariationEditor.vue` | Tamamen yeniden yazıldı — modüler varyant Faz 3 |
| `siparisler.vue` | Filtre enum casing fix |
| `bayiler.vue` | Bayi sepet widget'ı eklendi |
| `urunler.vue` | Marka filtresi eklendi |
| `stok.vue` | Uyarı listeleri sayfalama + gizli ürün filtresi |
| `OrderDetailDrawer.vue` | @media print CSS + no-print class |
| `orders.ts` (store) | Filtre enum casing fix |
| `products.ts` (store) | Marka listesi + createBrand/createCategory |
| `ProductCard.vue` (storefront) | Ürün kartı tıklama linki fix |
| `useProducts.ts` (storefront) | Kategori filtresi fix |
| `date-range.helper.ts` (reports) | Tarih aralığı varsayılanı fix |
| `schema.prisma` | SiteSettings.introEnabled (migration) |

---

## ⚠️ BİLİNEN SORUNLAR & GOTCHA'LAR

1. **Admin panel SPA'dır** → `.env` değişikliğinde REBUILD şart
2. **Prisma 7.8 config:** `prisma.config.ts` gerekli, container'da manuel oluşturulabilir
3. **DB migration:** Container içinde `migrate dev` çalışmazsa doğrudan SQL kullan
4. **Disk:** Root partition 15GB — `docker system prune -af` ile temizlenebilir
5. **Rate limiting:** `/auth/login` 10 istek/15dk — test sırasında dikkat
6. **896 gizli ürün:** Stok uyarılarında filtrelenir, storefront'ta görünmez. Netsis sync ile otomatik eşleşecek.
7. **Proforma route sıralaması:** `pending`/`my` route'ları `:id`'den ÖNCE olmalı

---

## 🔜 BEKLEYEN ENTEGRASYONLAR

| Entegrasyon | Durum | Beklenen |
|-------------|-------|----------|
| Netsis ERP | 🟡 Kod hazır, 896 ürün import edildi | Fabrika ziyareti → API URL + credentials |
| Alneo E-Fatura | 🔴 | API dokümanı |
| Albaraka Ödeme | 🔴 Mock | Sanal POS bilgileri |
| Canmail SMTP | 🔴 Console | SMTP bilgileri |

---

## 🛠️ HIZLI KOMUT REFERANSI

```bash
cd /home/can/sadoksan

# Container durumu
docker compose -f docker-compose.prod.yml ps

# API log
docker logs sadoksan-api-prod --tail 50

# DB'ye bağlan
docker exec sadoksan-postgres-prod psql -U sadoksan -d sadoksan

# API health
curl http://127.0.0.1:3010/api/health

# Manuel backup
/home/can/backup-all-dbs.sh

# Nginx reload
sudo nginx -t && sudo systemctl reload nginx
```

---

*Bu dosya 2026-07-04 oturumunda, 2026-06-17 sonrası tüm commit'ler (14 commit: varyant Faz 3, Netsis planlama + 896 import, stok/bayi/sipariş/cari bug fix'leri, marka filtresi, hızlı marka/kategori ekleme, sipariş yazdırma, bayi sepet görünümü) incelenip CLAUDE.md + SADOKSAN-CLAUDE.md baştan sona güncellenerek oluşturuldu.*

**Session:** 2026-07-04 — Sadoksan: MD güncelleme (CLAUDE.md + SADOKSAN-CLAUDE.md), 14 commit'lik değişiklik analizi, 1,181 ürün (285+896), 18 modül, 34 model, varyant Faz 3, Netsis push-agent planı.
