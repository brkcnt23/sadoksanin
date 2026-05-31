# Sadöksan İnşaat — E-Ticaret Altyapısı Sistem Tasarım Dokümanı

**Versiyon:** 1.0  
**Tarih:** 2026-05-25  
**Hazırlayan:** Product Architecture & System Design  
**Proje Kodu:** SDK-ERP-V2  

---

## İçindekiler

1. [Proje Özeti](#1-proje-özeti)
2. [İş Modeli Analizi](#2-i̇ş-modeli-analizi)
3. [Kullanıcı Rolleri](#3-kullanıcı-rolleri)
4. [Müşteri Tarafı E-Ticaret Özellikleri](#4-müşteri-tarafı-e-ticaret-özellikleri)
5. [B2B / Bayi Tarafı Özellikleri](#5-b2b--bayi-tarafı-özellikleri)
6. [Admin Panel Modülleri](#6-admin-panel-modülleri)
7. [Ürün Yönetimi Detayları](#7-ürün-yönetimi-detayları)
8. [Kategori ve Marka Yönetimi](#8-kategori-ve-marka-yönetimi)
9. [Stok Yönetimi](#9-stok-yönetimi)
10. [Sipariş Yönetimi](#10-sipariş-yönetimi)
11. [Fiyatlandırma Motoru](#11-fiyatlandırma-motoru)
12. [Kampanya ve Kupon Sistemi](#12-kampanya-ve-kupon-sistemi)
13. [Ödeme Sistemi](#13-ödeme-sistemi)
14. [Kargo ve Teslimat Yönetimi](#14-kargo-ve-teslimat-yönetimi)
15. [İptal / İade / Değişim Yönetimi](#15-i̇ptal--i̇ade--deği̇şi̇m-yöneti̇mi̇)
16. [Müşteri ve Bayi Yönetimi](#16-müşteri-ve-bayi-yönetimi)
17. [İçerik Yönetimi](#17-i̇çerik-yönetimi)
18. [SEO Yönetimi](#18-seo-yönetimi)
19. [Raporlama ve Dashboard](#19-raporlama-ve-dashboard)
20. [Bildirim Sistemi](#20-bildirim-sistemi)
21. [Loglama ve Denetim Geçmişi](#21-loglama-ve-denetim-geçmi̇şi̇)
22. [Entegrasyonlar](#22-entegrasyonlar)
23. [Veri Modeli Taslağı](#23-veri-modeli-taslağı)
24. [API Endpoint Taslağı](#24-api-endpoint-taslağı)
25. [Admin Panel Menü Ağacı](#25-admin-panel-menü-ağacı)
26. [UI/UX Tasarım İlkeleri](#26-uiux-tasarım-i̇lkeleri)
27. [Güvenlik Gereksinimleri](#27-güvenlik-gereksi̇ni̇mleri̇)
28. [Performans Gereksinimleri](#28-performans-gereksi̇ni̇mleri̇)
29. [Migration / Veri Taşıma Planı](#29-migration--veri-taşıma-plani)
30. [MVP Kapsamı](#30-mvp-kapsamı)
31. [V1 Kapsamı](#31-v1-kapsamı)
32. [V2 / İleri Seviye Kapsam](#32-v2--i̇leri̇-sevi̇ye-kapsam)
33. [Riskler ve Dikkat Edilecek Noktalar](#33-riskler-ve-di̇kkat-edilecek-noktalar)
34. [Kabul Kriterleri](#34-kabul-kri̇terleri̇)
35. [Geliştirme Sprint Planı](#35-geli̇şti̇rme-sprint-plani)

---

## 1. Proje Özeti

### 1.1 Amaç

Sadöksan İnşaat için, hazır paket e-ticaret sistemlerinin kısıtlamalarından bağımsız; firmanın gerçek iş akışına, ürün tiplerine, bayi/müşteri mantığına, stok yapısına ve operasyon ekibinin günlük kullanımına uygun; B2C + B2B destekli; ERP, muhasebe, ödeme, kargo ve e-fatura entegrasyonlarına açık **custom bir e-ticaret altyapısı** tasarlamak ve hayata geçirmek.

### 1.2 Kapsam

| Katman | Kapsam |
|--------|--------|
| **Storefront** | B2C perakende satış + B2B bayi portalı (tek çatı altında, rolle ayrışan) |
| **Admin Panel** | Ürün, stok, sipariş, bayi, müşteri, fiyat, kampanya, içerik, rapor yönetimi |
| **API** | Tüm iş mantığının çalıştığı REST API |
| **Entegrasyonlar** | Netsis (ERP), Alneo (e-fatura), Ödeme (sanal POS), Kargo, SMS/WhatsApp |

### 1.3 Mevcut Durum

Mevcut projede aşağıdaki modüller halihazırda geliştirilmiş durumdadır:

- ✅ Auth (JWT, register/login, şifre sıfırlama)
- ✅ Ürün CRUD, kategori, marka, varyasyon
- ✅ Sipariş yaşam döngüsü (oluşturma → onay → sevk → tamamlanma)
- ✅ Sepet (API + localStorage fallback)
- ✅ Favoriler
- ✅ Adres defteri
- ✅ Bayi profili, onay akışı, cari
- ✅ Proforma PDF (Python Flask servisi)
- ✅ İndirimler (ürün/kategori/marka bazlı)
- ✅ Kampanya popup'ları
- ✅ Bölgesel/şehir bazlı fiyatlandırma
- ✅ Stok rezervasyon sistemi
- ✅ Audit log
- ✅ Site içerik yönetimi (hero banner, ayarlar)
- ✅ Excel import/export
- ✅ Docker geliştirme ve production ortamları

**Bu doküman**, mevcut sistemin üzerine inşa edilecek ek özellikleri, iyileştirmeleri ve uzun vadeli vizyonu kapsar.

### 1.4 Teknik Stack (Mevcut + Önerilen)

| Bileşen | Mevcut | Durum |
|---------|--------|-------|
| **Frontend** | Nuxt 4 (SSR) | ✅ Uygun |
| **Admin** | Nuxt 4 (SPA) | ✅ Uygun |
| **Backend** | NestJS 11+ | ✅ Uygun |
| **ORM** | Prisma 7.8+ | ✅ Uygun |
| **Database** | PostgreSQL 15+ | ✅ Uygun |
| **Cache** | Redis (opsiyonel) | 🟡 MVP'de zorunlu değil |
| **Queue** | BullMQ + Redis | ✅ Mevcut |
| **File Storage** | Local / S3-compatible | 🟡 MVP'de lokal, V1'de S3 |
| **PDF** | Python Flask | ✅ Mevcut |
| **Container** | Docker | ✅ Mevcut |

---

## 2. İş Modeli Analizi

### 2.1 Mevcut İş Modeli

Sadöksan İnşaat üç kanallı bir satış modeline sahiptir:

| Kanal | Açıklama | Ciro Payı (Tahmini) |
|-------|----------|---------------------|
| **Perakende (B2C)** | Son tüketiciye bireysel satış | %20-30 |
| **Toptan/Bayi (B2B)** | Bayilere toptan satış, cari hesaplı | %50-60 |
| **Proje Satış** | Büyük inşaat projelerine özel fiyatlandırma | %10-20 |

### 2.2 Ürün Grupları ve Satış Dinamikleri

| Ürün Grubu | Satış Birimi | Stok Takip | Fiyatlandırma | Kargo |
|------------|-------------|------------|---------------|-------|
| **Seramik/Fayans** | m², koli | m² bazlı | Ebat ve seriye göre | Ağır, özel nakliye |
| **Banyo Dolabı** | adet, set | Adet bazlı | Modele göre | Hacimli |
| **Batarya/Musluk** | adet | Adet bazlı | Marka modele göre | Standart kargo |
| **Duş Sistemleri** | set, adet | Adet bazlı | Seriye göre | Standart kargo |
| **Yapı Kimyasalları** | torba, kg, adet | Kg/torba bazlı | Hacme göre iskonto | Ağırlıklı kargo |
| **Silikon/Köpük** | adet, koli | Adet bazlı | Marka bazlı | Standart kargo |
| **Sarf Malzemeleri** | adet, paket | Adet bazlı | Sabit fiyat | Standart kargo |

### 2.3 Kritik İş Kuralları

1. **Bayiler perakende fiyatını göremez** — kendi özel fiyat listelerini görür
2. **B2B siparişler admin onayına düşer** — cari bakiye ve risk kontrolü yapılır
3. **Stok, sipariş onayında rezerve edilir** — sepetteyken stok düşülmez
4. **Ağır/hacimli ürünlerde kargo ayrı hesaplanır** — desi ve bölge bazlı
5. **KDV oranları ürün bazında değişebilir** — %1, %10, %20
6. **Minimum sipariş miktarları olabilir** — özellikle B2B'de koli bazlı satış

---

## 3. Kullanıcı Rolleri

### 3.1 Rol Matrisi

| Rol | Açıklama | Panel Erişimi | Kritik Yetkiler |
|-----|----------|---------------|-----------------|
| **SUPER_ADMIN** | Sistem sahibi, tam yetki | Admin panel (tam) | Her şey, kullanıcı ve rol yönetimi dahil |
| **ADMIN** | Genel yönetici | Admin panel (geniş) | Ürün, sipariş, bayi, fiyat, rapor |
| **SALES_STAFF** | Satış personeli | Admin panel (kısıtlı) | Siparişleri görme/düzenleme, bayi iletişimi |
| **WAREHOUSE_STAFF** | Depo personeli | Admin panel (kısıtlı) | Stok yönetimi, sipariş hazırlama, kargo takip |
| **ACCOUNTING** | Muhasebe | Admin panel (kısıtlı) | Ödeme onayı, fatura, cari hesap, iade |
| **CONTENT_EDITOR** | İçerik editörü | Admin panel (kısıtlı) | Sayfalar, banner, SEO, blog |
| **DEALER** | Bayi | Bayi paneli | Sipariş verme, kendi raporları, cari görüntüleme |
| **CUSTOMER** | Bireysel müşteri | Hesabım | Sipariş verme, takip, profil yönetimi |
| **GUEST** | Misafir kullanıcı | Yok | Ürün görüntüleme, sepete ekleme, misafir alışveriş |

### 3.2 Detaylı Yetki Matrisi

#### SUPER_ADMIN
**Erişim:** Her şey  
**Yapabilir:**
- Kullanıcı ve rol yönetimi (CRUD)
- Tüm admin işlemleri
- Sistem ayarları (bakım modu, entegrasyon anahtarları)
- Log ve audit görüntüleme
- Veritabanı yedeği alma (opsiyonel)

**Yapamaz:** Yok

#### ADMIN
**Erişim:** Dashboard, Ürünler, Siparişler, Müşteriler, Stok, Fiyat, Kampanya, Kargo, İçerik, SEO, Raporlar  

**Yapabilir:**
- Ürün CRUD, toplu işlemler, Excel import/export
- Sipariş durumu değiştirme, onaylama, iptal
- Bayi onaylama/reddetme
- Stok manuel giriş/çıkış, sayım düzeltme
- Fiyat güncelleme, kampanya oluşturma
- İçerik sayfaları düzenleme
- Rapor görüntüleme ve export

**Yapamaz:**
- Kullanıcı/rol yönetimi
- Sistem ayarları (bazıları kısıtlı)
- Entegrasyon yapılandırması

**Onay Gereken İşlemler:**
- Yok (doğrudan yapabilir)

#### SALES_STAFF
**Erişim:** Dashboard, Siparişler (görüntüleme), Müşteriler (görüntüleme), Bayiler (görüntüleme), Raporlar (kısıtlı)  

**Yapabilir:**
- Siparişleri görüntüleme ve arama
- Müşteri/bayi bilgilerini görüntüleme
- Siparişe admin notu ekleme
- Müşteriyle iletişim için bildirim gönderme
- Temel satış raporları görüntüleme

**Yapamaz:**
- Ürün CRUD
- Sipariş durumu değiştirme (sadece not ekleyebilir)
- Stok işlemleri
- Fiyat değiştirme
- Bayi onaylama

#### WAREHOUSE_STAFF
**Erişim:** Dashboard, Siparişler (kısıtlı), Stok  

**Yapabilir:**
- Stok durumu görüntüleme
- Stok hareketi girişi (sayım, fire, hasar)
- Siparişleri "hazırlanıyor" → "kargoya hazır" olarak işaretleme
- Kargo takip numarası girme
- Kritik stok uyarılarını görme

**Yapamaz:**
- Ürün CRUD
- Sipariş onaylama/iptal
- Fiyat değiştirme
- Bayi/müşteri yönetimi

#### ACCOUNTING
**Erişim:** Dashboard, Siparişler (ödeme), Ödemeler, Bayiler (cari), Raporlar  

**Yapabilir:**
- Havale/EFT ödemelerini onaylama
- Ödeme kayıtlarını görüntüleme
- Fatura durumu takibi
- Cari hesap görüntüleme
- İade onayı ve ödeme iadesi takibi
- Mali raporlar

**Yapamaz:**
- Ürün CRUD
- Sipariş durumu değiştirme (ödeme durumu hariç)
- Stok işlemleri

**Onay Gereken İşlemler:**
- Büyük tutarlı iadeler (SUPER_ADMIN onayı)

#### CONTENT_EDITOR
**Erişim:** İçerik, SEO, Banner  

**Yapabilir:**
- Sayfa içeriklerini düzenleme
- Banner ve slider yönetimi
- SEO meta alanlarını düzenleme
- Blog/haber ekleme
- SSS yönetimi

**Yapamaz:**
- Ürün/sipariş/stok işlemleri
- Kullanıcı yönetimi
- Fiyat değiştirme

#### DEALER (Bayi)
**Erişim:** Bayi paneli  

**Yapabilir:**
- Kendi fiyatlarıyla ürünleri görüntüleme
- Sipariş oluşturma
- Kendi siparişlerini takip etme
- Proforma fatura oluşturma
- Cari hesap görüntüleme
- Raporlar (kendi verileri)
- Profil güncelleme

**Yapamaz:**
- Diğer bayilerin verilerini görme
- Perakende fiyatlarını görme
- Admin paneline erişim

#### CUSTOMER (Bireysel Müşteri)
**Erişim:** Storefront + Hesabım  

**Yapabilir:**
- Ürünleri perakende fiyatla görüntüleme
- Sepete ekleme, sipariş oluşturma
- Kendi siparişlerini takip
- Favorilere ekleme
- Adres defteri yönetimi
- Profil güncelleme
- Havale bildirimi yapma

**Yapamaz:**
- Bayi fiyatlarını görme
- Admin paneline erişim

#### GUEST (Misafir)
**Erişim:** Sadece storefront  

**Yapabilir:**
- Ürünleri görüntüleme
- Sepete ekleme
- Misafir olarak sipariş tamamlama
- Havale bildirimi yapma

**Yapamaz:**
- Sipariş geçmişi görme (üye değilse)
- Favori ekleme
- Bayi fiyatlarını görme

---

## 4. Müşteri Tarafı E-Ticaret Özellikleri

### 4.1 Ana Sayfa

**MVP'de olmalı:** Evet

| Bileşen | Açıklama | Öncelik |
|---------|----------|---------|
| Hero banner / slider | Tam genişlik, kampanya ve kurumsal mesaj | MVP |
| Kategori kartları | Görselli, ana kategorilere hızlı link | MVP |
| Öne çıkan ürünler | Admin tarafından seçilen, manuel sıralı | MVP |
| Yeni ürünler | Son eklenenler, otomatik | MVP |
| Çok satanlar | Sipariş adedine göre otomatik | V1 |
| Kampanya alanı | Aktif kampanya duyurusu | V1 |
| Marka logosu slider'ı | Anlaşmalı markalar | V1 |
| Kurumsal bilgi bandı | 23 yıl tecrübe, 4000+ ürün, 50+ marka | MVP |
| Footer | Kurumsal linkler, iletişim, sosyal medya | MVP |
| Popup | Kampanya/duyuru, kapatılabilir | V1 |

### 4.2 Ürün Listeleme Sayfası (PLP)

**MVP'de olmalı:** Evet

| Özellik | Detay |
|---------|-------|
| Grid/list görünüm | Varsayılan grid, 3-4 sütun |
| Sıralama | Varsayılan, fiyat artan/azalan, isim A-Z/Z-A, yeniden eskiye |
| Filtreleme | Kategoriye özel dinamik filtreler |
| Sayfalama | "Daha fazla yükle" veya numaralı sayfalama |
| Ürün kartı | Görsel, marka, isim, fiyat, stok durumu, sepete ekle |
| Quick view | Hızlı görüntüleme modal'ı (opsiyonel) |
| Stok durumu | Stokta var/yok, kritik stok uyarısı |
| Fiyat gösterimi | KDV dahil, indirimli fiyat çizgili |

### 4.3 Ürün Detay Sayfası (PDP)

**MVP'de olmalı:** Evet — en kritik sayfa

| Alan | Zorunluluk | Açıklama |
|------|-----------|----------|
| Ürün adı | MVP | SEO başlığı da olabilir |
| SKU / ürün kodu | MVP | Stok takip için |
| Marka (linkli) | MVP | Marka sayfasına link |
| Kategori breadcrumb | MVP | SEO + navigasyon |
| Ana görsel + zoom | MVP | Büyütülebilir, lightbox |
| Görsel galerisi | MVP | Thumbnail'ler, kaydırmalı |
| Fiyat | MVP | KDV dahil, indirimli fiyat çizgili |
| KDV bilgisi | MVP | "KDV dahil" ibaresi |
| Stok durumu | MVP | Stokta var/yok, adet gösterimi |
| Varyant seçimi | MVP | Örn: ebat, renk, seri — stok ve fiyat değişmeli |
| Birim tipi | MVP | adet, m², kg, torba, koli, paket, set |
| Miktar seçici | MVP | +/- buton, min/max sınır |
| Sepete ekle butonu | MVP | Stok yoksa "Stok habercisi"ne dönüşür |
| Hemen al butonu | V1 | Direkt checkout |
| Favori butonu | MVP | Kalp ikonu |
| Ürün açıklaması | MVP | HTML rich text |
| Teknik özellikler | MVP | Tablo formatında |
| Kullanım alanı | V1 | Hangi alanda kullanılır |
| Teslimat bilgisi | V1 | Tahmini süre, kargo ücreti |
| Kargo/desi bilgisi | V1 | Ağırlık, desi |
| Benzer ürünler | V1 | Aynı kategoriden |
| Tamamlayıcı ürünler | V2 | Admin manuel eşleştirme |
| Dosya ekleri | V1 | Teknik föy, katalog, kullanım kılavuzu (PDF) |
| SEO title/meta | MVP | Sayfa başlığı ve meta description |
| Schema.org Product | V1 | Google zengin sonuçlar için JSON-LD |
| Sosyal paylaşım | V2 | WhatsApp, Facebook, Twitter |

### 4.4 Kategori Sayfası

**MVP'de olmalı:** Evet

- Kategori açıklaması (opsiyonel, SEO için)
- Alt kategoriler grid'i
- Filtrelenmiş ürün listesi
- Kategoriye özel dinamik filtreler
- Breadcrumb

### 4.5 Marka Sayfası

**MVP'de olmalı:** Evet

- Marka logosu ve açıklaması
- Markaya ait ürün listesi
- Filtreleme (marka sabit, diğer filtreler açık)

### 4.6 Arama Sonuçları

**MVP'de olmalı:** Evet

- Anlık arama (minimum 3 karakter)
- Sonuç sayısı gösterimi
- Filtreleme ve sıralama (PLP ile aynı)
- "Sonuç bulunamadı" durumu + öneriler
- Arama terimi vurgulama

### 4.7 Sepet

**MVP'de olmalı:** Evet

| Özellik | Durum |
|---------|-------|
| Ürün listesi (görsel, isim, varyant, fiyat, miktar, toplam) | MVP |
| Miktar güncelleme (+/- veya input) | MVP |
| Ürün silme | MVP |
| Kupon kodu girişi | V1 |
| Sepet özeti (ara toplam, KDV, indirim, genel toplam) | MVP |
| Boş sepet durumu | MVP |
| Login olunca localStorage sepeti API sepetiyle birleştirme | MVP |

### 4.8 Checkout / Ödeme

**MVP'de olmalı:** Evet

| Adım | İçerik |
|------|--------|
| 1. Adres | Teslimat adresi seçimi veya yeni adres, fatura adresi |
| 2. Ödeme | Havale/EFT veya kredi kartı (V1) seçimi |
| 3. Onay | Sipariş özeti, sözleşme onayı, siparişi tamamla |

### 4.9 Sipariş Sonucu

- Sipariş numarası
- Ödeme yöntemine göre yönlendirme
- Havale ise: banka bilgileri + havale bildirim linki
- Kart ise: ödeme başarılı/bekliyor mesajı

### 4.10 Sipariş Takip

**MVP'de olmalı:** Evet

- Sipariş numarası ve durumu
- Durum zaman çizelgesi (görsel)
- Ürün listesi
- Kargo takip linki (varsa)
- İptal/iade talebi butonu

### 4.11 Üyelik / Giriş / Kayıt

- E-posta + şifre ile kayıt
- E-posta + şifre ile giriş
- Şifremi unuttum → e-posta ile sıfırlama

### 4.12 Hesabım

| Sekme | İçerik |
|-------|--------|
| Profil | Ad, soyad, e-posta, telefon, şifre değiştir |
| Adreslerim | CRUD, varsayılan adres seçimi |
| Siparişlerim | Liste, filtre, detay, iptal/iade talebi |
| Favorilerim | Liste, sepete ekle, kaldır |
| Havale Bildirimlerim | Yaptığım bildirimler ve durumları |

### 4.13 Kurumsal Sayfalar

| Sayfa | MVP |
|-------|-----|
| Hakkımızda | ✅ |
| İletişim (form + harita + bilgiler) | ✅ |
| SSS | ✅ |
| Teslimat ve İade Koşulları | ✅ |
| KVKK / Gizlilik Politikası | ✅ |
| Mesafeli Satış Sözleşmesi | ✅ |
| Banka Hesapları | ✅ |
| Blog / Haberler | V1 |

### 4.14 Havale Bildirim Formu

**MVP'de olmalı:** Evet

- Sipariş numarası (dropdown veya manuel)
- Ad soyad
- Banka seçimi
- Ödenen tutar
- Dekont yükleme (resim/PDF, max 5MB)
- Açıklama
- Admin onayına düşer, onaylanınca sipariş ödeme alındı durumuna geçer

---

## 5. B2B / Bayi Tarafı Özellikleri

### 5.1 Bayi Başvuru Akışı

```
Bayi başvuru formu → Admin inceleme → Onay/Ret → Bayi aktif
```

| Adım | Açıklama |
|------|----------|
| 1. Başvuru formu | Firma adı, vergi no, vergi dairesi, yetkili, telefon, e-posta, şehir, adres |
| 2. Admin inceleme | Dashboard'da bekleyen başvuru kartı, detaylı inceleme |
| 3. Cari tanımlama | Admin, bayi için cari kod girer (veya Netsis'ten çeker) |
| 4. Fiyat grubu atama | Admin, bayiye fiyat listesi veya iskonto oranı atar |
| 5. Onay | Bayiye e-posta ile bildirim, şifre belirleme linki |
| 6. İlk giriş | Bayi şifresini belirler, panele giriş yapar |

### 5.2 Bayi Paneli

**MVP'de olmalı:** Evet (mevcut sistemde var)

| Modül | İçerik |
|-------|--------|
| Dashboard | Aylık ciro, bekleyen sipariş, cari bakiye |
| Ürünler | Bayi fiyatlarıyla ürün kataloğu, filtreleme |
| Sepet | Standart sepet, bayi fiyatlarıyla |
| Siparişlerim | Liste, durum takibi, tekrar sipariş |
| Cari Hareketler | Netsis'ten gelen cari hesap dökümü (🔴 Netsis bekleniyor) |
| Faturalarım | E-fatura listesi, PDF indirme (🔴 Alneo bekleniyor) |
| Proforma | Proforma fatura oluşturma ve indirme |
| Raporlar | 8 rapor tipi (aylık, yıllık, fatura, detay, stok, risk, yaşlandırma, performans) |
| Adresler | Teslimat adresleri CRUD |
| Hesap Bilgileri | Profil, şifre, firma bilgileri |

### 5.3 Bayi Fiyatlandırma Kuralları

1. Her bayi bir fiyat grubuna ait olabilir (örn: Gold, Silver, Bronze)
2. Fiyat grubu bazında genel iskonto oranı tanımlanabilir
3. Ürün bazında özel bayi fiyatı override edilebilir
4. Kategori/marka bazında ek iskonto tanımlanabilir
5. Bayi siparişi oluştururken kendi fiyatlarını görür
6. Sipariş anında fiyat snapshot olarak kaydedilir

### 5.4 Bayi Sipariş Onay Akışı

```
Bayi sipariş oluşturur → Admin'e bildirim → Admin cari bakiye kontrolü → Onay/Ret
```

| Kural | Açıklama |
|-------|----------|
| Otomatik onay | Cari bakiyesi yeterli ve risk skoru düşükse |
| Manuel onay | Cari bakiye aşımı veya risk skoru yüksekse |
| Ret | Admin manuel reddeder, sebep yazar |
| Stok etkisi | Onaylanınca stok rezerve edilir |

---

## 6. Admin Panel Modülleri

### 6.1 Genel Mimari

Admin panel, Nuxt 4 ile SPA olarak çalışır. `/sadoksan-panel` rotasından erişilir.

```
┌──────────────┬──────────────────────────────────────┐
│  Sol Sidebar │  Üst Bar (breadcrumb + profil)       │
│              ├──────────────────────────────────────┤
│  • Dashboard │                                      │
│  • Ürünler   │         İçerik Alanı                 │
│  • Siparişler│                                      │
│  • Müşteriler│                                      │
│  • Stok      │                                      │
│  • Fiyat     │                                      │
│  • Ödeme     │                                      │
│  • Kargo     │                                      │
│  • İçerik    │                                      │
│  • SEO       │                                      │
│  • Raporlar  │                                      │
│  • Sistem    │                                      │
└──────────────┴──────────────────────────────────────┘
```

### 6.2 Dashboard

**Kartlar (MVP):**

| Kart | Veri Kaynağı |
|------|-------------|
| Bugünkü sipariş sayısı | COUNT orders WHERE date=today |
| Bugünkü ciro | SUM total WHERE date=today |
| Haftalık ciro | SUM total WHERE week=this |
| Aylık ciro | SUM total WHERE month=this |
| Bekleyen siparişler | COUNT WHERE status=PENDING_APPROVAL |
| Ödeme bekleyenler | COUNT WHERE paymentStatus=PENDING |
| Kritik stoktaki ürünler | COUNT WHERE displayStock <= minimumStock |
| Bayi başvuruları | COUNT WHERE status=PENDING |

**Listeler:**

- Son 10 sipariş (hızlı durum değiştirme butonu ile)
- Kritik stok uyarıları

---

## 7. Ürün Yönetimi Detayları

### 7.1 Ürün Tipleri

| Tip | Açıklama | MVP | Örnek |
|-----|----------|-----|-------|
| Basit ürün | Tek SKU, varyantsız | ✅ | Silikon tüpü, mastik |
| Varyantlı ürün | Birden çok varyant (ebat, renk) | ✅ | 60x120 seramik (bej, gri, beyaz) |
| Paket/set ürün | Birden çok üründen oluşan set | V1 | Banyo seti (dolap+lavabo+ayna) |
| Bayiye özel ürün | Sadece B2B'de görünür | ✅ | Toptan koli ürünler |
| Stok dışı sipariş | Stokta yok ama sipariş alınabilir | V1 | Özel sipariş seramik |
| Teklife özel | Sadece fiyat teklifi alınabilir | V2 | Proje bazlı ürünler |
| Ağır/hacimli | Özel kargo hesabı | V1 | Banyo dolabı, palet seramik |
| Mağazadan teslim | Kargo ile gönderilemez | V1 | Büyük ebat seramik |
| m² bazlı ürün | Metrekare ile satılır | ✅ | Seramik, fayans |
| Koli bazlı ürün | Koli ile satılır | ✅ | Seramik (1 koli = 1.44 m²) |
| Adet bazlı ürün | Tane ile satılır | ✅ | Batarya, musluk |
| Kg/torba bazlı | Ağırlık ile satılır | ✅ | Yapı kimyasalı, derz dolgusu |

### 7.2 Ürün Oluşturma / Düzenleme Formu

**MVP alanları:**

| Alan Grubu | Alanlar |
|------------|---------|
| Temel | Ürün adı, SKU, Netsis kodu, barkod |
| Sınıflandırma | Kategori, marka |
| Fiyat | Satış fiyatı, bayi fiyatı (opsiyonel), KDV oranı |
| Stok | Netsis stok, min/max stok seviyesi |
| Fiziksel | Birim tipi, ağırlık (kg), ebat, desi |
| Görsel | Ana görsel, galeri (çoklu yükleme, sürükle-bırak) |
| Açıklama | Kısa açıklama, detaylı açıklama (rich text), teknik özellikler |
| Görünürlük | Sitede göster/gizle, sadece bayi, herkese açık |
| Durum | Aktif, pasif, taslak, stokta yok, yakında |
| Diğer | Sıralama, öne çıkan, yeni ürün, çok satan |
| Dosya | Teknik föy (PDF), katalog (PDF), kullanım kılavuzu (PDF) |
| SEO | SEO başlığı, meta açıklama, URL slug, canonical URL, OG görseli |

### 7.3 Varyant Yönetimi

```
Ana ürün: Seramik 60x120
├── Varyant 1: Bej, SKU: SRM-60-120-BJ, Stok: 250 m², Fiyat: 320 TL/m²
├── Varyant 2: Gri, SKU: SRM-60-120-GR, Stok: 180 m², Fiyat: 320 TL/m²
└── Varyant 3: Beyaz, SKU: SRM-60-120-BY, Stok: 0 m², Fiyat: 310 TL/m²
```

### 7.4 Toplu Ürün İşlemleri

| İşlem | MVP |
|-------|-----|
| Toplu fiyat güncelleme (% zam/indirim) | ✅ |
| Toplu stok güncelleme | ✅ |
| Toplu kategori değiştirme | ✅ |
| Toplu marka değiştirme | ✅ |
| Toplu görünürlük değiştirme | ✅ |
| Toplu silme/pasife alma | ✅ |

### 7.5 Excel Import / Export

**MVP'de olmalı:** Evet — kritik özellik

- Şablon Excel dosyası indirilebilir
- Başlık eşleştirme (kolon mapping)
- Zorunlu alan kontrolü: SKU, isim, fiyat
- Hatalı satırlar ayrı raporda gösterilir
- Arka planda işlenir (büyük dosyalar için BullMQ)
- Var olan SKU güncellenir, yeni SKU eklenir
- Audit log'a kaydedilir

---

## 8. Kategori ve Marka Yönetimi

### 8.1 Kategori Yapısı

**Mevcut yapı:** Düz (tek seviye) — 9 kategori seed ile geliyor.

Örnek kategori ağacı:

```
Banyo → Banyo Dolapları, Banyo Aksesuarları, Duş Sistemleri
Batarya ve Musluklar → Banyo Bataryası, Lavabo Bataryası, Eviye Bataryası, Musluklar
Seramikler → Yer Seramikleri, Duvar Seramikleri, Seramik Yardımcı Ürünleri
Yapı Kimyasalları → Fayans Yapıştırıcı, Derz Dolgusu, İzolasyon Ürünleri
Silikon & Köpük → Silikonlar, Mastikler, PU Köpükler, Sprey Boyalar
```

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| Ad | ✅ | Benzersiz |
| Slug | ✅ | URL'de kullanılır |
| Açıklama | ❌ | SEO için |
| Görsel | ❌ | Kategori kartı |
| Sıralama | ❌ | Menü ve ana sayfa |
| Aktif/Pasif | ✅ | |
| Menüde göster | ❌ | |
| Ana sayfada göster | ❌ | |
| SEO title/meta | ❌ | |

### 8.2 Marka Yönetimi

| Alan | Zorunlu |
|------|---------|
| Marka adı | ✅ |
| Slug | ✅ |
| Logo | ❌ |
| Açıklama | ❌ |
| Aktif/Pasif | ✅ |

### 8.3 Filtreleme Sistemi

**MVP'de:** Sabit filtreler (marka, fiyat aralığı, stok durumu)  
**V1'de:** Dinamik, kategoriye özel filtreler

| Filtre Tipi | Örnek Seçenekler |
|-------------|-----------------|
| Marka | Checkbox list |
| Fiyat aralığı | Range slider |
| Stok durumu | Stokta var/yok |
| Ebat | 30x60, 45x45, 60x60, 60x120... |
| Renk | Bej, Gri, Beyaz, Siyah, Krom... |
| Kullanım alanı | Yer, Duvar, Havuz, Dış Cephe... |
| Malzeme | Pirinç, Paslanmaz Çelik... |
| Birim tipi | adet, m², kg, torba, koli |

---

## 9. Stok Yönetimi

### 9.1 Stok Kavramları

| Kavram | Açıklama |
|--------|----------|
| Netsis stok | ERP'den gelen fiziksel stok |
| Rezerve stok | Onaylanmış ama sevk edilmemiş siparişler |
| Display stok | netsisStock − rezerveStock (sitede gösterilen) |
| Kritik stok | minimumStock altına düşen ürünler |

### 9.2 Stok Düşüm Zamanlaması

**Önerilen: Sipariş onaylanınca stok rezerve edilir, sevk edilince stok düşülür.**

```
B2C: Sipariş → Ödeme alındı → Stok rezerve → Sevk → Stok düşümü
B2B: Sipariş → Admin onayı → Stok rezerve → Sevk → Stok düşümü
İptal: Sipariş iptali → Rezervasyon RELEASED → Display stok artar
```

### 9.3 Stok Hareketleri

| Hareket Tipi | Tetikleyici | Stok Etkisi |
|-------------|-------------|-------------|
| Rezervasyon | Sipariş onayı | displayStock azalır |
| Sevk | Sipariş kargoya verildi | netsisStock azalır |
| İade giriş | İade onaylandı | netsisStock artar |
| Manuel giriş/çıkış | Admin | netsisStock değişir |
| Sayım düzeltme | Fiziksel sayım | netsisStock güncellenir |

### 9.4 Stok Hareket Logu

Her stok hareketi kayıt altında: ürün, işlem tipi, miktar, eski/yeni stok, işlemi yapan, tarih, açıklama.

---

## 10. Sipariş Yönetimi

### 10.1 Sipariş Durumları

| Durum | Açıklama | Kim Değiştirir |
|-------|----------|----------------|
| PENDING_APPROVAL | B2B admin onayı bekler | Başlangıç |
| APPROVED | Onaylandı / B2C ödendi | Admin / Sistem |
| PREPARING | Depo hazırlıyor | Depo personeli |
| AWAITING_SUPPLY | Tedarik bekleniyor | Depo personeli |
| READY_TO_SHIP | Kargoya hazır | Depo personeli |
| SHIPPED | Kargoya verildi | Depo personeli |
| DELIVERED | Teslim edildi | Sistem / Admin |
| COMPLETED | Tamamlandı | Sistem |
| CANCEL_REQUESTED | İptal talep edildi | Müşteri |
| CANCELLED | İptal edildi | Admin |
| RETURN_REQUESTED | İade talep edildi | Müşteri |
| RETURN_IN_PROGRESS | İade sürecinde | Admin |
| RETURNED | İade tamamlandı | Admin |
| REJECTED | Reddedildi | Admin |

### 10.2 Sipariş Detay Sayfası (Admin)

| Bölüm | İçerik |
|-------|--------|
| Başlık | Sipariş no, tarih, durum badge'i, müşteri tipi |
| Müşteri Bilgisi | Ad, e-posta, telefon, bayi ise firma adı |
| Adresler | Fatura adresi, teslimat adresi |
| Ürün Listesi | Görsel, SKU, varyant, birim fiyat, miktar, KDV, satır toplamı |
| Fiyat Özeti | Ara toplam, indirim, kupon, kargo, KDV, genel toplam |
| Ödeme | Yöntem, durum, transaction ID |
| Kargo | Firma, takip no, takip linki |
| Durum Geçmişi | Zaman çizelgesi |
| Notlar | Müşteri notu, admin notları |
| Aksiyonlar | Durum değiştir, not ekle, bildirim gönder, iptal et, yazdır |

### 10.3 Admin Sipariş Aksiyonları

| Aksiyon | Yetki |
|---------|-------|
| Durum değiştirme | ADMIN, WAREHOUSE_STAFF |
| Manuel ödeme onayı | ADMIN, ACCOUNTING |
| Sipariş iptali | ADMIN |
| Kısmi iptal | ADMIN |
| Kısmi iade | ADMIN, ACCOUNTING |
| Kargo takip no girme | ADMIN, WAREHOUSE_STAFF |
| Admin notu ekleme | ADMIN, SALES_STAFF |
| Bildirim gönderme | ADMIN, SALES_STAFF |
| Sipariş yazdırma | ADMIN |
| Excel/PDF export | ADMIN |

---

## 11. Fiyatlandırma Motoru

### 11.1 Fiyat Tipleri

| Fiyat Tipi | Kapsam | Öncelik | MVP |
|------------|--------|---------|-----|
| Normal satış fiyatı | Tüm B2C | 5 (en düşük) | ✅ |
| İndirimli satış fiyatı | Ürüne özel | 3 | ✅ |
| Kampanya fiyatı | Aktif kampanya | 4 | V1 |
| Bayi grubu fiyatı | Bayi grubu % iskonto | 2 | ✅ |
| Bayiye özel ürün fiyatı | Override | 1 (en yüksek) | ✅ |
| Kategori bazlı iskonto | Kategori geneli | 3 | ✅ |
| Marka bazlı iskonto | Marka geneli | 3 | ✅ |

### 11.2 Fiyat Öncelik Sıralaması

```
1. Bayiye özel ürün fiyatı (DealerPricingOverride)
2. Bayi grubu genel iskontosu
3. Kampanya fiyatı (aktif kupon/kampanya)
4. Ürün/Kategori/Marka indirimi (Discount tablosu)
5. Normal satış fiyatı (basePrice)
```

### 11.3 Bölgesel/Lojistik Fiyat Farkı

- Bölgesel: Marmara, Ege, İç Anadolu için % ek ücret
- İl bazlı: Belirli illere özel sabit veya % ek ücret
- Lojistik kuralı: Bölge + ağırlık/desi bazlı
- Ücretsiz kargo limiti: X TL üzeri ücretsiz

---

## 12. Kampanya ve Kupon Sistemi

### 12.1 Kupon (PromoCode)

| Alan | Açıklama |
|------|----------|
| Kod | Benzersiz (örn: "HOSGELDIN20") |
| İndirim tipi | Yüzdesel veya sabit tutar |
| İndirim değeri | %20 veya 100 TL |
| Min sepet tutarı | Uygulanabilmesi için minimum |
| Max indirim tutarı | Yüzdesel üst sınır |
| Kullanım limiti | Toplam kaç kez |
| Müşteri başına limit | Bir müşteri kaç kez |
| Başlangıç/bitiş tarihi | Geçerlilik aralığı |
| Kapsam | Tüm / belirli ürünler / kategoriler / markalar |
| Hedef kitle | B2C / B2B / her ikisi |
| İlk alışverişe özel | Sadece ilk sipariş |
| Aktif/pasif | |

### 12.2 Kampanya (V1)

- Sepet kampanyası: X TL üzerine Y indirim
- Al X öde Y
- Ürün hediyeli
- Kategori/marka kampanyası

---

## 13. Ödeme Sistemi

### 13.1 Ödeme Yöntemleri

| Yöntem | MVP | Açıklama |
|--------|-----|----------|
| Havale/EFT | ✅ | Manuel, dekont yükleme, admin onayı |
| Kredi Kartı | V1 | Sanal POS (iyzico, PayTR) |
| Kapıda Ödeme | V2 | Kargo tahsilatı |
| Açık Hesap (B2B) | V2 | Cari hesaba borç |

### 13.2 Havale Bildirim Akışı

```
Müşteri havale → Havale bildirim formu → Admin panele düşer
→ Muhasebe kontrol → Onay/Ret → PAID → Sipariş işleme
```

### 13.3 Ödeme Kaydı (Payment Log)

| Alan | Açıklama |
|------|----------|
| Sipariş ID | |
| Müşteri ID | |
| Sağlayıcı | BANK_TRANSFER, IYZICO, PAYTR |
| Transaction ID | Provider'dan dönen ID |
| Tutar, Para birimi, Taksit | |
| Durum | PENDING, PAID, FAILED, REFUNDED, PARTIAL_REFUNDED |
| Hata mesajı | |
| Raw response | Provider yanıtı (JSON) |

### 13.4 Ödeme Güvenliği

- Kredi kartı bilgileri ASLA saklanmaz
- Sadece maskelenmiş kart numarası (son 4 hane)
- PCI-DSS: kart bilgileri doğrudan provider'a

---

## 14. Kargo ve Teslimat Yönetimi

| Özellik | MVP |
|---------|-----|
| Kargo firması tanımlama | ✅ |
| Kargo takip numarası girişi | ✅ |
| Otomatik takip linki oluşturma | ✅ |
| Ücretsiz kargo limiti | ✅ |
| Desi / ağırlık bazlı kargo (manuel) | V1 |
| Kargo firması API entegrasyonu | V2 |

| Teslimat Tipi | MVP |
|---------------|-----|
| Standart kargo | ✅ |
| Mağazadan teslim | V1 |
| Ağır/hacimli nakliye | V1 |

---

## 15. İptal / İade / Değişim Yönetimi

### 15.1 İade Durumları

| Durum | Açıklama |
|-------|----------|
| RETURN_REQUESTED | Müşteri talep oluşturdu |
| UNDER_REVIEW | Admin inceliyor |
| APPROVED | Onaylandı, ürün bekleniyor |
| REJECTED | Reddedildi |
| ITEM_RECEIVED | Ürün depoya ulaştı |
| REFUND_PENDING | Ödeme iadesi bekliyor |
| COMPLETED | Tamamlandı |

### 15.2 İade İşlemleri

- Stok geri alımı: Ürün depoya ulaşınca stok artar
- Ödeme iadesi: Havale manuel, kart sanal POS üzerinden
- Kısmi iade: Siparişin bir kısmı iade edilebilir
- İade nedeni kategorizasyonu

---

## 16. Müşteri ve Bayi Yönetimi

### 16.1 Müşteri Yönetimi (Admin)

- Müşteri listesi (filtreleme, arama)
- Müşteri detay (profil, siparişler, adresler)
- Müşteri pasife alma / silme
- Müşteri grubu atama (V1)

### 16.2 Bayi Yönetimi (Admin)

- Bayi listesi (filtre: durum, şehir)
- Bayi başvuru onay/ret
- Bayi detay (firma, cari, siparişler, istatistikler)
- Bayi fiyat grubu atama
- Bayi bazlı override fiyat girişi
- Bayi risk skoru görüntüleme
- Bayi cari bakiye görüntüleme
- Bayi pasife alma / silme

---

## 17. İçerik Yönetimi

### 17.1 Sayfalar

| Sayfa | MVP |
|-------|-----|
| Hakkımızda | ✅ |
| İletişim (form + harita) | ✅ |
| SSS | ✅ |
| Teslimat ve İade | ✅ |
| KVKK/Gizlilik | ✅ |
| Mesafeli Satış Sözleşmesi | ✅ |
| Banka Hesapları | ✅ |
| Blog/Haber | V1 |

### 17.2 Site Ayarları

| Ayar | MVP |
|------|-----|
| Site adı, slogan | ✅ |
| Logo (header, footer) | ✅ |
| Favicon | ✅ |
| Bakım modu | ✅ |
| İletişim bilgileri | ✅ |
| Sosyal medya linkleri | ✅ |
| Varsayılan KDV oranı | ✅ |

---

## 18. SEO Yönetimi

| Alan | Kapsam | MVP |
|------|--------|-----|
| Meta title/description | Ürün, kategori, marka, sayfa | ✅ |
| URL slug | Ürün, kategori, marka, sayfa | ✅ |
| Canonical URL | Ürün, kategori, sayfa | ✅ |
| Open Graph | Ürün, kategori, sayfa | ✅ |
| Sitemap.xml | Otomatik | ✅ |
| Robots.txt | Admin'den düzenlenebilir | ✅ |
| 301 yönlendirme | Eski → yeni URL | ✅ |
| Schema.org (JSON-LD) | Product, Breadcrumb, Organization | V1 |

URL yapısı: `/urun/{slug}`, `/kategori/{slug}`, `/marka/{slug}`, `/sayfa/{slug}`

---

## 19. Raporlama ve Dashboard

### 19.1 Rapor Tipleri

| Rapor | Filtreler | MVP | Export |
|-------|-----------|-----|--------|
| Satış raporu | Tarih, ürün, kategori, bayi | ✅ | Excel |
| Ürün raporu | Tarih, kategori, marka | ✅ | Excel |
| Stok raporu | Kategori, kritik stok | ✅ | Excel |
| Müşteri raporu | Kayıt tarihi, şehir | ✅ | Excel |
| Bayi raporu | Bayi, durum, şehir | ✅ | Excel |
| Ödeme raporu | Tarih, yöntem, durum | ✅ | Excel |
| Kampanya performansı | Kampanya, tarih | V1 | Excel |
| İade raporu | Tarih, neden | ✅ | Excel |

### 19.2 Bayi Raporları (8 tip)

Aylık ciro, yıllık ciro, fatura, detay, stok, risk, yaşlandırma, performans.

---

## 20. Bildirim Sistemi

### 20.1 Bildirimler

| Bildirim | Kanal | MVP |
|----------|-------|-----|
| Sipariş alındı | E-posta | ✅ |
| Ödeme alındı | E-posta | ✅ |
| Kargoya verildi | E-posta + SMS (V2) | ✅ |
| İade talebi alındı (admin) | E-posta | ✅ |
| Şifre sıfırlama | E-posta | ✅ |
| Bayi başvurusu (admin) | E-posta | ✅ |
| Bayi onaylandı | E-posta | ✅ |
| Kritik stok uyarısı | Admin panel + e-posta | ✅ |
| Havale bildirimi (admin) | E-posta | ✅ |

### 20.2 Bildirim Şablonları

Admin panelden düzenlenebilir, değişken destekli: `{{orderNo}}`, `{{customerName}}`, `{{total}}`

---

## 21. Loglama ve Denetim Geçmişi

### 21.1 Loglanacak İşlemler

Admin girişi (başarılı/başarısız), ürün CRUD, fiyat/stok değişikliği, sipariş durumu, iptal/iade, bayi onayı, ödeme durumu, yetki değişimi, entegrasyon hatası, Excel import.

### 21.2 Log Formatı

| Alan | Örnek |
|------|-------|
| userId | admin@admin.com |
| action | order.approve |
| entity | Order |
| entityId | SDK-2026-0042 |
| oldValue | {"status":"PENDING_APPROVAL"} |
| newValue | {"status":"APPROVED"} |
| ipAddress | 192.168.1.100 |
| createdAt | 2026-05-25 15:30 |

Loglar silinemez (immutable), admin panelde filtrelenebilir.

---

## 22. Entegrasyonlar

| Entegrasyon | Durum | Öncelik |
|-------------|-------|---------|
| Netsis ERP | 🔴 API bekleniyor | Yüksek |
| Alneo E-Fatura | 🔴 API bekleniyor | Yüksek |
| Ödeme (iyzico/PayTR) | 🔴 | Yüksek |
| SMTP (Canmail) | 🔴 Anahtar bekleniyor | Orta |
| Kargo API | 🔴 | Düşük |
| WhatsApp Business | 🔴 | Düşük |
| SMS | 🔴 | Düşük |

### Netsis Sync

Yön: Netsis → Sadoksan, Sıklık: Saatlik (ürün/stok), Günlük (cari).  
Senkronize: ürün listesi, stok, fiyat, bayi cari hesap, cari bakiye.

### Alneo E-Fatura

Akış: Sipariş tamamlandı → "e-fatura kes" → Alneo API → eInvoiceNo güncelleme.  
Durum: PENDING, SUBMITTED, ACCEPTED, REJECTED.

---

## 23. Veri Modeli Taslağı

### 23.1 Mevcut Modeller (Mevcut Sistem)

26+ model: User, Dealer, Product, ProductVariation, Category, Brand, Order, OrderLine, OrderStatusHistory, StockReservation, CartItem, Favorite, Address, Discount, PromoCode, Popup, NotifyRequest, AuditLog, SiteContent, SiteSettings, Proforma, ProformaItem, ExchangeRate, ProductCurrencyPrice, RegionalPricingSurcharge, ProvincePricingSurcharge, LogisticsRule, NetsisSync.

### 23.2 Önerilen Ek Modeller

#### stock_movements (MVP)

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID | |
| productId | UUID | |
| type | Enum | MANUAL_ENTRY, MANUAL_EXIT, ORDER_RESERVE, ORDER_FULFILL, RETURN, COUNT_ADJUST, DAMAGE |
| quantity | Decimal | Pozitif (giriş) veya negatif (çıkış) |
| oldStock | Decimal | |
| newStock | Decimal | |
| userId | UUID? | |
| referenceType | String? | Order, Return |
| referenceId | String? | |
| note | String? | |
| createdAt | DateTime | |

#### payment_logs (MVP)

| Alan | Tip |
|------|-----|
| id | UUID |
| orderId, customerId | UUID |
| provider | String (BANK_TRANSFER, IYZICO, PAYTR) |
| transactionId | String? |
| amount, currency | Decimal, String |
| installments | Int |
| status | Enum (PENDING, PAID, FAILED, REFUNDED, PARTIAL_REFUNDED) |
| errorMessage | String? |
| rawResponse | JSON? |
| paidAt, createdAt | DateTime |

#### return_requests (V1)

| Alan | Tip |
|------|-----|
| id, orderId, customerId | UUID |
| status | Enum (RETURN_REQUESTED → COMPLETED) |
| reason, description, adminNote | String |
| refundAmount | Decimal? |
| images | String[]? |
| createdAt, updatedAt | DateTime |

#### return_items (V1)

| Alan | Tip |
|------|-----|
| id, returnRequestId, orderLineId | UUID |
| quantity, restockQuantity | Int |
| reason, itemReceived | String, Boolean |

#### product_attributes + product_attribute_values (V1)

Dinamik ürün özellikleri ve filtreleme altyapısı.

#### import_jobs (MVP)

| Alan | Tip |
|------|-----|
| id | UUID |
| type | String (product_import, stock_update) |
| fileName, status | String |
| totalRows, successRows, errorRows | Int |
| errorReport | JSON? |
| userId | UUID |
| createdAt, completedAt | DateTime |

### 23.3 Index Stratejisi

**Kritik indexler:** Product(visible, purchasable, categoryId, brandId, sku), Order(customerId, dealerId, createdAt, status), StockReservation(productId, status), CartItem(userId), AuditLog(createdAt, entity), Dealer(status, city).

---

## 24. API Endpoint Taslağı

### Auth
- `POST /api/auth/register` — Kayıt
- `POST /api/auth/login` — Giriş
- `GET /api/auth/me` — Profil
- `POST /api/auth/forgot-password` — Şifre sıfırlama linki
- `POST /api/auth/reset-password` — Şifre sıfırlama

### Products
- `GET /api/products` — Liste (filtre, sayfalama)
- `GET /api/products/:slug` — Detay
- `POST /api/products` — Oluşturma (ADMIN)
- `PATCH /api/products/:id` — Güncelleme (ADMIN)
- `DELETE /api/products/:id` — Silme (ADMIN)
- `POST /api/products/import` — Excel import (ADMIN)
- `GET /api/products/export` — Excel export (ADMIN)

### Categories & Brands
- `GET /api/categories` — Liste
- `POST/PATCH/DELETE /api/categories/:id` — CRUD (ADMIN)
- `GET /api/brands` — Liste
- `POST/PATCH/DELETE /api/brands/:id` — CRUD (ADMIN)

### Cart
- `GET /api/cart` — Sepet
- `POST /api/cart/items` — Ekle
- `PATCH /api/cart/items/:id` — Güncelle
- `DELETE /api/cart/items/:id` — Kaldır
- `POST /api/cart/merge` — Guest→Login birleştirme

### Orders
- `POST /api/orders` — Sipariş oluştur
- `GET /api/orders` — Kullanıcının siparişleri
- `GET /api/orders/:orderNo` — Detay
- `POST /api/orders/:orderNo/cancel` — İptal talebi
- `POST /api/orders/:orderNo/return` — İade talebi

### Admin Orders
- `GET /api/admin/orders` — Tüm siparişler (filtre)
- `PATCH /api/admin/orders/:id/status` — Durum güncelle
- `POST /api/admin/orders/:id/approve` — B2B onayla
- `POST /api/admin/orders/:id/reject` — B2B reddet
- `POST /api/admin/orders/:id/ship` — Kargo bilgisi gir
- `POST /api/admin/orders/:id/cancel` — İptal
- `POST /api/admin/orders/:id/payment/confirm` — Ödeme onayı

### Admin Stock
- `GET /api/admin/stock` — Stok listesi
- `GET /api/admin/stock/critical` — Kritik stoklar
- `GET /api/admin/stock/movements` — Stok hareketleri
- `POST /api/admin/stock/movements` — Stok hareketi ekle

### Admin Customers & Dealers
- `GET /api/admin/customers` — Müşteri listesi
- `GET /api/admin/dealers` — Bayi listesi
- `POST /api/admin/dealers/:id/approve` — Bayi onayı
- `POST /api/admin/dealers/:id/reject` — Bayi red

### Pricing & Discounts
- `GET/POST/PATCH/DELETE /api/admin/discounts` — İndirim CRUD
- `GET/POST/PATCH/DELETE /api/admin/promo-codes` — Kupon CRUD
- `GET/POST /api/admin/pricing/dealers` — Bayi override fiyat

### Content & SEO
- `GET /api/content/pages/:slug` — Sayfa
- `POST/PATCH /api/admin/content/pages` — Sayfa CRUD
- `GET/PATCH /api/admin/content/settings` — Site ayarları
- `GET/POST/DELETE /api/admin/seo/redirects` — Yönlendirme

### Reports
- `GET /api/admin/reports/sales` — Satış raporu
- `GET /api/admin/reports/products` — Ürün raporu
- `GET /api/admin/reports/stock` — Stok raporu
- `GET /api/admin/reports/dealers` — Bayi raporu
- `GET /api/admin/reports/export` — Excel export

### System
- `GET/POST/PATCH /api/admin/users` — Admin kullanıcı CRUD (SUPER_ADMIN)
- `GET /api/admin/audit-logs` — Audit log
- `GET/POST /api/admin/integrations/netsis/sync` — Netsis sync

---

## 25. Admin Panel Menü Ağacı

```
📊 Dashboard
📦 Ürünler
   ├── Ürün Listesi
   ├── Yeni Ürün
   ├── Kategoriler
   ├── Markalar
   ├── Varyantlar
   ├── Toplu İşlemler
   └── Excel Import / Export
📋 Siparişler
   ├── Tüm Siparişler
   ├── Onay Bekleyenler (B2B)
   ├── Hazırlananlar
   ├── Kargodakiler
   ├── Tamamlananlar
   └── İptal / İade
👥 Müşteriler
   ├── Bireysel Müşteriler
   ├── Bayiler
   └── Bayi Başvuruları
🏗️ Stok
   ├── Stok Durumu
   ├── Kritik Stoklar
   ├── Stok Hareketleri
   └── Sayım / Düzeltme
💰 Fiyat & Kampanya
   ├── İndirimler
   ├── Kuponlar
   ├── Bölgesel Fiyatlandırma
   └── Bayi Özel Fiyatlar
💳 Ödeme
   ├── Ödeme Kayıtları
   ├── Havale Bildirimleri
   ├── Başarısız Ödemeler
   └── İadeler
🚚 Kargo
   ├── Kargo Firmaları
   └── Teslimat Ayarları
📝 İçerik
   ├── Sayfalar
   ├── Banner / Slider
   ├── SSS
   ├── Blog / Haber
   └── Site Ayarları
🔍 SEO
   ├── Meta Ayarları
   ├── URL Yönlendirmeleri
   └── Sitemap
📈 Raporlar
   ├── Satış Raporu
   ├── Ürün Raporu
   ├── Stok Raporu
   ├── Müşteri Raporu
   ├── Bayi Raporu
   └── Ödeme Raporu
⚙️ Sistem
   ├── Admin Kullanıcıları
   ├── Roller ve Yetkiler
   ├── Log Kayıtları
   ├── Entegrasyonlar
   ├── Bildirim Şablonları
   └── Bakım Modu
```

---

## 26. UI/UX Tasarım İlkeleri

### 26.1 Admin Panel

| Prensip | Uygulama |
|---------|----------|
| İş odaklı | Her ekran bir işi çözmeli |
| Hız | Kritik işlemler maksimum 2 tık |
| Netlik | Data table okunaklı, status badge renk kodlu |
| Tutarlılık | Tüm liste sayfaları: filtre + tablo + pagination |
| Geri bildirim | Her işlem toast, hata net mesaj |
| Toplu işlem | Checkbox + seçilenlere uygula |
| Responsive | Masaüstü tam, tablet kullanılabilir, mobil temel |

### 26.2 Bileşen Standartları

- **Data Table:** Sıralama, filtreleme, pagination, bulk select
- **Form:** Anlık validation, zorunlu alan işareti, değişiklik uyarısı
- **Modal:** Kritik işlemler için, backdrop kapanmaz
- **Drawer:** Hızlı detay görüntüleme
- **Toast:** Başarı/hata/uyarı, sağ üst, otomatik kapanma
- **Status Badge:** Yeşil (aktif/tamamlandı), sarı (bekliyor), kırmızı (iptal/hata), mavi (hazırlanıyor)
- **Skeleton:** Yükleme iskeleti
- **Empty/Error State:** Açıklayıcı mesaj + aksiyon butonu
- **Image Upload:** Sürükle-bırak, toplu, önizleme
- **Excel Import:** 5 adımlı wizard (dosya → kolon eşleştirme → önizleme → import → rapor)

### 26.3 Müşteri Tarafı

| Prensip | Uygulama |
|---------|----------|
| Mobil öncelikli | Mobilde başlar, desktop'a genişler |
| Hızlı yükleme | Lazy loading, görsel optimizasyonu, SSR |
| Net navigasyon | Kategori menüsü belirgin, breadcrumb |
| Güven sinyali | SSL, açık iletişim bilgileri |
| Kolay checkout | 3 adım, misafir alışveriş, minimum form |
| Sepet erişimi | Header'da sepet ikonu + ürün sayısı |
| Arama | Header'da belirgin, anlık sonuç |
| Fiyat netliği | KDV dahil/hariç açık, bayi farkı görünür |

---

## 27. Güvenlik Gereksinimleri

| Gereksinim | MVP |
|------------|-----|
| JWT access + refresh token (15 dk / 7 gün) | ✅ |
| Şifre bcrypt (10 salt rounds) | ✅ |
| Başarısız giriş limiti (5 deneme → 15 dk) | ✅ |
| RBAC (endpoint ve route bazlı) | ✅ |
| Rate limiting (/auth/login: 10/15dk) | ✅ |
| Input validation (class-validator) | ✅ |
| SQL injection (Prisma parametrized) | ✅ |
| XSS (output escaping) | ✅ |
| CORS (sadece kendi domain) | ✅ |
| Helmet security headers | ✅ |
| Dosya mime type kontrolü + max boyut | ✅ |
| Kredi kartı SAKLAMAMA | ✅ |
| KVKK uyumu | ✅ |
| Audit log (tüm kritik işlemler) | ✅ |
| Soft delete | ✅ |
| Admin 2FA | V2 |

---

## 28. Performans Gereksinimleri

| Metrik | Hedef |
|--------|-------|
| Ana sayfa LCP | < 2.5s |
| Ürün listeleme FCP | < 1.5s |
| Ürün detay FCP | < 1.5s |
| Admin liste sayfaları | < 1s (pagination) |
| API ürün listesi | < 200ms |
| API sipariş oluşturma | < 500ms |

**Stratejiler:** SSR + CDN, görsel optimizasyonu (WebP, max 1200px), veritabanı index, pagination, N+1 önleme, Redis cache (V1), arka plan işleme (BullMQ), code splitting, lazy loading.

---

## 29. Migration / Veri Taşıma Planı

### Adımlar

1. **Veri Keşfi:** Eski sistem DB analizi, eksik/bozuk veri tespiti
2. **Mapping:** Eski-yeni alan eşleştirme, kategori dönüşümü, görsel isimlendirme
3. **Script:** Ürün, görsel, müşteri, SEO redirect import script'leri
4. **Test Import:** Staging'de test, hata raporu, görsel kontrol, manuel spot check
5. **Final Import:** Production import, bütünlük kontrolü, 301 aktif etme
6. **Go-Live:** DNS, SSL, eski site bakım, canlıya geçiş, ilk 24 saat izleme

### Veri Temizleme

- Tekrarlı SKU → en güncel tutulur
- Boş zorunlu alan → varsayılan, log'a kaydet
- Geçersiz fiyat → pasife al
- Eksik görsel → placeholder
- Eksik kategori → "Kategorisiz" geçici kategori

### Görsel Standardı

`/sku-KODU-01.webp` (ana), `/sku-KODU-02.webp` (galeri)

---

## 30. MVP Kapsamı

**Hedef:** En kısa sürede çalışan ve güvenilir e-ticaret sistemi.

| # | Modül | Özellikler |
|---|-------|------------|
| 1 | Ürün Yönetimi | CRUD, SKU, fiyat, stok, varyant, görsel, birim tipi, görünürlük |
| 2 | Kategori & Marka | Düz yapı, CRUD, slug, görsel |
| 3 | Stok Yönetimi | Netsis stok, display stok, rezervasyon, kritik stok uyarısı |
| 4 | Sepet | API + localStorage, login merge |
| 5 | Sipariş | B2C APPROVED, B2B PENDING_APPROVAL, durum akışı |
| 6 | Havale Ödeme | Bildirim formu, admin onayı |
| 7 | Admin Sipariş | Listeleme, durum değiştirme, onay/ret |
| 8 | Müşteri Üyeliği | Kayıt, giriş, şifre, profil, adres |
| 9 | Favoriler | Ekle/çıkar/listele |
| 10 | Dashboard | Temel kartlar (sipariş, ciro, kritik stok) |
| 11 | İçerik Sayfaları | Hakkımızda, iletişim, KVKK, sözleşmeler |
| 12 | SEO Temel | Meta, slug, sitemap, robots.txt |
| 13 | Excel Import/Export | Ürün import/export, toplu güncelleme |
| 14 | Loglama | AuditLog tüm kritik işlemler |
| 15 | B2B Bayi | Bayi paneli, bayi fiyatları, onay akışı |
| 16 | Fiyatlandırma | Normal, indirim, bayi override, bölgesel |
| 17 | Güvenlik | JWT, RBAC, rate limit, CORS, helmet |
| 18 | Site Ayarları | Logo, bakım modu, iletişim bilgileri |

**MVP Dışı:** Online ödeme, kargo API, kampanya/kupon, dinamik filtreler, e-fatura, Netsis canlı, SMS/WhatsApp, blog, grafikli raporlar, çoklu depo.

---

## 31. V1 Kapsamı

| # | Modül | Özellikler |
|---|-------|------------|
| 1 | Online Ödeme | iyzico/PayTR sanal POS |
| 2 | Kupon Sistemi | PromoCode CRUD, sepette kupon |
| 3 | Kampanya | Sepet, kategori, marka kampanyası |
| 4 | Dinamik Filtreler | Kategoriye özel (ebat, renk, malzeme) |
| 5 | Kargo Takip | Firma tanımlama, otomatik takip linki |
| 6 | Gelişmiş Raporlar | Grafikli dashboard |
| 7 | Bildirim | E-posta şablonları, otomatik |
| 8 | E-Fatura Hazırlık | Order alanları, admin arayüzü |
| 9 | Netsis Hazırlık | Manuel sync, monitoring |
| 10 | Blog/Haber | CRUD |
| 11 | Slider/Banner | Ana sayfa slider |
| 12 | Gelişmiş SEO | Schema.org, OG, breadcrumb, 301 panel |
| 13 | Kategori Ağacı | İki seviyeli |
| 14 | İade Yönetimi | Tam akış (return_requests) |
| 15 | Redis Cache | Kategori, ayarlar, kampanya |

---

## 32. V2 / İleri Seviye Kapsam

- Netsis canlı entegrasyonu
- Alneo e-fatura/e-arşiv/e-irsaliye
- WhatsApp/SMS bildirimleri
- Akıllı ürün önerileri
- Full-text search (PostgreSQL tsvector)
- Stok tahminleri
- B2B cari raporlar (Netsis detay)
- Pazaryeri entegrasyonu (Trendyol, Hepsiburada)
- Çoklu depo
- Personel görev akışı
- Gelişmiş kampanya motoru
- Müşteri sadakat programı
- Canlı chat
- Multi-language (TR + EN + AR)

---

## 33. Riskler ve Dikkat Edilecek Noktalar

### Teknik Riskler

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| Eski sistemden veri çekme zorluğu | Yüksek | Gecikme | Erken veri keşfi, manuel temizleme bütçesi |
| Ürün verileri eksik/dağınık | Yüksek | Kalite | Import validasyonu, hata raporlama |
| Görseller düzensiz | Orta | Kalite | Standart isimlendirme, toplu resize |
| Stok gerçek stokla uyuşmuyor | Orta | Güven | Netsis öncesi manuel sayım |
| ERP entegrasyonu karmaşık | Yüksek | Gecikme | MVP'de manuel, API gelince geçiş |
| Bayi fiyat kuralları net değil | Orta | Karışıklık | Workshop, basit başla |
| SEO kaybı | Yüksek | Trafik | 301, meta birebir taşı |
| Ödeme entegrasyonu hataları | Orta | Maddi kayıp | Kapsamlı test, loglama |

### Operasyonel Riskler

- Admin kullanıcı alışma süreci → eğitim, doküman, ilk hafta destek
- Bayi uyumu → beta test, birebir demo
- Müşteri yadırgaması → kademeli geçiş, duyuru

---

## 34. Kabul Kriterleri

### Ürün Yönetimi
- [ ] Admin ürün eklediğinde müşteri tarafında doğru görünmeli
- [ ] Ürün pasife alınınca siteden kalkmalı, sipariş geçmişinde kalmalı
- [ ] Varyant seçimi stok ve fiyatı güncellemeli
- [ ] Excel import hatalı satırları raporlamalı

### Stok Yönetimi
- [ ] Her stok hareketi loglanmalı (kim, ne zaman, eski/yeni)
- [ ] Display stok = netsis − rezerve doğru hesaplanmalı
- [ ] Sipariş onayında stok rezerve, iptalde serbest kalmalı
- [ ] Kritik stok dashboard'da görünmeli

### Sipariş Yönetimi
- [ ] B2C otomatik APPROVED, B2B PENDING_APPROVAL
- [ ] Durum değişince OrderStatusHistory kaydı
- [ ] Havale onayı sonrası durum güncellenmeli
- [ ] İptalde stok doğru geri alınmalı

### Bayi Sistemi
- [ ] Bayi kendi fiyatlarını görmeli, perakende fiyatı görememeli
- [ ] Bayi sadece kendi verilerine erişebilmeli
- [ ] Override fiyat doğru hesaplanmalı

### Güvenlik
- [ ] Yetkisiz admin erişimi engellenmeli
- [ ] Müşteri başkasının siparişini görememeli
- [ ] Hassas veriler loglanmamalı

### SEO & Migration
- [ ] Eski URL'ler 301 yönlendirilmeli
- [ ] Tüm sayfalarda meta title/description
- [ ] Sitemap.xml otomatik

### Performans
- [ ] Ürün listeleme < 2s
- [ ] Admin listeleri < 1s
- [ ] Sipariş transaction atomic

---

## 35. Geliştirme Sprint Planı

**Sprint süresi:** 2 hafta | **Toplam:** 12 hafta (6 sprint)  
**Ekip:** 1 Senior Full-Stack + 1 Frontend + 1 Part-time DevOps

### Sprint 0: Hazırlık

- Eski sistem veritabanı analizi
- Veri kalite raporu
- Geliştirme ortamı kurulumu
- Tasarım dokümanı final onayı

### Sprint 1: Ürün + Kategori + Marka + Stok (Hafta 1-2)

- Ürün CRUD (mevcut sistemden eksikleri tamamla)
- Varyant yönetimi
- Görsel optimizasyonu (resize, WebP)
- Stok hareket loglama (StockMovement)
- Excel import/export iyileştirmeleri
- Toplu işlemler

### Sprint 2: Müşteri + Sepet + Sipariş (Hafta 3-4)

- Sepet iyileştirmeleri
- Checkout akışı (3 adım)
- Sipariş oluşturma (B2C + B2B)
- Sipariş durum akışı (tüm durumlar)
- Havale bildirim formu
- Manuel ödeme onayı
- Sipariş detay sayfası (admin)

### Sprint 3: Bayi + Fiyatlandırma + Dashboard (Hafta 5-6)

- Bayi başvuru ve onay akışı
- Bayi paneli
- Fiyatlandırma motoru
- Admin dashboard
- Temel raporlar

### Sprint 4: İçerik + SEO + Admin Tamamlama (Hafta 7-8)

- CMS sayfaları
- Site ayarları
- SEO meta alanları
- Sitemap, robots.txt, 301
- Admin kullanıcı ve rol yönetimi
- Audit log görüntüleme
- Bildirim şablonları

### Sprint 5: V1 Özellikleri + Test (Hafta 9-10)

- Online ödeme entegrasyonu
- Kupon sistemi
- Kargo takip
- Dinamik filtre altyapısı
- Performans optimizasyonu
- Güvenlik testi
- Bug fixing

### Sprint 6: Migration + Go-Live (Hafta 11-12)

- Veri taşıma script'i
- Staging test import
- Production ortam hazırlığı
- Go-live checklist
- DNS geçişi
- 24 saat izleme
- Admin eğitimi
- Bayi bilgilendirme

---

## Ek A: Terimler Sözlüğü

| Terim | Açıklama |
|-------|----------|
| SKU | Stock Keeping Unit — ürün stok takip kodu |
| B2C | Business to Consumer — son tüketiciye satış |
| B2B | Business to Business — firmadan firmaya satış |
| Cari | Cari hesap — bayi/müşteri finansal hesabı |
| Netsis | ERP yazılımı |
| Alneo | E-fatura ve e-arşiv entegratörü |
| Desi | Kargo hacim ağırlığı |
| Proforma | Ön fatura |
| SSR | Server-Side Rendering |
| SPA | Single Page Application |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control |
| MVP | Minimum Viable Product |

---

**Doküman Sonu**

*Bu doküman Sadöksan İnşaat e-ticaret altyapısının sistem tasarımını tanımlar. Tüm paydaşların (iş sahibi, geliştirici, tasarımcı, operasyon ekibi) ortak referans kaynağı olarak kullanılması amaçlanmıştır.*
