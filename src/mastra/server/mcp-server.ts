import { MCPServer } from '@mastra/mcp';
import type { Agent } from '@mastra/core/agent';
import type { Tool } from '@mastra/core/tools';

export function createHteMcpServer(
  tools: Record<string, Tool<any, any, any, any>>,
  hteAgent: Agent,
) {
  return new MCPServer({
    name: 'HTE Health Data Server',
    version: '0.1.0',
    description: 'MCP server exposing clinical health data tools and the Health Data Navigator agent for external AI agents.',
    tools,
    agents: { hteAgent },
  });
}
