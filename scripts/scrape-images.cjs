/**
 * Sadoksan ürün görsellerini sadoksaninsaat.com.tr'den toplu çeker.
 * Puppeteer ile her ürün detay sayfasını ziyaret edip,
 * myassets/products altındaki ilk gerçek ürün görselini alır.
 *
 * Kullanım: node scripts/scrape-images.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const SOURCE = __dirname + '/../apps/api/src/scripts/seed-products-from-site.ts';
const MD_OUT = __dirname + '/../docs/urun-katalogu.md';

// ─── Ürün listesini seed dosyasından parse et ─────────────────────────────
function parseProducts() {
  const src = fs.readFileSync(SOURCE, 'utf8');
  const regex = /\{ sku:'([^']+)', netsisCode:'([^']+)', name:'([^']+)', brand:'([^']*)', category:'([^']+)', basePrice:(\d+), unit:'([^']*)', netsisStock:(\d+)(?:, minimumStock:(\d+))?(?:, middleStock:(\d+))?(?:, description:'([^']*)')?(?:, imageUrl:'([^']*)')?/g;
  const products = [];
  let match;
  while ((match = regex.exec(src)) !== null) {
    products.push({
      sku: match[1],
      netsisCode: match[2],
      name: match[3],
      brand: match[4] || '',
      category: match[5],
      basePrice: parseInt(match[6]),
      unit: match[7] || '',
      netsisStock: parseInt(match[8]),
      imageUrl: match[12] || null,
      productUrl: null, // from scraping
    });
  }
  return products;
}

// ─── Ürün adından URL slug'ı oluştur ──────────────────────────────────────
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Ana iş ────────────────────────────────────────────────────────────────
(async () => {
  const products = parseProducts();
  console.log(`${products.length} ürün yüklendi.`);
  console.log(`${products.filter(p => p.imageUrl).length} tanesinde zaten görsel var.`);

  const missing = products.filter(p => !p.imageUrl);
  console.log(`${missing.length} ürüne görsel çekilecek.\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) SadoksanBot/1.0');

  let found = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const p = missing[i];
    const slug = slugify(p.name);
    const url = `https://www.sadoksaninsaat.com.tr/urun/${slug}-${p.sku}`;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // myassets/products altındaki gerçek ürün görselini bul
      const imgUrl = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.getAttribute('src') || '';
          if (src.includes('myassets/products') && !src.includes('loader.gif')) {
            return src.startsWith('//') ? 'https:' + src.split('?')[0] : src.split('?')[0];
          }
        }
        return null;
      });

      if (imgUrl) {
        p.imageUrl = imgUrl;
        p.productUrl = url;
        found++;
        process.stdout.write(`✅ [${i+1}/${missing.length}] ${p.sku} → ${imgUrl.slice(-40)}\n`);
      } else {
        failed++;
        process.stdout.write(`❌ [${i+1}/${missing.length}] ${p.sku} → görsel bulunamadı\n`);
      }
    } catch (err) {
      failed++;
      process.stdout.write(`⚠️  [${i+1}/${missing.length}] ${p.sku} → hata: ${err.message.slice(0, 50)}\n`);
    }
  }

  await browser.close();

  console.log(`\n🎯 Sonuç: ${found} bulundu, ${failed} başarısız`);
  console.log(`Toplam görselli: ${products.filter(p => p.imageUrl).length}/${products.length}`);

  // ─── Güncellenmiş MD'yi yaz ──────────────────────────────────────────
  const cats = {};
  for (const p of products) {
    if (!cats[p.category]) cats[p.category] = [];
    cats[p.category].push(p);
  }

  let md = `# Sadoksan Ürün Kataloğu\n\n`;
  md += `> ${products.length} ürün, ${Object.keys(cats).length} kategori\n`;
  md += `> Kaynak: sadoksaninsaat.com.tr (Ideasoft) — Puppeteer scrape\n`;
  md += `> Tarih: ${new Date().toISOString().split('T')[0]}\n`;
  md += `> Görselli: ${products.filter(p => p.imageUrl).length}/${products.length}\n\n`;
  md += `---\n\n`;

  for (const [cat, items] of Object.entries(cats)) {
    const withImg = items.filter(p => p.imageUrl).length;
    md += `## ${cat} (${items.length} ürün, ${withImg} görselli)\n\n`;
    md += `| # | SKU | Ürün | Marka | Fiyat | Stok | Görsel |\n`;
    md += `|---|-----|------|-------|-------|------|--------|\n`;
    items.forEach((p, i) => {
      const img = p.imageUrl ? `[🔗](${p.imageUrl})` : '❌';
      md += `| ${i+1} | ${p.sku} | ${p.name} | ${p.brand} | ${p.basePrice}₺ | ${p.netsisStock} ${p.unit} | ${img} |\n`;
    });
    md += '\n';
  }

  fs.writeFileSync(MD_OUT, md);
  console.log(`\n📄 MD güncellendi: ${MD_OUT}`);
})();
