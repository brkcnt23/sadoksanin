import {
  Controller,
  Get,
  Post,
  Patch,
  Res,
  UseGuards,
  Param,
  Body,
  Logger,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { DealerService } from './dealer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('dealer')
@UseGuards(JwtAuthGuard)
export class DealerController {
  private readonly logger = new Logger(DealerController.name);

  constructor(private dealerService: DealerService) {}

  /**
   * GET /api/dealer/list - List all active dealers (admin dropdowns)
   */
  @Get('list')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async getAllDealers(@Request() req) {
    // PLASIYER sadece kendi bayilerini görür (teklif/proforma bayi seçici bunu kullanır)
    return await this.dealerService.getAllDealers(req.user);
  }

  /**
   * GET /api/dealer/profile - Get dealer profile info
   */
  @Get('profile')
  async getDealerProfile(@Request() req) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.debug(`Fetching profile for dealer user ${userId}`);

      return await this.dealerService.getDealerProfile(userId);
    } catch (error) {
      this.logger.error(`Failed to get dealer profile: ${error.message}`);
      throw new NotFoundException('Dealer profile not found');
    }
  }

  /**
   * GET /api/dealer/cari/transactions - Get cari account transactions
   */
  @Get('cari/transactions')
  async getCariTransactions(@Request() req) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.debug(`Fetching cari transactions for dealer user ${userId}`);

      return await this.dealerService.getCariTransactions(userId);
    } catch (error) {
      this.logger.error(`Failed to get cari transactions: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /api/dealer/cari/export - Export cari statement as Excel
   */
  @Get('cari/export')
  async exportCariStatement(@Res() res: Response, @Request() req) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.debug(`Exporting cari statement for dealer user ${userId}`);

      const excelBuffer = await this.dealerService.exportCariStatement(userId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="cari-ekstresi.csv"');
      res.send(excelBuffer);
    } catch (error) {
      this.logger.error(`Failed to export cari statement: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /api/dealer/reports/:type - Download report as Excel
   * Supported types: monthly, yearly, invoice, stock
   */
  @Get('reports/:type')
  async downloadReport(
    @Param('type') reportType: string,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id;
      const validTypes = ['monthly', 'yearly', 'invoice', 'stock', 'detailed', 'risk', 'aging', 'performance'];

      if (!validTypes.includes(reportType)) {
        throw new BadRequestException(`Invalid report type. Must be one of: ${validTypes.join(', ')}`);
      }

      this.logger.debug(`Generating ${reportType} report for dealer user ${userId}`);

      const excelBuffer = await this.dealerService.generateReport(userId, reportType);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-rapor.csv"`);
      res.send(excelBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate report: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /api/dealer/admin/list — Tüm bayiler (admin için)
   */
  /**
   * GET /api/dealer/carts - Aktif/terkedilen bayi sepetleri (admin)
   */
  @Get('carts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getDealerCarts() {
    return await this.dealerService.getDealerCarts();
  }

  @Get('admin/list')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async adminListAll(@Request() req) {
    // PLASIYER ise service kendi bayileriyle filtreler
    return await this.dealerService.adminListAll(req.user);
  }

  /**
   * PATCH /api/dealer/:id/plasiyer — Bayiye sorumlu plasiyer ata/kaldır
   * (sadece ADMIN/SUPER_ADMIN)
   */
  @Patch(':id/plasiyer')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async assignSalesRep(
    @Param('id') dealerId: string,
    @Body() body: { plasiyerId: string | null },
  ) {
    return await this.dealerService.assignSalesRep(dealerId, body.plasiyerId ?? null);
  }

  /**
   * GET /api/dealer/risk-score — Bayi risk skoru (JSON)
   */
  @Get('risk-score')
  async getRiskScore(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    return this.dealerService.getRiskScore(userId);
  }

  /**
   * PATCH /api/dealer/:id/approve — Bayi onayla
   */
  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async approveDealer(@Param('id') dealerId: string, @Request() req) {
    const userId = req.user?.sub || req.user?.id;
    return await this.dealerService.approveDealer(dealerId, userId);
  }

  /**
   * PATCH /api/dealer/:id/reject — Bayi reddet
   */
  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async rejectDealer(
    @Param('id') dealerId: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return await this.dealerService.rejectDealer(dealerId, userId, body.reason);
  }

  /**
   * PATCH /api/dealer/:id/password — Bayinin şifresini ata/değiştir.
   *
   * Netsis'ten aktarılan 1446 bayiye import sırasında rastgele şifre verildi
   * ve hiçbir yere kaydedilmedi; SMTP de yok. Bu yüzden bayinin hesabına
   * erişmesinin tek yolu yöneticinin buradan şifre atamasıdır.
   *
   * Body boş bırakılırsa sunucu okunabilir bir şifre üretir ve düz metin
   * olarak DÖNER — yönetici bayiye telefonla iletsin diye. Yanıt loglanmaz.
   */
  @Patch(':id/password')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async setDealerPassword(
    @Param('id') dealerId: string,
    @Body() body: { password?: string },
  ) {
    return await this.dealerService.setDealerPassword(dealerId, body?.password);
  }

  /**
   * PATCH /api/dealer/:id/credit-limit — Kredi limiti güncelle
   */
  @Patch(':id/credit-limit')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateCreditLimit(
    @Param('id') dealerId: string,
    @Body() body: { creditLimit: number },
  ) {
    return await this.dealerService.updateCreditLimit(dealerId, body.creditLimit);
  }

  /**
   * POST /api/dealer/validate-cari — Netsis'te cari kodu doğrula.
   * Panel bu ucu çağırıyordu ama backend'de yoktu; istek hata verince panel
   * sessizce SAHTE (regex tabanlı) doğrulamaya düşüyordu — var olmayan cari
   * "geçerli" görünebiliyordu. Artık gerçek Netsis sorgusu yapılıyor.
   */
  @Post('validate-cari')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'PLASIYER')
  async validateCari(@Body() body: { cariNo?: string }) {
    return await this.dealerService.validateCari(body?.cariNo || '');
  }
}
