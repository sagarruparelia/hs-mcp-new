import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface PersistedTokens {
  clientId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  scope: string;
}

const TOKEN_DIR = join(homedir(), '.hte');
const TOKEN_FILE = join(TOKEN_DIR, 'healthex-tokens.json');

export async function loadTokens(): Promise<PersistedTokens | null> {
  try {
    const data = await readFile(TOKEN_FILE, 'utf-8');
    return JSON.parse(data) as PersistedTokens;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: PersistedTokens): Promise<void> {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
}

export async function clearTokens(): Promise<void> {
  try {
    await unlink(TOKEN_FILE);
  } catch {
    // File may not exist — ignore
  }
}
