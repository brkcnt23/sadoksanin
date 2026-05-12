# Docker Testing Guide — Admin Panel

**Status:** Docker setup ready for development testing  
**Date:** 2026-05-02  
**Environment:** Windows PowerShell, Docker Desktop  
**Stack:** Node 20 Alpine, pnpm, PostgreSQL 15, Redis 7

---

## 🚀 Quick Start (3 Commands)

```powershell
cd C:\Users\brkcn\OneDrive\Belgeler\Claude\Projects\sadoksaninsaat

# 1. Clean old containers + volumes
docker-compose -f docker-compose.dev.yml down -v

# 2. Build image + start all services (takes 2-3 min)
docker-compose -f docker-compose.dev.yml up --build

# 3. Open admin panel in browser
# http://localhost:3002
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  postgres:15 │  │   redis:7    │                    │
│  │   (5432)     │  │   (6379)     │                    │
│  │  [HEALTHY]   │  │  [HEALTHY]   │                    │
│  └──────┬───────┘  └──────┬───────┘                    │
│         │                 │                             │
│         └────────┬────────┘                             │
│                  │                                      │
│     ┌────────────▼────────────────────────┐            │
│     │   api (NestJS) — 3001               │            │
│     │   (backend, depends on pg+redis)    │            │
│     └────────────┬────────────────────────┘            │
│                  │                                      │
│        ┌─────────┴─────────┐                           │
│        │                   │                           │
│   ┌────▼──────┐      ┌────▼──────┐                    │
│   │storefront │      │   admin   │                    │
│   │(Nuxt SSR) │      │(Nuxt SPA) │                    │
│   │  3000     │      │   3002    │                    │
│   └───────────┘      └───────────┘                    │
│                                                        │
│  All on network: sadoksan-network                     │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Task #28: Docker Cleanup

### Command
```bash
docker-compose -f docker-compose.dev.yml down -v
```

### What It Does
- Stops all running containers
- Removes containers: postgres, redis, api, storefront, admin
- Removes volumes: postgres_data, redis_data (FRESH START)
- Removes network: sadoksan-network

### Expected Output
```
Removing sadoksan-admin ... done
Removing sadoksan-storefront ... done
Removing sadoksan-api ... done
Removing sadoksan-redis ... done
Removing sadoksan-postgres ... done
Removing network sadoksan_sadoksan-network
```

### Verify Cleanup
```bash
docker ps -a  # Should show 0 sadoksan containers
docker volume ls | grep sadoksan  # Should show nothing
```

---

## 🔨 Task #29: Docker Build & Start

### Command
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### What It Does
1. **Build stage** (~1 min)
   - Creates `sadoksan-dev:latest` image
   - Installs pnpm, Node 20, libc6-compat, bash
   - Installs all workspace dependencies (pnpm install)
   - Copies source code

2. **Start services** (~1-2 min, dependent on health checks)
   - `postgres`: Starts, waits 15s for health check
   - `redis`: Starts, waits for health check
   - `api`: Starts after postgres + redis healthy, runs `pnpm -F @sadoksan/api dev`
   - `storefront`: Starts after api healthy, runs `pnpm -F @sadoksan/storefront dev`
   - `admin`: Starts after api healthy, runs `pnpm -F @sadoksan/admin dev`

### Expected Log Output (Final State)
```
sadoksan-postgres | 2026-05-02 10:30:00.000 UTC [1] LOG:  database system is ready to accept connections
sadoksan-redis   | Ready to accept connections
sadoksan-api     | > @sadoksan/api@0.0.1 dev
sadoksan-api     | NestJS listening on 0.0.0.0:3001
sadoksan-storefront | ℹ Nuxt 4.x dev server
sadoksan-storefront | ℹ Listening on http://0.0.0.0:3000
sadoksan-admin   | ℹ Nuxt 4.x dev server
sadoksan-admin   | ℹ Listening on http://0.0.0.0:3002
```

### Access Points
| Service | URL | Port |
|---------|-----|------|
| Admin Panel | http://localhost:3002 | 3002 |
| Storefront | http://localhost:3000 | 3000 |
| API (backend) | http://localhost:3001 | 3001 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |

### Keep Container Running
- Terminal will tail all logs
- Press **Ctrl+C** to stop (removes containers if you also use `-v`)
- Better: `docker-compose up -d` (detached, run in background)

### View Logs (Detached Mode)
```bash
# All services
docker-compose logs -f

# Just admin
docker logs sadoksan-admin -f

# Just API
docker logs sadoksan-api -f

# Just postgres (startup)
docker logs sadoksan-postgres -f
```

---

## ✅ Task #31: Verify Service Health

### Check Status
```bash
docker-compose ps
```

**Expected:**
```
NAME                COMMAND                  SERVICE     STATUS              PORTS
sadoksan-postgres   "docker-entrypoint..."   postgres    Up (healthy)        0.0.0.0:5432
sadoksan-redis      "redis-server"           redis       Up (healthy)        0.0.0.0:6379
sadoksan-api        "sh /app/docker-dev..."  api         Up                  0.0.0.0:3001
sadoksan-storefront "sh /app/docker-dev..."  storefront  Up                  0.0.0.0:3000
sadoksan-admin      "sh /app/docker-dev..."  admin       Up                  0.0.0.0:3002
```

### Verify Postgres Ready
```bash
docker logs sadoksan-postgres | grep "ready to accept"
```

**Expected:**
```
LOG:  database system is ready to accept connections
```

### Verify Redis Ready
```bash
docker logs sadoksan-redis | grep "Ready to accept"
```

**Expected:**
```
Ready to accept connections
```

### Verify Admin Listening
```bash
docker logs sadoksan-admin | grep "Listening"
```

**Expected:**
```
ℹ Listening on http://0.0.0.0:3002
```

### Troubleshooting

**If postgres fails:**
```bash
docker logs sadoksan-postgres
# Look for: "FATAL", "cannot create", "permission denied"
# Solution: Check disk space, Docker daemon, volume mounts
```

**If redis fails:**
```bash
docker logs sadoksan-redis
# Look for: "WARN", "bad command"
# Usually just warnings, not blockers
```

**If admin/api fail:**
```bash
docker logs sadoksan-admin
# Look for: "error", "ENOENT", "module not found"
# Solution: `docker-compose down -v && docker-compose up --build` (clean rebuild)
```

---

## 📱 Task #30: Test Admin Panel (7 Cases)

### Access Admin
Open browser: **http://localhost:3002**

You should see:
- Nuxt loading screen (1-2 sec)
- Admin dashboard with seed data
- Sidebar with menu: Dashboard, Ürünler, Siparişler, Bayiler, etc.

### Same 7 Test Cases as Before

For detailed steps, see: **`ADMIN_PANEL_TESTING_GUIDE.md`**

**TL;DR:**
1. **Popup Modal** — Create campaign with dealer targeting
2. **Logistics Rules** — Edit İstanbul surcharge, verify price calculator
3. **Dealer Pricing** — Add per-dealer custom price, verify override
4. **Variations** — Add product with color/size variants
5. **Image Upload** — Upload images, reorder, delete
6. **Integration** — Full workflow (product + pricing + popup)
7. **localStorage** — F12 → Application → Local Storage, verify data persists

### Difference vs Local pnpm
- **Local:** pnpm dev (fast HMR, watch filesystem)
- **Docker:** pnpm dev in container (bind-mounted source, CHOKIDAR_USEPOLLING for Windows/macOS)
- **Result:** Same HMR experience, can edit files on host, container picks up changes

### HMR (Hot Module Reload)
- Edit file: `apps/admin/app/pages/popup.vue`
- Save (Ctrl+S)
- Browser auto-refreshes (~2-3 sec)
- Dev server logs: `[HMR] Hot Module Reload`

### Debug in Container
```bash
# Connect to admin container shell
docker-compose exec admin sh

# Inside container:
cd /app
pnpm --filter @sadoksan/admin dev  # restart manually
ls -la apps/admin/app/pages/  # check files mounted
```

---

## 💾 Task #32: Test Data Persistence

### Current (localStorage)
Data stored in **browser localStorage**, persists across:
- Browser refresh (F5)
- Closing/reopening browser
- Restarting Docker containers
- Server reboot (because browser keeps localStorage on disk)

### Test Procedure

**Step 1: Create test data**
```
Admin Panel → Ürünler → "Yeni Ürün"
  Name: "Test Product"
  SKU: "TEST-001"
  Save
```

**Step 2: Verify in localStorage**
```
F12 → Application → Local Storage → http://localhost:3002
Key: "products"
Value: Should contain your product as JSON
```

**Step 3: Stop containers (keep volumes)**
```bash
docker-compose stop
# OR: Ctrl+C in terminal where up is running
```

**Step 4: Start containers again**
```bash
docker-compose up -d
# Wait 30s for services to be ready
```

**Step 5: Verify data persists**
```
Refresh browser (F5)
Admin Panel → Ürünler
Expected: "Test Product" still there in list
```

### Result
✅ **Data persisted** across Docker restart

---

## 🔌 Future: API Integration

Once backend API is ready:

1. **Data location shifts:** localStorage → PostgreSQL
2. **Persistence guaranteed:** Docker volume `postgres_data` persists across any restart
3. **No UI changes:** Admin components already use storage adapter
4. **Swap method:** Just update `utils/storage.ts` to call `$fetch('/api/...')`

### Docker Volume for PostgreSQL
```bash
# List volumes
docker volume ls

# Should see:
# sadoksan_postgres_data

# Inspect volume
docker volume inspect sadoksan_postgres_data

# Data survives:
docker-compose down  # containers stop
docker-compose up    # containers restart, data in volume still exists

# Only lost if you:
docker-compose down -v  # explicitly removes volumes with -v flag
```

---

## 📋 Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker-compose down -v` completed
- [ ] `docker-compose up --build` successfully started all 5 services
- [ ] Admin panel loads at http://localhost:3002
- [ ] All 7 test cases pass
- [ ] localStorage data verified in DevTools
- [ ] Data persists after `docker-compose stop && docker-compose up`
- [ ] No red errors in container logs
- [ ] Browser DevTools console has no red errors

---

## 🛠️ Common Commands

```bash
# View all logs
docker-compose logs

# View admin logs only
docker logs sadoksan-admin -f

# Restart specific service
docker-compose restart admin

# Rebuild image (after package.json changes)
docker-compose build

# Connect to container shell
docker-compose exec admin sh

# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a

# Check volumes
docker volume ls

# Remove everything (containers + volumes)
docker-compose down -v

# Run detached (background)
docker-compose up -d

# Stop all containers
docker-compose stop

# Start containers (without rebuild)
docker-compose start
```

---

## 🚨 Troubleshooting

### "Address already in use" (port conflict)
```bash
# Port 3002 already in use
# Solution 1: Kill process using port
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Solution 2: Use different port in docker-compose.dev.yml
# Change "3002:3002" to "3003:3002"
```

### Docker daemon not running
```bash
# On Windows: Start Docker Desktop from Start Menu
# Check status: docker ps (should not error)
```

### Volume permissions error
```bash
# On macOS/Linux: May need sudo
sudo docker-compose up

# Or fix Docker socket permissions
```

### Container exits immediately
```bash
docker logs sadoksan-admin  # Check error
# Common: pnpm install failed, missing deps
# Solution: docker-compose down -v && docker-compose up --build
```

### Build takes too long
```bash
# First build: ~2-3 min (installs all deps)
# Subsequent: ~30 sec (Docker layer cache)
# If slow: Check internet speed, Docker disk space
df -h  # Check free space
```

---

## 📞 Next Steps

1. Run Task #28-32 in sequence
2. Verify all services healthy
3. Test admin panel (all 7 cases)
4. Document any issues + fixes
5. When ready: Proceed to backend integration (NestJS + Prisma + Netsis)

---

**Last Updated:** 2026-05-02  
**Status:** Ready for Docker testing  
**Next Phase:** Backend API integration (Prisma migrations, Netsis client, BullMQ jobs)
