import { z } from 'zod';
import { CLINICAL_STATUSES } from '../config/constants.js';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchConditions = createFhirSearchTool({
  id: 'searchConditions',
  description: 'Search for patient conditions and diagnoses.',
  resourceType: 'Condition',
  extraInputSchema: z.object({
    clinicalStatus: z.enum(CLINICAL_STATUSES).optional().describe('Clinical status (e.g., active, resolved)'),
    category: z.string().optional().describe('Condition category'),
    code: z.string().optional().describe('Condition code (ICD-10 or SNOMED CT)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    'clinical-status': input.clinicalStatus,
    category: input.category,
    code: input.code,
    'onset-date': buildDateParam(input.dateFrom, input.dateTo),
  }),
});
