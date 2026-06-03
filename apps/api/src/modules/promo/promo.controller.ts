import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PromoService } from './promo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('promo')
export class PromoController {
  constructor(private promoService: PromoService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validate(
    @Body() body: { code: string; orderTotal: number; isDealer?: boolean },
    @Request() req: any,
  ) {
    const isDealer = body.isDealer ?? (req.user?.role === 'DEALER');
    return this.promoService.validatePromoCode(body.code, body.orderTotal, isDealer);
  }
}
