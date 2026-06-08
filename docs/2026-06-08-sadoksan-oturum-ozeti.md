# Sadoksan ERP — 8 Haziran 2026 Oturum Özeti

**Tarih:** 2026-06-08
**Sunucu:** motto-server (45.43.152.52)
**Hedef:** Netsis entegrasyonu + Plasiyer rolü + Proforma onay akışı + Raporlama sistemi

---

## 🎯 Bugün Tamamlananlar

### 1. Netsis NetOpenX REST Entegrasyonu (Temel)

- LOGO Polaris dökümantasyonu incelendi
- **NetOpenX REST ≠ NetOpenX COM DLL** farkı anlaşıldı
- REST API: OAuth2 token, `/api/v2/Items`, `/api/v2/ARPs`, `/api/v2/ItemSlips` vb.
- Windows servis (port 7070), Linux'tan HTTP ile bağlanacak
- `netsis.types.ts`: 11 interface (Items, ARPs, ItemSlips, ExRates, token...)
- `netsis.service.ts`: Token yönetimi + 4 sync metodu + sayfalı veri çekme
- `netsis.controller.ts`: 8 endpoint
- `netsis.scheduler.ts`: Cron (stok 30dk, ürün 1sa, cari 2sa, kur 6sa)
- **API bilgisi gelene kadar tüm sync'ler sessizce atlanıyor**

### 2. Plasiyer Rolü (Faz 0)

- `UserRole` enum'a `PLASIYER` eklendi
- Auth servis: `adminCreateUser()`, `listUsers()` metodları
- Yeni endpoint'ler: `POST /api/auth/admin-create-user`, `GET /api/auth/users`
- Test hesabı: **plasiyer@test.com / asd123**

### 3. Proforma Onay Akışı (Faz 1)

**Durum makinesi:** `draft → pending_approval → approved → downloaded`
```
                  pending_approval → rejected
```

**Backend (7 yeni endpoint):**
| Endpoint | Rol | Açıklama |
|----------|-----|----------|
| `PATCH /api/proforma/:id/submit` | PLASIYER | Onaya gönder |
| `PATCH /api/proforma/:id/approve` | ADMIN | Onayla |
| `PATCH /api/proforma/:id/reject` | ADMIN | Reddet (sebep zorunlu) |
| `GET /api/proforma/pending` | ADMIN | Onay bekleyenler |
| `GET /api/proforma/my` | PLASIYER | Kendi proformalarım |
| `GET /api/proforma/:id/download` | ALL | Rol kontrollü indirme |

**Plasiyer kısıtlamaları:**
- ✅ Ürün seçme, adet girme, müşteri bilgisi yazma
- ❌ Fiyat değiştirme (Product.basePrice'tan zorlanır)
- ⚠️ Sadece admin onayından sonra PDF indirebilir

**Admin panel:** Onay Bekleyen sekmesi, Onayla/Reddet butonları, Red sebebi modal'ı, Plasiyer/Admin badge'i

### 4. Raporlama Sistemi (Faz 2-3A)

**Rapor motoru:** `apps/api/src/modules/reports/`

| # | Endpoint | Açıklama |
|---|----------|----------|
| 1 | `GET /api/reports/plasiyer-sales` | Plasiyer bazlı satış |
| 2 | `GET /api/reports/order-pipeline` | Sipariş durum dağılımı |
| 3 | `GET /api/reports/dealer-risk` | Bayi risk skoru |
| 4 | `GET /api/reports/critical-stock` | Kritik stok seviyesi |
| 5 | `GET /api/reports/slow-moving-stock` | Hareketsiz stok |
| 6 | `GET /api/reports/credit-usage` | Kredi limiti kullanımı |
| 7 | `GET /api/reports/plasiyer-dashboard` | Plasiyer performans KPIları |
| 8 | `GET /api/reports/plasiyers` | Plasiyer listesi + istatistik |

**Admin rapor sayfası:** `/raporlar` — KPI kartları, 8 rapor tipi, tarih filtresi, CSV export

### 5. Plasiyer Storefront (Faz 4)

Yeni sayfalar: `apps/storefront/app/pages/plasiyer/`

| Sayfa | Route | Açıklama |
|-------|-------|----------|
| Dashboard | `/plasiyer` | KPI kartları, hızlı işlemler, son proformalar |
| Proforma | `/plasiyer/proforma` | Ürün arama, müşteri formu, onaya gönder |
| Proformalarım | `/plasiyer/proformalarim` | Filtreli liste, indirme (onaylı ise) |
| Raporlarım | `/plasiyer/raporlar` | Satış raporları, performans dashboard |

---

## 📊 16 Rapor Planı

### Faz 3A — HEMEN (7 rapor, backend ✅, admin UI kısmen)
1. ✅ Plasiyer bazlı satış
2. ✅ Sipariş durum pipeline
3. ✅ Bayi risk skoru
4. ✅ Kritik stok seviyesi
5. ✅ Hareketsiz stok
6. ✅ Kredi limiti kullanım
7. ✅ Plasiyer performans dashboard

### Faz 3B — Netsis Sonrası (5 rapor)
8. Vadesi geçmiş borçlar (Aging)
9. Vadesi yaklaşan borçlar
10. Cari hesap ekstresi
11. Tahsilat raporu
12. Kar marjı analizi

### Faz 3C — Gelişmiş Analitik (4 rapor)
13. Mevsimsellik analizi
14. Satış tahmini
15. Bayi segmentasyonu (RFM)
16. Dinamik fiyatlandırma önerisi

---

## 🔑 Test Hesapları

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@admin.com | asd123 |
| Bayi | bayi@test.com | asd123 |
| Plasiyer | plasiyer@test.com | asd123 |

---

## 🐳 Container Durumu

| Container | Port | Durum |
|-----------|------|-------|
| sadoksan-storefront-prod | 3011→3000 | ⚠️ Build bekliyor |
| sadoksan-admin-prod | 3012→3002 | ✅ Güncel |
| sadoksan-api-prod | 3010→3001 | ✅ Güncel |
| sadoksan-postgres-prod | 5432 | ✅ |
| sadoksan-redis-prod | 6379 | ✅ |
| sadoksan-python-prod | 3013→5000 | ✅ |

---

## 📝 Bugünkü Commit'ler

```
dfd5346 feat: Rapor motoru — 8 endpoint (Faz 2-3A)
d49905c feat: Proforma onay akışı — admin panel UI + generatedByRole
a6fd651 feat: Proforma onay akışı (Faz 1)
af4789a feat: PLASIYER rolü eklendi
67b4cec feat: Netsis NetOpenX REST entegrasyonu
```

---

## ⏳ Kaldığımız Yer — Yapılacaklar

### 🔴 Hemen
- [ ] Storefront build (plasiyer sayfaları) — `docker compose build storefront`
- [ ] Admin rapor sayfaları build testi
- [ ] Storefront header'a plasiyer menüsü ekleme
- [ ] Plasiyer middleware (sadece plasiyer erişebilsin)

### 🟡 Yakın
- [ ] Netsis API bilgileri gelince `.env`'ye gir + test
- [ ] Proforma watermark CSS (caydırıcı önlem)
- [ ] Plasiyer kota tanımlama (admin panel)
- [ ] AuditLog'a proforma durum değişiklikleri

### 🟢 Netsis Sonrası
- [ ] Faz 3B: 5 finansal rapor
- [ ] Netsis sync testleri (gerçek veri ile)
- [ ] ideaSoft'tan 4000 ürün import

---

## 📂 Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `docs/raporlar.md` | 16 rapor kataloğu detaylı |
| `docs/raporlar_update.md` | Plasiyer + rapor genel planı |
| `docs/2026-06-08-sadoksan-oturum-ozeti.md` | Bu dosya |
| `apps/api/src/modules/netsis/netsis.types.ts` | NetOpenX REST tipleri |
| `apps/api/src/modules/netsis/netsis.service.ts` | Netsis servis (token + sync) |
| `apps/api/src/modules/reports/reports.service.ts` | Rapor motoru (8 metod) |
| `apps/api/src/modules/proforma/proforma.service.ts` | Proforma + onay akışı |
| `apps/admin/app/pages/raporlar/index.vue` | Admin rapor dashboard |
| `apps/admin/app/pages/proforma.vue` | Admin proforma (onay tab'lı) |
| `apps/storefront/app/pages/plasiyer/` | Plasiyer paneli (4 sayfa) |
