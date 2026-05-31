# Sadoksan ERP — Deployment Özeti (31 Mayıs 2026)

## Sunucu Bilgileri

- **IP:** 45.43.152.52
- **SSH:** `ssh can@45.43.152.52`
- **OS:** Fedora 41 Server
- **RAM:** 94GB | **Disk:** 444GB (/home)
- **Domain:** smartinnventory.com (Let's Encrypt SSL)
- **Proje dizini:** `/home/can/sadoksan/`

## Canlı URL'ler

| Servis | URL |
|--------|-----|
| **Storefront** | https://smartinnventory.com/sadoksan/ |
| **Admin Panel** | https://smartinnventory.com/sadoksan-admin/ |
| **API** | https://smartinnventory.com/sadoksan-api/ |

## Test Hesapları

| Rol | Email | Şifre | Not |
|-----|-------|-------|-----|
| ADMIN | admin@admin.com | asd123 | Admin panel girişi |
| DEALER | bayi@test.com | asd123 | Storefront bayi girişi |

## Sunucu Konteynerları

```bash
cd /home/can/sadoksan
docker compose -f docker-compose.prod.yml ps
```

| Konteyner | Host Port | İç Port | Durum |
|-----------|-----------|---------|-------|
| sadoksan-api-prod | 3010 | 3001 | healthy |
| sadoksan-storefront-prod | 3011 | 3000 | healthy |
| sadoksan-admin-prod | 3012 | 3002 | healthy |
| sadoksan-postgres-prod | — | 5432 | healthy |
| sadoksan-redis-prod | — | 6379 | healthy |
| sadoksan-python-prod | 3013 | 5000 | healthy |

## Nginx Yapılandırması

Mevcut sunucu nginx'i kullanılıyor (Docker nginx değil). Konfigürasyon:
- `/etc/nginx/sites-enabled/smartinnventory.com`
- `/sadoksan/` → 127.0.0.1:3011 (Storefront)
- `/sadoksan-admin/` → 127.0.0.1:3012 (Admin)
- `/sadoksan-api/` → 127.0.0.1:3010 (API)

Backup: `/etc/nginx/sites-enabled/smartinnventory.com.bak.*`

## Bugün Yapılanlar

### 1. Testler (48/48 passed)
- Silinmiş test dosyaları `git checkout` ile geri getirildi
- Codebase değişikliklerine uygun güncellendi:
  - `auth.service.spec.ts`: CUSTOMER → DEALER
  - `orders.service.spec.ts`: Eksik mock'lar eklendi (stockMovement, user, dealer, bankTransfer, mailerService)
  - `netsisPendingQuantity` tüm mock'lara eklendi

### 2. Production Docker Build (3 imaj)
- `sadoksan-api` — NestJS (Node 20-alpine)
- `sadoksan-storefront` — Nuxt 4 SSR (42.3 MB çıktı)
- `sadoksan-admin` — Nuxt 4 SPA (2.2 MB çıktı)

### 3. Subpath Routing
- Storefront: `baseURL = /sadoksan/` (`NUXT_APP_BASE_URL` env var)
- Admin: `baseURL = /sadoksan-admin/` (`NUXT_APP_BASE_URL` env var)
- Docker build arg olarak geçiliyor, runtime'da değil

### 4. Deployment Süreci
- Git push → sunucuda pull → Docker build → migrate → seed
- Port çakışmaları çözüldü (mevcut PostgreSQL/Redis/nginx ile)
- 19 migration başarıyla uygulandı
- Prisma 7 production config: `prisma.config.js` manuel oluşturuldu (`.ts` derlenmiyor)

### 5. Kategori Hiyerarşisi
- `Category` modeline `parentId` self-relation eklendi
- Migration: `20260531180000_add_category_parent`
- 48 kategori seed edildi (9 ana + 39 alt)
- Admin ProductFormModal: cascading select (ana → alt kategori)
- Marka: text input → dropdown select
- API: `GET /products/categories` artık ağaç yapısı döndürüyor

### 6. Veritabanı
- PostgreSQL 15 (Docker container)
- 19 migration (Prisma 7.8)
- En son migration: `20260531180000_add_category_parent`
- Seed: 2 kullanıcı, 1 dealer, 48 kategori, 3 marka, 3 ürün

## Bilinen Sorunlar / Düzeltmeler

1. **Prisma 7 production config:** `prisma.config.ts` NestJS build'ine dahil olmuyor. Container'da `/app/apps/api/prisma.config.js` manuel oluşturulmalı.
2. **Disk:** Root partition 15GB — Docker build sırasında dolabiliyor. `docker system prune -af` ile temizlenebilir.
3. **Admin rebuild:** Container içinde Nuxt build OOM veriyor (512MB limit). Lokalde build edip SCP ile göndermek gerekiyor.
4. **Seed script:** `apps/api/src/scripts/seed.ts` PrismaClient adapter gerektiriyor, production'da çalışmıyor. SQL ile seed yapıldı.

## Komut Referansı

```bash
# Sunucuya bağlan
ssh can@45.43.152.52

# Konteyner durumu
cd /home/can/sadoksan && docker compose -f docker-compose.prod.yml ps

# Loglar
docker logs sadoksan-api-prod --tail 50

# Migration (container içinde)
docker exec sadoksan-api-prod sh -c 'cd /app/apps/api && /app/node_modules/.bin/prisma migrate deploy'

# API restart
docker compose -f docker-compose.prod.yml restart api

# Tümünü yeniden başlat
docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml up -d

# Nginx reload
sudo nginx -t && sudo systemctl reload nginx

# Disk temizliği
docker system prune -af

# Backup
docker exec sadoksan-postgres-prod pg_dump -U sadoksan sadoksan > backup-$(date +%Y%m%d).sql
```

## Sıradaki İşler

- [ ] Production `.env` değerlerini güncelle (JWT_SECRET, DB şifresi)
- [ ] Test hesaplarını sil, gerçek admin oluştur
- [ ] Gerçek ürün verilerini import et (CSV/Excel)
- [ ] Backup cron ayarla
- [ ] Domain geçişi (sadoksaninsaat.com.tr)
- [ ] Netsis, Alneo, Albaraka entegrasyonları (API gelince)
