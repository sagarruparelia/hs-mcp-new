# HTE - Health Tech Ecosystem

A Mastra-based AI agent and MCP server for navigating clinical health data. Connects to **FHIR R4** (AWS HealthLake) and/or **HealthEx** (remote MCP) as data sources, selectable via a single environment variable.

## Prerequisites

- **Node.js >= 22.13.0**
- **MongoDB Atlas** cluster (for conversation storage)
- **Anthropic API key** (powers the Claude agent)
- **HSID credentials** (HealthSafe ID - always required for user identity)
- **AWS HealthLake endpoint** (if using FHIR data source)
- **HealthEx OAuth tokens** (if using HealthEx data source)

## Quick Start

```shell
git clone <repo-url> && cd hs-mcp-new
npm install
cp .env.example .env
# Fill in required values (see Environment Variables below)
npm run dev
```

Opens Mastra Studio at [http://localhost:4111](http://localhost:4111).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Mastra dev server (Studio UI + hot reload) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run auth:healthex` | Run HealthEx OAuth PKCE flow (opens browser, saves tokens) |

## Environment Variables

### `DATA_SOURCES`

Controls which data backends are active. Valid values: `fhir`, `healthex`, `both` (default: `both`).

```bash
# HealthEx only - no FHIR env vars needed
DATA_SOURCES=healthex

# FHIR only - HealthEx skipped entirely
DATA_SOURCES=fhir

# Both (default) - backward compatible, omitting DATA_SOURCES also works
DATA_SOURCES=both
```

### Required (always)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for the Claude agent |
| `HSID_CLIENT_ID` | HealthSafe ID OAuth client ID (user identity provider) |
| `MONGODB_URI` | MongoDB Atlas connection string |

### Required when `DATA_SOURCES` includes `fhir`

| Variable | Description |
|----------|-------------|
| `FHIR_BASE_URL` | AWS HealthLake FHIR R4 endpoint URL |

### Optional (have defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `HSID_ISSUER_URL` | `https://nonprod.identity.healthsafe-id.com` | HSID OIDC issuer |
| `HSID_REDIRECT_URI` | `http://localhost:4111/auth/callback` | HSID OAuth callback |
| `HEALTHEX_CLIENT_ID` | — | HealthEx OAuth client ID |
| `HEALTHEX_REDIRECT_URI` | `http://localhost:4111/healthex/callback` | HealthEx OAuth callback |
| `MCP_HTTP_PORT` | `3001` | MCP HTTP server port |
| `NODE_ENV` | `development` | Environment mode |

### Validation Behavior

Environment variables are validated at startup with Zod. The app will fail fast with a clear error if:
- `ANTHROPIC_API_KEY`, `HSID_CLIENT_ID`, or `MONGODB_URI` are missing (always required)
- `FHIR_BASE_URL` is missing when `DATA_SOURCES` is `fhir` or `both`
- `DATA_SOURCES=healthex` and HealthEx auth tokens don't exist (hard error - no tools would be available)
- `DATA_SOURCES=both` and HealthEx auth fails: graceful degradation, FHIR tools still load

---

## Architecture

### High-Level Overview

```
                        ┌──────────────────────────────────┐
                        │         Mastra Framework          │
                        │                                   │
                        │  ┌─────────────────────────────┐  │
 Mastra Studio /        │  │     Health Data Navigator    │  │
 MCP Clients ──────────►│  │         (AI Agent)           │  │
                        │  │    Claude Sonnet 4.5          │  │
                        │  └──────────┬──────────────────┘  │
                        │             │ uses tools           │
                        │  ┌──────────▼──────────────────┐  │
                        │  │       Tool Registry          │  │
                        │  │  (assembled at startup)      │  │
                        │  └──┬───────────────────────┬──┘  │
                        └─────┼───────────────────────┼─────┘
                              │                       │
              ┌───────────────▼──┐            ┌───────▼──────────────┐
              │   FHIR Tools     │            │   HealthEx Tools     │
              │   (14 tools)     │            │   (remote MCP)       │
              │                  │            │                      │
              │  getFhirClient() │            │  getHealthExClient() │
              └───────┬──────────┘            └───────┬──────────────┘
                      │                               │
              ┌───────▼──────────┐            ┌───────▼──────────────┐
              │  HSID OIDC PKCE  │            │  HealthEx OAuth PKCE │
              │  (user identity) │            │  (data access)       │
              └───────┬──────────┘            └───────┬──────────────┘
                      │                               │
              ┌───────▼──────────┐            ┌───────▼──────────────┐
              │  AWS HealthLake   │            │  api.healthex.io     │
              │  (FHIR R4)       │            │  (MCP server)        │
              └──────────────────┘            └──────────────────────┘
```

### Startup Flow

1. **Env validation** (`config/env.ts`) - Zod parses `process.env`, computes `fhirEnabled` / `healthExEnabled`
2. **Assembly** (`assembly.ts`) - Single `assemble()` function orchestrates everything:
   - If `fhirEnabled`: merges all 14 FHIR tool definitions into the tool registry
   - If `healthExEnabled`: connects to HealthEx MCP, fetches remote tool definitions, merges them
   - Builds agent instructions dynamically (only includes sections for active sources)
   - Creates the agent and MCP server with the assembled tools
3. **Mastra init** (`index.ts`) - Wires agent, tools, storage, observability, and MCP server into the Mastra instance
4. **Ready** - Mastra Studio / HTTP / stdio server starts accepting requests

### Authentication

The project uses two independent OAuth 2.0 PKCE flows:

#### HSID (always required)

HSID is the user identity provider - required regardless of which data sources are active.

- **Protocol**: OIDC PKCE (public client, no client_secret)
- **Scopes**: `openid profile`
- **Token storage**: In-memory (volatile - lost on restart)
- **Used by**: FHIR client for every request to AWS HealthLake
- **Auto-refresh**: Yes, 60 seconds before expiry

#### HealthEx (required when HealthEx is enabled)

Separate OAuth flow for accessing HealthEx patient data.

- **Protocol**: OAuth 2.0 PKCE (public client)
- **Scopes**: `patient/*.read offline_access`
- **Token storage**: Filesystem (`~/.hte/healthex-tokens.json`) - persists across restarts
- **Used by**: HealthEx MCP client (custom fetch interceptor injects Bearer token)
- **Auto-refresh**: Yes, 60 seconds before expiry
- **Dynamic registration**: Supports `registerClient()` if no `HEALTHEX_CLIENT_ID` is set

**Setup:** Run `npm run auth:healthex` before starting the app. This:
1. Starts a temporary callback server on the `HEALTHEX_REDIRECT_URI` port
2. Opens your browser to the HealthEx authorization page
3. After you authorize, exchanges the code for tokens via PKCE
4. Saves tokens to `~/.hte/healthex-tokens.json`

If `HEALTHEX_CLIENT_ID` is not set, the script will dynamically register a new OAuth client.

### Tools

#### FHIR Tools (14 total)

Built using a tool factory pattern (`tools/_shared/fhir-tool-factory.ts`) that reduces each resource tool to ~20 lines.

| Tool | Description |
|------|-------------|
| `searchPatients` | Search patients by name, identifier, or DOB |
| `getPatient` | Get a single patient by FHIR ID |
| `searchObservations` | Lab results, vital signs, social history |
| `searchConditions` | Diagnoses and conditions |
| `searchMedicationRequests` | Active and historical medications |
| `searchAllergyIntolerances` | Allergies and intolerances |
| `searchImmunizations` | Vaccination records |
| `searchEncounters` | Visits and encounters |
| `searchProcedures` | Surgical and clinical procedures |
| `searchDocumentReferences` | Clinical documents |
| `searchCarePlans` | Care plans and goals |
| `searchDiagnosticReports` | Diagnostic reports |
| `searchClinicalImpressions` | Clinical assessments |
| `getPatientHealthSummary` | Composite: demographics + conditions + meds + allergies + vitals + immunizations |

All FHIR tools are read-only and call `getFhirClient()` lazily inside their `execute` functions (not at import time).

#### HealthEx Tools (~13, dynamically discovered)

Fetched at startup from the remote HealthEx MCP server. Key tools include:

- `healthex_get_health_summary` - Broad patient data overview
- `healthex_search` - Natural language search across records
- `healthex_search_clinical_notes` - Search clinical documentation

HealthEx tools return pre-formatted text and are prefixed with `healthex_`.

### Agent Instructions

The agent instructions are built dynamically based on active data sources (`agents/instructions.ts`):

| Section | Included When |
|---------|--------------|
| Preamble, Safety Rules, Data Interpretation | Always |
| Tool Strategy (FHIR-specific guidance) | `fhirEnabled` |
| HealthEx Tools (HealthEx-specific guidance) | `healthExEnabled` |
| Privacy & Presentation, Response Style | Always |

### Observability

Traces are processed through a PHI (Protected Health Information) filter that redacts HIPAA identifiers:
- Patient names, DOB, SSN, addresses, phone numbers, email
- Medical record numbers, insurance IDs, member IDs
- All values replaced with `[PHI_REDACTED]` in trace output

---

## Project Structure

```
src/mastra/
├── assembly.ts                    # Shared assembly - tool merging, agent + MCP creation
├── index.ts                       # Mastra instance (dev server entry point)
├── config/
│   ├── env.ts                     # Zod env validation, DATA_SOURCES, fhirEnabled/healthExEnabled
│   └── constants.ts               # FHIR resource types, pagination defaults, safety disclaimer
├── agents/
│   ├── index.ts                   # Re-exports createHteAgent
│   ├── hte-agent.ts               # Agent factory (Claude Sonnet 4.5, Memory)
│   └── instructions.ts            # Dynamic instruction builder (buildInstructions)
├── fhir/
│   ├── client.ts                  # FhirClient class + getFhirClient() singleton
│   ├── types.ts                   # FHIR R4 type definitions (Patient, Observation, etc.)
│   └── auth/
│       ├── index.ts               # AuthStrategy interface + createAuthStrategy() factory
│       ├── oidc-pkce.ts           # HSID OIDC PKCE implementation
│       └── token-store.ts         # In-memory token storage
├── healthex/
│   ├── index.ts                   # Re-exports auth + client
│   ├── auth.ts                    # HealthExAuth (OAuth 2.0 PKCE, dynamic registration)
│   ├── client.ts                  # MCPClient setup + getHealthExTools()
│   └── token-persistence.ts       # File-based token storage (~/.hte/)
├── tools/
│   ├── index.ts                   # Exports all 14 tools + allTools record
│   ├── _shared/
│   │   ├── fhir-tool-factory.ts   # createFhirSearchTool() factory
│   │   └── schemas.ts             # Shared Zod schemas (pagination, date range, output)
│   ├── patient.ts                 # searchPatients, getPatient
│   ├── patient-summary.ts         # getPatientHealthSummary (composite)
│   ├── observation.ts             # searchObservations
│   ├── condition.ts               # searchConditions
│   ├── medication-request.ts      # searchMedicationRequests
│   ├── allergy-intolerance.ts     # searchAllergyIntolerances
│   ├── immunization.ts            # searchImmunizations
│   ├── encounter.ts               # searchEncounters
│   ├── procedure.ts               # searchProcedures
│   ├── document-reference.ts      # searchDocumentReferences
│   ├── care-plan.ts               # searchCarePlans
│   ├── diagnostic-report.ts       # searchDiagnosticReports
│   └── clinical-impression.ts     # searchClinicalImpressions
├── server/
│   ├── mcp-server.ts              # createHteMcpServer() factory
│   ├── http.ts                    # MCP HTTP transport (port 3001)
│   └── stdio.ts                   # MCP stdio transport
└── observability/
    ├── index.ts                   # Observability factory
    └── phi-filter.ts              # HIPAA PHI field redaction
```

## MCP Server Transports

The MCP server can be consumed via three entry points:

| Entry Point | Transport | Usage |
|-------------|-----------|-------|
| `npm run dev` | Mastra Studio (HTTP) | Development - interactive UI at `localhost:4111` |
| `server/http.ts` | HTTP SSE | Production - `localhost:3001/mcp` |
| `server/stdio.ts` | Stdio | CLI integration - pipe-based MCP protocol |

All three use the shared `assemble()` function, so tool selection and agent configuration are consistent.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Agent framework | [Mastra](https://mastra.ai) v1.2 |
| LLM | Anthropic Claude Sonnet 4.5 |
| FHIR data | AWS HealthLake (FHIR R4) |
| HealthEx data | Remote MCP server (`api.healthex.io`) |
| Auth | OIDC PKCE (HSID) + OAuth 2.0 PKCE (HealthEx) |
| Storage | MongoDB Atlas |
| Schema validation | Zod v4 |
| Observability | `@mastra/observability` with PHI filtering |
| Runtime | Node.js >= 22.13 (ESM) |
