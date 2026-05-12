# Admin Panel Testing Guide

**Status:** ✅ Components built, ready for local testing  
**Date:** 2026-05-02  
**Run Environment:** Windows PowerShell or Terminal

---

## 🚀 Step 1: Start Dev Server (Local Machine)

```powershell
cd C:\Users\brkcn\OneDrive\Belgeler\Claude\Projects\sadoksaninsaat

# Install dependencies (if not done)
pnpm install

# Start admin panel
pnpm --filter @sadoksan/admin dev
```

**Expected Output:**
```
> @sadoksan/admin@0.0.1 dev
> nuxt dev

ℹ Nuxt 4.x dev server
ℹ Listening on http://localhost:3002
```

**Navigate to:** http://localhost:3002/sadoksanadmin

---

## ✅ Task #22: Test Popup Edit Modal

### 2.1 Create New Popup

1. Navigate to **Popup & Kampanya** page
2. Click **"Yeni Popup"** button (top right)
3. Modal opens with title "Yeni Popup"
4. Fill form:
   - **Başlık:** "Yaz Kampanyası 2026"
   - **İçerik:** `<p>Bu yaz tüm ürünlerde <strong>%20 indirim</strong>!</p>`
   - **Görsel URL:** `https://via.placeholder.com/400x200`
   - **Düğme Metni:** "Detay Gör"
   - **Düğme Linki:** `https://example.com/summer`
   - **Hedef Kitle:** "Tüm Kullanıcılar"
   - **Başlangıç Tarihi:** Today
   - **Bitiş Tarihi:** +7 days
   - **Aktif:** Toggle ON

5. Click **"Kaydet"**
6. **Expected:** Modal closes, popup appears in grid with "Yayında" badge

### 2.2 Edit Existing Popup

1. On grid, find newly created popup
2. Click **"Düzenle"** button
3. Modal opens with pre-filled data
4. Change **Başlık** to "Yaz Kampanyası - Updated"
5. Change **Hedef Kitle** to "Seçili Bayiler"
6. Multi-select dropdown appears → select 2 dealers
7. Click **"Kaydet"**
8. **Expected:** Card updates with new title, "Bayi Bazlı" audience badge

### 2.3 Delete Popup

1. Click **"Sil"** on any popup
2. Browser confirm dialog: "Yaz Kampanyası - Updated silinsin mi?"
3. Click OK
4. **Expected:** Popup removed from grid, count updates

### 2.4 Form Validation

1. Click **"Yeni Popup"**
2. Leave **Başlık** empty, click **"Kaydet"**
3. **Expected:** Red error text "Başlık gerekli"
4. Fill **Başlık**, but set **Bitiş Tarihi** before **Başlangıç Tarihi**
5. Click **"Kaydet"**
6. **Expected:** Error "Bitiş tarihi başlangıç tarihinden sonra olmalı"
7. Create popup with **Hedef Kitle** = "Seçili Bayiler"
8. Click **"Kaydet"** without selecting any dealer
9. **Expected:** Error "En az bir bayi seçilmeli"

### 2.5 localStorage Verification

1. Open DevTools: **F12 → Application → Cookies → Local Storage → http://localhost:3002**
2. Find key: **`popups`**
3. Value should contain array of popups as JSON
4. Refresh page (F5)
5. **Expected:** Popup still visible (data persisted)

---

## ✅ Task #23: Test Logistics Rule Editor

### 3.1 View Logistics Rules Table

1. Navigate to **Fiyat & Lojistik** page
2. Scroll to **"Bölgesel Lojistik Kuralları"** section
3. **Expected:** Table with 7 regions (İstanbul, Ankara, İzmir, Bursa, Antalya, Adana, Gaziantep)
4. Columns: Bölge | Şehirler | Sabit Ücret | m² Başına | Ücretsiz Eşik | Durum | İşlemler

### 3.2 Edit Istanbul Logistics Rule

1. Click **"Düzenle"** on İstanbul row
2. Modal opens with header "İstanbul" + cities list
3. Form shows current values:
   - Sabit Nakliye Ücreti (₺)
   - KG Başına Ücret (₺)
   - m² Başına Ücret (₺)
   - Ücretsiz Nakliye Eşiği (₺)
4. Change **Sabit Nakliye Ücreti** from (seed value) to **25.00**
5. **Expected:** Preview updates below form
   - "100₺ arası ürün: X TL (sabit + 10kg)"
   - "5m² ürün: X TL"
6. Click **"Kaydet"**
7. **Expected:** Modal closes, table updates immediately, "Sabit Ücret" column now shows 25 TL

### 3.3 Test Price Calculator Integration

1. Scroll up to **"Fiyat Hesaplayıcı"**
2. **Ürün** select: pick any product
3. **Bayi**: Select Istanbul-based dealer
4. **Sevkiyat Şehri:** Type "İstanbul"
5. **Adet:** 5
6. **Expected:** 
   - Birim Fiyat: product base price
   - Ara Toplam: birim × adet
   - KDV: subtotal × 0.20
   - **Lojistik:** 25 TL (new surcharge we just set)
   - Toplam: all summed correctly

### 3.4 Free Shipping Threshold

1. Edit same region again
2. Set **Ücretsiz Nakliye Eşiği** to 500.00
3. Preview shows "500₺ üzeri: ÜCRETSIZ"
4. Save
5. In price calculator, change quantity so **subtotal + tax ≥ 500**
6. **Expected:** Lojistik becomes 0, total updates

### 3.5 Toggle Active/Inactive

1. Edit a region
2. Toggle **Aktif** OFF
3. Save
4. In price calculator, try to use that city
5. **Expected:** Logistics charge = 0 (rule ignored because inactive)

---

## ✅ Task #24: Test Dealer Pricing Overrides

### 4.1 Add First Override

1. Navigate to **Fiyat & Lojistik** page
2. Scroll to **"Bayi Bazlı Fiyat İstisnaları"**
3. Form shows: Bayi | Ürün | Özel Fiyat | Neden | [Ekle]
4. **Bayi:** Select "Akgün A.Ş."
5. **Ürün:** Select any product (shows base price e.g., 100 TL)
6. **Özel Fiyat:** 95.00
7. **Neden:** "Toplu sipariş indirimi"
8. Click **"İstisna Ekle"**
9. **Expected:** 
   - Topbar appears: "Mevcut İstisnalar"
   - Table row: Akgün A.Ş. | Ürün Adı | 95.00 TL | Toplu sipariş indirimi | [Sil]

### 4.2 Verify Price Calculator Uses Override

1. Scroll up to **Fiyat Hesaplayıcı**
2. **Ürün:** Select same product from override
3. **Bayi:** Select "Akgün A.Ş."
4. **Sevkiyat Şehri:** Any city
5. **Adet:** 10
6. **Expected:** **Birim Fiyat** shows 95 TL (NOT the product base price)
   - This proves override is applied

### 4.3 Form Validation

1. Try **"İstisna Ekle"** without selecting bayi
2. **Expected:** Red error "Bayi seçilmeli"
3. Select bayi, skip ürün, try to add
4. **Expected:** Red error "Ürün seçilmeli"
5. Select bayi + ürün, leave price empty, try to add
6. **Expected:** Red error "Fiyat gerekli ve sayı olmalı"
7. Select same bayi + ürün again, try to add
8. **Expected:** Error "Bu bayi ve ürün için zaten bir istisna var"

### 4.4 Delete Override

1. In the table, click **"Sil"** on Akgün row
2. Confirm dialog (browser default)
3. **Expected:** Row removed, table now empty or shows other overrides

### 4.5 localStorage Verification

1. DevTools → Local Storage
2. Key: **`pricing-overrides`**
3. Should contain JSON array with override object
4. Refresh page
5. **Expected:** Override still in form

---

## ✅ Task #25: Test Product Variation Editor

### 5.1 Create Product with Variations

1. Navigate to **Ürünler** page
2. Click **"Yeni Ürün"** button
3. **ProductFormModal** opens
4. Fill basic info:
   - **Ürün Adı:** "Kırmızı Karo"
   - **SKU:** "KARO-RED-001"
   - **Marka:** "AKGÜN"
   - **Kategori:** "Dönem Ürünleri"
   - **Birim:** "m²"
   - **Birim Fiyat:** 100.00
   - **KDV Oranı:** %20

5. Scroll down to **"Varyasyonlar"** section
6. Form shows empty table initially
7. Fill form:
   - **Varyasyon Adı:** "Renk"
   - **Değeri:** "Kırmızı"
   - **Fiyat Override:** (leave empty)
8. Click **"Ekle"**
9. **Expected:** Table shows row:
   - Adı: "Renk"
   - Değeri: "Kırmızı"
   - SKU: "renk-kirmizi"
   - Fiyat: "—"

### 5.2 Add Variation with Price Override

1. Still in form, fill:
   - **Varyasyon Adı:** "Boyut"
   - **Değeri:** "60x120cm"
   - **Fiyat Override:** 250.00
2. Click **"Ekle"**
3. **Expected:** New row in table with price 250 TL

### 5.3 Edit Variation

1. In table, click **"Düzenle"** on Kırmızı row
2. Row becomes editable inline
3. Change **Değeri** to "Kırmızı (Mat)"
4. Add **Fiyat Override:** 75.00
5. Click **"Kaydet"**
6. **Expected:** Row updates, display shows new label + price

### 5.4 Delete Variation

1. Click **"Sil"** on Boyut row
2. **Expected:** Row immediately removed, no confirmation

### 5.5 Save Product with Variations

1. Scroll up, fill remaining product fields (images, etc.)
2. Click **"Kaydet"** button in footer
3. **Expected:** 
   - Modal closes
   - Product appears in Ürünler list
   - Product.variations array contains 2 items

### 5.6 Edit Existing Product

1. In Ürünler list, click **"Düzenle"** on created product
2. Modal opens with pre-filled data
3. **Varyasyonlar** section shows existing 2 variations
4. Can add/edit/delete more
5. Save again

### 5.7 localStorage Verification

1. DevTools → Local Storage
2. Key: **`products`**
3. Find product by SKU "KARO-RED-001"
4. variations array should have 2 objects
5. Refresh page
6. **Expected:** Product + variations persist

---

## ✅ Task #26: Test Image Upload Zone

### 6.1 Upload via Click Browse

1. In ProductFormModal (create new or edit), scroll to **"Ürün Görselleri"**
2. Drag-drop zone shows: "Görselleri buraya sürükle veya tıkla"
3. Click zone
4. File picker opens
5. Select an image (e.g., ~2MB JPG)
6. **Expected:**
   - Thumbnail appears in 4-column grid below zone
   - First image gets blue "Ana" badge
   - Thumbnail shows preview of actual image

### 6.2 Drag-Drop Multiple

1. Drag 2-3 image files onto zone at once
2. All load sequentially
3. **Expected:** 3 thumbnails in grid, first has "Ana" badge

### 6.3 File Validation

1. Drag PDF file onto zone
2. **Expected:** Error message "Sadece JPG, PNG, WebP formatları destekleniyor"
3. Drag 10MB image
4. **Expected:** Error "Dosya boyutu 5MB'dan küçük olmalı"
5. Errors show in red text above zone

### 6.4 Reorder Images

1. Hover over 2nd image thumbnail
2. Click **star icon**
3. **Expected:** 
   - 2nd image moves to position 1
   - Gets blue "Ana" badge
   - Previous 1st image loses badge

### 6.5 Delete Image

1. Hover over any thumbnail
2. Click **trash icon**
3. **Expected:** Thumbnail removed from grid, count decreases

### 6.6 Save Product with Images

1. Fill product form (name, SKU, price, variations)
2. Upload 3 images
3. Reorder so 3rd image is primary
4. Click **"Kaydet"**
5. **Expected:** Product created with `images: [dataUrl3, dataUrl1, dataUrl2]`

### 6.7 localStorage Verification

1. DevTools → Local Storage
2. Key: **`products`**
3. Find product, check **`images`** array
4. Should be 3 strings starting with "data:image/"
5. Refresh page
6. **Expected:** Images visible in modal when editing product

---

## ✅ Task #27: Integration Test (Full Workflow)

### 7.1 Create Complete Product

```
Name: "Mermer Karo Kırmızı"
SKU: "MERMER-RED-60x60"
Brand: "AKGÜN"
Category: "Karo & Dekorasyon"
Unit: "m²"
Base Price: 150.00
Tax: %20
Visible: ✓
Purchasable: ✓

Images: (upload 2 images)
Reorder: 2nd as primary

Variations:
  - Renk: Kırmızı (price +0)
  - Boyut: 60x60cm (price +25)
```

**Expected:** Product created, visible in list

### 7.2 Create Pricing Override

```
Dealer: Select Istanbul-based dealer
Product: "Mermer Karo Kırmızı" (SKU-MERMER-RED-60x60)
Custom Price: 140.00
Reason: "Uzun dönem kontrat"
```

**Expected:** Override appears in table, active

### 7.3 Test Price Calculator

```
Ürün: "Mermer Karo Kırmızı"
Bayi: Istanbul dealer
Şehir: İstanbul
Adet: 10
```

**Expected Results:**
- Birim Fiyat: 140 TL (override, not 150 base)
- Ara Toplam: 1400 TL
- KDV: 280 TL (20%)
- Lojistik: 25 TL (Istanbul rule)
- Toplam: 1705 TL

### 7.4 Create Dealer-Specific Popup

```
Title: "Yeni Ürün: Mermer Karo Kırmızı"
Body: "<p>Istanbul bayilerimize özel indirim!</p>"
Audience: Seçili Bayiler (select 3 dealers including ours)
Start: Today
End: +30 days
Active: ✓
```

**Expected:** Popup appears with "Bayi Bazlı" + "Yayında" badges

### 7.5 Cross-Verify All Data in localStorage

Open DevTools → Local Storage, verify all keys:

```json
{
  "products": [
    {
      "id": "...",
      "sku": "MERMER-RED-60x60",
      "name": "Mermer Karo Kırmızı",
      "images": ["data:image/...", "data:image/..."],
      "variations": [
        {"id": "...", "label": "Kırmızı", "price": null},
        {"id": "...", "label": "60x60cm", "price": 25}
      ]
    }
  ],
  "pricing-overrides": [
    {
      "id": "...",
      "dealerId": "...",
      "productId": "...",
      "customPrice": 140.00,
      "reason": "Uzun dönem kontrat"
    }
  ],
  "popups": [
    {
      "id": "...",
      "title": "Yeni Ürün: Mermer Karo Kırmızı",
      "audience": "dealer-specific",
      "dealerIds": ["...", "...", "..."],
      "active": true
    }
  ]
}
```

**Expected:** All 3 collections have new data

### 7.6 Page Refresh Test

1. Refresh page (F5)
2. Navigate to Ürünler → find product
3. **Expected:** Product still there with images + variations
4. Navigate to Fiyat & Lojistik
5. **Expected:** Override + popup still visible
6. DevTools Console
7. **Expected:** No red error logs, only info/warnings

---

## 📋 Checklist for Go-Live

- [ ] All 7 test cases pass locally
- [ ] No console errors (red) in DevTools
- [ ] localStorage keys persist across refresh
- [ ] Price calculator math correct
- [ ] Validation messages appear for invalid inputs
- [ ] Modal animations smooth (no UI glitches)
- [ ] Drag-drop zone responsive (mobile viewport test)
- [ ] File upload doesn't block UI (progress shown)

---

## 🐛 Known Issues / TODO

- **Image S3 Upload:** Currently data: URLs (localStorage). Swap in production to S3 client.
- **Product Variation Source:** Currently site-defined. After Netsis integration, decide if daily sync from Netsis.
- **Dealer Search:** Dropdown doesn't filter on type. May add search box for large dealer lists.
- **Accessibility:** Drag-drop zone not keyboard accessible yet (add tabindex, ARIA labels for production).

---

## 📞 Support

If tests fail:
1. Check console (F12) for error messages
2. Verify localStorage keys exist (not "undefined")
3. Clear localStorage, reload, try again
4. Check that all components imported correctly (Icon, Modal, etc.)

Last updated: 2026-05-02
