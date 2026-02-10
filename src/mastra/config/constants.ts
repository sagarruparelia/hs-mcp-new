export const FHIR_RESOURCE_TYPES = [
  'Patient',
  'Observation',
  'Condition',
  'MedicationRequest',
  'AllergyIntolerance',
  'Immunization',
  'Encounter',
  'Procedure',
  'DocumentReference',
  'CarePlan',
  'DiagnosticReport',
  'ClinicalImpression',
] as const;

export type FhirResourceType = (typeof FHIR_RESOURCE_TYPES)[number];

export const OBSERVATION_CATEGORIES = [
  'vital-signs',
  'laboratory',
  'social-history',
  'imaging',
  'exam',
  'survey',
  'therapy',
  'activity',
] as const;

export type ObservationCategory = (typeof OBSERVATION_CATEGORIES)[number];

export const CLINICAL_STATUSES = ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved'] as const;

export const MEDICATION_STATUSES = ['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft', 'unknown'] as const;

export const ENCOUNTER_CLASSES = ['inpatient', 'outpatient', 'emergency', 'ambulatory', 'observation', 'virtual'] as const;

export const ALLERGY_CATEGORIES = ['food', 'medication', 'environment', 'biologic'] as const;

export const ALLERGY_CRITICALITIES = ['low', 'high', 'unable-to-assess'] as const;

export const PAGINATION_DEFAULTS = {
  count: 20,
  maxCount: 100,
} as const;

export const SAFETY_DISCLAIMER = `
IMPORTANT: This information is retrieved from your health records for informational purposes only.
It does NOT constitute medical advice, diagnosis, or treatment. Always consult with a qualified
healthcare provider for medical decisions. If you are experiencing a medical emergency,
call 911 or your local emergency number immediately.
`.trim();
