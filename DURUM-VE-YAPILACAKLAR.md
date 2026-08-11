# Sadoksan ERP — Durum ve Yapılacaklar

> **Bu dosya tek başına yeterlidir.** Yeni bir bilgisayarda / yeni bir oturumda işe devam etmek için
> gereken her şey burada: yapılanlar, yapılacaklar, giriş bilgileri, komutlar ve karşılaşılan tuzaklar.
> Son güncelleme: **11 Ağustos 2026**

---

## 0. HIZLI BAKIŞ

| | |
|---|---|
| Canlı site | https://sadoksan.smartinnventory.com |
| Yönetici paneli | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| API | https://sadoksan.smartinnventory.com/api (global prefix `api`) |
| Sunucu | `ssh can@45.43.152.52` — proje `/home/can/sadoksan` |
| Depo | `git@github.com:brkcnt23/sadoksanin.git` (dal: `main`) |
| Stack | Nuxt 4 (storefront SSR + admin SPA), NestJS 11, PostgreSQL 15 + Prisma 7.8, Python Flask (PDF), Redis |

**Container'lar** (hepsi `docker-compose.prod.yml`):
`sadoksan-storefront-prod` (:3011→3000) · `sadoksan-admin-prod` (:3012→3002) ·
`sadoksan-api-prod` (:3010→3001) · `sadoksan-postgres-prod` · `sadoksan-redis-prod` ·
`sadoksan-python-prod` (:3013→5000)

⚠️ **Aynı sunucuda başka projeler de var** (`ecommerce-*`, `erzurumbio-*`, `jamcontest-*`, `sitoded_*`).
Veritabanı işlemlerinde **`sadoksan-postgres-prod`** kullanılmalı — `ecommerce-postgres-prod` başka bir proje.

### Güncel veri durumu

| Veri | Adet |
|---|---|
| Ürün (toplam) | 5414 |
| Görünür + satın alınabilir ürün | **2491** |
| Görseli olan ürün | 2472 |
| Kategori | 87 (12 ana + 75 alt) |
| Kategori görseli | 77 |
| Marka | 22 (2172 ürüne atanmış) |
| Bayi | 1446 (hepsi `PENDING`, 1'i `ACTIVE` — sunum bayisi) |
| Sipariş | 1879 (gerçek Netsis geçmişi, 271,5 milyon TL, 263 bayi, 2024-09 → 2026-07) |
| Sipariş kalemi | 6590 |
| Stoklu ürün | 344 (görünürler içinde 285) — Netsis'teki gerçek durum |

### Giriş bilgileri

| Rol | Giriş | Şifre |
|---|---|---|
| Bayi (sunum) | `bayi@sadoksan.com` | `sunum2026` |
| Yönetici | `admin@admin.com` | **BİLİNMİYOR** — bkz. Yapılacaklar #1 |

Sunum bayisi = ERZMEKANİK DÜNYA MÜHENDİSLİK (cari `120.AE.25.0052`), **75 gerçek siparişi var**,
durum `ACTIVE`, kredi limiti sunum için 15.000.000 TL'ye çekildi (gerçekte 0'dı), bakiye 7.405.396 TL borç.

⚠️ Login isteğinde alan adı **`login`**, `email` değil: `{"login": "...", "password": "..."}`

---

## 1. YAPILANLAR

### 1.1 Ideasoft API bağlantısı (eski e-ticaretten veri çekimi)

Eski site: `sadoksaninsaat.com.tr` / panel `sadoksaninsaat.myideasoft.com`.
OAuth2 `authorization_code` akışı ile Admin API'ye bağlanıldı.

| | |
|---|---|
| Uygulama | **CanSoftware** (panel ID 9) |
| Credentials | `/home/can/sadoksan/scripts/.ideasoft-env` (chmod 600, `.gitignore`'da) |
| Token | `/home/can/sadoksan/scripts/.ideasoft-token.json` (24 saat, `refresh_token` var) |
| API kökü | `https://sadoksaninsaat.myideasoft.com/admin-api` |
| Yetkilendirme | `https://sadoksaninsaat.myideasoft.com/panel/auth` |
| Token ucu | `https://sadoksaninsaat.myideasoft.com/oauth/v2/token` |
| Doküman | `https://apidoc.ideasoft.dev` |

**Doğru akış bulunana kadar denenen yanlış yollar** (tekrar denenmesin):
`/admin/user/auth` → 404 · `/oauth/v2/auth` → 500 (her client_id ile, uydurma olanla bile) ·
`sadoksaninsaat.com.tr/api` → yanlış kök. Eski scriptlerde bunlar yazılıydı, düzeltildi.

**Zorunlu adım:** Ideasoft panelinde uygulamaya *İzin Yönetimi* kaydı eklenmeli
(Entegrasyonlar → API → CanSoftware → İzin Yönetimi Ekle → kullanıcı `yonetici` → **Okuma** sütunu).
Bu kayıt olmadan yetkilendirme sayfası patlıyor. Eklendi (kayıt ID 6), sadece okuma izni verildi.
Çalışan `entegra` uygulamasına dokunulmadı (canlı satış onun üzerinden Netsis'e sipariş iletiyor).

**🔑 En kritik bulgu:** **Ideasoft `sku` = Netsis `Stok_Kodu`**
(örn. `A5A0209C00`, `3011.0Y050K.010.1`). Örneklenen 100 üründen 98'i DB'de bulundu (%98).
Bütün eşleştirmeler bu kod üzerinden yapıldı. Bu, projenin en büyük belirsizliğiydi.

### 1.2 Aktarılan veriler

- **2468 ürün görseli** indirildi (0 hata, 159 MB) → **2281 ürüne** bağlandı
- **77 kategori görseli** indirildi → `Category.imageUrl` (3'ü Ideasoft'ta yok)
- **Kategoriler:** 84 Ideasoft kategorisi işlendi → 68 yeni oluşturuldu, 16 mevcutla eşleşti,
  hiyerarşi (`parentId`) korundu → kategori 19 → **87**, kategorili ürün 285 → **2936**
- **Markalar:** 22 marka `Brand` tablosuna eklendi → **2172 ürüne** marka + `brandId` atandı
- **Gerçek siparişler:** Netsis `ftSSip` belgelerinden **1879 sipariş + 6569 kalem**
  (1984'ten 104'ü DB'de olmayan carilere ait, 1'inde ürün eşleşmedi)
  - Eşleştirme: `Kalems[].STra_CARI_KOD` → `Dealer.cariNo`, `Kalems[].StokKodu` → `Product.netsisCode`
  - `FatUst.PLA_KODU` (plasiyer kodu) → `Order.notes`
  - Sipariş no `NTS-<belge_no>`, durum `COMPLETED`, `customerType = 'B2B'`
- **2205 ürün yayına alındı** (kategorili + görselli + fiyatlı olanlar) → görünür 286 → **2491**

### 1.3 Test verisi temizliği

Silindi: 13 adet `SDK-*` test siparişi, 8 test hesabı (`@test.com` + `claude-verify@sadoksan.internal`),
5 test bayi kaydı. **`admin@admin.com` korundu** (tek yönetici hesabı).

### 1.4 Katalog arayüzü düzeltmeleri (11 Ağustos)

| Sorun | Çözüm |
|---|---|
| Pagination her sayfa için buton basıyordu (100 sayfa = 100 buton) | İlk/son + aktif çevresi + `…`, ileri/geri okları |
| Sayfa başına ürün sayısı sabitti | **25 / 50 / 100** seçici + "sayfa X/Y" bilgisi |
| Stokta olmayanlar listenin başındaydı | Backend `orderBy: [{displayStock:'desc'},{createdAt:'desc'}]` + frontend sıralama |
| 1491 ürün hiç görünmüyordu | `useProducts` limit 1000 → 3000 (2491 ürünün tamamı) |
| Mega menüde "Görsel yakında eklenecek" | Görsel havuzu API yanıtını `data/items` diye okuyordu, API `{products,total}` döndürüyor → havuz hep boştu. Düzeltildi + gerçek kategori görselleri bağlandı |
| Kart yer tutucusu görselin üstüne biniyordu | `v-if="!product.image"` eklendi (eskiden koşulsuzdu) |
| "Haber Ver" sadece `purchasable=false` ürünlerdeydi ve yalnız WhatsApp açıyordu | Stokta olmayan **tüm** ürünlerde görünür; `POST /admin/notifications` ile `NotifyRequest` kaydı oluşturur, hata olursa WhatsApp'a düşer, durum geri bildirimi verir |

### 1.5 Panelde kategori yönetimi (YENİ)

`apps/admin/app/pages/kategoriler.vue` — backend CRUD zaten vardı ama ekranı yoktu; kategori
sadece ürün formundan isimle açılabiliyordu, görsel seçilemiyordu.
Yeni sayfa: ağaç görünümü, görsel önizleme, ekle/düzenle/sil, alt kategori ekleme, görsel yükleme,
özet kartları (görseli eksik kategori sayısı dahil). Menüye "Kategoriler" eklendi (Katalog grubu).
Store'a `updateCategory` + `deleteCategory` eklendi.

### 1.6 Düzeltilen kritik bug: ürün görselleri hiç görünmüyordu

API `imageUrl: null` dönüyor, görsel `images` alanında **JSON string** olarak duruyordu
(`"[\"/images/products/x.png\"]"`), `useProducts.ts` ise `p.imageUrl` okuyordu → kartlarda görsel yok.
Çözüm (kod/rebuild gerektirmedi): DB'de `Product.imageUrl = images::jsonb->>0` ile dolduruldu
→ 191 → **2472 ürün**. Tarayıcıda 20/20 görsel yüklendiği doğrulandı.

### 1.7 Endpoint / buton taraması

`scripts/ideasoft-aktarim/api_esleme.py` — frontend çağrılarını backend route'larıyla karşılaştırır
(tekrar çalıştırılabilir: `python3 scripts/ideasoft-aktarim/api_esleme.py`).

- **203 backend route**; admin 94 çağrı, storefront 48 çağrı
- Tek gerçek eksik: **`POST /alneo/invoice/:id`** (e-fatura, API dokümanı bekliyor)
- Yanlış pozitifler: `/products/categories` (çalışıyor), `/netsis/status/stock` (`status/:syncType`'a düşüyor)
- **Tüm `Modal` kullanımları doğru kalıpta** (`:open`, `v-if` değil) → sessizce çalışmayan buton yok

### 1.8 Görselli proforma

Python `/generate` ucu `items[].imageUrl` destekliyor, API `fixImageUrl()` ile tam URL üretip
gönderiyor, python container'ı görseli HTTP ile indirip PDF'e basıyor
(`_fetch_and_resize_image`). Test PDF'i **5 gömülü görselle** üretildi.
Müşteri adı olarak `dealer.company` yani **cari ünvanı** kullanılıyor (istenen kural).

⚠️ `/generate` zorunlu alanlar: `templateType` (`LOCAL`|`INTERNATIONAL`), `customer.name`,
`items`, `companyInfo`. Item alanları: `imageUrl`, `sku`, `description`, `quantity`, `price`.

### 1.9 Sunucu bakımı

Docker build cache temizlendi → **~147 GB açıldı** (`/home` boşluk 134G → 281G).
Disk darlığı **yok**: 500 GB disk, root 15 GB (LVM'de tüm alan `/home`'a verilmiş, `VFree 0`),
Docker veri dizini `/home/docker-data`.

---

## 2. YAPILACAKLAR

### 🔴 Sunum öncesi

**1. Yönetici şifresi bilinmiyor.**
`admin@admin.com` şifresi elde yok (eski kayıtlardaki `asd123` geçersiz). Panel sunumu için şart.
Sıfırlamak gerekirse: API container'ında bcrypt hash üretilip `User.password` güncellenir —
```bash
docker exec sadoksan-api-prod node -e "const b=require('bcryptjs'); console.log(b.hashSync('YENI_SIFRE',10));"
# çıkan hash ile: UPDATE "User" SET password='<hash>' WHERE email='admin@admin.com';
```

**2. Sunum bayisinin kredi limiti geri alınmalı.**
`bayi@sadoksan.com` (ERZMEKANİK) limiti sunum için 0 → 15.000.000 TL yapıldı.
Sunumdan sonra panelden gerçek değerine döndürülmeli.

**3. (Öneri) İlk sayfa görselsiz görünüyor.**
Stoklu 285 ürün ağırlıklı olarak eski İnsört/FISCHER kayıtları ve görselleri yok; Netsis'ten gelen
görselli ürünlerin stoğu 0. "Stoklu önce" sıralaması bu yüzden ilk ekrana görselsiz ürün getiriyor.
İstenirse sıralama **"stoklu + görselli önce"** yapılabilir
(`products.service.ts` → `orderBy` içine `imageUrl` bazlı ikinci kriter, ya da hesaplanmış alan).

### 🟡 İşlevsel eksikler

**4. "Gelince haber ver" bildirimi gerçekten gönderilmiyor.**
Buton çalışıyor, `NotifyRequest` kaydı oluşuyor (`status='pending'`), panelde "Bildirimler"
ekranından görülebiliyor. Ama:
- `POST /admin/notifications/send/:productId` ucu mailer'ı çağırıyor, **MailerService console-only**
  (SMTP yok) → e-posta gitmiyor
- WhatsApp entegrasyonu yok (`channel: 'whatsapp'` alanı hazır, gönderim yok)
- Ürün stoğa girdiğinde **otomatik tetikleme yok** — şu an manuel gönderim gerekiyor.
  Netsis stok sync'i sonrası `displayStock 0 → >0` geçişinde bekleyen talepleri tetikleyecek
  kanca yazılmalı (`netsis.service` stok sync sonuna).

**5. SMTP yapılandırması yok.** Tüm e-postalar sadece loglanıyor (proforma gönderimi,
bayi onayı, bildirimler dahil). Gerçek gönderim için SMTP bilgileri + `MailerService` bağlanması.

**6. Bayi e-postaları yer tutucu.** 1446 bayinin e-postası `cari-<kod>@netsis.local`.
Bu hâliyle bayiler giriş yapamaz. Ideasoft'ta 337 üyenin **hepsinde gerçek e-posta/telefon var**
ama bağlanacak anahtar yok:
- `currentAccount.code` boş, VKN sadece 1 üyede dolu, siparişlerde cari kod tutulmamış
- İsim eşleştirmesi %0 — **cari ünvanı ile bayinin kendi girdiği isim uyuşmuyor**
  (bu bilinen bir durum; fabrika faturayı cari ünvanıyla kesiyor, kimlik olarak cari ünvanı esas)

Seçenekler: (a) elle eşleştirme, (b) bayi ilk girişte cari no + telefon ile kendi e-postasını doğrular.

**7. Bankalar/belediyeler bayi listesinde.** `CARI_TIP='A'` filtresi FİNANSBANK, ZİRAAT,
belediyeler, spor kulüpleri gibi kayıtları da bayi yaptı. Hepsi `PENDING`, işlevsel zarar yok
ama panelde 1446 "onay bekliyor" gürültüsü var. Gerçek sipariş geçmişi olan bayi sayısı **271**.

**8. `POST /alneo/invoice/:id` yok** — e-fatura entegrasyonu, Alneo API dokümanı bekliyor.
Panelde buton var, hata gösteriyor (sessiz sahte davranış yok).

### 🟢 Netsis / muhasebe tarafı

**9. Netsis `SADOKSANTEST` veritabanına bağlı** (canlı `SADOKSAN2026` değil).
Kullanıcı kararı: **sunuma kadar canlı gibi kullanılacak, sipariş oluşturup silmek serbest.**
Sync'ler çalışıyor: ürün 5071 kayıt / stok 5071 kayıt, 0 hata (saat başı scheduler).

**10. `NETSIS_ORDER_PUSH_ENABLED` kapalı.** Yeni siparişler Netsis'e yazılmıyor.
Motor hazır ve test edilmiş (`pushSalesOrder`, `ftSSip`, `Tip:7`, belge no `ENT1-` + 15 karakter,
depo `resolveWarehouse` ile ürün bazlı çözülüyor). Açmak bilinçli go-live adımı.

**11. 104 sipariş aktarılamadı** — carileri DB'de yok (import filtresi dışında kalmış cariler).
Gerekirse `importDealers` tekrar çalıştırılıp sonra sipariş aktarımı yeniden denenebilir.

**12. `OrderLine.quantity` integer** — Netsis'teki ondalık miktarlar yuvarlandı (162.0 → 162).
Kg/m² satışlarda küsurat kaybı olur. Kalıcı çözüm: kolonu `Decimal`/`Float` yapan migration.

**13. Plasiyer–bayi atamaları yapılmadı.** Netsis'te bayi↔plasiyer statik bağ yok; bağ sadece
sipariş belgelerindeki `PLA_KODU`'ndan çıkarılabiliyor (aktarılan siparişlerin `notes` alanında var).
7 plasiyer kodu mevcut: `25170004`(905), `25170002`(311), `25170007`(296), `25170006`(282),
`MERKEZ`(145), `25170001`(42), `25170003`(3). Kod↔isim eşlemesi Netsis'te yok.

---

## 3. KOMUT REFERANSI

```bash
# Deploy (kod değişikliğinden sonra build ŞART, restart yetmez)
cd /home/can/sadoksan
docker compose -f docker-compose.prod.yml build storefront   # veya admin | api
docker compose -f docker-compose.prod.yml up -d storefront

# Veritabanı
docker exec -i sadoksan-postgres-prod psql -U sadoksan -d sadoksan -c "SELECT ..."

# Migration
docker compose -f docker-compose.prod.yml exec -T -w /app/apps/api api npx prisma migrate deploy

# Loglar
docker logs sadoksan-api-prod --tail 50
docker logs sadoksan-python-prod --tail 30

# Ideasoft token durumu / yenileme
cd /home/can/sadoksan/scripts && . ./.ideasoft-env && node ideasoft-token.mjs

# Endpoint taraması (kırık buton/çağrı avı)
python3 /home/can/sadoksan/scripts/ideasoft-aktarim/api_esleme.py
```

**Aktarım scriptleri:** `scripts/ideasoft-aktarim/`
`idea_fetch.py` (ürün çek) · `idea_download.py` (görsel indir) · `idea_db_update.py` (görsel bağla) ·
`idea_kategori.py` · `idea_marka.py` · `kategori_gorsel.py` · `netsis_siparis_aktar.py` ·
`api_esleme.py` · `test_veri_sil.sql` · `sunum_bayi.sql`
Hepsi önce **dry-run** çalışır, `--apply` ile uygular.

**Yedekler** (`/home/can/`): `yedek-product-images-*.csv` · `yedek-kategori-oncesi-*.sql` ·
`yedek-visible-oncesi-*.csv` · `yedek-siparis-oncesi-*.sql` ·
`yedek-testveri-oncesi-20260808-122825.sql` (tam dump, 3.9M)

---

## 4. TUZAKLAR (tekrar yaşanmasın)

- **Nuxt/Nitro:** storefront prod build'inde `public/` dosya listesi build sırasında gömülür.
  Sonradan host'a eklenen görsel **404** verir → `docker compose build storefront` şart.
  Bind mount ile çözülmez (manifest sorunu).
- **`Product.images` kolonu `text`**, jsonb değil → `images::jsonb->>0` ile okunur.
- **`Product`'ta `slug` kolonu YOK** — storefront slug'ı `brand-name`'den üretir, mükerrerlere SKU ekler.
- **Stok kolonları:** `netsisStock`, `displayStock`, `reservedStock`, `minimumStock` (`stock` diye kolon yok).
- **Enum'lar:** `CustomerType` = `B2C|B2B` · `DealerStatus` = `PENDING|ACTIVE|INACTIVE|REJECTED` ·
  `OrderStatus` = `PENDING_APPROVAL|APPROVED|PREPARING|SHIPPED|COMPLETED|CANCELLED|REJECTED|RETURN_REQUESTED|RETURNED`
- **API liste yanıtı `{products, total}`** — `data`/`items` değil. (Mega menü bug'ının sebebi buydu.)
- **`Modal` bileşeni `:open` prop'u ile açılır**, `v-if` ile DEĞİL (içeride `v-if="open"` var).
  `v-if` kullanılırsa buton tıklanır ama hiçbir şey olmaz.
- **Netsis token:** `POST /api/v2/token`, form-urlencoded, parametreler **PascalCase**
  (`DbName`, `DbUser`, `DbPassword`, `BranchCode`, `DbType`). Her token bir **lisans koltuğu** tutar;
  iş bitince `GET /api/v2/revoke` ile bırakılmalı. Eşzamanlı token isteği 401 üretir (singleflight var).
- **Prisma:** `where: { field: undefined }` filtreyi tamamen yok sayar → `updateMany` tüm satırları vurur.
- **`@Public()` + Passport:** guard'da erken `return true` Passport'u atlar, `req.user` undefined kalır
  (popup hedeflemesini bozmuştu; şimdi "opsiyonel auth" şeklinde).
- **N+1:** ürün listesi döndüren her yeni uçta per-ürün async DB çağrısından kaçın; batch/`groupBy` kullan
  (5414 üründe API'yi çökertmişti).
- **SSH ile tek tırnaklı komut içinde tek tırnak** kullanmak SQL/Python'u bozar → script dosyası
  yazıp `scp` ile göndermek en güvenlisi.
- `ideasoft_token` / `ideasoft_auth_code` / `ideasoft_id_mapping` tabloları **boş ve farklı amaçlı**:
  bizim sistemin *Ideasoft gibi davranıp Entegra'nın yerine geçmesi* için hazırlanmış altyapı.

---

## 5. VERİ GÜVENLİĞİ İLKESİ (bu projede uygulanan)

Müşteri sistemi **canlı kullanımda**. Bütün aktarımlar şu kurallarla yapıldı:

- Yalnızca **boş alanlar** dolduruldu (`WHERE ... IS NULL OR = ''`); mevcut veri hiç ezilmedi
- Sipariş aktarımı mükerrer `orderNo`'ları atladı
- Her adım öncesi **yedek**, sonrasında **sayım doğrulaması**
- Ideasoft'ta yalnızca **okuma**; canlı satışa ve `entegra` uygulamasına dokunulmadı
- Netsis'te yalnızca okuma; alınan lisans koltuğu iş sonunda iptal edildi
- Silme işlemleri tek transaction içinde, önce dry-run/analiz ile

**Doğrulanan son durum:** 6 container healthy · dashboard sorguları 2-9 ms ·
site yanıtı 0,11-0,25 s · API hatasız · ilk sayfada "Stokta Yok" etiketi 0.
