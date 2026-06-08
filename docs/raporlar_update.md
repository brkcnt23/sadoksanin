# Sadoksan ERP — Genel Güncelleme & Plasiyer + Rapor Planı

**Tarih:** 2026-06-08
**Son Session:** Netsis NetOpenX REST dökümantasyonu incelendi, modül gerçek API'ye göre yeniden yazıldı.

---

## Vizyon: Sadoksan = KEMİK

```
                    ┌─────────────────────────┐
                    │      SADOKSAN (KEMİK)     │
                    │   Nuxt + NestJS + PG      │
                    └──────┬──────┬──────┬──────┘
                           │      │      │
          ┌────────────────┼──────┼──────┼────────────────┐
          ▼                ▼      ▼      ▼                ▼
    ┌──────────┐   ┌──────────┐  ┌──────────┐   ┌──────────┐
    │  Netsis   │   │ Plasiyer │  │  Bayiler  │   │  Admin/  │
    │  (ERP)    │   │  (Saha)  │  │ (Müşteri) │   │  Müdür   │
    └──────────┘   └──────────┘  └──────────┘   └──────────┘
```

---

## 1. PLASIYER ROLÜ

### 1.1 Tanım

Plasiyer = Satış temsilcisi. Bayileri ziyaret eder, proforma hazırlar, sipariş alır.

### 1.2 Yetkiler

| Yetki | Var mı? |
|-------|---------|
| Ürün listesini görme | ✅ |
| Proforma oluşturma | ✅ (ürün seç + adet + müşteri bilgisi) |
| Fiyat değiştirme | ❌ (admin belirler) |
| Proforma onayı | ❌ (admin onaylar) |
| Proforma indirme | ⚠️ SADECE admin onayından sonra |
| Ekran görüntüsü | ❌ Watermark + CSS engelleme |
| Kendi raporlarını görme | ✅ |
| Diğer plasiyerlerin verisi | ❌ |

### 1.3 Proforma Durum Makinesi

```
draft ──► pending_approval ──► approved ──► downloaded
                │                  │
                └──► rejected      └──► expired (opsiyonel)
```

### 1.4 Proforma Kısıtlamaları

Plasiyer proforma oluştururken:
- ✅ **Yapabilir:** Ürün arama/seçme, adet girme, müşteri adı/adres/telefon yazma
- ❌ **Yapamaz:** Birim fiyat değiştirme, iskonto uygulama, manuel tutar girme
- ⚠️ **Onay sonrası:** PDF indirme aktif olur, watermark kalkar

---

## 2. RAPORLAMA SİSTEMİ

### 2.1 HEMEN Yapılacak 7 Rapor (Netsis'siz)

| # | Rapor | Endpoint | Veri Kaynağı |
|---|-------|----------|-------------|
| 1 | Plasiyer bazlı satış | `GET /api/reports/plasiyer-sales` | Order + User (PLASIYER) |
| 2 | Sipariş durum pipeline | `GET /api/reports/order-pipeline` | Order |
| 3 | Bayi risk skoru | `GET /api/reports/dealer-risk` | Dealer + Order |
| 4 | Kritik stok seviyesi | `GET /api/reports/critical-stock` | Product |
| 5 | Hareketsiz stok | `GET /api/reports/slow-moving-stock` | Product + OrderLine |
| 6 | Kredi limiti kullanım | `GET /api/reports/credit-usage` | Dealer |
| 7 | Plasiyer performans dashboard | `GET /api/reports/plasiyer-dashboard` | Order + Proforma |

### 2.2 Netsis Sonrası 5 Rapor

| # | Rapor | Netsis Verisi |
|---|-------|-------------|
| 8 | Vadesi geçmiş borçlar (Aging 30/60/90+) | ARPs.BORCLANAN_TUTAR |
| 9 | Vadesi yaklaşan borçlar (7/15/30 gün) | ARPs + vade |
| 10 | Cari hesap ekstresi | ARPs + ItemSlips + Bank |
| 11 | Tahsilat raporu | BankAccountTransaction |
| 12 | Kar marjı analizi | Items + OrderLine |

### 2.3 Gelişmiş Analitik 4 Rapor

| # | Rapor | Gereksinim |
|---|-------|-----------|
| 13 | Mevsimsellik analizi | 1+ yıl veri |
| 14 | Satış tahmini (Forecast) | ML/istatistik |
| 15 | Bayi segmentasyonu (RFM) | Recency/Frequency/Monetary |
| 16 | Dinamik fiyatlandırma önerisi | Stok + talep + kur |

---

## 3. UYGULAMA PLANI

### Faz 0: Plasiyer Altyapısı (1 gün)
- [ ] `UserRole` enum'a PLASIYER ekle
- [ ] Migration oluştur + deploy
- [ ] Admin kullanıcı yönetimine plasiyer seçeneği ekle
- [ ] Seed script'e plasiyer test kullanıcısı ekle

### Faz 1: Proforma Onay Akışı (2-3 gün)
- [ ] Proforma model güncelleme (yeni alanlar)
- [ ] Backend: submit/approve/reject endpoint'leri
- [ ] Backend: Plasiyer fiyat kısıtlamaları
- [ ] Admin: Onay bekleyenler sekmesi
- [ ] Admin: Onayla/reddet butonları
- [ ] Storefront: Plasiyer proforma sayfası
- [ ] Watermark + screenshot engelleme

### Faz 2: Plasiyer Yönetimi (1 gün)
- [ ] Backend: Plasiyer listesi/detay endpoint'leri
- [ ] Admin: Plasiyerler sayfası
- [ ] Kota tanımlama

### Faz 3: Raporlama (4-5 gün)
- [ ] Rapor motoru (reports module)
- [ ] 7 rapor endpoint'i
- [ ] CSV/Excel export
- [ ] Admin rapor sayfaları (satis, stok, finans, bayi, plasiyer)

### Faz 4: Plasiyer Storefront (2-3 gün)
- [ ] Plasiyer dashboard
- [ ] Proforma oluşturma sayfası
- [ ] Proformalarım sayfası
- [ ] Raporlarım sayfası

### Faz 3B: Netsis Sonrası Raporlar (3-4 gün, Netsis API gelince)
### Faz 3C: Gelişmiş Analitik (5-7 gün, yeterli veri birikince)

---

## 4. TEST HESAPLARI

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@admin.com | asd123 |
| Bayi | bayi@test.com | asd123 |
| **Plasiyer** | plasiyer@test.com | asd123 |

---

## 5. TEKNİK NOTLAR

1. **Mevcut component'ler tekrar kullanılacak:** StatCard, StatusBadge, ConfirmModal, LoadingState, FilterBar, Pagination
2. **Plasiyer kısıtlamaları backend'de zorlanır** — frontend disable + backend validate
3. **Tüm proforma durum değişiklikleri AuditLog'a yazılır**
4. **Screenshot engelleme** CSS `user-select: none` + watermark overlay (caydırıcı)
5. **Rapor export** xlsx + CSV, mevcut Python Flask PDF için de kullanılabilir

---

## 6. PLASIYER PROFORMA AKIŞI (Detay)

```
PLASIYER                          ADMIN
─────────                          ─────
1. /plasiyer/proforma'ya girer
2. Ürün arar, seçer
3. Adet girer (fiyat otomatik)
4. Müşteri bilgisi girer
5. "Onaya Gönder"e basar
   → status: pending_approval
   → watermark: "ONAY BEKLİYOR"
                                   6. Admin panelde "Onay Bekleyenler"
                                      sekmesinde görür
                                   7. Proforma detayını inceler
                                   8a. Onaylar → status: approved
                                      → watermark kalkar
                                   8b. Reddeder → status: rejected
                                      → sebep yazar
9. Bildirim alır (status değişimi)
10a. Onaylanmışsa:
    → PDF'i indirebilir
    → Yazdırabilir
10b. Reddedilmişse:
    → Red sebebini görür
    → Düzelterek tekrar gönderebilir
```
