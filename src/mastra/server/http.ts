import http from 'node:http';
import { env } from '../config/env.js';
import { hteMcpServer } from './mcp-server.js';

const port = env.MCP_HTTP_PORT;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://localhost:${port}`);

  await hteMcpServer.startHTTP({
    url,
    httpPath: '/mcp',
    req,
    res,
  });
});

server.listen(port, () => {
  console.log(`HTE MCP HTTP server listening on http://localhost:${port}/mcp`);
});
