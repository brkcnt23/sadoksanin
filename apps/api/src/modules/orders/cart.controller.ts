import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    return this.cartService.getCart(req.user.sub);
  }

  @Post('add')
  async addItem(
    @Request() req,
    @Body() body: { productId: string; quantity?: number },
  ) {
    return this.cartService.addItem(req.user.sub, body.productId, body.quantity ?? 1);
  }

  @Patch(':productId')
  async updateQuantity(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(req.user.sub, productId, body.quantity);
  }

  @Delete(':productId')
  async removeItem(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    await this.cartService.removeItem(req.user.sub, productId);
    return { success: true };
  }

  @Delete()
  async clearCart(@Request() req) {
    await this.cartService.clearCart(req.user.sub);
    return { success: true };
  }

  @Post('merge')
  async mergeCart(
    @Request() req,
    @Body() body: { items: { productId: string; quantity: number }[] },
  ) {
    return this.cartService.mergeCart(req.user.sub, body.items || []);
  }
}
