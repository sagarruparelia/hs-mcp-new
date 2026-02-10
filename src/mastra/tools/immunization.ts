import { z } from 'zod';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchImmunizations = createFhirSearchTool({
  id: 'searchImmunizations',
  description: 'Search for patient immunization records.',
  resourceType: 'Immunization',
  extraInputSchema: z.object({
    status: z.enum(['completed', 'entered-in-error', 'not-done']).optional().describe('Immunization status'),
    vaccineCode: z.string().optional().describe('Vaccine code (CVX)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    'vaccine-code': input.vaccineCode,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
