export { searchPatients, getPatient } from './patient.js';
export { searchObservations } from './observation.js';
export { searchConditions } from './condition.js';
export { searchMedicationRequests } from './medication-request.js';
export { searchAllergyIntolerances } from './allergy-intolerance.js';
export { searchImmunizations } from './immunization.js';
export { searchEncounters } from './encounter.js';
export { searchProcedures } from './procedure.js';
export { searchDocumentReferences } from './document-reference.js';
export { searchCarePlans } from './care-plan.js';
export { searchDiagnosticReports } from './diagnostic-report.js';
export { searchClinicalImpressions } from './clinical-impression.js';
export { getPatientHealthSummary } from './patient-summary.js';

import { searchPatients, getPatient } from './patient.js';
import { searchObservations } from './observation.js';
import { searchConditions } from './condition.js';
import { searchMedicationRequests } from './medication-request.js';
import { searchAllergyIntolerances } from './allergy-intolerance.js';
import { searchImmunizations } from './immunization.js';
import { searchEncounters } from './encounter.js';
import { searchProcedures } from './procedure.js';
import { searchDocumentReferences } from './document-reference.js';
import { searchCarePlans } from './care-plan.js';
import { searchDiagnosticReports } from './diagnostic-report.js';
import { searchClinicalImpressions } from './clinical-impression.js';
import { getPatientHealthSummary } from './patient-summary.js';

export const allTools = {
  searchPatients,
  getPatient,
  searchObservations,
  searchConditions,
  searchMedicationRequests,
  searchAllergyIntolerances,
  searchImmunizations,
  searchEncounters,
  searchProcedures,
  searchDocumentReferences,
  searchCarePlans,
  searchDiagnosticReports,
  searchClinicalImpressions,
  getPatientHealthSummary,
} as const;
