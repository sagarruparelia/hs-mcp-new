import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import type { AuthStrategy } from './index.js';
import { TokenStore, type TokenSet } from './token-store.js';

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function generateCodeVerifier(): string {
  return base64url(randomBytes(32));
}

function generateCodeChallenge(verifier: string): string {
  return base64url(createHash('sha256').update(verifier).digest());
}

export class OidcPkceAuthStrategy implements AuthStrategy {
  private tokenStore = new TokenStore();
  private refreshPromise: Promise<void> | null = null;

  private get tokenEndpoint(): string {
    return `${env.HSID_ISSUER_URL}/oidc/token`;
  }

  private get authorizeEndpoint(): string {
    return `${env.HSID_ISSUER_URL}/oidc/authorize`;
  }

  /** Generate PKCE pair for initiating auth flow */
  generatePkce(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    return { codeVerifier, codeChallenge };
  }

  /** Build the HSID authorization URL for the browser redirect */
  buildAuthorizationUrl(codeChallenge: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.HSID_CLIENT_ID,
      redirect_uri: env.HSID_REDIRECT_URI,
      scope: 'openid profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });
    return `${this.authorizeEndpoint}?${params.toString()}`;
  }

  /** Exchange authorization code for tokens (no client_secret — public client) */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenSet> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.HSID_REDIRECT_URI,
      client_id: env.HSID_CLIENT_ID,
      code_verifier: codeVerifier,
    });

    const res = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token exchange failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const tokens: TokenSet = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type ?? 'Bearer',
      scope: data.scope,
    };
    this.tokenStore.set(tokens);
    return tokens;
  }

  /** Refresh the access token using the refresh_token grant */
  async refreshAccessToken(): Promise<void> {
    if (!this.tokenStore.hasRefreshToken()) {
      throw new Error('No refresh token available. Re-authentication required.');
    }

    const current = this.tokenStore.get()!;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken!,
      client_id: env.HSID_CLIENT_ID,
    });

    const res = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      this.tokenStore.clear();
      const text = await res.text();
      throw new Error(`Token refresh failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    this.tokenStore.set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? current.refreshToken,
      idToken: data.id_token ?? current.idToken,
      expiresAt: Date.now() + data.expires_in * 1000,
      tokenType: data.token_type ?? 'Bearer',
      scope: data.scope ?? current.scope,
    });
  }

  /** Get Authorization headers, auto-refreshing if expired */
  async getAuthHeaders(): Promise<Record<string, string>> {
    if (this.tokenStore.isExpired()) {
      // Deduplicate concurrent refresh calls
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAccessToken().finally(() => {
          this.refreshPromise = null;
        });
      }
      await this.refreshPromise;
    }

    const tokens = this.tokenStore.get();
    if (!tokens) {
      throw new Error('No tokens available. Authentication required.');
    }
    return { Authorization: `${tokens.tokenType} ${tokens.accessToken}` };
  }

  /** Manually set tokens (e.g., after initial auth callback) */
  setTokens(tokens: TokenSet): void {
    this.tokenStore.set(tokens);
  }

  /** Check if currently authenticated */
  isAuthenticated(): boolean {
    return this.tokenStore.get() !== null;
  }
}
