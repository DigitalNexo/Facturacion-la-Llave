/**
 * CONSTANTES DEL SISTEMA
 * Valores inmutables definidos por el documento obligatorio
 */

export const SYSTEM = {
  ID: 'FLL-SIF',
  VERSION: '0.1.0',
  PRODUCER_NAME: 'Búfalo Easy Trade, S.L.',
  PRODUCER_TAX_ID: 'B86634235',
} as const;

export const TRIAL = {
  DAYS: 15,
} as const;

export const PERMISSIONS = [
  'invoices.read',
  'invoices.download_pdf',
  'invoices.create_draft',
  'invoices.edit_draft',
  'invoices.issue_lock',
  'invoices.rectify',
  'invoices.void',
  'customers.manage',
  'series.manage',
  'exports.read',
  'records.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
