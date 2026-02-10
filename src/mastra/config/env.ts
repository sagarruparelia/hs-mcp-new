import { z } from 'zod';

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  FHIR_BASE_URL: z.url('FHIR_BASE_URL must be a valid URL'),
  HSID_ISSUER_URL: z.string().default('https://nonprod.identity.healthsafe-id.com'),
  HSID_CLIENT_ID: z.string().min(1, 'HSID_CLIENT_ID is required'),
  HSID_REDIRECT_URI: z.string().default('http://localhost:4111/auth/callback'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  HEALTHEX_CLIENT_ID: z.string().optional(),
  HEALTHEX_REDIRECT_URI: z.string().default('http://localhost:4111/healthex/callback'),
  MCP_HTTP_PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
