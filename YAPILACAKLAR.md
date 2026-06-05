# Sadoksan ERP — Kaldığımız Yer / Yapılacaklar

**Son güncelleme:** 2026-06-03
**Session özeti:** 3 Phase tamamlandı — ödeme, sipariş takip, bayi paneli

---

## Bu Session'da Yapılanlar

### Phase 1: Demo Kart + Ödeme
- Demo kart: `4111 1111 1111 1111` / `12/28` / `CVV: 123` / `Test Kart`
- Kartla ödeme yapınca B2B sipariş OTOMATİK ONAYLANIYOR
- Sepet checkout'ta kredi kartı seçeneği ve kart formu mevcut
- `/sayfa/demo-card` sayfasında kart bilgileri yazıyor

### Phase 2: Sipariş Durum Takibi
- `siparislerim.vue` komple yenilendi:
  - 6 adımlı görsel durum çizelgesi (Onay Bekliyor → Tamamlandı)
  - Durum geçmişi (API'den canlı çekiliyor)
  - İptal talebi butonu + modal (PENDING_APPROVAL/APPROVED/PREPARING için)
  - Havale bildirim formu (9 banka seçenekli)
  - Kargo takip gösterimi (tracking varsa)
  - Sipariş kalemleri + fiyat özeti

### Phase 3: Bayi Paneli
- `bayi.vue` güncellendi:
  - 5 KPI kart: Cari Bakiye, Onay Bekleyen, Bu Ay İşlem, Aylık Hacim, **Risk Skoru**
  - Cari işlemler tablosu + CSV döküm butonu
  - 8 rapor tipi: Aylık, Yıllık, Fatura, Stok, Detaylı, Risk, Yaşlandırma, Performans
  - Proforma listesi + PDF indirme
  - Bayi modu (lojistik bedel otomatik ekleniyor)

### Bug Fix'ler
- Hakkımızda iconları → `nuxt.config.ts`'e `icon` config eklendi
- Header "Ürünler" hover → `@mouseenter`/`@mouseleave` eklendi (tık + hover ikisi de çalışıyor)
- Footer → eski siteyle aynı 3 kolonlu yapı (Hakkımızda / Alışveriş / Yardım)
- Hukuki sayfalar → eski siteden (`sadoksaninsaat.com.tr`) gerçek içerik çekilip CMS'e aktarıldı:
  - `/sayfa/mesafeli-satis-sozlesmesi`
  - `/sayfa/gizlilik-ve-guvenlik`
  - `/sayfa/iptal-ve-iade-sartlari`
  - `/sayfa/kisisel-veriler-politikasi`
  - `/sayfa/sss`
  - `/sayfa/banka-hesaplari`

### Temizlik
- Eski `canterm` (PM2 id 0, port 3456) kaldırıldı, `pm2 save` yapıldı
- Nginx'teki ölü `/canterm-ws` rotası silindi
- Nginx'teki yorumlu Sadoksan satırları temizlendi

---

## Kaldığımız Yer — Yapılacaklar

### 🔴 Prod'a çıkmadan önce MUTLAKA

| # | İş | Detay |
|---|-----|------|
| 1 | `JWT_SECRET` | `.env`'deki değeri güçlü random string ile değiştir (min 64 karakter) |
| 2 | Admin şifresi | `admin@admin.com` şifresini değiştir |
| 3 | `POSTGRES_PASSWORD` | `.env`'de güçlü şifre kullan |
| 4 | `CORS_ORIGINS` | Sadece kendi domain(ler)ini ekle |
| 5 | Test hesaplarını temizle | `bayi@test.com` prod'da olmamalı |
| 6 | Backup cron job | `0 2 * * * cd /home/can/sadoksan && ./scripts/backup-db.sh` |
| 7 | SSL yenileme kontrolü | `certbot renew` cron'u çalışıyor mu? |
| 8 | Gerçek ürünler | ideaSoft'tan 4000 ürün import edilmeli |

### 🟡 Database Eksik Modelleri

| Model | Amaç | Öncelik |
|-------|------|---------|
| `PaymentLog` | Ödeme girişimlerinin log kaydı (başarılı/başarısız) | Orta |
| `ReturnRequest` + `ReturnItem` | İade/değişim yönetimi | Orta |
| `ImportJob` | Excel import işlem takibi | Düşük |
| `StockMovement` | **MVPP Planı var** (`docs/mvp-faz-0-1-uygulama-plani.md`) — schema'da model var, UI yok | Yüksek |

### 🟡 Backend Eksik Modülleri

| Modül | Durum | Detay |
|-------|-------|-------|
| `payment` | 🔴 Yok | Ödeme işlemlerini ayrı modüle taşı (şu an orders içinde) |
| `returns` | 🔴 Yok | İade yönetim modülü |
| `imports` | 🔴 Yok | Excel import tracking |

### 🟡 Frontend Eksikleri

| # | İş | Öncelik |
|---|-----|---------|
| 1 | Stok hareket yönetimi (Admin) | Yüksek — MVPP planı hazır |
| 2 | Admin dashboard kartları (kritik stok, bayi başvuru) | Orta |
| 3 | Admin ödeme yönetimi (`odemeler.vue` zayıf) | Orta |
| 4 | WhatsApp "Gelince Haber Ver" (stoksuz üründe) | Düşük |
| 5 | Misafir alışverişi (login olmadan sipariş) | Düşük |
| 6 | Email bildirimleri (SMTP gelince aktif olacak) | Düşük |
| 7 | Ürün görselleri (ideaSoft'tan 4000 ürün) | Orta |

### 🟢 Entegrasyonlar (Dış API bekleniyor)

| Entegrasyon | Durum |
|-------------|-------|
| Netsis (ERP) | 🔴 Fabrika ziyareti bekleniyor |
| Alneo (E-fatura) | 🔴 API bekleniyor |
| Albaraka (Ödeme) | 🔴 API bekleniyor |
| Canmail (SMTP) | 🔴 Anahtar bekleniyor |
| Canlogcatcher (Log) | 🔴 Anahtar bekleniyor |

---

## Geliştirme Notları

- Tüm değişiklikler **production sunucuda** yapılıyor
- Storefront build: `docker compose -f docker-compose.prod.yml build storefront`
- Deploy: `docker compose -f docker-compose.prod.yml up -d storefront`
- API container: `sadoksan-api-prod` (port 3010)
- Backend test: `curl http://127.0.0.1:3010/api/health`
- Prisma migration: `docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy`
- PM2 sadece host'taki CanAI/CantTerm süreçleri için, Sadoksan Docker'da
