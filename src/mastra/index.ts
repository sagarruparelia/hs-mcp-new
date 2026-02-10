import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { MongoDBStore } from '@mastra/mongodb';
import { hteAgent } from './agents/index.js';
import { allTools } from './tools/index.js';
import { hteMcpServer } from './server/mcp-server.js';
import { createObservability } from './observability/index.js';
import { env } from './config/env.js';

export const mastra = new Mastra({
  agents: { hteAgent },
  tools: allTools,
  storage: new MongoDBStore({
    id: 'hte-storage',
    uri: env.MONGODB_URI,
    dbName: 'hte',
  }),
  logger: new PinoLogger({
    name: 'HTE',
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
  }),
  mcpServers: { hteMcpServer },
  observability: createObservability(),
});
