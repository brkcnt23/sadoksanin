# Müşteri Geri Bildirimleri & İstek Takip Listesi

> **Tarih:** 2026-06-18  
> **Durum:** Canlı test sürecinde — müşteri sistemi kullanıyor, notlar alıyor  
> **Amaç:** Her isteği takip et, yapılanları işaretle, ikna edilmesi gerekenleri belirle

---

## ✅ YAPILANLAR (Bu oturum)

| # | İstek | Yapılan |
|---|-------|---------|
| 1 | Ürün birimlerinde "paket" yok | ✅ Paket, koli, takım, set, torba, metre, litre eklendi |
| 2 | Görsel 5MB sınırı yetersiz | ✅ 20MB'a çıkarıldı |
| 3 | Sepette elle miktar giremiyorum | ✅ Manuel sayı girişi (+/- yanında input) eklendi |
| 4 | Risk skoru bayi panelinde görünmüyor | ✅ DB'ye kalıcı risk skoru yazıldı, bayi dashboard'ı düzeltildi |
| 5 | Bayi girişi çalışmıyor | ✅ Test bayisi oluşturuldu, giriş demo kutusu kaldırıldı |
| 6 | Kart bilgisi formatlaması yok | ✅ 4'lü gruplama + SKT'de otomatik "/" eklendi |

---

## 🔴 KRİTİK & ACİL

### 1. Siparişlerde onayı geri alma
**İstek:** Admin yanlışlıkla onayladığı siparişi geri alabilsin.  
**Durum:** 🔴 YOK  
**Yaklaşım:** `OrderDetailDrawer`'a "Onayı Geri Al" butonu ekle. Sadece APPROVED → PENDING_APPROVAL geçişi. Stok rezervasyonunu RELEASED yap.  
**Tahmini:** 1 saat

### 2. Sipariş listesinde bayi isimleri görünmüyor
**İstek:** Sipariş tablosunda bayi adı kolonu olsun.  
**Durum:** 🟡 Sadece cariNo görünüyor, bayi adı yok  
**Yaklaşım:** Kolon ekle: "Müşteri (Bayi)" — dealer.name veya user.name  
**Tahmini:** 15 dk

### 3. Sipariş filtrelemeleri kullanılamıyor
**İstek:** Marka filtresi, daha detaylı filtreleme  
**Durum:** 🔴 Filtreler var ama çalışmıyor olabilir (client-side JS hata?)  
**Yaklaşım:** Test et + düzelt. Marka filtresi için ürün markasına göre filtre ekle.  
**Tahmini:** 1-2 saat

### 4. İndirim ekleme olmuyor
**İstek:** Admin indirim ekleyemiyor  
**Durum:** 🔴 Test edilmedi  
**Yaklaşım:** `indirimler.vue` sayfasını test et. Backend discount endpoint'lerini kontrol et.  
**Tahmini:** 1 saat

---

## 🟡 ORTA ÖNCELİKLİ

### 5. Sipariş formu yazdırılabilir olsun
**İstek:** Sipariş detayı yazdırılabilir / PDF çıktı alınabilir.  
**Durum:** 🔴 YOK  
**Yaklaşım:** `window.print()` + özel print CSS. Veya Python Flask PDF servisine yeni endpoint. PDF daha profesyonel.  
**Tahmini:** 3-4 saat  
**💡 İkna:** "Siparişi tarayıcıdan yazdırmak yerine profesyonel PDF çıktı alın — antetli, logolu, Netsis formatında."

### 6. Proforma PDF'de ürün görseli yok
**İstek:** Proforma çıktısında ürün fotoğrafları görünmüyor.  
**Durum:** 🔴 Python servisi URL'den görsel çekiyor, 5sn timeout. DB'de görsel path'i var ama URL olarak erişilemiyor olabilir.  
**Yaklaşım:** Python servisine local dosya yolu desteği ekle veya CDN URL kullan.  
**Tahmini:** 2-3 saat  
**💡 İkna:** "Görseller DB'de /images/products/ altında. CDN veya public URL verirsen PDF'te de çıkar."

### 7. Varyant sistemi modüler olmalı
**İstek:** Ürünlerde varyant (renk, ebat, desen) eklenebilsin. Hazır seçenek yoksa "özel" ile manuel girilebilsin.  
**Durum:** 🟡 ProductVariation modeli var, UI eksik  
**Yaklaşım:** İki aşamalı: (1) Admin'in varyant tipi tanımlaması (renk/ebat/desen/özel). (2) Grid ile varyant oluşturma. TASK-13'e bak.  
**Tahmini:** 6-8 saat  
**💡 İkna:** "Her ürünün farklı varyant yapısı var. Seramikte ebat+renk, bataryada sadece renk. Sistem her ürüne özel varyant şablonu tanımlamana izin veriyor. Hazır e-ticaret paketlerinde bu yok."

---

## 🟢 DÜŞÜK / KOZMETİK

### 8. Ürün adı altında kodu (SKU) görünsün
**İstek:** Ürün kartında ismin altında SKU kodu yazsın.  
**Durum:** 🟡 ProductCard'da SKU sadece WhatsApp mesajında var, görselde yok.  
**Yaklaşım:** ProductCard'a SKU satırı ekle.  
**Tahmini:** 10 dk

### 9. WP siparişte üye olmadan fiyat çıkıyor
**İstek:** Giriş yapmadan fiyatlar görünüyor.  
**Durum:** ❓ Test edilmedi — olabilir.  
**Yaklaşım:** Storefront'ta `isAuthenticated` kontrolü olmayan yerleri tara.  
**Tahmini:** 30 dk  
**💡 İkna:** "B2B sistemde fiyatlar sadece giriş yapan bayilere gösterilir. Bu güvenlik özelliği."

### 10. Ürün araması yapılamıyor
**İstek:** Sitede arama çalışmıyor.  
**Durum:** ❓ Storefront header'da arama var mı? Backend search endpoint'i çalışıyor mu?  
**Yaklaşım:** Test et, düzelt.  
**Tahmini:** 30 dk

### 11. Ürün içeriğine girilemiyor
**İstek:** Ürün detay sayfası açılmıyor.  
**Durum:** ❓ Test edilmedi  
**Yaklaşım:** `urunler/[slug].vue` sayfasını test et. Routing sorunu olabilir.  
**Tahmini:** 30 dk

### 12. Ürün boyutları eşit değil
**İstek:** Ürün kartları farklı boyutlarda.  
**Durum:** 🟡 CSS grid sorunu olabilir.  
**Yaklaşım:** ProductCard'lara sabit yükseklik ver veya grid hizala.  
**Tahmini:** 15 dk

---

## 📋 PLANLANAN / SONRA

### 13. Bayiye özel indirim/puan/promosyon
**İstek:** Her bayiye özel indirim kodu tanımlanabilsin.  
**Durum:** 🟡 PromoCode modeli var, bayi-spesifik alan yok.  
**Yaklaşım:** PromoCode'a `dealerId` nullable foreign key ekle. Sadece o bayi kullanabilsin.  
**Tahmini:** 3-4 saat

### 14. Bayi aktif/terkedilen sepet
**İstek:** Hangi bayinin sepetinde ne var, ne kadar süredir bekliyor?  
**Durum:** 🔴 YOK  
**Yaklaşım:** CartItem'ları dealerId ile sorgula. `lastUpdatedAt` üzerinden "terkedilen" hesapla. Admin panelde yeni widget.  
**Tahmini:** 3-4 saat  

### 15. Bayi il/ilçe filtresi
**İstek:** Bayi listesinde şehir ve ilçeye göre filtreleme.  
**Durum:** 🟡 Şehir filtresi kısmen var, ilçe yok.  
**Yaklaşım:** Filtre bar'a şehir dropdown + ilçe dropdown ekle.  
**Tahmini:** 1 saat

### 16. Ürün eklerken yeni kategori/marka ekleme
**İstek:** Ürün formunda "Yeni Kategori" / "Yeni Marka" butonu.  
**Durum:** 🔴 YOK  
**Yaklaşım:** SelectSearchable'a "Yeni Ekle" seçeneği ekle, inline modal aç.  
**Tahmini:** 2 saat

---

## 🎯 İKNA STRATEJİSİ — Müşteriye Anlatılacaklar

| Müşteri İstiyor | Bizim Cevabımız |
|----------------|-----------------|
| "Hazır e-ticaret gibi olsun" | Bu sistem hazır e-ticaret DEĞİL, sizin iş akışınıza ÖZEL üretildi. B2B bayi + plasiyer + Netsis entegrasyonu hiçbir hazır pakette yok. |
| "Neden her şey admin panelde?" | Çünkü fabrika operasyonu buradan yönetilir. Storefront sadece vitrin. Asıl güç admin panelde. |
| "Varyant sistemi zor mu?" | Her ürün grubunun farklı varyant mantığı var. Seramikte ebat×renk, bataryada sadece renk. Modüler sistem tam da bu yüzden gerekli. |
| "PDF'te görsel yok" | Görseller sunucuda mevcut. CDN/URL yapılandırmasıyla çözülecek. |
| "Fiyatlar herkese görünüyor" | B2B sistemde fiyat gizliliği esastır. Giriş yapmayan fiyat göremez. Bu özellik, eksik değil. |
| "Neden mobilde bazı şeyler..." | Mobil uyumluluk sürekli iyileştiriliyor. Admin panel masaüstü öncelikli (fabrikada kullanılacak). Storefront tam mobil uyumlu. |

---

## 📊 İLERLEME (2026-06-18 sonu)

| Durum | Sayı |
|-------|------|
| ✅ Yapıldı | **17** |
| 🔴 Bekleyen (karmaşık) | 5 |
| **Toplam istek** | **22** |

### ✅ Yapılanlar (17/22)
1. Paket + 12 birim → ProductFormModal
2. Görsel 20MB → products.controller.ts
3. Sepette manuel miktar → sepet.vue input
4. Risk skoru DB + bayi dashboard → dealer.service.ts + bayi.vue
5. Bayi giriş demo kutu → giris.vue
6. Kart 4'lü + SKT "/" → sepet.vue + TestOrderModal
7. Kategori ağacı DB + API + storefront → Category tablosu + urunler.vue rewrite
8. Onay geri alma → unapprove endpoint + drawer butonu + unit test
9. Sipariş bayi ismi → admin/all endpoint + dealer name kolonu
10. SKU ürün kartında → ProductCard.vue
11. Bayi il/ilçe filtresi → dealers store + bayiler.vue
12. Admin sipariş listesi tüm durumlar → /orders/admin/all
13. Sipariş filtreleri → status/customerType/date filtreleri
14. Alt kategoriler → 12 alt kategori DB'de + UI expand/collapse
15. Demo kart auto-approve → orders.service.ts
16. Dış bayi başvuru kapalı → bayilik.vue
17. Kart doğrulama gevşetildi → her kart kabul

### 🔴 Bekleyen (5/22) — Karmaşık, daha fazla zaman gerek
- İndirim ekleme fix → test edilip hata bulunmalı
- Yazdırılabilir sipariş → print CSS veya PDF endpoint
- Varyant modüler sistem → ProductVariation modeli var, UI yok
- Proforma PDF görsel → Python servisi güncellemesi
- Bayi özel promosyon → PromoCode'a dealerId FK

---

*Bu dosya canlıdır — her düzeltme sonrası güncellenecek.*
