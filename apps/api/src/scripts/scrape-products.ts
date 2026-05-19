/**
 * Product Scraper for sadoksaninsaat.com.tr
 *
 * Scrapes product data (name, brand, SKU, category) from the ideaSoft-powered
 * site and inserts into the local Product table via Prisma.
 *
 * Usage:
 *   npx ts-node src/scripts/scrape-products.ts
 *   npx ts-node src/scripts/scrape-products.ts --limit 20
 *   npx ts-node src/scripts/scrape-products.ts --category seramik
 *
 * Notes:
 *   - Prices are hidden on the public site → basePrice defaults to 0
 *   - Images are lazy-loaded via JS → imageUrl will be null
 *   - Run from apps/api directory
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE_URL = 'https://www.sadoksaninsaat.com.tr';
const SITEMAP_URLS = [
  `${BASE_URL}/xml/sitemap_product_1.xml`,
  `${BASE_URL}/xml/sitemap_product_2.xml`,
  `${BASE_URL}/xml/sitemap_product_3.xml`,
  `${BASE_URL}/xml/sitemap_product_4.xml`,
];

interface ScrapedProduct {
  name: string;
  brand: string;
  sku: string;
  category: string;
  netsisCode: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Extract numeric product ID from URL like /urun/slug-1234 */
function extractId(url: string): string {
  const m = url.match(/-(\d+)$/);
  return m ? m[1] : '';
}

/** Simple regex-based HTML scraper — avoids external deps */
function scrapeProductHtml(html: string, url: string): ScrapedProduct | null {
  // Product name from <title> or <h1>
  let name = '';
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    name = titleMatch[1]
      .replace(/\s*[-–|]\s*Sadoksan.*$/i, '')
      .replace(/\s*[-–|]\s*Sadöksan.*$/i, '')
      .trim();
  }

  if (!name || name.length < 3) {
    // Try <h1>
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) name = h1Match[1].trim();
  }

  if (!name || name.length < 2) return null;

  // Brand from breadcrumb or marka link
  let brand = '';
  const brandMatch = html.match(/href="\/marka\/([^"]+)"[^>]*>([^<]+)<\/a>/i);
  if (brandMatch) brand = brandMatch[2].trim();

  // SKU — look for "Stok Kodu" pattern in HTML
  let sku = '';
  const skuMatch = html.match(/(?:Stok\s*Kodu|Stok\s*Kodu)\s*:?\s*<\/span>\s*([^<\s]+)/i);
  if (!skuMatch) {
    const skuMatch2 = html.match(/(?:Stok\s*Kodu|Stok\s*Kodu|SKU)[^:]*:?\s*<\/?\w+[^>]*>\s*(\d+)/i);
    if (skuMatch2) sku = skuMatch2[1];
  }
  if (!sku) {
    // Try to find a raw number pattern near "Stok Kodu"
    const skuBlock = html.match(/Stok\s*Kodu[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/i);
    if (skuBlock) sku = skuBlock[1];
  }
  // Fallback: use the URL ID as SKU
  if (!sku) sku = extractId(url);

  // Category from breadcrumb
  let category = '';
  const breadcrumbMatches = html.match(/href="\/kategori\/([^"]+)"[^>]*>([^<]+)<\/a>/gi);
  if (breadcrumbMatches) {
    const cats: string[] = [];
    for (const bc of breadcrumbMatches) {
      const labelMatch = bc.match(/>([^<]+)</);
      if (labelMatch) cats.push(labelMatch[1].trim());
    }
    // Last breadcrumb (deepest category) or join all
    if (cats.length > 0) {
      category = cats[cats.length - 1];
    }
  }
  if (!category) category = 'Genel';

  return {
    name,
    brand: brand || 'Bilinmiyor',
    sku,
    category,
    netsisCode: sku, // Netsis kodunu da aynı SKU olarak kullan
  };
}

// ─── Sitemap Parser ──────────────────────────────────────────────────────────

async function fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const res = await fetch(sitemapUrl);
  const xml = await res.text();
  const urls: string[] = [];
  // Match <loc> tags
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[args.indexOf('--limit') + 1] || '0') || Infinity;
  const categoryFilter = args.includes('--category')
    ? args[args.indexOf('--category') + 1]?.toLowerCase()
    : null;

  console.log('🔍 Fetching product sitemaps...');

  // Get all product URLs from sitemaps
  let allUrls: string[] = [];
  for (const sitemapUrl of SITEMAP_URLS) {
    try {
      const urls = await fetchSitemapUrls(sitemapUrl);
      console.log(`  ${sitemapUrl.split('/').pop()}: ${urls.length} products`);
      allUrls.push(...urls);
    } catch (err: any) {
      console.warn(`  ⚠ Skipping ${sitemapUrl}: ${err.message}`);
    }
  }

  console.log(`\n📦 Total products found: ${allUrls.length}`);
  if (categoryFilter) {
    console.log(`🏷  Category filter: "${categoryFilter}"`);
  }

  // Deduplicate
  allUrls = [...new Set(allUrls)];
  const targetUrls = allUrls.slice(0, limit);

  console.log(`🎯 Will scrape ${targetUrls.length} product pages\n`);

  const products: ScrapedProduct[] = [];
  let success = 0;
  let failed = 0;

  for (let i = 0; i < targetUrls.length; i++) {
    const url = targetUrls[i];
    const progress = `[${i + 1}/${targetUrls.length}]`;

    try {
      await delay(200 + Math.random() * 300); // Polite crawl delay

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`${progress} ⚠ HTTP ${res.status} — ${url}`);
        failed++;
        continue;
      }

      const html = await res.text();
      const product = scrapeProductHtml(html, url);

      if (!product) {
        console.warn(`${progress} ⚠ Could not extract data — ${url}`);
        failed++;
        continue;
      }

      // Filter by category if specified
      if (categoryFilter && !product.category.toLowerCase().includes(categoryFilter)) {
        continue;
      }

      products.push(product);
      success++;
      console.log(`${progress} ✅ ${product.name} | ${product.brand} | ${product.sku} | ${product.category}`);
    } catch (err: any) {
      console.warn(`${progress} ❌ Error: ${err.message}`);
      failed++;
    }

    // Progress checkpoint every 50
    if (success > 0 && success % 50 === 0) {
      console.log(`\n📊 Progress: ${success} scraped, ${failed} failed, ${products.length} collected\n`);
    }
  }

  console.log(`\n📊 Final: ${success} OK, ${failed} failed, ${products.length} to insert\n`);

  // ─── Insert into Database ──────────────────────────────────────────────────
  if (products.length === 0) {
    console.log('No products to insert.');
    await prisma.$disconnect();
    return;
  }

  console.log('💾 Inserting into database...');

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    try {
      const existing = await prisma.product.findUnique({ where: { sku: p.sku } });

      if (existing) {
        await prisma.product.update({
          where: { sku: p.sku },
          data: {
            name: p.name,
            brand: p.brand,
            category: p.category,
            netsisCode: p.netsisCode,
            visible: true,
            purchasable: true,
            syncStatus: 'SYNCED',
            lastNetsisSync: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: p.sku,
            netsisCode: p.netsisCode,
            name: p.name,
            brand: p.brand,
            category: p.category,
            description: '',
            basePrice: 0,
            taxRate: 0.2,
            unit: 'Adet',
            netsisStock: 0,
            reservedStock: 0,
            displayStock: 0,
            visible: true,
            purchasable: true,
            syncStatus: 'SYNCED',
            lastNetsisSync: new Date(),
          },
        });
        inserted++;
      }
    } catch (err: any) {
      console.warn(`  ⚠ DB error for ${p.sku}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
