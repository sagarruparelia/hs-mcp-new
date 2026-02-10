import { z } from 'zod';
import { ALLERGY_CATEGORIES, ALLERGY_CRITICALITIES, CLINICAL_STATUSES } from '../config/constants.js';
import { createFhirSearchTool } from './_shared/fhir-tool-factory.js';

export const searchAllergyIntolerances = createFhirSearchTool({
  id: 'searchAllergyIntolerances',
  description: 'Search for patient allergies and intolerances.',
  resourceType: 'AllergyIntolerance',
  extraInputSchema: z.object({
    clinicalStatus: z.enum(CLINICAL_STATUSES).optional().describe('Clinical status (e.g., active, resolved)'),
    category: z.enum(ALLERGY_CATEGORIES).optional().describe('Allergy category (food, medication, environment, biologic)'),
    criticality: z.enum(ALLERGY_CRITICALITIES).optional().describe('Allergy criticality (low, high, unable-to-assess)'),
  }),
  buildSearchParams: (input) => ({
    patient: input.patientId,
    'clinical-status': input.clinicalStatus,
    category: input.category,
    criticality: input.criticality,
  }),
});
