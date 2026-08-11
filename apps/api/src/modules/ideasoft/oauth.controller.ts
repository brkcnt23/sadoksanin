import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OAuthService } from './oauth.service';
import { Public } from '../../common/decorators/public.decorator';
import { DEFAULT_SCOPE } from './ideasoft.constants';

/**
 * Ideasoft OAuth2 taklidi — auth endpoint'leri.
 *
 * Bu route'lar global `api` prefix'inden HARİÇ tutulur (main.ts exclude),
 * çünkü Entegra birebir `/oauth/v2/token` ve `/panel/auth` bekler.
 */
@Controller()
export class OAuthController {
  constructor(private readonly oauth: OAuthService) {}

  /** HTML özel karakter kaçışı (yansıtılan query paramları için XSS koruması). */
  private esc(v: unknown): string {
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── POST /oauth/v2/token ─────────────────────────────────────────────────────
  @Public()
  @Post('oauth/v2/token')
  async token(
    @Body() body: Record<string, any>,
    @Query() query: Record<string, any>,
  ) {
    // Entegra param'ları body (form-urlencoded/json) veya query'de gönderebilir
    const p = { ...query, ...body };
    try {
      return await this.oauth.exchange({
        grantType: p.grant_type,
        clientId: p.client_id,
        clientSecret: p.client_secret,
        code: p.code,
        redirectUri: p.redirect_uri,
        refreshToken: p.refresh_token,
      });
    } catch (err) {
      // Nest exception'ını OAuth2 (RFC 6749 §5.2) hata formatına çevir
      const status =
        err instanceof HttpException
          ? err.getStatus()
          : HttpStatus.BAD_REQUEST;
      const code =
        err instanceof HttpException
          ? (typeof err.getResponse() === 'object'
              ? (err.getResponse() as any).message
              : err.message)
          : 'invalid_request';
      throw new HttpException(
        { error: Array.isArray(code) ? code[0] : code },
        status === HttpStatus.UNAUTHORIZED
          ? HttpStatus.UNAUTHORIZED
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ─── GET /panel/auth ──────────────────────────────────────────────────────────
  // Entegra kullanıcıyı buraya yönlendirir; onay + admin login formu gösterilir.
  @Public()
  @Get('panel/auth')
  authForm(@Query() q: Record<string, any>, @Res() res: Response) {
    const clientId = q.client_id;
    if (!this.oauth.isKnownClient(clientId)) {
      res.status(400).send(this.errorPage('Bilinmeyen client_id'));
      return;
    }
    if (q.response_type && q.response_type !== 'code') {
      res.status(400).send(this.errorPage('Yalnızca response_type=code desteklenir'));
      return;
    }
    res.status(200).type('html').send(
      this.consentPage({
        clientId,
        redirectUri: q.redirect_uri || '',
        scope: q.scope || DEFAULT_SCOPE,
        state: q.state || '',
      }),
    );
  }

  // ─── POST /panel/auth ─────────────────────────────────────────────────────────
  // Admin login + onay → authorization code üret → redirect_uri'ye yönlendir.
  @Public()
  @Post('panel/auth')
  async authApprove(
    @Body() body: Record<string, any>,
    @Res() res: Response,
    @Req() _req: Request,
  ) {
    const { client_id, redirect_uri, scope, state, email, password } = body;

    if (!this.oauth.isKnownClient(client_id)) {
      res.status(400).send(this.errorPage('Bilinmeyen client_id'));
      return;
    }
    if (!redirect_uri) {
      res.status(400).send(this.errorPage('redirect_uri eksik'));
      return;
    }

    let userId: string;
    try {
      userId = await this.oauth.validateAdmin(email, password);
    } catch {
      res.status(401).send(
        this.consentPage({
          clientId: client_id,
          redirectUri: redirect_uri,
          scope: scope || DEFAULT_SCOPE,
          state: state || '',
          error: 'E-posta veya şifre hatalı (yalnızca yönetici yetkilendirebilir).',
        }),
      );
      return;
    }

    const code = await this.oauth.createAuthCode({
      clientId: client_id,
      redirectUri: redirect_uri,
      scope: scope || DEFAULT_SCOPE,
      userId,
    });

    const sep = redirect_uri.includes('?') ? '&' : '?';
    const target =
      `${redirect_uri}${sep}code=${encodeURIComponent(code)}` +
      (state ? `&state=${encodeURIComponent(state)}` : '');
    res.redirect(302, target);
  }

  // ─── HTML şablonları ──────────────────────────────────────────────────────────

  private consentPage(p: {
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    error?: string;
  }): string {
    const scopes = p.scope
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => `<li>${this.esc(s)}</li>`)
      .join('');
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sadoksan ERP — Yetkilendirme</title>
<style>
  body{font-family:system-ui,Arial,sans-serif;background:#f4f5f7;margin:0;padding:40px;color:#1f2933}
  .card{max-width:420px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);padding:32px}
  h1{font-size:20px;margin:0 0 4px}
  .sub{color:#6b7280;font-size:14px;margin-bottom:20px}
  ul{background:#f9fafb;border-radius:8px;padding:12px 12px 12px 28px;font-size:13px;color:#374151}
  label{display:block;font-size:13px;font-weight:600;margin:14px 0 4px}
  input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
  button{width:100%;margin-top:20px;padding:12px;background:#2563eb;color:#fff;border:0;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
  .err{background:#fef2f2;color:#b91c1c;border-radius:8px;padding:10px;font-size:13px;margin-bottom:14px}
</style></head><body>
<div class="card">
  <h1>Sadoksan ERP</h1>
  <div class="sub"><strong>Entegra</strong> hesabınıza erişim izni istiyor.</div>
  ${p.error ? `<div class="err">${this.esc(p.error)}</div>` : ''}
  <div>İstenen yetkiler:</div>
  <ul>${scopes}</ul>
  <form method="post" action="/panel/auth">
    <input type="hidden" name="client_id" value="${this.esc(p.clientId)}">
    <input type="hidden" name="redirect_uri" value="${this.esc(p.redirectUri)}">
    <input type="hidden" name="scope" value="${this.esc(p.scope)}">
    <input type="hidden" name="state" value="${this.esc(p.state)}">
    <label>Yönetici e-posta</label>
    <input type="email" name="email" required autocomplete="username">
    <label>Şifre</label>
    <input type="password" name="password" required autocomplete="current-password">
    <button type="submit">Onayla ve Bağlan</button>
  </form>
</div></body></html>`;
  }

  private errorPage(msg: string): string {
    return `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<title>Hata</title></head><body style="font-family:system-ui,Arial;padding:40px">
<h2>Yetkilendirme hatası</h2><p>${this.esc(msg)}</p></body></html>`;
  }
}
