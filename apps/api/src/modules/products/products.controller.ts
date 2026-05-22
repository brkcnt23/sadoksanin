import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  /**
   * Admin: Create a new product
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  /**
   * Admin: Update an existing product
   */
  @Patch(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(productId, dto);
  }

  /**
   * Admin: Delete a product
   */
  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteProduct(@Param('productId') productId: string) {
    await this.productsService.deleteProduct(productId);
    return { success: true };
  }

  /**
   * Admin: Export all products as Excel
   */
  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.productsService.exportProducts();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="urunler.csv"');
    res.send(buffer);
  }

  /**
   * Admin: Bulk price update by category or brand
   */
  @Post('admin/bulk-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async bulkPriceUpdate(@Body() body: {
    target: 'category' | 'brand';
    targetValue: string;
    type: 'percentage' | 'fixed';
    value: number;
  }) {
    return this.productsService.bulkPriceUpdate(body);
  }

  /**
   * Admin: Import products from Excel
   */
  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Excel dosyası gerekli');
    return this.productsService.importProducts(file.buffer);
  }

  // ─── Variations ───────────────────────────────────────────────────────────

  @Get(':productId/variations')
  async getVariations(@Param('productId') productId: string) {
    return this.productsService.getVariations(productId);
  }

  @Post(':productId/variations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createVariation(
    @Param('productId') productId: string,
    @Body() body: { sku: string; label: string; attributes?: any; price?: number; stock?: number },
  ) {
    return this.productsService.createVariation(productId, body);
  }

  @Patch(':productId/variations/:variationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateVariation(
    @Param('variationId') variationId: string,
    @Body() body: { label?: string; attributes?: any; price?: number; stock?: number },
  ) {
    return this.productsService.updateVariation(variationId, body);
  }

  @Delete(':productId/variations/:variationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteVariation(@Param('variationId') variationId: string) {
    await this.productsService.deleteVariation(variationId);
    return { success: true };
  }
}
