import { MCPClient } from '@mastra/mcp';
import type { Tool } from '@mastra/core/tools';
import { getHealthExAuth } from './auth.js';

let mcpClient: MCPClient | null = null;

export async function getHealthExClient(): Promise<MCPClient> {
  if (mcpClient) return mcpClient;

  const auth = getHealthExAuth();

  // Validate that we have tokens before creating the client
  await auth.getValidAccessToken();

  mcpClient = new MCPClient({
    id: 'healthex',
    servers: {
      healthex: {
        url: new URL('https://api.healthex.io/mcp'),
        timeout: 60_000,
        fetch: async (url, init) => {
          const token = await auth.getValidAccessToken();
          return fetch(url, {
            ...init,
            headers: {
              ...(init?.headers as Record<string, string>),
              Authorization: `Bearer ${token}`,
            },
          });
        },
      },
    },
  });

  return mcpClient;
}

export async function getHealthExTools(): Promise<Record<string, Tool<any, any, any, any>>> {
  const client = await getHealthExClient();
  return client.listTools();
}
