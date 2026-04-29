# Sciveto ERP - Production-Grade Monorepo

Modular B2B + B2C ecommerce ERP system built with Nuxt 4, NestJS 11, PostgreSQL, and Docker.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- pnpm 8+
- Node.js 20+ (for local development without Docker)

### Local Development (Docker)

```bash
# 1. Copy .env.example to .env (already done)
# 2. Start all services
pnpm run docker:up

# 3. Access
- Storefront: http://localhost:3000
- Admin Panel: http://localhost:3002
- API: http://localhost:3001
- Database: postgres://sciveto:sciveto_dev@localhost:5432/sciveto_dev
- Redis: redis://localhost:6379

# 4. Run migrations
pnpm run db:migrate

# 5. View database GUI
pnpm run db:studio
```

### Local Development (Without Docker)

```bash
# Install dependencies
pnpm install

# Start development servers (all in parallel)
pnpm run dev

# Or individual apps
cd apps/api && pnpm run dev
cd apps/storefront && pnpm run dev
cd apps/admin && pnpm run dev
```

## Project Structure

```
sadoksan/
├── apps/
│   ├── storefront/      # B2C customer-facing site (Nuxt 4 SSR)
│   ├── admin/           # Factory admin panel (Nuxt 4 SPA)
│   └── api/             # NestJS backend + Prisma ORM
├── packages/
│   ├── shared/          # Shared types, utilities
│   └── ui/              # Reusable Vue components
├── prisma/
│   └── schema.prisma    # Database schema
├── docker-compose.dev.yml
└── CLAUDE.md            # Project context (keep updated)
```

## Architecture

- **Nuxt 4** (storefront + admin): Presentation layer only
- **NestJS 11** (API): All business logic, integrations, background jobs
- **PostgreSQL**: Primary database
- **Prisma**: ORM + migrations
- **Redis + BullMQ**: Background jobs
- **Docker**: Multi-stage builds, dev + prod stages

## Key Integrations

1. **Netsis** (ERP product master + stock)
2. **Alneo** (Turkish e-invoice, e-archive, e-portal, e-irsaliye)
3. **ideaSoft** (Product catalog migration - 4000 SKUs)

## Critical Requirements

See `CLAUDE.md` for:
- Stock management formula & risk mitigation
- Dealer onboarding & cari account validation
- Regional pricing logic
- Order approval workflows
- E-document compliance

## Tech Versions

| Tool | Version |
|------|---------|
| Nuxt | 4.4+ |
| NestJS | 11+ |
| PostgreSQL | 15+ |
| Prisma | 5+ |
| Node.js | 20 LTS |
| pnpm | 8+ |

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/some-feature

# After changes
git add .
git commit -m "feat: description"
git push origin feature/some-feature

# PR → review → merge to main
```

## Deployment (Production)

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Push to registry
docker tag sciveto-api:latest registry.example.com/sciveto-api:latest
docker push registry.example.com/sciveto-api:latest

# Deploy to server
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Database connection error
```bash
docker-compose -f docker-compose.dev.yml down -v  # Remove volumes
docker-compose -f docker-compose.dev.yml up       # Recreate
```

### Port already in use
```bash
lsof -i :3001  # Check what's using port
kill -9 <PID>   # Kill process
```

### Prisma migration issues
```bash
pnpm run db:migrate:reset  # Danger: resets DB, use only in dev
```

## Team

- **Owner:** John (brkcnt6@gmail.com)
- **Project:** Sciveto ERP
- **Status:** Foundation ready, integration phase pending

---

Last updated: 2026-04-29
