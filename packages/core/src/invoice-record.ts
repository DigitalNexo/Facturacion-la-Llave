/**
 * REGISTRO LEGAL - VERI*FACTU
 * Hash encadenado y payload estructurado
 * 
 * Conforme a:
 * - Real Decreto 1007/2023
 * - Especificaciones técnicas VERI*FACTU AEAT
 */

import crypto from 'crypto';
import { PrismaClient } from '@fll/db';

const SYSTEM_ID = 'FLL-SIF';
const SYSTEM_VERSION = '1.0.0';
const PRODUCER_TAX_ID = 'B86634235'; // Búfalo Easy Trade, S.L.

export interface InvoiceRecordPayload {
  // Identificación del sistema
  systemId: string;
  systemVersion: string;
  producerTaxId: string;
  
  // Identificación del obligado tributario
  tenantTaxId: string;
  tenantBusinessName: string;
  
  // Datos de la factura
  invoiceNumber: string;
  invoiceSeries: string;
  invoiceDate: string; // ISO 8601
  invoiceType: string;
  
  // Importes
  subtotal: number;
  taxAmount: number;
  total: number;
  
  // Cliente
  customerTaxId: string;
  customerName: string;
  
  // Líneas de detalle (resumen)
  linesCount: number;
  linesDescription: string;
  
  // Tipo de evento
  eventType: 'creation' | 'rectification' | 'void';
  
  // Timestamps
  recordedAt: string; // ISO 8601
  recordedBy: string; // userId
}

/**
 * Calcula el hash SHA-256 de un payload
 */
export function calculateHash(payload: InvoiceRecordPayload, prevHash: string | null): string {
  // Ordenar las claves del payload para garantizar determinismo
  const sortedPayload = Object.keys(payload)
    .sort()
    .reduce((acc, key) => {
      acc[key] = payload[key as keyof InvoiceRecordPayload];
      return acc;
    }, {} as Record<string, any>);
  
  // Construir string para hash: payload + prevHash
  const dataToHash = JSON.stringify(sortedPayload) + (prevHash || '');
  
  // Calcular SHA-256
  const hash = crypto.createHash('sha256').update(dataToHash, 'utf8').digest('hex');
  
  return hash;
}

/**
 * Genera el payload estructurado para un registro de factura
 */
export function generateInvoiceRecordPayload(
  invoice: {
    number: number;
    issuedAt: Date;
    type: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    tenant: {
      taxId: string;
      businessName: string;
    };
    series: {
      code: string;
    };
    customer: {
      taxId: string;
      name: string;
    };
    lines: Array<{
      description: string;
    }>;
  },
  eventType: 'creation' | 'rectification' | 'void',
  recordedBy: string
): InvoiceRecordPayload {
  // Construir número completo de factura
  const fullNumber = `${invoice.series.code}-${String(invoice.number).padStart(6, '0')}`;
  
  // Resumen de líneas
  const linesDescription = invoice.lines
    .map(line => line.description)
    .join(' | ')
    .substring(0, 500); // Limitar longitud
  
  return {
    systemId: SYSTEM_ID,
    systemVersion: SYSTEM_VERSION,
    producerTaxId: PRODUCER_TAX_ID,
    
    tenantTaxId: invoice.tenant.taxId,
    tenantBusinessName: invoice.tenant.businessName,
    
    invoiceNumber: fullNumber,
    invoiceSeries: invoice.series.code,
    invoiceDate: invoice.issuedAt.toISOString(),
    invoiceType: invoice.type,
    
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    
    customerTaxId: invoice.customer.taxId,
    customerName: invoice.customer.name,
    
    linesCount: invoice.lines.length,
    linesDescription,
    
    eventType,
    
    recordedAt: new Date().toISOString(),
    recordedBy,
  };
}

/**
 * Obtiene el último registro de la cadena para un tenant
 */
export async function getPreviousRecord(
  db: PrismaClient,
  tenantId: string
): Promise<{ id: string; hash: string } | null> {
  const lastRecord = await db.invoiceRecord.findFirst({
    where: {
      invoice: {
        tenantId,
      },
    },
    orderBy: {
      recordedAt: 'desc',
    },
    select: {
      id: true,
      hash: true,
    },
  });
  
  return lastRecord;
}

/**
 * Crea un registro de factura con hash encadenado
 * DEBE ejecutarse dentro de una transacción
 */
export async function createInvoiceRecord(
  tx: any, // PrismaClient transaction
  invoiceId: string,
  tenantId: string,
  invoice: Parameters<typeof generateInvoiceRecordPayload>[0],
  eventType: 'creation' | 'rectification' | 'void',
  recordedBy: string
): Promise<{ id: string; hash: string }> {
  // 1. Obtener registro anterior (último de la cadena)
  const previousRecord = await tx.invoiceRecord.findFirst({
    where: {
      invoice: {
        tenantId,
      },
    },
    orderBy: {
      recordedAt: 'desc',
    },
    select: {
      id: true,
      hash: true,
    },
  });
  
  // 2. Generar payload
  const payload = generateInvoiceRecordPayload(invoice, eventType, recordedBy);
  
  // 3. Calcular hash
  const hash = calculateHash(payload, previousRecord?.hash || null);
  
  // 4. Crear registro
  const record = await tx.invoiceRecord.create({
    data: {
      invoiceId,
      eventType,
      hash,
      prevHash: previousRecord?.hash || null,
      prevRecordId: previousRecord?.id || null,
      recordPayload: payload as any,
      systemId: SYSTEM_ID,
      systemVersion: SYSTEM_VERSION,
      recordedBy,
    },
    select: {
      id: true,
      hash: true,
    },
  });
  
  return record;
}

/**
 * Verifica la integridad de la cadena de registros
 * Útil para tests y auditorías
 */
export async function verifyChainIntegrity(
  db: PrismaClient,
  tenantId: string
): Promise<{
  valid: boolean;
  totalRecords: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  // Obtener todos los registros ordenados
  const records = await db.invoiceRecord.findMany({
    where: {
      invoice: {
        tenantId,
      },
    },
    orderBy: {
      recordedAt: 'asc',
    },
    select: {
      id: true,
      hash: true,
      prevHash: true,
      prevRecordId: true,
      recordPayload: true,
    },
  });
  
  if (records.length === 0) {
    return {
      valid: true,
      totalRecords: 0,
      errors: [],
    };
  }
  
  // Verificar primer registro
  if (records[0].prevHash !== null) {
    errors.push(`Primer registro ${records[0].id} tiene prevHash no nulo`);
  }
  
  // Verificar cada registro
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const payload = record.recordPayload as unknown as InvoiceRecordPayload;
    
    // Recalcular hash
    const expectedHash = calculateHash(payload, record.prevHash);
    
    if (record.hash !== expectedHash) {
      errors.push(
        `Registro ${record.id}: hash no coincide (esperado: ${expectedHash}, actual: ${record.hash})`
      );
    }
    
    // Verificar enlace con anterior
    if (i > 0) {
      const prevRecord = records[i - 1];
      
      if (record.prevHash !== prevRecord.hash) {
        errors.push(
          `Registro ${record.id}: prevHash no coincide con hash anterior`
        );
      }
      
      if (record.prevRecordId !== prevRecord.id) {
        errors.push(
          `Registro ${record.id}: prevRecordId no coincide con id anterior`
        );
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    totalRecords: records.length,
    errors,
  };
}

/**
 * Exporta la cadena completa para inspección/auditoría
 */
export async function exportChain(
  db: PrismaClient,
  tenantId: string
): Promise<Array<{
  id: string;
  hash: string;
  prevHash: string | null;
  payload: InvoiceRecordPayload;
  recordedAt: Date;
}>> {
  const records = await db.invoiceRecord.findMany({
    where: {
      invoice: {
        tenantId,
      },
    },
    orderBy: {
      recordedAt: 'asc',
    },
  });
  
  return records.map((record: any) => ({
    id: record.id,
    hash: record.hash,
    prevHash: record.prevHash,
    payload: record.recordPayload as unknown as InvoiceRecordPayload,
    recordedAt: record.recordedAt,
  }));
}
