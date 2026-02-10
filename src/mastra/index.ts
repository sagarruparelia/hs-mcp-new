import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';

export const mastra = new Mastra({
  agents: {},
  tools: {},
  storage: new LibSQLStore({
    id: 'hte-storage',
    url: 'file:./hte.db',
  }),
  logger: new PinoLogger({
    name: 'HTE',
    level: 'info',
  }),
});
