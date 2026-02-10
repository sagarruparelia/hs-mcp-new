/** FHIR R4 narrow type interfaces for AWS HealthLake */

export interface FhirBundle<T extends FhirResource = FhirResource> {
  resourceType: 'Bundle';
  type: 'searchset' | 'batch-response' | 'transaction-response' | 'document' | 'collection';
  total?: number;
  link?: FhirBundleLink[];
  entry?: FhirBundleEntry<T>[];
}

export interface FhirBundleLink {
  relation: 'self' | 'next' | 'previous' | 'first' | 'last';
  url: string;
}

export interface FhirBundleEntry<T extends FhirResource = FhirResource> {
  fullUrl?: string;
  resource?: T;
  search?: { mode?: 'match' | 'include' | 'outcome'; score?: number };
}

export interface FhirResource {
  resourceType: string;
  id?: string;
  meta?: FhirMeta;
  [key: string]: unknown;
}

export interface FhirMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
}

export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: OperationOutcomeIssue[];
}

export interface OperationOutcomeIssue {
  severity: 'fatal' | 'error' | 'warning' | 'information';
  code: string;
  details?: { text?: string };
  diagnostics?: string;
}

// --- Resource-specific types ---

export interface HumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface Identifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: CodeableConcept;
  system?: string;
  value?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface Reference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface Quantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

export interface Range {
  low?: Quantity;
  high?: Quantity;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

export interface Address {
  use?: string;
  type?: string;
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface Attachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

// --- Patient ---
export interface FhirPatient extends FhirResource {
  resourceType: 'Patient';
  identifier?: Identifier[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  communication?: Array<{ language: CodeableConcept; preferred?: boolean }>;
}

// --- Observation ---
export interface FhirObservation extends FhirResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference[];
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: Range;
  interpretation?: CodeableConcept[];
  note?: Annotation[];
  referenceRange?: Array<{
    low?: Quantity;
    high?: Quantity;
    type?: CodeableConcept;
    text?: string;
  }>;
  component?: Array<{
    code: CodeableConcept;
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    interpretation?: CodeableConcept[];
    referenceRange?: FhirObservation['referenceRange'];
  }>;
}

// --- Condition ---
export interface FhirCondition extends FhirResource {
  resourceType: 'Condition';
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  bodySite?: CodeableConcept[];
  subject: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  onsetPeriod?: Period;
  abatementDateTime?: string;
  recordedDate?: string;
  recorder?: Reference;
  note?: Annotation[];
}

// --- MedicationRequest ---
export interface FhirMedicationRequest extends FhirResource {
  resourceType: 'MedicationRequest';
  status: string;
  intent: string;
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject: Reference;
  encounter?: Reference;
  authoredOn?: string;
  requester?: Reference;
  dosageInstruction?: Array<{
    text?: string;
    timing?: { code?: CodeableConcept };
    route?: CodeableConcept;
    doseAndRate?: Array<{ doseQuantity?: Quantity }>;
  }>;
  note?: Annotation[];
}

// --- AllergyIntolerance ---
export interface FhirAllergyIntolerance extends FhirResource {
  resourceType: 'AllergyIntolerance';
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  type?: 'allergy' | 'intolerance';
  category?: ('food' | 'medication' | 'environment' | 'biologic')[];
  criticality?: 'low' | 'high' | 'unable-to-assess';
  code?: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  onsetDateTime?: string;
  recordedDate?: string;
  recorder?: Reference;
  reaction?: Array<{
    substance?: CodeableConcept;
    manifestation: CodeableConcept[];
    severity?: 'mild' | 'moderate' | 'severe';
    description?: string;
  }>;
  note?: Annotation[];
}

// --- Immunization ---
export interface FhirImmunization extends FhirResource {
  resourceType: 'Immunization';
  status: 'completed' | 'entered-in-error' | 'not-done';
  vaccineCode: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  occurrenceDateTime?: string;
  occurrenceString?: string;
  recorded?: string;
  primarySource?: boolean;
  location?: Reference;
  lotNumber?: string;
  expirationDate?: string;
  site?: CodeableConcept;
  route?: CodeableConcept;
  performer?: Array<{ actor: Reference; function?: CodeableConcept }>;
  note?: Annotation[];
}

// --- Encounter ---
export interface FhirEncounter extends FhirResource {
  resourceType: 'Encounter';
  status: string;
  class: Coding;
  type?: CodeableConcept[];
  subject?: Reference;
  participant?: Array<{ type?: CodeableConcept[]; individual?: Reference; period?: Period }>;
  period?: Period;
  reasonCode?: CodeableConcept[];
  diagnosis?: Array<{ condition: Reference; use?: CodeableConcept }>;
  location?: Array<{ location: Reference; status?: string; period?: Period }>;
  serviceProvider?: Reference;
}

// --- Procedure ---
export interface FhirProcedure extends FhirResource {
  resourceType: 'Procedure';
  status: string;
  category?: CodeableConcept;
  code?: CodeableConcept;
  subject: Reference;
  encounter?: Reference;
  performedDateTime?: string;
  performedPeriod?: Period;
  recorder?: Reference;
  performer?: Array<{ actor: Reference; function?: CodeableConcept }>;
  reasonCode?: CodeableConcept[];
  bodySite?: CodeableConcept[];
  outcome?: CodeableConcept;
  complication?: CodeableConcept[];
  note?: Annotation[];
}

// --- DocumentReference ---
export interface FhirDocumentReference extends FhirResource {
  resourceType: 'DocumentReference';
  status: 'current' | 'superseded' | 'entered-in-error';
  type?: CodeableConcept;
  category?: CodeableConcept[];
  subject?: Reference;
  date?: string;
  author?: Reference[];
  description?: string;
  content: Array<{ attachment: Attachment; format?: Coding }>;
  context?: { encounter?: Reference[]; period?: Period; facilityType?: CodeableConcept };
}

// --- CarePlan ---
export interface FhirCarePlan extends FhirResource {
  resourceType: 'CarePlan';
  status: string;
  intent: string;
  category?: CodeableConcept[];
  title?: string;
  description?: string;
  subject: Reference;
  encounter?: Reference;
  period?: Period;
  created?: string;
  author?: Reference;
  contributor?: Reference[];
  careTeam?: Reference[];
  addresses?: Reference[];
  goal?: Reference[];
  activity?: Array<{
    outcomeCodeableConcept?: CodeableConcept[];
    detail?: {
      kind?: string;
      code?: CodeableConcept;
      status: string;
      description?: string;
      scheduledPeriod?: Period;
    };
  }>;
  note?: Annotation[];
}

// --- DiagnosticReport ---
export interface FhirDiagnosticReport extends FhirResource {
  resourceType: 'DiagnosticReport';
  status: string;
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject?: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  issued?: string;
  performer?: Reference[];
  result?: Reference[];
  conclusion?: string;
  conclusionCode?: CodeableConcept[];
  presentedForm?: Attachment[];
}

// --- ClinicalImpression ---
export interface FhirClinicalImpression extends FhirResource {
  resourceType: 'ClinicalImpression';
  status: 'in-progress' | 'completed' | 'entered-in-error';
  subject: Reference;
  encounter?: Reference;
  effectiveDateTime?: string;
  effectivePeriod?: Period;
  date?: string;
  assessor?: Reference;
  summary?: string;
  finding?: Array<{
    itemCodeableConcept?: CodeableConcept;
    itemReference?: Reference;
    basis?: string;
  }>;
  note?: Annotation[];
}
