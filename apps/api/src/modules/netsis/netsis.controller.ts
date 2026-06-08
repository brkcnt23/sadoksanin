import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common'
import { NetsisService } from './netsis.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@Controller('netsis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NetsisController {
  constructor(private readonly netsisService: NetsisService) {}

  // ─── Health ──────────────────────────────────────────────────────────────

  @Get('health')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async health() {
    return this.netsisService.healthCheck()
  }

  // ─── Manuel Sync ─────────────────────────────────────────────────────────

  @Post('sync/products')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncProducts() {
    return this.netsisService.syncProducts()
  }

  @Post('sync/stock')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncStock() {
    return this.netsisService.syncStock()
  }

  @Post('sync/cari')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncCari() {
    return this.netsisService.syncCari()
  }

  @Post('sync/exchange-rates')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncExchangeRates() {
    return this.netsisService.syncExchangeRates()
  }

  @Post('sync/all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncAll() {
    return this.netsisService.syncAll()
  }

  // ─── Durum ───────────────────────────────────────────────────────────────

  @Get('status/:syncType')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatus(@Param('syncType') syncType: string) {
    return this.netsisService.getStatus(syncType)
  }

  @Get('status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllStatus() {
    return this.netsisService.getAllStatus()
  }
}
