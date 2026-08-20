# Sunum Notu — 12 Ağustos 2026

Tam durum raporu: **`DURUM-VE-YAPILACAKLAR.md`** (aynı klasörde)

---

## GİRİŞ BİLGİLERİ

| Rol | Adres | Giriş | Şifre |
|---|---|---|---|
| **Yönetici** | /sadoksan-panel/ | `admin@admin.com` | `admin2026` |
| **Bayi** | /giris | `bayi@sadoksan.com` | `sunum2026` |

Bayi = **ERZMEKANİK DÜNYA MÜHENDİSLİK** (cari `120.AE.25.0052`) — 75 gerçek siparişi var,
kullanılabilir limit 7.594.604 TL.

Site: https://sadoksan.smartinnventory.com

---

## GÖSTERİLEBİLECEK AKIŞ

**Müşteri tarafı (giriş yapmadan)**
1. Ana sayfa → üst menüde **Ürünler** → mega menüde kategoriler + **kategori görselleri**
2. **Ürünler** sayfası: 2491 ürün, kategori/marka filtreleri, sayfada 25/50/100 seçimi
   - İlk sayfa: hepsi görselli, hepsi stokta
3. Bir ürüne tıkla → ürün detay sayfası
4. Misafir fiyat görmez → "Fiyat Görmek İçin Giriş Yapın"

**Bayi tarafı (bayi@sadoksan.com)**
5. Giriş → fiyatlar görünür (bayiye özel + lojistik farkı)
6. Bayi paneli: bakiye, kredi limiti, kullanım çubuğu
7. **Siparişlerim** → 75 gerçek geçmiş sipariş (Netsis'ten)
8. Sepete ürün ekle → **Siparişi Onayla** (ödeme ekranı yok, krediyle çalışıyor)
9. Stokta olmayan bir üründe **"Haber Ver"** butonu → talep kaydı oluşur

**Yönetici tarafı (admin@admin.com)**
10. Dashboard: 1879 sipariş, 271,5 milyon TL ciro, grafikler
11. **Siparişler** → bayinin yeni siparişi → **Onayla** / **İptal**
12. **Ürünler** → 5414 ürün, yayınla/yayından kaldır, varyant ekle
13. **Kategoriler** (yeni sayfa) → ağaç, görsel ekle/değiştir, alt kategori ekle
14. **Bayiler** → 1446 bayi, kredi limiti düzenleme
15. **Popup & Kampanya** → görselli popup (bayi girişinde açılıyor)
16. **Proforma** → görselli PDF üretimi
17. **Raporlar** → grafikli raporlar

---

## DİKKAT EDİLECEKLER

**Bildirim gönderimi yok.** "Haber Ver" talebi kayda düşüyor, panelde "Bildirimler" ekranında
görünüyor — ama **e-posta/WhatsApp gitmiyor** (SMTP bağlı değil). Sorulursa:
*"Talep toplama aktif, gönderim entegrasyonu sırada."*

**Sipariş silme yok.** "Kaldırma" = **İptal** (reject). Sipariş iptal edilir, kayıt kalır.

**Bayi listesinde bankalar/belediyeler var** (FİNANSBANK, ZİRAAT, belediyeler...).
Netsis'te "alıcı cari" oldukları için geldiler, hepsi `PENDING`. Sorulursa:
*"Netsis'ten tüm alıcı cariler alındı, onay sırasında ayıklanacak."*

**Bayilerin e-postaları yer tutucu** (`cari-XXX@netsis.local`) — Netsis'te e-posta tutulmuyor.
Bayiler ilk girişte kendi e-postalarını tanımlayacak.

**Netsis `SADOKSANTEST` veritabanına bağlı** (canlı kopyası). Sipariş oluşturup silmek serbest.
Yeni siparişler henüz Netsis'e yazılmıyor (`NETSIS_ORDER_PUSH_ENABLED` kapalı, bilinçli).

---

## SUNUMDAN SONRA

1. **Bayinin kredi limitini geri al** — sunum için 0 → 15.000.000 TL yapıldı (ERZMEKANİK).
2. **Yönetici şifresini değiştir** — `admin2026` bu dosyada düz metin duruyor.
3. Test siparişleri oluşturduysan `SDK-*` numaralı olanları temizle
   (gerçek geçmiş `NTS-*` ile başlıyor, onlara dokunma).

---

## CANLI TEST SONUCU (20 Ağustos)

Panelin ve sitenin çağırdığı uçlar gerçek hesaplarla tek tek denendi: **22 uç çalışıyor**,
yetki hatası yok. Ekranlar tarayıcıda gezildi.

Bu turda bulunup düzeltilenler:

| Sorun | Durum |
|---|---|
| Ana sayfada "Öne Çıkan Ürünler" bölümü **tamamen boştu** (liste reaktif değildi + hiç ürün işaretli değildi) | 8 stoklu+görselli ürünle dolduruldu |
| Ana sayfa kategori kartları **Unsplash stok fotoğrafı** kullanıyordu | Gerçek kategori görselleri bağlandı |
| Kategori kartlarında **"0 ürün"** yazıyordu | Gerçek ürün sayısı (alt kategoriler dahil) |
| Başlıklar bozuktu: "İNsöRt ÜRüNler" | Türkçe uyumlu düzeltildi |
| `/products/featured` **500** veriyordu (Prisma'da `isVisible`, kolon adı `visible`) | 200, 8 ürün |
| Giriş ekranında **"Geliştirme Hesabı: admin@admin.com / asd123"** kutusu | Kaldırıldı, şifre alanı boş |
| Dashboard **"Toplam Sipariş: 500"** (store 500 limitle çekiyordu) | Gerçek toplam: **1879** |
| Bayi kartlarında **"Sipariş / Ciro: 0 / ₺0,00"** | 259 bayi için dolduruldu (en çok 75 sipariş / ₺10,6M) |
| Bayi listesi **bankalar/belediyelerle başlıyordu** | Sipariş geçmişi olan gerçek bayiler önce |
| Ürün listesinde stoksuzlar üstteydi | Stoklu + görselli önce (ilk sayfa: 25/25 görselli, 0 "Stokta Yok") |

Gezilen ekranlar: Dashboard · Siparişler (gerçek bayiler, cari kodları, tutarlar) ·
Ürünler (5414 kayıt, filtreler, CSV, Netsis senkronize) · Bayiler (1446) ·
**Kategoriler (yeni sayfa: 12 ana + 47 alt, 52 görsel, ekle/düzenle/sil)**

## SON DOĞRULAMA (11 Ağustos 15:35)

Tüm sayfalar HTTP 200, en yavaş 0,12 s · 6 container healthy ·
Netsis sync çalışıyor (5071 ürün + 5071 stok, 0 hata) ·
2491 görünür ürün · 87 kategori · 1879 sipariş · 1446 bayi
