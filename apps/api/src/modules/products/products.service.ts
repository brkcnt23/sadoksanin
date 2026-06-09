import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { DiscountsService } from '../discounts/discounts.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private discountsService: DiscountsService,
  ) {}

  /**
   * Get all products with filters
   * - Only visible products
   * - Filter by category, brand, search
   * - Include available stock calculation
   */
  async listProducts(
    category?: string,
    brand?: string,
    search?: string,
    limit = 50,
    offset = 0,
  ) {
    const where: any = {
      visible: true, // Only show visible products
    };

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = brand;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          variations: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where }),
    ]);

    // Enrich with available stock and discount for each product
    const enriched = await Promise.all(
      products.map(async (product) => {
        const discounted = await this.discountsService.getDiscountedPrice(product);
        return {
          ...product,
          availableStock: await this.ordersService.getAvailableStock(product.id),
          discountedPrice: discounted.price,
          discount: discounted.discount,
        };
      }),
    );

    return { products: enriched, total };
  }

  /**
   * Get single product with details and discount
   */
  async getProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variations: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const discounted = await this.discountsService.getDiscountedPrice(product);

    return {
      ...product,
      availableStock: await this.ordersService.getAvailableStock(product.id),
      discountedPrice: discounted.price,
      discount: discounted.discount,
    };
  }

  /**
   * Seed categories and brands from existing product strings (one-time migration)
   */
  async seedCategoriesAndBrands() {
    // Extract unique categories from products
    const catRows = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    const categories = catRows.map((c) => c.category).filter(Boolean);
    for (const name of categories) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await this.prisma.category.upsert({
        where: { name },
        update: {},
        create: { name, slug },
      });
    }

    // Extract unique brands, skip brands named "Genel" or empty
    const brandRows = await this.prisma.product.findMany({
      select: { brand: true },
      distinct: ['brand'],
    });
    const brands = brandRows.map((b) => b.brand).filter(Boolean);
    for (const name of brands) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await this.prisma.brand.upsert({
        where: { name },
        update: {},
        create: { name, slug },
      });
    }

    // Link products to their category/brand via ID
    const allCategories = await this.prisma.category.findMany();
    const allBrands = await this.prisma.brand.findMany();

    for (const cat of allCategories) {
      await this.prisma.product.updateMany({
        where: { category: cat.name },
        data: { categoryId: cat.id },
      });
    }
    for (const brand of allBrands) {
      await this.prisma.product.updateMany({
        where: { brand: brand.name },
        data: { brandId: brand.id },
      });
    }

    return { categories: allCategories.length, brands: allBrands.length };
  }

  /**
   * Get all categories from the Category model
   */
  async getCategories() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { products: true } },
        children: {
          orderBy: { order: 'asc' },
          include: { _count: { select: { products: true } } },
        },
      },
    });
  }

  /**
   * Get all brands from the Brand model
   */
  async getBrands() {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  // ─── Category CRUD ────────────────────────────────────────────────────

  async createCategory(dto: { name: string; description?: string; imageUrl?: string; order?: number }) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.category.create({ data: { ...dto, slug } });
  }

  async updateCategory(id: string, dto: { name?: string; description?: string; imageUrl?: string; order?: number }) {
    const data: any = { ...dto };
    if (dto.name) data.slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Sync denormalized category name on products
    if (dto.name) {
      const cat = await this.prisma.category.findUnique({ where: { id } });
      if (cat) {
        await this.prisma.product.updateMany({ where: { categoryId: id }, data: { category: dto.name } });
      }
    }
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    // Unlink products first
    await this.prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    return this.prisma.category.delete({ where: { id } });
  }

  // ─── Brand CRUD ──────────────────────────────────────────────────────

  async createBrand(dto: { name: string; description?: string; logoUrl?: string }) {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.brand.create({ data: { ...dto, slug } });
  }

  async updateBrand(id: string, dto: { name?: string; description?: string; logoUrl?: string }) {
    const data: any = { ...dto };
    if (dto.name) data.slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (dto.name) {
      const brand = await this.prisma.brand.findUnique({ where: { id } });
      if (brand) {
        await this.prisma.product.updateMany({ where: { brandId: id }, data: { brand: dto.name } });
      }
    }
    return this.prisma.brand.update({ where: { id }, data });
  }

  async deleteBrand(id: string) {
    await this.prisma.product.updateMany({ where: { brandId: id }, data: { brandId: null } });
    return this.prisma.brand.delete({ where: { id } });
  }

  /**
   * Get stock status (for color-coding in UI)
   * Returns: "in_stock" | "low" | "out_of_stock"
   */
  async getStockStatus(productId: string): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const available = await this.ordersService.getAvailableStock(productId);

    if (available === 0) {
      return 'out_of_stock';
    }

    // If minimumStock is set and available <= minimumStock, it's low
    if (product.minimumStock && available <= product.minimumStock) {
      return 'low';
    }

    return 'in_stock';
  }

  /**
   * Admin: Get all products including hidden ones
   */
  async getAllProducts(limit = 50, offset = 0) {
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        include: { variations: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count(),
    ]);

    // Enrich with available stock and discount
    const enriched = await Promise.all(
      products.map(async (product) => {
        const discounted = await this.discountsService.getDiscountedPrice(product);
        return {
          ...product,
          availableStock: await this.ordersService.getAvailableStock(product.id),
          discountedPrice: discounted.price,
          discount: discounted.discount,
        };
      }),
    );

    return { products: enriched, total };
  }

  /**
   * Admin: Toggle product visibility
   */
  async toggleVisibility(productId: string, visible: boolean) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { visible },
    });

    this.logger.log(`Product ${productId} visibility set to ${visible}`);
    return product;
  }

  /**
   * Admin: Toggle product purchasability
   */
  async togglePurchasable(productId: string, purchasable: boolean) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { purchasable },
    });

    this.logger.log(`Product ${productId} purchasability set to ${purchasable}`);
    return product;
  }

  /**
   * Public: Get featured products for homepage
   */
  async getFeaturedProducts(limit = 12) {
    return this.prisma.product.findMany({
      where: { isFeatured: true, isVisible: true },
      include: { variations: true },
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Admin: Toggle product featured status
   */
  async toggleFeatured(productId: string, featured: boolean) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { isFeatured: featured },
    });

    this.logger.log(`Product ${productId} featured set to ${featured}`);
    return product;
  }

  /**
   * Admin: Update stock thresholds
   */
  async updateStockThresholds(
    productId: string,
    minimumStock: number,
    middleStock?: number,
  ) {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        minimumStock,
        middleStock: middleStock || null,
      },
    });

    this.logger.log(`Product ${productId} stock thresholds updated`);
    return product;
  }

  /**
   * Admin: Create a new product
   */
  async createProduct(dto: CreateProductDto) {
    // Check SKU uniqueness
    const existing = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existing) {
      throw new BadRequestException(`SKU "${dto.sku}" zaten kullanımda`);
    }

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        netsisCode: dto.netsisCode || dto.sku,
        name: dto.name,
        description: dto.description || '',
        brand: dto.brand || '',
        category: dto.category,
        categoryId: dto.categoryId || null,
        basePrice: dto.basePrice,
        taxRate: dto.taxRate ?? 0.2,
        unit: dto.unit || 'Adet',
        netsisStock: dto.netsisStock ?? 0,
        netsisPendingQuantity: dto.netsisPendingQuantity ?? 0,
        reservedStock: 0,
        displayStock: (dto.netsisStock ?? 0) - (dto.netsisPendingQuantity ?? 0),
        minimumStock: dto.minimumStock ?? 0,
        middleStock: dto.middleStock ?? null,
        visible: dto.visible ?? true,
        purchasable: dto.purchasable ?? true,
        syncStatus: 'SYNCED',
        imageUrl: dto.imageUrl ?? null,
        images: dto.images ?? null,
        weight: dto.weight ?? null,
      },
    });

    this.logger.log(`Product created: ${product.sku}`);
    return product;
  }

  /**
   * Admin: Update a product
   */
  async updateProduct(productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // If SKU is being changed, check uniqueness
    if (dto.sku && dto.sku !== product.sku) {
      const dupe = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
      if (dupe) throw new BadRequestException(`SKU "${dto.sku}" zaten kullanımda`);
    }

    const data: any = {};
    const fields: (keyof UpdateProductDto)[] = [
      'name', 'description', 'brand', 'category', 'categoryId', 'basePrice', 'taxRate',
      'unit', 'netsisCode', 'sku', 'netsisStock', 'netsisPendingQuantity', 'minimumStock',
      'middleStock', 'visible', 'purchasable', 'isFeatured', 'imageUrl', 'images', 'weight',
    ];

    for (const f of fields) {
      if (dto[f] !== undefined) data[f] = dto[f];
    }

    // Recalc display stock when netsisStock or netsisPendingQuantity changes
    if (dto.netsisStock !== undefined || dto.netsisPendingQuantity !== undefined) {
      const netsisStock = dto.netsisStock !== undefined ? dto.netsisStock : product.netsisStock;
      const netsisPending = dto.netsisPendingQuantity !== undefined ? dto.netsisPendingQuantity : product.netsisPendingQuantity;
      data.displayStock = netsisStock - netsisPending - product.reservedStock;
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data,
    });

    this.logger.log(`Product ${productId} updated`);
    return updated;
  }

  /**
   * Admin: Delete a product
   */
  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    await this.prisma.product.delete({ where: { id: productId } });
    this.logger.log(`Product ${productId} deleted`);
  }

  /**
   * Admin: Export all products as CSV (Excel-compatible, UTF-8 BOM)
   */
  async exportProducts(): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      orderBy: { category: 'asc' },
    });

    const headers = ['SKU', 'Ürün Adı', 'Marka', 'Kategori', 'Birim Fiyat', 'KDV Oranı', 'Birim', 'Netsis Stok', 'Netsis Bekleyen', 'Min Stok', 'Orta Stok', 'Görünür', 'Satılabilir', 'Açıklama', 'Görsel URL'];
    const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const rows = products.map((p) =>
      [p.sku, p.name, p.brand, p.category, p.basePrice, p.taxRate, p.unit, p.netsisStock, p.netsisPendingQuantity, p.minimumStock, p.middleStock ?? '', p.visible ? 'Evet' : 'Hayır', p.purchasable ? 'Evet' : 'Hayır', p.description ?? '', p.imageUrl ?? '']
        .map(csvEscape).join(','),
    );

    const csv = '﻿' + headers.map(csvEscape).join(',') + '\n' + rows.join('\n');
    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Admin: Import products from CSV buffer (Excel-compatible)
   */
  async importProducts(buffer: Buffer): Promise<{ created: number; updated: number; errors: string[] }> {
    const text = buffer.toString('utf-8').replace(/^﻿/, '');
    const lines = text.split('\n').filter((l) => l.trim());

    if (lines.length < 2) {
      return { created: 0, updated: 0, errors: ['CSV dosyası boş veya sadece başlık satırı var'] };
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
    const colIdx = (name: string) => header.findIndex((h) => h === name);

    const result = { created: 0, updated: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const val = (name: string) => colIdx(name) >= 0 ? cols[colIdx(name)] : '';

      const sku = val('SKU');
      if (!sku) {
        result.errors.push(`Satır ${i + 1}: SKU eksik`);
        continue;
      }

      try {
        const data = {
          name: val('Ürün Adı'),
          brand: val('Marka'),
          category: val('Kategori') || 'Genel',
          basePrice: parseFloat(val('Birim Fiyat')) || 0,
          taxRate: parseFloat(val('KDV Oranı')) || 0.2,
          unit: val('Birim') || 'Adet',
          netsisStock: parseInt(val('Netsis Stok')) || 0,
          netsisPendingQuantity: parseInt(val('Netsis Bekleyen')) || 0,
          description: val('Açıklama'),
          imageUrl: val('Görsel URL'),
        };

        const existing = await this.prisma.product.findUnique({ where: { sku } });

        if (existing) {
          await this.prisma.product.update({ where: { sku }, data });
          result.updated++;
        } else {
          await this.prisma.product.create({
            data: {
              sku,
              netsisCode: sku,
              ...data,
              reservedStock: 0,
              displayStock: (data.netsisStock || 0) - (data.netsisPendingQuantity || 0),
              minimumStock: 0,
              visible: true,
              purchasable: true,
              syncStatus: 'SYNCED',
            },
          });
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Satır ${i + 1} (${sku}): ${err.message}`);
      }
    }

    this.logger.log(`Import done: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
    return result;
  }

  // ─── Variations ─────────────────────────────────────────────────────────────

  async getVariations(productId: string) {
    return this.prisma.productVariation.findMany({ where: { productId } });
  }

  async createVariation(productId: string, body: { sku: string; label: string; attributes?: any; price?: number; stock?: number }) {
    return this.prisma.productVariation.create({
      data: {
        productId,
        sku: body.sku,
        label: body.label,
        attributes: body.attributes ? JSON.stringify(body.attributes) : '{}',
        price: body.price ?? null,
        stock: body.stock ?? 0,
      },
    });
  }

  async updateVariation(variationId: string, body: { label?: string; attributes?: any; price?: number; stock?: number }) {
    const data: any = {};
    if (body.label !== undefined) data.label = body.label;
    if (body.attributes !== undefined) data.attributes = JSON.stringify(body.attributes);
    if (body.price !== undefined) data.price = body.price;
    if (body.stock !== undefined) data.stock = body.stock;

    return this.prisma.productVariation.update({ where: { id: variationId }, data });
  }

  async deleteVariation(variationId: string) {
    return this.prisma.productVariation.delete({ where: { id: variationId } });
  }

  /**
   * Bulk price update — by category or brand, percentage or fixed amount
   */
  async bulkPriceUpdate(dto: {
    target: 'category' | 'brand';
    targetValue: string;
    type: 'percentage' | 'fixed';
    value: number; // percentage (e.g. 15 = +15%) or fixed amount in TL
  }) {
    const where: any = {};
    if (dto.target === 'category') where.category = dto.targetValue;
    else where.brand = dto.targetValue;

    const products = await this.prisma.product.findMany({ where, select: { id: true, basePrice: true, name: true } });
    if (products.length === 0) return { updated: 0 };

    for (const p of products) {
      let newPrice: number;
      if (dto.type === 'percentage') {
        newPrice = Math.round(p.basePrice * (1 + dto.value / 100) * 100) / 100;
      } else {
        newPrice = Math.max(0, p.basePrice + dto.value);
      }
      await this.prisma.product.update({
        where: { id: p.id },
        data: { basePrice: newPrice },
      });
    }

    this.logger.log(`Bulk price update: ${dto.target}=${dto.targetValue}, ${dto.type}=${dto.value} → ${products.length} products`);
    return { updated: products.length };
  }
}
