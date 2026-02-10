import { Agent } from '@mastra/core/agent';
import type { Tool } from '@mastra/core/tools';
import { Memory } from '@mastra/memory';
import { HTE_AGENT_INSTRUCTIONS } from './instructions.js';

export function createHteAgent(tools: Record<string, Tool<any, any, any, any>>, instructions?: string) {
  return new Agent({
    id: 'hte-agent',
    name: 'Health Data Navigator',
    description: 'A patient-facing AI agent that helps users understand and navigate their clinical health data from FHIR-compliant electronic health records.',
    instructions: instructions ?? HTE_AGENT_INSTRUCTIONS,
    model: {
      id: 'anthropic/claude-sonnet-4-5-20250929',
    },
    tools,
    memory: new Memory(),
  });
}
