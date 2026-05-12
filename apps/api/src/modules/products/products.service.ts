import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { OrdersService } from '../orders/orders.service';

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
}
