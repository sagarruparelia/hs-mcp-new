import { z } from 'zod';
import { createFhirSearchTool, buildDateParam } from './_shared/fhir-tool-factory.js';

export const searchDocumentReferences = createFhirSearchTool({
  id: 'searchDocumentReferences',
  description: 'Search for patient document references (clinical notes, reports, etc.).',
  resourceType: 'DocumentReference',
  extraInputSchema: z.object({
    status: z.enum(['current', 'superseded', 'entered-in-error']).optional().describe('Document status'),
    type: z.string().optional().describe('Document type code'),
    category: z.string().optional().describe('Document category'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    status: input.status,
    type: input.type,
    category: input.category,
    date: buildDateParam(input.dateFrom, input.dateTo),
    _sort: '-date',
  }),
});
