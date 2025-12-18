/**
 * UTILIDAD DE AUDITORÍA
 * Registra todas las acciones críticas del sistema
 * OBLIGATORIO según FACTURACION_LA_LLAVE_OBLIGATORIO.md - Sección 13
 */

import { PrismaClient } from '@fll/db';

const db = new PrismaClient();

interface AuditParams {
  userId: string;
  eventType: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra un evento de auditoría
 */
export async function auditLog(params: AuditParams): Promise<void> {
  try {
    await db.auditEvent.create({
      data: {
        userId: params.userId,
        eventType: params.eventType,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // No fallar la operación principal si falla el audit log
    console.error('Error en audit log:', error);
  }
}

/**
 * Obtener historial de auditoría de una entidad
 */
export async function getAuditHistory(
  entityType: string,
  entityId: string
): Promise<any[]> {
  return db.auditEvent.findMany({
    where: {
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Tipos de eventos de auditoría
 */
export const AuditEventTypes = {
  // Autenticación
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  PASSWORD_CHANGE: 'auth.password_change',
  
  // Facturas
  INVOICE_CREATE: 'invoice.create',
  INVOICE_UPDATE: 'invoice.update',
  INVOICE_ISSUE: 'invoice.issue',
  INVOICE_RECTIFY: 'invoice.rectify',
  INVOICE_VOID: 'invoice.void',
  INVOICE_PDF_DOWNLOAD: 'invoice.pdf_download',
  
  // Series
  SERIES_CREATE: 'series.create',
  SERIES_UPDATE: 'series.update',
  SERIES_DELETE: 'series.delete',
  
  // Clientes
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',
  
  // Tenants
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  
  // Usuarios
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Permisos
  PERMISSION_GRANT: 'permission.grant',
  PERMISSION_REVOKE: 'permission.revoke',
  
  // Configuración
  CONFIG_UPDATE: 'config.update',
} as const;
