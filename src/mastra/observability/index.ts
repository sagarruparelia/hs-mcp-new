import { Observability, DefaultExporter } from '@mastra/observability';
import { createPhiFilter } from './phi-filter.js';

export function createObservability(): Observability {
  return new Observability({
    configs: {
      default: {
        serviceName: 'hte-mcp',
        exporters: [new DefaultExporter()],
        spanOutputProcessors: [createPhiFilter()],
      },
    },
  });
}
