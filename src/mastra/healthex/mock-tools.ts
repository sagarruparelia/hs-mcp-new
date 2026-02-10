import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const mockSummary = `# Patient Health Summary (Mock Data)

**Patient:** Jane Doe, DOB 1985-03-22, Female
**MRN:** HEX-00042

## Active Conditions
- Type 2 Diabetes Mellitus (diagnosed 2019-06-15)
- Essential Hypertension (diagnosed 2020-01-10)
- Seasonal Allergic Rhinitis (diagnosed 2017-04-01)

## Current Medications
- Metformin 500mg twice daily
- Lisinopril 10mg once daily
- Cetirizine 10mg as needed

## Recent Vitals (2024-12-01)
- Blood Pressure: 128/82 mmHg
- Heart Rate: 74 bpm
- Temperature: 98.4 F
- BMI: 27.3
- HbA1c: 6.8% (2024-11-15)

## Allergies
- Penicillin (rash)
- Sulfa drugs (hives)
`;

const mockSearchResults = `# Search Results (Mock Data)

Found 3 matching records:

1. **Observation** (2024-12-01) - Blood Pressure: 128/82 mmHg
2. **Observation** (2024-11-15) - HbA1c: 6.8%
3. **Condition** (2019-06-15) - Type 2 Diabetes Mellitus, status: active
`;

const mockClinicalNotes = `# Clinical Notes Search (Mock Data)

## Progress Note — 2024-12-01
**Provider:** Dr. Sarah Chen, Internal Medicine

Patient presents for routine follow-up of Type 2 DM and HTN.
Reports good medication adherence. No hypoglycemic episodes.
Diet and exercise regimen maintained. Blood pressure at goal.
HbA1c improved from 7.1% to 6.8% — continue current regimen.

**Plan:** Continue Metformin 500mg BID, Lisinopril 10mg daily.
Follow up in 3 months with repeat HbA1c and metabolic panel.
`;

export const healthex_get_health_summary = createTool({
  id: 'healthex_get_health_summary',
  description: 'Get a comprehensive health summary from HealthEx. Returns demographics, conditions, medications, vitals, and allergies.',
  inputSchema: z.object({
    patientId: z.string().optional().describe('Patient identifier (optional — defaults to current patient)'),
  }),
  outputSchema: z.object({ summary: z.string() }),
  execute: async () => ({ summary: mockSummary }),
});

export const healthex_search = createTool({
  id: 'healthex_search',
  description: 'Natural language search across all HealthEx patient records.',
  inputSchema: z.object({
    query: z.string().describe('Natural language search query'),
    limit: z.number().int().min(1).max(50).default(10).describe('Max results to return'),
  }),
  outputSchema: z.object({ results: z.string() }),
  execute: async () => ({ results: mockSearchResults }),
});

export const healthex_search_clinical_notes = createTool({
  id: 'healthex_search_clinical_notes',
  description: 'Search clinical notes and documentation in HealthEx.',
  inputSchema: z.object({
    query: z.string().describe('Search term or phrase to find in clinical notes'),
    dateFrom: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    dateTo: z.string().optional().describe('End date (YYYY-MM-DD)'),
  }),
  outputSchema: z.object({ notes: z.string() }),
  execute: async () => ({ notes: mockClinicalNotes }),
});

export const mockHealthExTools = {
  healthex_get_health_summary,
  healthex_search,
  healthex_search_clinical_notes,
} as const;
