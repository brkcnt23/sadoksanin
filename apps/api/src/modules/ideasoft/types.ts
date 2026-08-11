/**
 * Ideasoft OAuth2 response tipleri — birebir Ideasoft formatı.
 */

// POST /oauth/v2/token başarılı yanıtı (Ideasoft ile aynı alanlar/sıra)
export interface IdeasoftTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: 'bearer';
  scope: string;
  refresh_token: string;
}

// OAuth2 hata yanıtı (RFC 6749 §5.2 — Ideasoft de bunu döner)
export interface IdeasoftOAuthError {
  error: string;
  error_description?: string;
}

// Access token JWT payload'ı
export interface IdeasoftAccessPayload {
  sub: string; // onaylayan admin userId veya client_id
  client_id: string;
  scope: string;
  type: string; // IDEASOFT_TOKEN_TYPE
}

// Bearer guard sonrası request'e iliştirilen bağlam
export interface IdeasoftAuthContext {
  clientId: string;
  scope: string;
  userId?: string;
}
