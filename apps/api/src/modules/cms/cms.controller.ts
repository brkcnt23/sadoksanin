import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  // Public: get hero content
  @Get('hero')
  async getHero() {
    return this.cmsService.getHero();
  }

  // Admin: update hero
  @Patch('hero')
  @UseGuards(JwtAuthGuard)
  async updateHero(@Body() body: any) {
    return this.cmsService.updateHero(body);
  }

  // Admin: get settings
  @Get('settings')
  @UseGuards(JwtAuthGuard)
  async getSettings() {
    return this.cmsService.getSettings();
  }

  // Admin: update settings
  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(@Body() body: any) {
    return this.cmsService.updateSettings(body);
  }
}
