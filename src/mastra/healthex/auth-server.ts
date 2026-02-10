/**
 * HealthEx OAuth status page + PKCE callback server.
 *
 * Serves a simple UI at the HEALTHEX_REDIRECT_URI port showing connection
 * status and a "Connect" button to initiate the OAuth PKCE flow.
 * After successful auth, touches a source file to trigger mastra dev hot-reload.
 */

import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { utimes } from 'node:fs/promises';
import { env } from '../config/env.js';
import { HealthExAuth } from './auth.js';
import { loadTokens } from './token-persistence.js';

const REDIRECT_URI = env.HEALTHEX_REDIRECT_URI;
const redirectUrl = new URL(REDIRECT_URI);
const PORT = Number(redirectUrl.port) || 4111;
const CALLBACK_PATH = redirectUrl.pathname;

// PKCE session state (lives for the duration of one auth attempt)
let pendingSession: {
  codeVerifier: string;
  state: string;
  clientId: string;
} | null = null;

const auth = new HealthExAuth();

async function getClientId(): Promise<string> {
  if (env.HEALTHEX_CLIENT_ID) return env.HEALTHEX_CLIENT_ID;

  const existing = await loadTokens();
  if (existing?.clientId) return existing.clientId;

  // Dynamic registration
  const clientId = await auth.registerClient('HTE Local Dev', REDIRECT_URI);
  return clientId;
}

function statusPage(connected: boolean, message?: string): string {
  const statusColor = connected ? '#22c55e' : '#f59e0b';
  const statusText = connected ? 'Connected' : 'Not Connected';
  const statusIcon = connected ? '&#10003;' : '&#9679;';
  const messageHtml = message ? `<p class="message">${message}</p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HealthEx MCP — Connection Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0a; color: #e5e5e5;
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh;
    }
    .card {
      background: #171717; border: 1px solid #262626; border-radius: 12px;
      padding: 40px; max-width: 460px; width: 100%;
    }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    .subtitle { color: #a3a3a3; font-size: 14px; margin-bottom: 28px; }
    .status {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; background: #0a0a0a; border-radius: 8px;
      margin-bottom: 24px; font-size: 15px;
    }
    .status-dot {
      font-size: 12px; color: ${statusColor};
    }
    .status-label { color: ${statusColor}; font-weight: 500; }
    .connect-btn {
      display: inline-block; width: 100%; padding: 12px;
      background: #2563eb; color: #fff; border: none; border-radius: 8px;
      font-size: 15px; font-weight: 500; cursor: pointer;
      text-align: center; text-decoration: none;
      transition: background 0.15s;
    }
    .connect-btn:hover { background: #1d4ed8; }
    .connect-btn.disabled {
      background: #1f2937; color: #6b7280; cursor: default;
      pointer-events: none;
    }
    .message {
      padding: 12px 16px; background: #052e16; border: 1px solid #15803d;
      border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #86efac;
    }
    .message.error {
      background: #2d0a0a; border-color: #991b1b; color: #fca5a5;
    }
    .info {
      margin-top: 20px; font-size: 13px; color: #525252; line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>HealthEx MCP</h1>
    <p class="subtitle">OAuth 2.0 PKCE Connection</p>

    <div class="status">
      <span class="status-dot">${statusIcon}</span>
      <span class="status-label">${statusText}</span>
    </div>

    ${messageHtml}

    ${
      connected
        ? '<a class="connect-btn disabled">Connected</a>'
        : '<a class="connect-btn" href="/healthex/connect">Connect to HealthEx</a>'
    }

    <p class="info">
      ${
        connected
          ? 'Tokens saved to <code>~/.hte/healthex-tokens.json</code>. The app will reload automatically.'
          : 'Click Connect to authorize this app with HealthEx via OAuth 2.0 PKCE. No secrets are stored — only access and refresh tokens.'
      }
    </p>
  </div>
</body>
</html>`;
}

function errorPage(error: string): string {
  return statusPage(false, `<span class="error">${error}</span>`).replace(
    'class="message"',
    'class="message error"',
  );
}

async function triggerHotReload(): Promise<void> {
  // Touch a source file to trigger mastra dev file watcher
  const target = new URL('../index.ts', import.meta.url).pathname;
  const now = new Date();
  try {
    await utimes(target, now, now);
  } catch {
    // Non-critical — user can restart manually
  }
}

export function startHealthExAuthServer(): void {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://localhost:${PORT}`);

    // Status page
    if (url.pathname === '/' || url.pathname === '/healthex') {
      const tokens = await loadTokens();
      const connected = tokens !== null && Date.now() < tokens.expiresAt;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(statusPage(connected));
      return;
    }

    // JSON status API
    if (url.pathname === '/healthex/status') {
      const tokens = await loadTokens();
      const connected = tokens !== null && Date.now() < tokens.expiresAt;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        connected,
        expiresAt: tokens?.expiresAt ?? null,
        scope: tokens?.scope ?? null,
      }));
      return;
    }

    // Initiate OAuth flow
    if (url.pathname === '/healthex/connect') {
      try {
        const clientId = await getClientId();
        const { codeVerifier, codeChallenge } = auth.generatePkce();
        const state = randomBytes(16).toString('hex');

        pendingSession = { codeVerifier, state, clientId };

        const authorizeUrl = auth.buildAuthorizationUrl(clientId, REDIRECT_URI, codeChallenge, state);
        res.writeHead(302, { Location: authorizeUrl });
        res.end();
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage(`Failed to start auth flow: ${err}`));
      }
      return;
    }

    // OAuth callback
    if (url.pathname === CALLBACK_PATH) {
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        const desc = url.searchParams.get('error_description') || error;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage(`Authorization denied: ${desc}`));
        pendingSession = null;
        return;
      }

      if (!pendingSession || !code || returnedState !== pendingSession.state) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage('Invalid callback — state mismatch or no pending session. Try connecting again.'));
        pendingSession = null;
        return;
      }

      try {
        await auth.exchangeCode(
          pendingSession.clientId,
          REDIRECT_URI,
          code,
          pendingSession.codeVerifier,
        );
        pendingSession = null;

        // Trigger hot reload so HealthEx tools load
        await triggerHotReload();

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(statusPage(true, 'Tokens saved. App is reloading with HealthEx tools...'));
      } catch (err) {
        pendingSession = null;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(errorPage(`Token exchange failed: ${err}`));
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      // Previous instance still running (hot-reload) — that's fine
      console.log(`HealthEx auth UI already running on http://localhost:${PORT}/healthex`);
    } else {
      console.error('HealthEx auth server error:', err);
    }
  });

  server.listen(PORT, () => {
    console.log(`HealthEx auth UI: http://localhost:${PORT}/healthex`);
  });
}
