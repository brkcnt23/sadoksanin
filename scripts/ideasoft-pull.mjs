#!/usr/bin/env node
/**
 * ideasoft-pull.mjs — İdeasoft API'den tüm ürünleri çek + görselleri indir
 *
 * Kullanım:
 *   node ideasoft-pull.mjs                 → tüm ürünleri çek, görselleri indir
 *   node ideasoft-pull.mjs --dry-run       → ilk sayfayı çek, örnek JSON'u göster (indirme yapmaz)
 *   node ideasoft-pull.mjs --no-images     → sadece ürün JSON'unu kaydet, görsel indirme
 *
 * Ön koşul:
 *   node ideasoft-token.mjs "CODE" ile önce token alınmış olmalı
 *
 * Çıktı:
 *   scripts/ideasoft-products.json     — tüm ürünler (ham API yanıtı)
 *   public/images/products/{sku}.{ext} — indirilen görseller
 *
 * NOT: İlk çalıştırmada API yanıt formatını keşfetmek için ilk ürünün
 *      tam JSON'unu console'a basar. Alan adlarını bu çıktıya göre doğrula.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { getAccessToken } from './ideasoft-token.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// Çıktı dosyaları
const PRODUCTS_JSON = resolve(__dirname, 'ideasoft-products.json');
const IMAGES_DIR = resolve(REPO_ROOT, 'apps', 'storefront', 'public', 'images', 'products');

// API
const API_BASE = process.env.IDEASOFT_API_BASE || "https://sadoksaninsaat.myideasoft.com/admin-api";

// Görsel istemcisi (cookie/oturum yok, public URL'ler)
const IMAGE_TIMEOUT_MS = 30_000;
const IMAGE_CONCURRENCY = 5; // paralel indirme sayısı

// ─── Yardımcı ──────────────────────────────────────────────────────────────────

/** Dosya adı için güvenli slug */
function safeSlug(str) {
  return (str || 'bilinmeyen')
    .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    || 'bilinmeyen';
}

/** Görsel URL'inden dosya uzantısını çıkar, bulamazsa fallback */
function getExt(url, fallback = '.jpg') {
  try {
    const pathname = new URL(url).pathname;
    const ext = extname(pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'].includes(ext)) return ext;
  } catch {}
  return fallback;
}

/** Basit fetch with timeout */
async function fetchWithTimeout(url, opts = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── API çağrıları ─────────────────────────────────────────────────────────────

async function apiGet(path, token) {
  const url = `${API_BASE}${path}`;
  console.log(`   GET ${url}`);
  const res = await fetchWithTimeout(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API hatası: HTTP ${res.status} ${res.statusText} — ${body.substring(0, 500)}`);
  }

  return res;
}

// ─── Sayfalama keşfi ───────────────────────────────────────────────────────────

/**
 * İlk API çağrısıyla sayfalama formatını keşfet.
 * İdeasoft genelde şunlardan birini kullanır:
 *   - ?limit=&page= (sayfa numaralı)
 *   - ?start=&length= (offset/limit)
 *   - ?offset=&limit=
 *   - Header: X-Total-Count, Link
 */
async function discoverPagination(token) {
  console.log('\n🔍 Sayfalama formatı keşfediliyor...');

  // İlk dene: ?limit=1 ile küçük çağrı
  const res = await apiGet('/products?limit=1', token);
  const body = await res.json();

  // Response yapısını analiz et
  const structure = {
    type: typeof body,
    isArray: Array.isArray(body),
    keys: body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body).slice(0, 10) : [],
    headers: {},
  };

  // Önemli header'lar
  for (const h of ['x-total-count', 'x-total', 'x-total-pages', 'link', 'content-range']) {
    const val = res.headers.get(h);
    if (val) structure.headers[h] = val;
  }

  console.log('   Yanıt tipi:', structure.isArray ? `Array (${body.length} eleman)` : `Object, keys: ${structure.keys.join(', ')}`);
  console.log('   Header\'lar:', JSON.stringify(structure.headers));

  // İlk ürünü yazdır (format keşfi için)
  let firstProduct = null;
  if (Array.isArray(body) && body.length > 0) {
    firstProduct = body[0];
  } else if (body && typeof body === 'object') {
    // Olası wrapper: { products: [...], total: N } veya { data: [...], meta: {...} }
    if (body.products) firstProduct = body.products[0];
    else if (body.data) firstProduct = Array.isArray(body.data) ? body.data[0] : body.data;
    else if (body.items) firstProduct = body.items[0];
    else if (body.result) firstProduct = Array.isArray(body.result) ? body.result[0] : body.result;
  }

  if (firstProduct) {
    console.log('\n📋 İLK ÜRÜN — TAM JSON (alan adlarını doğrula):');
    console.log('─'.repeat(72));
    console.log(JSON.stringify(firstProduct, null, 2));
    console.log('─'.repeat(72));
  } else {
    console.log('\n⚠️  İlk ürüne erişilemedi. Ham yanıt:');
    console.log(JSON.stringify(body, null, 2).substring(0, 2000));
  }

  return { structure, body, firstProduct };
}

// ─── Tüm ürünleri çek (sayfalayarak) ───────────────────────────────────────────

async function fetchAllProducts(token, dryRun) {
  console.log('\n📦 Ürünler çekiliyor...');

  const allProducts = [];
  let page = 1;
  const PER_PAGE = 100;
  let totalEstimate = null;

  while (true) {
    const res = await apiGet(`/products?limit=${PER_PAGE}&page=${page}`, token);
    const body = await res.json();

    let products = [];
    if (Array.isArray(body)) {
      products = body;
      totalEstimate = res.headers.get('x-total-count') || res.headers.get('x-total');
    } else if (body.products) {
      products = body.products;
      totalEstimate = body.total || body.count || body.totalCount;
    } else if (body.data) {
      products = Array.isArray(body.data) ? body.data : [];
      totalEstimate = body.meta?.total || body.total;
    } else if (body.items) {
      products = body.items;
      totalEstimate = body.total;
    }

    if (products.length === 0) break;

    allProducts.push(...products);
    const progress = totalEstimate
      ? `${allProducts.length}/${totalEstimate} (%${Math.round(allProducts.length / Number(totalEstimate) * 100)})`
      : `${allProducts.length} (toplam bilinmiyor)`;
    console.log(`   sayfa ${page}: ${products.length} ürün → toplam ${progress}`);

    if (dryRun) {
      console.log('\n   ⚠️  --dry-run: ilk sayfada durduruldu.');
      break;
    }

    // Son sayfa kontrolü
    if (products.length < PER_PAGE) break;
    page++;
  }

  console.log(`\n✅ Toplam ${allProducts.length} ürün çekildi.`);
  return allProducts;
}

// ─── Görsel URL'lerini çıkar ───────────────────────────────────────────────────

/**
 * Bir üründen görsel URL'lerini çıkarır.
 * İdeasoft'ta görseller genelde şu alanlardan birinde gelir:
 *   - images: [{ url: "...", filename: "..." }, ...]
 *   - productImages: [...]
 *   - picture1Path, picture2Path, ... (export formatı)
 */
function extractImageUrls(product) {
  const urls = [];

  // images dizisi (en yaygın)
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (typeof img === 'string') {
        urls.push(img);
      } else if (img && typeof img === 'object') {
        const url = img.url || img.src || img.path || img.source || img.large || img.original;
        if (url) urls.push(url);
      }
    }
  }

  // productImages vb.
  for (const key of ['productImages', 'photos', 'gallery', 'pictures']) {
    if (Array.isArray(product[key])) {
      for (const img of product[key]) {
        const url = typeof img === 'string' ? img : (img?.url || img?.src || img?.path);
        if (url) urls.push(url);
      }
    }
  }

  // pictureNPath (export formatı, genelde boş olur)
  for (let i = 1; i <= 4; i++) {
    const pic = product[`picture${i}Path`];
    if (pic && typeof pic === 'string' && pic.trim()) {
      urls.push(pic.trim());
    }
  }

  return urls;
}

// ─── Görsel indirme ────────────────────────────────────────────────────────────

async function downloadImage(url, filePath) {
  if (existsSync(filePath)) return 'skipped';

  try {
    const res = await fetchWithTimeout(url, {}, IMAGE_TIMEOUT_MS);
    if (!res.ok) return `HTTP ${res.status}`;

    // Geçici dosyaya yaz, sonra rename
    const tmpPath = filePath + '.tmp';
    const ws = createWriteStream(tmpPath);
    await pipeline(res.body, ws);

    // Başarılı: tmp → final
    const { rename } = await import('node:fs/promises');
    await rename(tmpPath, filePath);
    return 'ok';
  } catch (err) {
    return err.code === 'ABORT_ERR' ? 'timeout' : err.message;
  }
}

async function downloadAllImages(products, skipExisting = true) {
  console.log('\n🖼️  Görseller indiriliyor...');

  // Ürün → görsel listesi oluştur
  const jobs = [];
  for (const product of products) {
    const stockCode = product.stockCode || product.code || product.sku || product.id;
    if (!stockCode) continue;

    const skuSlug = safeSlug(stockCode);
    const urls = extractImageUrls(product);

    if (urls.length === 0) continue;

    urls.forEach((url, idx) => {
      const ext = getExt(url);
      const suffix = idx === 0 ? '' : `_${idx + 1}`;
      const filename = `${skuSlug}${suffix}${ext}`;
      const filePath = resolve(IMAGES_DIR, filename);

      if (skipExisting && existsSync(filePath)) return; // zaten var

      jobs.push({ url, filePath, product, filename });
    });
  }

  if (jobs.length === 0) {
    console.log('   İndirilecek yeni görsel yok.');
    return { downloaded: 0, skipped: 0, failed: 0, errors: [] };
  }

  console.log(`   ${jobs.length} görsel indirilecek...`);

  // Paralel indirme (concurrency limitli)
  let downloaded = 0, skipped = 0, failed = 0;
  const errors = [];
  let inFlight = 0;

  async function worker() {
    while (jobs.length > 0) {
      const job = jobs.shift();
      inFlight++;
      const result = await downloadImage(job.url, job.filePath);
      inFlight--;

      if (result === 'ok') downloaded++;
      else if (result === 'skipped') skipped++;
      else {
        failed++;
        if (errors.length < 20) errors.push(`${job.filename}: ${result}`);
      }

      // Her 20 görselde bir ilerleme
      const total = downloaded + skipped + failed;
      if (total % 20 === 0) {
        const remaining = jobs.length + inFlight;
        console.log(`   ... ${total} işlendi (${downloaded} ✓, ${skipped} ≡, ${failed} ✗), kalan: ${remaining}`);
      }
    }
  }

  // Concurrency havuzu
  const workers = Array.from({ length: Math.min(IMAGE_CONCURRENCY, jobs.length) }, () => worker());
  await Promise.all(workers);

  console.log(`\n   Görsel sonuç: ${downloaded} indirildi, ${skipped} atlandı, ${failed} hata`);
  if (errors.length > 0) {
    console.log('   İlk hatalar:');
    errors.forEach(e => console.log(`     - ${e}`));
  }

  return { downloaded, skipped, failed, errors };
}

// ─── Ana akış ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const noImages = args.includes('--no-images');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
İdeasoft Ürün Çekme + Görsel İndirme
────────────────────────────────────

Kullanım:
  node ideasoft-pull.mjs                 → tüm ürünleri çek, görselleri indir
  node ideasoft-pull.mjs --dry-run       → ilk sayfayı çek, örnek JSON göster
  node ideasoft-pull.mjs --no-images     → sadece ürün JSON'u, görsel indirme

Çıktı dosyaları:
  scripts/ideasoft-products.json         → tüm ürünler (ham API yanıtı)
  public/images/products/{sku}.{ext}     → indirilen görseller

Ön koşul:
  Önce ideasoft-token.mjs ile token alınmış olmalı.
`);
    process.exit(0);
  }

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     İdeasoft → Sadoksan Ürün Çekme                      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // 1. Token al
  console.log('\n🔑 Token alınıyor...');
  let token;
  try {
    token = await getAccessToken();
    console.log(`   ✅ Token hazır: ${token.substring(0, 20)}...`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  // 2. Görsel dizinini hazırla
  if (!dryRun && !noImages) {
    await mkdir(IMAGES_DIR, { recursive: true });
    console.log(`\n📁 Görsel dizini: ${IMAGES_DIR}`);
  }

  // 3. Sayfalama keşfi + ilk ürün formatı
  await discoverPagination(token);

  // 4. Tüm ürünleri çek
  const products = await fetchAllProducts(token, dryRun);

  // Ürün istatistikleri
  const withImages = products.filter(p => extractImageUrls(p).length > 0).length;
  const withStockCode = products.filter(p => p.stockCode || p.code || p.sku).length;
  console.log(`\n📊 İstatistik:`);
  console.log(`   Toplam ürün:       ${products.length}`);
  console.log(`   Görselli ürün:     ${withImages}`);
  console.log(`   StockCode\'lu ürün: ${withStockCode}`);

  // 5. JSON'a kaydet
  if (!dryRun) {
    const output = {
      _meta: {
        pulledAt: new Date().toISOString(),
        totalProducts: products.length,
        withImages,
        apiBase: API_BASE,
      },
      products,
    };

    await writeFile(PRODUCTS_JSON, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n💾 ${products.length} ürün kaydedildi: ${PRODUCTS_JSON}`);
    console.log(`   Dosya boyutu: ${(Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2)} MB`);
  }

  // 6. Görselleri indir
  if (!dryRun && !noImages) {
    await downloadAllImages(products, true);
  }

  console.log('\n✅ İşlem tamamlandı.');
}

main().catch(err => {
  console.error('\n❌ Beklenmeyen hata:', err.message);
  console.error(err.stack);
  process.exit(1);
});
