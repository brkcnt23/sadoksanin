# Sadoksan ERP — Info / Giriş Bilgileri

**Son güncelleme:** 2026-07-04

---

## 🌐 URL'ler

| Amaç | URL |
|------|-----|
| **Storefront (ana site)** | https://sadoksan.smartinnventory.com/ |
| **Admin Panel** | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| **API (health)** | https://sadoksan.smartinnventory.com/api/health |
| **Demo Kart Bilgisi** | https://sadoksan.smartinnventory.com/sayfa/demo-card |

---

## 📊 Proje Özeti

| Metrik | Değer |
|--------|-------|
| Toplam ürün | **1,181** (285 görünür + 896 Netsis import) |
| Kullanıcı | 8 (5 bayi + 1 plasiyer + 1 admin + 1 super_admin) |
| API modülü | 18 |
| Veritabanı modeli | 34 (Prisma) |
| Docker container | 6 |

---

## 🔑 Test Hesapları

| Rol | E-posta | Şifre |
|-----|---------|-------|
| **Admin** | admin@admin.com | asd123 |
| **Bayi** | bayi@test.com | asd123 |
| Bayi | ankara-yapi@test.com | test123 |
| Bayi | izmir-ticaret@test.com | test123 |
| Bayi | bursa-insaat@test.com | test123 |
| Bayi | erzurum-yapi@test.com | test123 |
| **Plasiyer** | plasiyer@test.com | asd123 |
| Plasiyer | ahmet.satis@test.com | test123 |

---

## 💳 Demo Kredi Kartı (Sunum İçin)

```
Kart No:  4111 1111 1111 1111
SKT:      12/28
CVV:      123
İsim:     Test Kart
```

**Kural:** Bu kartla ödeme yapıldığında B2B sipariş **OTOMATİK ONAYLANIR**, ödeme `PAID` olur, tam iş akışı başlar.

---

## 🖥️ Sunucu

| Detay | Değer |
|-------|-------|
| Hostname | motto-server |
| IP | 45.43.152.52 |
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
| canterm-server | 3457 | Terminal bridge |
| smartinnventory-nuxt | 3201 | SmartInventory |
| qrmenu | 3203 | QR Menu |

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

# API rebuild
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml up -d api

# DB migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# DB'ye bağlan
docker exec sadoksan-postgres-prod psql -U sadoksan -d sadoksan

# Backup
/home/can/backup-all-dbs.sh

# Tüm container'ları gör
docker compose -f docker-compose.prod.yml ps

# API'ye direkt istek (içeriden)
curl http://127.0.0.1:3010/api/health

# Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📁 Önemli Dosyalar

| Dosya | Amaç |
|-------|------|
| `CLAUDE.md` | Teknik context (AI için) |
| `docs/SADOKSAN-CLAUDE.md` | Master context (kapsamlı referans) |
| `YAPILACAKLAR.md` | Görev listesi + yapılanlar |
| `info.md` | **BU DOSYA** — Hızlı referans |
| `NETSIS-ENTEGRASYON-PLANI.md` | Netsis entegrasyon planı |
| `.env` | Tüm secret'lar (GIT'E KOYMA) |
| `apps/api/prisma/schema.prisma` | Veritabanı şeması (912 satır, 34 model) |
| `docs/sadoksan-sistem-tasarimi.md` | Tam sistem tasarım dokümanı |
| `docs/raporlar.md` | 16 rapor kataloğu |

---

## ⚠️ Prod Uyarıları

- Test hesapları (`bayi@test.com`) prod'da silinmeli
- 896 gizli Netsis ürününe fiyat/kategori/görsel atanması gerekiyor (Netsis sync ile otomatik gelecek)
- Backup cron: `0 2 * * * /home/can/backup-all-dbs.sh` ✅ aktif
