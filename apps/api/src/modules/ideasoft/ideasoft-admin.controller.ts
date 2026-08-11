import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IdeasoftAdminService } from './ideasoft-admin.service';
import { IdeasoftBearerGuard } from './guards/ideasoft-bearer.guard';

/**
 * Ideasoft Admin API taklidi — /admin-api/* endpoint'leri.
 *
 * Tümü Bearer token ister (IdeasoftBearerGuard). Global `api` prefix'inden
 * HARİÇ tutulur (main.ts) çünkü Entegra birebir /admin-api/... bekler.
 *
 * ⚠️ Route sıralaması: /count route'ları /:id'den ÖNCE gelmeli.
 */
@UseGuards(IdeasoftBearerGuard)
@Controller('admin-api')
export class IdeasoftAdminController {
  constructor(private readonly admin: IdeasoftAdminService) {}

  private toId(raw: string): number {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException('invalid_id');
    }
    return n;
  }

  // ─── Orders ────────────────────────────────────────────────────────────────
  @Get('orders')
  listOrders(@Query() q: Record<string, any>) {
    return this.admin.listOrders(q);
  }

  @Get('orders/count')
  countOrders(@Query() q: Record<string, any>) {
    return this.admin.countOrders(q);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.admin.getOrder(this.toId(id));
  }

  // ─── Order Items ───────────────────────────────────────────────────────────
  @Get('order_items')
  listOrderItems(@Query() q: Record<string, any>) {
    return this.admin.listOrderItems(q);
  }

  @Get('order_items/count')
  countOrderItems(@Query() q: Record<string, any>) {
    return this.admin.countOrderItems(q);
  }

  // ─── Members ───────────────────────────────────────────────────────────────
  @Get('members')
  listMembers(@Query() q: Record<string, any>) {
    return this.admin.listMembers(q);
  }

  @Get('members/count')
  countMembers(@Query() q: Record<string, any>) {
    return this.admin.countMembers(q);
  }

  @Get('members/:id')
  getMember(@Param('id') id: string) {
    return this.admin.getMember(this.toId(id));
  }

  // ─── Current Accounts ──────────────────────────────────────────────────────
  @Get('current_accounts')
  listCurrentAccounts(@Query() q: Record<string, any>) {
    return this.admin.listCurrentAccounts(q);
  }

  @Get('current_accounts/count')
  countCurrentAccounts(@Query() q: Record<string, any>) {
    return this.admin.countCurrentAccounts(q);
  }

  @Get('current_accounts/:id')
  getCurrentAccount(@Param('id') id: string) {
    return this.admin.getCurrentAccount(this.toId(id));
  }

  // ─── Products ──────────────────────────────────────────────────────────────
  @Get('products')
  listProducts(@Query() q: Record<string, any>) {
    return this.admin.listProducts(q);
  }

  @Get('products/count')
  countProducts(@Query() q: Record<string, any>) {
    return this.admin.countProducts(q);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.admin.getProduct(this.toId(id));
  }

  // ─── Product Details ───────────────────────────────────────────────────────
  @Get('product_details')
  listProductDetails(@Query() q: Record<string, any>) {
    return this.admin.listProductDetails(q);
  }

  @Get('product_details/count')
  countProductDetails(@Query() q: Record<string, any>) {
    return this.admin.countProductDetails(q);
  }

  // ─── Billing Addresses ─────────────────────────────────────────────────────
  @Get('billing_addresses')
  listBillingAddresses(@Query() q: Record<string, any>) {
    return this.admin.listBillingAddresses(q);
  }

  @Get('billing_addresses/count')
  countBillingAddresses(@Query() q: Record<string, any>) {
    return this.admin.countBillingAddresses(q);
  }

  // ─── Shipping Addresses ────────────────────────────────────────────────────
  @Get('shipping_addresses')
  listShippingAddresses(@Query() q: Record<string, any>) {
    return this.admin.listShippingAddresses(q);
  }

  @Get('shipping_addresses/count')
  countShippingAddresses(@Query() q: Record<string, any>) {
    return this.admin.countShippingAddresses(q);
  }

  // ─── Shipments ─────────────────────────────────────────────────────────────
  @Get('shipments')
  listShipments(@Query() q: Record<string, any>) {
    return this.admin.listShipments(q);
  }

  @Get('shipments/count')
  countShipments(@Query() q: Record<string, any>) {
    return this.admin.countShipments(q);
  }
}
