const mockProductService = {
  listProducts: jest.fn().mockResolvedValue({
    products: [{ id: 'p-1', name: 'Test Seramik', category: 'Seramik', basePrice: 320 }],
    total: 1,
  }),
  getProduct: jest.fn().mockResolvedValue({
    id: 'p-1', name: 'Test Seramik', category: 'Seramik', basePrice: 320,
  }),
  getCategories: jest.fn().mockResolvedValue([
    { id: 'cat-1', name: 'Seramik', slug: 'seramik', _count: { products: 5 } },
    { id: 'cat-2', name: 'Vitrifiye', slug: 'vitrifiye', _count: { products: 3 } },
  ]),
  getBrands: jest.fn().mockResolvedValue([
    { id: 'br-1', name: 'AKGÜN', slug: 'akgun', _count: { products: 2 } },
    { id: 'br-2', name: 'ISVEA', slug: 'isvea', _count: { products: 4 } },
  ]),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  toggleVisibility: jest.fn(),
  togglePurchasable: jest.fn(),
  updateStockThresholds: jest.fn(),
  exportProducts: jest.fn(),
  importProducts: jest.fn(),
};

const { ProductsController } = require('../src/modules/products/products.controller');

describe('ProductsController', () => {
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ProductsController(mockProductService);
  });

  describe('listProducts (public)', () => {
    it('should return visible products with filters', async () => {
      const result = await controller.listProducts(1, 25, 'Seramik');
      expect(result.products).toHaveLength(1);
      expect(result.products[0].category).toBe('Seramik');
    });
  });

  describe('getProduct', () => {
    it('should return a single product', async () => {
      const result = await controller.getProduct('p-1');
      expect(result.id).toBe('p-1');
    });
  });

  describe('getCategories', () => {
    it('should return categories with product counts', async () => {
      const result = await controller.getCategories();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Seramik');
      expect(result[0].slug).toBe('seramik');
      expect(result[0]._count.products).toBe(5);
    });
  });

  describe('getBrands', () => {
    it('should return brands with product counts', async () => {
      const result = await controller.getBrands();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('AKGÜN');
      expect(result[1].name).toBe('ISVEA');
    });
  });
});
