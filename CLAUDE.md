# CLAUDE Project Context: Sadoksan ERP

**Project:** Sadoksan — Modular ERP system (B2B + B2C ecommerce hybrid)  
**Last Updated:** 2026-05-20  
**Owner:** John (brkcnt6@gmail.com)

## Tech Stack

| Layer | Tech | Version | Notes |
|-------|------|---------|-------|
| **Storefront** | Nuxt 4 | 4.4+ | SSR for SEO, B2C + B2B dealer portal |
| **Admin Panel** | Nuxt 4 | 4.4+ | SPA-optimized, same framework as storefront |
| **Backend API** | NestJS | 11+ | All integrations, background jobs, business logic |
| **Database** | PostgreSQL | 15+ | Primary data store |
| **ORM** | Prisma | 5+ | Type-safe schema + migrations |
| **Background Jobs** | Redis + BullMQ | - | Order processing, sync jobs, notifications |
| **Images/Assets** | ideaSoft migration | - | 4000 SKU product catalog with images |
| **E-Documents** | Alneo APIs | - | E-invoice, e-archive, e-portal, e-irsaliye |
| **ERP System** | Netsis APIs | - | Product master, stock, cari (customer) accounts |
| **Container** | Docker | Multi-stage builds | Development + production setup |
| **Package Manager** | pnpm | 8+ | Monorepo support, faster installs |

## Architecture Overview
sadoksan/ (monorepo root)
├── apps/
│   ├── storefront/          # B2C customer interface + dealer panel (Nuxt 4)
│   ├── admin/               # Factory admin operations (Nuxt 4)
│   └── api/                 # NestJS backend - ALL business logic
├── packages/
│   ├── shared/              # Common types, Prisma schema, utilities
│   └── ui/                  # Shared Vue components
├── docker-compose.yml       # Production environment
├── docker-compose.dev.yml   # Development environment (HOT RELOAD, debugging)
└── docker-compose.prod.yml  # Alternative prod config

**Critical principle:** Nuxt is presentation-layer only. All stateful, integrative, compliance-heavy work lives in NestJS backend.

## Key Integrations

### 1. Netsis (Ürün Yönetimi)
- **What:** ERP master data source (products, stock, cari accounts)
- **Scope:** 
  - Fetch 4000 SKUs + metadata (daily)
  - Real-time stock sync (NOT 12am batched—risk of overselling)
  - Cari hesap (customer account) master list
  - Pending order tracking for stock reservation
- **API Type:** REST or SOAP (TBD based on Netsis version)
- **NestJS Module:** `apps/api/src/modules/netsis/`
- **Risk:** Stock sync window = overselling window. **MUST** move to hourly or event-based polling.

### 2. Alneo (E-Belgeler)
- **What:** Turkish e-invoice, e-archive, e-portal, e-irsaliye provider
- **Scope:**
  - Auto-generate & submit invoices when order ships
  - Retrieve e-irsaliye (shipping document)
  - Portal access for dealers to view archived docs
- **API Type:** REST w/ OAuth
- **NestJS Module:** `apps/api/src/modules/alneo/`
- **Trigger:** Order fulfillment state change

### 3. ideaSoft (Ürün Migrasyonu)
- **What:** Legacy product catalog + images
- **Scope:** One-time migration of 4000 products + images
- **Approach:** Batch import script, validate against Netsis
- **Storage:** PostgreSQL for metadata, filesystem/S3 for images

## Critical Requirements & Constraints

### Stock Management (RISK AREA)
- Display stock formula: `stock_display = netsis_total_stock - pending_orders_on_site`
- **Current problem:** Netsis sync at 12am means stale pending status
- **Solution required before launch:**
  - Option A: Hourly sync from Netsis
  - Option B: Event-driven sync (if Netsis supports webhooks)
  - Option C: Cron every 30min minimum
- Site stock decreases immediately when order placed (reservation)
- When Netsis updates status from "pending" to "shipped," remove reservation

### Dealer Onboarding (APPROVAL WORKFLOW)
- Dealers self-register → wait for admin approval
- **Must match** to Netsis cari account (customer account number)
- **Validation required:** Dealer provides cari hesap numarası, validate against Netsis synchronously
- Once approved: can order, see own invoices/cari balance

### Pricing (DYNAMIC BY REGION)
- B2C: Fixed retail prices
- B2B: Base price + logistics surcharge (varies by dealer şehir/region)
- **Unclear ownership:** Is regional pricing in site or Netsis? Decide before implementation.
- Logistics surcharge auto-applied when dealer location is known

### Orders & Approvals
- B2C: Immediate order (payment gateway → fulfillment)
- B2B (dealer): Order → "Onay Bekleniyor" (awaiting approval) → Admin approves → fulfillment
- Pending orders must be visible to admin dashboard

### Reports (Dealer Self-Service)
- Cari account statement (invoice history, balance, aging)
- Stock/price snapshot (export to Excel)
- Order history

### Features (From Requirements)
- ✅ Product visibility toggle (admin)
- ✅ Product purchasability toggle (can be visible but not buyable)
- ✅ Favorite items (B2C + dealers)
- ✅ Notify when available → WhatsApp to Serpil or email
- ✅ Cart reminders (periodic emails)
- ✅ Pop-ups: General + dealer-specific (with logistics info)
- ✅ Dealer active/inactive toggle
- ✅ Maintenance mode
- ✅ Product variations (API ready, admin UI, storefront selector)
- ✅ Categories (98 products, 9 categories from sadoksaninsaat.com.tr)
- ✅ Excel export for stock/price reports (CSV + totals + TL format)
- ✅ Mock payment (kredi kartı simülasyonu)
- ✅ Stock display formula (netsisStock - ACTIVE reservations, live sync)
- ✅ Dealer dashboard (tek sayfa: /bayi, tablı yapı)
- ✅ Dealer self-register → admin approval
- ✅ JWT auth (7d expiry, dealer-specific API guard)
- ✅ Password reset (forgot/reset flow)
- ✅ Discount module (ürün/kategori/marka bazlı % veya sabit)
- ✅ CMS module (hero banner, site settings)
- ✅ Mailer module (console logger, SMTP'ye hazır)
- ✅ Unit tests (Jest: 13 tests passing)
- ❌ Netsis API entegrasyonu (API bekleniyor)
- ❌ Gerçek ödeme sistemi (sanal POS, havale)
- ❌ Alneo e-belge entegrasyonu
- ❌ Excel import for price updates (too risky—implement as preview → approval + audit later)

## Docker Setup (Production-Ready)

### Multi-Stage Build Strategy
- **Build stage:** Compile TS, install all deps
- **Runtime stage:** Copy only dist/, prod deps, environment config
- **Image size target:** <200MB per service (Nuxt + API combined)

### dockerfile patterns (Standard for 2026)
- Node.js 20 LTS minimum (NestJS 11 requirement)
- Alpine Linux for size (<20MB base)
- Non-root user (security)
- Health checks on all services
- Named volumes for PostgreSQL persistence

### Docker Compose: Development vs Production

**WHY TWO FILES?** 
- **Dev** = rapid iteration (hot reload, debugging, loose resource limits)
- **Prod** = stability & performance (optimized images, fixed deps, secure logging)
- Single `docker-compose.yml` = copy-paste hell, hard to diff, prod mistakes leak into dev

**NEVER run `docker compose up` alone.** Always specify `-f`:

```bash
# DEVELOPMENT (hot reload, Vite polling, seed data)
docker compose -f docker-compose.dev.yml up

# PRODUCTION (optimized, no hot-reload)
docker compose -f docker-compose.prod.yml up
```

**File breakdown:**
- `docker-compose.dev.yml` 
  - Nuxt 4.4.4 (HMR enabled, vite polling optimized)
  - Bind-mount source code (live reload)
  - Relaxed resource limits for debugging
  - Seed scripts auto-run on startup
  - Verbose logging
  
- `docker-compose.prod.yml`
  - Multi-stage builds (dist/ only, no source)
  - Strict resource limits
  - Health checks on all services
  - Log aggregation ready
  - Fixed versions (no auto-updates)

**Environment configuration:**
- `.env.dev`: development values (localhost, debug logging)
- `.env.prod`: production secrets (injected at runtime, never in Dockerfile)

### Services in docker-compose
- `postgres`: PostgreSQL 15
- `redis`: Redis (BullMQ jobs)
- `api`: NestJS on :3001
- `storefront`: Nuxt 4 on :3000
- `admin`: Nuxt 4 on :3002

## Project Structure (Nuxt 4 Flat Structure)
apps/storefront/
├── app/
│   ├── pages/          # Route pages (auto-routing)
│   ├── components/     # Shared Vue components
│   ├── layouts/
│   ├── composables/    # Reusable logic hooks
│   ├── middleware/
│   └── plugins/
├── server/
│   └── routes/         # Route handlers (if needed)
├── public/
├── nuxt.config.ts      # Nuxt config + presets
├── tsconfig.json
└── package.json
apps/api/
├── src/
│   ├── modules/        # Feature-based modules
│   │   ├── auth/
│   │   ├── products/
│   │   ├── dealers/
│   │   ├── orders/
│   │   ├── netsis/     # Netsis integration
│   │   ├── alneo/      # Alneo integration
│   │   ├── stock/
│   │   ├── pricing/
│   │   ├── reports/
│   │   └── notifications/
│   ├── common/
│   ├── config/
│   └── main.ts
├── dist/               # Compiled output
├── prisma/schema.prisma
└── package.json
packages/shared/
├── types/              # Shared TypeScript types
├── schemas/            # Zod/Prisma schemas
├── prisma/schema.prisma
└── utils/

## Database Schema (Prisma)

**Core entities:**
- `User` (B2C customers + admin users)
- `Dealer` (B2B accounts, tied to Netsis cari)
- `Product` (from Netsis, with site-specific metadata: visibility, purchasability)
- `ProductVariation` (TBD: source?)
- `Order` (B2C immediate, B2B approval-pending)
- `OrderLine` (order items)
- `CartItem` (temporary)
- `Favorite` (user → product)
- `ReservedStock` (for pending B2B orders)
- `DealerLocation` (şehir, logistics region)
- `LogisticsRule` (base_price, region, surcharge)
- `PopupConfig` (general + dealer-targeted)
- `AuditLog` (who did what, when—for Excel imports)

**Sync tables:**
- `NetsisProductSync` (last fetch time, delta tracking)
- `NetsisStockSnapshot` (hourly snapshot for reconciliation)
- `NetsisCariSync` (customer account master)

## Known Risks & Gotchas

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Stock sync delay (12am batch)** | Overselling, customer disappointment | Move to hourly+. Implement display stock = total - pending |
| **Dealer → Netsis cari matching** | Duplicate accounts, order routing errors | Require cari hesap# at signup, validate sync |
| **Variation source ambiguity** | Sync nightmare if site variations ≠ Netsis | Document single source of truth upfront |
| **Excel import safety** | Bad data import, stock corruption | Implement preview + approval + audit trail |
| **Regional pricing logic unclear** | Implementation delays | Decide ownership (site vs Netsis) before coding |
| **Alneo auto-invoice timing** | Non-compliance if triggered wrong | Document exact trigger (order ship, payment confirm, etc.) |
| **Dealer pending order visibility** | Admin can't see what's being held | Build ReservedStock table + dashboard widget |

## Development Workflow

### Starting the Stack (ALWAYS use docker-compose.dev.yml)

```bash
# 1. Ensure pnpm installed locally (host machine)
npm install -g pnpm@8.15.0

# 2. Clean full rebuild (when deps are corrupted or IPC errors occur)
docker compose -f docker-compose.dev.yml down -v  # -v = destroy volumes
rm -rf apps/storefront/dist apps/admin/dist apps/api/dist  # CRITICAL: delete dist folders
pnpm install --frozen-lockfile  # regenerate pnpm-lock.yaml
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up

# 3. Normal startup (after first build)
docker compose -f docker-compose.dev.yml up
```

### Development Behavior
- **Hot reload:** Source files watched, Nuxt HMR auto-reloads browser
- **Database:** Prisma migrations auto-run on startup
- **Seeding:** Test data (dealers, products) auto-populated
- **Vite polling:** Enabled to handle WSL2 inotify limits
- **IPC:** Nuxt 4.4.4 includes fix for IPC connection errors
- **Testing:** Vitest for unit, Playwright for e2e (headless)

## Known Unknowns (To Spec Before Coding)

- [ ] Variation source: Netsis or site-defined?
- [ ] Regional pricing: logic lives where? (site config or Netsis master?)
- [ ] Netsis API type: REST or SOAP? Which version?
- [ ] Alneo invoice trigger: when exactly? (order placed, paid, shipped?)
- [ ] Excel import: approved or scrapped for now?
- [ ] Dealer self-register vs admin-created?
- [ ] Maintenance mode: blocks all users or just frontend?

## References

- [Nuxt 4.4 Documentation](https://nuxt.com/docs/4.x)
- [Docker – Nuxt Content](https://content.nuxt.com/docs/deploy/docker)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma ORM Docs](https://www.prisma.io/docs)

---

**Last Review:** 2026-05-23 | **Status:** E-ticaret altyapısı + bayi raporları inşası

## 2026-05-20 Session — Yapılanlar

### Dashboard Birleştirme
- `/bayi` ve `/dealer` tek sayfada birleştirildi (`/bayi`)
- DEALER ve CUSTOMER rolleri için ayrı KPI kartları ve tab'lar
- `/dealer` → `/bayi` redirect
- `/hesabim` sadece profil ayarları (sipariş/favori linkleri dashboard'a taşındı)
- Header: tek "Bayi Girişi" butonu, direkt `/giris`'e

### Ödeme Sistemi (Mock)
- `POST /orders/:id/pay` — mock endpoint, kart bilgisiyle direkt PAID
- `PaymentStatus` enum: PENDING, PAID, FAILED
- `paymentMethod`: CREDIT_CARD, BANK_TRANSFER
- Sepette kredi kartı seçimi + kart bilgisi formu
- Test kartı: 4111 1111 1111 1111 / 12/28 / 123

### Stok Formülü Düzeltme
- `recalcDisplayStock()`: her rezervasyon değişikliğinde `displayStock = netsisStock - ACTIVE_reservations`
- Sipariş oluşturma/iptal/red/sevk sonrası stok anında güncelleniyor

### Ürün Varyasyonları
- CRUD endpoint'leri: `GET/POST/PATCH/DELETE /products/:id/variations`
- Admin panel varyasyon editörü çalışır durumda

### Excel Rapor İyileştirmeleri
- Tüm raporlara toplam satırı eklendi
- TL formatı: `₺12,150.00`
- Yeni **Detaylı Rapor**: ürün bazlı sipariş dökümü
- Yıllık rapora yıllık toplam eklendi
- CSV indirme `fetch().blob()` ile düzeltildi

### Bug Düzeltmeleri
- `useDealerApi` JWT Bearer token gönderiyor (401 hatası çözüldü)
- `req.user.id` → `req.user.sub` (JWT strategy `sub` dönüyordu)
- Sepet checkout'ta `paymentMethod` backend'e gönderiliyor
- Blob download `createObjectURL` hatası düzeltildi

### Mock Veri (test@test.com — şifre: asd123)
- Bayi: Ahmet Yılmaz / Yılmaz Yapı Malzemeleri / İstanbul
- 25 sipariş (Mart-Mayıs 2026), 288,680 TL cari bakiye
- 5 görselli seramik ürünüyle gerçekçi alışveriş geçmişi
- 3 onay bekleyen sipariş, 20 tamamlanmış

### Test Hesapları
| Email | Şifre | Rol | Bayi |
|-------|-------|-----|------|
| test@test.com | asd123 | DEALER | Ahmet Yılmaz (İstanbul, 288k TL) |
| erzurum@test.com | asd123 | DEALER | Ali Kaya (Erzurum, 3.6k TL) |
| bayi@test.com | asd123 | DEALER | Mehmet Demir (Ankara, 0) |
| admin@admin.com | asd123 | ADMIN | — |

## Sıradaki İşler (Öncelik Sırası)

### 🔴 Şu an üzerinde çalışılan (2026-05-23)
1. **E-ticaret altyapı tamamlama** — Sepet API, adres defteri, sipariş akışı, kargo takip
2. **Bayi raporları** — Risk, yaşlandırma, performans, sipariş özet
3. **Kategori/Marka entity** — Ayrı tablo, admin yönetimi

### 🟡 API bekleniyor (şimdilik durduruldu)
4. **Gerçek Ödeme** — Sanal POS, havale bildirimi (Iyzico/PayTR API)
5. **Netsis API** — Canlı stok, cari hesap doğrulama
6. **SMTP Mailer** — Nodemailer (sunucu + domain alınınca)

### 🔵 Sonra
7. **Hibrit ödeme (Cari + Bakiye)** — Dealer.balance, BalanceTransaction, güvenlikli ödeme akışı
8. **Alneo E-fatura** — E-fatura, e-irsaliye, e-arşiv
9. **E2E Testler** — Playwright
10. **Production Deploy** — Domain, SSL, docker-compose.prod.yml

---

## 2026-05-20 Session #2 — Total Cycle Use Case & Backend Modülleri

### Yeni Backend Modülleri (4 adet)
- **Popup modülü** (`apps/api/src/modules/popup/`) — Popup CRUD, audience targeting (ALL/B2C/B2B/SPECIFIC_DEALER), active check, impression/click tracking
- **Pricing modülü** (`apps/api/src/modules/pricing/`) — RegionalPricingSurcharge + ProvincePricingSurcharge + LogisticsRule CRUD
- **Audit modülü** (`apps/api/src/modules/audit/`) — AuditLog sorgulama (entity/action/userId/dateRange filtreli, paginated)
- **Notifications modülü** (`apps/api/src/modules/notifications/`) — NotifyRequest CRUD, send (mailer entegrasyonu), stok uyarısı

### Prisma Schema Güncellemeleri
- `Popup` modeli + `PopupAudience` enum eklendi
- `NotifyRequest` modeli eklendi (Product + User relation'larıyla)

### Admin Store Dönüşümleri (localStorage → API)
- `popups.ts` → `/api/admin/popups` endpoint'lerine bağlandı
- `audit.ts` → `/api/admin/audit` endpoint'lerine bağlandı
- `pricing.ts` → `/api/admin/pricing/*` endpoint'lerine bağlandı (regional/province/logistics)
- `notifications.ts` → `/api/admin/notifications` endpoint'lerine bağlandı
- `stock.ts` → `/netsis/sync/stock` ve `/netsis/status/stock` endpoint'lerine bağlandı

### Storefront Güncellemeleri
- **PopupDisplay.vue** — Login sonrası popup gösterimi. Audience filtreleme (anon→all, B2C→all+b2c, B2B→all+b2b+specific). X ile kapatma, localStorage persistence, impression/click tracking. Z-index 100 Teleport modal.
- **ProductCard** — Favori butonu API'ye bağlandı (toggle favorite, kalp dolgusu)
- **Header** — Arama input'u eklendi (odaklanınca genişliyor, Enter ile `/urunler?search=...` yönlendirme)

### app.module.ts
- PopupModule, PricingModule, AuditModule, NotificationsModule kaydedildi

### Migration & Test Durumu (2026-05-20 Session #2)
- Migration `20260520173335_add_popup_notify` başarıyla uygulandı (Popup + NotifyRequest tabloları)
- **28/28 test geçti** (auth:10, products:3, orders:15)
- Docker container'lar çalışıyor: storefront:3000, admin:3002, api:3001, python:5000
- .env DATABASE_URL `127.0.0.1` olarak düzeltildi (localhost IPv6 sorunu)

---

## PROD READINESS CHECKLIST — Production'a Çıkmak İçin Tüm Eksikler

### 1. GÜVENLİK (CRITICAL)
- [ ] JWT_SECRET değiştir (`dev-secret-change-in-production` → 32+ char random)
- [ ] Admin panel URL'si değiştir (`/sadoksanadmin` → random path veya subdomain)
- [ ] HTTPS/SSL sertifikası (Let's Encrypt veya ticari)
- [ ] CORS sadece kendi domain'lerine izin ver
- [ ] Rate limiting (özellikle `/auth/login`, `/auth/register`)
- [ ] Helmet middleware (güvenlik header'ları)
- [ ] Input validation (class-validator DTO'lar eksiksiz)
- [ ] SQL injection kontrolü (Prisma parametrize, ama raw query'ler var mı?)
- [ ] Hassas bilgiler loglanmamalı (şifre, token, kredi kartı)

### 2. ALTYAPI (CRITICAL)
- [ ] **docker-compose.prod.yml** — şu anda YOK, oluşturulması lazım
- [ ] Multi-stage Dockerfile (prod build: sadece dist/, prod deps)
- [ ] PostgreSQL volume persistence (veri kaybı olmamalı)
- [ ] PostgreSQL backup strategy (pg_dump cron)
- [ ] Redis persistence (BullMQ job'ları kaybolmamalı)
- [ ] Health check endpoint'leri tüm servislerde
- [ ] Container restart policy (`unless-stopped`)
- [ ] Non-root user ile çalıştırma (security)
- [ ] Log aggregation (docker logs → file → rotation)
- [ ] Environment variable yönetimi (.env.prod, Docker secrets)
- [ ] Domain + DNS yapılandırması
- [ ] Reverse proxy (Nginx/Traefik) — storefront, admin, api routing

### 3. EKSİK ÖZELLİKLER (HIGH)
- [ ] **Gerçek ödeme** — Sanal POS (Iyzico/PayTR) veya havale bildirimi
- [ ] **SMTP Mailer** — Nodemailer ile gerçek email (onay, şifre sıfırlama, sipariş)
- [ ] **Alneo E-fatura** — E-fatura, e-irsaliye, e-arşiv entegrasyonu
- [ ] **Netsis entegrasyonu** — Gerçek API bağlantısı (placeholder durumda)
- [ ] **Ürün görselleri** — ideaSoft'tan 4000 ürün görseli migrate edilecek
- [ ] **Popup sistemi** — Backend hazır, storefront component hazır → admin panel test edilecek
- [ ] **İndirim admin sayfası** — `/indirimler` sayfası yok (backend hazır!)
- [ ] **Fiyatlandırma API** — Backend yeni yapıldı, admin panel API'ye bağlandı → test
- [ ] **Denetim log'ları** — Backend hazır, admin panel API'ye bağlandı → test
- [ ] Sipariş geçmişi API'den çekiliyor mu? (storefront hala localStorage olabilir)
- [ ] Favoriler API'ye bağlandı mı? (ProductCard favori butonu yeni yapıldı)
- [ ] Lojistik bedeli API'den hesaplanıyor mu? (hardcoded 40TL olabilir)

### 4. VERİTABANI & VERİ (HIGH)
- [ ] Production seed data (demo veriler yerine gerçek başlangıç verisi)
- [ ] Ürün kataloğu tamamlanacak (98 ürün, 9 kategori sadoksaninsaat.com.tr'den)
- [ ] Kategori görselleri ve metadata
- [ ] Database index optimizasyonu (sık sorgulanan alanlar)
- [ ] Migration'ların prod'da sorunsuz çalıştığı test edilecek
- [ ] Cari hesap geçmişi gerçek veriyle doldurulacak

### 5. TESTLER (HIGH)
- [ ] E2E testler (Playwright) — kritik akışlar: kayıt, giriş, sepete ekle, sipariş
- [ ] Daha fazla unit test (şu an 28 test, coverage düşük)
- [ ] API integration testleri (gerçek DB ile)
- [ ] Load test (katalog sayfası, sipariş oluşturma)
- [ ] Mobile responsive test (tüm sayfalar)

### 6. YASAL UYUMLULUK (MEDIUM)
- [ ] KVKK metni (kişisel verilerin korunması)
- [ ] Mesafeli satış sözleşmesi (sayfalar var, içerik kontrol edilecek)
- [ ] Gizlilik politikası
- [ ] Çerez politikası ve cookie consent banner
- [ ] Ticari elektronik ileti onayı (ticari email/whatsapp için)
- [ ] Fatura/irsaliye bilgileri (vergi no, ticaret sicil)

### 7. PERFORMANS (MEDIUM)
- [ ] Ürün görselleri optimizasyonu (WebP, lazy load, CDN)
- [ ] API response caching (Redis ile sık çağrılan endpoint'ler)
- [ ] Nuxt SSR caching
- [ ] Bundle size optimizasyonu (tree shaking, lazy routes)
- [ ] Database connection pooling (Prisma ayarları)

### 8. MONITORING (MEDIUM)
- [ ] Error tracking (Sentry veya benzeri)
- [ ] Uptime monitoring (health check endpoint)
- [ ] API metrikleri (istek sayısı, response time, hata oranı)
- [ ] Disk/CPU/RAM alert'leri

### 9. STOREFRONT EKSİKLERİ (MEDIUM)
- [ ] Arama input'u çalışır durumda (yeni eklendi)
- [ ] Favori API bağlantısı tamam (ProductCard yapıldı, sayfa kaldı)
- [ ] `/favori-urunler` sayfası API'den çekiyor (mock data değil)
- [ ] `/siparislerim` sayfası API'den çekiyor (localStorage değil)
- [ ] `/urunler/[slug]` detay sayfası zenginleştirilecek
- [ ] Middleware (route guard) eklenecek
- [ ] 404 sayfası
- [ ] SEO meta tag'leri (ürün, kategori, sayfa bazlı)

### 10. ADMIN PANEL EKSİKLERİ (MEDIUM)
- [ ] `/indirimler` sayfası oluşturulacak (backend Discounts modülü hazır)
- [ ] Dealer detay modal/sayfa (cari geçmiş, sipariş listesi, pricing override)
- [ ] CMS içerik yönetimi (hero dışındaki sayfalar)
- [ ] Toplu işlemler (toplu bayi onayı, toplu ürün görünürlük)
- [ ] Bildirim gönderme gerçek SMTP/WhatsApp bağlantısı
- [ ] Netsis sync dashboard gerçek veriyle çalışacak (placeholder değil)
- [ ] Admin dashboard KPI'ları gerçek API verisiyle (bazıları localStorage)

### 11. DOKÜMANTASYON (LOW)
- [ ] API dokümantasyonu (Swagger/OpenAPI)
- [ ] Deployment guide (production kurulum adımları)
- [ ] Backup/restore prosedürü
- [ ] Kullanıcı rolleri ve yetki matrisi

### Öncelik Sıralaması
| Öncelik | Kategori | Tahmini Efor |
|---------|----------|---------------|
| **P0** | Güvenlik (JWT, HTTPS, CORS) | 2-3 gün |
| **P0** | Altyapı (docker-compose.prod, backup) | 3-5 gün |
| **P1** | Gerçek ödeme entegrasyonu | 5-10 gün |
| **P1** | SMTP Mailer | 1-2 gün |
| **P1** | Eksik admin sayfaları (indirim, CMS) | 2-3 gün |
| **P1** | E2E testler | 3-5 gün |
| **P2** | Storefront eksikleri | 3-5 gün |
| **P2** | Yasal uyumluluk | 2-3 gün |
| **P2** | Alneo E-fatura | 5-10 gün |
| **P2** | Netsis entegrasyonu | 5-10 gün |
| **P3** | Performans optimizasyonu | 3-5 gün |
| **P3** | Monitoring | 2-3 gün |

---

## 2026-05-23 Session — E-ticaret Altyapısı + Bayi Raporları

### Commit: `3a80834` — 100 dosya, 20,166 ekleme
- 7 yeni backend modülü: audit, cms, discounts, mailer, notifications, popup, pricing
- 7 migration: discounts, site_content, payment_fields, popup_notify, product_images_gallery, order_status_history, return_status
- Admin: crm.vue, indirimler.vue, tüm store'lar API'ye bağlandı
- Storefront: popup display, auth middleware, şifre sıfırlama akışı
- Test: 28/28 geçiyor
- TS fix: orders.service.ts null → undefined

### Docker Durumu
- 6/6 servis healthy: postgres, redis, api, storefront, admin, python
- postgres/redis ayağa kalkmıyordu → docker compose up -d postgres redis ile düzeldi

### Hibrit Ödeme Sistemi (Planlandı, sonra yapılacak)
- **Model:** Dealer'a `balance` (prepaid) + mevcut `creditLimit` (açık hesap)
- **BalanceTransaction:** Tüm bakiye hareketleri (TOPUP/DEDUCTION/REFUND)
- **Order.paymentSource:** CARI / BALANCE / SPLIT
- **Güvenlik:** Prisma interactive transaction, atomic bakiye/limit kontrolü, açık kapı yok
- **Admin:** Bayi detay sayfası → bakiye yükleme, limit ayarlama
- **Storefront:** Sepette ödeme kaynağı seçimi

### E-ticaret Altyapı Eksikleri (Bu hafta)
1. ✅ Sipariş COMPLETED endpoint + completedAt (fc8e149)
2. ✅ Kategori/Marka entity — ayrı tablo, admin CRUD, 9 kat + 19 marka seed (ec2f215)
3. ✅ Adres defteri — Address model, auth controller CRUD, hesabim sayfası (de8f8d5)
4. ✅ Sepet API — CartItem model, cart CRUD, useCart API sync, auto-merge
5. Kargo takip sistemi (lojistik altında)
6. Bayi risk/yaşlandırma/performans raporları

### Yapılanlar (Session #2 - 23 Mayıs gece)
- Admin blank page fix: siparisler.vue eksik `<td>` tag'i
- approveOrder bug fix: bayi totalOrders/totalRevenue/cariBalance güncellenmiyordu
- markCompleted metodu + completedAt migration
- Full cycle integration test: 19/19 (bayi kaydı → sipariş → onay → sevk → tamamlanma)
- Category + Brand entity: 2 yeni model, CRUD, seed, route fix
- Address book: Address model, auth CRUD, hesabim sayfası adres yönetimi
- Server-side cart: CartItem model, cart CRUD (add/update/remove/clear/merge),
  useCart API sync, auto-merge local→server on login
- Testler: 47/47 passing (4 suite)

### Bayi Raporları (Bu hafta)
1. Risk raporu — kredi kullanım oranı, iptal/iadde sıklığı, sipariş düzeni
2. Yaşlandırma (Aging) — 30/60/90 gün borç dilimleri
3. Performans raporu — bayi bazlı ciro, trend, ortalama sepet
4. Sipariş özet raporu — admin için tüm sipariş durumları