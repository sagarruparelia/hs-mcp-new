import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '../../config/constants.js';

export const PatientIdParam = z.object({
  patientId: z.string().describe('The FHIR Patient resource ID'),
});

export const DateRangeParams = z.object({
  dateFrom: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
  dateTo: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
});

export const PaginationParams = z.object({
  _count: z
    .number()
    .int()
    .min(1)
    .max(PAGINATION_DEFAULTS.maxCount)
    .default(PAGINATION_DEFAULTS.count)
    .describe('Number of results per page'),
  _offset: z.number().int().min(0).default(0).describe('Result offset for pagination'),
});

export const SearchResultOutput = z.object({
  total: z.number().optional().describe('Total matching results'),
  results: z.array(z.record(z.string(), z.unknown())).describe('Array of FHIR resources'),
  hasMore: z.boolean().describe('Whether more results are available'),
});
