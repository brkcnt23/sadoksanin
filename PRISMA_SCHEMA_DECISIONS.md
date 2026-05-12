# Prisma Schema Design — Sadoksan ERP

**Date:** 2026-05-02  
**Status:** Foundation complete, ready for NestJS implementation  
**Next Phase:** Migration file + seed script

---

## Overview

This schema supports:
- **B2C** (immediate checkout, no approval)
- **B2B** (approval workflow before fulfillment)
- **Stock management** (display formula: `total - reserved`)
- **Regional pricing** (7 Türkiye regions + dealer overrides)
- **Netsis sync** (hourly, no 12am bottleneck)
- **Alneo e-documents** (e-fatura, e-irsaliye)
- **Audit compliance** (immutable mutation log)

---

## Entity Relationships

```
User (admin/manager/finance/viewer roles)
├─ Orders (B2C only, via userId)
├─ AuditLog (who made changes)
├─ Favorites
└─ NotifyRequests

Dealer (B2B, tied to Netsis cari_no)
├─ Orders (B2B only, via dealerId)
├─ DealerLocation (region → logistics surcharge)
├─ DealerPricingOverride (per-dealer custom pricing)
├─ Favorites
└─ NotifyRequests

Product (from Netsis daily, site metadata overlay)
├─ ProductVariation (TBD: Netsis or site-defined)
├─ OrderLine (appears in orders)
├─ ReservedStock (pending orders → display_stock formula)
├─ Favorite (bookmarked by users/dealers)
└─ NotifyRequest (out-of-stock notifications)

Order (immediate B2C or approval-pending B2B)
├─ OrderLine (line items)
└─ ReservedStock (stock reservations)

ReservedStock (active reservations for display_stock calc)
└─ Linked to Product + Order

LogisticsRule (7 regions × base price + surcharge %)
DealerLocation (region mapping)
DealerPricingOverride (override base + surcharge)

Popup (marketing campaigns, audience-targeted)
NotifyRequest (user/dealer → product out-of-stock)
AuditLog (immutable, all mutations)
Setting (key-value store for admin config)

Netsis sync tables:
├─ NetsisProductSync (track last fetch)
├─ NetsisStockSnapshot (hourly reconciliation)
└─ NetsisCariSync (customer master matches)
```

---

## Critical Constraints & Formulas

### 1. Stock Display Formula

```sql
display_stock = Product.netsisStockTotal - SUM(ReservedStock.quantity)
WHERE ReservedStock.status = 'reserved'
AND ReservedStock.productId = Product.id
```

**Implementation:**
- Frontend: computed by `useStockStore.recomputeProductDisplayStock(productId)`
- Backend: BullMQ job refreshes `Product.displayStock` hourly
- Trigger: When Order approved (B2B) or paid (B2C) → create ReservedStock
- Release: When Order rejected/cancelled → ReservedStock.status = 'released'
- Fulfill: When Order shipped → ReservedStock.status = 'fulfilled'

**Risk if broken:**
- Stale `displayStock` → customer orders last item thinking stock available → overselling
- Mitigation: hourly refresh + NetsisStockSnapshot for audit trail

---

### 2. Order State Machine

```
B2C Immediate:
  pending_confirmation → (payment processed) → confirmed → fulfilled

B2B Approval-Pending:
  pending_confirmation → (admin approves) → confirmed → fulfilled
  pending_confirmation → (admin rejects) → rejected
```

**Fields tracking each state:**
- `submittedAt`: B2B submission timestamp
- `approvedAt`, `approvedBy`: Admin approval
- `rejectedAt`, `rejectedBy`, `rejectionReason`: Admin rejection
- `fulfilledAt`: Fulfillment/ship date
- `cancelledAt`: Cancellation by user or admin

**Invariants:**
- B2C order: `orderType = 'b2c_immediate'`, status jumps pending → confirmed on payment
- B2B order: `orderType = 'b2b_approval_pending'`, stays pending until admin acts
- No status rollback (no "return to pending" — handle refunds separately)

---

### 3. Dealer ↔ Netsis Cari Matching

```sql
UNIQUE(dealerId, netsisCariNo)
```

**Flow:**
1. Dealer self-registers, provides `cari_hesap_no`
2. Backend validates async (Netsis stub for MVP):
   - Query NetsisCariSync where `netsisAccountId = provided_cari_no`
   - If found: fetch credit_limit, region, balance
   - If not found: flag for manual review
3. On admin approval: `Dealer.netsisValidatedAt = now()`

**Why important:**
- Prevents duplicate dealer accounts
- Ensures order routing to correct Netsis account
- Enables credit limit enforcement (prevent over-ordering)

---

### 4. Pricing Calculation

**Hierarchy (highest precedence wins):**
1. DealerPricingOverride (per-dealer custom)
2. LogisticsRule surcharge (region-based) + base price
3. Netsis price (fallback)

**Example:**
```
For Dealer X in Istanbul ordering 100 units of SKU-001:
  base_price_from_netsis = 100 TL
  logistics_rule for Istanbul = base: 10 TL, surcharge: 5%
  final_unit_price = (100 + 10) * 1.05 = 115.50 TL
  
  BUT if DealerPricingOverride exists for (Dealer X, SKU-001):
    override_price = 110 TL (ignores logistics calc)
  final_unit_price = 110 TL
```

**Fields in Order:**
- `subtotal`: SUM(line_item.quantity * unit_price)
- `logisticsCharge`: surcharge * subtotal
- `tax`: tax_percent * subtotal (TBD: 18% standard?)
- `totalAmount`: subtotal + logisticsCharge + tax

---

### 5. Audit Immutability

```sql
CREATE TRIGGER audit_insert_only
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW EXECUTE audit_immutable();
```

**Recorded for:**
- Order approve/reject
- Dealer approve/reject/status change
- Product visibility/purchasability toggle
- Price rule changes
- Settings updates (maintenance mode, sync interval)

**Audit entry structure:**
```json
{
  "userId": "admin-1",
  "action": "approved",
  "entityType": "Order",
  "entityId": "ORD-2026-00001",
  "changes": {
    "before": { "status": "pending_confirmation" },
    "after": { "status": "confirmed", "approvedAt": "2026-05-02T10:30:00Z" }
  },
  "createdAt": "2026-05-02T10:30:00Z"
}
```

**Canonical source:** Backend AuditLog table (1000 entries max shown in admin UI)

---

## Design Decisions (& Tradeoffs)

### 1. **ProductVariation source: Undecided**

**Options:**
- A: Netsis master → sync daily, more authoritative
- B: Site-defined → flexible, can do "Color: Red + Size: XL" combos
- C: Hybrid → Netsis variations + site variants

**Current schema:** Allows both (`netsisVariationId` optional)
**Recommendation:** Clarify with stakeholder before NestJS implementation
- If Netsis: sync daily in BullMQ job
- If site: no sync, manual admin CRUD

### 2. **Regional pricing: Where does logic live?**

**Options:**
- A: All pricing in NestJS (LogisticsRule table)
- B: Base in Netsis, surcharge in NestJS
- C: All in Netsis

**Current:** Hybrid (B) — base price from Netsis, surcharge rules in DB
**Rationale:** Netsis is slow to change, surcharge needs quick updates (new region, promo)

### 3. **Alneo invoice trigger**

**Current assumption:** On Order.status = 'fulfilled' (after shipping)
**Risk:** Timing mismatch with Turkish e-invoice law (may require trigger on payment, not ship)

**TODO:** Confirm with Alneo + accountant before implementation

### 4. **Excel import safety**

**Current:** NOT included in schema (skipped for MVP per CLAUDE.md)
**Future:** If needed, add:
- `ImportLog` table (who, when, preview hash)
- `ImportedRecord` (before/after states for audit)
- Approval workflow: import → preview → admin confirm → apply

### 5. **Cart persistence**

**Current:** `CartItem` table with `expiresAt`
**Rationale:** Enables "abandoned cart" reminders (email/WhatsApp)
**Cleanup:** Cron job to delete expired carts daily

---

## Indexes & Query Patterns

**Hot paths (optimized with indexes):**

1. **Stock sync**: `ReservedStock.productId + status` → compute display_stock
2. **Order approval queue**: `Order.status + orderType` → show pending B2B orders
3. **Dealer history**: `Order.dealerId + createdAt DESC` → dealer orders report
4. **Audit trail**: `AuditLog.entityType + entityId + createdAt DESC` → compliance
5. **Product visibility**: `Product.isVisible + isPurchasable` → catalog filter
6. **Cari sync reconciliation**: `NetsisCariSync.lastSyncedAt` → which dealers need refresh

---

## Migration Path

### Phase 1: Init (this task)
- ✅ Schema designed
- ⬜ Seed script (test dealers, products, orders)
- ⬜ Prisma migration file (`001_init.sql`)

### Phase 2: NestJS Modules (Task #7)
- ⬜ `@nestjs/prisma` integration
- ⬜ PrismaService + type-safe queries
- ⬜ Each module gets DataModule with repository pattern

### Phase 3: API Implementation (Tasks #3-#11)
- ⬜ Controllers + DTOs
- ⬜ Netsis client (REST/SOAP stub)
- ⬜ BullMQ jobs (stock sync)
- ⬜ Alneo client

---

## Known Unknowns (Blockers for Full Implementation)

| Unknown | Impact | Blocker | Next Step |
|---------|--------|---------|-----------|
| Netsis API type (REST/SOAP) | Client implementation | YES | Confirm endpoint docs |
| ProductVariation source | Sync frequency + logic | MEDIUM | Stakeholder decision |
| Regional pricing ownership | Where to build logic | MEDIUM | Confirm with Netsis team |
| Alneo invoice trigger timing | Compliance risk | HIGH | Confirm with accountant |
| Excel import: approved or scrapped? | Schema changes | LOW | Product decision |
| Maintenance mode scope | Frontend or API? | LOW | Design decision |

---

## Validation Checklist

Before creating NestJS modules:

- [ ] Netsis API type confirmed
- [ ] ProductVariation source decided
- [ ] Alneo trigger timing verified with accountant
- [ ] Seed script created (test data for dev)
- [ ] Migration file generated (`pnpm prisma migrate dev --name init`)
- [ ] Schema reviewed by team
- [ ] Database connection string in `.env.dev`

---

## Files

- **Schema:** `packages/shared/prisma/schema.prisma`
- **Seed script:** (next session, `packages/shared/prisma/seed.ts`)
- **Migration:** (generated via `prisma migrate dev`)

**Next session:** Task #7 (NestJS module skeleton) depends on this schema being correct.

