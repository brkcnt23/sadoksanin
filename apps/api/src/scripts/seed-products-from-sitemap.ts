/**
 * Fast product seeder — parses sitemap XML for product URLs and extracts
 * names + SKUs from URL patterns. Then scrapes category pages for brand info.
 *
 * Much faster than per-product-page scraping. Good for populating the
 * proforma product picker quickly.
 *
 * Usage (from apps/api directory):
 *   npx ts-node src/scripts/seed-products-from-sitemap.ts
 *   npx ts-node src/scripts/seed-products-from-sitemap.ts --limit 100
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BASE = 'https://www.sadoksaninsaat.com.tr';
const SITEMAPS = [1, 2, 3, 4].map((n) => `${BASE}/xml/sitemap_product_${n}.xml`);
const IMAGE_SITEMAPS = [1, 2, 3, 4].map((n) => `${BASE}/xml/sitemap_image_${n}.xml`);

// Known brand → slug mapping (from brand sitemap / category pages)
// We'll scrape category pages to build this dynamically
const BRAND_SLUGS: Record<string, string> = {
  akgun: 'AKGÜN',
  qua: 'QUA',
  ece: 'ECE',
  fleko: 'FLEKO',
  nsk: 'NSK',
  kalay: 'KALAY',
  soudal: 'Soudal',
  suodal: 'Soudal',
  arkim: 'Arkim',
  nivakim: 'Nivakim',
  rtrmax: 'RTRMAX',
  formica: 'Formica',
  'sadoksan-insaat': 'Sadöksan',
};

// Category slug → display name (from sitemap_category_1.xml)
const CATEGORY_MAP: Record<string, string> = {
  seramik: 'Seramik',
  vitrifiye: 'Vitrifiye',
  'banyo-grubu': 'Banyo Grubu',
  'banyo-aksesuarlari': 'Banyo Aksesuarları',
  'batarya-ve-musluklar': 'Batarya ve Musluklar',
  'silikon-kopuk': 'Silikon & Köpük',
  rtrmax: 'RTRMAX',
  'insort-urunler': 'İnsört Ürünler',
  'alci-alci-plaka': 'Yapı Kimyasalları',
  ebat: 'Seramik',
  '60-120': '60x120 Seramik',
  '40-120': '40x120 Seramik',
  '30-90': '30x90 Seramik',
  '30-60': '30x60 Seramik',
  '61-61': '61x61 Seramik',
  '60-60': '60x60 Seramik',
  '45-45': '45x45 Seramik',
  '20-120': '20x120 Seramik',
  '15-60': '15x60 Seramik',
  'uygulama-destek-urunleri': 'Uygulama Destek',
  klozetler: 'Klozet',
  lavabolar: 'Lavabo',
  'banyo-dolaplari': 'Banyo Dolapları',
  'boy-dolaplari': 'Boy Dolapları',
  kabin: 'Kabin',
  tekne: 'Duş Teknesi',
  'banyo-bataryasi': 'Banyo Bataryası',
  'lavabo-bataryasi': 'Lavabo Bataryası',
  'evye-mutfak-bataryasi': 'Eviye Bataryası',
  'dus-sistemleri': 'Duş Sistemleri',
  musluklar: 'Musluk',
  'hela-taslari': 'Hela Taşı',
  'genel-amacli-silikonlar': 'Silikon',
  mastikler: 'Mastik',
  'kopukler-pu': 'Köpük',
  yapistiricilar: 'Yapıştırıcı',
  'sprey-boyalar': 'Sprey Boya',
  'fayans-yapistirici': 'Fayans Yapıştırıcı',
  'derz-dolgular': 'Derz Dolgu',
  'fayans-yapistiricilar': 'Fayans Yapıştırıcı',
};

interface ProductSeed {
  sku: string;
  netsisCode: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Parse image sitemaps to build product-url → first-image-url lookup */
async function buildImageMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const sitemapUrl of IMAGE_SITEMAPS) {
    try {
      const res = await fetch(sitemapUrl);
      const xml = await res.text();

      // Match <url> blocks that contain both <loc> and <image:image>/<image:loc>
      const urlBlocks = xml.split('<url>').slice(1);
      for (const block of urlBlocks) {
        const productMatch = block.match(/<loc>([^<]+)<\/loc>/);
        const imageMatch = block.match(/<image:loc>([^<]+)<\/image:loc>/);
        if (productMatch && imageMatch) {
          const productUrl = productMatch[1].trim();
          let imageUrl = imageMatch[1].trim();
          // Ensure full URL
          if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
          if (!imageUrl.startsWith('http')) imageUrl = BASE + imageUrl;
          // Only store first image per product
          if (!map.has(productUrl)) {
            map.set(productUrl, imageUrl);
          }
        }
      }
      console.log(`  ${sitemapUrl.split('/').pop()}: ${map.size} images so far`);
    } catch (err: any) {
      console.warn(`  ⚠ Skipping image sitemap ${sitemapUrl}: ${err.message}`);
    }
  }
  return map;
}

function slugToName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bX\b/g, 'x')
    .replace(/\bCm\b/g, 'cm')
    .replace(/\bMm\b/g, 'mm')
    .replace(/\bSg\b/gi, 'SG')
    .replace(/\bPk\b/gi, 'PK')
    .replace(/\bLf\b/gi, 'LF')
    .replace(/\bMt\b/gi, 'MT')
    .replace(/\bKr\b/gi, 'KR')
    .replace(/\bPr\b/gi, 'PR')
    .replace(/\bNp\b/gi, 'NP')
    .replace(/\bPp\b/gi, 'PP')
    .replace(/\bUd\b/gi, 'UD')
    .replace(/\bDl\b/gi, 'DL')
    .replace(/\bTs\b/gi, 'TS')
    .replace(/\bDs\b/gi, 'DS')
    .replace(/\bWc\b/gi, 'WC')
    .trim();
}

async function fetchSitemap(url: string): Promise<string[]> {
  const res = await fetch(url);
  const xml = await res.text();
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim());
  }
  return urls;
}

/** Extract brand from category page HTML */
async function scrapeCategoryPage(categoryUrl: string): Promise<Map<string, string>> {
  // Maps product name → brand
  const result = new Map<string, string>();

  try {
    await delay(300 + Math.random() * 200);
    const res = await fetch(categoryUrl);
    const html = await res.text();

    // Pattern: <a href="/marka/slug">BRAND</a> then <a href="/urun/slug">NAME</a>
    const cards = html.split('checkoutPro\'').join('').split('product-card');
    // Simpler: find all marka links and the following urun link
    const markaRe = /href="\/marka\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    // Won't work perfectly - need structured approach

    // Alternative: extract product JSON if available
    const jsonMatch = html.match(/window\.PRODUCTS\s*=\s*(\[[^\]]+\])/i);
    if (jsonMatch) {
      try {
        const products = JSON.parse(jsonMatch[1]);
        for (const p of products) {
          result.set(p.name?.trim(), p.brand?.trim() || '');
        }
      } catch { /* not JSON */ }
    }

    // Fallback: regex for brand+name pairs in product cards
    if (result.size === 0) {
      // Look for image alt text (product name) associated with brand link
      const blocks = html.split('marka/');
      // Not reliable enough for production use
    }
  } catch (err: any) {
    console.warn(`  ⚠ Could not scrape category ${categoryUrl}: ${err.message}`);
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) || Infinity : Infinity;

  // Build image URL map from image sitemaps first
  console.log('🖼  Building image map from image sitemaps...');
  const imageMap = await buildImageMap();
  console.log(`  Total image mappings: ${imageMap.size}\n`);

  console.log('🔍 Parsing product sitemaps...\n');

  // Parse all sitemaps
  const seen = new Set<string>();
  const products: ProductSeed[] = [];

  for (const sitemapUrl of SITEMAPS) {
    try {
      const urls = await fetchSitemap(sitemapUrl);
      for (const url of urls) {
        if (seen.has(url)) continue;
        seen.add(url);

        // /urun/slug-name-12345
        const path = new URL(url).pathname;
        const parts = path.replace('/urun/', '').split('-');
        const id = parts[parts.length - 1];
        const slug = parts.slice(0, -1).join('-');

        if (!id || !/^\d+$/.test(id)) continue;

        const name = slugToName(slug);
        if (name.length < 3) continue;

        // Look up image from image sitemaps
        const imageUrl = imageMap.get(url) || null;

        products.push({
          sku: id,
          netsisCode: id,
          name,
          brand: 'Bilinmiyor',
          category: 'Genel',
          imageUrl,
        });
      }
      console.log(`  ${sitemapUrl.split('/').pop()}: ${urls.length} urls`);
    } catch (err: any) {
      console.warn(`  ⚠ Skipping ${sitemapUrl}: ${err.message}`);
    }
  }

  console.log(`\n📦 Total unique products: ${products.length}`);

  // Assign categories from URL patterns
  for (const p of products) {
    // Try to determine category from the name
    const nameLower = p.name.toLowerCase();

    if (nameLower.includes('seramik') || /\d+x\d+/.test(nameLower)) {
      p.category = 'Seramik';
    } else if (nameLower.includes('klozet') || nameLower.includes('pisuvar') || nameLower.includes('rezervuar')) {
      p.category = 'Vitrifiye';
    } else if (nameLower.includes('lavabo') || nameLower.includes('tezgah')) {
      p.category = 'Vitrifiye';
    } else if (nameLower.includes('batarya') || nameLower.includes('musluk')) {
      p.category = 'Batarya ve Musluklar';
    } else if (nameLower.includes('dus') || nameLower.includes('duş')) {
      p.category = 'Duş Sistemleri';
    } else if (nameLower.includes('dolap') || nameLower.includes('dolab')) {
      p.category = 'Banyo Dolapları';
    } else if (nameLower.includes('kabin') || nameLower.includes('tekne')) {
      p.category = 'Banyo Grubu';
    } else if (nameLower.includes('silikon') || nameLower.includes('mastik') || nameLower.includes('soudal')) {
      p.category = 'Silikon & Mastik';
    } else if (nameLower.includes('kopuk') || nameLower.includes('köpük')) {
      p.category = 'Köpük';
    } else if (nameLower.includes('yapistirici') || nameLower.includes('yapıştırıcı')) {
      p.category = 'Yapıştırıcı';
    } else if (nameLower.includes('derz') || nameLower.includes('fayans')) {
      p.category = 'Yapı Kimyasalları';
    } else if (nameLower.includes('profil') || nameLower.includes('klips') || nameLower.includes('takoz')) {
      p.category = 'Uygulama Destek';
    } else if (nameLower.includes('sifon')) {
      p.category = 'Banyo Aksesuarları';
    } else if (nameLower.includes('havluluk') || nameLower.includes('askilik') || nameLower.includes('ayna')) {
      p.category = 'Banyo Aksesuarları';
    } else if (nameLower.includes('rtrmax') || nameLower.includes('taslama') || nameLower.includes('kompresor') || nameLower.includes('matkap') || nameLower.includes('jenerator')) {
      p.category = 'RTRMAX';
      p.brand = 'RTRMAX';
    } else if (nameLower.includes('tutunma') || nameLower.includes('engelli')) {
      p.category = 'Engelli Serisi';
    } else if (nameLower.includes('sprey') || nameLower.includes('boya')) {
      p.category = 'Sprey Boya';
    }
  }

  // Try to assign brands from the name (brands are often in product names)
  const brandPatterns: [RegExp, string][] = [
    [/akgün|akgun/i, 'AKGÜN'],
    [/\bqua\b/i, 'QUA'],
    [/\bece\b/i, 'ECE'],
    [/\bfleko\b/i, 'FLEKO'],
    [/\bnsk\b/i, 'NSK'],
    [/\bkalay\b/i, 'KALAY'],
    [/\bsoudal|soudafoam|soudafix|silirub|acryrub|fix-all|carbond|saudafoam/i, 'Soudal'],
    [/\barkim|arfix|arfill|argranit/i, 'Arkim'],
    [/\bnivakim|nivafix/i, 'Nivakim'],
    [/\brtrmax|rtrmaxair/i, 'RTRMAX'],
    [/\bformica\b/i, 'Formica'],
    [/\bsistema\b/i, 'Sistema'],
    [/\balamera\b/i, 'Alamera'],
    [/\bkarizma\b/i, 'Karizma'],
    [/\blinea\b/i, 'Linea'],
    [/\btera\b/i, 'Tera'],
    [/\bgap\b/i, 'GAP'],
    [/\binspira|insignia/i, 'Inspira'],
    [/\barola\b/i, 'Arola'],
    [/\bcarelia\b/i, 'Carelia'],
    [/\bnaia\b/i, 'Naia'],
    [/\bcarmen\b/i, 'Carmen'],
    [/\blena\b/i, 'Lena'],
    [/\blegna\b/i, 'Legna'],
    [/\bnobia\b/i, 'Nobia'],
    [/\bnoxia\b/i, 'Noxia'],
    [/\bvisia\b/i, 'Visia'],
    [/\bmolera\b/i, 'Molera'],
    [/\btrento\b/i, 'Trento'],
    [/\bmencia\b/i, 'Mencia'],
    [/\bglera\b/i, 'Glera'],
    [/\bdiamantina\b/i, 'Diamantina'],
    [/\bpandora\b/i, 'Pandora'],
    [/\blotus\b/i, 'Lotus'],
    [/\bgirne\b/i, 'Girne'],
    [/\bselen\b/i, 'Selen'],
    [/\bkuala\b/i, 'Kuala'],
    [/\bneo\b/i, 'Neo'],
    [/\bsilver\b/i, 'Silver'],
    [/\bsandora\b/i, 'Sandora'],
    [/\broof\b/i, 'Roof'],
    [/\bpractico\b/i, 'Practico'],
    [/\burcup|ürgüp/i, 'Ürgüp'],
    [/\bkeops\b/i, 'Keops'],
    [/\bscoby\b/i, 'Scoby'],
    [/\beliza\b/i, 'Eliza'],
    [/\bmurcia\b/i, 'Murcia'],
    [/\breal\b/i, 'Real'],
    [/\bmilas\b/i, 'Milas'],
    [/\bmonarc\b/i, 'Monarc'],
    [/\bserik\b/i, 'Serik'],
    [/\bmix\b/i, 'Mix'],
    [/\bplaton\b/i, 'Platon'],
    [/\beti\b/i, 'Eti'],
    [/\bdomino\b/i, 'Domino'],
    [/\bsnow\b/i, 'Snow'],
    [/\bvea\b/i, 'Vea'],
    [/\bteon\b/i, 'Teon'],
    [/\binfinity\b/i, 'Infinity'],
    [/\bsoluzione\b/i, 'Soluzione'],
    [/\bsentimenti\b/i, 'Sentimenti'],
    [/\bsekura\b/i, 'Sekura'],
    [/\bclass\b/i, 'Class'],
    [/\bpera\b/i, 'Pera'],
    [/\bhermes\b/i, 'Hermes'],
    [/\bdurezza\b/i, 'Durezza'],
    [/\bdura\b/i, 'Dura'],
    [/\bmars\b/i, 'Mars'],
    [/\bion\b/i, 'Ion'],
    [/\btempera\b/i, 'Tempera'],
    [/\braindream\b/i, 'Raindream'],
    [/\bactive\b/i, 'Active'],
    [/\bvisia\b/i, 'Visia'],
    [/\bmagestic\b/i, 'Magestic'],
    [/\bgeo\b/i, 'Geo'],
    [/\bbasics?\b/i, 'Basics'],
    [/\bbeta\b/i, 'Beta'],
    [/\bluna\b/i, 'Luna'],
    [/\bsanel\b/i, 'Sanel'],
    [/\bsavoy\b/i, 'Savoy'],
    [/\bgama\b/i, 'Gama'],
  ];

  for (const p of products) {
    if (p.brand !== 'Bilinmiyor') continue;
    for (const [re, brand] of brandPatterns) {
      if (re.test(p.name)) {
        p.brand = brand;
        break;
      }
    }
  }

  // Deduplicate by SKU
  const bySku = new Map<string, ProductSeed>();
  for (const p of products) {
    if (!bySku.has(p.sku) || p.brand !== 'Bilinmiyor') {
      bySku.set(p.sku, p);
    }
  }

  const final = [...bySku.values()];
  const target = final.slice(0, limit);

  console.log(`🎯 Inserting ${target.length} products into database...\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of target) {
    try {
      const existing = await prisma.product.findUnique({ where: { sku: p.sku } });

      if (existing) {
        // Update if brand was unknown before
        if (existing.brand === 'Bilinmiyor' && p.brand !== 'Bilinmiyor') {
          await prisma.product.update({
            where: { sku: p.sku },
            data: { name: p.name, brand: p.brand, category: p.category, imageUrl: p.imageUrl || undefined },
          });
        }
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
            imageUrl: p.imageUrl,
          },
        });
        inserted++;
      }
    } catch (err: any) {
      if (err.code === 'P2002') {
        skipped++;
      } else {
        console.warn(`  ⚠ DB error for ${p.sku} "${p.name}": ${err.message}`);
        skipped++;
      }
    }
  }

  // Summary
  const catCounts = new Map<string, number>();
  for (const p of target) {
    catCounts.set(p.category, (catCounts.get(p.category) || 0) + 1);
  }

  console.log(`\n📊 Categories:`);
  for (const [cat, count] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  const withImages = target.filter((p) => p.imageUrl).length;
  console.log(`  🖼  ${withImages}/${target.length} products have images`);
  console.log(`\n✅ Done: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
