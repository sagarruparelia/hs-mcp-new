import { z } from 'zod';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchCarePlans = createFhirSearchTool({
  id: 'searchCarePlans',
  description: 'Search for patient care plans.',
  resourceType: 'CarePlan',
  extraInputSchema: z.object({
    status: z.string().optional().describe('Care plan status (e.g., active, completed, revoked)'),
    category: z.string().optional().describe('Care plan category'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    category: input.category,
    date: buildDateParam(input.dateFrom, input.dateTo),
  }),
});
