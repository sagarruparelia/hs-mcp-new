import { assemble } from '../assembly.js';

const { mcpServer: hteMcpServer } = await assemble();

hteMcpServer.startStdio().catch((err: unknown) => {
  console.error('Failed to start MCP stdio server:', err);
  process.exit(1);
});
