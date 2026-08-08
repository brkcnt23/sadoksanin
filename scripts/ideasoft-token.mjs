#!/usr/bin/env node
/**
 * ideasoft-token.mjs — Ideasoft OAuth2 token yönetimi (authorization_code + refresh_token)
 *
 * Kullanım:
 *   node ideasoft-token.mjs "AUTHORIZATION_CODE"   → kodu token'a çevirir, .ideasoft-token.json'a kaydeder
 *   node ideasoft-token.mjs                        → mevcut token durumunu gösterir
 *   node ideasoft-token.mjs --refresh              → refresh_token ile yenilemeyi zorla
 *
 * Diğer scriptlerden import:
 *   import { getAccessToken } from './ideasoft-token.mjs';
 *   const token = await getAccessToken(); // süresi dolmuşsa otomatik refresh_token ile yeniler
 *
 * Yetkilendirme URL'i (tarayıcıda, bir kez):
 *   https://sadoksaninsaat.com.tr/admin/user/auth?client_id=CLIENT_ID&state=sadoksan&redirect_uri=REDIRECT_URI&response_type=code
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = resolve(__dirname, '.ideasoft-token.json');

// ===== KİMLİK BİLGİLERİ — env veya burayı doldur =====
const CLIENT_ID = process.env.IDEASOFT_CLIENT_ID || '';
const CLIENT_SECRET = process.env.IDEASOFT_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.IDEASOFT_REDIRECT_URI || 'https://sadoksan.smartinnventory.com/ideasoft/callback';
const TOKEN_URL = process.env.IDEASOFT_TOKEN_URL || "https://sadoksaninsaat.myideasoft.com/oauth/v2/token";
const AUTH_URL_BASE = process.env.IDEASOFT_AUTH_URL || "https://sadoksaninsaat.myideasoft.com/panel/auth";
// =====================================================

// Token süresi dolmadan 5 dakika önce yenile
const EXPIRY_BUFFER_SEC = 300;

// ─── Yardımcı ──────────────────────────────────────────────────────────────────

function assertCredentials() {
  const missing = [];
  if (!CLIENT_ID || CLIENT_ID.startsWith('{{')) missing.push('IDEASOFT_CLIENT_ID');
  if (!CLIENT_SECRET || CLIENT_SECRET.startsWith('{{')) missing.push('IDEASOFT_CLIENT_SECRET');
  if (missing.length) {
    console.error(`HATA: Kimlik bilgileri eksik: ${missing.join(', ')}`);
    console.error('Env olarak tanımlayın veya script başındaki sabitleri doldurun:');
    console.error('  export IDEASOFT_CLIENT_ID="7_..."');
    console.error('  export IDEASOFT_CLIENT_SECRET="..."');
    process.exit(1);
  }
}

// ─── Token dosyası ─────────────────────────────────────────────────────────────

async function readTokenFile() {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    const raw = await readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeTokenFile(data) {
  await writeFile(TOKEN_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Token dosyası güncellendi: ${TOKEN_FILE}`);
}

// ─── Token exchange (authorization_code) ────────────────────────────────────────

async function exchangeCode(code) {
  assertCredentials();

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  });

  console.log('🔄 Authorization code → token değişimi yapılıyor...');
  console.log(`   URL: ${TOKEN_URL}`);
  console.log(`   grant_type: authorization_code`);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error(`❌ Token alma başarısız (HTTP ${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    if (body.error === 'invalid_grant') {
      console.error('\n💡 "invalid_grant" → authorization code geçersiz veya süresi dolmuş.');
      console.error('   Tarayıcıda tekrar yetkilendirme yapıp yeni code alın:');
      console.error(`   ${AUTH_URL_BASE}?client_id=${CLIENT_ID}&state=sadoksan&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`);
    }
    process.exit(1);
  }

  const tokenData = {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    expires_in: body.expires_in,
    token_type: body.token_type || 'Bearer',
    obtained_at: Date.now(),
  };

  await writeTokenFile(tokenData);
  console.log('✅ Token başarıyla alındı!');
  console.log(`   access_token:  ${tokenData.access_token.substring(0, 20)}...`);
  console.log(`   refresh_token: ${tokenData.refresh_token ? tokenData.refresh_token.substring(0, 20) + '...' : 'YOK'}`);
  console.log(`   expires_in:    ${tokenData.expires_in}s (${Math.round(tokenData.expires_in / 60)} dakika)`);
  console.log(`   token_type:    ${tokenData.token_type}`);

  return tokenData;
}

// ─── Token refresh (refresh_token) ──────────────────────────────────────────────

async function refreshAccessToken(tokenData) {
  assertCredentials();

  if (!tokenData.refresh_token) {
    throw new Error('refresh_token yok — authorization_code ile yeniden token alınması gerek');
  }

  console.log('🔄 refresh_token ile access_token yenileniyor...');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: tokenData.refresh_token,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error(`❌ Token yenileme başarısız (HTTP ${res.status}):`);
    console.error(JSON.stringify(body, null, 2));
    if (body.error === 'invalid_grant') {
      console.error('\n💡 Refresh token geçersiz veya iptal edilmiş. Yeni authorization code gerek.');
      console.error(`   ${AUTH_URL_BASE}?client_id=${CLIENT_ID}&state=sadoksan&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`);
    }
    throw new Error(`Token refresh failed: ${body.error || res.status}`);
  }

  const updated = {
    ...tokenData,
    access_token: body.access_token,
    refresh_token: body.refresh_token || tokenData.refresh_token, // yenisi gelmezse eskisini koru
    expires_in: body.expires_in || tokenData.expires_in,
    token_type: body.token_type || tokenData.token_type,
    obtained_at: Date.now(),
  };

  await writeTokenFile(updated);
  console.log('✅ Token yenilendi!');
  console.log(`   access_token: ${updated.access_token.substring(0, 20)}...`);
  console.log(`   expires_in:   ${updated.expires_in}s (${Math.round(updated.expires_in / 60)} dakika)`);

  return updated;
}

// ─── Public API: getAccessToken() — diğer scriptler bunu import eder ───────────

/**
 * Geçerli bir access_token döndürür.
 * Token dosyasını okur, süresi dolmuşsa refresh_token ile yeniler.
 * Token dosyası yoksa hata fırlatır.
 *
 * @returns {Promise<string>} access_token
 */
export async function getAccessToken() {
  assertCredentials();

  let tokenData = await readTokenFile();
  if (!tokenData || !tokenData.access_token) {
    throw new Error(
      'Token dosyası bulunamadı. Önce authorization code ile token alın:\n' +
      `  1. Tarayıcıda: ${AUTH_URL_BASE}?client_id=${CLIENT_ID}&state=sadoksan&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code\n` +
      `  2. Dönen "code" parametresiyle: node ideasoft-token.mjs "CODE"\n` +
      `     veya: npx tsx ideasoft-token.mjs "CODE"`
    );
  }

  // Süre kontrolü: obtained_at + expires_in - buffer < now
  const now = Date.now();
  const expiryMs = tokenData.obtained_at + (tokenData.expires_in * 1000) - (EXPIRY_BUFFER_SEC * 1000);

  if (now >= expiryMs) {
    console.log('⏰ Token süresi dolmuş (veya dolmak üzere), yenileniyor...');
    tokenData = await refreshAccessToken(tokenData);
  }

  return tokenData.access_token;
}

// ─── CLI ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
İdeasoft OAuth2 Token Yönetimi
──────────────────────────────

Kullanım:
  node ideasoft-token.mjs "AUTHORIZATION_CODE"   → authorization code'dan token al
  node ideasoft-token.mjs                        → mevcut token durumunu göster
  node ideasoft-token.mjs --refresh              → refresh_token ile yenilemeyi zorla
  node ideasoft-token.mjs --auth-url             → yetkilendirme URL'ini bas

Yetkilendirme adımları:
  1. Bu script ile --auth-url al
  2. URL'i tarayıcıda aç, "İzin Ver"e tıkla
  3. Yönlendirilen sayfadaki "?code=XXXX" parametresini kopyala
  4. node ideasoft-token.mjs "XXXX" ile token'ı al

Ortam değişkenleri (veya script başındaki sabitler):
  IDEASOFT_CLIENT_ID
  IDEASOFT_CLIENT_SECRET
  IDEASOFT_REDIRECT_URI  (varsayılan: ${REDIRECT_URI})
`);
  process.exit(0);
}

if (args[0] === '--auth-url') {
  assertCredentials();
  const url = `${AUTH_URL_BASE}?client_id=${CLIENT_ID}&state=sadoksan&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  console.log('\n🔗 Yetkilendirme URL\'i (tarayıcıda açın):\n');
  console.log(url);
  console.log('\n📋 "İzin Ver"e tıklayın, yönlendirilen URL\'deki ?code=XXXX parametresini alın.\n');
  process.exit(0);
}

// --refresh: zorla yenile
if (args[0] === '--refresh') {
  assertCredentials();
  const tokenData = await readTokenFile();
  if (!tokenData || !tokenData.refresh_token) {
    console.error('❌ refresh_token bulunamadı. Önce authorization_code ile token alın.');
    process.exit(1);
  }
  await refreshAccessToken(tokenData);
  process.exit(0);
}

// authorization_code varsa token exchange
const code = args[0];
if (code && !code.startsWith('--')) {
  await exchangeCode(code);
  process.exit(0);
}

// Varsayılan: token durumunu göster
if (args.length === 0) {
  assertCredentials();
  const tokenData = await readTokenFile();
  if (!tokenData || !tokenData.access_token) {
    console.log('❌ Token dosyası bulunamadı.');
    console.log(`   Yetkilendirme URL'i almak için: node ideasoft-token.mjs --auth-url`);
    process.exit(1);
  }

  const now = Date.now();
  const expiryMs = tokenData.obtained_at + (tokenData.expires_in * 1000);
  const remaining = Math.max(0, Math.round((expiryMs - now) / 1000));

  console.log('\n📋 Mevcut Token Durumu:');
  console.log(`   access_token:  ${tokenData.access_token.substring(0, 25)}...`);
  console.log(`   refresh_token: ${tokenData.refresh_token ? tokenData.refresh_token.substring(0, 25) + '...' : 'YOK'}`);
  console.log(`   token_type:    ${tokenData.token_type || 'Bearer'}`);
  console.log(`   expires_in:    ${tokenData.expires_in}s (${Math.round(tokenData.expires_in / 60)} dakika)`);
  console.log(`   alınma:        ${new Date(tokenData.obtained_at).toLocaleString('tr-TR')}`);
  console.log(`   son kullanma:  ${new Date(expiryMs).toLocaleString('tr-TR')}`);
  console.log(`   kalan:         ${Math.round(remaining / 60)} dakika ${remaining < EXPIRY_BUFFER_SEC ? '⚠️ (buffer içinde)' : '✅'}`);
  console.log('');
} else {
  console.error(`❌ Bilinmeyen argüman: ${args[0]}`);
  console.error('   node ideasoft-token.mjs --help  → yardım');
  process.exit(1);
}
