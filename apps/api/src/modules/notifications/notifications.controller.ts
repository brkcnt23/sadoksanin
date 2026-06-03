import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listAll(
    @Query('status') status?: string,
    @Query('productId') productId?: string,
  ) {
    return this.notificationsService.listAll({ status, productId });
  }

  @Post()
  async create(@Req() req: any, @Body() body: { productId: string; channel?: 'email' | 'whatsapp' }) {
    return this.notificationsService.create(req.user.sub, body.productId, body.channel);
  }

  @Post('send/:productId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async sendForProduct(@Param('productId') productId: string) {
    return this.notificationsService.sendForProduct(productId);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return this.notificationsService.cancel(id);
  }
}
