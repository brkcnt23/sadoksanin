# Sadoksan ERP — Yapılacaklar & AI Prompt

**Son güncelleme:** 2026-07-09
**Konum:** motto-server (45.43.152.52) — SUNUCU İÇİNDE ÇALIŞIYORSUN, SSH GEREKMEZ

---

## 🤖 AI KENDİNE PROMPT (Her Oturum Başı Oku)

```
Sen Sadoksan ERP projesinde çalışıyorsun. MOTTO-SERVER (Fedora 41, 94GB RAM)
üzerindesin. SSH atmana gerek YOK — doğrudan sunucudasın.

HER ZAMAN:
1. CLAUDE.md + docs/SADOKSAN-CLAUDE.md'yi oku
2. Bu dosyayı oku → "Yapılacaklar" bölümüne bak
3. Container durumunu kontrol et: docker compose -f docker-compose.prod.yml ps
4. Gerekeni yap, BU DOSYAYI GÜNCE TUT (yapılanları "Yapılanlar"a ekle)

KRİTİK KURALLAR:
- Admin panel SPA → .env değişikliğinde REBUILD ŞART (restart yetmez)
- Storefront SSR → REBUILD gerekir
- API değişikliğinde REBUILD + RESTART
- Prisma migration: docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
- Backup: /home/can/backup-all-dbs.sh
- Proje dizini: /home/can/sadoksan
- 896 gizli ürün var (Netsis import), stok uyarılarında filtrelenir
```

---

## ✅ YAPILANLAR

### 2026-07-09 — Ideasoft API Taklit Planı (Entegra E-Fatura)
- **Ideasoft API dokümanı incelendi:** `/home/can/sadoksan/ideasoftapi.md` (697KB, 44,854 satır, Ideasoft'un kendi Stoplight API dökümanı)
- **65 admin-api endpoint'in tamamı çıkarıldı**, Entegra'nın e-fatura için kullanacağı kritik endpoint'ler belirlendi:
  - `GET /admin-api/orders` (status, date, id filtreleriyle sipariş listesi)
  - `GET /admin-api/order_items` (order filter ile sipariş kalemleri)
  - `GET /admin-api/billing_addresses` (fatura adresi + gömülü order/member/items)
  - `GET /admin-api/product_details` (ürün detayı)
  - `GET /admin-api/invoice_setting` (fatura şablonu)
- **Kritik keşif:** Ideasoft'ta ayrı `/admin-api/products`, `/admin-api/customers`, `/admin-api/members` endpoint'leri YOK — tüm veri order'ın içinde gömülü (nested) geliyor
- **Veri eşleştirme tablosu:** Sadoksan Order→Ideasoft Order (25+ alan), Member, BillingAddress, OrderItem, ProductDetail, ShippingAddress
- **ID mapping stratejisi:** Ideasoft integer ID ↔ Sadoksan UUID için `ideasoft_id_mapping` + `ideasoft_legacy_id` tabloları
- **Implementasyon planı:** Faz 0 (hazırlık) → Faz 1 (OAuth2) → Faz 2 (Admin API) → Faz 3 (test) → Faz 4 (canlı)
- **Doküman:** `docs/ideasoft-api/05-mimic-plan.md` — 8 bölüm, eksiksiz taklit planı
- **YAPILACAKLAR.md:** Faz E (E-Fatura Ideasoft Taklit) eklendi

### 2026-07-08 — Plasiyer-Bayi Atama + Merkezi Excel + Kredi Limiti + Slug Doğrulama
- **Plasiyer-bayi tek atama (YENİ):** `Dealer.salesRepId` + FK + index (migration `20260708000000_add_dealer_sales_rep`). Plasiyer panele girince **sadece kendine atanmış bayileri** görür. `PATCH /dealer/:id/plasiyer` (sadece ADMIN). `plasiyerler.vue`'deki atama artık gerçekten kalıcı + "N bayi atanmış" rozeti. `/auth/users?role=` filtresi düzeltildi (liste boş dönüyordu).
- **Plasiyer admin panel erişimi:** useAdminAuth PLASIYER kabul ediyor, middleware allow-list (`/`, `/bayiler`, `/proforma`, `/raporlar`), AppShell menüsü role göre filtreleniyor.
- **Merkezi xlsx export:** `utils/excel.ts` → `exportXlsx()`, tüm "Excel'e aktar" gerçek .xlsx (Türkçe Excel tek-sütun sorunu yok). fiyatlandirma + raporlar geçti.
- **Kredi limiti artık siparişi ENGELLEMİYOR:** eşik (%50/%80/%100) uyarı e-postasına dönüştü (`notifyCreditThreshold`).
- **Ürün slug (storefront):** ZATEN çözülmüş olduğu doğrulandı — Product'ta slug kolonu YOK, storefront `slugify(brand-name)` üretiyor + çakışmada SKU ekliyor (commit a6d8684 + 0241644, origin'de).
- **DEPLOY DURUMU:** migration prod DB'ye uygulandı, api rebuild+up edildi, backend uçtan uca test geçti (plasiyer filtresi ✓, 403 guard ✓). Admin container rebuild edildi. **origin'e PUSH YAPILMADI** (kullanıcı isteği — önce test).
- **Test hesap şifreleri:** ahmet.satis@test.com ARTIK `asd123` (eski `test123` geçersiz).

### 2026-07-04 — Sepet Görünümü + Yazdırma + Marka/Kategori Hızlı Ekleme + Filtre Fix + MD Güncelleme
- **Bayi sepet görünümü:** `GET /dealer/carts` endpoint + bayiler.vue widget (aktif/terkedilen, 3+ gün = terkedilmiş)
- **Sipariş yazdırma:** OrderDetailDrawer'a `@media print` CSS eklendi, çıktı temiz
- **Marka filtresi:** Admin ürün listesine marka filtresi eklendi (Brand tablosundan beslenir)
- **Hızlı marka/kategori ekleme:** Ürün formunda "+ Yeni" butonu, createCategory parentId desteği
- **Brand & Kategori tam CRUD:** `Brand` ve `Category` modelleri, seed endpoint'i, güncelleme zinciri (isim değişince Product string'leri de güncellenir)
- **Sipariş filtre fix:** Enum casing uyuşmazlığı — filtreler hiç çalışmıyordu
- **Banka havalesi fix:** Onaylanınca bayi cari bakiyesi düşürülmüyordu
- **Cari bakiye fix:** Çift-sayım bug'ı + rapor tarih aralığı varsayılanı düzeltildi
- **MD güncelleme:** CLAUDE.md + SADOKSAN-CLAUDE.md + YAPILACAKLAR.md + info.md baştan sona yenilendi

### 2026-07-02 — Varyant Faz 3 + Netsis Planlama + Stok Fix
- **Modüler varyant sistemi Faz 3:** Tip tanımla (Renk/Ebat/Desen/Özel) + grid ile toplu kartezyen üretim, mükerrer önleme, çoklu-özellik badge, stok alanı
- **Netsis entegrasyon planı:** NETSIS-ENTEGRASYON-PLANI.md — fabrika ziyareti hazırlık, push-agent tasarımı, e-fatura akışı, 10 API endpoint referansı
- **896 Netsis ürün import:** `import-netsis-stock-excel.js` ile Excel'den gerçek stok kodlu ürünler içeri aktarıldı (visible=false)
- **Stok uyarı fix:** Gizli ürünler kritik görünmüyor + uyarı listelerine sayfalama (10'ar) eklendi
- **Görsel upload fix:** Admin/storefront limit eşitleme + varyasyona görsel ekleme + kayıt bug fix
- **CSV export fix:** Windows Excel'de BOM + separator düzeltildi
- **Kategori sayacı rollup fix:** Alt kategori ürünleri üst kategoriye yansımıyordu
- **Storefront kategori filtresi fix:** categoryId kayboluyordu

### 2026-06-17 — Test Butonları + Bayi/Plasiyer Yönetimi + Tanıtım Panosu
- TestOrderModal, DealerCreateModal, IntroBanner, plasiyerler sayfası
- Kredi limiti inline edit, finansal takip alanları (fatura/nakit/irsaliye)
- Rapor formülleri + önizleme, dış bayi başvurusu kapatıldı
- 11 sipariş + 4 bayi test verisi oluşturuldu
- Plasiyer test hesabı (ahmet.satis@test.com), kart doğrulama gevşetildi

### 2026-06-09/10/11 — Prod Hardening + Bug Fix'ler
- Prod hardening: 192 ürün görsel, Prisma 7.8, Admin/Storefront fix
- 5 bug fix: proforma route, rapor duplicate, plasiyer middleware, header linki, token standardizasyonu
- Kredi limiti kontrolü, ürün filtreleme (categoryId + fuzzy search)
- 101 ürün categoryId eşleştirildi, MD toparlama

### 2026-06-08 — Netsis + Plasiyer + Rapor (7 commit)
- Netsis NetOpenX REST: OAuth2 + 4 sync + 8 endpoint + scheduler
- Plasiyer rolü + adminCreateUser + listUsers
- Proforma onay akışı (7 endpoint), Rapor motoru (8 endpoint)
- Plasiyer storefront: 4 sayfa (dashboard, proforma, proformalarim, raporlar)

### 2026-06-05 — UI Fixes + Kategori Menü (5 commit)
- Header "Ürünler" mega menü, sub kategori filtreleme, CMS sayfaları (6 hukuki sayfa)
- Proforma bug fix, Product.isFeatured kolonu

### 2026-06-02/03 — Admin UI Revizyonu (~15 commit)
- Faz 0-4: Toast, mobile sidebar, CRM, İndirimler, Ödemeler, Denetim, Döviz
- 6 shared component, global prefix fix (app.setGlobalPrefix)
- 9 controller temizliği, nginx trailing slash

### 2026-05-31 — Deployment + Kategori Hiyerarşisi (14 commit)
- Production deployment (Docker), 48 kategori seed, 19 migration

---

## 📊 GÜNCEL VERİ (2026-07-04)

| Metrik | Değer |
|--------|-------|
| Toplam ürün | 1,181 (285 görünür + 896 Netsis import gizli) |
| Varyasyon | 0 (sistem hazır) |
| Kullanıcı | 8 (5 bayi + 1 plasiyer + 1 admin + 1 super_admin) |
| Prisma model | 34 |
| API modülü | 18 |
| Admin sayfası | 19 |

---

## 📦 Container Durumu

| Container | Port | Durum |
|-----------|------|-------|
| sadoksan-storefront-prod | 3011→3000 | ✅ Güncel |
| sadoksan-admin-prod | 3012→3002 | ✅ Güncel |
| sadoksan-api-prod | 3010→3001 | ✅ Güncel |
| sadoksan-postgres-prod | 5432 | ✅ |
| sadoksan-redis-prod | 6379 | ✅ |
| sadoksan-python-prod | 3013→5000 | ✅ |

---

## 🔴 BUG'LAR — Hepsi Fix Edildi ✅

| # | Bug | Fix | Tarih |
|---|-----|-----|-------|
| BUG-1 | Proforma route sıralaması | `pending`/`my` route'ları `:id`'den önceye taşındı | 06-09 |
| BUG-2 | Admin rapor duplicate | Eski `raporlar.vue` silindi | 06-09 |
| BUG-3 | Plasiyer middleware eksik | `middleware/plasiyer.ts` oluşturuldu | 06-09 |
| BUG-4 | Header plasiyer linki yok | Desktop + mobile header'a eklendi | 06-09 |
| BUG-5 | Token key tutarsızlığı | `user-token` + `auth.user` standardize | 06-09 |
| BUG-6 | Stok uyarı 896 gizli ürün | `visible=true` filtresi + sayfalama | 07-02 |
| BUG-7 | Sipariş filtre çalışmıyor | Enum casing uyuşmazlığı fix | 07-04 |
| BUG-8 | Banka havalesi cari düşüm | Onayda bakiye düşürülmüyordu | 07-04 |
| BUG-9 | Cari bakiye çift-sayım | Mükerrer sayım + tarih aralığı fix | 07-04 |
| BUG-10 | CSV Windows Excel bozuk | BOM + separator düzeltildi | 07-02 |
| BUG-11 | Kategori sayacı rollup | Alt kategori → üst kategori sayım fix | 07-02 |
| BUG-12 | Storefront kategori filtresi | categoryId kaybı fix | 07-02 |

---

## 🟢 PLANLANAN GELİŞTİRMELER

### Faz A: B2B-Only Refactor (CUSTOMER Rol Temizliği)
> Zaten yapıldı — CUSTOMER rolü yok, DB'de sadece DEALER/PLASIYER/ADMIN/SUPER_ADMIN

### Faz B: Stok Modülü MVPP
> Büyük ölçüde tamam — StockMovement modeli + service + controller + UI hazır

| # | İş | Durum |
|---|-----|-------|
| B1 | Prisma: StockMovement modeli + netsisPendingQuantity | ✅ |
| B2 | recalcDisplayStock() formül güncellemesi | ✅ |
| B3 | StockModule: service + controller | ✅ |
| B4 | OrdersService ↔ StockMovement log | ✅ |
| B5 | Admin stock store | ✅ |
| B6 | Admin UI: drawer, manual modal, count modal | KISMEN (CountAdjustModal yok) |
| B7 | Storefront: WhatsApp "Gelince Haber Ver" | ✅ (NotifyRequest) |
| B8 | Test: 16 kabul kriteri | ❌ |

### Faz C: Netsis Entegrasyonu
> Detay: `NETSIS-MASTER.md` (ana referans) + `NETSIS-ENTEGRASYON-PLANI.md`

| # | İş | Durum |
|---|-----|-------|
| C1 | NetOpenX REST kod (service, controller, scheduler) | ✅ |
| C2 | 896 ürün Excel import | ✅ |
| C3 | PULL connection kanıtlandı (ENTEGRE9 test DB, token+ürün+kur) | ✅ |
| C4 | SADOKSAN2026 backup → ENTEGRE9 slot'una yükle | 🔲 |
| C5 | Push-agent yazımı (fabrika PC) | 🔲 |
| C6 | Backend push endpoint (kod yazıldı, test edilmedi) | 🟡 |
| C7 | Netsis sync → ürün eşleştirme (netsisCode upsert) | 🔲 |
| C8 | E-fatura: Ideasoft API taklidi (Entegra için) | 🟡 Plan hazır |

### Faz E: E-Fatura — Ideasoft API Taklit (Entegra)
> Detay: `docs/ideasoft-api/05-mimic-plan.md`
> **Amaç:** Sadoksan Ideasoft'un yerine geçtiği için, Entegra hiçbir şey değişmemiş gibi bizden veri çeksin.

| # | İş | Durum |
|---|-----|-------|
| E1 | Ideasoft API dokümanı (697KB) incelendi + endpoint haritası çıkarıldı | ✅ |
| E2 | Taklit planı yazıldı (data mapping, ID stratejisi, faz planı) | ✅ |
| E3 | Entegra'nın client_id/client_secret bilgilerini al | 🔲 |
| E4 | Faz 1: OAuth2 module (`/oauth/v2/token`, `/panel/auth`) | 🔲 |
| E5 | Faz 2: Admin API endpoints (orders, order_items, billing_addresses, product_details) | 🔲 |
| E6 | ideasoft_id_mapping Prisma model + migration | 🔲 |
| E7 | Nginx `/admin-api/*` → NestJS ideasoft controller route'u | 🔲 |
| E8 | Entegra ile uçtan uca test | 🔲 |

### Faz D: Eksik Modeller/Modüller

| İş | Öncelik |
|----|---------|
| PaymentLog tablosu | Orta |
| ImportJob tablosu | Düşük |
| CountAdjustModal | Düşük |
| BankTransfer havale bildirim UI | Orta |
| Admin kullanıcı yönetimi sayfası | Orta |
| Online ödeme (gerçek) | Yüksek |
| İade yönetimi | Düşük |
| SEO 301 yönlendirme | Düşük |
| Excel Import Wizard | Düşük |
| Kupon Admin CRUD | Düşük |

---

## 🔵 PRODUCTION HARDENING

| # | İş | Durum |
|---|-----|-------|
| H1 | JWT_SECRET güçlü | ✅ |
| H2 | Admin şifresi değişti | ✅ |
| H3 | POSTGRES_PASSWORD güçlü | ✅ |
| H4 | CORS_ORIGINS domain | ✅ |
| H5 | Test hesaplarını sil | 🔴 |
| H6 | Backup cron | ✅ |

---

## 🔴 ENTEGRASYONLAR (Dış API Bekleniyor)

| Entegrasyon | Durum | Beklenen |
|-------------|-------|----------|
| Netsis ERP | 🟡 Kod hazır, 896 ürün import edildi | Fabrika → API URL + credentials |
| Alneo E-Fatura | 🔴 | API dokümanı |
| **Entegra E-Fatura (Ideasoft Taklit)** | 🟡 Plan hazır | Entegra'nın client_id + hangi endpoint'leri kullandığı |
| Albaraka Ödeme | 🔴 Mock | Sanal POS |
| Canmail SMTP | 🔴 Console | SMTP bilgileri |

---

## 🌐 URL'ler

| Servis | URL |
|--------|-----|
| Storefront | https://sadoksan.smartinnventory.com/ |
| Admin Panel | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| API Health | https://sadoksan.smartinnventory.com/api/health |

---

## 🛠️ Sık Komutlar

```bash
cd /home/can/sadoksan

docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml build admin && docker compose -f docker-compose.prod.yml up -d admin
docker compose -f docker-compose.prod.yml build storefront && docker compose -f docker-compose.prod.yml up -d storefront
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker logs sadoksan-api-prod --tail 50
curl http://127.0.0.1:3010/api/health
docker exec sadoksan-postgres-prod psql -U sadoksan -d sadoksan
/home/can/backup-all-dbs.sh
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📁 Doküman Haritası

| Dosya | Amaç |
|-------|------|
| **YAPILACAKLAR.md** | **BU DOSYA** — görev + yapılanlar + AI prompt |
| CLAUDE.md | Teknik context (AI için) |
| docs/SADOKSAN-CLAUDE.md | Master context (sunucu + kapsamlı referans) |
| info.md | Hızlı referans / giriş bilgileri |
| NETSIS-ENTEGRASYON-PLANI.md | Netsis fabrika ziyareti planı |
| docs/raporlar.md | 16 rapor kataloğu |
| docs/sadoksan-sistem-tasarimi.md | Tam sistem tasarımı (35 bölüm) |
| docs/urun-katalogu.md | 98 ürünlük Ideasoft kataloğu (referans) |
| docs/musteri-istekleri.md | Müşteri istekleri |
| docs/b2b-only-refactor-plani.md | Faz A detay planı (tamamlandı) |
| docs/mvp-faz-0-1-uygulama-plani.md | Faz B detay planı (büyük ölçüde tamam) |
| docs/gelistirici-uygulama-rehberi.md | Task breakdown (20 task) |
| docs/production-release-checklist.md | Prod checklist |
| docs/oturum-ozetleri.md | Oturum geçmişi |
