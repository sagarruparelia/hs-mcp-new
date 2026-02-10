import { z } from 'zod';
import { MEDICATION_STATUSES } from '../config/constants.js';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchMedicationRequests = createFhirSearchTool({
  id: 'searchMedicationRequests',
  description: 'Search for patient medication requests and prescriptions.',
  resourceType: 'MedicationRequest',
  extraInputSchema: z.object({
    status: z.enum(MEDICATION_STATUSES).optional().describe('Medication request status (e.g., active, completed, stopped)'),
    intent: z.string().optional().describe('Medication request intent (e.g., order, plan)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    intent: input.intent,
    authoredon: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-authoredon',
  }),
});
