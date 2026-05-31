# B2B-Only Refactor Planı — CUSTOMER Rol Temizliği

**Tarih:** 2026-05-25 | **Karar:** Sadöksan = B2B-only bayi sistemi

---

## Etki Analizi — CUSTOMER Kullanımı

### 1. Prisma Schema (yetkili: `apps/api/prisma/schema.prisma`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 21 | `role UserRole @default(CUSTOMER)` | `role UserRole @default(DEALER)` |
| 82 | `CUSTOMER  // B2C customer` | **SİL** (enum'dan kaldır) |

**Kırılma riski:** Migration gerekir. Enum'dan değer silmek PostgreSQL'de doğrudan desteklenmez — önce default değişmeli, sonra tüm CUSTOMER kayıtları DEALER'a çevrilmeli, sonra enum güncellenmeli.

**Etkilenen satır:** `prisma/schema.prisma` (root) ve `packages/shared/prisma/schema.prisma` (referans kopyalar).

### 2. Shared Types (`packages/shared/types/index.ts`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 4 | `CUSTOMER = 'CUSTOMER',` | **SİL** |

**Kırılma riski:** Admin ve storefront'ta bu tipi import eden yerler patlar.

### 3. Backend — Auth Modülü

| Dosya | Satır | Mevcut | Yapılacak |
|-------|-------|--------|-----------|
| `auth.service.ts` | 25 | `dto.role \|\| 'CUSTOMER'` | `dto.role \|\| 'DEALER'` |
| `auth/dto/create-user.dto.ts` | 16-17 | `@IsIn(['CUSTOMER', 'DEALER'])` + tip | `@IsIn(['DEALER'])` + tip güncelle |

**Kırılma riski:** Düşük. Register endpoint'i sadece DEALER kabul edecek.

### 4. Backend — Mailer (`mailer.service.ts`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 86 | `WHERE u.role = 'CUSTOMER'` | `WHERE u.role = 'DEALER'` |

### 5. Backend — Popup (`popup.service.ts`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 39 | `popup.audience === 'B2C' && userRole === 'CUSTOMER'` | Bu satır kaldırılabilir veya B2C audience kontrolü DEALER'a çevrilebilir |

### 6. Backend — Seed (`prisma/seed.ts`, `apps/api/src/scripts/seed.ts`)

| Dosya | Yapılacak |
|-------|-----------|
| `prisma/seed.ts:13,55,60` | CUSTOMER → DEALER |
| `apps/api/src/scripts/seed.ts:44` | CUSTOMER → DEALER |

### 7. Admin — Auth (`useAdminAuth.ts`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 16 | `role: 'ADMIN' \| 'SUPER_ADMIN' \| 'DEALER' \| 'CUSTOMER'` | `role: 'ADMIN' \| 'SUPER_ADMIN' \| 'DEALER'` |
| 56 | Yorum satırı — CUSTOMER referansı | Yorum güncelle |

### 8. Storefront — Auth (`useAuth.ts`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 16 | `role: 'CUSTOMER' \| 'DEALER' \| 'ADMIN' \| 'SUPER_ADMIN'` | `role: 'DEALER' \| 'ADMIN' \| 'SUPER_ADMIN'` |
| 31 | `role?: 'CUSTOMER' \| 'DEALER'` | `role?: 'DEALER'` |

### 9. Storefront — Kayıt (`uye-ol.vue`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 156 | `role: 'CUSTOMER',` | `role: 'DEALER',` |

**Not:** Zaten `/uye-ol` sayfası B2C kayıt için. B2B-only sistemde bu sayfa `/bayilik` başvuru formuna yönlendirmeli veya tamamen kaldırılmalı.

### 10. Storefront — Bayi sayfası (`bayi.vue`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 485,496 | Yorum satırı: `<!-- CUSTOMER: Tab ... -->` | Yorum güncelle |

### 11. Testler (`test/auth.service.spec.ts`)

| Satır | Mevcut | Yapılacak |
|-------|--------|-----------|
| 27,30,38,96,108,129 | `'CUSTOMER'` referansları | `'DEALER'` |

### 12. Diğer Prisma şemaları (referans kopyalar)

| Dosya | Yapılacak |
|-------|-----------|
| `prisma/schema.prisma` (root) | CUSTOMER sil, default DEALER |
| `packages/shared/prisma/schema.prisma` | CUSTOMER sil |

---

## Kırılma Analizi — Neler Patlar?

| # | Ne | Şiddet | Açıklama |
|---|-----|--------|----------|
| 1 | **Migration** | 🔴 Kritik | PostgreSQL enum'dan değer silinemez. Yeni enum oluşturup eskisini değiştirmek gerekir. |
| 2 | **Mevcut CUSTOMER kullanıcıları** | 🟡 Orta | Veritabanında CUSTOMER rolüyle kayıtlı kullanıcı varsa, migration sonrası geçersiz role sahip olurlar. Önce UPDATE ile DEALER'a çevrilmeli. |
| 3 | **Storefront register** | 🟡 Orta | `/uye-ol` sayfası CUSTOMER kaydı yapıyor. B2B-only'de bu sayfa işlevsiz kalır. |
| 4 | **Storefront ürün sayfası** | 🟡 Orta | `urunler/[slug].vue` — `isAuthenticated` kontrolü var ama DEALER/ADMIN kontrolü yok. Bayi onaylanmadan fiyat görmemeli. |
| 5 | **Popup audience B2C** | 🟢 Düşük | B2C audience'li popup'lar artık anlamsız. |
| 6 | **Testler** | 🟡 Orta | auth.service.spec.ts CUSTOMER referanslarını DEALER'a çevirmek gerek. |
| 7 | **TypeScript tip hataları** | 🟡 Orta | Shared types'tan CUSTOMER kalkınca import eden her yer patlar. |

---

## Refactor Planı (6 Adım)

### ADIM 1: Veritabanı Hazırlığı
```sql
-- Tüm CUSTOMER kullanıcılarını DEALER'a çevir
UPDATE "User" SET role = 'DEALER' WHERE role = 'CUSTOMER';
```

### ADIM 2: Prisma Schema + Migration
- `apps/api/prisma/schema.prisma`: CUSTOMER'ı enum'dan sil, default'u DEALER yap
- `prisma migrate dev --name remove_customer_role`
- PostgreSQL'de enum değişikliği için manuel migration SQL'i gerekebilir

### ADIM 3: Backend Kod Güncelleme (6 dosya)
- `auth.service.ts`: default rol DEALER
- `auth/dto/create-user.dto.ts`: CUSTOMER'ı kaldır
- `mailer.service.ts`: CUSTOMER → DEALER
- `popup.service.ts`: B2C kontrolünü kaldır/güncelle
- `seed.ts` (2 dosya): CUSTOMER → DEALER

### ADIM 4: Shared Types Güncelleme
- `packages/shared/types/index.ts`: CUSTOMER'ı sil
- `prisma/schema.prisma` (root): senkronize et
- `packages/shared/prisma/schema.prisma`: senkronize et

### ADIM 5: Frontend Güncelleme (4 dosya)
- `useAdminAuth.ts`: CUSTOMER'ı tip'ten kaldır
- `useAuth.ts`: CUSTOMER'ı tip'ten kaldır
- `uye-ol.vue`: role DEALER yap veya sayfayı `/bayilik`'e yönlendir
- `bayi.vue`: yorum güncelle

### ADIM 6: Test Güncelleme
- `auth.service.spec.ts`: CUSTOMER → DEALER

---

## Önerilen Uygulama Sırası

```
1. VERİTABANI: UPDATE User SET role='DEALER' WHERE role='CUSTOMER'
2. PRISMA:   Enum'dan CUSTOMER sil, default DEALER, migrate
3. BACKEND:  auth.service, create-user.dto, mailer, popup, seed
4. SHARED:   types/index.ts, referans schema'lar
5. FRONTEND: useAdminAuth, useAuth, uye-ol, bayi
6. TEST:     auth.service.spec.ts
```

---

## Risk Değerlendirmesi

| Risk | Önlem |
|------|-------|
| Migration'da enum değişikliği PostgreSQL'de hata verir | Manuel migration SQL'i yaz: `ALTER TYPE "UserRole" RENAME TO "UserRole_old"; CREATE TYPE "UserRole" AS ENUM ('DEALER', 'ADMIN', 'SUPER_ADMIN');` |
| CUSTOMER kullanıcıları DEALER'a dönüşünce DealerProfile'ları olmadığı için hata | DEALER'a çevrilen kullanıcılar için DealerProfile oluştur veya PENDING durumda bırak |
| Storefront'ta kırık register akışı | `/uye-ol` → `/bayilik` redirect |
| Tip hatası zincirleme yayılır | ADIM 4'ü ADIM 3'ten hemen sonra yap |

---

## Şu An Yapılanlar (Bu Oturum)

- [x] Stock controller `@Roles('ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_STAFF')` → `@Roles('ADMIN', 'SUPER_ADMIN')`
- [x] `.env.example` WHATSAPP_PHONE eklendi
- [x] CUSTOMER kullanım analizi tamamlandı (12 dosya)
- [x] Kırılma analizi tamamlandı
- [x] Refactor planı çıkarıldı

## Bekleyen (Onay Gerek)

- [ ] ADIM 1: DB UPDATE
- [ ] ADIM 2: Prisma migration
- [ ] ADIM 3-6: Kod refactor'ı
