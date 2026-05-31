import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { StockService } from './stock.service';
import { ManualStockEntryDto, ManualStockExitDto, CountAdjustDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/admin/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  @Get('movements')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getMovements(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.stockService.getMovements(
      productId,
      type,
      startDate,
      endDate,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  @Post('entry')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async manualEntry(@Body() dto: ManualStockEntryDto, @Request() req: any) {
    return this.stockService.manualEntry(dto, req.user.sub);
  }

  @Post('exit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async manualExit(@Body() dto: ManualStockExitDto, @Request() req: any) {
    return this.stockService.manualExit(dto, req.user.sub);
  }

  @Post('count-adjust')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async countAdjust(@Body() dto: CountAdjustDto, @Request() req: any) {
    return this.stockService.countAdjust(dto, req.user.sub);
  }
}
