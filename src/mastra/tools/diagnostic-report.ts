import { z } from 'zod';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchDiagnosticReports = createFhirSearchTool({
  id: 'searchDiagnosticReports',
  description: 'Search for patient diagnostic reports.',
  resourceType: 'DiagnosticReport',
  extraInputSchema: z.object({
    status: z.string().optional().describe('Report status (e.g., registered, partial, final)'),
    category: z.string().optional().describe('Report category'),
    code: z.string().optional().describe('Report code (LOINC)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    category: input.category,
    code: input.code,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
