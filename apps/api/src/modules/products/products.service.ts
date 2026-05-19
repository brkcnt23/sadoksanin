import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
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

    // Enrich with available stock for each product
    const enriched = await Promise.all(
      products.map(async (product) => ({
        ...product,
        availableStock: await this.ordersService.getAvailableStock(product.id),
      })),
    );

    return { products: enriched, total };
  }

  /**
   * Get single product with details
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

    // Add available stock
    return {
      ...product,
      availableStock: await this.ordersService.getAvailableStock(product.id),
    };
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const categories = await this.prisma.product.findMany({
      where: { visible: true },
      select: { category: true },
      distinct: ['category'],
    });

    return categories.map((c) => c.category).filter(Boolean);
  }

  /**
   * Get all brands
   */
  async getBrands() {
    const brands = await this.prisma.product.findMany({
      where: { visible: true },
      select: { brand: true },
      distinct: ['brand'],
    });

    return brands.map((b) => b.brand).filter(Boolean);
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

    // Enrich with available stock
    const enriched = await Promise.all(
      products.map(async (product) => ({
        ...product,
        availableStock: await this.ordersService.getAvailableStock(product.id),
      })),
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
        basePrice: dto.basePrice,
        taxRate: dto.taxRate ?? 0.2,
        unit: dto.unit || 'Adet',
        netsisStock: dto.netsisStock ?? 0,
        reservedStock: 0,
        displayStock: dto.netsisStock ?? 0,
        minimumStock: dto.minimumStock ?? 0,
        middleStock: dto.middleStock ?? null,
        visible: dto.visible ?? true,
        purchasable: dto.purchasable ?? true,
        syncStatus: 'SYNCED',
        imageUrl: dto.imageUrl ?? null,
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
      'name', 'description', 'brand', 'category', 'basePrice', 'taxRate',
      'unit', 'netsisCode', 'sku', 'netsisStock', 'minimumStock',
      'middleStock', 'visible', 'purchasable', 'imageUrl', 'weight',
    ];

    for (const f of fields) {
      if (dto[f] !== undefined) data[f] = dto[f];
    }

    // Update display stock when netsisStock changes
    if (dto.netsisStock !== undefined) {
      data.displayStock = dto.netsisStock - product.reservedStock;
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

    const headers = ['SKU', 'Ürün Adı', 'Marka', 'Kategori', 'Birim Fiyat', 'KDV Oranı', 'Birim', 'Netsis Stok', 'Min Stok', 'Orta Stok', 'Görünür', 'Satılabilir', 'Açıklama', 'Görsel URL'];
    const csvEscape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const rows = products.map((p) =>
      [p.sku, p.name, p.brand, p.category, p.basePrice, p.taxRate, p.unit, p.netsisStock, p.minimumStock, p.middleStock ?? '', p.visible ? 'Evet' : 'Hayır', p.purchasable ? 'Evet' : 'Hayır', p.description ?? '', p.imageUrl ?? '']
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
              displayStock: data.netsisStock,
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
}
