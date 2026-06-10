# Sadoksan Oturum Özetleri

## 2026-06-10 — Production Hardening + Görsel Scrape + Frontend Fix

### 🔴 Production Hardening
- **H1**: JWT_SECRET rotasyonu — yeni güçlü random secret
- **H2**: Admin şifresi değiştirildi
- **H3**: POSTGRES_PASSWORD güçlendirildi, DB sıfırdan oluşturuldu
- **H4**: CORS_ORIGINS sadece production domain
- **H6**: DB volume sıfırlama + 20 migration + seed

### 🔧 Backend Fix'leri
- **Popup 401 fix**: `@Public()` decorator oluşturuldu, JWT guard güncellendi, `getActive`/`trackImpression`/`trackClick` public yapıldı
  - `src/common/decorators/public.decorator.ts` — yeni
  - `src/modules/auth/guards/jwt-auth.guard.ts` — Reflector eklendi
  - `src/modules/popup/popup.controller.ts` — @Public() eklendi
- **Prisma 7.8 uyumluluğu**: `prisma.config.ts` oluşturuldu, `Dockerfile`'a COPY eklendi
- **Seed sistemi**: `tsx` ile çalışıyor, PrismaPg adapter kullanıyor

### 🖼️ Görsel Scraping Sistemi
- **192 ürün + 192 görsel** sadoksaninsaat.com.tr'den indirildi
- `scripts/download-product-images.py` — Python scraper (kategori → detay → indir)
- `scripts/scrape-images.cjs` — Puppeteer fallback scraper
- `apps/api/src/scripts/seed-scraped-products.ts` — Otomatik seed (otomatik SKU/kategori/marka tahmini)
- `docs/urun-katalogu.json` — 192 ürün detaylı JSON
- `docs/urun-katalogu.md` — Ürün katalogu MD
- Görseller: `apps/storefront/public/images/products/{SKU}.{ext}` (14MB, 191 dosya)

### 🎨 Admin Panel Fix'leri
- **Sidebar**: Tamamen koyu gradient, metin renkleri açık (beyaz/slate), mobil uyumlu
  - `apps/admin/app/components/AppShell.vue`
- **QuickActionCards**: Stack layout → responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
  - `apps/admin/app/components/QuickActionCards.vue`

### 🏪 Storefront Fix'leri
- **Kategori filtre sistemi** komple rewrite:
  - Dinamik kategori ağacı (product verisinden otomatik)
  - Sub-kategori tespiti (ürün isminden: "60x120", "Asma Klozet" vb.)
  - URL bazlı filtreleme (`?kategori=seramik`)
  - Checkbox filtreleri slug-tabanlı
  - `apps/storefront/app/pages/urunler.vue`
- **Ürün isimleri temizlendi**: ALL CAPS → Title Case, URL-slug → normal isim
- **Kategoriler konsolide**: 12+ → 7 temiz kategori

### 📦 DB Durumu
- 285 ürün, 7 kategori: Vitrifiye(117), Banyo Aksesuarları(43), Seramik(38), Silikon(28), Batarya(26), Banyo Dolabı(23), İnsört(10)
- 192 görselli ürün (local `/images/products/` path)
- 20 migration uygulandı

### 📁 Yeni Dosyalar
| Dosya | Amaç |
|-------|------|
| `apps/api/src/common/decorators/public.decorator.ts` | @Public() decorator |
| `apps/api/src/scripts/seed-scraped-products.ts` | 192 ürünlük seed |
| `apps/api/prisma.config.ts` | Prisma 7.8 config |
| `docs/urun-katalogu.json` | Ürün katalog JSON |
| `docs/urun-katalogu.md` | Ürün katalog MD |
| `scripts/download-product-images.py` | Python görsel scraper |
| `scripts/scrape-images.cjs` | Puppeteer fallback |

### ⚠️ Kalan İşler
- **Sub-kategori detaylandırma**: Daha spesifik alt kategoriler (şu an otomatik tespit var, iyileştirilebilir)
- **Anasayfa kategori showcase**: Eski grid layout geri getirilmeli
- **Fiyatlandırma**: Ürünler şu an tahmini fiyatlarla (gerçek fiyatlar girilmeli)
- **Test hesapları**: Hala admin@admin.com / bayi@test.com aktif
- **H5**: Test hesapları silinecek (prod öncesi)
- **Backup cron**: H6 henüz yapılandırılmadı
