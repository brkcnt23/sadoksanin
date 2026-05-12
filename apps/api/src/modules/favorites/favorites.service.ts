import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class FavoritesService {
  private logger = new Logger(FavoritesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Add a product to user's favorites
   */
  async addFavorite(userId: string, productId: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const favorite = await this.prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      create: {
        userId,
        productId,
      },
      update: {}, // If already exists, just return it
      include: { product: true },
    });

    this.logger.log(`User ${userId} added product ${productId} to favorites`);
    return favorite;
  }

  /**
   * Remove a product from favorites
   */
  async removeFavorite(userId: string, productId: string) {
    const deleted = await this.prisma.favorite.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException(
        `Favorite not found for user ${userId} and product ${productId}`,
      );
    }

    this.logger.log(`User ${userId} removed product ${productId} from favorites`);
    return { deleted: deleted.count };
  }

  /**
   * Get all user's favorites
   */
  async getUserFavorites(userId: string, limit = 50, offset = 0) {
    const [favorites, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where: { userId },
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.favorite.count({ where: { userId } }),
    ]);

    return {
      favorites: favorites.map((f) => f.product),
      total,
    };
  }

  /**
   * Check if a product is in user's favorites
   */
  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return !!favorite;
  }

  /**
   * Get multiple products favorite status
   */
  async checkFavorites(userId: string, productIds: string[]): Promise<Record<string, boolean>> {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId,
        productId: { in: productIds },
      },
      select: { productId: true },
    });

    const favoriteSet = new Set(favorites.map((f) => f.productId));
    const result: Record<string, boolean> = {};

    for (const productId of productIds) {
      result[productId] = favoriteSet.has(productId);
    }

    return result;
  }
}
