import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ─── 1. Plasiyer Bazlı Satış ────────────────────────────────────────────

  @Get('plasiyer-sales')
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async plasiyerSales(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('plasiyerId') plasiyerId?: string,
  ) {
    // Plasiyer sadece kendi verisini görür
    const effectivePlasiyerId = req.user.role === 'PLASIYER' ? req.user.sub : plasiyerId
    return this.reportsService.plasiyerSales({ from, to, plasiyerId: effectivePlasiyerId })
  }

  // ─── 2. Sipariş Durum Pipeline ──────────────────────────────────────────

  @Get('order-pipeline')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async orderPipeline(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.orderPipeline({ from, to })
  }

  // ─── 3. Bayi Risk Skoru ─────────────────────────────────────────────────

  @Get('dealer-risk')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async dealerRisk(@Query('dealerId') dealerId?: string) {
    return this.reportsService.dealerRisk({ dealerId })
  }

  // ─── 4. Kritik Stok ─────────────────────────────────────────────────────

  @Get('critical-stock')
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async criticalStock() {
    return this.reportsService.criticalStock()
  }

  // ─── 5. Hareketsiz Stok ─────────────────────────────────────────────────

  @Get('slow-moving-stock')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async slowMovingStock(@Query('days') days?: string) {
    return this.reportsService.slowMovingStock({ from: days })
  }

  // ─── 6. Kredi Limiti Kullanım ───────────────────────────────────────────

  @Get('credit-usage')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async creditUsage() {
    return this.reportsService.creditUsage()
  }

  // ─── 7. Plasiyer Performans Dashboard ───────────────────────────────────

  @Get('plasiyer-dashboard')
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async plasiyerDashboard(
    @Request() req,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters = { from, to }
    // Plasiyer sadece kendi dashboard'unu görür
    if (req.user.role === 'PLASIYER') {
      ;(filters as any).plasiyerId = req.user.sub
    }
    return this.reportsService.plasiyerDashboard(filters)
  }

  // ─── 8. Plasiyer Yönetimi ───────────────────────────────────────────────

  @Get('plasiyers')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getPlasiyers() {
    return this.reportsService.getPlasiyers()
  }
}
