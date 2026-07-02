# Blok 3 — Uygulama Planları & Prod Checklist (Toparlanmış)

> **Kaynak dosyalar:** mvp-faz-0-1-uygulama-plani.md, b2b-only-refactor-plani.md, production-release-checklist.md, oturum-ozetleri.md, deployment-31mayis2026.md  
> **Toparlanma tarihi:** 2026-06-17  
> **Doğrulama:** Kod + DB + container ile çapraz kontrol edildi

---

## 1. STOK MODÜLÜ MVP PLANI — Durum

### 1.1 Plan vs Gerçek

| Adım | Planlanan (Mayıs 2025) | Gerçek (Haziran 2026) |
|------|----------------------|---------------------|
| **ADIM 1:** Prisma Migration (StockMovement + netsisPendingQuantity) | 30 dk | ✅ **Yapılmış** — model + alan mevcut |
| **ADIM 2:** recalcDisplayStock formül güncellemesi | 30 dk | ✅ Kod mevcut (schema'da formül yazıyor) |
| **ADIM 3:** StockModule (service + controller + 4 endpoint) | 1 saat | ✅ **Tümü mevcut** (`stock.module.ts`, `stock.service.ts`, `stock.controller.ts`, `dto/`) |
| **ADIM 4:** OrdersService StockMovement log entegrasyonu | 45 dk | ✅ **Yapılmış** (StockMovement tablosu aktif) |
| **ADIM 5:** Admin stock store güncelleme | 30 dk | ✅ `stores/stock.ts` mevcut |
| **ADIM 6:** Admin UI (Drawer + Modal'lar) | 3 saat | ✅ `ManualStockModal.vue` + `StockMovementDrawer.vue` mevcut, `CountAdjustModal.vue` ❌ |
| **ADIM 7:** Storefront WhatsApp | 30 dk | ❓ Kod kontrolü gerek |
| **ADIM 8:** Test (16 kabul kriteri) | 1 saat | ❓ |

### 1.2 Planın Öngördüğü Dosyalar

| Dosya | Durum |
|-------|-------|
| `StockMovement` model (Prisma) | ✅ Mevcut (satır 870, 8 hareket tipi) |
| `Product.netsisPendingQuantity` | ✅ Mevcut (`Int @default(0)`) |
| `apps/api/src/modules/stock/stock.module.ts` | ✅ Mevcut |
| `apps/api/src/modules/stock/stock.service.ts` | ✅ Mevcut |
| `apps/api/src/modules/stock/stock.controller.ts` | ✅ Mevcut |
| `apps/api/src/modules/stock/dto/` | ✅ Mevcut |
| `ManualStockModal.vue` | ✅ Mevcut |
| `StockMovementDrawer.vue` | ✅ Mevcut |
| `CountAdjustModal.vue` | ❌ **Yok!** |
| `stores/stock.ts` | ✅ Mevcut |

### 1.3 Kritik Formül

```
displayStock = netsisStock − netsisPendingQuantity − SUM(ACTIVE reservations)
```

> ⚠️ Plan tarihi 2026-05-25. 3 haftada çok şey değişti. StockMovement modeli kesin var. Diğerleri canlı testle doğrulanmalı.

---

## 2. B2B-ONLY REFACTOR — Durum

### 2.1 Plan (6 Adım)

| Adım | İşlem | Durum |
|------|-------|-------|
| ADIM 1 | DB: `UPDATE User SET role='DEALER' WHERE role='CUSTOMER'` | ✅ **Yapılmış** — DB'de CUSTOMER yok |
| ADIM 2 | Prisma: Enum'dan CUSTOMER sil, default DEALER, migrate | ✅ **Yapılmış** — `@default(DEALER)` |
| ADIM 3 | Backend: auth, mailer, popup, seed (6 dosya) | ✅ **Yapılmış** |
| ADIM 4 | Shared: types/index.ts, referans schema'lar | ✅ **Yapılmış** |
| ADIM 5 | Frontend: useAdminAuth, useAuth, uye-ol, bayi (4 dosya) | ✅ **Yapılmış** |
| ADIM 6 | Test: auth.service.spec.ts | ✅ **Yapılmış** (48/48 test geçti) |

> ✅ **TAMAMLANMIŞ.** YAPILACAKLAR.md'de ⬜ kalmıştı ama kod ve DB doğruluyor.

### 2.2 Doğrulama

```sql
-- UserRole enum: DEALER, PLASIYER, ADMIN, SUPER_ADMIN (CUSTOMER yok)
SELECT role, COUNT(*) FROM "User" GROUP BY role;
-- ADMIN: 1, DEALER: 1
```

---

## 3. PRODUCTION RELEASE CHECKLIST — Durum

### 3.1 Environment (10 madde)

| # | Madde | Durum |
|---|-------|-------|
| 1.1 | `.env` production değerleri | 🟡 Kısmen |
| 1.2 | JWT_SECRET güçlü (min 64 char) | ✅ Yeni secret (oturum-ozetleri) |
| 1.3 | POSTGRES_PASSWORD güçlü | ✅ DB sıfırdan oluşturuldu |
| 1.4 | `.env` gitignore'da | ✅ |
| 1.5 | `.env.example` güncel | ✅ |
| 1.6 | CORS_ORIGINS domain | ✅ |
| 1.7 | NODE_ENV=production | ❓ |
| 1.8 | API key sızmıyor | ✅ |
| 1.9 | WHATSAPP_PHONE | ❓ |
| 1.10 | Gerçek WhatsApp numarası | ❓ |

### 3.2 Docker Production (10 madde)

| # | Madde | Durum |
|---|-------|-------|
| 2.1-2.10 | Tüm Docker kontrolleri | ✅ Hepsi yapılmış, container'lar healthy |

### 3.3 Database Migration (4 madde)

| # | Madde | Durum |
|---|-------|-------|
| 3.1 | 19 migration temiz | ✅ 20 migration uygulanmış |
| 3.2 | `migrate deploy` kullan | ✅ |
| 3.3 | Migration öncesi backup | ✅ |
| 3.4 | Rollback planı | ✅ |

### 3.4 Backup (7 madde)

| # | Madde | Durum |
|---|-------|-------|
| 4.1 | backup-db.sh mevcut | ✅ |
| 4.2 | pg_dump binary + SQL | ✅ |
| 4.3 | 30 gün retention | ✅ |
| 4.4 | Cron job | ✅ `0 2 * * *` aktif |
| 4.5 | Uploads volume | ✅ |
| 4.6 | `.env` yedeği | 🔴 Manuel alınmalı |
| 4.7 | Restore testi | 🔴 İlk hafta test et |

### 3.5 Güvenlik (12 madde)

| # | Madde | Durum |
|---|-------|-------|
| 5.1 | Helmet | ✅ |
| 5.2 | Rate limiting | ✅ |
| 5.3 | CORS domain | ✅ |
| 5.4 | JWT guard | ✅ |
| 5.5 | Brute-force koruması | ✅ |
| 5.6 | Dosya upload limit | ✅ |
| 5.7 | JWT secret güçlü | ✅ |
| 5.8 | Admin şifresi değişti | 🟡 DB resetlendi, seed asd123'e döndü |
| 5.9 | Test hesapları silindi | 🔴 `bayi@test.com` hala DB'de |
| 5.10 | HTTPS zorunlu | ✅ |
| 5.11 | Security headers | ✅ |
| 5.12 | Hidden files blocked | ✅ |

### 3.6 SSL/Domain/Nginx (7 madde)

| # | Madde | Durum |
|---|-------|-------|
| 6.1 | Domain | 🟡 `sadoksaninsaat.com.tr` yerine `sadoksan.smartinnventory.com` |
| 6.2 | SSL | ✅ Let's Encrypt wildcard |
| 6.3-6.7 | Nginx yapılandırması | ✅ |

### 3.7 Logging (8 madde) — Hepsi ✅

### 3.8 Production Seed / Temizlik

| # | İşlem | Durum |
|---|-------|-------|
| 8.1 | Admin hesabı | ✅ |
| 8.2 | Admin şifre değiştir | 🔴 Hala `asd123` |
| 8.3 | Demo ürünleri temizle | ❓ |
| 8.4 | Gerçek ürünleri import | ✅ 285 ürün var |
| 8.5-8.7 | Test verisi temizle | ❓ |

### 3.9 Smoke Test (13 madde)

> 🔴 **YAPILMADI.** Canlı test gerekiyor.

---

## 4. OTURUM ÖZETLERİ — Kritik Bilgiler

### 4.1 2026-06-10: Production Hardening + Görsel

**Yapılanlar:**
- ✅ H1: JWT_SECRET rotasyonu
- ✅ H2: Admin şifresi değiştirildi (ama DB resetlenince seed'e döndü!)
- ✅ H3: POSTGRES_PASSWORD güçlendirildi, DB sıfırdan
- ✅ H4: CORS_ORIGINS ayarlandı
- ✅ H6: DB volume sıfırlama + 20 migration + seed
- ✅ Popup 401 fix (`@Public()` decorator)
- ✅ Prisma 7.8 uyumluluğu
- ✅ 192 ürün görseli indirildi
- ✅ Admin sidebar koyu tema fix
- ✅ Storefront kategori filtre sistemi rewrite
- ✅ Ürün isimleri ALL CAPS → Title Case
- ✅ Kategoriler 12+ → 7 konsolide

**DB son durum (10 Haziran):** 285 ürün, 7 kategori, 192 görselli, 20 migration

### 4.2 2026-06-11: Bayi Login Fix

**Yapılanlar:**
- ✅ Login: email → `login` (kullanıcı adı veya email)
- ✅ Şifre min: 6 → 4 karakter
- ✅ Auth service: `@` varsa email, yoksa name ile arama
- ✅ Admin + Storefront login composable güncellendi
- ✅ `bayi@test.com` şifresi `bayi` olarak güncellendi
- ✅ API, Admin, Storefront rebuild + deploy

**Test hesabı güncel bilgi:**
```
Kullanıcı adı: bayi       → DEALER token ✅
Email:         bayi@test.com → DEALER token ✅
Şifre:         bayi
```

---

## 5. DEPLOYMENT 31 MAYIS — ⚠️ TAMAMEN ESKİMİŞ

Bu dosya artık **güvenilmez.** Şunlar değişti:

| Konu | 31 Mayıs | Şimdi |
|------|----------|-------|
| Storefront URL | `/sadoksan/` | `sadoksan.smartinnventory.com` |
| Admin URL | `/sadoksan-admin/` | `.../sadoksan-panel/` |
| API URL | `/sadoksan-api/` | `.../api/` |
| Migration sayısı | 19 | 20 |
| Prisma versiyonu | 7.8 | 7.8 (production config fix yapıldı) |
| Kategori | 48 (9 ana + 39 alt) | 7 konsolide |

**Dosyada hala geçerli olanlar:**
- Sunucu bilgileri (IP, OS, RAM, Disk) — NIHAI.md'de daha güncel
- Docker container isimleri ve portları
- Komut referansı (kısmen)

> 💡 **Öneri:** Bu dosya silinebilir veya başına `DEPRECATED` notu eklenebilir.

---

## 6. ÇELİŞKİ TESPİTLERİ (Blok 3)

| # | İddia (kaynak) | Gerçek | Sonuç |
|---|---------------|--------|-------|
| 1 | StockMovement "eklenecek" (MVP planı Mayıs) | Mevcut (schema + DB) | ✅ **Yapılmış** |
| 2 | B2B refactor "⬜" (YAPILACAKLAR.md) | Tüm adımlar tamamlanmış | ✅ **Yapılmış**, task güncellenmeli |
| 3 | H2 "Admin şifresi değiştirildi" (oturum 10 Haz) | DB reset → seed asd123'e döndü | 🔴 **Geri alınmış**, tekrar değişmeli |
| 4 | H5 "Test hesapları silinecek" | bayi@test.com DB'de | 🔴 **Yapılmamış** |
| 5 | Deployment URL'leri (31 Mayıs) | Tamamen değişmiş | ⚠️ **Dosya eskimiş** |
| 6 | 48 kategori (31 Mayıs) | 7 kategori (10 Haziran) | Değişmiş (konsolidasyon) |
| 7 | Checklist 9.1-9.13 Smoke Test | Hiçbiri işaretlenmemiş | 🔴 **Yapılmamış** |
| 8 | "Admin panel build OOM" (31 Mayıs) | Container'lar healthy | ✅ Çözülmüş |
| 9 | "Prisma config manuel gerek" (31 Mayıs) | prisma.config.ts oluşturulmuş | ✅ Çözülmüş |
| 10 | CUSTOMER rolü temizliği (plan Mayıs) | Kodda yok, DB'de yok | ✅ **Tamamlanmış** |

---

## 7. PRODUCTION HARDENING — Güncel Durum Özeti

| # | Madde | Son Durum | Aksiyon |
|---|-------|-----------|---------|
| H1 | JWT_SECRET güçlü | ✅ Yapıldı | — |
| H2 | Admin şifresi | 🔴 DB reset sonrası asd123 | **Tekrar değiştir** |
| H3 | POSTGRES_PASSWORD | ✅ Güçlendirildi | — |
| H4 | CORS_ORIGINS | ✅ Ayarlandı | — |
| H5 | Test hesapları sil | 🔴 bayi@test.com duruyor | **Sil/disable** |
| H6 | Backup cron | ✅ `0 2 * * *` aktif | — |

---

## 8. CANLI TEST İÇİN ÖNCELİKLİ LİSTE (Müşteriye gönderilmeden)

### 🔴 Kritik (hemen)
1. **Admin şifresini değiştir** — `asd123` prod'da kalmamalı
2. **Plasiyer test hesabı oluştur** — DB'de hiç yok, CLAUDE.md'de yazıyor
3. **bayi@test.com** — prod'da kalacak mı silinecek mi karar ver

### 🟡 Orta (ilk hafta)
4. Smoke test (checklist 9.1-9.13)
5. Admin kullanıcı yönetimi (TASK-09)
6. Havale bildirim UI testi
7. Checkout akışı testi

### 🟢 Düşük (V1)
8. SEO 301 yönlendirme
9. Kupon admin CRUD
10. Online ödeme entegrasyonu
