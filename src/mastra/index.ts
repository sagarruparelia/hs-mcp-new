import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { MongoDBStore } from '@mastra/mongodb';
import { createObservability } from './observability/index.js';
import { env } from './config/env.js';
import { assemble } from './assembly.js';

const logger = new PinoLogger({
  name: 'HTE',
  level: env.NODE_ENV === 'production' ? 'warn' : 'info',
});

const { tools, agent: hteAgent, mcpServer: hteMcpServer } = await assemble(logger);

export const mastra = new Mastra({
  agents: { hteAgent },
  tools,
  storage: new MongoDBStore({
    id: 'hte-storage',
    uri: env.MONGODB_URI,
    dbName: 'hte',
  }),
  logger,
  mcpServers: { hteMcpServer },
  observability: createObservability(),
});
