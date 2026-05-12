# Local Development Guide (Docker)

Complete guide for developing Sadoksan ERP locally with Docker. Test everything here before deploying to production.

---

## 🎯 Development vs Production

### Development (docker-compose.dev.yml)
- ✅ Hot-reload on file changes (HMR)
- ✅ Debug logging
- ✅ Easier debugging (mapped ports)
- ✅ Fast iteration
- ✅ Python service with Flask dev server

### Production (docker-compose.prod.yml)
- ✅ Optimized images
- ✅ Gunicorn + 4 workers
- ✅ Non-root user (security)
- ✅ Gzip compression
- ✅ Rate limiting
- ✅ Proper logging

---

## ⚡ Quick Start (Local Development)

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker + Docker Compose (Linux)
- Git
- Text editor (VS Code recommended)

### 1. Clone & Setup

```bash
# Clone repository
git clone <repo-url>
cd sadoksaninsaat

# Copy environment file
cp .env.example .env

# Edit .env if needed (usually defaults work for local dev)
# nano .env
```

### 2. Start All Services

```bash
# Start everything in background
docker compose -f docker-compose.dev.yml up -d

# Watch startup progress
docker compose -f docker-compose.dev.yml logs -f

# Expected logs:
# ✓ postgres: "database system is ready to accept connections"
# ✓ redis: "Ready to accept connections"
# ✓ api: "NestJS listening on 3001"
# ✓ storefront: "Auto-imported types from node_modules"
# ✓ admin: "Auto-imported types from node_modules"
# ✓ python-service: "Running on http://0.0.0.0:5000"
```

### 3. Run Database Setup

```bash
# Prisma migrations + seeding (first time only)
docker compose -f docker-compose.dev.yml exec api sh -c "cd /app/apps/api && pnpm exec prisma migrate deploy && pnpm exec ts-node prisma/seed.ts"

# For subsequent runs, migrations auto-run on API startup
```

### 4. Access Services

| Service | URL | Purpose |
|---------|-----|---------|
| Storefront | http://localhost:3000 | Customer interface + dealer portal |
| Admin Panel | http://localhost:3002 | Admin operations |
| API | http://localhost:3001 | Backend API |
| Python Service | http://localhost:5000 | Proforma PDF generator |
| PostgreSQL | localhost:5432 | Database (psql/tools) |
| Redis | localhost:6379 | Cache/jobs |

### 5. Test Proforma Generator

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test PDF generation
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "LOCAL",
    "includeLogo": false,
    "customer": {
      "name": "Test Bayi",
      "address": "Test Address",
      "city": "Istanbul",
      "phone": "+90 212 123 4567",
      "email": "test@example.com"
    },
    "items": [
      {
        "sku": "KP-001",
        "description": "Test Product",
        "quantity": 5,
        "price": 1000.00
      }
    ],
    "companyInfo": {
      "name": "Sadoksan İnşaat",
      "address": "Test Address",
      "phone": "+90 212 999 9999",
      "email": "info@sadoksan.com"
    }
  }' > test_proforma.pdf
```

---

## 🔄 Development Workflow

### Editing Code

All changes are **automatically reflected** in running containers:

**Frontend/Admin (Nuxt):**
```
Edit: /apps/storefront/app/pages/...
→ Hot reload at http://localhost:3000
```

**API (NestJS):**
```
Edit: /apps/api/src/...
→ Auto-recompile and restart
```

**Python Service:**
```
Edit: /python-service/app.py
Edit: /python-service/proforma_generator.py
→ Auto-reload (Flask dev server)
→ Check logs: docker compose -f docker-compose.dev.yml logs -f python-service
```

### Database Changes

```bash
# Create new migration
docker compose -f docker-compose.dev.yml exec api sh -c "cd /app/apps/api && pnpm exec prisma migrate dev --name your_migration_name"

# Reset database (caution: data loss)
docker compose -f docker-compose.dev.yml exec api sh -c "cd /app/apps/api && pnpm exec prisma migrate reset"

# View/edit schema
cat packages/shared/prisma/schema.prisma
```

---

## 🐛 Debugging

### View Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f api
docker compose -f docker-compose.dev.yml logs -f python-service

# Filter logs
docker compose -f docker-compose.dev.yml logs -f api | grep error
docker compose -f docker-compose.dev.yml logs -f python-service | grep "Generating\|Error"

# Last 100 lines
docker compose -f docker-compose.dev.yml logs --tail=100 api
```

### Access Container Shell

```bash
# API (NestJS)
docker compose -f docker-compose.dev.yml exec api sh

# Python Service
docker compose -f docker-compose.dev.yml exec python-service bash

# Database
docker compose -f docker-compose.dev.yml exec postgres psql -U sadoksan -d sadoksan_dev
  > SELECT * FROM "User";
  > \q (exit)
```

### Check Container Health

```bash
# Status of all services
docker compose -f docker-compose.dev.yml ps

# More detailed info
docker inspect sadoksan-api
docker inspect sadoksan-python
```

### Network Issues

```bash
# Test connectivity between containers
docker compose -f docker-compose.dev.yml exec api curl http://python-service:5000/health

# Check network
docker network inspect sadoksaninsaat_sadoksan-network
```

---

## 🔌 Proforma Integration Testing

### Step 1: Check Python Service is Running

```bash
docker compose -f docker-compose.dev.yml logs python-service | grep "Running on"
```

### Step 2: Test Directly

```bash
# Simple LOCAL proforma (no shipping details)
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "LOCAL",
    "includeLogo": true,
    "customer": {
      "name": "Bayi İstanbul",
      "address": "Adres Sokak No:1",
      "city": "Istanbul",
      "phone": "+90 212 123 4567",
      "email": "bayi@example.com"
    },
    "items": [
      {
        "imageUrl": "https://via.placeholder.com/300x300?text=Product+1",
        "sku": "KP-001",
        "description": "Kapı 3x2m",
        "quantity": 5,
        "price": 1000.00
      }
    ],
    "companyInfo": {
      "name": "Sadoksan İnşaat",
      "address": "Şirketi Sokak No:5",
      "phone": "+90 212 999 9999",
      "email": "info@sadoksan.com",
      "bank": "Akbank",
      "bankAccount": "123456789"
    }
  }' -o local_proforma.pdf

file local_proforma.pdf  # Verify it's a valid PDF
```

### Step 3: Test INTERNATIONAL Proforma

```bash
curl -X POST http://localhost:5000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "templateType": "INTERNATIONAL",
    "includeLogo": true,
    "customer": {
      "name": "CASALUCCA DERYA COBAN",
      "address": "SENLIKKOY MAH. FLORYA CARD. NO 33",
      "city": "ISTANBUL",
      "phone": "+90 212 123 4567",
      "email": "buyer@example.com"
    },
    "items": [
      {
        "imageUrl": "https://via.placeholder.com/300x300?text=Product+A",
        "sku": "AN-1006",
        "description": "CANDLE HOLDER 3 LIGHT BRASS ANTIQUE",
        "quantity": 5,
        "price": 38.00
      }
    ],
    "companyInfo": {
      "name": "SADOKSAN INŞAAT",
      "address": "SIRKET SOKAK NO:5, ISTANBUL, TURKEY",
      "phone": "+90 212 999 9999",
      "email": "info@sadoksan.com",
      "bank": "AKBANK",
      "bankAccount": "123456789"
    },
    "international": {
      "invoiceNumber": "PROF-2026-001",
      "invoiceDate": "2026-05-12",
      "exporterRef": "IEC NO: 0910000907",
      "countryOrigin": "TURKEY",
      "countryDest": "IRAQ",
      "preCarriage": "By Road",
      "pickupLocation": "ISTANBUL",
      "portLoading": "ISTANBUL",
      "portDischarge": "UMM QASR",
      "vessel": "MV Shipping"
    }
  }' -o intl_proforma.pdf
```

### Step 4: Verify PDFs

```bash
# Check file size and type
ls -lh *.pdf
file *.pdf

# Open in PDF viewer
open local_proforma.pdf  # macOS
xdg-open local_proforma.pdf  # Linux
start local_proforma.pdf  # Windows
```

---

## 🛑 Common Issues & Solutions

### "Connection refused" errors

```bash
# Services not ready - wait 30-60 seconds
docker compose -f docker-compose.dev.yml logs -f

# Check individual service health
curl http://localhost:3001/health  # API
curl http://localhost:5000/health  # Python
```

### Python service won't start

```bash
# Check Python logs
docker compose -f docker-compose.dev.yml logs python-service

# Rebuild image
docker compose -f docker-compose.dev.yml build python-service

# Restart
docker compose -f docker-compose.dev.yml restart python-service
```

### Out of disk space

```bash
# Clean Docker resources
docker system prune -a
docker volume prune

# Rebuild
docker compose -f docker-compose.dev.yml build --no-cache
```

### File permission issues

```bash
# Fix ownership
docker compose -f docker-compose.dev.yml exec api chown -R 1000:1000 /app

# Or run as root temporarily
docker compose -f docker-compose.dev.yml exec -u root api sh
```

---

## 📊 Database

### Backup Development Database

```bash
# Backup PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres pg_dump \
  -U sadoksan sadoksan_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker compose -f docker-compose.dev.yml exec postgres pg_dump \
  -U sadoksan sadoksan_dev | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Access Database Directly

```bash
# Connect to PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres psql -U sadoksan -d sadoksan_dev

# Useful commands:
# \dt                 # List all tables
# \d "User"           # Describe User table
# SELECT COUNT(*) FROM "User";  # Count users
# \q                  # Exit
```

---

## 🧹 Cleanup

### Stop All Services

```bash
# Stop (keeps data)
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ data loss)
docker compose -f docker-compose.dev.yml down -v

# Stop and remove everything including images (⚠️ full cleanup)
docker compose -f docker-compose.dev.yml down -v --remove-orphans
```

### Start Fresh

```bash
# Full reset
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d

# Run migrations
docker compose -f docker-compose.dev.yml exec api sh -c "cd /app/apps/api && pnpm exec prisma migrate deploy"
```

---

## 📝 Useful Commands

```bash
# View real-time CPU/Memory usage
docker stats

# View all containers
docker ps -a

# View all volumes
docker volume ls

# View all networks
docker network ls

# Get IP of a container
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' sadoksan-api

# Copy file from container
docker cp sadoksan-api:/app/package.json ./

# Copy file into container
docker cp ./file.txt sadoksan-api:/app/
```

---

## 🚀 Ready to Test?

1. **Start dev stack**: `docker compose -f docker-compose.dev.yml up -d`
2. **Test services**: curl the endpoints
3. **Test Proforma**: Run the curl commands above
4. **Edit code**: Files auto-reload
5. **Check logs**: `docker compose -f docker-compose.dev.yml logs -f`

Everything ready for **Proforma Frontend + API integration** coding! 🎯

---

## Next: Frontend Development

Once tests pass locally, start building:
- `/dealer/proforma` page (Nuxt)
- API endpoint `POST /api/proforma/generate` (NestJS)
- Integration tests

---

**Last Updated**: 2026-05-12
