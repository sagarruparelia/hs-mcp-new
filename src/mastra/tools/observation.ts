import { z } from 'zod';
import { OBSERVATION_CATEGORIES } from '../config/constants.js';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchObservations = createFhirSearchTool({
  id: 'searchObservations',
  description: 'Search for patient observations including lab results and vital signs.',
  resourceType: 'Observation',
  extraInputSchema: z.object({
    category: z.enum(OBSERVATION_CATEGORIES).optional().describe('Observation category (e.g., vital-signs, laboratory)'),
    code: z.string().optional().describe('LOINC code for the observation type'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    category: input.category,
    code: input.code,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
