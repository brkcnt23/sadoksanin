/**
 * Ideasoft API taklidi — sabitler.
 *
 * Değerler Ideasoft Admin API dokümanına (apidoc.ideasoft.dev) göre birebir
 * seçildi ki Entegra tarafında hiçbir değişiklik gerekmesin.
 */

// Token ömürleri (Ideasoft ile aynı)
export const ACCESS_TOKEN_TTL_SECONDS = 86400; // 24 saat
export const REFRESH_TOKEN_TTL_DAYS = 60; // ~2 ay
export const AUTH_CODE_TTL_SECONDS = 60; // authorization code kısa ömürlü

// Access token JWT tipi — normal kullanıcı token'ından ayırmak için
export const IDEASOFT_TOKEN_TYPE = 'ideasoft_access';

// Entegra'ya verilecek scope seti. Ideasoft'un read-ağırlıklı entegratör
// scope'larını taklit eder. Entegra fatura keseceği için okuma yetkileri kritik.
export const IDEASOFT_SCOPES = [
  'order_read',
  'order_write',
  'product_read',
  'category_read',
  'member_read',
  'customer_read',
  'current_account_read',
  'shipment_read',
  'invoice_read',
] as const;

export const DEFAULT_SCOPE = IDEASOFT_SCOPES.join(' ');

// JWT imzası için ayrı secret (kullanıcı JWT_SECRET'ından bağımsız olabilir).
// Env'de yoksa JWT_SECRET'a düşer.
export const IDEASOFT_JWT_SECRET_ENV = 'IDEASOFT_JWT_SECRET';
export const ENTEGRA_CLIENT_ID_ENV = 'ENTEGRA_CLIENT_ID';
export const ENTEGRA_CLIENT_SECRET_ENV = 'ENTEGRA_CLIENT_SECRET';
