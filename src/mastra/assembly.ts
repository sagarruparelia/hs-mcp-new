import type { Tool } from '@mastra/core/tools';
import { fhirEnabled, healthExEnabled } from './config/env.js';
import { allTools } from './tools/index.js';
import { getHealthExTools } from './healthex/index.js';
import { buildInstructions } from './agents/instructions.js';
import { createHteAgent } from './agents/index.js';
import { createHteMcpServer } from './server/mcp-server.js';

export async function assemble(logger?: { warn: (msg: string, meta?: Record<string, unknown>) => void }) {
  let tools: Record<string, Tool<any, any, any, any>> = {};

  if (fhirEnabled) {
    tools = { ...tools, ...allTools };
  }

  if (healthExEnabled) {
    try {
      const healthExTools = await getHealthExTools();
      tools = { ...tools, ...healthExTools };
    } catch (err) {
      logger?.warn('HealthEx MCP not available — run auth setup first', { error: err });
    }
  }

  const instructions = buildInstructions({ fhir: fhirEnabled, healthEx: healthExEnabled });
  const agent = createHteAgent(tools, instructions);
  const mcpServer = createHteMcpServer(tools, agent);

  return { tools, agent, mcpServer };
}
