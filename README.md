# HTE - Health Tech Ecosystem

Agent and MCP server for navigating health data with clinical AI.

## Getting Started

```shell
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm install
npm run dev
```

Opens Mastra Studio at [http://localhost:4111](http://localhost:4111).

## Project Structure

```
src/mastra/
  agents/     # Clinical AI agents
  tools/      # Health data tools
  index.ts    # Mastra configuration
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
