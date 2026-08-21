import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async listAll() {
    return this.discountsService.listAll();
  }

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
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
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() body: {
    isActive?: boolean;
    value?: number;
    validUntil?: string;
  }) {
    return this.discountsService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}
