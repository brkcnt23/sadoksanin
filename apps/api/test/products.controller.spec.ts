const mockProductService = {
  listProducts: jest.fn().mockResolvedValue({
    products: [{ id: 'p-1', name: 'Test Seramik', category: 'Seramik', basePrice: 320 }],
    total: 1,
  }),
  getProduct: jest.fn().mockResolvedValue({
    id: 'p-1', name: 'Test Seramik', category: 'Seramik', basePrice: 320,
  }),
  getCategories: jest.fn().mockResolvedValue(['Seramik', 'Vitrifiye']),
  getBrands: jest.fn().mockResolvedValue(['AKGÜN', 'ISVEA']),
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
    it('should return distinct categories', async () => {
      const result = await controller.getCategories();
      expect(result).toEqual({ categories: ['Seramik', 'Vitrifiye'] });
    });
  });

  describe('getBrands', () => {
    it('should return distinct brands', async () => {
      const result = await controller.getBrands();
      expect(result).toEqual({ brands: ['AKGÜN', 'ISVEA'] });
    });
  });
});
