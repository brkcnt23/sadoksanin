/**
 * Fast product seeder — parses sitemaps + image sitemaps.
 * Plain JS, run with: node src/scripts/seed-products.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'https://www.sadoksaninsaat.com.tr';
const SITEMAPS = [1, 2, 3, 4].map((n) => `${BASE}/xml/sitemap_product_${n}.xml`);
const IMAGE_SITEMAPS = [1, 2, 3, 4].map((n) => `${BASE}/xml/sitemap_image_${n}.xml`);

const BRAND_PATTERNS = [
  [/akgün|akgun/i, 'AKGÜN'], [/qua\b/i, 'QUA'], [/ece\b/i, 'ECE'],
  [/fleko\b/i, 'FLEKO'], [/nsk\b/i, 'NSK'], [/kalay\b/i, 'KALAY'],
  [/soudal|soudafoam|soudafix|silirub|acryrub|fix-all|carbond|saudafoam/i, 'Soudal'],
  [/arkim|arfix|arfill|argranit/i, 'Arkim'], [/nivakim|nivafix/i, 'Nivakim'],
  [/rtrmax|rtrmaxair/i, 'RTRMAX'], [/formica\b/i, 'Formica'],
  [/sistema\b/i, 'Sistema'], [/alamera\b/i, 'Alamera'], [/linea\b/i, 'Linea'],
  [/tera\b/i, 'Tera'], [/gap\b/i, 'GAP'], [/savoy\b/i, 'Savoy'],
  [/kuala\b/i, 'Kuala'], [/selen\b/i, 'Selen'], [/lotus\b/i, 'Lotus'],
  [/pandora\b/i, 'Pandora'], [/girne\b/i, 'Girne'], [/keops\b/i, 'Keops'],
  [/silver\b/i, 'Silver'], [/mars\b/i, 'Mars'], [/neo\b/i, 'Neo'],
  [/domino\b/i, 'Domino'], [/snow\b/i, 'Snow'], [/vea\b/i, 'Vea'],
  [/teon\b/i, 'Teon'], [/infinity\b/i, 'Infinity'], [/purita\b/i, 'Purita'],
  [/karizma\b/i, 'Karizma'], [/molera\b/i, 'Molera'], [/trento\b/i, 'Trento'],
  [/nobia\b/i, 'Nobia'], [/noxia\b/i, 'Noxia'], [/visia\b/i, 'Visia'],
  [/lena\b/i, 'Lena'], [/legna\b/i, 'Legna'], [/geo\b/i, 'Geo'],
  [/carmen\b/i, 'Carmen'], [/naia\b/i, 'Naia'], [/arola\b/i, 'Arola'],
  [/carelia\b/i, 'Carelia'], [/insignia\b/i, 'Insignia'], [/inspira\b/i, 'Inspira'],
  [/diamantina\b/i, 'Diamantina'], [/mencia\b/i, 'Mencia'], [/glera\b/i, 'Glera'],
  [/mix\b/i, 'Mix'], [/sandora\b/i, 'Sandora'], [/roof\b/i, 'Roof'],
  [/scoby\b/i, 'Scoby'], [/eliza\b/i, 'Eliza'], [/murcia\b/i, 'Murcia'],
  [/real\b/i, 'Real'], [/milas\b/i, 'Milas'], [/monarc\b/i, 'Monarc'],
  [/serik\b/i, 'Serik'], [/platon\b/i, 'Platon'], [/eti\b/i, 'Eti'],
  [/beta\b/i, 'Beta'], [/luna\b/i, 'Luna'], [/sanel\b/i, 'Sanel'],
  [/gama\b/i, 'Gama'], [/mira\b/i, 'Mira'], [/alora\b/i, 'Alora'],
  [/basics?\b/i, 'Basics'], [/tempera\b/i, 'Tempera'], [/raindream\b/i, 'Raindream'],
  [/active\b/i, 'Active'], [/magestic\b/i, 'Magestic'], [/ion\b/i, 'Ion'],
  [/hermes\b/i, 'Hermes'], [/soluzione\b/i, 'Soluzione'], [/pera\b/i, 'Pera'],
  [/practico\b/i, 'Practico'], [/ürgüp|urgup/i, 'Ürgüp'], [/class\b/i, 'Class'],
];

function slugToName(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bX\b/g, 'x').replace(/\bCm\b/g, 'cm').replace(/\bMm\b/g, 'mm')
    .replace(/\bSg\b/gi, 'SG').replace(/\bPk\b/gi, 'PK').replace(/\bLf\b/gi, 'LF')
    .replace(/\bMt\b/gi, 'MT').replace(/\bKr\b/gi, 'KR').replace(/\bPr\b/gi, 'PR')
    .replace(/\bUd\b/gi, 'UD').replace(/\bWc\b/gi, 'WC')
    .replace(/\bDlp\b/gi, 'DLP').replace(/\bTkm\b/gi, 'TKM').replace(/\bLavb\b/gi, 'LAVB')
    .trim();
}

function guessCategory(name) {
  const n = name.toLowerCase();
  if (/\d+x\d+/.test(n) || n.includes('seramik') || n.includes('rec') || n.includes('dekofon') || n.includes('lappato') || n.includes('full lap')) return 'Seramik';
  if (n.includes('klozet') || n.includes('pisuvar') || n.includes('rezervuar') || n.includes('hela')) return 'Vitrifiye';
  if (n.includes('lavabo') || n.includes('tezgah')) return 'Vitrifiye';
  if (n.includes('batarya') || n.includes('musluk')) return 'Batarya ve Musluklar';
  if (n.includes('duş') || n.includes('dus')) return 'Duş Sistemleri';
  if (n.includes('dolap') || n.includes('dolab')) return 'Banyo Dolapları';
  if (n.includes('kabin') || n.includes('tekne')) return 'Banyo Grubu';
  if (n.includes('silikon') || n.includes('mastik')) return 'Silikon & Mastik';
  if (n.includes('köpük') || n.includes('kopuk')) return 'Köpük';
  if (n.includes('yapıştırıcı') || n.includes('yapistirici') || n.includes('tutkal')) return 'Yapıştırıcı';
  if (n.includes('derz') || n.includes('fayans')) return 'Yapı Kimyasalları';
  if (n.includes('profil') || n.includes('klips') || n.includes('takoz') || n.includes('bordür')) return 'Uygulama Destek';
  if (n.includes('sifon')) return 'Banyo Aksesuarları';
  if (n.includes('havluluk') || n.includes('askilik') || n.includes('ayna') || n.includes('kagitlik')) return 'Banyo Aksesuarları';
  if (n.includes('rtrmax') || n.includes('taslama') || n.includes('kompresör') || n.includes('matkap') || n.includes('jeneratör')) return 'RTRMAX';
  if (n.includes('tutunma') || n.includes('engelli')) return 'Engelli Serisi';
  if (n.includes('sprey') || n.includes('boya')) return 'Sprey Boya';
  if (n.includes('çamaşır') || n.includes('camasir')) return 'Musluklar';
  if (n.includes('palet') || n.includes('nakliye') || n.includes('iskonto') || n.includes('fiyat fark') || n.includes('vade fark')) return 'Diğer';
  return 'Genel';
}

function guessBrand(name) {
  for (const [re, brand] of BRAND_PATTERNS) {
    if (re.test(name)) return brand;
  }
  return 'Bilinmiyor';
}

async function fetchSitemap(url) {
  const res = await fetch(url);
  const xml = await res.text();
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim());
  return urls;
}

async function buildImageMap() {
  const map = new Map();
  for (const url of IMAGE_SITEMAPS) {
    try {
      const res = await fetch(url);
      const xml = await res.text();
      const blocks = xml.split('<url>').slice(1);
      for (const block of blocks) {
        const pm = block.match(/<loc>([^<]+)<\/loc>/);
        const im = block.match(/<image:loc>([^<]+)<\/image:loc>/);
        if (pm && im) {
          let img = im[1].trim();
          if (img.startsWith('//')) img = 'https:' + img;
          if (!map.has(pm[1].trim())) map.set(pm[1].trim(), img);
        }
      }
      console.log('  Image sitemap ' + url.split('/').pop() + ': ' + map.size + ' images so far');
    } catch (e) {
      console.warn('  Skip image sitemap ' + url + ': ' + e.message);
    }
  }
  return map;
}

async function main() {
  console.log('\n🔍 Building image map...');
  const imageMap = await buildImageMap();
  console.log('  Total images: ' + imageMap.size + '\n');

  console.log('📦 Parsing product sitemaps...');
  const seen = new Set();
  const products = [];

  for (const url of SITEMAPS) {
    try {
      const urls = await fetchSitemap(url);
      for (const u of urls) {
        if (seen.has(u)) continue;
        seen.add(u);
        const parts = new URL(u).pathname.replace('/urun/', '').split('-');
        const id = parts[parts.length - 1];
        const slug = parts.slice(0, -1).join('-');
        if (!id || !/^\d+$/.test(id)) continue;
        const name = slugToName(slug);
        if (name.length < 3) continue;
        products.push({
          sku: id,
          url: u,
          name,
          brand: guessBrand(name),
          category: guessCategory(name),
          imageUrl: imageMap.get(u) || null,
        });
      }
      console.log('  ' + url.split('/').pop() + ': ' + urls.length + ' urls');
    } catch (e) {
      console.warn('  Skip ' + url + ': ' + e.message);
    }
  }

  // Deduplicate by SKU
  const bySku = new Map();
  for (const p of products) {
    if (!bySku.has(p.sku) || p.brand !== 'Bilinmiyor') bySku.set(p.sku, p);
  }
  const final = [...bySku.values()];
  console.log('\n📦 Total unique products: ' + final.length);

  const withImg = final.filter(p => p.imageUrl).length;
  console.log('🖼  With images: ' + withImg + '/' + final.length);

  // Category stats
  const cats = {};
  for (const p of final) { cats[p.category] = (cats[p.category] || 0) + 1; }
  console.log('📊 Categories:');
  for (const [cat, cnt] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + cat + ': ' + cnt);
  }

  console.log('\n💾 Inserting into database...');
  let inserted = 0, updated = 0, skipped = 0;

  for (const p of final) {
    try {
      const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
      if (existing) {
        if ((existing.imageUrl == null || existing.imageUrl === '') && p.imageUrl) {
          await prisma.product.update({ where: { sku: p.sku }, data: { name: p.name, brand: p.brand, category: p.category, imageUrl: p.imageUrl } });
        }
        updated++;
      } else {
        await prisma.product.create({
          data: {
            sku: p.sku, netsisCode: p.sku, name: p.name,
            brand: p.brand, category: p.category, description: '',
            basePrice: 0, taxRate: 0.2, unit: 'Adet',
            netsisStock: 0, reservedStock: 0, displayStock: 0,
            visible: true, purchasable: true, syncStatus: 'SYNCED',
            lastNetsisSync: new Date(), imageUrl: p.imageUrl,
          },
        });
        inserted++;
      }
    } catch (e) {
      if (e.code !== 'P2002') console.warn('  DB err ' + p.sku + ': ' + e.message);
      skipped++;
    }
  }

  console.log('\n✅ Done: ' + inserted + ' inserted, ' + updated + ' updated, ' + skipped + ' skipped');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
