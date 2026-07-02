# SADOKSAN ERP — Master Context (Claude için)

> **Sunucu:** 45.43.152.52 (motto-server) — Fedora 41, can kullanıcısı  
> **Son güncelleme:** 2026-06-17  
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
├── scripts/             # Backup ve seed script'leri
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

### Tablolar (35)

35 tablo: User, Dealer, Address, CartItem, Product, ProductVariation, Category, Brand, Order, OrderLine, OrderStatusHistory, StockReservation, StockMovement, Favorite, Discount, PromoCode, Popup, NotifyRequest, SiteContent, SiteSettings, Proforma, ProformaItem, ExchangeRate, BankTransfer, BalanceTransaction, AuditLog, NetsisSync, EdocumentLog, ...

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
| Admin | admin@admin.com | (değiştirildi, bilinmiyor) | Panel girişi |
| Bayi | bayi@test.com | bayi | Storefront bayi girişi |
| Bayi | ankara-yapi@test.com | test123 | Test bayisi |
| Bayi | izmir-ticaret@test.com | test123 | Test bayisi |
| Bayi | bursa-insaat@test.com | test123 | Test bayisi |
| Bayi | erzurum-yapi@test.com | test123 | Test bayisi |
| Plasiyer | ahmet.satis@test.com | test123 | Test plasiyer |

---

## 🔑 TEST VERİLERİ (2026-06-17 oluşturuldu)

### 4 Bayi
| Bayi | Şehir | Kredi Limiti | Bakiye |
|------|-------|-------------|--------|
| Ankara Yapı Malz. | Ankara | 150.000 TL | ~45.000 TL |
| İzmir Ticaret A.Ş. | İzmir | 100.000 TL | ~72.000 TL |
| Bursa İnşaat Ltd. | Bursa | 200.000 TL | ~180.000 TL |
| Erzurum Yapı Market | Erzurum | 80.000 TL | ~15.000 TL |

### 11 Sipariş (son 7 gün)
- **2 bugün PENDING_APPROVAL** — SDK-2026-5001, SDK-2026-5002
- 3 dün (SHIPPED, APPROVED, COMPLETED)
- 2 iki gün önce (SHIPPED, COMPLETED)
- 2 dört gün önce (COMPLETED, CANCELLED)
- 2 altı gün önce (COMPLETED)

### Sipariş Takip Alanları
Her siparişte: `invoiceCut` (fatura kesildi mi), `invoiceNo` (fatura no), `cashCollected` (nakit alındı mı), `deliveryNoteCut` (irsaliye kesildi mi)

---

## 📁 ÖNEMLİ DOSYALAR

| Dosya | İçerik |
|-------|--------|
| `/home/can/sadoksan/docs/SADOKSAN-CLAUDE.md` | **BU DOSYA** — Master context |
| `/home/can/sadoksan/CLAUDE.md` | Orijinal teknik context |
| `/home/can/sadoksan/YAPILACAKLAR.md` | Görev listesi (güncel değil) |
| `/home/can/sadoksan/docs/blok1.md` | Kök MD'lerin toparlanmış hali |
| `/home/can/sadoksan/docs/blok2.md` | Tasarım & planlama MD'leri |
| `/home/can/sadoksan/docs/blok3.md` | Uygulama planları & prod checklist |
| `/home/can/sadoksan/docs/sadoksan-sistem-tasarimi.md` | 35 bölümlü sistem tasarımı |
| `/home/can/sadoksan/docs/raporlar.md` | Rapor kataloğu (16 rapor) |
| `/home/can/sadoksan/docs/raporlar_update.md` | Plasiyer + rapor planı |
| `/home/can/sadoksan/docs/gelistirici-uygulama-rehberi.md` | 20 task breakdown |
| `/home/can/sadoksan/docs/mvp-faz-0-1-uygulama-plani.md` | Stok modülü MVPP planı |
| `/home/can/sadoksan/docs/b2b-only-refactor-plani.md` | B2B-only CUSTOMER temizliği |
| `/home/can/sadoksan/docs/production-release-checklist.md` | Prod çıkış checklist |
| `/home/can/sadoksan/docs/deployment-31mayis2026.md` | ⚠️ ESKİ — subpath routing dönemi |
| `/home/can/sadoksan/docs/oturum-ozetleri.md` | Oturum geçmişi |
| `/home/can/sadoksan/apps/api/prisma/schema.prisma` | DB şeması (899 satır, 34 model) |
| `/home/can/sadoksan/.env` | Tüm secret'lar |
| `/home/can/netopenx.md` | Netsis NetOpenX dokümanı |
| `/home/can/can-scrap/netsis-netopenx-docs.md` | Netsis API detay |
| `/home/can/NIHAI.md` | Tüm sunucu projeleri haritası |

---

## 🧩 MEVCUT ÖZELLİKLER (2026-06-17)

### Admin Panel Sayfaları
Dashboard, Siparişler, Ödemeler, Bayiler, **Plasiyerler** (yeni), CRM, Ürünler, Stok, Fiyat & Lojistik, Döviz Kurları, Popup & Kampanya, İndirimler, Bildirimler, Proforma, Raporlar, İçerik (CMS), Denetim Kaydı, Ayarlar

### Öne Çıkan Özellikler
- **Test Siparişi Modal'ı:** Siparişler sayfasında "Test Siparişi" butonu → B2C/B2B seçimi, ürün, kart bilgisi → otomatik oluştur + öde
- **Toplu Onay:** Siparişler sayfasında "Tümünü Onayla" (pendingCount gösterir)
- **Test Bayi/Plasiyer:** Bayiler ve Plasiyerler sayfasında test verisi pre-filled modal (`DealerCreateModal.vue`, `userRole` prop ile hem DEALER hem PLASIYER destekler)
- **Dashboard Hızlı Test:** Tek tık B2C test siparişi (ilk stoktaki ürünle, demo kartla)
- **Dashboard Tanıtım Panosu (`IntroBanner.vue`):** 4 sekmeli (Genel Bakış/Modüller/Raporlama/Entegrasyon) koyu tema sistem tanıtım kartı. **Ayarlar → "Dashboard Tanıtım Panosu" toggle** ile aç/kapat. Backend'de `SiteSettings.introEnabled` alanına kaydedilir.
- **Kredi Limiti Inline Edit:** Bayi detay modal'ında kalem ikonu → inline input → Enter ile kaydet (`PATCH /dealer/:id/credit-limit`)
- **Finansal Takip:** Her siparişte Fatura/Nakit/İrsaliye durumu yeşil/kırmızı dot ile OrderDetailDrawer'da gösterilir. DB'de `invoiceCut`, `invoiceNo`, `invoiceDate`, `cashCollected`, `cashCollectedAt`, `deliveryNoteCut` alanları.
- **Rapor Formülleri:** 8 raporun hesaplama matematiği her kartın altında 📐 kutusunda. "Önizle" butonu → modal'da örnek veri + formül.
- **Dış Bayi Başvurusu:** Kapatıldı (`/bayilik` sayfası bilgi sayfasına dönüştü), bayiler sadece admin tarafından oluşturulabiliyor.
- **Kart Doğrulama Gevşetildi:** `payOrder` her kartı kabul ediyor, demo kart (4111...) B2B auto-approve ayrıcalığını koruyor.

### Backend Modülleri (18)
auth, products, orders, dealer, proforma, discounts, promo, popup, pricing, notifications, audit, cms, mailer, favorites, reports, netsis (🟡 API bekliyor), stock, alneo (🔴 API bekliyor)

---

## 📋 DOĞRULANMIŞ MODÜL DURUMU (Kod + DB kontrolü)

| Modül | MD'de yazan | Gerçek durum | Kanıt |
|-------|------------|-------------|-------|
| B2B-only refactor | YAPILACAKLAR.md'de ⬜ | ✅ TAMAM | UserRole'da CUSTOMER yok, DB'de sadece DEALER |
| Stok MVPP (StockMovement) | "Eklenecek" | ✅ TAMAM | Model + tablo + service + controller + UI mevcut |
| StockService | "Yapılacak" | ✅ TAMAM | `stock.module.ts`, `stock.service.ts`, `stock.controller.ts`, `ManualStockModal.vue`, `StockMovementDrawer.vue`, `stores/stock.ts` |
| CountAdjustModal | — | ❌ YOK | Planlanmış ama implemente edilmemiş |
| PaymentLog tablosu | TASK-01 | ❌ YOK | Planlanmış ama yok |
| ImportJob tablosu | TASK-01 | ❌ YOK | Planlanmış ama yok |
| netsisPendingQuantity | "Eklenecek" | ✅ TAMAM | Product modelinde `Int @default(0)` |
| Plasiyer test hesabı | CLAUDE.md'de var | 🔴 DB'DE YOKTU | 2026-06-17 oluşturuldu ✅ |
| Roller (tasarım vs kod) | 9 rol planlanmış | 4 rol var | DEALER, PLASIYER, ADMIN, SUPER_ADMIN |
| URL yapısı | deployment-31mayis | DEĞİŞTİ | `/sadoksan/` → `sadoksan.smartinnventory.com` subdomain |

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
| **2026-06-17** | **Test butonları, bayi/plasiyer yönetimi, tanıtım panosu, rapor formülleri, 11 sipariş test verisi, finansal takip alanları** |

## 🔴 PRODUCTION HARDENING — Güncel Durum

| # | Madde | Durum |
|---|-------|-------|
| H1 | JWT_SECRET güçlü | ✅ |
| H2 | Admin şifresi değişti | ✅ (elle) |
| H3 | POSTGRES_PASSWORD güçlü | ✅ |
| H4 | CORS_ORIGINS domain | ✅ |
| H5 | Test hesapları sil | 🔴 bayi@test.com hala DB'de |
| H6 | Backup cron | ✅ `0 2 * * *` aktif |

## 🟡 EKSİK TASK'LER (20 task'in durumu)

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
| TASK-12 | Excel Import Wizard | ❌ |
| TASK-16 | Kupon Admin CRUD | ❌ |
| TASK-17 | Online Ödeme | 🔴 Mock only |
| TASK-19 | İade Yönetimi | ❌ |
| TASK-20 | SEO Migration Script | ❌ |

---

## 🗂️ YENİ EKLENEN COMPONENT'LER (2026-06-17)

| Dosya | Ne işe yarar |
|-------|-------------|
| `TestOrderModal.vue` | B2C/B2B test siparişi modal'ı — ürün seç, kart bilgisi, otomatik oluştur+öde |
| `DealerCreateModal.vue` | Bayi/Plasiyer oluşturma modal'ı — `userRole` prop ile iki rolü de destekler |
| `IntroBanner.vue` | Dashboard tanıtım panosu — 4 sekme, koyu tema, Ayarlar'dan toggle |
| `plasiyerler.vue` | Plasiyer listesi sayfası — yeni sidebar linki ile |

## 🗂️ DEĞİŞTİRİLEN DOSYALAR (2026-06-17)

| Dosya | Değişiklik |
|-------|-----------|
| `orders.service.ts` | Kart doğrulama gevşetildi (`isValidCardNumber` + `isDemoCard`) |
| `dealer.controller.ts` | `PATCH /:id/credit-limit` endpoint eklendi |
| `dealer.service.ts` | `updateCreditLimit()` metodu eklendi |
| `cms.service.ts` | `introEnabled` alanı eklendi |
| `schema.prisma` | SiteSettings.introEnabled, Order tracking alanları eklendi |
| `siparisler.vue` | Test siparişi butonu, toplu onay butonu |
| `index.vue` | Hızlı test siparişi kartı, IntroBanner |
| `bayiler.vue` | Yeni Bayi / Test Bayi butonları, kredi limiti inline edit |
| `raporlar/index.vue` | Formül kutuları, önizleme modal'ı, örnek veriler |
| `AppShell.vue` | Plasiyerler sidebar linki |
| `OrderDetailDrawer.vue` | Finansal takip (Fatura/Nakit/İrsaliye) bölümü |
| `ayarlar.vue` | Dashboard tanıtım panosu toggle |
| `bayilik.vue` | Dış başvuru kapatıldı → bilgi sayfası |
| `types/index.ts` | Order + SiteSettings tipleri güncellendi |
| `stores/settings.ts` | introEnabled eklendi |

---

## ⚠️ BİLİNEN SORUNLAR & GOTCHA'LAR

1. **Admin panel SPA'dır** → `.env` değişikliğinde REBUILD şart
2. **Prisma 7.8 config:** `prisma.config.ts` gerekli, container'da manuel oluşturulabilir
3. **DB migration:** Container içinde `migrate dev` çalışmazsa doğrudan SQL kullan
4. **Disk:** Root partition 15GB — `docker system prune -af` ile temizlenebilir
5. **Rate limiting:** `/auth/login` 10 istek/15dk — test sırasında dikkat

---

## 🔜 BEKLEYEN ENTEGRASYONLAR

| Entegrasyon | Durum | Beklenen |
|-------------|-------|----------|
| Netsis ERP | 🟡 Kod hazır | API URL + credentials |
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

*Bu dosya 2026-06-17 oturumunda, tüm Sadoksan MD'leri (CLAUDE.md, YAPILACAKLAR.md, info.md, README.md, 11 docs MD'si, 3 blok MD'si) okunup çapraz doğrulanarak oluşturuldu.*

**Session:** 2026-06-17/18 — Sadoksan: test butonları, bayi/plasiyer yönetimi, tanıtım panosu, rapor formülleri, finansal takip, 11 sipariş + 4 bayi, varyant UI, mobil fix, tüm client istekleri. JamContest: auth fix (localStorage→memory, cookie refresh), dark mode (55 sayfa), güvenlik denetimi (JWT, CSRF, XSS), hesaplar, tema optimizasyonu
