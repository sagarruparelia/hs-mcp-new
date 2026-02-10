import { env } from '../config/env.js';
import type { FhirBundle, FhirResource, OperationOutcome } from './types.js';
import { createAuthStrategy, type AuthStrategy } from './auth/index.js';

export class FhirClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly operationOutcome?: OperationOutcome,
  ) {
    super(message);
    this.name = 'FhirClientError';
  }
}

export class FhirClient {
  private baseUrl: string;
  private auth: AuthStrategy;

  constructor(baseUrl: string, auth: AuthStrategy) {
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.auth = auth;
  }

  /** Search for FHIR resources: GET {base}/{resourceType}?{params} */
  async search<T extends FhirResource>(
    resourceType: string,
    params?: Record<string, string | string[] | undefined>,
  ): Promise<FhirBundle<T>> {
    const searchParams = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === '') continue;
        if (Array.isArray(value)) {
          for (const v of value) searchParams.append(key, v);
        } else {
          searchParams.set(key, value);
        }
      }
    }

    const query = searchParams.toString();
    const url = `${this.baseUrl}/${resourceType}${query ? `?${query}` : ''}`;
    return this.request<FhirBundle<T>>(url);
  }

  /** Read a single FHIR resource by ID: GET {base}/{resourceType}/{id} */
  async read<T extends FhirResource>(resourceType: string, id: string): Promise<T> {
    const url = `${this.baseUrl}/${resourceType}/${id}`;
    return this.request<T>(url);
  }

  private async request<T>(url: string): Promise<T> {
    const headers = await this.auth.getAuthHeaders();

    const res = await fetch(url, {
      headers: {
        Accept: 'application/fhir+json',
        ...headers,
      },
    });

    if (!res.ok) {
      let outcome: OperationOutcome | undefined;
      try {
        const body = await res.json();
        if (body?.resourceType === 'OperationOutcome') {
          outcome = body as OperationOutcome;
        }
      } catch {
        // ignore parse errors
      }
      throw new FhirClientError(
        `FHIR ${res.status}: ${outcome?.issue?.[0]?.diagnostics ?? res.statusText}`,
        res.status,
        outcome,
      );
    }

    return res.json() as Promise<T>;
  }
}

// Lazy singleton
let client: FhirClient | null = null;

export function getFhirClient(): FhirClient {
  if (!client) {
    if (!env.FHIR_BASE_URL) {
      throw new Error('FHIR_BASE_URL is not configured. Ensure DATA_SOURCES includes fhir.');
    }
    client = new FhirClient(env.FHIR_BASE_URL, createAuthStrategy());
  }
  return client;
}
