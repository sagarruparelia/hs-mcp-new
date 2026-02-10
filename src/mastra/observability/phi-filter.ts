import { SensitiveDataFilter } from '@mastra/observability';

/** PHI-specific sensitive fields for healthcare observability traces */
const PHI_FIELDS = [
  // Standard sensitive fields
  'password',
  'token',
  'secret',
  'key',
  'apikey',
  'auth',
  'authorization',
  'bearer',
  'jwt',
  'credential',
  'clientsecret',
  'privatekey',
  // PHI fields (HIPAA identifiers)
  'ssn',
  'social_security',
  'socialsecurity',
  'mrn',
  'medical_record_number',
  'birthdate',
  'birthDate',
  'date_of_birth',
  'dateOfBirth',
  'address',
  'streetAddress',
  'street_address',
  'postalCode',
  'postal_code',
  'zipcode',
  'phone',
  'telecom',
  'email',
  'name',
  'family',
  'given',
  'identifier',
  'insurance',
  'insuranceId',
  'insurance_id',
  'memberId',
  'member_id',
  'subscriberId',
  'subscriber_id',
  'driversLicense',
  'drivers_license',
  'passport',
];

export function createPhiFilter(): SensitiveDataFilter {
  return new SensitiveDataFilter({
    sensitiveFields: PHI_FIELDS,
    redactionToken: '[PHI_REDACTED]',
  });
}
