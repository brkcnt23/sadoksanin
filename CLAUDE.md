# CLAUDE Project Context: Sciveto ERP

**Project:** Sciveto — Modular ERP system (B2B + B2C ecommerce hybrid)  
**Last Updated:** 2026-04-29  
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
└── docker-compose.yml       # Dev environment orchestration

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
- ✅ Product variations (TBD: from Netsis or site-defined?)
- ✅ Categories (from Netsis)
- ✅ Excel export for stock/price reports
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

### Environment Management
- `docker-compose.yml`: Development (live reload, debugging, seed data)
- `docker-compose.prod.yml`: Production (no hot-reload, fixed versions, logging)
- `.env.dev`, `.env.prod` for configuration
- Secrets injected at runtime (never in Dockerfile)

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

1. **Local:** `docker-compose up` → all services running
2. **Hot reload:** Nuxt instances watch files, HMR enabled
3. **Database:** Prisma migrations auto-run on compose startup
4. **Seeding:** Seed script populates test dealers, products, orders
5. **Testing:** Vitest for unit, Playwright for e2e (headless)

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

**Last Review:** 2026-04-29 | **Status:** Foundation Ready