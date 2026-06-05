# Sadoksan ERP — Info / Giriş Bilgileri

**Son güncelleme:** 2026-06-03

---

## 🌐 URL'ler

| Amaç | URL |
|------|-----|
| **Storefront (ana site)** | https://sadoksan.smartinnventory.com/ |
| **Admin Panel** | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| **API (health)** | https://sadoksan.smartinnventory.com/api/health |
| **Demo Kart Bilgisi** | https://sadoksan.smartinnventory.com/sayfa/demo-card |

---

## 🔑 Test Hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| **Admin** | admin@admin.com | asd123 |
| **Bayi** | bayi@test.com | asd123 |

---

## 💳 Demo Kredi Kartı (Sunum İçin)

```
Kart No:  4111 1111 1111 1111
SKT:      12/28
CVV:      123
İsim:     Test Kart
```

**Kural:** Bu kartla ödeme yapıldığında B2B sipariş **OTOMATİK ONAYLANIR**, ödeme `PAID` olur, tam iş akışı başlar.

Kart bilgileri sitede `/sayfa/demo-card` adresinde de gösteriliyor.

---

## 🖥️ Sunucu

| Detay | Değer |
|-------|-------|
| Hostname | motto-server |
| İşletim Sistemi | Fedora 41 Server |
| CPU | Intel Xeon Platinum 8168 @ 2.70GHz (18 çekirdek) |
| RAM | 94 GB |
| Disk | 500 GB |

---

## 🐳 Docker Container'lar (Sadoksan)

| Container | Port | Açıklama |
|-----------|------|----------|
| sadoksan-storefront-prod | 3011→3000 | Nuxt 4 SSR (ana site) |
| sadoksan-admin-prod | 3012→3002 | Nuxt 4 SPA (admin panel) |
| sadoksan-api-prod | 3010→3001 | NestJS 11 backend |
| sadoksan-postgres-prod | 5432 | PostgreSQL 15 |
| sadoksan-redis-prod | 6379 | Redis 7 |
| sadoksan-python-prod | 3013→5000 | Flask (Proforma PDF) |

---

## 📦 PM2 Süreçleri (Host)

| Süreç | Port | Açıklama |
|--------|------|----------|
| canai-nuxt | 30006 | CanAI web platformu |
| canterm-v2 | 3457 | Terminal bridge |
| ai-img | 3100 | AI görsel üretim |

---

## 🛠️ Sık Kullanılan Komutlar

```bash
# Storefront rebuild + deploy
cd /home/can/sadoksan
docker compose -f docker-compose.prod.yml build storefront
docker compose -f docker-compose.prod.yml up -d storefront

# API log'ları
docker logs sadoksan-api-prod --tail 50

# Admin rebuild (SPA olduğu için rebuild ŞART, restart yetmez)
docker compose -f docker-compose.prod.yml build admin
docker compose -f docker-compose.prod.yml up -d admin

# Backup
./scripts/backup-db.sh

# DB migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Tüm container'ları gör
docker ps --format "table {{.Names}}\t{{.Status}}"

# API'ye direkt istek (içeriden)
curl http://127.0.0.1:3010/api/health
```

---

## 📁 Önemli Dosyalar

| Dosya | Amaç |
|-------|------|
| `.env` | Tüm secret'lar ve config (BU DOSYAYI GIT'E KOYMA) |
| `CLAUDE.md` | Proje context'i (AI için) |
| `YAPILACAKLAR.md` | Kalan işler |
| `docs/sadoksan-sistem-tasarimi.md` | Tam sistem tasarım dokümanı |
| `docs/mvp-faz-0-1-uygulama-plani.md` | Stok modülü MVPP planı |
| `docs/production-release-checklist.md` | Prod çıkış checklist |
| `apps/api/prisma/schema.prisma` | Veritabanı şeması (34 model) |
| `scripts/backup-db.sh` | PostgreSQL yedekleme |

---

## ⚠️ Prod Uyarıları

- `.env` içindeki `JWT_SECRET` zayıf — prod'da değiştirilmeli
- `admin@admin.com` şifresi prod'da değiştirilmeli
- Test hesapları (`bayi@test.com`) prod'da silinmeli
- Backup cron job henüz ayarlanmadı: `0 2 * * * cd /home/can/sadoksan && ./scripts/backup-db.sh`
