import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  /**
   * List visible products with filters
   * Public endpoint - no auth required
   */
  @Get()
  async listProducts(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.listProducts(
      category,
      brand,
      search,
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  /**
   * Get product details
   * Public endpoint
   */
  @Get(':productId')
  async getProduct(@Param('productId') productId: string) {
    return this.productsService.getProduct(productId);
  }

  /**
   * Get all categories
   * Public endpoint
   */
  @Get('filters/categories')
  async getCategories() {
    const categories = await this.productsService.getCategories();
    return { categories };
  }

  /**
   * Get all brands
   * Public endpoint
   */
  @Get('filters/brands')
  async getBrands() {
    const brands = await this.productsService.getBrands();
    return { brands };
  }

  /**
   * Get stock status for a product
   * Public endpoint
   */
  @Get('stock/:productId/status')
  async getStockStatus(@Param('productId') productId: string) {
    const status = await this.productsService.getStockStatus(productId);
    return { productId, status };
  }

  /**
   * Admin: Get all products including hidden ones
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllProducts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.getAllProducts(
      parseInt(limit || '50'),
      parseInt(offset || '0'),
    );
  }

  /**
   * Admin: Toggle product visibility
   */
  @Post(':productId/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async toggleVisibility(
    @Param('productId') productId: string,
    @Body() body: { visible: boolean },
  ) {
    return this.productsService.toggleVisibility(productId, body.visible);
  }

  /**
   * Admin: Toggle product purchasability
   */
  @Post(':productId/purchasable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async togglePurchasable(
    @Param('productId') productId: string,
    @Body() body: { purchasable: boolean },
  ) {
    return this.productsService.togglePurchasable(productId, body.purchasable);
  }

  /**
   * Admin: Update stock thresholds
   */
  @Post(':productId/stock-thresholds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStockThresholds(
    @Param('productId') productId: string,
    @Body() body: { minimumStock: number; middleStock?: number },
  ) {
    return this.productsService.updateStockThresholds(
      productId,
      body.minimumStock,
      body.middleStock,
    );
  }
}
