# Ideasoft Aktarımı + Sunum Hazırlığı — Durum Raporu

**Tarih:** 8 Ağustos 2026
**Ortam:** `sadoksan.smartinnventory.com` (canlı), sunucu `45.43.152.52`, proje `/home/can/sadoksan`

---

## 1. TAMAMLANANLAR

### 1.1 Ideasoft API bağlantısı açıldı

Eski e-ticaret (Ideasoft) Admin API'sine OAuth2 `authorization_code` akışıyla bağlanıldı.

| Bilgi | Değer |
|---|---|
| Panel | `https://sadoksaninsaat.myideasoft.com` |
| Uygulama | **CanSoftware** (ID 9) |
| Client ID | `9_4d9v...` (tam değer sunucuda) |
| Credentials dosyası | `/home/can/sadoksan/scripts/.ideasoft-env` (chmod 600, **.gitignore'da**) |
| Token dosyası | `/home/can/sadoksan/scripts/.ideasoft-token.json` (24 saat, `refresh_token` var) |
| API kökü | `https://sadoksaninsaat.myideasoft.com/admin-api` |
| Yetkilendirme | `https://sadoksaninsaat.myideasoft.com/panel/auth` |
| Token ucu | `https://sadoksaninsaat.myideasoft.com/oauth/v2/token` |

**Önemli:** Eski scriptlerdeki adresler yanlıştı (`/admin/user/auth` → 404, `/oauth/v2/auth` → 500,
`sadoksaninsaat.com.tr/api` → yanlış). Doğru akış API dokümanından (`apidoc.ideasoft.dev`) alındı,
`scripts/ideasoft-pull.mjs` ve `scripts/ideasoft-token.mjs` düzeltildi.

**İzin gereksinimi:** Ideasoft'ta uygulamaya panelden *İzin Yönetimi* kaydı eklenmesi zorunlu
(Entegrasyonlar → API → CanSoftware → İzin Yönetimi Ekle → kullanıcı `yonetici` → Okuma sütunu).
Bu kayıt olmadan yetkilendirme sayfası hata veriyor. Kayıt eklendi (ID 6). Sadece **okuma** izni verildi,
yazma yok. Çalışan `entegra` uygulamasına dokunulmadı.

**Kilit bulgu:** Ideasoft `sku` = Netsis `Stok_Kodu` (örn. `A5A0209C00`, `3011.0Y050K.010.1`).
Örneklenen 100 üründen 98'i DB'de bulundu (%98). Tüm eşleştirmeler bu kod üzerinden yapıldı.

### 1.2 Aktarılan veriler

| Veri | Sonuç |
|---|---|
| Ürün görselleri | **2468 görsel indirildi, 0 hata** (159 MB) → 2281 ürüne bağlandı |
| Kategoriler | 19 → **87** (68 yeni, 16 mevcutla eşleşti, hiyerarşi korundu) |
| Ürün-kategori | 285 → **2936 ürün** |
| Kategori görselleri | **77 kategori görseli** indirildi → `Category.imageUrl` (3'ü Ideasoft'ta yok) |
| Markalar | 22 Brand kaydı → **2172 ürüne** marka atandı |
| Gerçek siparişler | **1879 sipariş + 6569 kalem** (Netsis ftSSip) |
| Yayına alınan ürün | **2205 ürün** (286 → 2491 görünür) |

**Sipariş aktarımı detayı:** Netsis'te 1984 ftSSip siparişi var, 1879'u aktarıldı
(104'ünün carisi DB'de yok, 1'inde ürün eşleşmedi). Eşleştirme:
`Kalems[].STra_CARI_KOD` → `Dealer.cariNo`, `Kalems[].StokKodu` → `Product.netsisCode`,
`FatUst.PLA_KODU` → `Order.notes` (plasiyer kodu).
Sipariş no formatı `NTS-<belge_no>`, status `COMPLETED`, `customerType = 'B2B'`.

**Sonuç:** 1879 sipariş, 263 farklı bayi, **271,5 milyon TL** ciro, 2024-09 → 2026-07 geçmişi.

⚠️ **Not:** `OrderLine.quantity` integer olduğu için Netsis'teki ondalık miktarlar yuvarlandı
(örn. 162.0 → 162). Kg/m² satışlarda küsurat kaybı olur.

### 1.3 Test verisi temizliği

Silinen: 13 `SDK-*` test siparişi, 8 test hesabı (`@test.com` + `claude-verify@sadoksan.internal`),
5 test bayi kaydı. **`admin@admin.com` korundu** (tek yönetici hesabı).

### 1.4 Sunucu bakımı

Docker build cache temizlendi: **~147 GB açıldı** (`/home` boş alan 134G → 281G).
Not: Disk 500 GB; root sadece 15 GB (LVM'de tüm alan `/home`'a verilmiş, `VFree 0`).
Docker veri dizini `/home/docker-data`, yani darlık yok.

### 1.5 Düzeltilen gerçek bug

**Ürün kartlarında görsel görünmüyordu.** Sebep: API `imageUrl: null` dönüyor, görsel
`images` alanında JSON *string* olarak duruyordu; `useProducts.ts:481` ise `p.imageUrl` okuyor.
Çözüm (kod/rebuild gerektirmeyen): DB'de `Product.imageUrl`, `images::jsonb->>0` ile dolduruldu
→ 191 → **2472 ürün**. Doğrulandı: 20/20 görsel tarayıcıda yükleniyor.

### 1.6 Buton/endpoint taraması

`scripts/ideasoft-aktarim/api_esleme.py` ile frontend çağrıları backend route'larıyla karşılaştırıldı:
**203 backend route**, admin 94 çağrı, storefront 48 çağrı.

- Gerçek eksik tek: **`POST /alneo/invoice/:id`** (e-fatura, API dokümanı bekliyor)
- Yanlış pozitifler: `/products/categories` (çalışıyor, 200), `/netsis/status/stock`
  (`status/:syncType` route'una düşüyor)
- **Tüm `Modal` kullanımları doğru kalıpta** (`:open`, `v-if` değil) → kırık buton yok

### 1.7 Sunum için demo bayi girişi

| | |
|---|---|
| E-posta | `bayi@sadoksan.com` |
| Şifre | `sunum2026` |
| Bayi | ERZMEKANİK DÜNYA MÜHENDİSLİK (cari `120.AE.25.0052`) |
| Durum | `ACTIVE`, kredi limiti 15.000.000 TL, bakiye 7.405.396 TL, kullanılabilir 7.594.604 TL |
| Sipariş | **75 gerçek sipariş** |

Giriş testi başarılı (HTTP 201, rol `DEALER`). Test bayileri silindiği için sunumda giriş
yapılabilecek hesap kalmamıştı; bu hesap onun yerine hazırlandı.

⚠️ Kredi limiti sunum için elle yükseltildi (gerçekte 0'dı). Sunum sonrası panelden düzeltilmeli.

---

## 2. KALAN İŞLER (sıradaki oturum)

### 2.1 Storefront ürün listesi — `apps/storefront/app/pages/urunler/index.vue`

1. **Pagination bozuk (acil):** satır ~267-269 `v-for="p in totalPages"` → 44 sayfa için 44 buton
   basıyor, ekranın altında upuzun bir şerit oluşuyor. Akıllı pagination gerekiyor
   (ilk / son / aktif çevresi / `...`).
2. **Sayfa başına ürün sayısı seçici** eklenmeli: 25 / 50 / 100 (şu an sabit `itemsPerPage`).
3. **Stokta olmayanlar üstte görünüyor** → sıralama stoklu ürünleri öne alacak şekilde
   düzeltilmeli. (Not: 5414 üründen sadece **344'ünde** stok var — Netsis'teki gerçek durum,
   görünür 2491 üründen 285'i stoklu. Yani "STOKTA YOK" etiketleri veri gerçeği.)

### 2.2 Mega menü kategori görseli — `apps/storefront/app/components/site/ProductsMegaMenu.vue`

Satır **532**: `<span class="text-xs text-ink-400">Görsel yakında eklenecek</span>` —
navbar'da "Ürünler" açılınca sağdaki büyük alanda placeholder duruyor. Artık kategori
görselleri hazır (`Category.imageUrl` → `/images/categories/<id>.png`), oraya bağlanmalı.

### 2.3 "Gelince haber ver" butonu

Stokta olmayan ürünlerde bu buton olacak, basınca kayıt oluşup mesaj/mail gidecek.
DB'de **`NotifyRequest` tablosu var** ama backend'de controller/endpoint **yok** — yazılmalı.
(Kullanıcı notu: mail + WhatsApp entegrasyonu ayrıca konuşulacak.)

### 2.4 Panelde Kategori yönetim sayfası — YOK

Backend CRUD tam (`GET/POST/PATCH/DELETE /products/categories`), ama panelde ayrı kategori
sayfası yok; kategori sadece ürün formundan isimle oluşturulabiliyor, **görsel seçilemiyor**.
Liste + ekle/düzenle/sil + görsel yükleme sayfası yazılmalı.

### 2.5 Panelde mevcut olanlar (kontrol edildi, çalışıyor)

- Ürün yayınlama: `toggleVisible` + `bulkVisible` / `bulkPurchasable` ✅
- Ürün varyantı: `ProductVariationEditor.vue` ✅
- Ürünler sayfasında kategoriler (sayılarıyla) ve markalar ✅
- Ürün detay linkleri: 40 link çalışıyor, slug `useProducts.ts` içinde üretiliyor
  (`Product` tablosunda `slug` kolonu yok) ✅
- Görselli proforma: python-service `/generate` `imageUrl` destekliyor, API gönderiyor,
  test PDF'i **5 gömülü görselle** üretildi ✅ (müşteri adı olarak `dealer.company`
  yani **cari ünvanı** kullanılıyor — istenen kural)

### 2.6 Diğer açık konular

- **Bayi e-postaları:** 1446 bayinin e-postası `cari-<kod>@netsis.local` yer tutucu.
  Ideasoft'taki 337 üyenin hepsinde gerçek e-posta/telefon var **ama eşleştirme anahtarı yok**
  (`currentAccount.code` boş, VKN sadece 1 üyede, siparişlerde cari kod tutulmamış,
  isim eşleştirmesi %0 — cari ünvanı ile bayi adı uyuşmuyor, bu zaten bilinen bir durum).
  Ya elle eşleştirme ya da bayi ilk girişte kendi e-postasını doğrular.
- Bankalar/belediyeler bayi listesinde (hepsi `PENDING`, işlevsel zarar yok, panelde gürültü).
- Netsis `SADOKSANTEST`'e bağlı (kullanıcı kararı: canlı gibi kullanılacak, sorun değil).
- `NETSIS_ORDER_PUSH_ENABLED` kapalı — yeni siparişler Netsis'e yazılmıyor.
- SMTP yok, e-posta sadece loglanıyor.
- Misafir kullanıcı fiyat görmüyor ("Fiyat Görmek İçin Giriş Yapın") — B2B mantığı.

---

## 3. ÖNEMLİ KOMUTLAR / KONUMLAR

```bash
# Deploy
cd /home/can/sadoksan
docker compose -f docker-compose.prod.yml build storefront|admin|api
docker compose -f docker-compose.prod.yml up -d storefront|admin|api

# DB (dogru container: sadoksan-postgres-prod)
docker exec -i sadoksan-postgres-prod psql -U sadoksan -d sadoksan -c "SELECT ..."

# Ideasoft token durumu
cd /home/can/sadoksan/scripts && . ./.ideasoft-env && node ideasoft-token.mjs
```

**Aktarım scriptleri:** `scripts/ideasoft-aktarim/`
`idea_fetch.py` (ürün çek), `idea_download.py` (görsel indir), `idea_db_update.py` (görsel bağla),
`idea_kategori.py`, `idea_marka.py`, `kategori_gorsel.py`, `netsis_siparis_aktar.py`,
`api_esleme.py` (endpoint taraması), `test_veri_sil.sql`

**Yedekler** (`/home/can/`):
`yedek-product-images-20260807-185333.csv`, `yedek-kategori-oncesi-20260808-110716.sql`,
`yedek-visible-oncesi-20260808-113233.csv`, `yedek-siparis-oncesi-20260808-122504.sql`,
`yedek-testveri-oncesi-20260808-122825.sql` (tam dump, 3.9M)

---

## 4. ÖNEMLİ TEKNİK NOTLAR

- **Nitro/Nuxt gotcha:** storefront prod build'inde `public/` dosya listesi build sırasında
  gömülüyor. Sonradan host'a eklenen görseller **404** verir → `docker compose build storefront`
  şart. Bind mount ile çözülmez (manifest sorunu).
- `Product.images` kolonu **text** (jsonb değil) — `images::jsonb->>0` ile okunabilir.
- `Product`'ta `slug` kolonu **yok**; storefront slug'ı `brand-name`'den üretir.
- Stok kolonları: `netsisStock`, `displayStock`, `reservedStock` (`stock` diye kolon yok).
- Enum'lar: `CustomerType` = `B2C|B2B`, `DealerStatus` = `PENDING|ACTIVE|INACTIVE|REJECTED`,
  `OrderStatus` = `PENDING_APPROVAL|APPROVED|PREPARING|SHIPPED|COMPLETED|CANCELLED|REJECTED|
  RETURN_REQUESTED|RETURNED`.
- Login DTO alanı `login` (email değil): `{"login": "...", "password": "..."}`.
- Netsis token: `POST /api/v2/token`, form-urlencoded, parametreler **PascalCase**
  (`DbName`, `DbUser`, `DbPassword`, `BranchCode`, `DbType`). Her token bir lisans koltuğu tutar,
  iş bitince `GET /api/v2/revoke` ile bırakılmalı.
- `ideasoft_token` / `ideasoft_auth_code` / `ideasoft_id_mapping` tabloları **boş** ve farklı amaçlı:
  bizim sistemin *Ideasoft gibi davranıp Entegra'nın yerine geçmesi* için hazırlanmış altyapı.

---

## 5. GÜVENLİK / VERİ BÜTÜNLÜĞÜ

Tüm aktarımlar **yalnızca boş alanları doldurdu**, mevcut veri ezilmedi:
- Görsel/marka/kategori güncellemeleri `WHERE ... IS NULL OR = ''` koşuluyla yapıldı
- Sipariş aktarımı mevcut `orderNo` çakışmalarını atladı
- Her adım öncesi yedek alındı, sonrasında sayım doğrulaması yapıldı
- Ideasoft'ta yalnızca **okuma** yapıldı; canlı satışa ve `entegra` uygulamasına dokunulmadı
- Netsis'te sadece okuma yapıldı, alınan token iş sonunda iptal edildi

**Doğrulanan son durum:** 6 container healthy, dashboard sorguları 2-9 ms,
site yanıtı 0,11-0,22 s, API hatasız.
