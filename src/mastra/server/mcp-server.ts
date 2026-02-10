import { MCPServer } from '@mastra/mcp';
import { allTools } from '../tools/index.js';
import { hteAgent } from '../agents/hte-agent.js';

export const hteMcpServer = new MCPServer({
  name: 'HTE Health Data Server',
  version: '0.1.0',
  description: 'MCP server exposing clinical health data tools and the Health Data Navigator agent for external AI agents.',
  tools: allTools,
  agents: { hteAgent },
});
