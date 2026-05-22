import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { PopupService } from './popup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/admin/popups')
@UseGuards(JwtAuthGuard)
export class PopupController {
  constructor(private popupService: PopupService) {}

  @Get()
  async listAll() {
    return this.popupService.listAll();
  }

  @Get('active')
  async getActive(@Req() req: any) {
    return this.popupService.getActive(
      req.user?.sub,
      req.user?.role,
      req.user?.dealerId,
    );
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.popupService.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() body: {
    title: string;
    bodyHtml?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaUrl?: string;
    audience?: 'ALL' | 'B2C' | 'B2B' | 'SPECIFIC_DEALER';
    dealerIds?: string[];
    isActive?: boolean;
    showOnce?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    return this.popupService.create(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.popupService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async remove(@Param('id') id: string) {
    return this.popupService.remove(id);
  }

  @Post(':id/impression')
  async trackImpression(@Param('id') id: string) {
    return this.popupService.trackImpression(id);
  }

  @Post(':id/click')
  async trackClick(@Param('id') id: string) {
    return this.popupService.trackClick(id);
  }
}
