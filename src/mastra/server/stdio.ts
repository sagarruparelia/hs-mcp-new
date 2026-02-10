import { allTools } from '../tools/index.js';
import { getHealthExTools } from '../healthex/index.js';
import { createHteAgent } from '../agents/index.js';
import { createHteMcpServer } from './mcp-server.js';

let healthExTools: Record<string, any> = {};
try {
  healthExTools = await getHealthExTools();
} catch {
  // HealthEx not available — FHIR-only mode
}

const mergedTools = { ...allTools, ...healthExTools };
const hteAgent = createHteAgent(mergedTools);
const hteMcpServer = createHteMcpServer(mergedTools, hteAgent);

hteMcpServer.startStdio().catch((err: unknown) => {
  console.error('Failed to start MCP stdio server:', err);
  process.exit(1);
});
