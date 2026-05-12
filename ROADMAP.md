# Sadoksan ERP — Development Roadmap
**Last Updated:** 2026-05-12  
**Status:** Phase 1 - High-Value Features (Customer Focus)

---

## 🎯 Current Priority

**HOLD**: Netsis integration (until factory visit)  
**FOCUS**: High-value features that impress customer
- Proforma PDF Generator ⭐
- Admin Dashboard - Pending Orders
- Dealer Cari Statement

---

## 📋 Complete Task Backlog (18 Items)

### 🔴 PHASE 1: HIGH-VALUE FEATURES (This Week)

#### #1 ⭐ **Proforma PDF Generator** [IN PROGRESS]
**Status**: Starting now  
**Owner**: Claude + John  
**Priority**: CRITICAL (Customer wants this badly)

**What it does:**
- Dealer selects products from cart or order
- System generates professional Proforma Invoice PDF
- Product images auto-placed in table
- Pre-filled with: dealer info, company details, product specs
- Editable fields: quantities, descriptions, pricing adjustments
- Totals auto-calculated

**Technical Details:**
```
Frontend: apps/storefront/app/pages/dealer/proforma.vue
Backend: apps/api/src/modules/proforma/
API: POST /api/proforma/generate → returns PDF blob
PDF Gen: pdfkit (Node.js) or reportlab (Python)
Database: ProformaTemplate table (header config, footer config)
```

**Data Model:**
```prisma
model ProformaTemplate {
  id        String    @id @default(cuid())
  companyName String
  companyAddress String
  bankDetails String
  logoUrl String?
  createdAt DateTime @default(now())
}

model ProformaItem {
  id          String @id @default(cuid())
  proformaId  String
  productId   String
  quantity    Int
  description String
  price       Float
  amount      Float  // qty * price
  imageUrl    String?
}
```

**Flow:**
1. Dealer navigates to `/dealer/proforma`
2. Selects products or imports from pending order
3. Edits quantities/descriptions in modal
4. Preview PDF → "Generate" button
5. Download PDF with company logo + product images

**Deliverable:** Production-ready Proforma PDF with images

---

#### #2 **Admin Dashboard - Pending Orders Widget**
**Status**: Queued (starts after Proforma skeleton)  
**Owner**: Claude  
**Priority**: HIGH (Admin visibility)

**What it does:**
- Real-time dashboard showing dealer orders awaiting approval
- Quick approve/reject buttons
- Filter by dealer, date range, status
- Visual indicators (badges, colors)

**Frontend:**
```
apps/admin/app/pages/dashboard.vue
- DataTable with: Order# | Dealer | Date | Items | Total | Status | Actions
- Filters: Status dropdown, date picker, dealer search
```

**Backend API:**
```
GET /api/admin/orders?status=PENDING_APPROVAL
GET /api/admin/orders/:id (full details)
PATCH /api/admin/orders/:id/approve (set status, trigger fulfillment)
PATCH /api/admin/orders/:id/reject (set status, notify dealer)
```

**Database:**
```prisma
model Order {
  // ... existing fields
  status    OrderStatus // PENDING_APPROVAL, APPROVED, REJECTED, SHIPPED
  createdAt DateTime
  updatedAt DateTime
}

enum OrderStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SHIPPED
}
```

---

#### #3 **Dealer Cari Statement Report**
**Status**: Queued  
**Owner**: Claude  
**Priority**: HIGH (Self-service reporting)

**What it does:**
- Dealer views their Netsis customer account (cari hesap) balance
- Invoice history (last 12 months)
- Current balance due/credit
- Aging breakdown (Current, 30 days, 60+ days, 90+ days)
- Printable PDF export

**Frontend:**
```
apps/storefront/app/pages/dealer/reports/cari-statement.vue
- Summary cards: Current Balance, Total Due, Credit
- Aging table: Age | Amount
- Invoice list table: Invoice# | Date | Amount | Status
- "Print PDF" button
```

**Backend API:**
```
GET /api/dealers/:id/cari-statement
Returns: {
  dealerId: string
  dealerName: string
  balance: number
  totalDue: number
  credit: number
  aging: { current, 30days, 60days, 90plus }
  invoices: [{ invoiceNo, date, amount, status }]
}
```

**Note**: Data source = Netsis cari API (holds off until factory visit)

---

### 🟠 PHASE 2: INFRASTRUCTURE & ADMIN FEATURES (Next 2 weeks)

#### #4 **Excel Export - Stock & Price Reports**
**Status**: Planning  
**Features:**
- Dealer > Dashboard > "Export Stock"
- Export columns: SKU | Description | Available Stock | Last Sync
- Price snapshot: SKU | Price | Logistics Surcharge | Total
- Cari statement to XLSX

**API Endpoints:**
```
GET /api/dealers/:id/stock-export (returns XLSX file)
GET /api/dealers/:id/price-export
GET /api/dealers/:id/cari-statement/export
```

---

#### #5 **Excel Import - Bulk Price Updates (Safe)**
**Status**: Planning  
**Safety First:**
1. Admin uploads XLSX → System validates schema
2. Shows preview: Old Price → New Price
3. Admin reviews diffs → Clicks "Approve"
4. Updates apply + audit log entry
5. Email confirmation

**No direct stock import** (too risky for overselling)

---

#### #6 **Product Visibility & Purchasability Toggles**
**Status**: Planning  
**Features:**
- Admin > Catalog > Checkboxes: `isVisible` | `isPurchasable`
- Bulk toggle (select multiple)
- Use case: New product visible but not yet buyable

---

#### #7 **Favorite Items (B2C + Dealers)**
**Status**: Planning  
**Features:**
- Heart icon on product cards
- `/favorites` dedicated page
- Quick-reorder section in dealer dashboard
- APIs: POST/DELETE `/api/favorites/:productId`

---

#### #8 **Stock Availability Notifications**
**Status**: Planning  
**Features:**
- Dealer clicks "Notify when available" on out-of-stock product
- Cron checks Netsis stock every 4 hours
- When stock > 0: Email notification
- Initially: Email to Serpil (owner), later: WhatsApp integration

---

#### #9 **Dealer Active/Inactive Toggle**
**Status**: Planning  
**Features:**
- Admin > Dealers list > Toggle `isActive`
- When inactive: dealer cannot login/order
- Order history still visible
- Can reactivate anytime

---

#### #10 **Maintenance Mode**
**Status**: Planning  
**Decision Needed:**
- Option A: Blocks all users (show "Under maintenance")
- Option B: Blocks dealers only (B2C continues)
- Option C: Blocks frontend only (API/admin work)
- **Recommendation**: Option A (full maintenance)

---

#### #11 **Cart Reminders - Email Campaigns**
**Status**: Planning  
**Flow:**
1. Dealer adds to cart but doesn't checkout (24+ hours)
2. Cron sends email: "You left X items in cart"
3. Auto-follow-up at 3 days
4. Product images + "Complete order" CTA

---

### 🟡 PHASE 3: DECISIONS & BUSINESS LOGIC (Factory Visit)

#### #12 **Netsis Stock Calculation Logic**
**Status**: HOLD until factory visit  
**What it does:**
- Formula: `Available_Stock = Netsis_Total_Stock - Pending_Orders_Count`
- Track reserved stock for pending B2B orders
- When order approved: fetch fresh Netsis stock
- When order shipped: release reservation

**Database:**
```prisma
model ReservedStock {
  id        String @id @default(cuid())
  productId String
  orderId   String
  quantity  Int
  createdAt DateTime
}
```

**Risk Area:** Stock sync delay = overselling window  
**Solution:** Hourly Netsis polling (decide with John at factory)

---

#### #13 **Bayi Order Approval Workflow**
**Status**: HOLD until Netsis integration  
**Flow:**
1. Dealer places order → Status: `PENDING_APPROVAL`
2. Admin sees in dashboard → Reviews items/stock
3. Admin approves → Trigger fulfillment
4. On approval: Fetch fresh Netsis stock, update reservations

---

#### #14 **Decide: Netsis API Type & Alneo Invoice Trigger**
**Status**: DECISION PENDING  
**Questions for John (Factory):**

1. **Netsis API Type?**
   - REST or SOAP?
   - Which version/endpoint?
   - Authentication (API key, OAuth)?

2. **Alneo Invoice Trigger?**
   - When exactly auto-generate e-invoice?
   - Option A: When order placed
   - Option B: When order approved
   - Option C: When order shipped ← Recommended (safest legally)
   - Option D: After payment confirmed

3. **Regional Pricing Logic?**
   - Site config (define surcharge per region)?
   - Or Netsis master data?
   - Recommendation: Site config (faster, simpler)

---

#### #15 **Product Variations - Netsis vs Site-Defined**
**Status**: DECISION PENDING  
**Options:**
- Option A: Sync from Netsis (complex, dependency)
- Option B: Define on site (simple, flexible) ← Recommended
- Example: Color (Brass Antique vs Silver Plated), Size (S/M/L)

---

#### #16 **Dealer Onboarding Flow**
**Status**: DECISION PENDING  
**Options:**
- Option A: Self-register (dealer signs up, provides cari#, admin approves)
- Option B: Admin-created (admin invites dealer)
- Recommendation: Option A (scales better)

---

### 🟢 PHASE 4: NICE-TO-HAVE FEATURES (Later)

#### #17 **Categories Management (from Netsis)**
- Sync daily from Netsis
- Category hierarchy
- Dealer filter by category
- Admin toggle visibility

#### #18 **General + Dealer-Specific Pop-ups**
- Admin creates announcements
- Target specific dealers
- Schedule timing
- Store in database

---

## 🗓️ Timeline

| Phase | Duration | Features | Start Date |
|-------|----------|----------|-----------|
| **Phase 1** | This week | Proforma PDF, Pending Orders Widget, Cari Statement | May 12 |
| **Phase 2** | 2 weeks | Excel export/import, toggles, notifications, cart reminders | May 19 |
| **Phase 3** | Factory visit | Netsis decisions, stock logic, approval workflow | TBD |
| **Phase 4** | Later | Categories, pop-ups, nice-to-haves | Post-factory |

---

## 💾 Database Changes Needed

```prisma
// Proforma
model ProformaTemplate {
  id              String   @id @default(cuid())
  companyName     String
  companyAddress  String
  bankDetails     String
  logoUrl         String?
  createdAt       DateTime @default(now())
}

// Reserved Stock (for order approval)
model ReservedStock {
  id        String @id @default(cuid())
  productId String
  orderId   String
  quantity  Int
  createdAt DateTime
}

// Favorites
model Favorite {
  id        String @id @default(cuid())
  userId    String
  productId String
  createdAt DateTime
  @@unique([userId, productId])
}

// Stock Alerts
model StockAlert {
  id        String   @id @default(cuid())
  userId    String
  productId String
  notified  Boolean  @default(false)
  createdAt DateTime
  @@unique([userId, productId])
}

// Extend Order model
enum OrderStatus {
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SHIPPED
}

// Extend Product model
model Product {
  // ... existing
  isVisible      Boolean  @default(true)
  isPurchasable  Boolean  @default(true)
}

// Extend Dealer model
model Dealer {
  // ... existing
  isActive       Boolean  @default(true)
}
```

---

## 🔗 Key Files to Modify

**Frontend:**
- `apps/storefront/app/pages/dealer/proforma.vue` (new)
- `apps/storefront/app/pages/dealer/reports/cari-statement.vue` (new)
- `apps/admin/app/pages/dashboard.vue` (update)
- `apps/admin/app/pages/catalog.vue` (add toggles)

**Backend:**
- `apps/api/src/modules/proforma/` (new module)
- `apps/api/src/modules/orders/` (update approval workflow)
- `apps/api/src/modules/dealers/` (update reports)
- `apps/api/src/modules/products/` (add toggles)

**Shared:**
- `packages/shared/types/` (update types)
- `packages/shared/prisma/schema.prisma` (update schema)

---

## ✅ Ready to Start?

Next step: **Proforma PDF Generator** — frontend skeleton + API design.

Let's ship this feature this week! 🚀

