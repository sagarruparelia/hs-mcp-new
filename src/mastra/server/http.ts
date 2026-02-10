import http from 'node:http';
import { env } from '../config/env.js';
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
