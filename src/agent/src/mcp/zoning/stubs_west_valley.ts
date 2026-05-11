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

export const buckeyeStub = buildStubRecord(
  'Buckeye',
  'https://www.buckeyeaz.gov/government/departments/development-services',
  '(623) 349-6700',
  'Buckeye Zoning Ordinance',
);
export const buckeye = buildStubModule('Buckeye');

export const apacheJunctionStub = buildStubRecord(
  'Apache Junction',
  'https://www.apachejunctionaz.gov/government/departments/development_services',
  '(480) 474-5083',
  'Apache Junction Zoning Code Title 11',
);
export const apacheJunction = buildStubModule('Apache Junction');

export const elMirageStub = buildStubRecord(
  'El Mirage',
  'https://www.cityofelmirage.org/government/departments/community-development',
  '(623) 935-2629',
  'El Mirage Land Development Code',
);
export const elMirage = buildStubModule('El Mirage');

export const tollesonStub = buildStubRecord(
  'Tolleson',
  'https://www.tollesonaz.org/community-development',
  '(623) 936-2782',
  'Tolleson Zoning Ordinance',
);
export const tolleson = buildStubModule('Tolleson');

export const fountainHillsStub = buildStubRecord(
  'Fountain Hills',
  'https://www.fountainhillsaz.gov/162/Development-Services',
  '(480) 816-5100',
  'Fountain Hills Zoning Ordinance',
);
export const fountainHills = buildStubModule('Fountain Hills');

export const litchfieldParkStub = buildStubRecord(
  'Litchfield Park',
  'https://www.litchfield-park.org/162/Planning-Zoning',
  '(623) 935-5033',
  'Litchfield Park Zoning Ordinance',
);
export const litchfieldPark = buildStubModule('Litchfield Park');

export const paradiseValleyStub = buildStubRecord(
  'Paradise Valley',
  'https://www.paradisevalleyaz.gov/186/Community-Development',
  '(480) 348-3690',
  'Paradise Valley Town Code Chapter 11',
);
export const paradiseValley = buildStubModule('Paradise Valley');
