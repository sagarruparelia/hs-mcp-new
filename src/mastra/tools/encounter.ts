import { z } from 'zod';
import { ENCOUNTER_CLASSES } from '../config/constants.js';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchEncounters = createFhirSearchTool({
  id: 'searchEncounters',
  description: 'Search for patient encounters (visits, admissions, etc.).',
  resourceType: 'Encounter',
  extraInputSchema: z.object({
    status: z.string().optional().describe('Encounter status (e.g., planned, arrived, in-progress, finished)'),
    class: z.enum(ENCOUNTER_CLASSES).optional().describe('Encounter class (inpatient, outpatient, emergency, etc.)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    class: input.class,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
