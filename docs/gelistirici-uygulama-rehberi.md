# Sadöksan İnşaat — Geliştirici Uygulama Rehberi

**Versiyon:** 1.0 | **Tarih:** 2026-05-25 | **Referans:** sadoksan-sistem-tasarimi.md

---

## Mevcut Durum Özeti

| Katman | Durum | Detay |
|--------|-------|-------|
| **API** | %70 hazır | 16 modül, 17 controller, ~90 endpoint |
| **Storefront** | %65 hazır | 24 sayfa, temel akışlar çalışıyor |
| **Admin** | %55 hazır | 16 sayfa, CRUD'lar var ama eksikler mevcut |
| **Veritabanı** | %70 hazır | 19 model, temel ilişkiler kurulu |

**Bu rehberin amacı:** Eksikleri ve iyileştirmeleri görev bazında çıkarıp MVP'yi hızla tamamlamak.

---

# 1. Admin Panel Ekran Listesi

## 1.1 Dashboard (`/sadoksan-panel`)

| Konu | Detay |
|------|-------|
| **Route** | `/` |
| **Kim erişir** | SUPER_ADMIN, ADMIN, SALES_STAFF, WAREHOUSE_STAFF (kısıtlı), ACCOUNTING (kısıtlı) |
| **Amaç** | Günlük operasyon özeti |
| **Mevcut** | ✅ Var, temel kartlar mevcut |
| **MVP'de yapılacak** | Kritik stok kartı, bayi başvuru kartı ekle |

**Kartlar (hepsi canlı sorgu):**

| Kart | Sorgu | Gösterilecek |
|------|-------|-------------|
| Bugünkü sipariş | `COUNT WHERE createdAt = today` | Sayı, dünle kıyas % |
| Bugünkü ciro | `SUM total WHERE createdAt = today` | TL, dünle kıyas % |
| Bekleyen sipariş | `COUNT WHERE status=PENDING_APPROVAL` | Sayı, badge kırmızıysa |
| Ödeme bekleyen | `COUNT WHERE paymentStatus=PENDING` | Sayı |
| Kritik stok | `COUNT WHERE displayStock <= minimumStock` | Sayı, tıkla listeye git |
| Bayi başvurusu | `COUNT WHERE status=PENDING` | Sayı, badge |

**Listeler:**
- Son 10 sipariş (sipariş no, müşteri, tutar, durum badge, hızlı onayla butonu)
- Kritik stok uyarıları (ürün adı, SKU, mevcut stok, min stok)

**MVP/V1/V2:** MVP ✅ (mevcut, eksik kartlar eklenmeli)

---

## 1.2 Ürün Listesi (`/sadoksan-panel/urunler`)

| Konu | Detay |
|------|-------|
| **Route** | `/urunler` |
| **Kim erişir** | SUPER_ADMIN, ADMIN |
| **Amaç** | Ürünleri listeleme, filtreleme, toplu işlem |
| **Mevcut** | ✅ Var |
| **MVP'de yapılacak** | Gelişmiş filtre, toplu işlem, satır içi hızlı düzenleme |

**Liste Kolonları:**
```
[☐] Görsel(40px) | SKU | Ürün Adı | Marka | Kategori | Birim | Satış Fiyatı | Bayi Fiyatı | Stok | Durum | Görünürlük
```

**Filtreler:**
- Arama (isim, SKU)
- Kategori dropdown
- Marka dropdown
- Stok durumu (var/yok/kritik)
- Görünürlük (hepsi/görünür/gizli/sadece bayi)
- Durum (aktif/pasif/taslak/stokta yok)
- Birim tipi

**Aksiyonlar:**
- Yeni ürün butonu → `/urunler/yeni`
- Toplu: fiyat güncelle, kategori değiştir, marka değiştir, görünürlük değiştir, pasife al
- Excel import butonu
- Excel export butonu
- Satır: düzenle, pasife al/sil (soft), görsel yönet

**MVP/V1/V2:** MVP ✅ (mevcut), iyileştirme kapsamında

---

## 1.3 Ürün Ekle/Düzenle (`/sadoksan-panel/urunler/yeni`, `/urunler/[id]/duzenle`)

| Konu | Detay |
|------|-------|
| **Route** | `/urunler/yeni`, `/urunler/[id]/duzenle` |
| **Kim erişir** | SUPER_ADMIN, ADMIN |
| **Amaç** | Ürün oluşturma ve düzenleme |
| **Mevcut** | ✅ Var |
| **MVP'de yapılacak** | Varyant yönetimi sekmesi, SEO sekmesi, dosya eki |

**Form — Sekmeli Yapı:**

**Sekme 1: Temel Bilgiler**
| Alan | Tip | Zorunlu | Validasyon |
|------|-----|---------|------------|
| Ürün Adı | text | ✅ | Min 3 karakter |
| SKU | text | ✅ | Benzersiz, büyük harf |
| Netsis Kodu | text | ❌ | |
| Barkod | text | ❌ | |
| Kategori | select (searchable) | ✅ | Kategori listesinden |
| Marka | select (searchable) | ✅ | Marka listesinden |
| Birim Tipi | select | ✅ | adet,m²,kg,torba,koli,paket,set,metre |
| Ağırlık (kg) | number | ❌ | > 0 |
| Ebat (EnxBoyxYükseklik) | text | ❌ | |
| Desi | number | ❌ | > 0 |

**Sekme 2: Fiyat & Stok**
| Alan | Tip | Zorunlu | Validasyon |
|------|-----|---------|------------|
| Satış Fiyatı (KDV dahil) | number | ✅ | > 0 |
| Bayi Fiyatı (opsiyonel) | number | ❌ | > 0, satış fiyatından küçük |
| KDV Oranı (%) | select | ✅ | %1, %10, %20 |
| Netsis Stok | number | ❌ | >= 0 |
| Minimum Stok | number | ✅ | >= 0 |
| Kritik Stok | number | ❌ | Minimum stoktan küçük |
| Min Sipariş Miktarı | number | ❌ | >= 1 |
| Max Sipariş Miktarı | number | ❌ | |

**Sekme 3: Görseller**
- Ana görsel: sürükle-bırak, max 5MB, WebP otomatik dönüşüm
- Galeri: çoklu sürükle-bırak, sıralama (drag), silme
- Her görsel için alt metni

**Sekme 4: Açıklama & Özellikler**
- Kısa açıklama: textarea, max 300 karakter
- Detaylı açıklama: rich text editor (bold, italic, list, image embed)
- Teknik özellikler: dinamik tablo (anahtar-değer ekle/çıkar)

**Sekme 5: Görünürlük & Durum**
| Alan | Tip | Zorunlu |
|------|-----|---------|
| Görünürlük | radio | ✅ (herkese açık / sadece bayi / gizli) |
| Durum | select | ✅ (aktif / pasif / taslak / stokta yok / yakında) |
| Sıralama | number | ❌ (küçük = üstte) |
| Öne Çıkan | checkbox | ❌ |
| Yeni Ürün | checkbox | ❌ |
| Çok Satan | checkbox | ❌ |

**Sekme 6: Dosya Ekleri**
- Teknik föy: PDF, max 10MB
- Katalog: PDF, max 10MB
- Kullanım kılavuzu: PDF, max 10MB

**Sekme 7: SEO**
| Alan | Tip | Zorunlu |
|------|-----|---------|
| SEO Başlığı | text | ❌ (boşsa ürün adı) |
| Meta Açıklama | textarea | ❌ (max 160 karakter) |
| URL Slug | text | ❌ (boşsa SKU'dan otomatik) |
| Canonical URL | text | ❌ |
| OG Görseli | image upload | ❌ |

**Sekme 8: Varyantlar (varsa)**
- Varyant tipi tanımla (örn: Ebat, Renk)
- Varyant değerlerini gir (örn: 60x120 Bej, 60x120 Gri)
- Her varyant için: SKU, fiyat (override), stok
- Toplu varyant oluşturma (grid: ebat x renk)

**MVP/V1/V2:** MVP ✅ (mevcut ürün formu), sekmeler ve varyant grid'i iyileştirilmeli

---

## 1.4 Kategoriler (`/sadoksan-panel/kategoriler`)

| Konu | Detay |
|------|-------|
| **Route** | Kategori yönetimi ürünler sayfası içinde sekme veya ayrı sayfa |
| **Mevcut** | ✅ Var (products controller içinde) |
| **Eksik** | Parent-child ilişkisi yok (düz liste), filtre özelliği yok |

**Liste Kolonları:** Ad | Slug | Üst Kategori | Ürün Sayısı | Görsel | Sıralama | Menüde | Aktif

**Form Alanları:**
- Ad (zorunlu, benzersiz)
- Slug (otomatik)
- Üst kategori (select, null = ana kategori) **[V1]**
- Açıklama
- Görsel
- Sıralama
- Menüde göster (checkbox)
- Ana sayfada göster (checkbox)
- Aktif/Pasif
- SEO başlığı, meta açıklama

**Aksiyonlar:** Yeni, düzenle, sil (içinde ürün varsa uyar), sıralama değiştir

**MVP/V1/V2:** MVP ✅ | V1'de parent-child ve kategori filtreleri

---

## 1.5 Markalar (`/sadoksan-panel/markalar`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var (products controller içinde) |
| **Eksik** | Yok, temel CRUD yeterli |

**Liste Kolonları:** Logo | Marka Adı | Slug | Ürün Sayısı | Sıralama | Aktif

**Form:** Ad (zorunlu), slug (otomatik), logo (upload), açıklama, aktif

**MVP/V1/V2:** MVP ✅

---

## 1.6 Tüm Siparişler (`/sadoksan-panel/siparisler`)

| Konu | Detay |
|------|-------|
| **Route** | `/siparisler` |
| **Kim erişir** | SUPER_ADMIN, ADMIN (tam), SALES_STAFF (görüntüleme), WAREHOUSE_STAFF (hazırlananlar), ACCOUNTING (ödeme) |
| **Mevcut** | ✅ Var |
| **Eksik** | Kargo takip no girişi, admin notu, toplu işlem |

**Liste Kolonları:**
```
Sipariş No | Tarih | Müşteri | Tip(B2C/B2B) | Tutar | Ödeme Durumu | Sipariş Durumu | Kargo | Aksiyon
```

**Filtreler:**
- Sipariş no ile arama
- Müşteri adı/e-postası
- Sipariş durumu (multi-select)
- Ödeme durumu (multi-select)
- Tarih aralığı
- Müşteri tipi (B2C/B2B)

**Aksiyonlar:**
- Satır tıklama → sipariş detay drawer'ı
- Durum badge'i tıklama → hızlı durum değiştir
- Export Excel

**MVP/V1/V2:** MVP ✅ (mevcut), filtre ve drawer iyileştirilmeli

---

## 1.7 Sipariş Detay Drawer/Modal (`/sadoksan-panel/siparisler/[id]`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Temel detay var |
| **Eksik** | Durum geçmişi timeline, admin notu, kargo girişi, durum değiştirme butonları |

**Detay Bölümleri (dikey scroll, drawer sağdan açılır):**

1. **Başlık bandı:** Sipariş no + tarih + durum badge (büyük) + müşteri tipi badge
2. **Müşteri kartı:** Ad, e-posta, telefon, bayi ise firma adı + cari no
3. **Adres kartı:** Teslimat adresi, fatura adresi
4. **Ürün tablosu:** Görsel | SKU | Ürün Adı | Varyant | Birim Fiyat | Miktar | KDV | Satır Toplam
5. **Fiyat özeti:** Ara toplam, indirim, kupon, kargo, KDV, genel toplam
6. **Ödeme kartı:** Yöntem, durum badge, tutar, transaction ID, havale dekontu görseli
7. **Kargo kartı:** Firma dropdown, takip no input, kaydet butonu
8. **Durum geçmişi (timeline):** Dikey çizgi + noktalar, her durumda tarih, kim, not
9. **Admin notları:** Textarea + kaydet butonu, geçmiş notlar listesi
10. **Aksiyon butonları (altta sabit bar):**
    - B2B bekliyorsa: [Onayla] [Reddet]
    - APPROVED ise: [Hazırlanıyor]
    - PREPARING ise: [Kargoya Hazır] [Tedarik Bekliyor]
    - READY_TO_SHIP ise: [Kargoya Ver] (kargo bilgisi zorunlu)
    - SHIPPED ise: [Teslim Edildi]
    - Her durumda: [İptal Et] [Not Ekle]

**MVP/V1/V2:** MVP ✅ (mevcut, drawer + timeline + aksiyon bar'ı eklenmeli)

---

## 1.8 Stok Durumu (`/sadoksan-panel/stok`)

| Konu | Detay |
|------|-------|
| **Route** | `/stok` |
| **Kim erişir** | SUPER_ADMIN, ADMIN, WAREHOUSE_STAFF |
| **Mevcut** | ✅ Var |
| **Eksik** | Stok hareket logu sayfası, manuel giriş/çıkış formu |

**Liste Kolonları:**
```
SKU | Ürün Adı | Kategori | Birim | Netsis Stok | Rezerve | Display Stok | Min Stok | Durum
```
**Durum badge:** yeşil (yeterli) / turuncu (kritik seviye) / kırmızı (kritik altı) / gri (stokta yok)

**Filtreler:** Arama, kategori, stok durumu (yeterli/kritik/yok)

**Aksiyonlar:**
- Satır tıklama → stok hareket geçmişi drawer'ı
- Manuel stok giriş/çıkış butonu → modal form
- Sayım düzeltme butonu → modal form

**MVP/V1/V2:** MVP'de stok listesi + hareket logu drawer'ı eklenmeli

---

## 1.9 Stok Hareket Geçmişi (Drawer — stok sayfasından açılır)

**Liste Kolonları:**
```
Tarih | İşlem Tipi | Miktar | Eski Stok | Yeni Stok | İşlemi Yapan | Referans | Açıklama
```

**Filtreler:** Tarih aralığı, işlem tipi

**MVP/V1/V2:** MVP ✅ (yeni eklenecek — `stock_movements` tablosuyla)

---

## 1.10 Manuel Stok Giriş/Çıkış (Modal)

**Form Alanları:**
- Ürün seç (searchable dropdown)
- İşlem tipi (giriş/çıkış)
- Miktar (pozitif sayı, birime uygun)
- Açıklama (zorunlu, min 10 karakter)
- Referans (opsiyonel serbest metin)

**Validasyon:** Miktar > 0, çıkışta mevcut stoktan büyük olamaz

**MVP/V1/V2:** MVP ✅ (yeni eklenecek)

---

## 1.11 Bayi Listesi (`/sadoksan-panel/bayiler`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **Eksik** | Fiyat grubu atama, override fiyat girişi arayüzü |

**Liste Kolonları:**
```
Firma | Yetkili | Şehir | Cari No | Cari Bakiye | Sipariş Sayısı | Toplam Ciro | Durum | Risk
```

**Filtreler:** Arama (firma, yetkili, cari no), durum, şehir

**Aksiyonlar:** Detay drawer, onayla/reddet (bekleyenler için), pasife al

**MVP/V1/V2:** MVP ✅ | V1'de toplu bayi fiyat güncelleme

---

## 1.12 Bayi Detay (Drawer)

**Sekmeler:**
1. **Firma Bilgileri:** Ad, vergi no, vergi dairesi, yetkili, telefon, e-posta, adres, şehir, cari no
2. **Finansal:** Cari bakiye, kredi limiti, risk skoru
3. **Fiyatları:** Bayi grubu, genel iskonto %, ürün bazlı override fiyatlar (tablo: ürün, normal fiyat, bayi fiyatı, override girişi)
4. **Siparişler:** Bu bayiye ait sipariş listesi
5. **İstatistikler:** Toplam sipariş, toplam ciro, son sipariş tarihi

**MVP/V1/V2:** MVP'de firma bilgileri + siparişler sekmeleri yeterli

---

## 1.13 Bayi Başvuruları (Dashboard'dan veya `/bayiler?durum=bekleyen`)

**Liste Kolonları:** Firma | Yetkili | Şehir | Vergi No | Başvuru Tarihi

**Aksiyonlar:** Detay drawer → onayla / reddet (ret sebebi zorunlu)

**Onay modal'ı:** Cari no (zorunlu), fiyat grubu seç, kredi limiti gir → onayla

**MVP/V1/V2:** MVP ✅ (mevcut)

---

## 1.14 İndirimler (`/sadoksan-panel/indirimler`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **Eksik** | Yok, mevcut CRUD yeterli |

**Liste Kolonları:** Hedef (ürün/kategori/marka) | Tip | İndirim (%/TL) | Geçerlilik | Aktif

**Form:** Tip (ürün/kategori/marka), hedef seç (dropdown), indirim türü (%/TL), değer, başlangıç/bitiş tarihi, aktif

**MVP/V1/V2:** MVP ✅

---

## 1.15 Kuponlar (`/sadoksan-panel/kuponlar`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ PromoCode modeli ve `/api/promo/validate` endpoint var |
| **Eksik** | Admin CRUD arayüzü, kullanım istatistikleri |

**Liste Kolonları:** Kod | İndirim | Kullanım (usedCount/usageLimit) | Geçerlilik | Aktif

**Form:** Kod, indirim tipi (%/TL), değer, min sepet tutarı, max indirim, kullanım limiti, müşteri başına limit, başlangıç/bitiş, kapsam (tüm/belirli ürün/kategori/marka), hedef kitle (B2C/B2B/hepsi), ilk alışverişe özel, aktif

**MVP/V1/V2:** V1'de admin CRUD arayüzü eklenmeli

---

## 1.16 Havale Bildirimleri (`/sadoksan-panel/odemeler/havale`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ❌ Admin listesi ve onay ekranı eksik |
| **MVP** | Yeni eklenecek |

**Liste Kolonları:** Tarih | Sipariş No | Müşteri | Banka | Tutar | Dekont | Durum | Aksiyon

**Aksiyonlar:** Dekont görüntüle (modal), onayla, reddet (sebep zorunlu)

**Onay:** Tıkla → otomatik sipariş durumu güncelle, PaymentLog oluştur, müşteriye e-posta

**MVP/V1/V2:** MVP ✅ (yeni eklenecek)

---

## 1.17 İçerik Sayfaları (`/sadoksan-panel/icerik`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ❌ CMS sayfa CRUD'u eksik (sadece hero banner var) |
| **MVP** | Sayfa listesi + rich text editor |

**Liste Kolonları:** Başlık | Slug | Son Güncelleme

**Form:** Başlık, slug (otomatik), içerik (rich text editor), SEO başlığı, meta açıklama

**Varsayılan sayfalar seed ile eklenir:** Hakkımızda, İletişim, SSS, Teslimat ve İade, KVKK, Gizlilik, Mesafeli Satış, Banka Hesapları

**MVP/V1/V2:** MVP ✅ (yeni eklenecek)

---

## 1.18 SEO Yönlendirmeleri (`/sadoksan-panel/seo`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ❌ Yok |
| **MVP** | 301 yönlendirme tablosu + toplu import |

**Liste Kolonları:** Eski URL | Yeni URL | Aktif

**Form:** Eski URL (göreceli, `/eski-sayfa`), yeni URL (göreceli, `/yeni-sayfa`)

**Toplu import:** CSV yükle (eski_url, yeni_url)

**MVP/V1/V2:** MVP ✅ (yeni eklenecek — migration için kritik)

---

## 1.19 Admin Kullanıcıları (`/sadoksan-panel/kullanicilar`)

| Konu | Detay |
|------|-------|
| **Route** | `/kullanicilar` |
| **Kim erişir** | Sadece SUPER_ADMIN |
| **Mevcut** | ❌ Yok |
| **MVP** | Liste + CRUD |

**Liste Kolonları:** Ad | E-posta | Rol | Son Giriş | Aktif

**Form:** Ad, e-posta, şifre, rol (SUPER_ADMIN/ADMIN/SALES_STAFF/WAREHOUSE_STAFF/ACCOUNTING/CONTENT_EDITOR)

**MVP/V1/V2:** MVP ✅ (yeni eklenecek)

---

## 1.20 Audit Log (`/sadoksan-panel/denetim`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **Eksik** | Yok, mevcut sayfa yeterli |

**Filtreler:** Tarih aralığı, kullanıcı, işlem tipi, entity

**Liste (salt okunur):** Tarih | Kullanıcı | İşlem | Entity | Eski/Yeni Değer | IP

**MVP/V1/V2:** MVP ✅

---

## 1.21 Site Ayarları (`/sadoksan-panel/ayarlar`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var (SiteContent, SiteSettings) |
| **Eksik** | Sayfa başına iletişim bilgileri, sosyal medya, SMTP ayarları placeholder |

**Form:** Site adı, slogan, logo, favicon, bakım modu, bakım mesajı, e-posta, telefon, adres, sosyal medya linkleri, footer metni, varsayılan KDV

**MVP/V1/V2:** MVP ✅

---

## 1.22 Raporlar (`/sadoksan-panel/raporlar`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var (temel) |
| **Eksik** | Grafikler, detaylı filtreleme, Excel export |

**Rapor sekmeleri:**
- **Satış:** Tarih aralığı, ürün/kategori/bayi filtresi → tablo + çizgi grafik
- **Stok:** Kategori, kritik stok filtresi → tablo
- **Bayi:** Bayi seç, tarih aralığı → tablo
- **Ödeme:** Tarih, yöntem, durum filtresi → tablo

**Her raporda:** Excel export butonu

**MVP/V1/V2:** MVP ✅ (tablo yeterli) | V1'de grafikler

---

## 1.23 Excel Import Ekranı (Modal — ürün listesinden açılır)

**5 adımlı wizard:**

1. **Dosya Yükle:** Sürükle-bırak .xlsx/.csv, şablon indir linki
2. **Kolon Eşleştirme:** Dosyadaki başlık ↔ sistem alanı (dropdown)
3. **Önizleme:** İlk 10 satırı tabloda göster, hatalı hücreleri kırmızı işaretle
4. **İçe Aktar:** İlerleme barı, arka planda BullMQ job
5. **Sonuç:** Başarılı X, hatalı Y satır, hata raporu indir butonu

**MVP/V1/V2:** MVP ✅ (mevcut, wizard'a dönüştürülmeli)

---

# 2. Müşteri Tarafı Ekran Listesi

## 2.1 Ana Sayfa (`/`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **İyileştirme** | Kategori kartları grid'i, öne çıkan ürünler, mobil düzen |

**Bileşenler ve Veri Kaynağı:**
- Hero banner → `GET /cms/hero`
- Kategori kartları (grid, 6-8 kart) → `GET /products/categories`
- Öne çıkan ürünler (slider, 10 ürün) → `GET /products?featured=true`
- Yeni ürünler → `GET /products?sort=newest&limit=8`
- Footer → static + `GET /cms/settings`

**Mobil:** Hero tam genişlik, kategori kartları 2 sütun, ürün slider'ı yatay kaydırma

**SEO:** Site adı + slogan meta title, meta description site ayarlarından

**MVP/V1/V2:** MVP ✅

---

## 2.2 Ürün Listeleme (`/urunler`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **İyileştirme** | Dinamik filtreler (V1), grid/list toggle, sıralama |

**Bileşenler:**
- Sol sidebar filtreler (masaüstü) / üstte drawer filtre (mobil)
- Sağ/alt ürün grid'i (4 sütun masaüstü, 2 sütun mobil)
- Üstte: sonuç sayısı + sıralama dropdown + grid/list toggle
- Altta: "Daha fazla yükle" veya pagination

**Ürün Kartı:**
```
[Görsel 300x300]
[Marka adı - küçük, gri]
[Ürün adı - 2 satır max]
[Fiyat - KDV dahil, kalın]
[İndirimli fiyat varsa - çizgili, kırmızı indirim oranı badge]
[Stok durumu: yeşil "Stokta" / kırmızı "Tükendi"]
[Sepete Ekle butonu - stok yoksa disable, "Stok Habercisi"ne dönüşür]
```

**MVP/V1/V2:** MVP ✅

---

## 2.3 Ürün Detay (`/urun/[slug]`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **İyileştirme** | Varyant seçiminde stok/fiyat anlık güncelleme, galeri zoom, teknik özellikler tablosu, dosya ekleri |

**Sayfa Düzeni (Masaüstü — 2 sütun):**

Sol (%55):
- Ana görsel + zoom (lightbox)
- Thumbnail galerisi (altında yatay)

Sağ (%45):
- Breadcrumb (Anasayfa > Kategori > Ürün Adı)
- Marka adı (linkli)
- Ürün adı (H1)
- SKU (küçük, gri)
- Fiyat (büyük, KDV dahil)
- İndirimli fiyat (çizgili)
- KDV bilgisi (küçük)
- Stok durumu (yeşil/kırmızı badge)
- Birim tipi (küçük)
- Varyant seçimi (buton grubu: her varyant tıklanabilir, stok yoksa disable)
- Miktar seçici (+/− buton, input)
- Sepete Ekle (büyük, primer buton)
- Favori (kalp ikonu)
- Teslimat bilgisi (ikon + "Tahmini 2-5 iş günü")

Alt (tam genişlik, sekmeli):
- Ürün Açıklaması (HTML)
- Teknik Özellikler (tablo)
- Dosya Ekleri (PDF linkleri)
- Benzer Ürünler (slider)

**Mobil:** Tek sütun, galeri swipe, sepet butonu altta sabit (sticky)

**SEO:** Product schema (JSON-LD), OG tags, meta title = ürün adı, meta desc = kısa açıklama

**MVP/V1/V2:** MVP ✅ | V1'de Schema.org, dosya ekleri, teknik özellikler tablosu

---

## 2.4 Kategori Sayfası (`/kategori/[slug]`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **İyileştirme** | Kategori açıklaması üstte, alt kategoriler grid'i |

**Bileşenler:** Kategori açıklaması + resim (üst), alt kategoriler (grid, 3-4 sütun), ürün listesi (PLP ile aynı)

**MVP/V1/V2:** MVP ✅

---

## 2.5 Marka Sayfası (`/marka/[slug]`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var (ürün listesi içinde marka filtresi olarak) |
| **İyileştirme** | Ayrı marka sayfası, logo + açıklama + ürün listesi |

**MVP/V1/V2:** MVP ✅ (marka filtresi olarak var, ayrı sayfa V1)

---

## 2.6 Sepet (`/sepet`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **İyileştirme** | Kupon girişi (V1), boş sepet cross-sell |

**Bileşenler:**
- Ürün listesi: görsel | ürün adı + varyant | birim fiyat | miktar (+/−) | satır toplamı | sil (çöp ikonu)
- Kupon kodu input + uygula butonu **[V1]**
- Sepet özeti (sağda kart): ara toplam, indirim, kupon indirimi, KDV, genel toplam
- Sepeti Onayla butonu → `/odeme`
- Boş sepet: "Sepetiniz boş" + öne çıkan ürünler

**Mobil:** Ürünler üst üste, özet altta sabit

**MVP/V1/V2:** MVP ✅

---

## 2.7 Checkout (`/odeme`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ❌ Checkout sayfası eksik (doğrudan sipariş oluşturma var) |
| **MVP** | 3 adımlı checkout |

**Adım 1 — Adres:**
- Kayıtlı adresler (radio seçim)
- Yeni adres ekle (modal veya inline form)
- Fatura adresi (teslimatla aynı checkbox)
- Devam butonu

**Adım 2 — Ödeme:**
- Havale/EFT seçeneği (MVP)
- Banka hesapları listesi (site ayarlarından)
- Kredi kartı seçeneği (V1)
- Devam butonu

**Adım 3 — Onay:**
- Sipariş özeti (ürünler, adres, ödeme yöntemi)
- Mesafeli satış sözleşmesi checkbox (zorunlu)
- KVKK checkbox (zorunlu)
- Siparişi Tamamla butonu

**Mobil:** Tek sütun, adım göstergesi üstte

**MVP/V1/V2:** MVP ✅ (yeni sayfa)

---

## 2.8 Sipariş Sonucu (`/siparis-tamamlandi`)

- Sipariş numarası büyük
- Havale ise: banka bilgileri + "Havale Bildirimi Yap" butonu
- Kart ise: ödeme sonucu
- "Siparişlerime Git" butonu

**MVP/V1/V2:** MVP ✅

---

## 2.9 Giriş / Kayıt (`/giris`, `/uye-ol`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **İyileştirme** | Şifre görünürlük toggle, kayıt sonrası auto-login |

**Kayıt formu:** Ad soyad, e-posta, şifre, telefon (opsiyonel), KVKK checkbox

**MVP/V1/V2:** MVP ✅

---

## 2.10 Şifremi Unuttum (`/sifremi-unuttum`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |

**Form:** E-posta → gönder → "E-postanızı kontrol edin" mesajı

**MVP/V1/V2:** MVP ✅

---

## 2.11 Hesabım (`/hesabim`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |

**Sekmeler (sol sidebar):**
- Profil → ad, soyad, e-posta, telefon, şifre değiştir
- Adreslerim → liste, yeni ekle (modal), varsayılan seç, sil
- Siparişlerim → liste (sipariş no, tarih, tutar, durum badge), tıkla → detay
- Favorilerim → ürün grid'i, sepete ekle, kaldır
- Havale Bildirimlerim → yaptığım bildirimler ve durumları

**MVP/V1/V2:** MVP ✅

---

## 2.12 Sipariş Detay (`/hesabim/siparis/[orderNo]`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var (siparişlerim içinde) |

**Gösterilecek:** Ürün listesi, fiyat özeti, durum timeline'ı, kargo takip linki, iptal/iade butonu

**MVP/V1/V2:** MVP ✅

---

## 2.13 Havale Bildirim Formu (`/havale-bildirimi`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ❌ Yok |
| **MVP** | Form + başarı mesajı |

**Form:** Sipariş no (dropdown: havale bekleyen siparişler), ad soyad, banka (dropdown), tutar, dekont (dosya yükle, max 5MB, jpg/png/pdf), açıklama

**Başarı mesajı:** "Bildiriminiz alındı, inceleniyor"

**MVP/V1/V2:** MVP ✅ (yeni sayfa)

---

## 2.14 Kurumsal Sayfalar (`/sayfa/[slug]`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var (hardcoded sayfalar) |
| **İyileştirme** | Dinamik CMS sayfaları |

**Sayfalar:** hakkimizda, iletisim, sss, teslimat-iade, kvkk, gizlilik, mesafeli-satis, banka-hesaplari

**İletişim sayfası özel:** Form (ad, e-posta, konu, mesaj) + harita + iletişim bilgileri

**MVP/V1/V2:** MVP ✅ (dinamik CMS ile)

---

## 2.15 Bayi Başvuru (`/bayilik`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |

**Form:** Firma adı, vergi no, vergi dairesi, yetkili ad, telefon, e-posta, şehir, adres

**MVP/V1/V2:** MVP ✅

---

## 2.16 Arama Sonuçları (`/arama?q=...`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Header'da arama var |
| **İyileştirme** | Ayrı arama sayfası, sonuç sayısı, vurgulama |

**MVP/V1/V2:** MVP ✅

---

# 3. Bayi Paneli Ekran Listesi

## 3.1 Bayi Dashboard (`/bayi`)

| Konu | Detay |
|------|-------|
| **Mevcut** | ✅ Var |
| **Erişim** | DEALER rolü, oturum açmış |

**Kartlar:** Aylık ciro, bekleyen sipariş sayısı, cari bakiye, son siparişler

**MVP/V1/V2:** MVP ✅

---

## 3.2 Bayi Ürün Kataloğu (`/bayi/urunler`)

**Normal PLP ile aynı ama:**
- Fiyatlar bayi fiyatı olarak gösterilir
- Bayi override fiyatı varsa o gösterilir
- Sadece bayiye açık ürünler listede çıkar
- Perakende fiyatı gösterilmez

**MVP/V1/V2:** MVP ✅

---

## 3.3 Bayi Sepeti ve Sipariş

- Sepet bayi fiyatlarıyla çalışır
- Sipariş oluşturunca otomatik PENDING_APPROVAL durumuna düşer
- Admin onaylayana kadar stok rezerve edilmez
- Bayi kendi siparişlerini "Siparişlerim" sekmesinde takip eder
- "Tekrar Sipariş Ver" butonu (geçmiş siparişi sepete kopyalar)

**MVP/V1/V2:** MVP ✅

---

## 3.4 Bayi Raporları

Mevcut 8 rapor tipi (✅ var): aylık ciro, yıllık ciro, fatura, detay, stok, risk, yaşlandırma, performans

**MVP/V1/V2:** MVP ✅

---

## 3.5 Bayi Proforma

- Proforma oluştur (ürün seç, miktar gir, otomatik fiyat)
- PDF indir
- Geçmiş proforma listesi

**MVP/V1/V2:** MVP ✅ (mevcut)

---

# 4. Veritabanı Görev Kırılımı

## 4.1 Mevcut Modeller (✅ Var — DOKUNMA)

Bu modeller mevcut ve çalışıyor:

```
User, Dealer, Address, CartItem, Product, ProductVariation,
Category, Brand, Order, OrderLine, OrderStatusHistory,
StockReservation, Favorite, Discount, PromoCode, Popup,
NotifyRequest, SiteContent, SiteSettings, Proforma, ProformaItem,
ExchangeRate, ProductCurrencyPrice, RegionalPricingSurcharge,
ProvincePricingSurcharge, LogisticsRule, NetsisSync, AuditLog
```

## 4.2 Eksik Modeller — Migration Sırasıyla

### M1: stock_movements (MVP — Kritik)

```prisma
model StockMovement {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  type          StockMovementType
  quantity      Decimal  @db.Decimal(10, 2) // pozitif=giriş, negatif=çıkış
  oldStock      Decimal  @db.Decimal(10, 2)
  newStock      Decimal  @db.Decimal(10, 2)
  userId        String?
  user          User?    @relation(fields: [userId], references: [id])
  referenceType String?  // "Order", "Return", "Manual"
  referenceId   String?
  note          String?
  createdAt     DateTime @default(now())

  @@index([productId])
  @@index([createdAt])
  @@index([type])
}

enum StockMovementType {
  MANUAL_ENTRY
  MANUAL_EXIT
  ORDER_RESERVE
  ORDER_FULFILL
  ORDER_CANCEL
  RETURN_RESTOCK
  COUNT_ADJUST
  DAMAGE_LOSS
}
```

**Görev:** Prisma migration oluştur, `StockService` yaz, admin stok hareket logu sayfasını besle.

### M2: payment_logs (MVP — Kritik)

```prisma
model PaymentLog {
  id              String   @id @default(cuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  customerId      String
  provider        String   // BANK_TRANSFER, IYZICO, PAYTR
  transactionId   String?
  amount          Decimal  @db.Decimal(12, 2)
  currency        String   @default("TRY")
  installments    Int      @default(1)
  status          PaymentLogStatus @default(PENDING)
  errorMessage    String?
  rawResponse     Json?
  paidAt          DateTime?
  createdAt       DateTime @default(now())

  @@index([orderId])
  @@index([status])
  @@index([createdAt])
}

enum PaymentLogStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  PARTIAL_REFUNDED
}
```

**Görev:** Prisma migration, havale onayında ve online ödeme callback'inde PaymentLog kaydı oluştur.

### M3: return_requests + return_items (V1)

```prisma
model ReturnRequest {
  id            String   @id @default(cuid())
  orderId       String
  order         Order    @relation(fields: [orderId], references: [id])
  customerId    String
  status        ReturnStatus @default(RETURN_REQUESTED)
  reason        String
  description   String?
  adminNote     String?
  refundAmount  Decimal? @db.Decimal(12, 2)
  images        String[] // JSON array
  items         ReturnItem[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([orderId])
  @@index([status])
}

model ReturnItem {
  id              String   @id @default(cuid())
  returnRequestId String
  returnRequest   ReturnRequest @relation(fields: [returnRequestId], references: [id], onDelete: Cascade)
  orderLineId     String
  quantity        Int
  reason          String?
  itemReceived    Boolean  @default(false)
  restockQuantity Int      @default(0)
}

enum ReturnStatus {
  RETURN_REQUESTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  ITEM_RECEIVED
  REFUND_PENDING
  COMPLETED
}
```

### M4: import_jobs (MVP)

```prisma
model ImportJob {
  id            String   @id @default(cuid())
  type          String   // "product_import", "stock_update"
  fileName      String
  status        ImportStatus @default(PENDING)
  totalRows     Int      @default(0)
  successRows   Int      @default(0)
  errorRows     Int      @default(0)
  errorReport   Json?    // [{row: 5, errors: ["Geçersiz fiyat"]}]
  userId        String
  createdAt     DateTime @default(now())
  completedAt   DateTime?

  @@index([status])
}

enum ImportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### M5: category_filters (V1)

```prisma
model CategoryFilter {
  id          String   @id @default(cuid())
  categoryId  String
  filterName  String   // "Ebat", "Renk", "Kullanım Alanı"
  filterType  String   // "checkbox", "range", "select"
  options     Json?    // ["30x60", "45x45", ...]
  order       Int      @default(0)

  @@index([categoryId])
}
```

### M6: Category.parentId (V1)

Mevcut `Category` modeline eklenecek:
```prisma
  parentId    String?
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
```

### M7: email_logs (V2)

Bildirim geçmişi takibi için.

## 4.3 Genişletilmesi Gereken Mevcut Modeller

### Product modeline eklenecek alanlar:

```prisma
  shortDescription  String?        // Kısa açıklama (max 300)
  technicalSpecs    Json?          // [{key:"Malzeme", value:"Pirinç"}]
  fileAttachments   Json?          // [{name:"Teknik Föy", url:"...", type:"pdf"}]
  featured          Boolean @default(false)
  newProduct        Boolean @default(false)
  bestSeller        Boolean @default(false)
  sortOrder         Int     @default(0)
  seoTitle          String?
  seoDescription    String?
  canonicalUrl      String?
  ogImageUrl        String?
```

### Order modeline eklenecek/doğrulanacak alanlar:

```prisma
  // Mevcut alanlar kontrol edilmeli: trackingNumber, cargoCompany mevcut mu?
  // Admin notları için ayrı model veya JSON alanı
  adminNotes        Json?      // [{note, userId, createdAt}]
```

## 4.4 Kritik Transaction Noktaları

| # | İşlem | Transaction Kapsamı |
|---|-------|-------------------|
| 1 | **Sipariş oluşturma** | Order + OrderLine(s) + StockReservation + CartItem temizleme |
| 2 | **Sipariş onayı (B2B)** | Order.status + StockReservation oluştur + Dealer.totalOrders/totalRevenue güncelle |
| 3 | **Sipariş iptali** | Order.status + StockReservation RELEASED + displayStock güncelle |
| 4 | **Stok manuel giriş/çıkış** | Product.netsisStock + StockMovement kaydı |
| 5 | **Havale onayı** | Order.paymentStatus + PaymentLog + varsa Order.status güncelle |
| 6 | **İade tamamlama** | ReturnRequest.status + StockMovement(RETURN_RESTOCK) + PaymentLog(REFUNDED) |

**Kural:** Bu işlemlerin hepsi `prisma.$transaction()` içinde yapılmalı. Herhangi bir adımda hata olursa tüm işlem geri alınmalı.

## 4.5 Migration Sırası

```
1. M1: stock_movements tablosu (MVP)
2. M2: payment_logs tablosu (MVP)
3. M4: import_jobs tablosu (MVP)
4. Product genişletme (featured, newProduct, bestSeller, sortOrder, seo alanları) (MVP)
5. Category.parentId (V1)
6. M5: category_filters (V1)
7. M3: return_requests + return_items (V1)
8. M7: email_logs (V2)
```

---

# 5. API Endpoint Görev Kırılımı

## 5.1 Mevcut Endpointler (✅ Var — test et, eksikse düzelt)

Tüm endpoint'ler mevcut. Görev: her endpoint için çalışır durumda olduğunu doğrula, hatalı olanları düzelt.

## 5.2 Eksik Endpointler

### Admin Stock Movements (MVP)

| Method | Endpoint | Yetki | Kullanıldığı Ekran |
|--------|----------|-------|-------------------|
| GET | `/api/admin/stock/movements?productId=&type=&start=&end=` | WAREHOUSE+ | Stok hareket drawer'ı |
| POST | `/api/admin/stock/movements` | WAREHOUSE+ | Manuel giriş/çıkış modal'ı |

**POST body:** `{ productId, type: MANUAL_ENTRY|MANUAL_EXIT|DAMAGE_LOSS, quantity, note }`

### Havale Bildirimleri (MVP)

| Method | Endpoint | Yetki | Kullanıldığı Ekran |
|--------|----------|-------|-------------------|
| POST | `/api/orders/:orderNo/bank-transfer` | Auth | Havale bildirim formu |
| GET | `/api/admin/bank-transfers?status=` | ADMIN, ACCOUNTING | Havale listesi admin |
| POST | `/api/admin/bank-transfers/:id/approve` | ADMIN, ACCOUNTING | Havale onayı |
| POST | `/api/admin/bank-transfers/:id/reject` | ADMIN, ACCOUNTING | Havale red |

### CMS Sayfaları (MVP)

| Method | Endpoint | Yetki | Kullanıldığı Ekran |
|--------|----------|-------|-------------------|
| GET | `/api/content/pages` | Public | Footer, nav |
| GET | `/api/content/pages/:slug` | Public | Kurumsal sayfalar |
| POST | `/api/admin/content/pages` | CONTENT_EDITOR+ | Sayfa oluştur |
| PATCH | `/api/admin/content/pages/:id` | CONTENT_EDITOR+ | Sayfa düzenle |

### SEO Yönlendirmeleri (MVP)

| Method | Endpoint | Yetki | Kullanıldığı Ekran |
|--------|----------|-------|-------------------|
| GET | `/api/admin/seo/redirects` | CONTENT_EDITOR+ | SEO sayfası |
| POST | `/api/admin/seo/redirects` | CONTENT_EDITOR+ | Yönlendirme ekle |
| DELETE | `/api/admin/seo/redirects/:id` | CONTENT_EDITOR+ | Yönlendirme sil |
| POST | `/api/admin/seo/redirects/import` | CONTENT_EDITOR+ | CSV import |

### Admin Kullanıcı Yönetimi (MVP)

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET | `/api/admin/users` | SUPER_ADMIN |
| POST | `/api/admin/users` | SUPER_ADMIN |
| PATCH | `/api/admin/users/:id` | SUPER_ADMIN |

### Kupon Admin CRUD (V1)

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET | `/api/admin/promo-codes` | ADMIN |
| POST | `/api/admin/promo-codes` | ADMIN |
| PATCH | `/api/admin/promo-codes/:id` | ADMIN |
| DELETE | `/api/admin/promo-codes/:id` | ADMIN |

### Rapor Export (MVP/V1)

| Method | Endpoint | Yetki |
|--------|----------|-------|
| GET | `/api/admin/reports/sales/export?start=&end=&format=xlsx` | ADMIN+ |
| GET | `/api/admin/reports/stock/export?format=xlsx` | WAREHOUSE+ |

### Checkout (MVP — controller'lar mevcut olabilir, kontrol et)

Var olan `POST /orders` endpoint'i checkout'u karşılıyor. Ayrıca checkout'a özel bir şey gerekmiyor olabilir. Kontrol et.

## 5.3 Endpoint Öncelik Sıralaması

```
M1 (Hemen):  Eksik MVP endpoint'leri yaz
             → stock movements, havale bildirimi, CMS sayfaları, SEO redirect
M2 (1 hafta): Admin kullanıcı, rapor export
M3 (2 hafta): Kupon admin CRUD, iade endpoint'leri
M4 (V1 sonu): Kategori filtre, dinamik filtre endpoint'leri
```

---

# 6. Geliştirme Task Breakdown

Her task bağımsız çalışılabilir. Sıralama bağımlılıklara göre.

## TASK-01: Veritabanı Migration'ları

| Konu | Detay |
|------|-------|
| **Açıklama** | Eksik modeller için Prisma migration'ları oluştur |
| **Bağımlılık** | Yok |
| **Kapsam** | M1 stock_movements, M2 payment_logs, M4 import_jobs, Product genişletme |
| **Kabul Kriteri** | `prisma migrate dev` başarılı, tablolar PostgreSQL'de oluştu |
| **Tahmini süre** | 2-3 saat |
| **Öncelik** | P0 — İlk yapılacak iş |
| **Etiket** | MVP |

## TASK-02: StockService + Stok Hareket Logu

| Konu | Detay |
|------|-------|
| **Açıklama** | `StockService` yaz. Stok giriş/çıkış, sipariş rezervasyonu, iptal geri alımı, sayım düzeltme işlemlerini yönet. Her işlemde StockMovement logu oluştur. |
| **Bağımlılık** | TASK-01 (stock_movements tablosu) |
| **Kapsam** | `apps/api/src/modules/stock/` modülü (yeni). StockService, StockController |
| **Kabul Kriteri** | Manuel stok girişi yapıldığında Product.netsisStock güncellenir, StockMovement kaydı oluşur. Sipariş onayında stok rezerve olur. |
| **Tahmini süre** | 4-6 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-03: Admin Stok Sayfası İyileştirme

| Konu | Detay |
|------|-------|
| **Açıklama** | `/sadoksan-panel/stok` sayfasına stok hareket geçmişi drawer'ı ve manuel giriş/çıkış modal'ı ekle |
| **Bağımlılık** | TASK-02 |
| **Kapsam** | `apps/admin/app/pages/stok.vue` iyileştirme + yeni drawer/modal component'leri |
| **Kabul Kriteri** | Stok listesinde ürüne tıklandığında hareket geçmişi görünür. Manuel giriş/çıkış formu çalışır. |
| **Tahmini süre** | 4-5 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-04: Havale Bildirim Sistemi

| Konu | Detay |
|------|-------|
| **Açıklama** | Müşteri tarafı havale bildirim formu, admin tarafı havale listesi ve onay/ret mekanizması |
| **Bağımlılık** | TASK-01 (payment_logs tablosu) |
| **Kapsam** | Backend: BankTransferModule (controller + service). Frontend: `/havale-bildirimi` sayfası (storefront), admin havale listesi |
| **Kabul Kriteri** | Müşteri havale bildirimi yapabilir. Admin listede görür, onaylayınca sipariş PAID olur, PaymentLog oluşur. |
| **Tahmini süre** | 6-8 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-05: Admin Sipariş Detay Sayfası İyileştirme

| Konu | Detay |
|------|-------|
| **Açıklama** | Sipariş detayını drawer'a dönüştür. Timeline, admin notu, kargo girişi, durum değiştirme butonları ekle |
| **Bağımlılık** | Yok (mevcut endpoint'leri kullanır) |
| **Kapsam** | Admin siparişler sayfası + yeni SiparişDetayDrawer component'i |
| **Kabul Kriteri** | Drawer sağdan açılır. Tüm sipariş bilgileri gösterilir. Durum butonları çalışır. Admin notu eklenebilir. |
| **Tahmini süre** | 6-8 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-06: CMS Sayfa Yönetimi

| Konu | Detay |
|------|-------|
| **Açıklama** | Admin'de CMS sayfa CRUD'u. Storefront'ta dinamik sayfa rendering. |
| **Bağımlılık** | Yok |
| **Kapsam** | Backend: ContentModule genişletme (pages). Frontend: admin sayfa CRUD, storefront `/sayfa/[slug]` |
| **Kabul Kriteri** | Admin sayfa ekler/düzenler. Storefront'ta `/sayfa/hakkimizda` görüntülenir. Rich text doğru render edilir. |
| **Tahmini süre** | 5-6 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-07: SEO Yönlendirme Yönetimi

| Konu | Detay |
|------|-------|
| **Açıklama** | 301 yönlendirme tablosu, admin CRUD, CSV import, Nuxt server middleware'da yönlendirme kontrolü |
| **Bağımlılık** | Yok |
| **Kapsam** | Backend: SeoModule (yeni). Frontend: admin SEO sayfası. Storefront: server middleware |
| **Kabul Kriteri** | Admin yönlendirme ekler. `/eski-sayfa` → `/yeni-sayfa` 301 döner. CSV ile toplu import çalışır. |
| **Tahmini süre** | 3-4 saat |
| **Öncelik** | P0 — migration için kritik |
| **Etiket** | MVP |

## TASK-08: Checkout Sayfası (Storefront)

| Konu | Detay |
|------|-------|
| **Açıklama** | 3 adımlı checkout sayfası oluştur |
| **Bağımlılık** | Yok (mevcut cart ve order endpoint'leri kullanılır) |
| **Kapsam** | `/odeme` sayfası. Adres seçimi/ekleme → ödeme yöntemi → onay |
| **Kabul Kriteri** | Misafir ve üye checkout yapabilir. Havale seçilirse sipariş oluşur, ödeme bekler durumuna düşer. |
| **Tahmini süre** | 8-10 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-09: Admin Kullanıcı Yönetimi

| Konu | Detay |
|------|-------|
| **Açıklama** | Admin kullanıcı listesi ve CRUD |
| **Bağımlılık** | Yok |
| **Kapsam** | Backend: AdminUserController. Frontend: `/sadoksan-panel/kullanicilar` |
| **Kabul Kriteri** | SUPER_ADMIN kullanıcı ekler, düzenler, rol atar. Yetkisiz roller göremez. |
| **Tahmini süre** | 4-5 saat |
| **Öncelik** | P0 |
| **Etiket** | MVP |

## TASK-10: Admin Dashboard İyileştirme

| Konu | Detay |
|------|-------|
| **Açıklama** | Kritik stok kartı, bayi başvuru kartı, son siparişler listesine hızlı onay butonu ekle |
| **Bağımlılık** | Yok |
| **Kapsam** | Admin dashboard sayfası |
| **Kabul Kriteri** | Tüm kartlar canlı veri gösterir. Kritik stok kartı tıklanınca stok sayfasına gider. |
| **Tahmini süre** | 2-3 saat |
| **Öncelik** | P1 |
| **Etiket** | MVP |

## TASK-11: Ürün Formu Sekmelendirme

| Konu | Detay |
|------|-------|
| **Açıklama** | Ürün ekle/düzenle formunu sekmeli yapıya dönüştür. SEO, dosya ekleri, görseller sekmelerini ekle. |
| **Bağımlılık** | TASK-01 (Product genişletme) |
| **Kapsam** | Admin ürün formu |
| **Kabul Kriteri** | 7 sekme çalışır. SEO alanları kaydedilir. Dosya ekleri yüklenir. |
| **Tahmini süre** | 6-8 saat |
| **Öncelik** | P1 |
| **Etiket** | MVP |

## TASK-12: Excel Import Wizard

| Konu | Detay |
|------|-------|
| **Açıklama** | Excel import'u 5 adımlı wizard'a dönüştür. Kolon mapping, önizleme, hata raporu ekle. |
| **Bağımlılık** | TASK-01 (import_jobs tablosu) |
| **Kapsam** | Admin ürün import modal'ı, backend ImportService |
| **Kabul Kriteri** | Dosya yükle → kolon eşle → önizle → import → sonuç raporu. Hatalı satırlar indirilebilir rapor. |
| **Tahmini süre** | 6-8 saat |
| **Öncelik** | P1 |
| **Etiket** | MVP |

## TASK-13: Varyant Yönetimi Grid

| Konu | Detay |
|------|-------|
| **Açıklama** | Ürün formunda varyant sekmesine grid bazlı varyant oluşturma ekle (örn: ebat x renk matrisi) |
| **Bağımlılık** | TASK-11 |
| **Kapsam** | Admin ürün formu varyant sekmesi |
| **Kabul Kriteri** | Ebat ve renk seçenekleri grid olarak oluşturulur. Her hücreye SKU, fiyat, stok girilebilir. |
| **Tahmini süre** | 5-6 saat |
| **Öncelik** | P1 |
| **Etiket** | MVP |

## TASK-14: Ürün Görsel Optimizasyonu

| Konu | Detay |
|------|-------|
| **Açıklama** | Upload sırasında görselleri WebP'ye çevir, max 1200px resize, thumbnail oluştur |
| **Bağımlılık** | Yok |
| **Kapsam** | Backend upload middleware, frontend upload component |
| **Kabul Kriteri** | Yüklenen PNG/JPG otomatik WebP olur. 3 boyut: thumbnail(150px), medium(600px), large(1200px). |
| **Tahmini süre** | 3-4 saat |
| **Öncelik** | P1 |
| **Etiket** | MVP |

## TASK-15: Sipariş E-Posta Bildirimleri

| Konu | Detay |
|------|-------|
| **Açıklama** | Sipariş oluşturma, durum değişikliği, kargoya verildi olaylarında otomatik e-posta gönder |
| **Bağımlılık** | Yok (mailer modülü mevcut) |
| **Kapsam** | Backend: OrderService'te event bazlı mail trigger, mailer modülü şablon sistemi |
| **Kabul Kriteri** | Sipariş oluşunca müşteriye e-posta gider. Durum değişince bilgilendirme gider. |
| **Tahmini süre** | 4-5 saat |
| **Öncelik** | P1 |
| **Etiket** | MVP |

## TASK-16: Kupon Admin CRUD (V1)

| Konu | Detay |
|------|-------|
| **Açıklama** | Admin panelde kupon listesi ve CRUD formu |
| **Bağımlılık** | Yok (PromoCode modeli mevcut) |
| **Kapsam** | Backend: PromoAdminController. Frontend: `/sadoksan-panel/kuponlar` |
| **Kabul Kriteri** | Admin kupon ekler/düzenler/siler. Sepette kupon uygulanır. |
| **Tahmini süre** | 4-5 saat |
| **Öncelik** | P2 |
| **Etiket** | V1 |

## TASK-17: Online Ödeme Entegrasyonu (V1)

| Konu | Detay |
|------|-------|
| **Açıklama** | iyzico veya PayTR sanal POS entegrasyonu |
| **Bağımlılık** | TASK-01 (payment_logs), ödeme sağlayıcı API anahtarı |
| **Kapsam** | Backend: PaymentModule (yeni). Frontend: checkout'a kredi kartı seçeneği |
| **Kabul Kriteri** | Kredi kartı ile ödeme alınabilir. Başarılı/başarısız durumları işlenir. |
| **Tahmini süre** | 8-12 saat |
| **Öncelik** | P2 |
| **Etiket** | V1 |

## TASK-18: Dinamik Filtre Sistemi (V1)

| Konu | Detay |
|------|-------|
| **Açıklama** | Kategoriye özel dinamik filtreler, category_filters tablosu, backend filtre endpoint'i |
| **Bağımlılık** | TASK-01 (category_filters), M6 (Category.parentId) |
| **Kapsam** | Backend: filtre endpoint'i. Admin: kategori filtre tanımlama UI. Storefront: dinamik filtre sidebar |
| **Tahmini süre** | 10-12 saat |
| **Öncelik** | P2 |
| **Etiket** | V1 |

## TASK-19: İade Yönetimi (V1)

| Konu | Detay |
|------|-------|
| **Açıklama** | Müşteri iade talebi, admin onay/ret akışı, stok geri alımı, ödeme iadesi |
| **Bağımlılık** | TASK-01 (return_requests tablosu) |
| **Kapsam** | Backend: ReturnModule. Frontend: sipariş detayda iade butonu, admin iade yönetimi |
| **Tahmini süre** | 10-14 saat |
| **Öncelik** | P2 |
| **Etiket** | V1 |

## TASK-20: SEO Migration Script

| Konu | Detay |
|------|-------|
| **Açıklama** | Eski site URL'lerini tespit edip 301 yönlendirme tablosuna aktaran script |
| **Bağımlılık** | TASK-07 |
| **Kapsam** | Script: eski site veritabanı/sitemap'ten URL'leri çek, yeni slug'larla eşleştir, yönlendirme oluştur |
| **Kabul Kriteri** | Eski ürün ve kategori URL'leri yeni URL'lere 301 yönlendirilir. |
| **Tahmini süre** | 3-4 saat |
| **Öncelik** | P0 — go-live öncesi |
| **Etiket** | MVP |

---

# 7. MVP Geliştirme Sırası

**Kural:** Her adım bir öncekine bağımlı. Sıra atlanmaz.

```
FAZ 0: ALTYAPI (önce bunlar bitmeli)
┌──────────────────────────────────────────────────────────┐
│ ADIM-0.1: Veritabanı migration'ları (TASK-01)            │
│           → stock_movements, payment_logs, import_jobs   │
│           → Product genişletme alanları                  │
│                                                          │
│ ADIM-0.2: Auth/Role sistemi kontrolü                     │
│           → Mevcut JWT + RBAC çalışıyor mu test et       │
│           → Eksik rol tanımları varsa ekle               │
│           → Admin kullanıcı seed (TASK-09)               │
└──────────────────────────────────────────────────────────┘

FAZ 1: ÇEKİRDEK (ürün-stok-sipariş üçgeni)
┌──────────────────────────────────────────────────────────┐
│ ADIM-1.1: StockService (TASK-02)                         │
│           → Stok hareket mantığı, reservation, log       │
│                                                          │
│ ADIM-1.2: Ürün formu sekmelendirme (TASK-11)             │
│           → SEO, dosya, görsel sekmeleri                 │
│           → Varyant grid (TASK-13)                       │
│                                                          │
│ ADIM-1.3: Görsel optimizasyonu (TASK-14)                 │
│           → WebP dönüşüm, resize, thumbnail              │
│                                                          │
│ ADIM-1.4: Admin stok sayfası (TASK-03)                   │
│           → Hareket geçmişi drawer, manuel giriş/çıkış   │
└──────────────────────────────────────────────────────────┘

FAZ 2: SİPARİŞ AKIŞI (müşteri sipariş verebilmeli)
┌──────────────────────────────────────────────────────────┐
│ ADIM-2.1: Checkout sayfası (TASK-08)                     │
│           → 3 adımlı: adres → ödeme → onay               │
│                                                          │
│ ADIM-2.2: Havale bildirim sistemi (TASK-04)              │
│           → Müşteri formu + admin onay listesi            │
│                                                          │
│ ADIM-2.3: Sipariş e-posta bildirimleri (TASK-15)         │
│           → Durum değişikliğinde otomatik mail           │
│                                                          │
│ ADIM-2.4: Admin sipariş detay drawer (TASK-05)           │
│           → Timeline, not, kargo, durum butonları        │
└──────────────────────────────────────────────────────────┘

FAZ 3: İÇERİK & SEO (site yayına hazır)
┌──────────────────────────────────────────────────────────┐
│ ADIM-3.1: CMS sayfa yönetimi (TASK-06)                   │
│           → Admin CRUD + storefront dinamik sayfa        │
│                                                          │
│ ADIM-3.2: SEO yönlendirme (TASK-07)                      │
│           → 301 tablosu, admin, middleware               │
│                                                          │
│ ADIM-3.3: SEO migration script (TASK-20)                 │
│           → Eski URL'leri eşleştir                       │
│                                                          │
│ ADIM-3.4: Admin dashboard iyileştirme (TASK-10)          │
│           → Eksik kartlar, son siparişler                │
│                                                          │
│ ADIM-3.5: Excel import wizard (TASK-12)                  │
│           → 5 adımlı wizard                              │
└──────────────────────────────────────────────────────────┘

FAZ 4: V1 ÖZELLİKLERİ
┌──────────────────────────────────────────────────────────┐
│ ADIM-4.1: Kupon admin CRUD + sepette kupon (TASK-16)     │
│ ADIM-4.2: Online ödeme entegrasyonu (TASK-17)            │
│ ADIM-4.3: Dinamik filtre sistemi (TASK-18)               │
│ ADIM-4.4: İade yönetimi (TASK-19)                        │
│ ADIM-4.5: Kategori parent-child (M6 migration)           │
└──────────────────────────────────────────────────────────┘
```

---

# 8. UI/UX Wireframe Açıklamaları

## 8.1 Admin Panel Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ÜST BAR: [☰ hamburger] [Logo] [Global Arama..............]   │
│                                          [🔔] [👤 Profil]   │
├────────────┬─────────────────────────────────────────────────┤
│ SOL        │  ANA İÇERİK                                    │
│ SIDEBAR    │                                                │
│            │  ┌─ Breadcrumb ────────────────────────────┐   │
│ 📊 Dash.   │  │ Anasayfa > Ürünler > Ürün Listesi       │   │
│ 📦 Ürünler │  └─────────────────────────────────────────┘   │
│ 📋 Sipariş │                                                │
│ 👥 Müşteri │  ┌─ Sayfa Başlığı + Aksiyon Butonu ────────┐   │
│ 🏗️ Stok   │  │ Ürünler          [+ Yeni Ürün] [Excel]  │   │
│ 💰 Fiyat   │  └─────────────────────────────────────────┘   │
│ 💳 Ödeme   │                                                │
│ 🚚 Kargo   │  ┌─ Filtre Bar ────────────────────────────┐   │
│ 📝 İçerik  │  │ [Arama...] [Kategori ▼] [Marka ▼] ...   │   │
│ 🔍 SEO     │  └─────────────────────────────────────────┘   │
│ 📈 Raporlar│                                                │
│ ⚙️ Sistem  │  ┌─ Data Table ────────────────────────────┐   │
│            │  │ [☐] SKU  │Ürün  │Fiyat│Stok│Durum│     │   │
│            │  │ [☐] ...  │...   │...  │... │...  │ ... │   │
│            │  │ [☐] ...  │...   │...  │... │...  │ ... │   │
│            │  └─────────────────────────────────────────┘   │
│            │                                                │
│            │  ┌─ Pagination ─────────────────────────────┐   │
│            │  │ < 1  2  3 ... 42 >  Sayfa başına: 25 ▼  │   │
│            │  └─────────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────┘
```

**Sidebar:** 220px genişlik, daraltılabilir (60px ikon görünüm). Aktif sayfa vurgulu.  
**Üst bar:** 56px, global arama (Ctrl+K), bildirim bell ikonu (kritik stok, bayi başvurusu), profil dropdown.  
**İçerik:** padding 24px, max-width 1400px.

## 8.2 Data Table Standardı

```
┌─────────────────────────────────────────────────────┐
│ [☐] Toplu seçim checkbox (header)                   │
├─────┬──────────┬────────┬───────┬──────┬───────────┤
│ [☐] │ SKU ▲    │ Ürün   │ Fiyat │ Stok │ Durum     │  ← Kolon başlığı tıkla = sırala
├─────┼──────────┼────────┼───────┼──────┼───────────┤
│ [ ] │ SRM-001  │ Seramik │ ₺320  │ 250  │ 🟢 Aktif  │
│ [ ] │ BTM-045  │ Batarya │ ₺890  │ 15   │ 🟡 Kritik │
│ [ ] │ SLK-112  │ Silikon │ ₺45   │ 0    │ 🔴 Stokta │
│     │          │        │       │      │    Yok     │
└─────┴──────────┴────────┴───────┴──────┴───────────┘
```

- Kolon genişlikleri içeriğe göre, son kolon esnek
- Status badge: yeşil(success), sarı(warning), kırmızı(danger), mavi(info), gri(neutral)
- Checkbox: satır seçimi, header checkbox tümünü seç
- Boş state: "Henüz ürün eklenmemiş" + illüstrasyon + [Yeni Ürün] butonu
- Loading state: 5 satırlı skeleton (gri pulse animasyon)
- Error state: "Yüklenemedi" + [Tekrar Dene] butonu

## 8.3 Drawer (Sağ Panel)

```
┌──────────────────────────────────────────────┬──────────────┐
│ Ana içerik (karartılmış)                     │ DRAWER       │
│                                              │ 400-600px    │
│                                              │              │
│                                              │ ┌─Başlık──┐  │
│                                              │ │Sipariş   │  │
│                                              │ │SDK-0042 ✕│  │
│                                              │ └─────────┘  │
│                                              │              │
│                                              │ ┌─İçerik──┐  │
│                                              │ │scroll    │  │
│                                              │ │edilebilir│  │
│                                              │ │alan      │  │
│                                              │ │          │  │
│                                              │ └─────────┘  │
│                                              │              │
│                                              │ ┌─Aksiyon─┐  │
│                                              │ │[Onayla]  │  │
│                                              │ │[Reddet]  │  │
│                                              │ └─────────┘  │
└──────────────────────────────────────────────┴──────────────┘
```

- Backdrop: yarı saydam siyah, tıklanınca kapanmaz (değişiklik varsa uyarı)
- Genişlik: masaüstü 480-600px, tablet 400px, mobil tam ekran
- Alt aksiyon bar'ı: sticky, gri arka plan
- İçerik scroll: bağımsız

## 8.4 Modal (Ortada)

```
┌────────────────────────────────────────────┐
│                    ✕                       │
│  ┌─ Modal Başlık ──────────────────────┐  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌─ Modal İçerik ──────────────────────┐  │
│  │ Form alanları, tablo, onay mesajı   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌─ Modal Aksiyon ──────────────────────┐ │
│  │              [İptal]    [Onayla]     │ │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

- Backdrop kapanmaz (değişiklik varsa)
- Max genişlik 520px, max yükseklik viewport %80
- Escape tuşu ve ✕ butonu iptal eder
- Form validasyon hatası: input altında kırmızı metin, input border kırmızı

## 8.5 Toast Bildirimleri

Sağ üst köşede, 4 tip:
- **Success:** Yeşil sol çizgi + check ikonu + mesaj, 3sn
- **Error:** Kırmızı sol çizgi + X ikonu + mesaj, 5sn
- **Warning:** Turuncu sol çizgi + ünlem ikonu + mesaj, 4sn
- **Info:** Mavi sol çizgi + bilgi ikonu + mesaj, 3sn

Her toast'ta ✕ kapatma butonu. Üst üste stack'lenir (max 5).

## 8.6 Mobil Admin Davranışı

- Sidebar: hamburger menü ile tam ekran overlay
- Data table: yatay kaydırılabilir veya kart görünümüne dönüşür
- Drawer: tam ekran
- Modal: tam ekrana yakın, alttan açılır (bottom sheet)
- Filtreler: drawer içinde
- Global arama: üst barda tam genişlik

## 8.7 Storefront Mobil Davranış

- Header: sticky, logo + arama ikonu + sepet
- Kategori menüsü: hamburger overlay
- Ürün grid: 2 sütun
- Ürün detay: tek sütun, galeri swipe, sepet butonu altta sticky
- Checkout: tek sütun, adım göstergesi üstte
- Sepet: sticky alt özet bar

---

# 9. Kritik İş Kuralları

## 9.1 Stok Ne Zaman Düşecek?

```
KURAL: Sipariş ONAYLANINCA stok REZERVE edilir.
       Sipariş KARGOYA VERİLİNCE stok DÜŞÜLÜR.

B2C akışı:
  Sipariş → Ödeme alındı → Stok rezerve → Kargoya verildi → Stok düşümü

B2B akışı:
  Sipariş → Admin onayı → Stok rezerve → Kargoya verildi → Stok düşümü

NEDEN: Sepetteyken stok düşülürse, sepet terklerinde stok şişer.
       Ödemede düşülürse, havale bekleyen siparişler stok şişirir.
       En güvenlisi: onayda rezerve et, sevkte düş.
```

## 9.2 Sipariş İptalinde Stok Ne Olacak?

```
KURAL: İptal edilen siparişin rezervasyonu RELEASED olur.
       Display stok = netsisStock - SUM(ACTIVE rezervasyon) anlık hesaplanır.

ADIMLAR:
1. Admin siparişi iptal eder
2. StockReservation.status → RELEASED, releaseReason → "Order cancelled SDK-0042"
3. displayStock yeniden hesaplanır (StockReservation ACTIVE'ler çıkarılır)
4. StockMovement kaydı: ORDER_CANCEL, quantity: +X, note: "SDK-0042 iptal"

DİKKAT: Eğer sipariş zaten SHIPPED ise iptal edilemez, iade süreci başlatılır.
```

## 9.3 Havale Siparişi Nasıl İlerleyecek?

```
1. Müşteri checkout'ta "Havale/EFT" seçer
2. Sipariş oluşur → status=APPROVED (B2C) veya PENDING_APPROVAL (B2B)
                       paymentStatus=PENDING
3. Müşteri banka hesabına havale yapar
4. Müşteri siteye girer → Havale Bildirim Formu
   → Sipariş no, banka, tutar, dekont girer
5. Admin panelde havale bildirimi listesine düşer
6. Muhasebe/Admin banka hesabını kontrol eder
7. Onaylarsa: paymentStatus=PAID, PaymentLog oluşur
   Reddederse: paymentStatus=PENDING kalır, ret sebebi yazılır
8. B2B ise ayrıca admin sipariş onayı bekler
```

## 9.4 Bayi Fiyatı Normal Fiyata Göre Nasıl Öncelik Alacak?

```
FİYAT HESAPLAMA SIRASI (öncelik sırasıyla):

1. DealerPricingOverride VARSA → onu kullan, DUR
   (Admin'in bu bayi + bu ürün için özel girdiği fiyat)

2. Dealer grubu iskontosu VARSA → basePrice - (basePrice * iskonto%)
   (Bayinin bağlı olduğu grubun genel iskonto oranı)

3. Discount tablosunda PRODUCT/CATEGORY/BRAND indirimi VARSA → uygula

4. Yoksa → basePrice (normal satış fiyatı)

5. En son → KDV ekle: finalPrice * (1 + taxRate)

KRİTİK: Bayi ASLA perakende fiyatını göremez.
        API'de DEALER rolü için fiyat hesaplaması ayrı yapılır.
```

## 9.5 Ürün Pasife Alınırsa Eski Siparişlerde Ne Olacak?

```
KURAL: Ürün SILINMEZ, soft-delete veya pasife alınır.
       Eski siparişlerdeki ürün bilgisi ETKİLENMEZ.

UYGULAMA:
- Product.visible = false → sitede görünmez
- Product.purchasable = false → sepete eklenemez
- OrderLine.productId → ürün pasif olsa da ilişki kopmaz
- Sipariş detayında ürün bilgisi her zaman gösterilir
- Admin panelde pasif ürünler filtrelenebilir

KESİNLİKLE YAPMA: Ürünü veritabanından silme (hard delete).
                  Cascade delete KULLANMA.
```

## 9.6 Eski URL'ler Yeni URL'lere Nasıl Yönlenecek?

```
1. Eski site URL'leri tespit edilir (sitemap, DB dökümü)
2. Yeni site slug'ları ile eşleştirilir
3. seo_redirects tablosuna kaydedilir:
   { oldUrl: "/eski-urun-sayfasi", newUrl: "/urun/yeni-urun", active: true }

4. Nuxt server middleware:
   Her request'te seo_redirects tablosuna bak.
   Eşleşen varsa → 301 redirect (kalıcı yönlendirme).
   SEO değeri aktarılır.

5. Toplu import: CSV (eski_url, yeni_url) ile admin panelden.

ÖRNEK:
  /kategori/banyo → /kategori/banyo (aynıysa gerek yok)
  /urun/eski-sku → /urun/yeni-slug
  /sayfa/hakkimizda → /sayfa/hakkimizda
```

## 9.7 Excel Import Hatalı Satırları Nasıl Raporlayacak?

```
1. Dosya upload edilir → ImportJob oluşur (status=PENDING)
2. BullMQ job başlar → status=PROCESSING
3. Her satır validate edilir:
   - SKU boş mu?
   - İsim boş mu?
   - Fiyat geçerli sayı mı? > 0 mı?
   - Kategori/Marka sistemde var mı?
   - SKU zaten var mı? (varsa update, yoksa insert)
4. Hatalı satırlar toplanır:
   errorReport: [
     { row: 5, sku: "", errors: ["SKU zorunlu", "Fiyat geçersiz"] },
     { row: 23, sku: "ABC", errors: ["Marka bulunamadı: XYZ"] }
   ]
5. İşlem bitince:
   - successRows: X, errorRows: Y
   - status=COMPLETED (hata olsa da, kısmi başarı)
   - errorReport JSON olarak ImportJob'ta saklanır
6. Kullanıcıya sonuç gösterilir:
   "150 ürün içe aktarıldı, 5 satır hatalı."
   [Hata Raporunu İndir (Excel)] butonu
7. Hata raporu Excel: orijinal satır + hata sütunu eklenmiş
```

---

# 10. İlk Kodlama Öncesi Kontrol Listesi

## 10.1 Firmaya Sorulacak Sorular

- [ ] **Ürün verileri:** Eski sistemden Excel/CSV olarak alınabiliyor mu? Hangi formatta?
- [ ] **Görseller:** Kaç adet ürün görseli var? Hangi formatta? Dosya isimlendirme standardı var mı? Toplam boyut?
- [ ] **Bayi listesi:** Mevcut bayi listesi Excel'de var mı? Cari kodları belli mi?
- [ ] **Fiyatlandırma:** Bayi grupları neler? (Gold/Silver/Bronze?) Her grup için iskonto oranı ne?
- [ ] **KDV oranları:** Hangi ürün gruplarında hangi KDV oranı geçerli?
- [ ] **Kargo:** Hangi kargo firmaları ile çalışılıyor? Ücretsiz kargo limiti var mı?
- [ ] **Banka hesapları:** Havale için hangi banka hesapları kullanılacak? IBAN'lar?
- [ ] **Domain:** Yeni sistem hangi domain'de çalışacak? SSL hazır mı?
- [ ] **E-posta:** Hangi SMTP sunucu kullanılacak? Canmail hesabı hazır mı?
- [ ] **Eski site:** Eski siteye erişim var mı? Veritabanı dökümü alınabiliyor mu?
- [ ] **Logo ve kurumsal kimlik:** Logo dosyaları (SVG/PNG), renk kodları, font?

## 10.2 Teknik Kararlar

- [ ] **File storage:** MVP'de lokal disk mi, S3-compatible mi? (Öneri: MVP'de lokal, `/uploads` dizini, production'da volume mount)
- [ ] **Redis:** MVP'de zorunlu değil. Queue için BullMQ Redis istiyor. Docker'da Redis container'ı ayağa kaldırılacak mı?
- [ ] **Backup stratejisi:** `scripts/backup-db.sh` mevcut. Cron job ayarlanacak mı?
- [ ] **Log seviyesi:** Production'da `info`, development'ta `debug`.
- [ ] **Rate limiting:** Mevcut. Production değerleri yeterli mi kontrol et.
- [ ] **Docker:** Production `docker-compose.prod.yml` mevcut. Sunucuda Docker kurulu mu?
- [ ] **CI/CD:** MVP'de manuel deploy. V1'de GitHub Actions düşünülebilir.

## 10.3 Veri Taşıma Kararları

- [ ] **Ürün import sırası:** Önce kategoriler, sonra markalar, sonra ürünler.
- [ ] **Müşteri import:** Eski müşteriler taşınacak mı? Şifreler hash'lenmiş mi? Hangi algoritma?
- [ ] **Sipariş import:** Eski siparişler taşınacak mı? (Öneri: taşıma, eski sistem read-only kalsın)
- [ ] **SEO redirect:** Eski URL yapısı biliniyor mu? Otomatik eşleştirme mi manuel mi?
- [ ] **Görsel taşıma:** Eski görseller hangi sunucuda? Toplu indirme mümkün mü?
- [ ] **Veri temizleme:** Eksik/bozuk veri için kurallar netleşti mi? (bkz. tasarım dokümanı bölüm 29.3)

## 10.4 Ödeme / Kargo / ERP Kararları

- [ ] **Ödeme (MVP):** Sadece havale ile başlanacak. Sanal POS hangi sağlayıcı? iyzico, PayTR, başka?
- [ ] **Kargo (MVP):** Takip numarası manuel girilecek. Kargo API entegrasyonu V2'ye ertelensin mi?
- [ ] **Netsis:** API hazır mı? Değilse manuel süreç devam etsin mi?
- [ ] **Alneo:** E-fatura API'si hazır mı? Değilse fatura takibi manuel Excel'den yapılsın mı?
- [ ] **E-posta:** SMTP bilgileri alındı mı? MVP'de mailer console'a yazıyor, production'da gerçek SMTP ayarlanacak.

## 10.5 Tasarım Kararları

- [ ] **Renk paleti:** Sadöksan kurumsal renkleri netleşti mi? (Logo'dan primary renk çıkarılacak)
- [ ] **Font:** Inter (hızlı, modern) yeterli mi? Kurumsal font var mı?
- [ ] **Mobil öncelik:** Storefront tasarımı mobil-first onaylandı mı?
- [ ] **Admin tema:** Mevcut Nuxt admin template yeterli mi? Shadcn-vue, PrimeVue, yoksa custom?
- [ ] **Ürün kartı tasarımı:** Marka görünürlüğü, fiyat gösterimi, stok badge onaylandı mı?

---

## Özet: Geliştirici İçin İlk Hafta Planı

```
Gün 1:   TASK-01 (Migration) + ADIM-0.2 (Auth kontrolü)
Gün 2:   TASK-02 (StockService) başla
Gün 3:   TASK-02 tamamla + TASK-03 (Admin stok sayfası) başla
Gün 4:   TASK-03 tamamla + TASK-04 (Havale bildirim) başla
Gün 5:   TASK-04 tamamla + TASK-05 (Sipariş detay drawer) başla
```

---

*Bu rehber Sadöksan İnşaat custom e-ticaret projesinin geliştirme fazı için hazırlanmıştır. Her task bağımsız test edilebilir ve tamamlandığında PR açılabilir şekilde tanımlanmıştır.*
