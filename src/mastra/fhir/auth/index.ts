import { OidcPkceAuthStrategy } from './oidc-pkce.js';

export interface AuthStrategy {
  getAuthHeaders(): Promise<Record<string, string>>;
  isAuthenticated(): boolean;
}

let authStrategy: AuthStrategy | null = null;

export function createAuthStrategy(): OidcPkceAuthStrategy {
  if (!authStrategy) {
    authStrategy = new OidcPkceAuthStrategy();
  }
  return authStrategy as OidcPkceAuthStrategy;
}

export { OidcPkceAuthStrategy } from './oidc-pkce.js';
export { TokenStore, type TokenSet } from './token-store.js';
