# CLAUDE Project Context: Sadoksan ERP

**Project:** Sadoksan — Modular ERP system (B2B + B2C ecommerce hybrid)  
**Last Updated:** 2026-05-23  
**Owner:** John (brkcnt6@gmail.com)

## Tech Stack

| Layer | Tech | Version | Notes |
|-------|------|---------|-------|
| **Storefront** | Nuxt 4 | 4.4+ | SSR for SEO, B2C + B2B dealer portal |
| **Admin Panel** | Nuxt 4 | 4.4+ | SPA, `/sadoksan-panel` login |
| **Backend API** | NestJS | 11+ | All business logic |
| **Database** | PostgreSQL | 15+ | Primary data store |
| **ORM** | Prisma | 7.8+ | Type-safe schema + migrations |
| **Background Jobs** | Redis + BullMQ | - | Order processing, sync jobs |
| **PDF Generator** | Python Flask | - | Proforma PDFs |
| **Container** | Docker | Multi-stage | Dev + Production compose files |
| **Package Manager** | pnpm | 8+ | Monorepo |

## Project Structure

```
sadoksan/ (monorepo root)
├── apps/
│   ├── storefront/          # B2C + dealer portal (Nuxt 4, SSR)
│   ├── admin/               # Factory admin (Nuxt 4, SPA)
│   └── api/                 # NestJS — ALL business logic
├── packages/
│   ├── shared/              # Common types, Prisma schema
│   └── ui/                  # Shared Vue components
├── python-service/          # Proforma PDF generator (Flask)
├── scripts/
│   └── backup-db.sh         # PostgreSQL backup (pg_dump, retention)
├── docker-compose.dev.yml   # Development (HOT RELOAD)
├── docker-compose.prod.yml  # Production (multi-stage, nginx, security)
├── nginx.prod.conf          # Nginx reverse proxy config
└── Dockerfile.dev           # Unified dev image
```

## Backend Modules (apps/api/src/modules/)

| Module | Status | Description |
|--------|--------|-------------|
| `auth` | ✅ | JWT auth, register/login/me, forgot/reset password, address book |
| `products` | ✅ | CRUD, variations, categories, brands, bulk ops, Excel import/export |
| `orders` | ✅ | Full lifecycle: create→approve→ship→complete, cart, stock reservation |
| `dealer` | ✅ | Profile, cari, reports (8 types), approval flow, risk score |
| `proforma` | ✅ | PDF generation via Python service |
| `discounts` | ✅ | Product/category/brand discounts (% or fixed) |
| `promo` | ✅ | Promo code validation |
| `popup` | ✅ | Campaign popups with audience targeting |
| `pricing` | ✅ | Regional/province surcharges, logistics rules |
| `notifications` | ✅ | Back-in-stock notify requests |
| `audit` | ✅ | Full audit log with filtering |
| `cms` | ✅ | Hero banner, site settings, maintenance mode |
| `mailer` | ✅ | Console logger (SMTP ready) |
| `favorites` | ✅ | Wishlist CRUD |
| `netsis` | 🔴 | Scheduler + sync (API bekleniyor) |
| `alneo` | 🔴 | E-invoice/e-archive (API bekleniyor) |

## Database Schema — 26 Models, 11 Enums

**Core:** User, Dealer, Product, ProductVariation, Category, Brand, Address,  
**Commerce:** Order, OrderLine, CartItem, Favorite, Proforma, ProformaItem,  
**Stock:** StockReservation,  
**Pricing:** RegionalPricingSurcharge, ProvincePricingSurcharge, LogisticsRule,  
**Content:** SiteContent, Popup, Discount, PromoCode,  
**Tracking:** OrderStatusHistory, AuditLog, NotifyRequest,  
**External:** ExchangeRate, ProductCurrencyPrice, NetsisSync,  
**Site:** SiteSettings

## Key Integrations (Status)

| Integration | Status | Notes |
|-------------|--------|-------|
| **Netsis** | 🔴 API bekleniyor | Ürün/stok/cari sync, placeholder durumda |
| **Alneo** | 🔴 API bekleniyor | E-fatura, e-irsaliye, e-arşiv |
| **Ödeme (Albaraka)** | 🔴 API bekleniyor | Şu an mock — her zaman PAID |
| **SMTP (Canmail)** | 🔴 Anahtar bekleniyor | Mailer modülü console'a yazıyor |
| **Log (Canlogcatcher)** | 🔴 Anahtar bekleniyor | Eklenecek |
| **Proforma PDF** | ✅ | Python Flask servisi, çalışıyor |
| **ideaSoft** | 🟡 | 4000 ürün + görsel, migrate edilecek |

## Full Business Cycle — Durum

| # | Adım | Durum |
|---|------|-------|
| 1 | Admin → ürün CRUD (kategori, marka, görsel, varyasyon) | ✅ |
| 2 | Admin → Excel import/export | ✅ |
| 3 | Bayi başvurusu → admin onayı → aktif | ✅ |
| 4 | Storefront → ürün kataloğu (filtre, arama) | ✅ |
| 5 | Storefront → favori ekle, sepete ekle | ✅ |
| 6 | Sepet → API sync + localStorage fallback, login merge | ✅ |
| 7 | Sepet → sipariş (B2B PENDING_APPROVAL, B2C APPROVED) | ✅ |
| 8 | Stok: displayStock = netsisStock − ACTIVE_rezervasyon | ✅ |
| 9 | Admin → sipariş onayı (cari bakiye + bayi istatistik güncellenir) | ✅ |
| 10 | Proforma PDF (onay sonrası otomatik) | ✅ |
| 11 | Admin → sevk + kargo takip (trackingNumber, cargoCompany) | ✅ |
| 12 | Admin → sipariş tamamlanma (COMPLETED + completedAt) | ✅ |
| 13 | İade talebi → admin onayı → stok geri alımı | ✅ |
| 14 | Bayi → dashboard + sipariş takibi + cari hareketler | ✅ |
| 15 | Bayi → raporlar (8 tip: aylık, yıllık, fatura, detay, stok, risk, yaşlandırma, performans) | ✅ |
| 16 | Bayi → risk skoru (JSON endpoint) | ✅ |
| 17 | Adres defteri → CRUD, varsayılan adres, checkout seçimi | ✅ |
| 18 | Kategori/Marka → ayrı entity, admin CRUD, 9 kat + 19 marka seed | ✅ |
| 19 | Netsis → ürün/stok/cari sync | 🔴 |
| 20 | Gerçek ödeme → sanal POS, havale | 🔴 |
| 21 | E-fatura/irsaliye → Alneo | 🔴 |
| 22 | SMTP mailer → Canmail | 🔴 |
| 23 | Hibrit ödeme → bakiye + açık hesap | 🟡 Planlandı |

## Production Hardening

| # | İş | Durum |
|---|-----|-------|
| JWT_SECRET | Prod değeri | 🔴 Sana bırak |
| SSL/HTTPS | Sunucuda Let's Encrypt | 🔴 Sana bırak |
| docker-compose.prod.yml | Multi-stage, nginx, health checks | ✅ |
| nginx.prod.conf | SSL termination, rate limit, security headers | ✅ |
| CORS | Env-based, sadece kendi domain | ✅ |
| Rate limiting | /auth/login: 10 req/15dk (express-rate-limit) | ✅ |
| Helmet | Security headers (CSP devre dışı — Nuxt SSR) | ✅ |
| Admin URL | `/sadoksan-panel` (eski `/sadoksanadmin`) | ✅ |
| PostgreSQL backup | scripts/backup-db.sh (pg_dump, 30 gün retention) | ✅ |
| Non-root user | apps/*/Dockerfile production stage | ✅ |
| Health checks | Tüm servislerde | ✅ |
| Log rotation | docker-compose json-file 50MB/5file | ✅ |

## Test Hesapları

| Email | Şifre | Rol | Bayi |
|-------|-------|-----|------|
| bayi@test.com | asd123 | DEALER | BayiTest Yapı Malzemeleri (İstanbul, 250k TL limit) |
| admin@admin.com | asd123 | ADMIN | — |

## Test Durumu

**47 tests, 4 suite, 0 failures**
- auth.service.spec.ts: 10 tests
- orders.service.spec.ts: 15 tests
- products.controller.spec.ts: 3 tests
- full-cycle.spec.ts: 19 tests (bayi kaydı → sipariş → onay → sevk → tamamlanma)

## Commit History (2026-05-23 Session)

```
eb09970  📝 CLAUDE.md final
f761a77  🛡️  Production hardening (helmet, rate limit, CORS, docker prod, backup)
1734283  🚚 Shipment tracking (trackingNumber + cargoCompany)
b5dab96  📊 Dealer reports (risk, aging, performance)
84e52b8  🛒 Server-side cart (CartItem model, API, useCart sync)
de8f8d5  📍 Address book (Address model, CRUD, hesabim UI)
ec2f215  🏷️  Category & Brand entities (9 cat, 19 brand, admin CRUD)
fc8e149  🔧 Admin fix + dealer stats bug + COMPLETED endpoint
3a80834  🏗️  Initial (100 files, 7 modules, 7 migrations)
```

## Docker

```bash
# Development
docker compose -f docker-compose.dev.yml up

# Production
docker compose -f docker-compose.prod.yml up -d

# Backup
./scripts/backup-db.sh
# veya
docker exec sadoksan-postgres-prod pg_dump -U sadoksan sadoksan > backup.sql
```

## Sıradaki İşler (API geldikten sonra)

1. **Netsis entegrasyonu** — Gerçek API bağlantısı
2. **Albaraka ödeme** — Sanal POS
3. **Alneo e-fatura** — E-fatura, e-irsaliye, e-arşiv
4. **Canmail SMTP** — Gerçek email gönderimi
5. **Canlogcatcher** — Log entegrasyonu
6. **Hibrit ödeme** — Dealer.balance + BalanceTransaction
7. **E2E testler** — Playwright
8. **Ürün görselleri** — ideaSoft'tan 4000 ürün görseli
