/**
 * Shared admin domain types.
 * Mirror of NestJS DTOs (when API is wired in, swap import paths to @sadoksan/shared).
 */

// ───── Common ────────────────────────────────────────────────────────────────
export type ID = string
export type ISODate = string
export type Currency = number // stored in TRY, formatted at the edge

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface AuditMeta {
  createdAt: ISODate
  updatedAt: ISODate
}

// ───── Auth ──────────────────────────────────────────────────────────────────
export type AdminRole = 'admin' | 'manager' | 'finance' | 'viewer'

export interface AdminUser {
  id: ID
  email: string
  name: string
  role: AdminRole
}

// ───── Products ──────────────────────────────────────────────────────────────
export interface ProductVariation {
  id: ID
  sku: string
  label: string // e.g. "60x120cm Beige"
  attributes: Record<string, string> // size, color, finish ...
  price?: Currency // null = inherit parent
  stock: number
  images?: string[] // varyasyona özel görseller
}

export interface Product extends AuditMeta {
  id: ID
  netsisCode: string // master id from Netsis
  sku: string
  name: string
  brand: string
  brandId?: string
  category: string
  categoryId?: string
  description?: string
  images: string[]
  imageUrl?: string
  basePrice: Currency
  taxRate: number // 0.20 = %20 KDV
  unit: string // adet, m², kg
  visible: boolean // shown in catalog?
  purchasable: boolean // can add to cart?
  netsisStock: number // last synced from Netsis
  reservedStock: number // sum of pending B2B orders
  displayStock: number // netsisStock - reservedStock
  lastNetsisSync: ISODate
  syncStatus: 'synced' | 'pending' | 'error' | 'never'
  isFeatured?: boolean
  variations: ProductVariation[]
  // Stock thresholds for 3-level status system
  minimumStock: number // Required: red zone threshold (kritik stok)
  middleStock?: number // Optional: orange zone threshold (orta uyarı)
}

// ───── Orders ────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending-approval' // B2B awaiting admin approval
  | 'approved'
  | 'preparing'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'rejected'

export type CustomerType = 'B2C' | 'B2B'

export interface OrderLine {
  id: ID
  productId: ID
  variationId?: ID
  productName: string
  sku: string
  quantity: number
  unitPrice: Currency
  taxRate: number
  total: Currency // qty * unitPrice * (1 + taxRate)
}

export interface Order extends AuditMeta {
  id: ID
  orderNo: string // human readable: SDK-2026-0001
  customerType: CustomerType
  customerId: ID
  customerName: string
  dealerId?: ID
  dealerCariNo?: string
  dealerName?: string
  dealerCity?: string
  shippingCity: string
  shippingAddress: string
  status: OrderStatus
  lines: OrderLine[]
  subtotal: Currency
  tax: Currency
  logisticsSurcharge: Currency
  total: Currency
  // E-document
  eInvoiceNo?: string
  eInvoiceStatus?: 'pending' | 'submitted' | 'accepted' | 'rejected'
  eIrsaliyeNo?: string
  // Financial tracking
  invoiceCut?: boolean
  invoiceNo?: string
  invoiceDate?: ISODate
  cashCollected?: boolean
  cashCollectedAt?: ISODate
  deliveryNoteCut?: boolean
  // Admin actions
  approvedBy?: ID
  approvedAt?: ISODate
  rejectionReason?: string
  notes?: string
}

// ───── Dealers ───────────────────────────────────────────────────────────────
export type DealerStatus = 'pending' | 'active' | 'inactive' | 'rejected'

export interface Dealer extends AuditMeta {
  id: ID
  name: string
  contactPerson: string
  email: string
  phone: string
  cariNo: string // Netsis customer code
  cariValidated: boolean
  taxNo: string
  taxOffice: string
  city: string
  region: string // logistics region key
  address: string
  status: DealerStatus
  // Account state pulled from Netsis
  cariBalance: Currency // negative = borç (owes us)
  creditLimit: Currency
  // Stats (derived)
  totalOrders: number
  totalRevenue: Currency
  lastOrderAt?: ISODate
  riskScore?: number
  riskLevel?: string
  // Actions
  approvedBy?: ID
  approvedAt?: ISODate
  rejectionReason?: string
}

// ───── Stock ─────────────────────────────────────────────────────────────────
export interface StockReservation extends AuditMeta {
  id: ID
  productId: ID
  productName: string
  orderId: ID
  orderNo: string
  dealerId?: ID
  dealerName?: string
  quantity: number
  status: 'active' | 'released' | 'fulfilled'
}

export interface StockSyncStatus {
  lastSyncAt: ISODate | null
  lastSyncDuration: number // ms
  productsSynced: number
  errors: number
  status: 'idle' | 'running' | 'success' | 'error'
  nextScheduledAt: ISODate | null
}

// ───── Pricing & Logistics ───────────────────────────────────────────────────
export interface LogisticsRule extends AuditMeta {
  id: ID
  region: string // 'marmara', 'ege', 'icAnadolu'...
  cities: string[] // cities included in this region
  baseSurcharge: Currency // flat
  perKgSurcharge: Currency
  perM2Surcharge: Currency
  freeShippingThreshold?: Currency
  active: boolean
}

/**
 * Regional pricing surcharge (applied when dealer's province matches region)
 */
export interface RegionalPricingSurcharge extends AuditMeta {
  id: ID
  regionKey: string // 'Marmara', 'Ege', 'IcAnadolu'... from REGIONS
  surcharge: Currency // e.g., +100 TL per unit / +5 TL per kg / +10 TL per m²
  perKgSurcharge?: Currency
  perM2Surcharge?: Currency
  description: string // "Ege Bölgesi - %10 ek ücret"
  active: boolean
}

/**
 * Province-specific pricing override (replaces regional surcharge for that province)
 */
export interface ProvincePricingSurcharge extends AuditMeta {
  id: ID
  province: string // 'Aydın', 'İzmir'...
  surcharge: Currency // overrides regional surcharge
  perKgSurcharge?: Currency
  perM2Surcharge?: Currency
  description: string // "Aydın İl Özeli - %15 ek ücret"
  active: boolean
}

export interface DealerPricingOverride extends AuditMeta {
  id: ID
  dealerId: ID
  productId: ID
  customPrice: Currency
  validFrom: ISODate
  validUntil?: ISODate
  reason: string
}

// ───── Popups & Marketing ────────────────────────────────────────────────────
export type PopupAudience = 'all' | 'b2c' | 'b2b' | 'dealer-specific'

export interface Popup extends AuditMeta {
  id: ID
  title: string
  body: string // HTML
  imageUrl?: string
  ctaLabel?: string
  ctaUrl?: string
  audience: PopupAudience
  dealerIds?: ID[]
  startsAt: ISODate
  endsAt: ISODate
  active: boolean
  showOnceKey?: string // localStorage key on storefront
  impressions: number
  clicks: number
}

export interface NotifyRequest extends AuditMeta {
  id: ID
  productId: ID
  productName: string
  email?: string
  phone?: string
  isDealer: boolean
  dealerId?: ID
  status: 'pending' | 'notified' | 'cancelled'
  notifiedAt?: ISODate
  channel?: 'email' | 'whatsapp' | 'both'
}

// ───── Settings ──────────────────────────────────────────────────────────────
export interface SiteSettings {
  maintenanceMode: boolean
  maintenanceMessage: string
  maintenanceAllowAdmins: boolean
  cartReminderEnabled: boolean
  cartReminderHours: number
  notifyChannelDefault: 'email' | 'whatsapp' | 'both'
  whatsappRecipient: string // Serpil's number
  netsisSyncInterval: 'hourly' | '30min' | 'event-driven'
  alneoTrigger: 'order-placed' | 'order-paid' | 'order-shipped'
  // Branding
  siteName: string
  contactEmail: string
  introEnabled: boolean
}

// ───── Audit ─────────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: ID
  actorId: ID
  actorEmail: string
  action: string // 'product.update', 'order.approve' ...
  entity: string
  entityId: ID
  diff?: Record<string, { from: unknown; to: unknown }>
  ip?: string
  userAgent?: string
  createdAt: ISODate
}

// ───── Reports ───────────────────────────────────────────────────────────────
export interface SalesReportRow {
  date: ISODate
  orderCount: number
  b2cCount: number
  b2bCount: number
  revenue: Currency
  tax: Currency
}

export interface DealerPerformanceRow {
  dealerId: ID
  dealerName: string
  city: string
  orderCount: number
  revenue: Currency
  avgOrderValue: Currency
  cariBalance: Currency
  lastOrderAt?: ISODate
}
