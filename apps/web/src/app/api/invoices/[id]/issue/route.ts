import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { auditLog, AuditEventTypes } from '@fll/core/audit';

const db = new PrismaClient();

// POST /api/invoices/[id]/issue - Emitir factura (draft → issued)
export async function POST(
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

    // Obtener la factura
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        series: true,
        lines: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar estado
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: `No se puede emitir. Estado actual: ${invoice.status}` },
        { status: 400 }
      );
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

    // Validaciones previas a emisión
    if (invoice.lines.length === 0) {
      return NextResponse.json(
        { error: 'No se puede emitir una factura sin líneas' },
        { status: 400 }
      );
    }

    if (!invoice.issueDate) {
      return NextResponse.json(
        { error: 'Debe especificar una fecha de emisión' },
        { status: 400 }
      );
    }

    // ⚠️ PROCESO CRÍTICO: Reservar número correlativo de forma atómica
    // Usamos una transacción para garantizar unicidad y atomicidad
    const result = await db.$transaction(async (tx) => {
      // 1. Obtener la serie con lock (FOR UPDATE)
      const series = await tx.invoiceSeries.findUnique({
        where: { id: invoice.seriesId },
      });

      if (!series) {
        throw new Error('Serie no encontrada');
      }

      if (!series.isActive) {
        throw new Error('La serie no está activa');
      }

      // 2. Incrementar el número actual de la serie
      const nextNumber = series.currentNumber + 1;

      await tx.invoiceSeries.update({
        where: { id: series.id },
        data: { currentNumber: nextNumber },
      });

      // 3. Construir número completo de factura
      const prefix = series.prefix || '';
      const fullNumber = prefix 
        ? `${prefix}-${series.code}-${nextNumber.toString().padStart(6, '0')}`
        : `${series.code}-${nextNumber.toString().padStart(6, '0')}`;

      // 4. Snapshot de datos del cliente (si existe)
      let customerSnapshot = {};
      if (invoice.customer) {
        customerSnapshot = {
          customerTaxId: invoice.customer.taxId,
          customerName: invoice.customer.name,
          customerAddress: invoice.customer.address || undefined,
        };
      }

      // 5. Emitir factura: cambiar estado a 'issued' y bloquear
      const issuedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'issued',
          number: nextNumber,
          fullNumber,
          lockedAt: new Date(),
          lockedBy: user.id,
          ...customerSnapshot,
        },
        include: {
          lines: {
            orderBy: { lineNumber: 'asc' },
          },
          series: true,
          customer: true,
          tenant: true,
        },
      });

      // 6. AUDITORÍA: Registrar emisión de factura (CRÍTICO)
      await tx.auditEvent.create({
        data: {
          userId: user.id,
          eventType: AuditEventTypes.INVOICE_ISSUE,
          action: `Factura emitida - Número: ${issuedInvoice.fullNumber}, Total: ${issuedInvoice.total}€`,
          entityType: 'invoice',
          entityId: invoiceId,
          metadata: {
            tenantId: invoice.tenantId,
            seriesId: series.id,
            seriesCode: series.code,
            invoiceNumber: issuedInvoice.number,
            fullNumber: issuedInvoice.fullNumber,
            subtotal: issuedInvoice.subtotal,
            taxAmount: issuedInvoice.taxAmount,
            total: issuedInvoice.total,
            customerId: invoice.customerId,
            customerName: invoice.customer?.name,
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });

      return issuedInvoice;
    });

    return NextResponse.json({ invoice: result });
  } catch (error: unknown) {
    console.error('Error al emitir factura:', error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes('Serie no encontrada') || 
          error.message.includes('no está activa')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Error de constraint de unicidad
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto al reservar número de factura. Intente de nuevo.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al emitir factura' },
      { status: 500 }
    );
  }
}
