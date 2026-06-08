import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  Query,
  Param,
  Logger,
  Request,
  Patch,
  Delete,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ProformaService } from './proforma.service';
import { GenerateProformaDto, CreateProformaDraftDto } from './dto/generate-proforma.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proforma')
@UseGuards(JwtAuthGuard)
export class ProformaController {
  private readonly logger = new Logger(ProformaController.name);

  constructor(private proformaService: ProformaService) {}

  /**
   * POST /api/proforma/create - Save as draft (no PDF generation)
   */
  @Post('create')
  async createProformaDraft(
    @Body() dto: CreateProformaDraftDto,
    @Request() req,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.log(`Admin ${userId} creating draft proforma`);

      return await this.proformaService.createProformaDraft(dto, userId);
    } catch (error) {
      this.logger.error(`Failed to create proforma draft: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /api/proforma/generate - Generate PDF and save
   */
  @Post('generate')
  async generateProforma(
    @Body() dto: GenerateProformaDto,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.log(`Admin ${userId} generating ${dto.templateType} proforma`);

      const { pdfBuffer, proforma } = await this.proformaService.generateProforma(dto, userId);

      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${proforma.proformaNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate proforma: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /api/proforma/history - Get all proformas (admin view)
   */
  @Get('history')
  async getProformaHistory(
    @Request() req,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit: number | string = 20,
  ) {
    const userId = req.user?.sub || req.user?.id;
    this.logger.debug(`Fetching proforma history for admin ${userId}`);

    return await this.proformaService.getProformaHistory(userId, {
      status: status as any,
      search,
      limit: parseInt(limit as any, 10) || 20,
    });
  }

  /**
   * GET /api/proforma/dealer - Get proformas for dealer
   */
  @Get('dealer')
  async getDealerProformas(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    this.logger.debug(`Fetching proformas for dealer user ${userId}`);

    return await this.proformaService.getDealerProformas(userId);
  }

  /**
   * GET /api/proforma/products/search?q=<term>&limit=<n>
   * Autocomplete endpoint for the proforma item picker. Searches visible
   * products by SKU / name / brand / netsisCode (case-insensitive).
   */
  @Get('products/search')
  async searchProducts(
    @Query('q') q?: string,
    @Query('limit') limit: number | string = 10,
  ) {
    const parsedLimit = parseInt(limit as any, 10) || 10;
    return await this.proformaService.searchProducts(q ?? '', parsedLimit);
  }

  /**
   * GET /api/proforma/product-image/:sku
   * Auto-fallback lookup for proforma form — returns product's image URL
   * (or null if product has no image yet). Used to pre-fill image field
   * when admin enters a SKU. Manual uploads override this value client-side.
   */
  @Get('product-image/:sku')
  async getProductImage(@Param('sku') sku: string) {
    if (!sku?.trim()) {
      throw new BadRequestException('SKU is required');
    }

    const product = await this.proformaService.getProductImage(sku.trim());

    if (!product) {
      throw new NotFoundException(`Product with SKU "${sku}" not found`);
    }

    return product;
  }

  /**
   * GET /api/proforma/:id - Get single proforma details
   */
  @Get(':id')
  async getProforma(@Param('id') proformaId: string) {
    try {
      const proforma = await this.proformaService.getProforma(proformaId);

      if (!proforma) {
        throw new NotFoundException('Proforma not found');
      }

      return proforma;
    } catch (error) {
      this.logger.error(`Failed to get proforma ${proformaId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * PATCH /api/proforma/:id/send - Mark proforma as sent
   */
  @Patch(':id/send')
  async sendProforma(
    @Param('id') proformaId: string,
    @Request() req,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.log(`Admin ${userId} marking proforma ${proformaId} as sent`);

      return await this.proformaService.sendProforma(proformaId, userId);
    } catch (error) {
      this.logger.error(`Failed to send proforma: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /api/proforma/:id/download - Download proforma as PDF (role-checked)
   */
  @Get(':id/download')
  async downloadProforma(
    @Param('id') proformaId: string,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id;
      const userRole = req.user?.role;
      const { pdfBuffer, proforma } = await this.proformaService.downloadProformaChecked(
        proformaId, userId, userRole,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${proforma.proformaNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error(`Failed to download proforma: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new NotFoundException('Proforma not found or PDF unavailable');
    }
  }

  // ─── Approval Workflow Endpoints ────────────────────────────────────────

  /**
   * POST /api/proforma/:id/submit — Plasiyer onaya gönderir
   */
  @Patch(':id/submit')
  async submitForApproval(@Param('id') proformaId: string, @Request() req) {
    const userId = req.user?.sub || req.user?.id
    const userRole = req.user?.role
    this.logger.log(`User ${userId} (${userRole}) submitting proforma ${proformaId} for approval`)
    return this.proformaService.submitForApproval(proformaId, userId, userRole)
  }

  /**
   * PATCH /api/proforma/:id/approve — Admin onaylar
   */
  @Patch(':id/approve')
  async approveProforma(@Param('id') proformaId: string, @Request() req) {
    const userId = req.user?.sub || req.user?.id
    this.logger.log(`Admin ${userId} approving proforma ${proformaId}`)
    return this.proformaService.approveProforma(proformaId, userId)
  }

  /**
   * PATCH /api/proforma/:id/reject — Admin reddeder
   */
  @Patch(':id/reject')
  async rejectProforma(
    @Param('id') proformaId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?.id
    this.logger.log(`Admin ${userId} rejecting proforma ${proformaId}: ${reason}`)
    return this.proformaService.rejectProforma(proformaId, userId, reason)
  }

  /**
   * GET /api/proforma/pending — Admin: onay bekleyenler
   */
  @Get('pending')
  async getPendingProformas(@Query('search') search?: string, @Query('limit') limit?: string) {
    return this.proformaService.getPendingProformas(search, limit ? parseInt(limit) : 50)
  }

  /**
   * GET /api/proforma/my — Plasiyer: kendi proformaları
   */
  @Get('my')
  async getMyProformas(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user?.sub || req.user?.id
    return this.proformaService.getMyProformas(userId, status, limit ? parseInt(limit) : 50)
  }

  /**
   * GET /api/proforma/:id/download-checked — Rol bazlı indirme kontrolü
   */
  @Get(':id/download-checked')
  async downloadProformaChecked(
    @Param('id') proformaId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id
      const userRole = req.user?.role
      const { pdfBuffer, proforma } = await this.proformaService.downloadProformaChecked(
        proformaId, userId, userRole,
      )
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${proforma.proformaNumber}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      this.logger.error(`Failed to download proforma: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  /**
   * DELETE /api/proforma/:id - Delete proforma
   */
  @Delete(':id')
  async deleteProforma(
    @Param('id') proformaId: string,
    @Request() req,
  ) {
    try {
      const userId = req.user?.sub || req.user?.id;
      this.logger.log(`Admin ${userId} deleting proforma ${proformaId}`);

      await this.proformaService.deleteProforma(proformaId);

      return { success: true, message: 'Proforma deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete proforma: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }
}
