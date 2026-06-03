import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('logistics')
export class LogisticsController {
  constructor(private logisticsService: LogisticsService) {}

  @Get('calculate')
  @UseGuards(JwtAuthGuard)
  async calculate(
    @Query('city') city: string,
    @Query('items') items?: string,
    @Query('weight') weight?: string,
  ) {
    const itemCount = items ? parseInt(items) : 1;
    const estimatedWeight = weight ? parseFloat(weight) : undefined;
    return this.logisticsService.calculateLogistics(city, itemCount, estimatedWeight);
  }
}
