# Netsis Entegrasyonu — Durum ve Bitirme Planı

> **Güncelleme:** 2026-07-20
> **Yöntem:** Kod incelemesi + canlı SADOKSAN2026 verisiyle doğrulama

---

## 1. Mevcut Durum

### Çalışan
- NetOpenX REST API fabrikada çalışıyor (`172.16.156.38:8081`), 7/7 test başarılı
- Token akışı düzeltildi (form-urlencoded), commit edildi
- Okuma senkronu **kodu yazılmış**: `syncProducts`, `syncStock`, `syncCari`,
  `syncExchangeRates`, `syncAll` + scheduler (stok 30dk, ürün 1s, cari 2s, kur 6s)
- Şema hazır: `Product.netsisCode`, `Dealer.cariNo`, `Order.eIrsaliyeNo`

### Bozuk
- **SSH tüneli 10 gündür ölü.** Son çalışma 2026-07-10, bugün 07-20.
  API her 30 dk `ECONNREFUSED 172.18.0.1:17071` hatası veriyor, kimse fark etmemiş.
  Tünel de proxy de `nohup`/düz `ssh -R` ile ayakta tutuluyordu.

### Düzeltilen (2026-07-20, canlı veriyle doğrulandı)
| # | Hata | Etkisi |
|---|---|---|
| 1 | `syncCari` yanlış alan adı (`Cari_Kod` vs gerçek `CARI_KOD`) | `undefined` → Prisma filtreyi yok sayar → updateMany **tüm bayileri** günceller |
| 2 | `Borclanan_Tutar`/`Kredi_Limiti` Netsis'te yok, `\|\| 0` yazılıyordu | 5 bayinin bakiyesi + **580.000 TL limit tanımı sıfırlanırdı** |
| 3 | Yeni ürünlerde `visible` belirtilmemiş (default `true`) | SADOKSAN2026'daki **5036 kart** storefront'a çöp ürün olarak düşerdi |
| 4 | Stok kodu trim edilmiyor (`" 5082-...\t"`) | Mükerrer ürün + tutmayan eşleşme |
| 5 | KDV 100'e bölünmüyor (Netsis `20.0`, şema `0.20`) | Vergi hesabı **100 kat** şişerdi |

> Bu hataların hiçbiri henüz veriye zarar vermedi — **çünkü tünel ölüydü.**
> Tünel önce tamir edilseydi, ilk sync turunda tetiklenirlerdi.

---

## 2. Faz 1 — Köprüyü sağlamlaştır (ÖNCE BU)

Sync kodu artık güvenli, ama bağlantı hâlâ kırılgan.

- [ ] **Fabrika PC:** tüneli Windows servisi yap (otomatik yeniden bağlanma).
      Düz `ssh -R` kopunca geri gelmiyor. *(fabrika tarafında yapılmalı)*
- [ ] **Sunucu:** Python proxy'yi systemd/pm2'ye al (şu an `nohup`)
- [ ] **İzleme:** sync üst üste N kez başarısız olursa e-posta uyarısı.
      10 gün sessiz kalmasının asıl sebebi bu eksik.
- [ ] Reboot testi: iki taraf da kendi kendine ayağa kalksın

## 3. Faz 2 — Okuma senkronunu doğrula

Kod hazır, **gerçek veriyle hiç çalıştırılmadı.**

- [ ] Önce **ENTEGRE9** (boş test DB) ile `syncAll` — davranışı gör
- [ ] Sonra **SADOKSAN2026** ile tek seferlik manuel sync, sonucu incele:
      5036 ürün gizli olarak mı geldi, KDV/fiyat doğru mu, mükerrer var mı
- [ ] `Satis_Fiat1..4` — **hangi fiyat kolonu bizim `basePrice`?** (karar gerek)
- [ ] Kategori/marka eşleme: Netsis `Grup_Kodu` → bizim Category ağacı
- [ ] Bayi bakiyesi için doğru kaynağı bul (`ARPTransactions` / `CariRisk`),
      şu an `cariValidated` dışında bir şey yazmıyoruz

## 4. Faz 3 — Yazma yönü (Sadoksan → Netsis)

Bugüne kadar Netsis'e **hiç yazmadık.** Sırayla:

- [ ] Yazma API'sini **ENTEGRE9 üzerinde** keşfet/test et — asla doğrudan
      SADOKSAN2026'da deneme yazma yapma
- [ ] Doğru belge tipi: sipariş `ftSSip` mi, irsaliye `ftSIrs` mi?
      (elimizde ftSFat=1682, ftSIrs=54 örnek var)
- [ ] **Tetik noktası kararı:** sipariş `APPROVED` olunca mı, `SHIPPED`
      olunca mı Netsis'e düşsün?
- [ ] **Numaralandırma:** e-ticaret için ayrı seri/prefiks — muhasebeden
      alınmalı, Netsis'in kendi numaralarıyla çakışmamalı
- [ ] Hata davranışı: Netsis'e yazma başarısız olursa sipariş durmasın,
      admin panelde "Netsis'e düşmedi" listesi görünsün (`eIrsaliyeNo` boş olanlar)

## 5. Faz 4 — Platformda kalan işler

- [ ] Plasiyer ekranlarını canlıda doğrula (commit `4dcd55d` ile geldi, test edilmedi)
- [ ] Sipariş PDF önizleme — Python tarafı hazır, deploy + buton kaldı
- [ ] Kredi limiti: blokaj kaldırılıp %50/%80/%100 uyarısına çevrildi ama
      **deploy edilmedi** (yarım kaldı) — bayi ekranında yüzdelik gösterimi de eklenecek
- [ ] Banner özelliği
- [ ] Genel sağlamlık taraması (admin + storefront)

## 6. Faz 5 — Prod temizlik

- [ ] Test hesaplarını sil (`bayi@test.com` vb.)
- [ ] DeepSeek API anahtarı `fabrika-setup/README.md` içinde düz metin — iptal/yenile
- [ ] Son güvenlik geçişi

---

## 7. Karar bekleyenler

1. **Fiyat kolonu:** `Satis_Fiat1..4` hangisi bayi fiyatı?
2. **Yazma tetiği:** APPROVED mi SHIPPED mi?
3. **Sipariş serisi:** e-ticaret için ayrı prefiks var mı?
4. **Bakiye kaynağı:** Netsis'ten mi çekilecek yoksa Sadoksan kendi mi hesaplasın?
   (şu an Sadoksan hesaplıyor ve doğru çalışıyor)
