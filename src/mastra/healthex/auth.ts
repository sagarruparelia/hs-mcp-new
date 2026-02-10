import { createHash, randomBytes } from 'node:crypto';
import { loadTokens, saveTokens, clearTokens, type PersistedTokens } from './token-persistence.js';

const HEALTHEX_BASE = 'https://api.healthex1.io';
const AUTHORIZE_URL = `${HEALTHEX_BASE}/oauth/authorize`;
const TOKEN_URL = `${HEALTHEX_BASE}/oauth/token`;
const REGISTER_URL = `${HEALTHEX_BASE}/oauth/register`;

const EXPIRY_BUFFER_MS = 60_000; // refresh 60s before expiry

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

function generateCodeVerifier(): string {
  return base64url(randomBytes(64));
}

function generateCodeChallenge(verifier: string): string {
  return base64url(createHash('sha256').update(verifier).digest());
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export class HealthExAuth {
  private refreshPromise: Promise<string> | null = null;
  private cachedTokens: PersistedTokens | null = null;

  /** Register a new OAuth client with HealthEx (only needed if no HEALTHEX_CLIENT_ID set) */
  async registerClient(clientName: string, redirectUri: string): Promise<string> {
    const res = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: clientName,
        redirect_uris: [redirectUri],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HealthEx client registration failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    return data.client_id;
  }

  /** Generate PKCE pair */
  generatePkce(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    return { codeVerifier, codeChallenge };
  }

  /** Build the HealthEx authorization URL for browser redirect */
  buildAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    codeChallenge: string,
    state: string,
  ): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'patient/*.read offline_access',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /** Exchange authorization code for tokens */
  async exchangeCode(
    clientId: string,
    redirectUri: string,
    code: string,
    codeVerifier: string,
  ): Promise<PersistedTokens> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HealthEx token exchange failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    const tokens: PersistedTokens = {
      clientId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? '',
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope ?? 'patient/*.read offline_access',
    };

    await saveTokens(tokens);
    this.cachedTokens = tokens;
    return tokens;
  }

  /** Refresh the access token using refresh_token grant */
  async refreshAccessToken(clientId: string, refreshToken: string): Promise<PersistedTokens> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    });

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      await clearTokens();
      this.cachedTokens = null;
      const text = await res.text();
      throw new Error(`HealthEx token refresh failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as TokenResponse;
    const tokens: PersistedTokens = {
      clientId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken, // handle token rotation
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope ?? this.cachedTokens?.scope ?? 'patient/*.read offline_access',
    };

    await saveTokens(tokens);
    this.cachedTokens = tokens;
    return tokens;
  }

  /** Get a valid access token, refreshing if expired. Deduplicates concurrent calls. */
  async getValidAccessToken(): Promise<string> {
    if (!this.cachedTokens) {
      this.cachedTokens = await loadTokens();
    }

    if (!this.cachedTokens) {
      throw new Error('No HealthEx tokens available. Run auth setup first.');
    }

    const isExpired = Date.now() >= this.cachedTokens.expiresAt - EXPIRY_BUFFER_MS;
    if (!isExpired) {
      return this.cachedTokens.accessToken;
    }

    // Deduplicate concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken(
        this.cachedTokens.clientId,
        this.cachedTokens.refreshToken,
      )
        .then((tokens) => tokens.accessToken)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }
}

let authInstance: HealthExAuth | null = null;

export function getHealthExAuth(): HealthExAuth {
  if (!authInstance) {
    authInstance = new HealthExAuth();
  }
  return authInstance;
}
