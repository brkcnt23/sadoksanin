import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('discounts')
@UseGuards(JwtAuthGuard)
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  @Get()
  async listAll() {
    return this.discountsService.listAll();
  }

  @Post()
  async create(@Body() body: {
    type: 'PRODUCT' | 'CATEGORY' | 'BRAND';
    targetId: string;
    targetName: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    value: number;
    validUntil?: string;
  }) {
    return this.discountsService.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: {
    isActive?: boolean;
    value?: number;
    validUntil?: string;
  }) {
    return this.discountsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}
