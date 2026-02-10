import { z } from 'zod';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchProcedures = createFhirSearchTool({
  id: 'searchProcedures',
  description: 'Search for patient procedures.',
  resourceType: 'Procedure',
  extraInputSchema: z.object({
    status: z.string().optional().describe('Procedure status (e.g., completed, in-progress)'),
    code: z.string().optional().describe('Procedure code (CPT or SNOMED CT)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    code: input.code,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
