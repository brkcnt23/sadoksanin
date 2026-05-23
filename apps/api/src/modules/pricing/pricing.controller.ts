import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/admin/pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get('regional')
  async listRegional() {
    return this.pricingService.listRegional();
  }

  @Post('regional')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async upsertRegional(@Body() body: any) {
    return this.pricingService.upsertRegional(body);
  }

  @Delete('regional/:regionKey')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteRegional(@Param('regionKey') regionKey: string) {
    return this.pricingService.deleteRegional(regionKey);
  }

  @Get('province')
  async listProvince() {
    return this.pricingService.listProvince();
  }

  @Post('province')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async upsertProvince(@Body() body: any) {
    return this.pricingService.upsertProvince(body);
  }

  @Delete('province/:province')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteProvince(@Param('province') province: string) {
    return this.pricingService.deleteProvince(province);
  }

  @Get('logistics')
  async listLogistics() {
    return this.pricingService.listLogisticsRules();
  }

  @Post('logistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async upsertLogistics(@Body() body: any) {
    return this.pricingService.upsertLogisticsRule(body);
  }

  @Delete('logistics/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteLogistics(@Param('id') id: string) {
    return this.pricingService.deleteLogisticsRule(id);
  }

  @Post('seed-provinces')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async seedProvinces() {
    return this.pricingService.seedProvinces();
  }
}
