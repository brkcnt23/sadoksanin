# Sadöksan ERP — Production Release Checklist

**Tarih:** 2026-05-26  
**Hedef:** Sadöksan B2B e-ticaret sistemini production'a güvenli çıkarmak

---

## 1. Environment Kontrolü

| # | Kontrol | Durum |
|---|---------|-------|
| 1.1 | `.env` production değerleriyle dolduruldu mu? | 🔴 Sana bırak |
| 1.2 | `JWT_SECRET` güçlü random string (min 64 karakter) | 🔴 Sana bırak |
| 1.3 | `POSTGRES_PASSWORD` güçlü şifre | 🔴 Sana bırak |
| 1.4 | `.env` repoda yok (.gitignore'da) | ✅ `.env` gitignore'da |
| 1.5 | `.env.example` güncel | ✅ Tüm değişkenler var |
| 1.6 | `CORS_ORIGINS` sadece kendi domain(ler)i | 🔴 Production domain'leri gir |
| 1.7 | `NODE_ENV=production` | 🔴 `.env`'de ayarla |
| 1.8 | API key alanları frontend'e sızmıyor | ✅ JWT guard + 401 dönüyor |
| 1.9 | `NUXT_PUBLIC_WHATSAPP_PHONE` storefront'ta | 🔴 `.env`'e ekle |
| 1.10 | `WHATSAPP_PHONE` geçerli numara | 🔴 Gerçek numara gir |

## 2. Docker Production Kontrolü

| # | Kontrol | Durum |
|---|---------|-------|
| 2.1 | `docker-compose.prod.yml` mevcut | ✅ |
| 2.2 | Tüm servisler tanımlı (api, storefront, admin, postgres, redis, pdf, nginx) | ✅ |
| 2.3 | `restart: unless-stopped` tüm servislerde | ✅ |
| 2.4 | Health check tüm servislerde | ✅ |
| 2.5 | Volume: postgres_data + redis_data + uploads | ✅ |
| 2.6 | Log rotation json-file (50MB/5file) | ✅ |
| 2.7 | `mem_limit` her serviste | ✅ |
| 2.8 | Portlar sadece localhost'a bind (127.0.0.1) | ✅ (nginx dışarıya açık) |
| 2.9 | API uploads volume mount | ✅ |
| 2.10 | Network bridge izole | ✅ |

## 3. Database Migration

| # | Kontrol | Durum |
|---|---------|-------|
| 3.1 | Migration zinciri temiz (19 migration) | ✅ Boş DB testi geçti |
| 3.2 | `prisma migrate deploy` kullanılacak | ✅ production'da `migrate dev` YOK |
| 3.3 | Migration öncesi backup alınacak | 🔴 Deploy öncesi manuel backup |
| 3.4 | Rollback planı var | ✅ (aşağıda) |

**Deploy komutu:**
```bash
# 1. Backup
./scripts/backup-db.sh

# 2. Migration
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# 3. Seed (ilk kurulumda)
docker compose -f docker-compose.prod.yml run --rm api npx tsx prisma/seed.ts
```

**Rollback:**
```bash
# PostgreSQL dump'tan geri yükleme
docker exec -i sadoksan-postgres-prod pg_restore -U sadoksan -d sadoksan --clean < backups/backup_TIMESTAMP.dump
```

## 4. Backup Stratejisi

| # | Kontrol | Durum |
|---|---------|-------|
| 4.1 | `scripts/backup-db.sh` mevcut | ✅ |
| 4.2 | pg_dump (binary + plain SQL) | ✅ |
| 4.3 | 30 gün retention | ✅ |
| 4.4 | Cron job ayarlandı mı? | 🔴 Sunucuda `0 2 * * *` ekle |
| 4.5 | Uploads klasörü volume'da | ✅ |
| 4.6 | `.env` yedeği güvenli yerde | 🔴 Manuel al |
| 4.7 | Backup restore testi yapıldı mı? | 🔴 İlk hafta test et |

**Cron:**
```bash
# /etc/crontab veya crontab -e
0 2 * * * cd /app && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1
```

**Restore testi:**
```bash
# Test ortamında
docker exec -i sadoksan-postgres-test pg_restore -U sadoksan -d sadoksan_test --clean < backups/backup_TIMESTAMP.dump
```

## 5. Güvenlik

| # | Kontrol | Durum |
|---|---------|-------|
| 5.1 | Helmet aktif (`main.ts`) | ✅ |
| 5.2 | Rate limiting: `/auth/login` 10/15dk | ✅ (sadece production'da) |
| 5.3 | CORS sadece kendi domain | 🔴 `.env`'de `CORS_ORIGINS` ayarla |
| 5.4 | Admin panel JWT guard arkasında | ✅ `middleware: 'auth'` |
| 5.5 | Admin login brute-force koruması | ✅ rate limit |
| 5.6 | Dosya upload: mime type + 5MB limit | ✅ |
| 5.7 | JWT secret production'da güçlü | 🔴 `.env`'de değiştir |
| 5.8 | `admin@admin.com / asd123` production'da değişecek | 🔴 Seed sonrası şifre değiştir |
| 5.9 | `bayi@test.com` production'da olmayacak | 🔴 Test hesaplarını sil |
| 5.10 | HTTPS zorunlu (nginx 301 redirect) | ✅ |
| 5.11 | Security headers (HSTS, X-Frame, XSS) | ✅ |
| 5.12 | Hidden files blocked (`~ /\.`) | ✅ |

## 6. SSL / Domain / Nginx

| # | Kontrol | Durum |
|---|---------|-------|
| 6.1 | Domain: `sadoksaninsaat.com.tr` | 🔴 Satın al / yönlendir |
| 6.2 | SSL sertifikası (`./ssl/`) | 🔴 Let's Encrypt |
| 6.3 | HTTP → HTTPS redirect | ✅ |
| 6.4 | `/sadoksan-panel/` → admin reverse proxy | ✅ |
| 6.5 | `/api/` → API reverse proxy | ✅ |
| 6.6 | `/uploads/` statik servis | ✅ |
| 6.7 | Nginx rate limiting (100r/s API, 50r/s genel) | ✅ |

**Let's Encrypt komutları:**
```bash
# İlk kurulum
certbot certonly --standalone -d sadoksaninsaat.com.tr -d www.sadoksaninsaat.com.tr

# Sertifikaları kopyala
cp /etc/letsencrypt/live/sadoksaninsaat.com.tr/fullchain.pem ./ssl/sadoksan.crt
cp /etc/letsencrypt/live/sadoksaninsaat.com.tr/privkey.pem ./ssl/sadoksan.key

# Otomatik yenileme (cron)
0 3 * * * certbot renew --quiet && docker compose -f docker-compose.prod.yml restart nginx
```

## 7. Logging

| # | Kontrol | Durum |
|---|---------|-------|
| 7.1 | API logları (Winston/Nest logger) | ✅ |
| 7.2 | Docker log rotation (50MB/5file) | ✅ |
| 7.3 | Nginx access/error log | ✅ |
| 7.4 | Admin audit log (AuditLog tablosu) | ✅ |
| 7.5 | Stok hareket logu (StockMovement) | ✅ |
| 7.6 | Sipariş durum geçmişi (OrderStatusHistory) | ✅ |
| 7.7 | E-doküman logu (EdocumentLog) | ✅ |
| 7.8 | Kritik hata bildirimi (e-posta) | 🟡 Mailer console'a yazıyor, SMTP gelince aktif |

## 8. Production Seed / Temizlik

| # | İşlem | Komut |
|---|-------|-------|
| 8.1 | Admin hesabı oluştur | `npx tsx prisma/seed.ts` (sadece admin + 1 bayi) |
| 8.2 | Admin şifresini değiştir | Admin panelden veya DB'den UPDATE |
| 8.3 | Demo ürünleri temizle | `DELETE FROM "Product" WHERE sku LIKE 'INS-%'` |
| 8.4 | Gerçek ürünleri import et | Admin panel Excel import |
| 8.5 | Test siparişlerini sil | `DELETE FROM "Order"` |
| 8.6 | Audit log'u temizle | `DELETE FROM "AuditLog"` |
| 8.7 | StockMovement log'u temizle | `DELETE FROM "StockMovement"` |

## 9. Final Smoke Test (Production Ortamında)

| # | Test | ✅ |
|---|------|-----|
| 9.1 | Admin login (`/sadoksan-panel`) | |
| 9.2 | Bayi login → `/bayi` | |
| 9.3 | Ürün listesi | |
| 9.4 | Sepet → sipariş oluştur | |
| 9.5 | Admin sipariş onayla | |
| 9.6 | Havale bildirimi → onay | |
| 9.7 | Stok hareketi (manuel + sipariş) | |
| 9.8 | CMS sayfa (`/sayfa/hakkimizda`) | |
| 9.9 | SEO redirect (301) | |
| 9.10 | Proforma PDF | |
| 9.11 | HTTPS çalışıyor | |
| 9.12 | `/sadoksan-panel` erişimi | |
| 9.13 | Mobil görünüm | |

## 10. Deploy Sırası

```bash
# 1. Sunucuda repoyu clone'la
git clone <repo-url> /app
cd /app

# 2. .env dosyasını oluştur (.env.example'dan kopyala, değerleri doldur)
cp .env.example .env
nano .env  # JWT_SECRET, DB password, domain'leri gir

# 3. SSL sertifikası oluştur
mkdir -p ssl
certbot certonly --standalone -d sadoksaninsaat.com.tr -d www.sadoksaninsaat.com.tr
cp /etc/letsencrypt/live/sadoksaninsaat.com.tr/fullchain.pem ./ssl/sadoksan.crt
cp /etc/letsencrypt/live/sadoksaninsaat.com.tr/privkey.pem ./ssl/sadoksan.key

# 4. Build ve başlat
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. Migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 6. Seed (ilk kurulum)
docker compose -f docker-compose.prod.yml exec api npx tsx prisma/seed.ts

# 7. Admin şifresini değiştir
# Admin panele girip profil → şifre değiştir

# 8. Backup cron'u ekle
crontab -e
# 0 2 * * * cd /app && ./scripts/backup-db.sh >> /var/log/backup.log 2>&1

# 9. Smoke test (yukarıdaki checklist)
```

## Riskler ve Önlemler

| Risk | Önlem |
|------|-------|
| Netsis/API henüz hazır değil | Stok manuel yönetiliyor, displayStock formülü çalışıyor |
| E-fatura API yok | Manuel fatura takibi, EdocumentLog hazır |
| Ödeme API yok | Havale ile manuel, BankTransfer + admin onay |
| SMTP yok | Mailer console'a yazıyor, log'lar takip edilebilir |
| Seed data eksik | Excel import ile ürünler yüklenebilir |
| DNS propagation | 24-48 saat önce domain ayarlarını yap |

## Production Sonrası İlk Hafta

- [ ] Günlük backup kontrolü
- [ ] İlk 3 gün yoğun izleme (CPU, RAM, hatalar)
- [ ] Admin + bayi kullanıcı eğitimi
- [ ] Gerçek ürün verileri import
- [ ] SEO 301 yönlendirmeleri ekle
- [ ] Google Search Console + Analytics
- [ ] Hata log'larını düzenli kontrol et
