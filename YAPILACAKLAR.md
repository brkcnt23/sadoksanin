# Sadoksan ERP — Yapılacaklar & AI Prompt

**Son güncelleme:** 2026-06-09
**Konum:** motto-server (45.43.152.52) — SUNUCU İÇİNDE ÇALIŞIYORSUN, SSH GEREKMEZ

---

## 🤖 AI KENDİNE PROMPT (Her Oturum Başı Oku)

```
Sen Sadoksan ERP projesinde çalışıyorsun. MOTTO-SERVER (Fedora 41, 94GB RAM)
üzerindesin. SSH atmana gerek YOK — doğrudan sunucudasın.

HER ZAMAN:
1. Bu dosyayı oku → "Yapılacaklar" ve "Bug'lar" bölümlerine bak
2. Container durumunu kontrol et: docker compose -f docker-compose.prod.yml ps
3. Gerekeni yap, BU DOSYAYI GÜNCE TUT (yapılanları "Yapılanlar"a ekle)

KRİTİK KURALLAR:
- Admin panel SPA → .env değişikliğinde REBUILD ŞART (restart yetmez)
- Storefront SSR → REBUILD gerekir
- API değişikliğinde REBUILD + RESTART
- Prisma migration: docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
- Backup: ./scripts/backup-db.sh
- Proje dizini: /home/can/sadoksan
```

---

## ✅ YAPILANLAR

### 2026-06-09 — MD Toparlama + 5 Bug Fix + Kredi Limiti + Ürün Filtreleme
- `settings.json`: `permissions.defaultMode: bypassPermissions` + `.bashrc`: `--dangerously-skip-permissions`
- **5 bug fix:** Proforma route sıralaması, rapor duplicate, plasiyer middleware, header linki, token standardizasyonu
- **Kredi limiti kontrolü:** approveOrder() + payOrder() — cariBalance + order.total > creditLimit kontrolü
- **Ürün filtreleme:** categoryId bazlı, kategori ağacı sidebar, fuzzy search (boşluk insensitive)
- **DB:** 101 ürün categoryId eşleştirildi, 13 seramik sub-kategoriye atandı
- **MD temizliği:** 5 eski dosya silindi, CLAUDE.md + YAPILACAKLAR.md yeniden yazıldı
- **Build:** API + Admin + Storefront (2 kez) rebuild + deploy
- **B2B-only refactor:** Zaten yapılmış (CUSTOMER rolü yok)
- **Stok MVPP:** Zaten yapılmış (StockMovement + UI component'leri hazır)
- **Tüm DB modelleri:** 35 tablo, 20 migration, eksik yok
- **netopenx.md:** /home/can/netopenx.md + /home/can/can-scrap/netsis-netopenx-docs.md

### 2026-06-08 — Netsis + Plasiyer + Rapor (7 commit)
- **Netsis NetOpenX REST:** types, service (OAuth2 + 4 sync), controller (8 endpoint), scheduler (cron)
- **Plasiyer rolü:** UserRole'a PLASIYER eklendi, adminCreateUser(), listUsers()
- **Proforma onay akışı:** submit/approve/reject/pending/my/download-checked (7 endpoint)
- **Rapor motoru:** 8 endpoint (plasiyer-sales, order-pipeline, dealer-risk, critical-stock, slow-moving, credit-usage, plasiyer-dashboard, plasiyers)
- **Plasiyer storefront:** 4 sayfa (dashboard, proforma, proformalarim, raporlar)
- **Admin:** rapor sayfası (KPI kartları + 8 rapor tipi + CSV export)

### 2026-06-05 — UI Fixes + Kategori Menü (5 commit)
- SSH/GitHub: github-key-1 push yetkisi tanımlandı, 12 commit pushlandı
- `Product.isFeatured` kolonu + index eklendi
- Header "Ürünler" mega menü: hover kaldırıldı, tıklamalı, teknik çizim ölçü çizgileri
- Sub kategori filtreleme: `?ara=` parametresiyle parent sayfaya yönlendirme
- CMS sayfaları: SiteInfoPage komponenti, 6 hukuki sayfa içerik aktarımı
- Proforma bug fix: `$fetch` → `fetch` (native), çift katmanlı Array.isArray() guard
- Temizlik: canterm (PM2) kaldırıldı, /canterm-ws nginx rotası silindi

### 2026-06-02/03 — Admin UI Revizyonu (~15 commit)
- **Faz 0:** useToast + Toaster, 10 CSS typo fix, modal/drawer çakışması, proforma stil
- **Faz 1:** Mobile sidebar, dashboard color fix, sidebar'a 5 eksik sayfa eklendi
- **Faz 2:** CRM (4 sekmeli), İndirimler (arama), Ödemeler (StatCard), Denetim (filtre+export), Döviz (pagination)
- **Faz 3:** 8 sayfada alert() → toast.push(), CMS rich text editor
- **Faz 4:** 6 component (ConfirmModal, LoadingState, MoneyCell, StockBadge, ActionButtonGroup, FilterBar)
- **KRİTİK FIX:** Global prefix sorunu — `app.setGlobalPrefix('api')`, 9 controller temizliği, nginx trailing slash

### 2026-05-31 — Deployment + Kategori Hiyerarşisi (14 commit)
- Production deployment (motto-server, Docker)
- Category.parentId self-relation + 48 kategori seed (9 ana + 39 alt)
- Subpath routing (baseURL=/sadoksan/, /sadoksan-admin/)
- 19 migration başarıyla uygulandı
- Testler: 48/48 passed

---

## 📦 Container Durumu

| Container | Port | Son Build | Durum |
|-----------|------|-----------|-------|
| sadoksan-storefront-prod | 3011→3000 | 3 gün önce | ⚠️ Plasiyer sayfaları build'de yok |
| sadoksan-admin-prod | 3012→3002 | 16 saat | ✅ Güncel |
| sadoksan-api-prod | 3010→3001 | 16 saat | ✅ Güncel |
| sadoksan-postgres-prod | 5432 | 6 gün | ✅ |
| sadoksan-redis-prod | 6379 | 6 gün | ✅ |
| sadoksan-python-prod | 3013→5000 | 6 gün | ✅ |

---

## 🔴 BUG'LAR — Hepsi Fix Edildi ✅

| # | Bug | Fix | |
|---|-----|-----|---|
| BUG-1 | Proforma route sıralaması | `pending`/`my` route'ları `:id`'den önceye taşındı | ✅ |
| BUG-2 | Admin rapor sayfası duplicate | Eski `raporlar.vue` silindi | ✅ |
| BUG-3 | Plasiyer middleware eksik | `middleware/plasiyer.ts` oluşturuldu, 4 sayfa güncellendi | ✅ |
| BUG-4 | Header'da plasiyer linki yok | Desktop + mobile header'a Plasiyer Paneli linki eklendi | ✅ |
| BUG-5 | Token key tutarsızlığı | Hepsi `user-token` + `auth.user` olarak standardize edildi | ✅

---

## 🟡 BUILD & DEPLOY (Bug'lar Fix Edildikten Sonra)

```bash
cd /home/can/sadoksan && git pull

# 1. API (backend değişiklikleri)
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# 2. Admin (rapor sayfası + proforma fix)
docker compose -f docker-compose.prod.yml build admin
docker compose -f docker-compose.prod.yml up -d admin

# 3. Storefront (plasiyer sayfaları)
docker compose -f docker-compose.prod.yml build storefront
docker compose -f docker-compose.prod.yml up -d storefront
```

---

## 🟢 PLANLANAN GELİŞTİRMELER

### Faz A: B2B-Only Refactor (CUSTOMER Rol Temizliği)
> Detay: `docs/b2b-only-refactor-plani.md` | 6 adım, 12 dosya

| # | İş | |
|---|-----|---|
| A1 | DB: UPDATE User SET role='DEALER' WHERE role='CUSTOMER' | ⬜ |
| A2 | Prisma: Enum'dan CUSTOMER sil, default DEALER, migrate | ⬜ |
| A3 | Backend: auth, mailer, popup, seed (6 dosya) | ⬜ |
| A4 | Shared: types/index.ts, referans schema'lar | ⬜ |
| A5 | Frontend: useAdminAuth, useAuth, uye-ol, bayi (4 dosya) | ⬜ |
| A6 | Test: auth.service.spec.ts | ⬜ |

### Faz B: Stok Modülü MVPP
> Detay: `docs/mvp-faz-0-1-uygulama-plani.md` | 8 adım, ~8 saat

| # | İş | |
|---|-----|---|
| B1 | Prisma: StockMovement modeli + netsisPendingQuantity | ⬜ |
| B2 | recalcDisplayStock() formül güncellemesi | ⬜ |
| B3 | StockModule: service + controller (4 endpoint) | ⬜ |
| B4 | OrdersService ↔ StockMovement log entegrasyonu | ⬜ |
| B5 | Admin stock store: fetchMovements, entry, exit, adjust | ⬜ |
| B6 | Admin UI: drawer, manual modal, count modal | ⬜ |
| B7 | Storefront: WhatsApp "Gelince Haber Ver" | ⬜ |
| B8 | Test: 16 kabul kriteri | ⬜ |

### Faz C: Eksik Modeller
| Model | Öncelik |
|-------|---------|
| PaymentLog | Orta |
| ReturnRequest + ReturnItem | Düşük |
| ImportJob | Düşük |

### Faz D: Eksik Modüller
| Modül | Öncelik |
|-------|---------|
| BankTransferModule (havale onay) | Orta |
| ReturnModule (iade yönetimi) | Düşük |

---

## 🔵 PRODUCTION HARDENING

| # | İş | |
|---|-----|---|
| H1 | JWT_SECRET güçlü random string | 🔴 |
| H2 | Admin şifresi değiştir | 🔴 |
| H3 | POSTGRES_PASSWORD güçlü şifre | 🔴 |
| H4 | CORS_ORIGINS domain'leri | 🔴 |
| H5 | Test hesaplarını sil | 🔴 |
| H6 | Backup cron (0 2 * * *) | 🔴 |

---

## 🔴 ENTEGRASYONLAR (Dış API Bekleniyor)

| Entegrasyon | Durum | Beklenen |
|-------------|-------|----------|
| Netsis ERP | 🟡 Hazır | API URL + credentials |
| Alneo E-Fatura | 🔴 | API dokümanı |
| Albaraka Ödeme | 🔴 Mock | Sanal POS |
| Canmail SMTP | 🔴 Console | SMTP bilgileri |
| ideaSoft | 🔴 | 4000 ürün + görsel |

---

## 📊 Test Hesapları

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@admin.com | asd123 |
| Bayi | bayi@test.com | asd123 |
| Plasiyer | plasiyer@test.com | asd123 |

---

## 🌐 URL'ler

| Servis | URL |
|--------|-----|
| Storefront | https://sadoksan.smartinnventory.com/ |
| Admin Panel | https://sadoksan.smartinnventory.com/sadoksan-panel/ |
| API Health | https://sadoksan.smartinnventory.com/api/health |

---

## 🛠️ Sık Komutlar

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml up -d api
docker compose -f docker-compose.prod.yml build admin && docker compose -f docker-compose.prod.yml up -d admin
docker compose -f docker-compose.prod.yml build storefront && docker compose -f docker-compose.prod.yml up -d storefront
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker logs sadoksan-api-prod --tail 50
curl http://127.0.0.1:3010/api/health
docker exec sadoksan-postgres-prod psql -U sadoksan -d sadoksan
./scripts/backup-db.sh
sudo nginx -t && sudo systemctl reload nginx
```

---

## 📁 Doküman Haritası

| Dosya | Amaç |
|-------|------|
| **YAPILACAKLAR.md** | **BU DOSYA** — görev + yapılanlar + AI prompt |
| CLAUDE.md | Teknik context (AI için) |
| info.md | Hızlı referans / giriş bilgileri |
| docs/raporlar.md | 16 rapor kataloğu |
| docs/raporlar_update.md | Plasiyer + rapor planı |
| docs/sadoksan-sistem-tasarimi.md | Tam sistem tasarımı (35 bölüm) |
| docs/deployment-31mayis2026.md | Deployment özeti |
| docs/b2b-only-refactor-plani.md | Faz A detay planı |
| docs/mvp-faz-0-1-uygulama-plani.md | Faz B detay planı |
| docs/gelistirici-uygulama-rehberi.md | Task breakdown (20 task) |
| docs/production-release-checklist.md | Prod checklist |
