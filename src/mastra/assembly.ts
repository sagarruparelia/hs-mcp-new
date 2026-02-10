import type { Tool } from '@mastra/core/tools';
import { env, fhirEnabled, healthExEnabled } from './config/env.js';
import { allTools } from './tools/index.js';
import { getHealthExTools } from './healthex/index.js';
import { mockHealthExTools } from './healthex/mock-tools.js';
import { startHealthExAuthServer } from './healthex/auth-server.js';
import { buildInstructions } from './agents/instructions.js';
import { createHteAgent } from './agents/index.js';
import { createHteMcpServer } from './server/mcp-server.js';

export async function assemble(logger?: { warn: (msg: string, meta?: Record<string, unknown>) => void }) {
  let tools: Record<string, Tool<any, any, any, any>> = {};
  let healthExLoaded = false;

  if (fhirEnabled) {
    tools = { ...tools, ...allTools };
  }

  if (healthExEnabled) {
    if (env.HEALTHEX_MOCK) {
      tools = { ...tools, ...mockHealthExTools };
      healthExLoaded = true;
      logger?.warn('HealthEx running in MOCK mode — using sample data', {});
    } else {
      try {
        const healthExTools = await getHealthExTools();
        tools = { ...tools, ...healthExTools };
        healthExLoaded = true;
      } catch {
        // Start auth UI so user can connect via browser
        startHealthExAuthServer();
        logger?.warn('HealthEx not connected — visit the auth UI to connect', {});
      }
    }
  }

  const instructions = buildInstructions({
    fhir: fhirEnabled,
    healthEx: healthExEnabled && healthExLoaded,
  });
  const agent = createHteAgent(tools, instructions);
  const mcpServer = createHteMcpServer(tools, agent);

  return { tools, agent, mcpServer };
}
