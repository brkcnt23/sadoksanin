import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFile, Res, BadRequestException,
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

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC ENDPOINTS (no auth)
  // ═══════════════════════════════════════════════════════════════════

  @Get()
  async listProducts(
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.listProducts(
      category, brand, search,
      parseInt(limit || '50'), parseInt(offset || '0'),
    );
  }

  // NOTE: specific named routes MUST come before :productId wildcard

  @Get('categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get('brands')
  async getBrands() {
    return this.productsService.getBrands();
  }

  @Get('featured')
  async getFeatured(@Query('limit') limit?: string) {
    return this.productsService.getFeaturedProducts(parseInt(limit || '12'));
  }

  @Get('stock/:productId/status')
  async getStockStatus(@Param('productId') productId: string) {
    const status = await this.productsService.getStockStatus(productId);
    return { productId, status };
  }

  @Get(':productId')
  async getProduct(@Param('productId') productId: string) {
    return this.productsService.getProduct(productId);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Category CRUD
  // ═══════════════════════════════════════════════════════════════════

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createCategory(@Body() body: { name: string; description?: string; imageUrl?: string; order?: number }) {
    return this.productsService.createCategory(body);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; imageUrl?: string; order?: number },
  ) {
    return this.productsService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteCategory(@Param('id') id: string) {
    await this.productsService.deleteCategory(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Brand CRUD
  // ═══════════════════════════════════════════════════════════════════

  @Post('brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createBrand(@Body() body: { name: string; description?: string; logoUrl?: string }) {
    return this.productsService.createBrand(body);
  }

  @Patch('brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateBrand(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; logoUrl?: string },
  ) {
    return this.productsService.updateBrand(id, body);
  }

  @Delete('brands/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteBrand(@Param('id') id: string) {
    await this.productsService.deleteBrand(id);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: One-time seed categories/brands from existing products
  // ═══════════════════════════════════════════════════════════════════

  @Post('seed-categories-brands')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async seedCategoriesAndBrands() {
    return this.productsService.seedCategoriesAndBrands();
  }

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN: Product management
  // ═══════════════════════════════════════════════════════════════════

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllProducts(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.getAllProducts(
      parseInt(limit || '50'), parseInt(offset || '0'),
    );
  }

  @Post(':productId/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async toggleVisibility(
    @Param('productId') productId: string,
    @Body() body: { visible: boolean },
  ) {
    return this.productsService.toggleVisibility(productId, body.visible);
  }

  @Post(':productId/purchasable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async togglePurchasable(
    @Param('productId') productId: string,
    @Body() body: { purchasable: boolean },
  ) {
    return this.productsService.togglePurchasable(productId, body.purchasable);
  }

  @Post(':productId/featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async toggleFeatured(
    @Param('productId') productId: string,
    @Body() body: { featured: boolean },
  ) {
    return this.productsService.toggleFeatured(productId, body.featured);
  }

  @Post(':productId/stock-thresholds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStockThresholds(
    @Param('productId') productId: string,
    @Body() body: { minimumStock: number; middleStock?: number },
  ) {
    return this.productsService.updateStockThresholds(productId, body.minimumStock, body.middleStock);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productsService.createProduct(dto);
  }

  @Patch(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(productId, dto);
  }

  @Delete(':productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteProduct(@Param('productId') productId: string) {
    await this.productsService.deleteProduct(productId);
    return { success: true };
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async exportProducts(@Res() res: Response) {
    const buffer = await this.productsService.exportProducts();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="urunler.csv"');
    res.send(buffer);
  }

  @Post('admin/bulk-price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async bulkPriceUpdate(@Body() body: {
    target: 'category' | 'brand'; targetValue: string;
    type: 'percentage' | 'fixed'; value: number;
  }) {
    return this.productsService.bulkPriceUpdate(body);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Excel dosyası gerekli');
    return this.productsService.importProducts(file.buffer);
  }

  @Post('admin/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('Sadece JPEG, PNG, WebP, AVIF formatları kabul edilir'), false);
    },
  }))
  async uploadImage(@UploadedFile() image: any) {
    if (!image) throw new BadRequestException('Görsel dosyası gerekli');
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${image.originalname.split('.').pop()}`;
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), '..', '..', 'uploads');
    await fs.mkdir(path.join(uploadDir, 'products'), { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), image.buffer);
    return { url: `/uploads/${filename}` };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Variations
  // ═══════════════════════════════════════════════════════════════════

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
