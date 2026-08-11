/**
 * Sadoksan kayıtları → Ideasoft Admin API objeleri.
 *
 * ⚠️ Alan adları GERÇEK Prisma şemasına göredir (plan §2 varsayımsaldı):
 *   Order.subtotal/tax/total/logisticsSurcharge/trackingNumber, User.name (tek alan),
 *   Dealer.taxNo/company/cariBalance/creditLimit/cariNo, Product.basePrice/displayStock.
 *
 * Nested order objesi shipping_address/shipment/order_item içinde de kullanılır.
 */
import { iso } from './query.util';

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

/** "Ahmet Yılmaz" → { firstname:"Ahmet", surname:"Yılmaz" } */
export function splitName(name?: string | null): {
  firstname: string;
  surname: string;
} {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstname: '', surname: '' };
  if (parts.length === 1) return { firstname: parts[0], surname: '' };
  return { firstname: parts[0], surname: parts.slice(1).join(' ') };
}

// Sadoksan OrderStatus (enum) → Ideasoft status slug.
// ⚠️ Entegra'nın beklediği tam slug'lar go-live'da teyit edilecek; tek yerde tut.
export const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING_APPROVAL: 'waiting_for_approval',
  APPROVED: 'approved',
  PREPARING: 'being_prepared',
  SHIPPED: 'shipped',
  COMPLETED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'cancelled',
  RETURN_REQUESTED: 'refund_requested',
  RETURNED: 'refunded',
};

export function mapOrderStatus(s?: string | null): string {
  return ORDER_STATUS_MAP[s ?? ''] ?? 'new';
}

// PaymentStatus (PENDING/PAID/FAILED) → Ideasoft
export function mapPaymentStatus(s?: string | null): string {
  switch (s) {
    case 'PAID':
      return 'success';
    case 'FAILED':
      return 'failed';
    default:
      return 'waiting';
  }
}

export function mapPaymentTypeName(method?: string | null): string {
  switch (method) {
    case 'CREDIT_CARD':
      return 'Kredi Kartı';
    case 'BANK_TRANSFER':
      return 'Havale/EFT';
    default:
      return method || 'Havale/EFT';
  }
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface MapOrderCtx {
  orderIdMap: Map<string, number>; // Order.id → int
}

/**
 * Ideasoft order objesi. `order` alanı diğer entity'lerde gömülü kullanılır.
 * Beklenen ilişkiler: order.customer (User), order.dealer (Dealer?).
 */
export function mapOrder(order: any, ctx: MapOrderCtx): any {
  const id = ctx.orderIdMap.get(order.id) ?? 0;
  const customer = order.customer ?? {};
  const { firstname, surname } = splitName(customer.name);

  return {
    id,
    orderCode: order.orderNo,
    customerFirstname: firstname,
    customerSurname: surname,
    customerEmail: customer.email ?? null,
    customerPhone: customer.phone ?? null,
    status: mapOrderStatus(order.status),
    paymentStatus: mapPaymentStatus(order.paymentStatus),
    paymentTypeName: mapPaymentTypeName(order.paymentMethod),
    amount: order.subtotal ?? 0,
    taxAmount: order.tax ?? 0,
    generalAmount: order.total ?? 0,
    shippingAmount: order.logisticsSurcharge ?? 0,
    discountAmount: order.discountAmount ?? 0,
    finalAmount: order.total ?? 0,
    currency: 'TL',
    currencyRates: { TL: [1, 1] },
    transactionId: String(order.id).slice(0, 15),
    deviceType: 'desktop',
    source: 'Sadoksan B2B',
    invoicePrintCount: 0,
    installment: 1,
    installmentRate: 1.0,
    shippingTrackingCode: order.trackingNumber ?? null,
    shippingProviderCode: 'yurtici',
    shippingCompanyName: order.cargoCompany ?? 'Yurtiçi Kargo',
    note: order.notes ?? null,
    createdAt: iso(order.createdAt),
    updatedAt: iso(order.updatedAt),
  };
}

// ─── Order Item ──────────────────────────────────────────────────────────────

export interface MapOrderItemCtx {
  itemIdMap: Map<string, number>; // OrderLine.id → int
  productIdMap: Map<string, number>; // Product.id → int
  order?: any; // gömülecek Ideasoft order objesi (opsiyonel)
}

/** Ideasoft order_item objesi (OrderLine'dan). */
export function mapOrderItem(line: any, ctx: MapOrderItemCtx): any {
  const product = line.product ?? {};
  const taxRatePct = Math.round((line.taxRate ?? 0) * 100);
  const out: any = {
    id: ctx.itemIdMap.get(line.id) ?? 0,
    productId: ctx.productIdMap.get(line.productId) ?? 0,
    productName: product.name ?? null,
    sku: product.sku ?? null,
    quantity: line.quantity ?? 0,
    price: line.unitPrice ?? 0,
    tax: taxRatePct,
    taxRate: taxRatePct,
    subtotal: line.total ?? 0,
    total: line.total ?? 0,
    currency: 'TL',
  };
  if (ctx.order) out.order = ctx.order;
  return out;
}

// ─── Member (User + opsiyonel Dealer) ────────────────────────────────────────

export interface MapMemberCtx {
  memberIdMap: Map<string, number>; // User.id → int
  currentAccount?: any; // gömülü current_account (member:null ile — döngü kırma)
}

export function mapMember(user: any, ctx: MapMemberCtx): any {
  const dealer = user.dealer ?? null;
  const { firstname, surname } = splitName(user.name);
  const city = dealer?.city ?? user.city ?? null;
  return {
    id: ctx.memberIdMap.get(user.id) ?? 0,
    firstname,
    surname,
    email: user.email ?? null,
    password: '***',
    gender: 'unspecified',
    birthDate: null,
    phoneNumber: dealer?.phone ?? user.phone ?? null,
    mobilePhoneNumber: dealer?.phone ?? user.phone ?? null,
    tcId: null,
    status: dealer?.status === 'INACTIVE' ? 'passive' : 'active',
    kvkkStatus: 1,
    commercialName: dealer?.company ?? null,
    taxNumber: dealer?.taxNo ?? null,
    taxOffice: dealer?.taxOffice ?? null,
    address: dealer?.address ?? user.address ?? null,
    country: { id: 1, name: 'Türkiye', code: 'TR', status: 1 },
    location: { id: 0, name: city, status: 1 },
    locationName: city,
    district: null,
    zipCode: null,
    memberGroup: {
      id: 1,
      name: 'Bayi',
      priceIndex: 1,
      priceRatio: 1.0,
      currentAccountStatus: 1,
      ideapayStatus: 0,
      allowedPaymentTypes: 'Custom, CreditCard, MailOrder',
    },
    currentAccount: ctx.currentAccount ?? null,
    deviceType: 'bilgisayar',
    lastIp: null,
    pointAmount: 0,
    allowedToPhone: 1,
    allowedToCampaigns: 1,
    allowedToSms: 1,
    lastLoginDate: null,
    createdAt: iso(user.createdAt),
    updatedAt: iso(user.updatedAt),
  };
}

// ─── Current Account (Dealer) ────────────────────────────────────────────────

export interface MapCurrentAccountCtx {
  caIdMap: Map<string, number>; // Dealer.id → int
  member?: any; // gömülü member (currentAccount:null ile — döngü kırma)
}

export function mapCurrentAccount(dealer: any, ctx: MapCurrentAccountCtx): any {
  return {
    id: ctx.caIdMap.get(dealer.id) ?? 0,
    code: dealer.cariNo ?? String(dealer.id).slice(0, 8),
    title: dealer.company ?? dealer.name ?? null,
    balance: dealer.cariBalance ?? 0, // EN KRİTİK: cari bakiye
    riskLimit: dealer.creditLimit ?? 0,
    createdAt: iso(dealer.createdAt),
    updatedAt: iso(dealer.updatedAt),
    member: ctx.member ?? null,
  };
}

// ─── Product ─────────────────────────────────────────────────────────────────

/** Basit slug (Product'ta slug alanı yok — ad'dan türet). */
export function slugify(s?: string | null): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface MapProductCtx {
  productIdMap: Map<string, number>; // Product.id → int
  brandIdMap?: Map<string, number>; // Brand.id → int
}

export function mapProduct(p: any, ctx: MapProductCtx): any {
  const taxPct = Math.round((p.taxRate ?? 0) * 100);
  const hasVariations = Array.isArray(p.variations) && p.variations.length > 0;
  let brand: any = null;
  if (p.brand || p.brandRel) {
    brand = {
      id: p.brandId ? (ctx.brandIdMap?.get(p.brandId) ?? null) : null,
      name: p.brandRel?.name ?? p.brand ?? null,
      slug: slugify(p.brandRel?.name ?? p.brand),
      status: 1,
      imageUrl: p.brandRel?.logoUrl ?? null,
    };
  }
  return {
    id: ctx.productIdMap.get(p.id) ?? 0,
    name: p.name,
    fullName: p.name,
    slug: slugify(p.name),
    sku: p.sku,
    barcode: null,
    stockAmount: p.displayStock ?? p.netsisStock ?? 0,
    price1: p.basePrice ?? 0,
    currency: { id: 1, label: 'Türk Lirası', abbr: 'TL' },
    discount: 0,
    discountType: 1,
    moneyOrderDiscount: 0,
    buyingPrice: null,
    taxIncluded: 1,
    tax: taxPct,
    warranty: 24,
    volumetricWeight: p.weight ?? null,
    stockTypeLabel: 'Piece',
    customShippingDisabled: 0,
    customShippingCost: 0,
    distributor: 'Sadoksan',
    hasGift: 0,
    status: p.visible ? 1 : 0,
    hasOption: hasVariations ? 1 : 0,
    shortDetails: null,
    searchKeywords: null,
    installmentThreshold: '-',
    categoryShowcaseStatus: 1,
    pageTitle: p.name,
    metaDescription: null,
    metaKeywords: null,
    canonicalUrl: slugify(p.name),
    parent: null,
    brand,
    imageUrl: p.imageUrl ?? null,
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

// ─── Product Detail (Product.description) ─────────────────────────────────────

export interface MapProductDetailCtx {
  detailIdMap: Map<string, number>; // Product.id → int (product_detail entity)
  productIdMap: Map<string, number>; // Product.id → int (product entity)
}

export function mapProductDetail(p: any, ctx: MapProductDetailCtx): any {
  return {
    id: ctx.detailIdMap.get(p.id) ?? 0,
    sku: p.sku,
    details: p.description ?? null,
    extraDetails: null,
    product: {
      id: ctx.productIdMap.get(p.id) ?? 0,
      name: p.name,
      fullName: p.name,
      slug: slugify(p.name),
      sku: p.sku,
      barcode: null,
      stockAmount: p.displayStock ?? p.netsisStock ?? 0,
      price1: p.basePrice ?? 0,
      discount: 0,
      discountType: 1,
    },
  };
}

// ─── Billing Address (Order + Dealer/customer) ───────────────────────────────

export interface MapAddressCtx {
  idMap: Map<string, number>; // Order.id → int (entity'ye göre)
  order?: any; // gömülü Ideasoft order objesi
}

export function mapBillingAddress(order: any, ctx: MapAddressCtx): any {
  const customer = order.customer ?? {};
  const dealer = order.dealer ?? null;
  const { firstname, surname } = splitName(customer.name);
  const out: any = {
    id: ctx.idMap.get(order.id) ?? 0,
    firstname,
    surname,
    country: 'Türkiye',
    location: dealer?.city ?? order.shippingCity ?? null,
    subLocation: null,
    address: dealer?.address ?? order.shippingAddress ?? null,
    phoneNumber: dealer?.phone ?? customer.phone ?? null,
    mobilePhoneNumber: dealer?.phone ?? customer.phone ?? null,
    invoiceType: dealer?.taxNo ? 'corporate' : 'individual',
    taxNo: dealer?.taxNo ?? null,
    taxOffice: dealer?.taxOffice ?? null,
    identityRegistrationNumber: null,
  };
  if (ctx.order) out.order = ctx.order;
  return out;
}

// ─── Shipping Address (Order) ─────────────────────────────────────────────────

export function mapShippingAddress(order: any, ctx: MapAddressCtx): any {
  const customer = order.customer ?? {};
  const { firstname, surname } = splitName(customer.name);
  const out: any = {
    id: ctx.idMap.get(order.id) ?? 0,
    firstname,
    surname,
    country: 'Türkiye',
    location: order.shippingCity ?? null,
    subLocation: null,
    address: order.shippingAddress ?? null,
    phoneNumber: customer.phone ?? null,
    mobilePhoneNumber: customer.phone ?? null,
    zipCode: null,
  };
  if (ctx.order) out.order = ctx.order;
  return out;
}

// ─── Shipment (Order) ─────────────────────────────────────────────────────────

export function mapShipment(order: any, ctx: MapAddressCtx): any {
  const out: any = {
    id: ctx.idMap.get(order.id) ?? 0,
    barcode: order.trackingNumber ?? null,
    waybillNo: null,
    invoiceKey: null,
    cargoOffice: null,
    code: order.trackingNumber ?? null,
    deliveryType: 'standart_delivery',
    invoiceIncluded: 1,
    payAtDoorAmount: 0,
    status: 1,
  };
  if (ctx.order) out.order = ctx.order;
  return out;
}
