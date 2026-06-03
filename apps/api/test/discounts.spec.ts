/**
 * Discount unit tests.
 * Run: docker exec sadoksan-api-prod sh -c "cd /app/apps/api && npx jest test/discounts.spec.ts --forceExit"
 */

const mockDiscountFindMany = jest.fn();
const mockDiscountCreate = jest.fn();
const mockDiscountUpdate = jest.fn();
const mockDiscountDelete = jest.fn();
const mockDiscountFindUnique = jest.fn();

const mockPrisma = {
  discount: {
    findMany: mockDiscountFindMany,
    create: mockDiscountCreate,
    update: mockDiscountUpdate,
    delete: mockDiscountDelete,
    findUnique: mockDiscountFindUnique,
  },
  product: { findMany: jest.fn().mockResolvedValue([]) },
};

const { DiscountsService } = require('../src/modules/discounts/discounts.service');

describe('DiscountsService', () => {
  let service: any;

  beforeAll(() => {
    service = new DiscountsService(mockPrisma);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── list ───────────────────────────────────────────────────────────
  describe('list', () => {
    it('returns all active discounts', async () => {
      mockDiscountFindMany.mockResolvedValue([
        { id: 'd-1', type: 'BRAND', targetName: 'AKGÜN', discountType: 'PERCENTAGE', value: 15, isActive: true },
        { id: 'd-2', type: 'CATEGORY', targetName: 'Banyo', discountType: 'FIXED_AMOUNT', value: 500, isActive: true },
      ]);

      const result = await service.list();

      expect(result).toHaveLength(2);
      expect(result[0].targetName).toBe('AKGÜN');
      expect(result[1].value).toBe(500);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────
  describe('create', () => {
    it('creates a percentage discount', async () => {
      mockDiscountCreate.mockResolvedValue({ id: 'd-new', type: 'BRAND', discountType: 'PERCENTAGE', value: 10 });

      const dto = { type: 'BRAND', targetId: 'brand-1', targetName: 'AKGÜN', discountType: 'PERCENTAGE', value: 10 };
      const result = await service.create(dto);

      expect(result.discountType).toBe('PERCENTAGE');
      expect(result.value).toBe(10);
      expect(mockDiscountCreate).toHaveBeenCalledWith({ data: { ...dto, isActive: true } });
    });

    it('creates a fixed amount discount', async () => {
      mockDiscountCreate.mockResolvedValue({ id: 'd-fixed', type: 'CATEGORY', discountType: 'FIXED_AMOUNT', value: 500 });

      const dto = { type: 'CATEGORY', targetId: 'cat-1', targetName: 'Banyo', discountType: 'FIXED_AMOUNT', value: 500 };
      const result = await service.create(dto);

      expect(result.value).toBe(500);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────
  describe('update', () => {
    it('updates discount value', async () => {
      mockDiscountUpdate.mockResolvedValue({ id: 'd-1', value: 20, isActive: true });

      const result = await service.update('d-1', { value: 20 });

      expect(result.value).toBe(20);
    });

    it('deactivates discount', async () => {
      mockDiscountUpdate.mockResolvedValue({ id: 'd-1', isActive: false });

      const result = await service.update('d-1', { isActive: false });

      expect(result.isActive).toBe(false);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────
  describe('remove', () => {
    it('deletes a discount', async () => {
      mockDiscountDelete.mockResolvedValue({ id: 'd-1' });

      await service.remove('d-1');

      expect(mockDiscountDelete).toHaveBeenCalledWith({ where: { id: 'd-1' } });
    });
  });

  // ─── getDiscountedPrice ─────────────────────────────────────────────
  describe('getDiscountedPrice', () => {
    it('applies percentage discount to product price', async () => {
      const product = { id: 'prod-1', basePrice: 320, brandId: 'brand-1', categoryId: 'cat-1' };
      mockDiscountFindMany.mockResolvedValue([
        { type: 'BRAND', targetId: 'brand-1', discountType: 'PERCENTAGE', value: 15, isActive: true },
      ]);

      const result = await service.getDiscountedPrice(product);

      expect(result.price).toBe(272); // 320 * 0.85
      expect(result.discount).toBeDefined();
      expect(result.discount.value).toBe(15);
    });

    it('applies fixed amount discount', async () => {
      const product = { id: 'prod-1', basePrice: 2000, brandId: 'brand-1', categoryId: 'cat-1' };
      mockDiscountFindMany.mockResolvedValue([
        { type: 'PRODUCT', targetId: 'prod-1', discountType: 'FIXED_AMOUNT', value: 500, isActive: true },
      ]);

      const result = await service.getDiscountedPrice(product);

      expect(result.price).toBe(1500);
    });

    it('returns original price when no active discounts', async () => {
      const product = { id: 'prod-1', basePrice: 320, brandId: 'brand-1', categoryId: 'cat-1' };
      mockDiscountFindMany.mockResolvedValue([]);

      const result = await service.getDiscountedPrice(product);

      expect(result.price).toBe(320);
      expect(result.discount).toBeNull();
    });
  });
});
