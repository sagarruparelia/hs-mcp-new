import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { MongoDBStore } from '@mastra/mongodb';
import { createHteAgent } from './agents/index.js';
import { allTools } from './tools/index.js';
import { getHealthExTools } from './healthex/index.js';
import { createHteMcpServer } from './server/mcp-server.js';
import { createObservability } from './observability/index.js';
import { env } from './config/env.js';

const logger = new PinoLogger({
  name: 'HTE',
  level: env.NODE_ENV === 'production' ? 'warn' : 'info',
});

// Initialize HealthEx MCP client and merge tools (graceful degradation)
let healthExTools: Record<string, any> = {};
try {
  healthExTools = await getHealthExTools();
} catch (err) {
  logger.warn('HealthEx MCP not available — run auth setup first', { error: err });
}

const mergedTools = { ...allTools, ...healthExTools };
const hteAgent = createHteAgent(mergedTools);
const hteMcpServer = createHteMcpServer(mergedTools, hteAgent);

export const mastra = new Mastra({
  agents: { hteAgent },
  tools: mergedTools,
  storage: new MongoDBStore({
    id: 'hte-storage',
    uri: env.MONGODB_URI,
    dbName: 'hte',
  }),
  logger,
  mcpServers: { hteMcpServer },
  observability: createObservability(),
});
