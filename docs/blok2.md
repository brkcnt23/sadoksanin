# Blok 2 — Tasarım & Planlama MD'leri (Toparlanmış)

> **Kaynak dosyalar:** sadoksan-sistem-tasarimi.md, urun-katalogu.md, raporlar.md, raporlar_update.md, gelistirici-uygulama-rehberi.md  
> **Toparlanma tarihi:** 2026-06-17  
> **Doğrulama:** Kod + DB + container ile çapraz kontrol edildi

---

## 1. SİSTEM TASARIMI — Gerçekleşen vs Planlanan

### 1.1 Roller: Tasarımda 9, Kodda 4

| Rol | Tasarımda | Kodda var? | Not |
|-----|-----------|------------|-----|
| SUPER_ADMIN | ✅ | ✅ | |
| ADMIN | ✅ | ✅ | |
| DEALER | ✅ | ✅ | |
| PLASIYER | ✅ (sonradan eklendi) | ✅ | rapors_update.md ile geldi |
| CUSTOMER | ✅ | ❌ KALDIRILDI | B2B-only refactor ile silindi |
| SALES_STAFF | ✅ | ❌ | Yok |
| WAREHOUSE_STAFF | ✅ | ❌ | Yok |
| ACCOUNTING | ✅ | ❌ | Yok |
| CONTENT_EDITOR | ✅ | ❌ | Yok |
| GUEST | ✅ | ❌ | Yok (misafir alışverişi var) |

> ⚠️ **Tasarım doc'u (2026-05-25) güncellenmeli.** 5 rol tanımlanmış ama implemente edilmemiş.

### 1.2 Modül Durumu (Tasarım vs Gerçek)

| Modül | Tasarım MVP | Kod Durumu | Açık |
|-------|-------------|------------|------|
| Ürün CRUD | ✅ | ✅ | Varyant grid, SEO sekmeleri eksik |
| Kategori | ✅ Düz | ✅ Parent-child var | 48 kategori seed'li |
| Stok | ✅ Temel | ✅ StockMovement var | Manuel giriş/çıkış UI? |
| Sepet | ✅ | ✅ | |
| Sipariş | ✅ | ✅ Tam akış | |
| Havale Ödeme | ✅ | ❓ | BankTransfer tablosu var, UI? |
| Müşteri Üyeliği | ✅ | ✅ | |
| Favoriler | ✅ | ✅ | |
| Dashboard | ✅ | ✅ | |
| İçerik Sayfaları | ✅ | ✅ CMS | |
| SEO | ✅ | ❓ | 301 tablosu yok |
| Excel Import/Export | ✅ | ✅ | Wizard değil |
| Audit Log | ✅ | ✅ | |
| B2B Bayi | ✅ | ✅ | |
| Fiyatlandırma | ✅ | ✅ | |
| Güvenlik | ✅ | 🟡 | Hardening kısmen |
| Site Ayarları | ✅ | ✅ | |
| Kupon | V1 | 🟡 | Model var, admin CRUD yok |
| Online Ödeme | V1 | 🔴 | Sadece mock |
| Kargo API | V1 | 🔴 | Manuel takip no |
| E-Fatura | V2 | 🔴 | API bekleniyor |
| Netsis Canlı | V2 | 🟡 | Kod hazır, API bekleniyor |

### 1.3 URL Yapısı Değişikliği

| Dönem | Storefront | Admin | API |
|-------|-----------|-------|-----|
| **31 Mayıs** (deployment) | `/sadoksan/` | `/sadoksan-admin/` | `/sadoksan-api/` |
| **Şimdi** (CLAUDE.md) | `sadoksan.smartinnventory.com` | `.../sadoksan-panel/` | `.../api/` |

> ⚠️ **deployment-31mayis2026.md tamamen eskimiş.** Subpath → subdomain değişikliği yapılmış.

---

## 2. ÜRÜN KATALOĞU

| Metrik | urun-katalogu.md (06-10) | DB gerçek (bugün) |
|--------|--------------------------|-------------------|
| Ürün sayısı | 98 | **285** ✅ |
| Kategori | 9 | **7** (konsolide) |
| Görselli ürün | 6 | **192** |
| Görseller | Eski site linkleri | `/images/products/{SKU}.png` |

**DB'deki 7 kategori (285 ürün):**
Vitrifiye (117), Banyo Aksesuarları (43), Seramik (38), Silikon (28), Batarya (26), Banyo Dolabı (23), İnsört (10)

> ⚠️ **urun-katalogu.md güncel değil.** 285 ürünlü güncel JSON: `docs/urun-katalogu.json`

---

## 3. RAPORLAMA SİSTEMİ

### 3.1 Mevcut 8 Rapor (Kodda ✅)

| # | Endpoint | Açıklama |
|---|----------|----------|
| 1 | `GET /api/reports/plasiyer-sales` | Plasiyer bazlı satış |
| 2 | `GET /api/reports/order-pipeline` | Sipariş durum pipeline |
| 3 | `GET /api/reports/dealer-risk` | Bayi risk skoru |
| 4 | `GET /api/reports/critical-stock` | Kritik stok seviyesi |
| 5 | `GET /api/reports/slow-moving-stock` | Hareketsiz stok |
| 6 | `GET /api/reports/credit-usage` | Kredi limiti kullanım |
| 7 | `GET /api/reports/plasiyer-dashboard` | Plasiyer dashboard |
| 8 | `GET /api/reports/plasiyers` | Plasiyer listesi |

### 3.2 Netsis Sonrası Planlanan 5 Rapor

Vadesi geçmiş borçlar (aging), vadesi yaklaşan borçlar, cari hesap ekstresi, tahsilat raporu, kar marjı analizi.

### 3.3 Gelişmiş 4 Rapor (V2)

Mevsimsellik analizi, satış tahmini, bayi segmentasyonu (RFM), dinamik fiyatlandırma önerisi.

### 3.4 Admin Rapor Sayfası

- **Mevcut:** `apps/admin/app/pages/raporlar/index.vue` — KPI kartları + 8 rapor tipi + CSV export
- **Eksik:** Grafikler (V1), detaylı filtreleme

---

## 4. PLASIYER SİSTEMİ (raporlar_update.md)

### 4.1 Plasiyer Akışı

```
Plasiyer → Proforma oluştur → Admin onayı → PDF indirme → Bayiye iletme
```

### 4.2 Proforma Durum Makinesi

```
draft → pending_approval → approved → downloaded
                  ↘ rejected
```

### 4.3 Plasiyer Kısıtlamaları

- ✅ Ürün listesini görür
- ✅ Proforma oluşturur (ürün seç + adet + müşteri)
- ❌ Fiyat değiştiremez
- ❌ Proforma onaylayamaz (admin onaylar)
- ⚠️ SADECE onay sonrası PDF indirebilir

### 4.4 Plasiyer Storefront Sayfaları

`apps/storefront/app/pages/plasiyer/`:
- `index.vue` — Dashboard
- `proforma.vue` — Proforma oluştur
- `proformalarim.vue` — Proforma listem
- `raporlar.vue` — Raporlarım

### 4.5 Eksik

| Konu | Durum |
|------|-------|
| Plasiyer test hesabı | 🔴 **DB'de yok!** Oluşturulmalı |
| Watermark/screenshot engelleme | ❓ Kod kontrolü gerek |
| Plasiyer middleware | ✅ `middleware/plasiyer.ts` var |

---

## 5. GELİŞTİRİCİ UYGULAMA REHBERİ (20 Task)

### 5.1 Task Durumu (Kod ile doğrulandı)

| # | Task | Planlanan | Gerçek Durum |
|---|------|-----------|-------------|
| TASK-01 | DB Migration (StockMovement, PaymentLog, ImportJob) | P0 MVP | 🟡 StockMovement ✅, PaymentLog ❌, ImportJob ❌ |
| TASK-02 | StockService + Stok Hareket Logu | P0 MVP | 🟡 StockMovement model var, StockService? |
| TASK-03 | Admin Stok Sayfası İyileştirme | P0 MVP | 🟡 stok.vue var, drawer/modal var mı? |
| TASK-04 | Havale Bildirim Sistemi | P0 MVP | 🟡 BankTransfer tablosu var, UI? |
| TASK-05 | Admin Sipariş Detay Drawer | P0 MVP | ❓ |
| TASK-06 | CMS Sayfa Yönetimi | P0 MVP | ✅ CMS mevcut |
| TASK-07 | SEO Yönlendirme | P0 MVP | ❌ Yok |
| TASK-08 | Checkout Sayfası | P0 MVP | ❓ |
| TASK-09 | Admin Kullanıcı Yönetimi | P0 MVP | ❌ Yok |
| TASK-10 | Dashboard İyileştirme | P1 MVP | 🟡 Temel kartlar var |
| TASK-11 | Ürün Formu Sekmelendirme | P1 MVP | ❓ |
| TASK-12 | Excel Import Wizard | P1 MVP | ❌ (temel import var) |
| TASK-13 | Varyant Grid | P1 MVP | ❌ |
| TASK-14 | Görsel Optimizasyonu | P1 MVP | ❓ WebP? |
| TASK-15 | E-Posta Bildirimleri | P1 MVP | 🟡 Mailer console'a yazıyor |
| TASK-16 | Kupon Admin CRUD | P2 V1 | ❌ |
| TASK-17 | Online Ödeme | P2 V1 | 🔴 Mock only |
| TASK-18 | Dinamik Filtre | P2 V1 | ❌ |
| TASK-19 | İade Yönetimi | P2 V1 | ❌ |
| TASK-20 | SEO Migration Script | P0 MVP | ❌ |

> ⚠️ **Rehberdeki "mevcut" işaretleri 2026-05-25 itibariyle.** O günden bugüne çok şey değişti.

### 5.2 Admin Panel Sayfa Durumu (Rehber vs Gerçek)

| Rehberdeki Sayfa | Rehber Durum | Gerçek Dosya |
|-----------------|-------------|-------------|
| Dashboard | ✅ Var | `index.vue` |
| Ürünler | ✅ Var | `urunler.vue` |
| Siparişler | ✅ Var | `siparisler.vue` |
| Bayiler | ✅ Var | `bayiler.vue` |
| Stok | ✅ Var | `stok.vue` |
| İndirimler | ✅ Var | `indirimler.vue` |
| Kuponlar | ❌ Yok | ❌ Hala yok |
| Havale Bildirim | ❌ Yok | ❓ |
| CMS/İçerik | ❌ Yok | `icerik.vue` ✅ |
| SEO | ❌ Yok | ❌ Hala yok |
| Kullanıcılar | ❌ Yok | ❌ Hala yok |
| Denetim | ✅ Var | `denetim.vue` |
| Ayarlar | ✅ Var | `ayarlar.vue` |
| Raporlar | ✅ Var | `raporlar/index.vue` |

**Rehberde yok ama kodda var olan sayfalar:**
- `proforma.vue` — Admin proforma onay
- `popup.vue` — Kampanya popup
- `fiyatlandirma.vue` — Bölgesel fiyat
- `doviz.vue` — Döviz kurları
- `odemeler.vue` — Ödeme yönetimi
- `bildirimler.vue` — Bildirimler
- `crm.vue` — CRM (4 sekmeli)

### 5.3 Storefront Sayfa Durumu

Rehberde 16 sayfa planlanmış. Şu an çalışan ana sayfalar: ana sayfa, ürün listesi, ürün detay, kategori, sepet, giriş/kayıt, hesabım, bayi paneli, plasiyer paneli, kurumsal sayfalar.

---

## 6. GERÇEKLEŞEN İŞLER (Kronolojik)

| Tarih | Olay | Commit |
|-------|------|--------|
| 2026-05-31 | İlk deployment, 19 migration, 48 kategori, subpath routing | — |
| 2026-06-02/03 | Admin UI revizyonu (~15 commit), global prefix fix | — |
| 2026-06-05 | UI fixes, kategori menü, CMS sayfaları (5 commit) | — |
| 2026-06-08 | Netsis, Plasiyer, Rapor, Proforma onay (7 commit) | `af4789a`... |
| 2026-06-09 | 5 bug fix + kredi limiti + ürün filtre + MD toparlama | `d6f9df5` |
| 2026-06-10 | Prod hardening + 192 görsel + Prisma 7.8 | `75f2d6d` |
| 2026-06-11 | Bayi login fix (kullanıcı adı + email) | `84f26f5`? |

---

## 7. ÇELİŞKİ TESPİTLERİ (Blok 2)

| # | İddia | Gerçek | Sonuç |
|---|-------|--------|-------|
| 1 | Sistem tasarımı 9 rol (Mayıs) | Kodda 4 rol var | Tasarım **güncellenmeli** |
| 2 | StockMovement "yok, eklenecek" (MVP planı Mayıs) | Model + tablo mevcut | ✅ **Yapılmış**, plan eskimiş |
| 3 | 98 ürün (katalog MD) | 285 ürün (DB) | Katalog MD **eskimiş** |
| 4 | Subpath URL'ler (deployment MD) | Subdomain (CLAUDE.md) | Deployment MD **eskimiş** |
| 5 | CUSTOMER rolü tasarımda var | Kodda kaldırılmış | B2B-only refactor yapılmış |
| 6 | "TASK-01 migration yapılacak" | StockMovement ✅, PaymentLog ❌ | **Kısmen** yapılmış |
| 7 | "TASK-04 Havale yok" | BankTransfer tablosu var | 🟡 Backend var, UI kontrol edilmeli |
| 8 | "20 task" rehberi (Mayıs) | 10 task kısmen/eksik | Rehber güncellenmeli |

---

## 8. ÖNEMLİ EKSİK TASK'LER (Rehberden, Hala Açık)

| # | Task | Neden Kritik |
|---|------|-------------|
| TASK-04 | Havale bildirim UI | Müşteri ödeme yapacak |
| TASK-05 | Sipariş detay drawer | Admin operasyon için |
| TASK-07 | SEO 301 yönlendirme | Migration/go-live için |
| TASK-08 | Checkout sayfası | Müşteri sipariş akışı |
| TASK-09 | Admin kullanıcı yönetimi | Çoklu admin için |
| TASK-20 | SEO migration script | Eski URL'leri taşıma |
