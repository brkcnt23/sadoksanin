# Blok 1 — Sadoksan Kök MD'leri (Toparlanmış)

> **Kaynak dosyalar:** CLAUDE.md, YAPILACAKLAR.md, info.md, README.md, python-service/README.md  
> **Toparlanma tarihi:** 2026-06-17  
> **Yöntem:** 5 dosya detaylı okundu, kod/DB/container ile çapraz doğrulandı

---

## 1. PROJE KİMLİĞİ

| Alan | Değer |
|------|-------|
| Proje | Sadoksan ERP (B2B inşaat malzemeleri) |
| Owner | John (brkcnt6@gmail.com) |
| Sunucu | motto-server (45.43.152.52) — Fedora 41, 94 GB RAM |
| Dizin | /home/can/sadoksan |
| Git remote | GitHub (`github-key-1` push yetkisi) |
| Son commit | `75f2d6d` — Production hardening + 192 ürün görsel + Prisma 7.8 |
| Önceki commit'ler | Netsis, Plasiyer, Rapor motoru, Proforma onay akışı |

---

## 2. TECH STACK (Kod ile doğrulandı)

| Layer | Tech | Durum |
|-------|------|-------|
| Storefront | Nuxt 4.4 (SSR) — `apps/storefront/` | ✅ Running :3011 |
| Admin Panel | Nuxt 4.4 (SPA) — `apps/admin/` | ✅ Running :3012 |
| Backend API | NestJS 11 — `apps/api/` | ✅ Running :3010, health OK |
| Database | PostgreSQL 15 (Docker) | ✅ 35 tablo, 34 model |
| ORM | Prisma 7.8 — 899 satır schema | ✅ 19 migration uygulanmış |
| Queue | Redis 7 + BullMQ | ✅ Running |
| PDF | Python Flask + ReportLab + Gunicorn | ✅ Running :3013 |

---

## 3. BACKEND MODÜL DURUMU (CLAUDE.md + kod doğrulama)

| # | Modül | Durum | Not |
|---|-------|-------|-----|
| 1 | `auth` | ✅ | JWT, register/login, PLASIYER, adminCreateUser |
| 2 | `products` | ✅ | CRUD, varyasyon, kategori, marka, toplu iş, Excel |
| 3 | `orders` | ✅ | Tam yaşam döngüsü: create→approve→ship→complete |
| 4 | `dealer` | ✅ | Profil, cari, 8 rapor tipi, onay akışı, risk skoru |
| 5 | `proforma` | ✅ | PDF (Python), onay akışı (draft→pending→approved→downloaded) |
| 6 | `discounts` | ✅ | Ürün/kategori/marka bazlı (% veya sabit) |
| 7 | `promo` | ✅ | Promo kod doğrulama |
| 8 | `popup` | ✅ | Kampanya popup, hedef kitle |
| 9 | `pricing` | ✅ | Bölgesel/il bazlı fiyat farkı, lojistik kuralları |
| 10 | `notifications` | ✅ | Stok gelince haber ver |
| 11 | `audit` | ✅ | Tam denetim logu, filtreleme |
| 12 | `cms` | ✅ | Hero banner, site ayarları, bakım modu |
| 13 | `mailer` | ✅ | Console logger (SMTP hazır değil) |
| 14 | `favorites` | ✅ | Favori listesi |
| 15 | `reports` | ✅ | 8 endpoint (plasiyer-sales, order-pipeline, dealer-risk, critical-stock, slow-moving, credit-usage, plasiyer-dashboard, plasiyers) |
| 16 | `netsis` | 🟡 | NetOpenX REST: OAuth2 token + 4 sync hazır, **API URL/credential bekleniyor** |
| 17 | `stock` | 🟡 | StockMovement modeli + stok sayfası var, **manuel stok işlemleri çalışıyor mu?** |
| 18 | `alneo` | 🔴 | E-fatura entegrasyonu **API bekleniyor** |

---

## 4. KONTEYNER DURUMU (2026-06-17 anlık)

| Container | Port | Created | Status |
|-----------|------|---------|--------|
| sadoksan-storefront-prod | 3011→3000 | 6 days ago | ✅ healthy |
| sadoksan-admin-prod | 3012→3002 | 6 days ago | ✅ healthy |
| sadoksan-api-prod | 3010→3001 | 6 days ago | ✅ healthy (uptime ~6 gün) |
| sadoksan-postgres-prod | 5432 (iç) | 6 days ago | ✅ healthy |
| sadoksan-redis-prod | 6379 (iç) | 6 days ago | ✅ healthy |
| sadoksan-python-prod | 3013→5000 | 3 days ago | ✅ healthy |

> ⚠️ YAPILACAKLAR.md'de "storefront build'de plasiyer sayfaları yok" yazıyordu → **Kontrol edildi:** Plasiyer sayfaları kodda mevcut (`apps/storefront/app/pages/plasiyer/`), container 6 gün önce build edilmiş. Son build `75f2d6d` commit'ini içeriyor olmalı.

---

## 5. VERİTABANI (Doğrulandı)

- **35 tablo** (34 model + _prisma_migrations)
- **StockMovement tablosu MEVCUT** — 8 hareket tipi (MANUAL_ENTRY, MANUAL_EXIT, ORDER_RESERVE, ORDER_FULFILL, ORDER_CANCEL, RETURN_RESTOCK, COUNT_ADJUST, DAMAGE_LOSS)
- **UserRole enum:** DEALER, PLASIYER, ADMIN, SUPER_ADMIN — **CUSTOMER yok** ✅ (B2B-only refactor tamamlanmış)
- **Kullanıcılar:** `admin@admin.com` (ADMIN), `bayi@test.com` (DEALER) — **plasiyer kullanıcısı yok!**

---

## 6. URL'LER

| Servis | URL | Durum |
|--------|-----|-------|
| Storefront | https://sadoksan.smartinnventory.com/ | ✅ |
| Admin Panel | https://sadoksan.smartinnventory.com/sadoksan-panel/ | ✅ |
| API Health | https://sadoksan.smartinnventory.com/api/health | ✅ 200 |

---

## 7. ÇELİŞKİ TESPİTLERİ (MD'ler arası)

| # | İddia (kaynak) | Gerçek (doğrulama) | Sonuç |
|---|---------------|-------------------|-------|
| 1 | B2B refactor "Zaten yapılmış" (YAPILACAKLAR.md 06-09) ama Faz A ⬜ | UserRole'da CUSTOMER yok, DB'de sadece DEALER/ADMIN | ✅ **Yapılmış**, task listesi güncellenmemiş |
| 2 | Stok MVPP "Zaten yapılmış" (YAPILACAKLAR.md 06-09) ama Faz B ⬜ | StockMovement modeli var, stok.vue sayfası var | 🟡 **Model/seviye var**, UI endpoint'leri kontrol edilmeli |
| 3 | Storefront "Plasiyer sayfaları build'de yok" (YAPILACAKLAR.md) | Plasiyer sayfaları kodda mevcut, container 6 günlük | ❓ **Build'e girip girmediği canlı testle doğrulanmalı** |
| 4 | info.md tarih: 2026-06-03 | CLAUDE.md tarih: 2026-06-09 | ⚠️ info.md **güncel değil** |
| 5 | README.md tarih: 2026-04-29 | Proje yapısı tamamen değişmiş | ⚠️ README.md **eskimiş**, güvenilmez |
| 6 | Production Hardening H1-H6 hepsi 🔴 (YAPILACAKLAR.md) | JWT_SECRET güçlü ✅, backup cron aktif ✅ | 🟡 **Kısmen yapılmış**, H2-H3-H5 hala açık |
| 7 | Test hesapları: 3 adet (CLAUDE.md) | info.md: 2 adet (plasiyer yok) | ⚠️ info.md eksik, DB'de plasiyer hesabı da yok! |

---

## 8. GÜVENLİK DURUMU (Production Hardening)

| # | Madde | Durum | Not |
|---|-------|-------|-----|
| H1 | JWT_SECRET güçlü | ✅ | Uzun random string görünüyor |
| H2 | Admin şifresi değiştir | 🔴 | Hala `asd123` |
| H3 | POSTGRES_PASSWORD güçlü | ❓ | `.env`'de kontrol edilmeli |
| H4 | CORS_ORIGINS domain | ❓ | `.env`'de kontrol edilmeli |
| H5 | Test hesaplarını sil | 🔴 | `bayi@test.com` hala DB'de |
| H6 | Backup cron | ✅ | `0 2 * * *` aktif |

---

## 9. EKSİK ENTEGRASYONLAR

| Entegrasyon | Durum | Beklenen |
|-------------|-------|----------|
| Netsis ERP | 🟡 Kod hazır | API URL + credentials |
| Alneo E-Fatura | 🔴 | API dokümanı |
| Albaraka Ödeme | 🔴 Mock | Sanal POS bilgileri |
| Canmail SMTP | 🔴 Console only | SMTP sunucu bilgileri |
| ideaSoft | 🔴 | 4000 ürün + görsel |

---

## 10. TEST HESAPLARI (DB'de olan)

| Rol | Email | Şifre | Not |
|-----|-------|-------|-----|
| Admin | admin@admin.com | asd123 | 🔴 Prod'da değişmeli |
| Bayi | bayi@test.com | asd123 | 🔴 Prod'da silinmeli |
| Plasiyer | plasiyer@test.com | asd123 | ⚠️ **DB'de yok!** CLAUDE.md'de yazıyor ama hesap oluşturulmamış |

---

## 11. ÖNEMLİ DOSYA KONUMLARI (Güncel)

| Dosya | Amaç |
|-------|------|
| `/home/can/sadoksan/CLAUDE.md` | Ana teknik context (AI için) — **KALICI** |
| `/home/can/sadoksan/YAPILACAKLAR.md` | Görev listesi — güncellenmeli |
| `/home/can/sadoksan/docs/blok1.md` | **Bu dosya** |
| `/home/can/sadoksan/.env` | Tüm secret'lar |
| `/home/can/sadoksan/apps/api/prisma/schema.prisma` | 34 model, 899 satır |
| `/home/can/sadoksan/docker-compose.prod.yml` | Prod compose |
| `/home/can/sadoksan/scripts/backup-db.sh` | Manuel backup |
| `/home/can/sadoksan/apps/storefront/app/pages/plasiyer/` | 4 plasiyer sayfası |
| `/home/can/sadoksan/apps/admin/app/pages/raporlar/index.vue` | Admin rapor sayfası |
| `/home/can/sadoksan/apps/admin/app/pages/stok.vue` | Admin stok sayfası |

---

## 12. SIK KOMUTLAR (Doğrulanmış)

```bash
cd /home/can/sadoksan

# Durum
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3010/api/health

# Build & deploy (sıralı)
docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml build admin && docker compose -f docker-compose.prod.yml up -d admin
docker compose -f docker-compose.prod.yml build storefront && docker compose -f docker-compose.prod.yml up -d storefront

# Migration
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# DB bağlantısı
docker exec sadoksan-postgres-prod psql -U sadoksan -d sadoksan

# Backup (manuel + cron aktif)
./scripts/backup-db.sh

# Nginx reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## 13. PYTHON PDF SERVİSİ

| Alan | Değer |
|------|-------|
| Stack | Flask 3 + ReportLab 4 + Gunicorn + Python 3.11 |
| Port | 3013→5000 |
| Endpoint | `POST /generate` — proforma PDF |
| Şablonlar | INTERNATIONAL (ihracat), LOCAL (yurtiçi) |
| Worker | 4 Gunicorn worker |
| Max request | 50 MB, 30s timeout |
| Image timeout | 5 saniye |

---

## 14. YAPILACAKLAR.md GÜNCELLEME ÖNERİLERİ

- [ ] Faz A (B2B refactor) tüm adımları ✅ işaretle — kodda tamamlanmış
- [ ] Faz B (Stok MVPP) durumunu netleştir — model var ama endpoint/UI tamamı çalışıyor mu?
- [ ] Container durum tablosunu güncelle (hepsi healthy, plasiyer uyarısını kaldır)
- [ ] Production Hardening H1 ✅, H6 ✅ işaretle
- [ ] Plasiyer test hesabı oluştur (DB'de yok!)
