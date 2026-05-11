// Hint-only stubs for Maricopa cities that don't publish a public zoning REST
// endpoint. The agent uses these via the PHYSICAL_CITY hint from parcel_lookup
// to confirm jurisdiction and direct the user to the right planning department,
// without fabricating setback or density values.

import { buildStubModule, buildStubRecord } from './stub.js';

export const goodyearStub = buildStubRecord(
  'Goodyear',
  'https://www.goodyearaz.gov/government/departments/development-services/planning-zoning',
  '(623) 932-3004',
  'Goodyear Zoning Ordinance',
);
export const goodyear = buildStubModule('Goodyear');

export const avondaleStub = buildStubRecord(
  'Avondale',
  'https://www.avondaleaz.gov/government/departments/development-and-engineering-services/planning',
  '(623) 333-4020',
  'Avondale Zoning Code',
);
export const avondale = buildStubModule('Avondale');

export const surpriseStub = buildStubRecord(
  'Surprise',
  'https://www.surpriseaz.gov/170/Community-Development',
  '(623) 222-3000',
  'Surprise Municipal Code Title 17 (Zoning)',
);
export const surprise = buildStubModule('Surprise');

export const peoriaStub = buildStubRecord(
  'Peoria',
  'https://www.peoriaaz.gov/government/departments/community-development',
  '(623) 773-7200',
  'Peoria Zoning Ordinance Chapter 14',
);
export const peoria = buildStubModule('Peoria');
