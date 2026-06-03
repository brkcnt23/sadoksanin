/**
 * CMS / Hero banner unit tests.
 * Run: docker exec sadoksan-api-prod sh -c "cd /app/apps/api && npx jest test/cms.spec.ts --forceExit"
 */

const mockSiteContentFindUnique = jest.fn();
const mockSiteContentUpsert = jest.fn();
const mockSiteSettingsFindUnique = jest.fn();
const mockSiteSettingsUpsert = jest.fn();
const mockSiteSettingsUpdate = jest.fn();

const mockPrisma = {
  siteContent: {
    findUnique: mockSiteContentFindUnique,
    upsert: mockSiteContentUpsert,
  },
  siteSettings: {
    findUnique: mockSiteSettingsFindUnique,
    upsert: mockSiteSettingsUpsert,
    update: mockSiteSettingsUpdate,
  },
};

const { CmsService } = require('../src/modules/cms/cms.service');

describe('CmsService', () => {
  let service: any;

  beforeAll(() => {
    service = new CmsService(mockPrisma);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getHero ────────────────────────────────────────────────────────
  describe('getHero', () => {
    it('returns hero content when it exists', async () => {
      mockSiteContentFindUnique.mockResolvedValue({
        id: 'hero',
        headline: 'Sadöksan İnşaat',
        subheading: '23 yıllık güven',
        ctaText: 'Keşfedin',
        ctaLink: '/urunler',
        imageUrl: '/hero.webp',
        secondaryCtaText: 'Bayi Olun',
        secondaryCtaLink: '/bayilik',
      });

      const result = await service.getHero();

      expect(result.headline).toBe('Sadöksan İnşaat');
      expect(result.ctaText).toBe('Keşfedin');
    });

    it('returns default hero when no content exists', async () => {
      mockSiteContentFindUnique.mockResolvedValue(null);

      const result = await service.getHero();

      expect(result.headline).toBeDefined();
      expect(result.subheading).toBeDefined();
    });
  });

  // ─── updateHero ─────────────────────────────────────────────────────
  describe('updateHero', () => {
    it('updates hero with new content', async () => {
      const dto = {
        headline: 'Yeni Başlık',
        subheading: 'Yeni alt başlık',
        ctaText: 'Tıkla',
        ctaLink: '/urunler',
      };
      mockSiteContentUpsert.mockResolvedValue({ id: 'hero', ...dto });

      const result = await service.updateHero(dto);

      expect(result.headline).toBe('Yeni Başlık');
      expect(mockSiteContentUpsert).toHaveBeenCalled();
    });
  });

  // ─── getSettings ────────────────────────────────────────────────────
  describe('getSettings', () => {
    it('returns site settings', async () => {
      mockSiteSettingsFindUnique.mockResolvedValue({
        id: 'main',
        maintenanceMode: false,
        maintenanceMessage: null,
      });

      const result = await service.getSettings();

      expect(result.maintenanceMode).toBe(false);
    });
  });

  // ─── updateSettings ─────────────────────────────────────────────────
  describe('updateSettings', () => {
    it('updates maintenance mode', async () => {
      mockSiteSettingsUpdate.mockResolvedValue({
        id: 'main',
        maintenanceMode: true,
        maintenanceMessage: 'Bakımdayız',
      });

      const result = await service.updateSettings({
        maintenanceMode: true,
        maintenanceMessage: 'Bakımdayız',
      });

      expect(result.maintenanceMode).toBe(true);
      expect(result.maintenanceMessage).toBe('Bakımdayız');
    });
  });
});
