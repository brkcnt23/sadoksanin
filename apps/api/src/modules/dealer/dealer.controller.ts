import {
  Controller,
  Get,
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

@Controller('api/dealer')
@UseGuards(JwtAuthGuard)
export class DealerController {
  private readonly logger = new Logger(DealerController.name);

  constructor(private dealerService: DealerService) {}

  /**
   * GET /api/dealer/list - List all active dealers (admin dropdowns)
   */
  @Get('list')
  async getAllDealers() {
    return await this.dealerService.getAllDealers();
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
  @Get('admin/list')
  async adminListAll() {
    return await this.dealerService.adminListAll();
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
  async approveDealer(@Param('id') dealerId: string, @Request() req) {
    const userId = req.user?.sub || req.user?.id;
    return await this.dealerService.approveDealer(dealerId, userId);
  }

  /**
   * PATCH /api/dealer/:id/reject — Bayi reddet
   */
  @Patch(':id/reject')
  async rejectDealer(
    @Param('id') dealerId: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return await this.dealerService.rejectDealer(dealerId, userId, body.reason);
  }
}
