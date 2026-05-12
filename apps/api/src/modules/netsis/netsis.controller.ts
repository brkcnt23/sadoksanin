import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { NetsisService } from './netsis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('netsis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NetsisController {
  constructor(private netsisService: NetsisService) {}

  @Post('sync/products')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncProducts() {
    await this.netsisService.syncProducts();
    return { message: 'Product sync initiated' };
  }

  @Post('sync/stock')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncStock() {
    await this.netsisService.syncStock();
    return { message: 'Stock sync initiated' };
  }

  @Post('sync/cari')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncCari() {
    await this.netsisService.syncCari();
    return { message: 'Cari sync initiated' };
  }

  @Get('status/:syncType')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatus(@Param('syncType') syncType: string) {
    return this.netsisService.getSyncStatus(syncType);
  }
}
