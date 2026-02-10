import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { allTools } from '../tools/index.js';
import { HTE_AGENT_INSTRUCTIONS } from './instructions.js';

export const hteAgent = new Agent({
  id: 'hte-agent',
  name: 'Health Data Navigator',
  description: 'A patient-facing AI agent that helps users understand and navigate their clinical health data from FHIR-compliant electronic health records.',
  instructions: HTE_AGENT_INSTRUCTIONS,
  model: {
    id: 'anthropic/claude-sonnet-4-5-20250929',
  },
  tools: allTools,
  memory: new Memory(),
});
