import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SAFETY_DISCLAIMER } from '../config/constants.js';
import { getFhirClient } from '../fhir/client.js';
import type {
  FhirPatient,
  FhirCondition,
  FhirMedicationRequest,
  FhirAllergyIntolerance,
  FhirObservation,
  FhirImmunization,
  FhirBundle,
  FhirResource,
} from '../fhir/types.js';

const emptyBundle = { resourceType: 'Bundle' as const, type: 'searchset' as const, entry: [] };

export const getPatientHealthSummary = createTool({
  id: 'getPatientHealthSummary',
  description: `Get a comprehensive health summary for a patient including demographics, active conditions, current medications, allergies, recent vitals, and immunizations. Use this for broad "tell me about this patient" questions.\n\n${SAFETY_DISCLAIMER}`,
  inputSchema: z.object({
    patientId: z.string().describe('The FHIR Patient resource ID'),
  }),
  outputSchema: z.object({
    patient: z.record(z.string(), z.unknown()).optional(),
    activeConditions: z.array(z.record(z.string(), z.unknown())),
    activeMedications: z.array(z.record(z.string(), z.unknown())),
    allergies: z.array(z.record(z.string(), z.unknown())),
    recentVitals: z.array(z.record(z.string(), z.unknown())),
    immunizations: z.array(z.record(z.string(), z.unknown())),
  }),
  mcp: {
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  execute: async (input) => {
    const client = getFhirClient();
    const { patientId } = input;

    const [patient, conditions, medications, allergies, vitals, immunizations] = await Promise.all([
      client.read<FhirPatient>('Patient', patientId).catch(() => undefined),
      client
        .search<FhirCondition>('Condition', {
          patient: patientId,
          'clinical-status': 'active',
          _count: '20',
        })
        .catch(() => emptyBundle as FhirBundle<FhirCondition>),
      client
        .search<FhirMedicationRequest>('MedicationRequest', {
          patient: patientId,
          status: 'active',
          _count: '20',
        })
        .catch(() => emptyBundle as FhirBundle<FhirMedicationRequest>),
      client
        .search<FhirAllergyIntolerance>('AllergyIntolerance', {
          patient: patientId,
          _count: '20',
        })
        .catch(() => emptyBundle as FhirBundle<FhirAllergyIntolerance>),
      client
        .search<FhirObservation>('Observation', {
          patient: patientId,
          category: 'vital-signs',
          _sort: '-date',
          _count: '10',
        })
        .catch(() => emptyBundle as FhirBundle<FhirObservation>),
      client
        .search<FhirImmunization>('Immunization', {
          patient: patientId,
          _sort: '-date',
          _count: '20',
        })
        .catch(() => emptyBundle as FhirBundle<FhirImmunization>),
    ]);

    const extractResources = <T extends FhirResource>(bundle: FhirBundle<T>) =>
      (bundle.entry ?? []).map((e) => e.resource).filter(Boolean) as T[];

    return {
      patient: patient as unknown as Record<string, unknown> | undefined,
      activeConditions: extractResources(conditions),
      activeMedications: extractResources(medications),
      allergies: extractResources(allergies),
      recentVitals: extractResources(vitals),
      immunizations: extractResources(immunizations),
    };
  },
});
