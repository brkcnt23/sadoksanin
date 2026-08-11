import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { IdMapService } from './id-map.service';
import { ListQuery, parseListQuery } from './query.util';
import {
  mapOrder,
  mapOrderItem,
  mapMember,
  mapCurrentAccount,
  mapProduct,
  mapProductDetail,
  mapBillingAddress,
  mapShippingAddress,
  mapShipment,
  ORDER_STATUS_MAP,
} from './mappers';
import { IdeasoftEntity } from './id-map.service';

/**
 * Ideasoft Admin API veri servisi — Faz 2.
 * Sadoksan verisini çeker, integer ID eşler, Ideasoft formatına dönüştürür.
 *
 * Bu aşama: orders + order_items (flagship, deseni kurar).
 */
@Injectable()
export class IdeasoftAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idMap: IdMapService,
  ) {}

  // Ideasoft status slug → Sadoksan enum(lar)
  private sadoksanStatuses(ideasoftSlug: string): string[] {
    return Object.entries(ORDER_STATUS_MAP)
      .filter(([, slug]) => slug === ideasoftSlug)
      .map(([enumVal]) => enumVal);
  }

  /** sinceId (Ideasoft int) → sınır kaydın createdAt'i (createdAt > filtresi için). */
  private async sinceCreatedAt(
    entity: 'order' | 'order_item',
    sinceId?: number,
  ): Promise<Date | undefined> {
    if (!sinceId) return undefined;
    const cuid = await this.idMap.toSadoksanId(entity, sinceId);
    if (!cuid) return undefined;
    if (entity === 'order') {
      const o = await this.prisma.order.findUnique({
        where: { id: cuid },
        select: { createdAt: true },
      });
      return o?.createdAt;
    }
    const l = await this.prisma.orderLine.findUnique({
      where: { id: cuid },
      select: { createdAt: true },
    });
    return l?.createdAt;
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  private async buildOrderWhere(q: ListQuery): Promise<any> {
    const where: any = {};

    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds('order', q.ids);
      where.id = { in: [...map.values()] };
      // Hiç eşleşme yoksa boş sonuç dönsün
      if (where.id.in.length === 0) where.id = { in: ['__none__'] };
    }

    const since = await this.sinceCreatedAt('order', q.sinceId);
    if (since) where.createdAt = { gt: since };

    // status filtresi (Ideasoft slug)
    const statusSlug = q.raw.status;
    if (statusSlug) {
      const enums = this.sadoksanStatuses(String(statusSlug));
      where.status = { in: enums.length ? enums : ['__none__'] };
    }

    // serbest arama: sipariş no / müşteri
    if (q.search) {
      where.OR = [
        { orderNo: { contains: q.search, mode: 'insensitive' } },
        { customer: { name: { contains: q.search, mode: 'insensitive' } } },
        { customer: { email: { contains: q.search, mode: 'insensitive' } } },
      ];
    }
    return where;
  }

  async listOrders(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildOrderWhere(q);

    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });

    const orderIdMap = await this.idMap.resolveMany(
      'order',
      orders.map((o) => o.id),
    );
    return orders.map((o) => mapOrder(o, { orderIdMap }));
  }

  async countOrders(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildOrderWhere(q);
    const count = await this.prisma.order.count({ where });
    return { count };
  }

  async getOrder(ideasoftId: number) {
    const cuid = await this.idMap.toSadoksanId('order', ideasoftId);
    if (!cuid) throw new NotFoundException('order_not_found');
    const order = await this.prisma.order.findUnique({
      where: { id: cuid },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('order_not_found');
    const orderIdMap = new Map([[order.id, ideasoftId]]);
    return mapOrder(order, { orderIdMap });
  }

  // ─── Order Items ─────────────────────────────────────────────────────────────

  private async buildOrderItemWhere(q: ListQuery): Promise<any> {
    const where: any = {};

    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds('order_item', q.ids);
      where.id = { in: [...map.values()] };
      if (where.id.in.length === 0) where.id = { in: ['__none__'] };
    }

    // order (Ideasoft order id) filtresi
    if (q.raw.order) {
      const orderCuid = await this.idMap.toSadoksanId(
        'order',
        Number(q.raw.order),
      );
      where.orderId = orderCuid ?? '__none__';
    }

    const since = await this.sinceCreatedAt('order_item', q.sinceId);
    if (since) where.createdAt = { gt: since };

    return where;
  }

  async listOrderItems(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildOrderItemWhere(q);

    const lines = await this.prisma.orderLine.findMany({
      where,
      include: { product: true, order: { include: { customer: true } } },
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });

    // Gerekli tüm integer ID'leri toplu çöz
    const itemIdMap = await this.idMap.resolveMany(
      'order_item',
      lines.map((l) => l.id),
    );
    const productIdMap = await this.idMap.resolveMany(
      'product',
      lines.map((l) => l.productId),
    );
    const orderIdMap = await this.idMap.resolveMany(
      'order',
      lines.map((l) => l.orderId),
    );

    return lines.map((l) =>
      mapOrderItem(l, {
        itemIdMap,
        productIdMap,
        order: l.order ? mapOrder(l.order, { orderIdMap }) : undefined,
      }),
    );
  }

  async countOrderItems(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildOrderItemWhere(q);
    const count = await this.prisma.orderLine.count({ where });
    return { count };
  }

  // ─── Members (User + Dealer) ─────────────────────────────────────────────────

  private async buildMemberWhere(q: ListQuery): Promise<any> {
    const where: any = { role: 'DEALER' }; // müşteriler = bayiler
    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds('member', q.ids);
      where.id = { in: [...map.values()].length ? [...map.values()] : ['__none__'] };
    }
    if (q.sinceId) {
      const cuid = await this.idMap.toSadoksanId('member', q.sinceId);
      if (cuid) {
        const u = await this.prisma.user.findUnique({
          where: { id: cuid },
          select: { createdAt: true },
        });
        if (u) where.createdAt = { gt: u.createdAt };
      }
    }
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async listMembers(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildMemberWhere(q);
    const users = await this.prisma.user.findMany({
      where,
      include: { dealer: true },
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });
    const memberIdMap = await this.idMap.resolveMany('member', users.map((u) => u.id));
    // gömülü current_account (member:null ile döngü kırılır)
    const dealerIds = users.filter((u) => u.dealer).map((u) => u.dealer!.id);
    const caIdMap = await this.idMap.resolveMany('current_account', dealerIds);
    return users.map((u) => {
      const ca = u.dealer
        ? mapCurrentAccount(u.dealer, { caIdMap })
        : null;
      return mapMember(u, { memberIdMap, currentAccount: ca });
    });
  }

  async countMembers(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildMemberWhere(q);
    return { count: await this.prisma.user.count({ where }) };
  }

  async getMember(ideasoftId: number) {
    const cuid = await this.idMap.toSadoksanId('member', ideasoftId);
    if (!cuid) throw new NotFoundException('member_not_found');
    const u = await this.prisma.user.findUnique({
      where: { id: cuid },
      include: { dealer: true },
    });
    if (!u) throw new NotFoundException('member_not_found');
    const memberIdMap = new Map([[u.id, ideasoftId]]);
    const caIdMap = u.dealer
      ? await this.idMap.resolveMany('current_account', [u.dealer.id])
      : new Map();
    const ca = u.dealer ? mapCurrentAccount(u.dealer, { caIdMap }) : null;
    return mapMember(u, { memberIdMap, currentAccount: ca });
  }

  // ─── Current Accounts (Dealer) ───────────────────────────────────────────────

  private async buildCurrentAccountWhere(q: ListQuery): Promise<any> {
    const where: any = {};
    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds('current_account', q.ids);
      where.id = { in: [...map.values()].length ? [...map.values()] : ['__none__'] };
    }
    // member (Ideasoft member id) filtresi → Dealer.userId
    if (q.raw.member) {
      const userCuid = await this.idMap.toSadoksanId('member', Number(q.raw.member));
      where.userId = userCuid ?? '__none__';
    }
    if (q.sinceId) {
      const cuid = await this.idMap.toSadoksanId('current_account', q.sinceId);
      if (cuid) {
        const d = await this.prisma.dealer.findUnique({
          where: { id: cuid },
          select: { createdAt: true },
        });
        if (d) where.createdAt = { gt: d.createdAt };
      }
    }
    return where;
  }

  async listCurrentAccounts(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildCurrentAccountWhere(q);
    const dealers = await this.prisma.dealer.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });
    const caIdMap = await this.idMap.resolveMany('current_account', dealers.map((d) => d.id));
    // gömülü member (currentAccount:null ile döngü kırılır)
    const memberIdMap = await this.idMap.resolveMany(
      'member',
      dealers.filter((d) => d.user).map((d) => d.userId),
    );
    return dealers.map((d) => {
      const member = d.user
        ? mapMember({ ...d.user, dealer: d }, { memberIdMap })
        : null;
      return mapCurrentAccount(d, { caIdMap, member });
    });
  }

  async countCurrentAccounts(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildCurrentAccountWhere(q);
    return { count: await this.prisma.dealer.count({ where }) };
  }

  async getCurrentAccount(ideasoftId: number) {
    const cuid = await this.idMap.toSadoksanId('current_account', ideasoftId);
    if (!cuid) throw new NotFoundException('current_account_not_found');
    const d = await this.prisma.dealer.findUnique({
      where: { id: cuid },
      include: { user: true },
    });
    if (!d) throw new NotFoundException('current_account_not_found');
    const caIdMap = new Map([[d.id, ideasoftId]]);
    const memberIdMap = d.user
      ? await this.idMap.resolveMany('member', [d.userId])
      : new Map();
    const member = d.user
      ? mapMember({ ...d.user, dealer: d }, { memberIdMap })
      : null;
    return mapCurrentAccount(d, { caIdMap, member });
  }

  // ─── Products ────────────────────────────────────────────────────────────────

  private async buildProductWhere(q: ListQuery): Promise<any> {
    const where: any = {};
    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds('product', q.ids);
      where.id = { in: [...map.values()].length ? [...map.values()] : ['__none__'] };
    }
    if (q.raw.status !== undefined && q.raw.status !== '') {
      where.visible = String(q.raw.status) === '1';
    }
    if (q.sinceId) {
      const cuid = await this.idMap.toSadoksanId('product', q.sinceId);
      if (cuid) {
        const p = await this.prisma.product.findUnique({
          where: { id: cuid },
          select: { createdAt: true },
        });
        if (p) where.createdAt = { gt: p.createdAt };
      }
    }
    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { sku: { contains: q.search, mode: 'insensitive' } },
        { netsisCode: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  async listProducts(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildProductWhere(q);
    const products = await this.prisma.product.findMany({
      where,
      include: { brandRel: true, variations: { select: { id: true } } },
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });
    const productIdMap = await this.idMap.resolveMany('product', products.map((p) => p.id));
    const brandIdMap = await this.idMap.resolveMany(
      'brand',
      products.filter((p) => p.brandId).map((p) => p.brandId!),
    );
    return products.map((p) => mapProduct(p, { productIdMap, brandIdMap }));
  }

  async countProducts(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildProductWhere(q);
    return { count: await this.prisma.product.count({ where }) };
  }

  async getProduct(ideasoftId: number) {
    const cuid = await this.idMap.toSadoksanId('product', ideasoftId);
    if (!cuid) throw new NotFoundException('product_not_found');
    const p = await this.prisma.product.findUnique({
      where: { id: cuid },
      include: { brandRel: true, variations: { select: { id: true } } },
    });
    if (!p) throw new NotFoundException('product_not_found');
    const productIdMap = new Map([[p.id, ideasoftId]]);
    const brandIdMap = p.brandId
      ? await this.idMap.resolveMany('brand', [p.brandId])
      : new Map();
    return mapProduct(p, { productIdMap, brandIdMap });
  }

  // ─── Product Details (Product.description) ───────────────────────────────────

  private async buildProductDetailWhere(q: ListQuery): Promise<any> {
    const where: any = {};
    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds('product_detail', q.ids);
      where.id = { in: [...map.values()].length ? [...map.values()] : ['__none__'] };
    }
    // product (Ideasoft product id) filtresi
    if (q.raw.product) {
      const pc = await this.idMap.toSadoksanId('product', Number(q.raw.product));
      where.id = pc ?? '__none__';
    }
    return where;
  }

  async listProductDetails(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildProductDetailWhere(q);
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });
    const ids = products.map((p) => p.id);
    const detailIdMap = await this.idMap.resolveMany('product_detail', ids);
    const productIdMap = await this.idMap.resolveMany('product', ids);
    return products.map((p) => mapProductDetail(p, { detailIdMap, productIdMap }));
  }

  async countProductDetails(query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildProductDetailWhere(q);
    return { count: await this.prisma.product.count({ where }) };
  }

  // ─── Order-türevli: Billing/Shipping Address + Shipment ──────────────────────
  // Hepsi Order kaydından türer (sipariş başına 1:1). Entity tipi ID eşlemesini ayırır.

  private async buildOrderDerivedWhere(
    entity: IdeasoftEntity,
    q: ListQuery,
  ): Promise<any> {
    const where: any = {};
    if (q.ids?.length) {
      const map = await this.idMap.toSadoksanIds(entity, q.ids);
      where.id = { in: [...map.values()].length ? [...map.values()] : ['__none__'] };
    }
    // 'order' filtresi (Ideasoft order id) → Order.id
    if (q.raw.order) {
      const oc = await this.idMap.toSadoksanId('order', Number(q.raw.order));
      where.id = oc ?? '__none__';
    }
    if (q.sinceId) {
      const cuid = await this.idMap.toSadoksanId(entity, q.sinceId);
      if (cuid) {
        const o = await this.prisma.order.findUnique({
          where: { id: cuid },
          select: { createdAt: true },
        });
        if (o) where.createdAt = { gt: o.createdAt };
      }
    }
    return where;
  }

  private async orderDerivedList(
    entity: IdeasoftEntity,
    mapperFn: (order: any, ctx: any) => any,
    query: Record<string, any>,
  ) {
    const q = parseListQuery(query);
    const where = await this.buildOrderDerivedWhere(entity, q);
    const orders = await this.prisma.order.findMany({
      where,
      include: { customer: true, dealer: true },
      orderBy: { createdAt: q.sortDir },
      skip: q.skip,
      take: q.limit,
    });
    const ids = orders.map((o) => o.id);
    const idMapForEntity = await this.idMap.resolveMany(entity, ids);
    const orderIdMap = await this.idMap.resolveMany('order', ids);
    return orders.map((o) =>
      mapperFn(o, {
        idMap: idMapForEntity,
        order: mapOrder(o, { orderIdMap }),
      }),
    );
  }

  private async orderDerivedCount(entity: IdeasoftEntity, query: Record<string, any>) {
    const q = parseListQuery(query);
    const where = await this.buildOrderDerivedWhere(entity, q);
    return { count: await this.prisma.order.count({ where }) };
  }

  listBillingAddresses(query: Record<string, any>) {
    return this.orderDerivedList('billing_address', mapBillingAddress, query);
  }
  countBillingAddresses(query: Record<string, any>) {
    return this.orderDerivedCount('billing_address', query);
  }

  listShippingAddresses(query: Record<string, any>) {
    return this.orderDerivedList('shipping_address', mapShippingAddress, query);
  }
  countShippingAddresses(query: Record<string, any>) {
    return this.orderDerivedCount('shipping_address', query);
  }

  listShipments(query: Record<string, any>) {
    return this.orderDerivedList('shipment', mapShipment, query);
  }
  countShipments(query: Record<string, any>) {
    return this.orderDerivedCount('shipment', query);
  }
}
