# Netsis Entegrasyon Planı — Fabrika Ziyareti Hazırlığı

> Hazırlanma: 2026-07-02. Kaynak: `/home/can/netopenx.md` (738KB, kullanıcının kendi hazırladığı Netsis
> NetOpenX REST dokümantasyonu) + mevcut `apps/api/src/modules/netsis/` kod tabanı.
> **Bu bir araştırma/planlama dokümanıdır — henüz kod yazılmadı, uygulama fabrikada yapılacak.**

---

## 0) ÖZET — Şu an nerede duruyoruz

- ✅ Sadoksan backend'inde **Netsis entegrasyon kodu zaten %80 hazır** (`netsis.service.ts`, 552 satır): OAuth2 token yönetimi, 4 sync fonksiyonu (ürün, stok, cari, döviz), scheduler, health check — hepsi doğru REST endpoint'lere göre yazılmış, sadece gerçek kimlik bilgileri bekliyor.
- ✅ **Gerçek Netsis stok kod formatı doğrulandı**: fabrikadan gelen Excel'den 896 gerçek ürün (kod+isim+stok) içeri aktarıldı. Kodlar `A5A0209C00`, `3011.0Y050K.010.1` gibi karmaşık alfanumerik — mevcut 285 "sahte" SKU'lu üründen tamamen ayrı duruyorlar (gizli, henüz fiyat/kategori bekliyorlar).
- 🔴 **Ağ bağlantısı sorunu netleşti**: NetOpenX Rest servisi fabrikanın yerel ağında (`http://192.168.x.x:7070`) çalışacak, bizim bulut sunucumuz oraya doğrudan erişemez. **Karar: push-agent** (fabrikadaki Windows makinede küçük bir script, yerelden veri çekip bize HTTPS ile gönderir — router/firewall ayarı gerekmez).
- 🆕 **Fatura/e-fatura akışı netleşti** (bu oturumda keşfedildi): Netsis'in kendi `EDocument` REST API'si var, `SendEDocument()` açıklaması "GİB'e veya Entegrasyon Servislerine gönderir" diyor — yani **Entegra'ya ayrı bağlanmamıza gerek olmayabilir**, Netsis zaten hangi entegratörü kullanıyorsa (muhtemelen Entegra) ona yönlendirebilir. **Fabrikada doğrulanmalı.**

---

## 1) FABRİKADA SORULACAK / DOĞRULANACAK SORULAR (öncelik sırasıyla)

1. **NetOpenX Rest Service kurulu mu, çalışıyor mu?** (`Win+R` → `services.msc` → "Netsis NetOpenX Rest Service" ara). Kurulu değilse kurulum gerekir (bkz. Bölüm 4).
2. **Hangi makinede çalışıyor, IP'si ne?** (muhtemelen Netsis'in kurulu olduğu sunucu/PC — `ipconfig` ile yerel IP'yi al)
3. **`http://localhost:7070/api/v2/help` sayfası o makineden açılıyor mu?** (servis sağlık testi)
4. **Netsis kullanıcı adı/şifre + DB adı (şirket kodu, örn. REMDA2016) + şube kodu** — `.env`'e girilecek: `NETSIS_API_URL`, `NETSIS_USER`, `NETSIS_PASSWORD`, `NETSIS_DB_NAME`, `NETSIS_BRANCH_CODE`
5. **E-fatura entegratörü olarak Entegra mı kullanılıyor, Netsis içinden mi yapılandırılmış?** (Netsis ayarlarında "e-Fatura / e-Belge Entegratör" bölümüne bakılmalı) — cevaba göre Entegra'ya ayrı API entegrasyonu gerekip gerekmediği netleşir.
6. **Fabrikanın internet çıkışı serbest mi (giden HTTPS)?** Push-agent için sadece bu yeterli, gelen bağlantıya izin gerekmiyor.
7. **896 içeri aktarılan üründen örnek birkaçının gerçek fiyat/kategori bilgisini** kim verecek — Netsis'in kendisinden mi (SAT_FIYAT alanı sync ile gelir) yoksa elle mi girilecek?

---

## 2) MİMARİ — Push-Agent Tasarımı (onaylandı: en kolay, router ayarı gerektirmez)

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  FABRİKA (Windows PC)    │         │  BULUT (45.43.152.52)     │
│                          │         │                            │
│  Netsis + NetOpenX Rest  │         │  Sadoksan API (NestJS)     │
│  (localhost:7070)        │         │  sadoksan-api-prod :3010   │
│         ▲                │         │         ▲                  │
│         │ REST (yerel)   │         │         │ HTTPS POST         │
│  ┌──────┴───────────┐    │         │  ┌──────┴────────────┐     │
│  │ push-agent.js     │───┼─────────┼─▶│ POST /api/netsis/  │     │
│  │ (Windows Task      │  │  HTTPS   │  │      push          │     │
│  │  Scheduler ile      │  │  (giden) │  │ (API key ile korun.)│    │
│  │  15-30 dk'da bir)   │  │         │  └────────────────────┘     │
│  └────────────────────┘  │         │                            │
└──────────────────────────┘         └──────────────────────────┘
```

**Neden push, pull değil:** Mevcut kod (`netsis.service.ts`) bizim sunucunun fabrikaya bağlanmasını varsayıyor (pull). Fabrika özel IP'de olduğu için bu doğrudan çalışmaz. Push-agent bunu tersine çevirir: fabrikadaki script periyodik olarak yerel NetOpenX'ten veri çeker, bize güvenli şekilde gönderir. Router/firewall/VPN ayarı gerekmez, sadece "giden internet" yeterli.

---

## 3) YAPILACAKLAR — Fazlar (fabrikada / sonrasında)

### Faz A — Bağlantı Doğrulama (fabrikada, ilk 30 dk)
- [ ] NetOpenX Rest servis durumu kontrol (WSManager.exe ile)
- [ ] `http://localhost:7070/api/v2/help` tarayıcıdan aç, endpoint listesi görünüyor mu
- [ ] Postman/curl ile token al: `POST http://localhost:7070/token` (BranchCode, NetsisUser, NetsisPassword, DbType=1, DbName, DbUser, DbPassword)
- [ ] Alınan token ile `GET /api/v2/Items?limit=5` dene — gerçek ürün verisi dönüyor mu

### Faz B — Push-Agent Yazımı (kod, fabrikada veya sonra uzaktan)
- [ ] `push-agent.js` (Node.js, fabrikadaki PC'de kurulu değilse Node kurulmalı) veya PowerShell scripti:
  - NetOpenX'e login ol (yerel, `localhost:7070`)
  - `GET /api/v2/Items` (tüm ürünler) + `GET /api/v2/Items/PrimInfo` (sadece stok) + `GET /api/v2/ARPs` (cari) + `GET /api/v2/ExRates` (döviz) çek
  - Bizim API'ye POST et: `https://sadoksan.smartinnventory.com/api/netsis/push` (yeni endpoint, API key header ile korunacak — JWT değil, makine-makine auth)
- [ ] Windows Task Scheduler ile 15-30 dakikada bir çalıştır

### Faz C — Backend'de Alım Ucu (kod, bizim tarafımızda)
- [ ] Yeni endpoint: `POST /api/netsis/push` — API key doğrulama (JWT değil, ayrı mekanizma)
- [ ] Mevcut `syncProducts()/syncStock()/syncCari()/syncExchangeRates()` fonksiyonlarının iç mantığı (upsert kısmı) korunacak, sadece veri kaynağı "kendi fetch" yerine "gelen push body" olacak — küçük bir refactor
- [ ] 896 az önce içeri aktarılan ürünle **netsisCode eşleşmesi otomatik olacak** (upsert `where: { netsisCode: item.STOK_KODU }`) — mevcut 896 kayıt güncellenecek, kopya oluşmayacak

### Faz D — E-Fatura (kesinleşmeden önce Soru #5'in cevabı şart)
- Eğer Netsis zaten bir entegratöre (muhtemelen Entegra) bağlıysa:
  - [ ] `EDocumentManager` REST akışı: `POST /api/v2/EDocument` (taslak oluştur, `Tip=ebtEFatura`) → `POST /api/v2/EDocument/SendEDocument` (gönder, `DocumentType=ftSFat`) → `POST /api/v2/EDocument/ShowEDocument` (görüntüle/PDF)
  - [ ] Sadoksan sipariş onaylanınca → Netsis'te sipariş/irsaliye oluştur (`POST /api/v2/ItemSlips`, docType `ftSIrs`) → faturaya çevir (`POST /api/v2/ItemSlips/IrsToFat` veya toplu için `SiparisToIrsFat`) → e-fatura gönder (yukarıdaki EDocument akışı)
- Eğer Entegra ayrı/bağımsız kullanılacaksa: Entegra'nın kendi API dokümantasyonu gerekir (şu an elimizde yok, web'den araştırılmalı)

---

## 4) NetOpenX Rest Service kurulu değilse (ihtimal dahilinde)

`netopenx.md` satır ~24050 civarı kurulum adımları:
- Gereksinim: .NET Framework 4.0+, Netsis Temelset 8.06+
- Kurulum sihirbazında "NetOpenX Rest Yönetim Paneli" + "NetOpenX Rest" seçilmeli
- **"Netsis Merkezi Kimlik Denetimi (SSO) Servis Konfigürasyonu"** adımında SSO servis adresi girilmeli (`sunucu_adı:2023/NetsisSsoService` formatında) — bu adım için Netsis kurulumunun SSO servisinin de çalışıyor olması gerekir
- Kurulum sonrası: `C:\Program Files (x86)\Netsis\Nox\WSManager\NetOpenX.Rest.Service.WSManager.exe` ile servis durumu/log kontrol edilir

---

## 5) Doğrulanmış Referans Bilgiler (netopenx.md'den çıkarıldı)

**Auth:** `POST {apiUrl}/token` body: `{BranchCode, NetsisUser, NetsisPassword, DbType:1, DbName, DbUser, DbPassword}` → `{access_token, expires_in}` (varsayılan ~20dk)

**Kullandığımız/kullanacağımız endpoint'ler:**
| Endpoint | Amaç | Durum |
|---|---|---|
| `GET /api/v2/Items` | Ürün listesi (STOK_KODU, STOK_ADI, SAT_FIYAT, KDV_ORANI...) | ✅ kod hazır |
| `GET /api/v2/Items/PrimInfo` | Sadece stok miktarı (hızlı) | ✅ kod hazır |
| `GET /api/v2/ARPs` | Cari hesaplar (bayi bakiye/limit) | ✅ kod hazır |
| `GET /api/v2/ExRates` | Döviz kurları | ✅ kod hazır |
| `POST /api/v2/ItemSlips` | Sipariş/irsaliye/fatura oluştur (docType'a göre) | 🔲 yapılacak |
| `POST /api/v2/ItemSlips/IrsToFat` | İrsaliyeyi faturaya çevir | 🔲 yapılacak |
| `POST /api/v2/ItemSlips/SiparisToIrsFat` | Siparişi doğrudan irsaliye+faturaya çevir | 🔲 yapılacak |
| `POST /api/v2/EDocument` | E-fatura taslağı oluştur | 🔲 yapılacak |
| `POST /api/v2/EDocument/SendEDocument` | E-faturayı GİB/entegratöre gönder | 🔲 yapılacak |
| `GET /api/v2/public/Ping`, `/Version` | Health check | ✅ kod hazır |

**docType/Fatura Tip kodları (BatchInvoicing açıklamasından çıkarıldı):**
- `ftSIrs` = Satış İrsaliyesi, `ftAIrs` = Alış İrsaliyesi
- `ftSFat` = Satış Faturası, `ftAFat` = Alış Faturası

**İlgili proje dosyaları:**
- `/home/can/sadoksan/apps/api/src/modules/netsis/` — mevcut kod (service, controller, scheduler, types)
- `/home/can/sadoksan/.env.example` — beklenen env değişkenleri (satır 36-45)
- `/home/can/netopenx.md` — tam referans (738KB, 38410 satır) — bu planda kullanılan kaynak
- `/home/can/can-scrap/netsis-netopenx-docs.md` — daha kısa özet (13.8KB)
- `/home/can/sadoksan/apps/api/src/scripts/import-netsis-stock-excel.js` — 896 ürünü içeri aktaran script (referans, gerçek kod formatı burada görülebilir)

---

## 6) AÇIK KARARLAR (kullanıcı ile netleşecek)

- [ ] Push-agent hangi dilde yazılsın: Node.js (kurulum gerekebilir) mı, PowerShell (Windows'ta hazır) mı?
- [ ] Push sıklığı: 15 dk mı, 30 dk mı? (stok için daha sık, cari/döviz için daha seyrek olabilir — mevcut `calculateNext()` zaten bunu düşünmüş: stok 30dk, cari 2sa, döviz 6sa, ürün 1sa)
- [ ] E-fatura: Netsis üzerinden mi (EDocument API), yoksa Entegra'ya doğrudan mı? (Soru #5'e bağlı)
- [ ] 896 içeri aktarılan ürünün fiyat/kategori bilgisi nereden gelecek — Netsis sync ile mi (SAT_FIYAT), elle mi?
