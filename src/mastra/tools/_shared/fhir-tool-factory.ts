import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { SAFETY_DISCLAIMER } from '../../config/constants.js';
import { getFhirClient } from '../../fhir/client.js';
import type { FhirBundle, FhirResource } from '../../fhir/types.js';
import { PatientIdParam, DateRangeParams, PaginationParams, SearchResultOutput } from './schemas.js';

export interface FhirSearchToolConfig {
  id: string;
  description: string;
  resourceType: string;
  /** Additional input params beyond patientId + dateRange + pagination */
  extraInputSchema?: z.ZodObject<any>;
  /** Map input params to FHIR search params */
  buildSearchParams: (input: any) => Record<string, string | undefined>;
}

export function buildDateParam(dateFrom?: string, dateTo?: string): string | undefined {
  if (dateFrom && dateTo) return `ge${dateFrom}&date=le${dateTo}`;
  if (dateFrom) return `ge${dateFrom}`;
  if (dateTo) return `le${dateTo}`;
  return undefined;
}

export function createFhirSearchTool(config: FhirSearchToolConfig) {
  const baseSchema = PatientIdParam.merge(DateRangeParams).merge(PaginationParams);
  const inputSchema = config.extraInputSchema ? baseSchema.merge(config.extraInputSchema) : baseSchema;

  return createTool({
    id: config.id,
    description: `${config.description}\n\n${SAFETY_DISCLAIMER}`,
    inputSchema,
    outputSchema: SearchResultOutput,
    mcp: {
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    execute: async (input: Record<string, any>) => {
      const client = getFhirClient();
      const searchParams = config.buildSearchParams(input);

      // Add pagination
      searchParams._count = String(input._count);
      if (input._offset > 0) {
        searchParams._offset = String(input._offset);
      }

      const bundle = await client.search(config.resourceType, searchParams);
      const results = (bundle.entry ?? []).map((e) => e.resource).filter((r): r is FhirResource => !!r);
      const total = bundle.total;
      const hasMore = bundle.link?.some((l) => l.relation === 'next') ?? false;

      return { total, results, hasMore };
    },
  });
}
