import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * Create a new order
   * B2C: immediate approval
   * B2B: pending admin approval
   */
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req: any) {
    return this.ordersService.createOrder(createOrderDto, req.user.sub);
  }

  /**
   * Admin: Get all B2B pending approval orders
   */
  @Get('admin/pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPendingOrders(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.ordersService.getOrders(
      undefined,
      'PENDING_APPROVAL',
      'B2B',
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  /**
   * Get available stock for a product
   */
  @Get('stock/:productId')
  async getAvailableStock(@Param('productId') productId: string) {
    const available = await this.ordersService.getAvailableStock(productId);
    return { productId, available };
  }

  /**
   * Get user's own orders (paginated)
   */
  @Get()
  async getUserOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.ordersService.getOrders(
      req.user.sub,
      status,
      undefined,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  /**
   * Get order status history (timeline)
   */
  @Get(':orderId/history')
  async getOrderHistory(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderHistory(orderId);
  }

  /**
   * Get order details by ID
   */
  @Get(':orderId')
  async getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  /**
   * Admin: Approve a pending B2B order
   */
  @Post(':orderId/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approveOrder(@Param('orderId') orderId: string, @Request() req: any) {
    return this.ordersService.approveOrder(orderId, req.user.sub);
  }

  /**
   * Admin: Reject a pending B2B order
   */
  @Post(':orderId/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.ordersService.rejectOrder(orderId, req.user.sub, body.reason);
  }

  /**
   * Admin: Mark order as shipped (releases stock reservation)
   */
  @Post(':orderId/ship')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async shipOrder(
    @Param('orderId') orderId: string,
    @Body() body?: { trackingNumber?: string; cargoCompany?: string },
  ) {
    return this.ordersService.completeOrder(orderId, body?.trackingNumber, body?.cargoCompany);
  }

  /**
   * Mock payment — accepts card info, always succeeds (no real API call)
   */
  @Post(':orderId/pay')
  async payOrder(
    @Param('orderId') orderId: string,
    @Body() body: { cardNumber?: string; expiry?: string; cvv?: string; cardHolder?: string },
    @Request() req: any,
  ) {
    return this.ordersService.payOrder(orderId, req.user.sub);
  }

  /**
   * Customer: Submit bank transfer receipt
   */
  @Post(':orderId/bank-transfer')
  async submitBankTransfer(
    @Param('orderId') orderId: string,
    @Body() body: { bank: string; amount: number; senderName: string; note?: string },
    @Request() req: any,
  ) {
    return this.ordersService.submitBankTransfer(orderId, body, req.user.sub);
  }

  /**
   * Admin: List pending bank transfers
   */
  @Get('admin/bank-transfers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listBankTransfers(@Query('status') status?: string) {
    return this.ordersService.listBankTransfers(status);
  }

  /**
   * Admin: Approve bank transfer → mark order as paid
   */
  @Post(':orderId/bank-transfer/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approveBankTransfer(@Param('orderId') orderId: string, @Request() req: any) {
    return this.ordersService.approveBankTransfer(orderId, req.user.sub);
  }

  /**
   * Admin: Reject bank transfer
   */
  @Post(':orderId/bank-transfer/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async rejectBankTransfer(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.ordersService.rejectBankTransfer(orderId, body.reason, req.user.sub);
  }

  /**
   * Customer/dealer: Request return on a completed order
   */
  @Post(':orderId/return')
  async requestReturn(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.ordersService.requestReturn(orderId, body.reason, req.user.sub);
  }

  /**
   * Admin: Approve return — refund stock back to inventory
   */
  @Post(':orderId/return/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approveReturn(@Param('orderId') orderId: string, @Request() req: any) {
    return this.ordersService.approveReturn(orderId, req.user.sub);
  }

  /**
   * Admin: Update order status
   */
  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.ordersService.updateStatus(orderId, body.status);
  }

  /**
   * Admin: Add note to order
   */
  @Post(':orderId/notes')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async addNote(
    @Param('orderId') orderId: string,
    @Body() body: { note: string },
    @Request() req: any,
  ) {
    return this.ordersService.addNote(orderId, body.note, req.user.sub, req.user.email);
  }

  /**
   * Admin: Cancel an order
   */
  @Post(':orderId/cancel')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
  ) {
    return this.ordersService.cancelOrder(orderId, body.reason);
  }
}
