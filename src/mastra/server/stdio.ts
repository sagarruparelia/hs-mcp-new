import { hteMcpServer } from './mcp-server.js';

hteMcpServer.startStdio().catch((err) => {
  console.error('Failed to start MCP stdio server:', err);
  process.exit(1);
});
