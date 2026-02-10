import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SAFETY_DISCLAIMER } from '../config/constants.js';
import { getFhirClient } from '../fhir/client.js';
import type { FhirPatient, FhirBundle } from '../fhir/types.js';
import { PaginationParams, SearchResultOutput } from './_shared/schemas.js';

export const searchPatients = createTool({
  id: 'searchPatients',
  description: `Search for patients by name, identifier, or birth date.\n\n${SAFETY_DISCLAIMER}`,
  inputSchema: PaginationParams.merge(
    z.object({
      name: z.string().optional().describe('Patient name (partial match)'),
      identifier: z.string().optional().describe('Patient identifier (e.g., MRN)'),
      birthdate: z.string().optional().describe('Date of birth (YYYY-MM-DD)'),
    }),
  ),
  outputSchema: SearchResultOutput,
  mcp: {
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  execute: async (input) => {
    const client = getFhirClient();
    const params: Record<string, string | undefined> = {
      name: input.name,
      identifier: input.identifier,
      birthdate: input.birthdate,
      _count: String(input._count),
    };
    if (input._offset > 0) params._offset = String(input._offset);

    const bundle = await client.search<FhirPatient>('Patient', params);
    const results = (bundle.entry ?? []).map((e) => e.resource).filter((r): r is FhirPatient => !!r);
    return {
      total: bundle.total,
      results,
      hasMore: bundle.link?.some((l) => l.relation === 'next') ?? false,
    };
  },
});

export const getPatient = createTool({
  id: 'getPatient',
  description: `Get a single patient record by their FHIR resource ID.\n\n${SAFETY_DISCLAIMER}`,
  inputSchema: z.object({
    patientId: z.string().describe('The FHIR Patient resource ID'),
  }),
  outputSchema: z.object({
    resource: z.record(z.string(), z.unknown()).describe('The Patient FHIR resource'),
  }),
  mcp: {
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  execute: async (input) => {
    const client = getFhirClient();
    const resource = await client.read<FhirPatient>('Patient', input.patientId);
    return { resource: resource as unknown as Record<string, unknown> };
  },
});
