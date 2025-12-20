/**
 * VERI*FACTU - MÓDULO DE ENVÍO AEAT
 * Gestión de cola de submissions y generación de XML
 * 
 * Conforme a:
 * - Real Decreto 1007/2023
 * - Especificaciones técnicas VERI*FACTU AEAT
 * - Orden HAC/1177/2024
 * 
 * IMPORTANTE:
 * Este módulo está diseñado para ser ACTIVABLE en 2027.
 * Por defecto, verifactuMode='disabled' en Tenant.
 * Cuando se active, NO requiere reescritura de código.
 */

import { PrismaClient } from '@fll/db';
import { InvoiceRecordPayload } from './invoice-record';

const SYSTEM_ID = 'FLL-SIF';
const SYSTEM_VERSION = '1.0.0';
const PRODUCER_TAX_ID = 'B86634235'; // Búfalo Easy Trade, S.L.

/**
 * Crea una submission en estado pending para un InvoiceRecord
 * 
 * SOLO se ejecuta si el tenant tiene verifactuMode='enabled'
 * 
 * @param tx - Transacción de Prisma
 * @param recordId - ID del InvoiceRecord asociado
 * @param tenantVerifactuMode - Modo VERI*FACTU del tenant ('disabled' | 'enabled')
 * @returns ID de la submission creada o null si modo disabled
 */
export async function createSubmission(
  tx: any, // PrismaClient transaction
  recordId: string,
  tenantVerifactuMode: string
): Promise<string | null> {
  // Si el tenant NO tiene VERI*FACTU activado, NO crear submission
  if (tenantVerifactuMode !== 'enabled') {
    return null;
  }
  
  // Crear submission en estado pending
  const submission = await tx.verifactuSubmission.create({
    data: {
      recordId,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
    },
    select: {
      id: true,
    },
  });
  
  return submission.id;
}

/**
 * Genera XML conforme a especificaciones VERI*FACTU de AEAT
 * 
 * Estructura básica (simplificada para preparación 2027):
 * - RegistroFactura (wrapper principal)
 * - IDFactura (identificación)
 * - Emisor (obligado tributario)
 * - Destinatario (cliente)
 * - Desglose (importes)
 * - Hash encadenado
 * - Firma (placeholder hasta credenciales reales)
 * 
 * @param payload - Payload del InvoiceRecord
 * @param hash - Hash del registro
 * @param prevHash - Hash del registro anterior (si existe)
 * @returns XML como string
 */
export function generateVerifactuXML(
  payload: InvoiceRecordPayload,
  hash: string,
  prevHash: string | null
): string {
  // Construir XML conforme a especificaciones AEAT
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<RegistroFactura xmlns="https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/RegistroFactura.xsd">
  <Cabecera>
    <ObligadoEmision>
      <NIF>${payload.tenantTaxId}</NIF>
      <NombreRazon>${escapeXML(payload.tenantBusinessName)}</NombreRazon>
    </ObligadoEmision>
  </Cabecera>
  
  <RegistroAlta>
    <IDFactura>
      <IDEmisorFactura>
        <NIF>${payload.tenantTaxId}</NIF>
      </IDEmisorFactura>
      <NumSerieFactura>${escapeXML(payload.invoiceNumber)}</NumSerieFactura>
      <FechaExpedicion>${formatDateForAEAT(payload.invoiceDate)}</FechaExpedicion>
    </IDFactura>
    
    <Destinatarios>
      <IDDestinatario>
        <NIF>${payload.customerTaxId}</NIF>
        <NombreRazon>${escapeXML(payload.customerName)}</NombreRazon>
      </IDDestinatario>
    </Destinatarios>
    
    <Desglose>
      <DetalleDesglose>
        <BaseImponible>${payload.subtotal.toFixed(2)}</BaseImponible>
        <CuotaIVA>${payload.taxAmount.toFixed(2)}</CuotaIVA>
        <TipoImpositivo>21.00</TipoImpositivo>
      </DetalleDesglose>
    </Desglose>
    
    <ImporteTotal>${payload.total.toFixed(2)}</ImporteTotal>
    
    <TipoFactura>${mapInvoiceType(payload.invoiceType)}</TipoFactura>
    
    <SistemaInformatico>
      <NombreSistema>${SYSTEM_ID}</NombreSistema>
      <IdSistema>${SYSTEM_ID}</IdSistema>
      <Version>${SYSTEM_VERSION}</Version>
      <NumeroInstalacion>1</NumeroInstalacion>
      <TipoUsoPosibleSoloVerifactu>S</TipoUsoPosibleSoloVerifactu>
      <TipoUsoPosibleMultiOT>N</TipoUsoPosibleMultiOT>
      <IndicadorMultiplesOT>N</IndicadorMultiplesOT>
    </SistemaInformatico>
    
    <Encadenamiento>
      <RegistroAnterior>
        ${prevHash ? `<IDRegistroAnterior>
          <IDEmisorFactura>
            <NIF>${payload.tenantTaxId}</NIF>
          </IDEmisorFactura>
          <Huella>${prevHash}</Huella>
        </IDRegistroAnterior>` : '<PrimerRegistro>S</PrimerRegistro>'}
      </RegistroAnterior>
      <Huella>${hash}</Huella>
    </Encadenamiento>
  </RegistroAlta>
  
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <!-- Firma digital: se implementará con certificado real en producción -->
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    </SignedInfo>
    <SignatureValue>PLACEHOLDER_SIGNATURE</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>PLACEHOLDER_CERTIFICATE</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>
</RegistroFactura>`;

  return xml;
}

/**
 * Escapa caracteres especiales para XML
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formatea fecha para AEAT (DD-MM-YYYY)
 */
function formatDateForAEAT(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Mapea tipo de factura interno a código AEAT
 */
function mapInvoiceType(internalType: string): string {
  const typeMap: Record<string, string> = {
    'INVOICE': 'F1', // Factura completa
    'SIMPLIFIED': 'F2', // Factura simplificada
    'RECTIFICATION': 'R1', // Factura rectificativa
  };
  
  return typeMap[internalType] || 'F1';
}

/**
 * Obtiene todas las submissions pendientes de envío
 * 
 * Estados válidos: pending, error, retry
 * 
 * @param db - Cliente de Prisma
 * @param limit - Número máximo de submissions a procesar
 * @returns Array de submissions con sus InvoiceRecords
 */
export async function getPendingSubmissions(
  db: PrismaClient,
  limit: number = 50
): Promise<Array<any>> {
  const submissions = await db.verifactuSubmission.findMany({
    where: {
      status: {
        in: ['pending', 'error', 'retry'],
      },
    },
    take: limit,
    orderBy: {
      createdAt: 'asc',
    },
  });
  
  return submissions;
}

/**
 * Procesa una submission: genera XML y simula envío a AEAT
 * 
 * En producción con credenciales reales:
 * - Firmar XML con certificado
 * - Enviar a endpoint AEAT
 * - Procesar respuesta
 * 
 * En modo preparación (hasta 2027):
 * - Genera XML
 * - Simula envío exitoso
 * - Actualiza estado
 * 
 * @param db - Cliente de Prisma
 * @param submissionId - ID de la submission a procesar
 * @returns Resultado del envío
 */
export async function processSubmission(
  db: PrismaClient,
  submissionId: string
): Promise<{
  success: boolean;
  error?: string;
  aeatResponse?: any;
}> {
  let submission: any;
  
  try {
    // 1. Obtener submission
    submission = await db.verifactuSubmission.findUnique({
      where: { id: submissionId },
    });
    
    if (!submission) {
      throw new Error('Submission no encontrada');
    }
    
    // 2. Obtener InvoiceRecord asociado
    const record = await db.invoiceRecord.findUnique({
      where: { id: submission.recordId },
      include: {
        invoice: {
          include: {
            tenant: true,
          },
        },
      },
    });
    
    if (!record) {
      throw new Error('InvoiceRecord no encontrado');
    }
    
    // 3. Verificar que tenant tiene VERI*FACTU activado
    if (record.invoice.tenant.verifactuMode !== 'enabled') {
      // Marcar como error: no debería existir esta submission
      await db.verifactuSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'error',
          errorMessage: 'Tenant no tiene VERI*FACTU activado',
          lastAttemptAt: new Date(),
          attempts: submission.attempts + 1,
        },
      });
      
      return {
        success: false,
        error: 'Tenant no tiene VERI*FACTU activado',
      };
    }
    
    // 4. Generar XML
    const xml = generateVerifactuXML(
      record.recordPayload as unknown as InvoiceRecordPayload,
      record.hash,
      record.prevHash
    );
    
    // 5. SIMULACIÓN de envío a AEAT (hasta 2027 con credenciales reales)
    // En producción: firmar XML y enviar a endpoint AEAT
    const simulatedResponse = {
      estado: 'Aceptado',
      codigo: '200',
      csv: `CSV-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      fechaRecepcion: new Date().toISOString(),
    };
    
    // 6. Actualizar submission como enviada
    await db.verifactuSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'sent',
        aeatResponse: simulatedResponse,
        sentAt: new Date(),
        lastAttemptAt: new Date(),
        attempts: submission.attempts + 1,
      },
    });
    
    return {
      success: true,
      aeatResponse: simulatedResponse,
    };
  } catch (error: any) {
    // Registrar error y actualizar submission
    if (submission) {
      await db.verifactuSubmission.update({
        where: { id: submissionId },
        data: {
          status: submission.attempts + 1 >= submission.maxAttempts ? 'error' : 'retry',
          errorMessage: error.message || 'Error desconocido',
          lastAttemptAt: new Date(),
          attempts: submission.attempts + 1,
        },
      });
    }
    
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
}

/**
 * Worker que procesa la cola de submissions pendientes
 * 
 * Este worker debe ejecutarse periódicamente (ej: cada 5 minutos)
 * mediante un cron job o servicio de background jobs.
 * 
 * @param db - Cliente de Prisma
 * @param batchSize - Número de submissions a procesar por lote
 * @returns Estadísticas del procesamiento
 */
export async function processSubmissionQueue(
  db: PrismaClient,
  batchSize: number = 50
): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ submissionId: string; error: string }>;
}> {
  const submissions = await getPendingSubmissions(db, batchSize);
  
  let successful = 0;
  let failed = 0;
  const errors: Array<{ submissionId: string; error: string }> = [];
  
  for (const submission of submissions) {
    const result = await processSubmission(db, submission.id);
    
    if (result.success) {
      successful++;
    } else {
      failed++;
      errors.push({
        submissionId: submission.id,
        error: result.error || 'Error desconocido',
      });
    }
  }
  
  return {
    processed: submissions.length,
    successful,
    failed,
    errors,
  };
}
