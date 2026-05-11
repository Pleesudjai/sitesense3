import { buildStubModule, buildStubRecord } from './stub.js';

export const chandlerStub = buildStubRecord(
  'Chandler',
  'https://www.chandleraz.gov/business/planning/zoning',
  '(480) 782-3000',
  'Chandler Code of Ordinances Chapter 35 (Zoning)',
);

export const chandler = buildStubModule('Chandler');
