# Yönetici Paneli Mükemmelleştirme Planı (Sonnet için)

> Bu dosya, Sadoksan admin panelini iyileştirmek için **adım adım, kendi kendine
> yeten** bir görev listesidir. Sırayla yap. Her görev bounded ve bağımsız test
> edilebilir. Tahmin etme — burada yazmayan bir şey belirsizse ÖNCE koda bak.

---

## 0. ORTAM & ÇALIŞMA ŞEKLİ (önce oku)

- **Sunucu:** `ssh can@45.43.152.52` (key-only, sudo NOPASSWD). Proje: `/home/can/sadoksan`
- **Yapı:** monorepo. Admin panel `apps/admin/` (Nuxt 4 SPA), Backend `apps/api/` (NestJS), Storefront `apps/storefront/`, PDF `python-service/`.
- **Dosya düzenleme deseni (KANITLANMIŞ, buna uy):** dosyayı `scp` ile yerele çek → yerelde düzenle → `scp` ile geri koy. Uzaktan `sed`/heredoc ile düzenleme tırnak yüzünden patlar, YAPMA. Örnek:
  ```
  scp can@45.43.152.52:/home/can/sadoksan/<yol> /tmp/x.ts
  # /tmp/x.ts düzenle
  scp /tmp/x.ts can@45.43.152.52:/home/can/sadoksan/<yol>
  ```
- **Deploy (kod değişince ŞART, restart yetmez — prod build):**
  ```
  cd /home/can/sadoksan
  docker compose -f docker-compose.prod.yml build <servis>    # servis: api | admin | storefront | python-service
  docker compose -f docker-compose.prod.yml up -d <servis>
  ```
  Backend değişikliği → `api`. Admin panel değişikliği → `admin`.
- **Doğrulama:** deploy sonrası `docker ps --filter name=sadoksan-<servis>-prod --format "{{.Status}}"` → `healthy` olmalı. Veri sayıları değişmemeli.
- **Admin girişi (test için):** `POST https://sadoksan.smartinnventory.com/api/auth/login` body `{"login":"admin@admin.com","password":"asd123"}` → dönen `access_token`. **DİKKAT: alan adı `email` değil `login`.** Token'ı `Authorization: Bearer <token>` ile kullan.
- **API taban:** `https://sadoksan.smartinnventory.com/api`. Admin panel URL: `https://sadoksan.smartinnventory.com/sadoksan-panel`
- **Git (her görev bitince):** `cd /home/can/sadoksan && git add <dosyalar> && git commit -m "..." && git push origin main`. Commit mesajını `git commit -F /tmp/msg.txt` ile dosyadan ver (Türkçe karakter + tırnak sorunlarından kaçın).
- **GÜVENLİK KURALLARI (ihlal etme):**
  - Veritabanına ZARAR VERME. Silme/toplu-güncelleme YAPMA. Müşteri canlı kullanıyor.
  - Riskli DB işlemi öncesi yedek: `docker exec sadoksan-postgres-prod pg_dump -U sadoksan -d sadoksan > /home/can/yedek-$(date +%s).sql`
  - Bu görevlerin HİÇBİRİ DB şeması/verisi değiştirmiyor — sadece kod. Migration gerekirse DUR, kullanıcıya sor.
  - `python-service/proforma_generator.py` dosyasına DOKUNMA (mevcut proforma PDF'i onunla çalışıyor).

---

## GÖREV 1 — Proforma Düzenleme özelliği (ŞU AN YOK) 🔴

**Sorun:** `apps/admin/app/pages/proforma.vue` içinde `editProforma()` (satır ~1055) sadece `toast.push('Düzenleme özelliği henüz eklenmedi', 'info')` diyor. Buton var, işlev yok.

**Hedef:** Bir proformayı düzenleyip kaydedebilmek.

### Backend (apps/api/src/modules/proforma/)
1. `proforma.service.ts`'e `updateProforma(proformaId, dto, userId)` metodu ekle. Mevcut `createProformaDraft` (satır 28) ve `getProforma` (satır 249) metodlarına bak, aynı alanları (müşteri bilgileri, kalemler, notlar) günceller. `prisma.proforma.update` kullan. **Sadece `status` DRAFT/taslak olan proformalar düzenlenebilsin** (gönderilmiş/onaylanmışlar değil) — kontrol ekle, değilse `BadRequestException`.
2. `proforma.controller.ts`'e endpoint ekle: `@Patch(':id')` → `updateProforma`. DİKKAT: `@Get(':id')` (satır 145) ve `@Patch(':id/send')` (satır 164) zaten var; `@Patch(':id')` bunlarla çakışmaz. Guard/decorator'ları diğer endpoint'lerden kopyala (JwtAuthGuard vb.).

### Frontend (apps/admin/app/pages/proforma.vue)
3. Sayfada proforma OLUŞTURMA formu/modalı zaten var (createProformaDraft akışı). `editProforma(proforma)` fonksiyonunu şöyle yap: aynı formu **düzenleme modunda** aç, seçili proformanın verisiyle doldur (müşteri, kalemler, notlar). Formu incele, oluşturma state'ini (form ref'leri) düzenlemeye uyarlayacak bir `editingId` bayrağı ekle.
4. Kaydet'te: `editingId` doluysa `PATCH /proforma/:id` çağır, boşsa mevcut create çağrısı. Başarıda listeyi yenile + toast.

### Doğrulama
- `admin` build+deploy et. Panelde Proforma sayfası → bir taslak proformada "Düzenle" → form açılmalı, dolu gelmeli, değişiklik kaydolmalı.
- API testi: login → `PATCH /api/proforma/<id>` ile bir alan değiştir → `GET /api/proforma/<id>` ile doğrula.

### Commit
`feat(proforma): düzenleme özelliği eklendi (backend updateProforma + PATCH :id + frontend edit modu)`

---

## GÖREV 2 — Proforma Gönderme gerçek e-posta yapılsın 🔴

**Sorun:** `proforma.service.ts` `sendProforma()` (satır 259) sadece `status='sent'` + `viewedAt` işaretliyor, **gerçekten e-posta göndermiyor** ("For now, just update viewedAt" yorumu).

**Hedef:** Gönder deyince proforma PDF'i müşteriye/bayiye e-postayla gitsin.

### Adımlar
1. `sendProforma` içinde: proformayı müşteri/bayi bilgisiyle yükle (e-posta lazım — `proforma`nın müşteri ilişkisine bak, `getProforma`'daki include'u örnek al).
2. PDF'i üret: `downloadProforma(proformaId)` (satır 283) zaten `{ pdfBuffer }` döndürüyor — onu çağır.
3. Mailer'ı incele: `apps/api/src/modules/mailer/mailer.service.ts`. `send(opts)` metodu var mı, **ek dosya (attachment)** destekliyor mu bak.
   - Destekliyorsa: PDF'i attachment olarak ekleyip gönder.
   - Desteklemiyorsa: `mailer.service.ts`'e `MailOptions`'a `attachments?` ekle (nodemailer `attachments: [{ filename, content: Buffer }]` formatı) ve `send`'de ilet. Proforma modülünün `MailerModule`'ü import ettiğinden emin ol (etmiyorsa ekle — bkz. orders.module deseni).
4. E-posta yoksa (müşteri e-postası boş) hata fırlatma; loglayıp "e-posta adresi yok" mesajı dön.
5. Mevcut `status='sent'` güncellemesi kalsın (gönderim başarılıysa).

### Doğrulama
- `api` build+deploy. Panelde bir proformada "Gönder" → hata vermemeli, log'da gönderim görünmeli (`docker logs sadoksan-api-prod --tail 30`).
- SMTP prod'da gerçekten yapılandırılmamış olabilir (console-only olabilir) — o durumda log'da e-postanın oluştuğunu görmek yeterli; kod doğruysa görev tamam.

### Commit
`feat(proforma): gönder artık PDF'i e-postayla iletiyor (mailer attachment)`

---

## GÖREV 3 — Dashboard operasyonel-öncelikli olsun 🟡

**Sorun:** Dashboard en üstte **teknik tanıtım banner'ıyla** açılıyor ("18 Modül / 6 Docker Servisi / 35 Tablo" — `IntroBanner` bileşeni). Yönetici günlük işte bunu değil; siparişi/ciroyu/uyarıyı görmeli. Banner `settings.data.introEnabled` ile kontrol ediliyor, varsayılanı `true`.

**Hedef:** Operasyonel içerik önce gelsin.

### En basit çözüm (öneri)
1. `apps/admin/app/stores/settings.ts`: `introEnabled` varsayılanını `true` → `false` yap (satır 21 ve 80: `introEnabled: data.introEnabled ?? true` → `?? false`).
2. Backend settings varsayılanına da bak (`apps/api/src/modules/settings/`) — orada da `introEnabled` varsayılanı varsa `false` yap ki tutarlı olsun.
3. **NOT:** Kayıtlı ayar varsa client onu kullanır; sadece varsayılan değişir. İstersen ek olarak `apps/admin/app/pages/index.vue`'da `<IntroBanner>`'ı DashboardHero + Quick Actions'ın ALTINA taşı (şu an üstte, satır ~237). Böylece açık olsa bile operasyonel içerik üstte kalır.

### Doğrulama
- `admin` build+deploy. Panele gir → üstte artık ciro/bekleyen sipariş/uyarı görünmeli, tanıtım banner'ı ya kapalı ya altta.

### Commit
`feat(dashboard): operasyonel içerik önce — tanıtım banner'ı varsayılan kapalı/altta`

---

## GÖREV 4 — Raporlara görsel içgörü ekle 🟢

**Sorun:** `apps/admin/app/pages/raporlar/index.vue` rapor verisini **tablo** olarak gösteriyor; grafik/trend/KPI görseli yok. Yönetici karar verirken görsel özet ister.

**Referans:** Dashboard'da (`apps/admin/app/pages/index.vue`, satır ~67) `revenueChart` diye bir computed VAR ve inline SVG bar chart çiziliyor — o deseni kopyala. **Harici grafik kütüphanesi EKLEME** (bundle şişer, CSP sorunu); inline SVG kullan (dashboard'daki gibi).

### Adımlar
1. `raporlar/index.vue`'i incele. Hangi raporlar var, veri şekilleri ne (endpoint'ler: `/api/reports/order-pipeline`, `/critical-stock`, `/dealer-risk`, `/slow-moving-stock`, `/credit-usage`, `/plasiyer-sales`, `/plasiyer-dashboard`).
2. Sayfanın üstüne bir **görsel özet bölümü** ekle:
   - Aktif rapora göre 3-4 **KPI kartı** (StatCard bileşeni zaten var — `apps/admin/app/components/StatCard.vue`).
   - Sayısal seriler için basit **inline SVG bar/çizgi grafik** (dashboard revenueChart'tan uyarla). Örn. order-pipeline'da durumlara göre bar, credit-usage'da bayi başına kullanım bar'ı.
3. Renk/tipografi için mevcut sınıfları kullan (ink-*, primary-*, accent-* — diğer sayfalardan kopyala). Yeni renk icat etme.
4. Tablolar kalsın; grafik ONLARIN ÜSTÜNE özet olarak eklensin.

### Doğrulama
- `admin` build+deploy. Rapor sayfasında her rapor için üstte KPI kartları + grafik görünmeli, veri gerçek olmalı.

### Commit
`feat(raporlar): görsel içgörü — KPI kartları + inline SVG grafikler (kütüphanesiz)`

---

## SIRA & GENEL NOTLAR

1. Görevleri **1 → 2 → 3 → 4** sırasıyla yap. Her biri bittiğinde build+deploy+doğrula+commit+push, SONRA diğerine geç.
2. Her deploy sonrası `docker ps` ile ilgili container `healthy` mi kontrol et. Değilse `docker logs sadoksan-<servis>-prod --tail 50` ile hatayı bul, düzelt.
3. TypeScript derleme hatası olursa build "Built" yazmaz; `docker compose ... build api 2>&1 | grep -i "error TS"` ile gör.
4. Emin olmadığın bir davranış varsa ilgili dosyayı OKU, tahmin etme.
5. Bitince kullanıcıya kısa özet ver: hangi görevler bitti, hangi commit'ler, ne test edildi.

## Kapsam DIŞI (bu planda YAPMA)
- Netsis entegrasyonu / sipariş-push (ayrı iş, bitti — bkz. NETSIS-DURUM-VE-PLAN.md).
- DB şema değişikliği / migration.
- Tasarım baştan elden geçirme (kullanıcı "cila değil, işlev" dedi).
- Mock ürün temizliği (gerçek Netsis verisi akınca yapılacak, şimdi değil).
