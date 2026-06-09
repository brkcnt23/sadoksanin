# CLAUDE.md — Sadoksan ERP

**Son güncelleme:** 2026-06-09
**Ana görev listesi:** YAPILACAKLAR.md (her oturum başı OKU)
**Oturum geçmişi:** docs/oturum-ozetleri.md

---

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Storefront | Nuxt 4 (SSR) | B2C + B2B dealer portal |
| Admin Panel | Nuxt 4 (SPA) | `/sadoksan-panel` login |
| Backend API | NestJS 11 | ALL business logic |
| Database | PostgreSQL 15 | Primary data store |
| ORM | Prisma 7.8 | 26+ models, 19 migrations |
| Queue | Redis + BullMQ | Background jobs |
| PDF | Python Flask | Proforma PDFs |
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
├── python-service/      # Proforma PDF generator (Flask)
├── scripts/backup-db.sh # PostgreSQL backup
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── nginx.prod.conf
```

## Backend Modules

| Module | Status | Description |
|--------|--------|-------------|
| `auth` | ✅ | JWT auth, register/login, PLASIYER + adminCreateUser, address book |
| `products` | ✅ | CRUD, variations, categories, brands, bulk ops, Excel import/export |
| `orders` | ✅ | Full lifecycle: create→approve→ship→complete, cart, stock reservation |
| `dealer` | ✅ | Profile, cari, reports (8 types), approval flow, risk score |
| `proforma` | ✅ | PDF via Python, approval workflow (draft→pending→approved→downloaded) |
| `discounts` | ✅ | Product/category/brand discounts (% or fixed) |
| `promo` | ✅ | Promo code validation |
| `popup` | ✅ | Campaign popups with audience targeting |
| `pricing` | ✅ | Regional/province surcharges, logistics rules |
| `notifications` | ✅ | Back-in-stock notify requests |
| `audit` | ✅ | Full audit log with filtering |
| `cms` | ✅ | Hero banner, site settings, maintenance mode |
| `mailer` | ✅ | Console logger (SMTP ready) |
| `favorites` | ✅ | Wishlist CRUD |
| `reports` | ✅ | 8 endpoints: plasiyer-sales, order-pipeline, dealer-risk, critical-stock, slow-moving, credit-usage, plasiyer-dashboard, plasiyers |
| `netsis` | 🟡 | NetOpenX REST: OAuth2 token, 4 sync, API bilgisi bekleniyor |
| `stock` | 🟡 | Basic structure exists, StockMovement planı hazır |
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
| Plasiyer | plasiyer@test.com | asd123 |

## Demo Kart (Sunum)

```
Kart No: 4111 1111 1111 1111 / SKT: 12/28 / CVV: 123
```

---

## ⚠️ Gotcha'lar

1. **Admin panel SPA'dır** → `.env` değişikliğinde REBUILD şart, restart yetmez
2. **Storefront SSR'dır** → Her değişiklikte rebuild gerekir
3. **Prisma migration prod'da** → `migrate deploy` kullan, `migrate dev` YOK
4. **NestJS global prefix** → `app.setGlobalPrefix('api')` aktif, controller'larda `api/` prefix'i YOK
5. **Proforma controller route sıralaması** → `pending`/`my` route'ları `:id`'den ÖNCE olmalı (BUG-1)

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
1cbf8e8 feat: Admin rapor sayfası + Plasiyer storefront + dökümantasyon
dfd5346 feat: Rapor motoru — 8 endpoint (Faz 2-3A)
d49905c feat: Proforma onay akışı — admin panel UI + generatedByRole
a6fd651 feat: Proforma onay akışı (Faz 1)
af4789a feat: PLASIYER rolü eklendi
67b4cec feat: Netsis NetOpenX REST entegrasyonu
```
