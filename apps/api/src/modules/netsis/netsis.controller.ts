import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common'
import { NetsisService } from './netsis.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ApiKeyGuard } from '../../common/guards/api-key.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import type { NetsisItemTemelBilgi, NetsisItemPrimInfo, NetsisCariTemelBilgi, NetsisExRate } from './netsis.types'

@Controller('netsis')
export class NetsisController {
  constructor(private readonly netsisService: NetsisService) {}

  // ─── Health ──────────────────────────────────────────────────────────────

  @Get('health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async health() {
    return this.netsisService.healthCheck()
  }

  // ─── Manuel Sync (Pull — sunucudan Netsis'e bağlanır) ────────────────────

  @Post('sync/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncProducts() {
    return this.netsisService.syncProducts()
  }

  @Post('sync/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncStock() {
    return this.netsisService.syncStock()
  }

  @Post('sync/cari')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncCari() {
    return this.netsisService.syncCari()
  }

  @Post('sync/exchange-rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncExchangeRates() {
    return this.netsisService.syncExchangeRates()
  }

  @Post('sync/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async syncAll() {
    return this.netsisService.syncAll()
  }

  // ─── Push (Fabrika PC'den veri kabul eder — API Key auth) ────────────────

  @Post('push/products')
  @UseGuards(ApiKeyGuard)
  async pushProducts(@Body() body: { data: NetsisItemTemelBilgi[] }) {
    return this.netsisService.pushProducts(body.data || [])
  }

  @Post('push/stock')
  @UseGuards(ApiKeyGuard)
  async pushStock(@Body() body: { data: NetsisItemPrimInfo[] }) {
    return this.netsisService.pushStock(body.data || [])
  }

  @Post('push/cari')
  @UseGuards(ApiKeyGuard)
  async pushCari(@Body() body: { data: NetsisCariTemelBilgi[] }) {
    return this.netsisService.pushCari(body.data || [])
  }

  @Post('push/exchange-rates')
  @UseGuards(ApiKeyGuard)
  async pushExchangeRates(@Body() body: { data: NetsisExRate[] }) {
    return this.netsisService.pushExchangeRates(body.data || [])
  }

  // ─── Durum ───────────────────────────────────────────────────────────────

  @Get('status/:syncType')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStatus(@Param('syncType') syncType: string) {
    return this.netsisService.getStatus(syncType)
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllStatus() {
    return this.netsisService.getAllStatus()
  }
}
