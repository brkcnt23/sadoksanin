# Sadoksan ERP — Raporlama Stratejisi

**Tarih:** 2026-06-08
**Amaç:** Sadoksan (kendi verisi) + Netsis (ERP verisi) birleşimiyle sunulabilecek tüm rapor ve analizleri belirlemek.

---

## Veri Kaynaklarımız

### Sadoksan (Kendi Sistemimiz)

| Veri | Kaynak Tablo/Modül | Açıklama |
|------|-------------------|----------|
| Siparişler | `Order`, `OrderLine` | Tam sipariş yaşam döngüsü |
| Bayiler | `Dealer` | cariNo, bakiye, limit, risk, bölge |
| Ürünler | `Product` | fiyat, stok, kategori, marka |
| Proformalar | `Proforma`, `ProformaItem` | Bayi proforma talepleri |
| Kullanıcılar | `User` | Roller: ADMIN, DEALER, PLASIYER |
| Stok hareketleri | `StockMovement` | Giriş/çıkış/rezerasyon |
| Denetim | `AuditLog` | Tüm işlem kayıtları |
| Ödemeler | `Order.paymentStatus` | Havale, kart, açık hesap |
| Döviz | `ExchangeRate` | Kur takibi |

### Netsis (Entegrasyon Sonrası)

| Veri | NetOpenX REST | Açıklama |
|------|-------------|----------|
| Gerçek stok | `GET /api/v2/Items` | Anlık stok miktarı |
| Cari bakiye | `GET /api/v2/ARPs` | Güncel borç/alacak |
| Faturalar | `GET /api/v2/ItemSlips` | Kesilen faturalar |
| Tahsilatlar | `BankAccountTransaction` | Gelen ödemeler |
| Döviz kurları | `GET /api/v2/ExRates` | Güncel TCMB kurları |
| Stok sayım | `GET /api/v2/ItemCounting` | Sayım fişleri |

---

## 📊 Rapor Kataloğu

### 1. SATIŞ RAPORLARI

#### 1.1 Plasiyer Bazlı Satış Raporu
```
Periyot: Günlük / Haftalık / Aylık / 3 Aylık / Yıllık
Veri: Sadoksan (Order)
```
| Kolon | Kaynak |
|-------|--------|
| Plasiyer adı | User.name |
| Toplam sipariş sayısı | Order COUNT |
| Toplam ciro (TRY) | OrderLine.amount SUM |
| Ortalama sipariş tutarı | Ciro / Sipariş sayısı |
| Onaylanan proforma sayısı | Proforma COUNT |
| Proforma → sipariş dönüşüm oranı | Sipariş / Proforma % |
| Hedef/Kota | Manuel tanım |
| Kota gerçekleşme % | Gerçekleşen / Kota |

**Filtreler:** Plasiyer, tarih aralığı, bayi, ürün grubu, bölge

#### 1.2 Ürün Bazlı Satış Raporu
| Kolon | Kaynak |
|-------|--------|
| Ürün kodu/adı | Product |
| Kategori/Marka | Product.category / brand |
| Satılan miktar | OrderLine.quantity SUM |
| Toplam ciro | OrderLine.total SUM |
| Ortalama birim fiyat | Ciro / Miktar |
| Stok devir hızı | Satış / Ortalama stok |
| Kar marjı | (Satış fiyatı - Maliyet) / Satış fiyatı |

#### 1.3 Kategori & Marka Bazlı Satış
- Kategori ciroları (pasta grafik)
- Marka performans karşılaştırması
- Büyüme trendleri (aylık %)

#### 1.4 Bölge/İl Bazlı Satış
```
Veri: Sadoksan (Dealer.region/city) + Siparişler
```
- Bölge haritası üzerinde ciro dağılımı
- Lojistik maliyet analizi (bölge bazlı surcharge etkisi)
- Bölge penetrasyon oranı (bölgedeki bayi / toplam bayi)

#### 1.5 Dönemsel Karşılaştırmalı Satış
- Bu ay vs geçen ay
- Bu yıl vs geçen yıl
- Mevsimsellik analizi (özellikle inşaat sektörü için kritik)

#### 1.6 Sipariş Durum Dağılımı
```
Pipeline: PENDING → APPROVED → PREPARING → SHIPPED → COMPLETED
```
- Her aşamadaki sipariş sayısı ve tutarı
- Ortalama aşama geçiş süresi (SLA takibi)
- İptal oranı ve nedenleri

---

### 2. FİNANSAL RAPORLAR

#### 2.1 Vadesi Geçmiş Borçlar (Aging)
```
Veri: Netsis (ARPs) + Sadoksan (Dealer)
```
| Kolon | Kaynak |
|-------|--------|
| Bayi adı | Dealer.company |
| Cari kodu | Dealer.cariNo |
| Toplam borç | Netsis ARPs.BORCLANAN_TUTAR |
| Vadesi geçen (0-30 gün) | Hesaplama |
| Vadesi geçen (31-60 gün) | Hesaplama |
| Vadesi geçen (61-90 gün) | Hesaplama |
| Vadesi geçen (90+ gün) | ⚠️ Kritik |
| Son ödeme tarihi | Netsis |
| Risk skoru | Dealer (kendi hesapladığımız) |

**Aksiyon:** 90+ gün → otomatik uyarı, kredi limiti dondurma opsiyonu

#### 2.2 Vadesi Yaklaşan Borçlar
```
Yaklaşan vade: 7 / 15 / 30 gün içinde
```
- Erken uyarı sistemi
- Otomatik hatırlatma emaili (SMTP gelince)
- Nakit akışı tahmini

#### 2.3 Cari Hesap Ekstresi
```
Veri: Netsis (ARPs + ItemSlips + BankAccountTransaction)
```
- Bayi seç → tarih aralığı
- Borç/Alacak hareketleri listesi
- Açılış bakiyesi → hareketler → kapanış bakiyesi
- PDF/Excel export
- CSV döküm butonu

#### 2.4 Tahsilat Raporu
```
Veri: Netsis (BankAccountTransaction) + Sadoksan (Order.paymentStatus)
```
- Günlük/haftalık/aylık tahsilat toplamı
- Ödeme tipi dağılımı (havale/kart/açık hesap)
- Tahsilat hedefi vs gerçekleşen
- Plasiyer bazlı tahsilat performansı

#### 2.5 Kar Marjı Raporu
```
Veri: Sadoksan (Product.basePrice) + Netsis (maliyet bilgisi varsa)
```
- Ürün bazlı kar marjı
- Kategori bazlı kar marjı
- Döviz kuru etkisi (ithal ürünler)

#### 2.6 Kredi Limiti Kullanım Raporu
```
Veri: Sadoksan (Dealer.creditLimit, Dealer.cariBalance)
```
- Her bayinin kredi limitinin ne kadarını kullandığı
- %80+ kullanım → sarı uyarı
- %95+ kullanım → kırmızı uyarı (yeni sipariş engellenebilir)

---

### 3. STOK RAPORLARI

#### 3.1 Hareketsiz Stok Raporu
```
Veri: Netsis (Items) + Sadoksan (OrderLine)
```
- Son 30/60/90/180 günde hiç satılmamış ürünler
- Stokta kalan miktar ve tutar
- Hareketsizlik süresi
- **Aksiyon önerisi:** İndirim, kampanya, iade

#### 3.2 Kritik Stok Seviyesi
```
Veri: Sadoksan (Product.minimumStock, Product.middleStock)
```
- minimumStock altına düşen → 🔴 Kritik
- middleStock altına düşen → 🟡 Uyarı
- Otomatik sipariş önerisi (güvenli stok hesaplama)

#### 3.3 Stok Devir Hızı
```
Formül: Satılan miktar / Ortalama stok
```
- Yüksek devir → iyi performans
- Düşük devir → stokta para bağlı
- Kategori/Marka bazlı karşılaştırma

#### 3.4 Stok Değerleme Raporu
- Toplam stok tutarı (TRY)
- Döviz bazlı stok tutarı
- Stok yaşlandırma (raf ömrü)

---

### 4. PLASİYER RAPORLARI

#### 4.1 Plasiyer Performans Dashboard'u
```
Her plasiyer kendi panosunda görür, admin tümünü görür.
```
| Metrik | Açıklama |
|--------|----------|
| Toplam ciro | Onaylanan siparişlerin toplamı |
| Sipariş sayısı | Bu ay / geçen ay |
| Proforma → sipariş dönüşüm | % |
| Ortalama sipariş tutarı | Ciro / Sipariş |
| En çok sattığı ürünler | Top 10 |
| En çok işlem yaptığı bayiler | Top 10 |
| Kota gerçekleşme | % |

#### 4.2 Plasiyer Kota Takibi
```
Admin tarafından tanımlanır:
- Aylık ciro hedefi
- Aylık sipariş hedefi
- Ürün grubu hedefi
```
- Gerçek zamanlı kota durumu (ilerleme çubuğu)
- Dönemsel karşılaştırma
- Prim hesaplama altyapısı

#### 4.3 Plasiyer Ziyaret/Temas Raporu
```
İleride eklenecek: Plasiyer müşteri ziyaret kaydı
```
- Ziyaret edilen bayi sayısı
- Ziyaret başına sipariş
- Ziyaret edilmeyen bayiler (ihmal takibi)

---

### 5. BAYİ / MÜŞTERİ RAPORLARI

#### 5.1 Bayi Risk Skoru (Mevcut + Geliştirme)
```
Şu an var olan risk skoru zenginleştirilebilir:
```
- Ödeme geçmişi (Netsis)
- Vadesi geçmiş borç tutarı (Netsis)
- Sipariş sıklığı (Sadoksan)
- İptal/İade oranı (Sadoksan)
- Kredi limiti kullanım yüzdesi
- Son işlem tarihi

#### 5.2 Bayi Bazlı Ciro Sıralaması
- En çok ciro getiren bayiler (ilk 20)
- En az işlem yapan bayiler (aksiyon: plasiyer ziyareti)
- Yeni kayıt olup hiç sipariş vermeyen bayiler

#### 5.3 Bayi Satın Alma Geçmişi
- Bayiye özel en çok aldığı ürünler
- Mevsimsel satın alma pattern'i
- Öneri sistemi: "Bu ürünü de alabilir"

---

### 6. OPERASYONEL RAPORLAR

#### 6.1 Proforma Raporları
- Plasiyer bazlı proforma sayısı
- Proforma → sipariş dönüşüm oranı
- Reddedilen proforma nedenleri
- Ortalama onay süresi

#### 6.2 Sevkiyat Performansı
- Sipariş → Sevkiyat süresi (SLA)
- Kargo firması bazlı performans
- Geciken sevkiyatlar

#### 6.3 İade Analizi
- İade oranı (ürün/bayi bazlı)
- İade nedenleri kategorizasyonu
- En çok iade edilen ürünler

---

## 📈 Rapor Önceliklendirme

### Faz 1: HEMEN YAPILABİLECEKLER (Elimizdeki veriyle)

| # | Rapor | Veri Kaynağı | Tahmini Süre |
|---|-------|-------------|-------------|
| 1 | Plasiyer bazlı satış | Sadoksan | 2-3 gün |
| 2 | Sipariş durum pipeline | Sadoksan | 1 gün |
| 3 | Bayi risk skoru (zenginleştirilmiş) | Sadoksan | 1 gün |
| 4 | Stok kritik seviye | Sadoksan | 1 gün |
| 5 | Hareketsiz stok | Sadoksan | 1 gün |
| 6 | Kredi limiti kullanım | Sadoksan | 1 gün |
| 7 | Plasiyer performans dashboard | Sadoksan | 2 gün |

### Faz 2: NETSIS SONRASI

| # | Rapor | Veri Kaynağı | Tahmini Süre |
|---|-------|-------------|-------------|
| 8 | Vadesi geçmiş borçlar (aging) | Netsis | 2 gün |
| 9 | Vadesi yaklaşan borçlar | Netsis | 1 gün |
| 10 | Cari hesap ekstresi | Netsis | 2 gün |
| 11 | Tahsilat raporu | Netsis | 2 gün |
| 12 | Kar marjı analizi | Netsis + Sadoksan | 2 gün |

### Faz 3: GELİŞMİŞ ANALİTİK

| # | Rapor | Açıklama |
|---|-------|----------|
| 13 | Mevsimsellik analizi | En az 1 yıllık veri gerekir |
| 14 | Satış tahmini (forecast) | ML/AI desteği |
| 15 | Bayi segmentasyonu (RFM) | Recency, Frequency, Monetary |
| 16 | Dinamik fiyatlandırma önerisi | Stok + talep + kur |

---

## 🛠️ Teknik Yaklaşım

### Backend: Rapor Motoru
```
apps/api/src/modules/reports/
├── reports.module.ts
├── reports.controller.ts      # GET /api/reports/*
├── reports.service.ts         # Sorgu + hesaplama
├── dto/
│   ├── sales-report.dto.ts
│   ├── dealer-report.dto.ts
│   ├── stock-report.dto.ts
│   └── plasiyer-report.dto.ts
└── utils/
    ├── date-range.helper.ts   # Tarih aralığı parser
    └── export.helper.ts       # Excel/CSV/PDF export
```

### Frontend: Admin Panel
```
apps/admin/app/pages/
├── raporlar/
│   ├── index.vue              # Rapor ana sayfası (kategori grid)
│   ├── satis.vue              # Satış raporları
│   ├── plasiyer.vue           # Plasiyer raporları
│   ├── finans.vue             # Finansal raporlar
│   ├── stok.vue               # Stok raporları
│   └── bayi.vue               # Bayi raporları
```

### Export Formatları
- **Excel (.xlsx):** `exceljs` veya `xlsx` paketi ile
- **PDF:** Proforma için zaten var olan Python Flask servisi kullanılabilir
- **CSV:** Basit, hızlı dökümler için

---

## 📌 Notlar

1. **Plasiyer rolü** bu raporların ana tüketicisi olacak — kendi performansını ve bağlı olduğu bayileri görecek.
2. **Admin/Müdür** tüm raporları görecek, plasiyer sadece kendi verisini.
3. **Bayi** kendi cari ekstresi ve sipariş geçmişini görebilecek (zaten kısmen var).
4. Raporların çoğu **Faz 1'de** elimizdeki veriyle yapılabilir — Netsis gelmeden beklemeye gerek yok.
5. **Export** her raporda CSV ve Excel olarak bulunmalı — müdürün "aralıklı kota çekme" talebi aslında periyodik export.
