/** In-memory token storage with auto-refresh awareness */

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number; // epoch ms
  tokenType: string;
  scope?: string;
}

const EXPIRY_BUFFER_MS = 60_000; // 60 seconds

export class TokenStore {
  private tokens: TokenSet | null = null;

  set(tokens: TokenSet): void {
    this.tokens = tokens;
  }

  get(): TokenSet | null {
    return this.tokens;
  }

  clear(): void {
    this.tokens = null;
  }

  isExpired(): boolean {
    if (!this.tokens) return true;
    return Date.now() >= this.tokens.expiresAt - EXPIRY_BUFFER_MS;
  }

  hasRefreshToken(): boolean {
    return !!this.tokens?.refreshToken;
  }
}
