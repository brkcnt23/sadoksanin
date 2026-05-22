-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL DEFAULT 'hero',
    "headline" TEXT NOT NULL DEFAULT 'Premium işçilik, profesyonel tedarik.',
    "subheading" TEXT NOT NULL DEFAULT '23 yıllık tecrübemizle, 4000+ ürün ve 50+ markayı Türkiye genelinde 300+ bayiye ulaştırıyoruz.',
    "imageUrl" TEXT,
    "ctaText" TEXT NOT NULL DEFAULT 'Ürünleri Keşfedin',
    "ctaLink" TEXT NOT NULL DEFAULT '/urunler',
    "secondaryCtaText" TEXT DEFAULT 'Bayi Olun',
    "secondaryCtaLink" TEXT DEFAULT '/bayilik',
    "stats" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);
