import { z } from 'zod';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchClinicalImpressions = createFhirSearchTool({
  id: 'searchClinicalImpressions',
  description: 'Search for patient clinical impressions and assessments.',
  resourceType: 'ClinicalImpression',
  extraInputSchema: z.object({
    status: z.enum(['in-progress', 'completed', 'entered-in-error']).optional().describe('Clinical impression status'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
