import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
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

  // ─── Pages ─────────────────────────────────────────────────────────────

  @Get('pages')
  async getPages() {
    return this.cmsService.getPages();
  }

  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    return this.cmsService.getPageBySlug(slug);
  }

  @Post('pages')
  @UseGuards(JwtAuthGuard)
  async createPage(@Body() body: any) {
    return this.cmsService.createPage(body);
  }

  @Patch('pages/:id')
  @UseGuards(JwtAuthGuard)
  async updatePage(@Param('id') id: string, @Body() body: any) {
    return this.cmsService.updatePage(id, body);
  }

  @Delete('pages/:id')
  @UseGuards(JwtAuthGuard)
  async deletePage(@Param('id') id: string) {
    return this.cmsService.deletePage(id);
  }

  // ─── SEO Redirects ──────────────────────────────────────────────────────

  @Get('redirects/check')
  async checkRedirect(@Query('url') url: string) {
    const redirect = await this.cmsService.findRedirect(url);
    return redirect || null;
  }

  @Get('redirects')
  async getRedirects() {
    return this.cmsService.getRedirects();
  }

  @Post('redirects')
  @UseGuards(JwtAuthGuard)
  async createRedirect(@Body() body: { oldUrl: string; newUrl: string }) {
    return this.cmsService.createRedirect(body);
  }

  @Delete('redirects/:id')
  @UseGuards(JwtAuthGuard)
  async deleteRedirect(@Param('id') id: string) {
    return this.cmsService.deleteRedirect(id);
  }

  @Post('redirects/import')
  @UseGuards(JwtAuthGuard)
  async importRedirects(@Body() body: { items: { oldUrl: string; newUrl: string }[] }) {
    return this.cmsService.importRedirects(body.items);
  }
}
