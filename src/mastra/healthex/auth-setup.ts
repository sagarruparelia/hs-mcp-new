#!/usr/bin/env node
/**
 * HealthEx OAuth 2.0 PKCE auth setup.
 *
 * Usage:  npm run auth:healthex
 *
 * 1. Starts a temporary HTTP server for the OAuth callback
 * 2. Opens your browser to the HealthEx authorization page
 * 3. After you authorize, exchanges the code for tokens
 * 4. Saves tokens to ~/.hte/healthex-tokens.json
 * 5. Exits — you can now start the app with DATA_SOURCES=healthex
 */

import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { exec } from 'node:child_process';
import { HealthExAuth } from './auth.js';
import { loadTokens } from './token-persistence.js';

const REDIRECT_URI = process.env.HEALTHEX_REDIRECT_URI || 'http://localhost:4111/healthex/callback';
const redirectUrl = new URL(REDIRECT_URI);
const PORT = Number(redirectUrl.port) || 4111;
const CALLBACK_PATH = redirectUrl.pathname;

const auth = new HealthExAuth();

async function getClientId(): Promise<string> {
  // Use env var if set
  if (process.env.HEALTHEX_CLIENT_ID) {
    return process.env.HEALTHEX_CLIENT_ID;
  }

  // Check if we have a previous client ID in saved tokens
  const existing = await loadTokens();
  if (existing?.clientId) {
    console.log(`Using previously registered client ID: ${existing.clientId}`);
    return existing.clientId;
  }

  // Dynamic registration
  console.log('No HEALTHEX_CLIENT_ID set — registering new OAuth client...');
  const clientId = await auth.registerClient('HTE Local Dev', REDIRECT_URI);
  console.log(`Registered client ID: ${clientId}`);
  console.log('Tip: set HEALTHEX_CLIENT_ID=%s in .env to skip registration next time.\n', clientId);
  return clientId;
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} "${url}"`);
}

async function run(): Promise<void> {
  console.log('HealthEx OAuth PKCE Auth Setup\n');

  const clientId = await getClientId();
  const { codeVerifier, codeChallenge } = auth.generatePkce();
  const state = randomBytes(16).toString('hex');

  const authorizeUrl = auth.buildAuthorizationUrl(clientId, REDIRECT_URI, codeChallenge, state);

  // Start callback server
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://localhost:${PORT}`);

    if (url.pathname !== CALLBACK_PATH) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      const desc = url.searchParams.get('error_description') || error;
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h2>Authorization failed</h2><p>${desc}</p><p>You can close this tab.</p>`);
      console.error(`\nAuthorization failed: ${desc}`);
      shutdown(1);
      return;
    }

    if (!code || returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h2>Invalid callback</h2><p>Missing code or state mismatch.</p>');
      console.error('\nInvalid callback — state mismatch or missing code.');
      shutdown(1);
      return;
    }

    try {
      console.log('Exchanging authorization code for tokens...');
      const tokens = await auth.exchangeCode(clientId, REDIRECT_URI, code, codeVerifier);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<h2>HealthEx authorized!</h2>' +
          '<p>Tokens saved. You can close this tab and start the app.</p>',
      );

      console.log('\nTokens saved to ~/.hte/healthex-tokens.json');
      console.log('  scope:  %s', tokens.scope);
      console.log('  expiry: %s\n', new Date(tokens.expiresAt).toLocaleString());
      console.log('You can now run:  npm run dev');
      shutdown(0);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h2>Token exchange failed</h2><pre>${err}</pre>`);
      console.error('\nToken exchange failed:', err);
      shutdown(1);
    }
  });

  function shutdown(code: number): void {
    server.close(() => process.exit(code));
    // Force exit after 2s if server doesn't close cleanly
    setTimeout(() => process.exit(code), 2000);
  }

  server.listen(PORT, () => {
    console.log('Callback server listening on http://localhost:%d%s\n', PORT, CALLBACK_PATH);
    console.log('Opening browser for HealthEx authorization...');
    console.log('If the browser does not open, visit:\n');
    console.log('  %s\n', authorizeUrl);
    openBrowser(authorizeUrl);
  });
}

run().catch((err) => {
  console.error('Auth setup failed:', err);
  process.exit(1);
});
