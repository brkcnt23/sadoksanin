import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
  Body,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  /**
   * Get user's favorite products
   */
  @Get()
  async getFavorites(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.favoritesService.getUserFavorites(
      req.user.id,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  /**
   * Add product to favorites
   */
  @Post(':productId')
  async addFavorite(
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    return this.favoritesService.addFavorite(req.user.id, productId);
  }

  /**
   * Remove product from favorites
   */
  @Delete(':productId')
  async removeFavorite(
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    return this.favoritesService.removeFavorite(req.user.id, productId);
  }

  /**
   * Check if products are in favorites
   */
  @Post('check')
  async checkFavorites(
    @Request() req: any,
    @Body() body: { productIds: string[] },
  ) {
    return this.favoritesService.checkFavorites(req.user.id, body.productIds);
  }

  /**
   * Check single product favorite status
   */
  @Get(':productId')
  async isFavorite(
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    const isFavorite = await this.favoritesService.isFavorite(req.user.id, productId);
    return { productId, isFavorite };
  }
}
