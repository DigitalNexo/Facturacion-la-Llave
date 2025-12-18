import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const db = new PrismaClient();

/**
 * GET /api/invoices/[id]/audit
 * Obtener historial completo de auditoría de una factura
 * 
 * OBLIGATORIO según FACTURACION_LA_LLAVE_OBLIGATORIO.md - Sección 13
 * "Registro completo de todas las acciones sobre facturas"
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const invoiceId = resolvedParams.id;

    // Verificar que la factura existe
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId: invoice.tenantId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const hasAccess = 
      invoice.tenant.accountId === user.accountId || 
      user.tenantAccesses.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a esta factura' }, { status: 403 });
    }

    // Obtener historial de auditoría de la factura
    const auditHistory = await db.auditEvent.findMany({
      where: {
        entityType: 'invoice',
        entityId: invoiceId,
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

    return NextResponse.json({ 
      invoice: {
        id: invoice.id,
        fullNumber: invoice.fullNumber,
        status: invoice.status,
      },
      auditHistory,
      total: auditHistory.length,
    });
  } catch (error) {
    console.error('Error al obtener historial de auditoría:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial de auditoría' },
      { status: 500 }
    );
  }
}
