import { z } from 'zod';

const envSchema = z
  .object({
    DATA_SOURCES: z.enum(['fhir', 'healthex', 'both']).default('both'),
    ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
    FHIR_BASE_URL: z.url().optional(),
    HSID_ISSUER_URL: z.string().default('https://nonprod.identity.healthsafe-id.com'),
    HSID_CLIENT_ID: z.string().min(1, 'HSID_CLIENT_ID is required'),
    HSID_REDIRECT_URI: z.string().default('http://localhost:4111/auth/callback'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    HEALTHEX_CLIENT_ID: z.string().optional(),
    HEALTHEX_REDIRECT_URI: z.string().default('http://localhost:4222/healthex/callback'),
    HEALTHEX_MOCK: z
      .enum(['true', 'false', '1', '0', ''])
      .default('')
      .transform((v) => v === 'true' || v === '1'),
    MCP_HTTP_PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  })
  .superRefine((data, ctx) => {
    const needsFhir = data.DATA_SOURCES === 'fhir' || data.DATA_SOURCES === 'both';
    if (needsFhir && !data.FHIR_BASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['FHIR_BASE_URL'],
        message: 'FHIR_BASE_URL is required when DATA_SOURCES includes fhir',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export const fhirEnabled = env.DATA_SOURCES === 'fhir' || env.DATA_SOURCES === 'both';
export const healthExEnabled = env.DATA_SOURCES === 'healthex' || env.DATA_SOURCES === 'both';
