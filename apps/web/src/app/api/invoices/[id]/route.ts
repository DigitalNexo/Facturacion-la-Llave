import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { z } from 'zod';
import { auditLog, AuditEventTypes } from '@fll/core/audit';

const db = new PrismaClient();

// Schema para actualizar factura
const updateInvoiceSchema = z.object({
  seriesId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  lines: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    taxRate: z.number().min(0).max(100),
  })).optional(),
});

// GET /api/invoices/[id] - Obtener una factura específica
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

    // Obtener la factura
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        series: true,
        customer: true,
        lines: {
          orderBy: { lineNumber: 'asc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // Verificar acceso al tenant de la factura
    const getUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId: invoice.tenantId },
        },
      },
    });

    if (!getUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const hasGetAccess = 
      invoice.tenant.accountId === getUser.accountId || 
      getUser.tenantAccesses.length > 0;

    if (!hasGetAccess) {
      return NextResponse.json({ error: 'Sin acceso a esta factura' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Actualizar factura (solo draft)
export async function PUT(
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

    // Validar body
    const body = await req.json();
    const validation = updateInvoiceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Obtener la factura
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        lines: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    // ⚠️ REGLA CRÍTICA: Solo se pueden editar facturas en estado draft
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'No se pueden editar facturas emitidas. Estado actual: ' + invoice.status },
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

    // Si hay líneas nuevas, recalcular totales
    let updateData: Record<string, unknown> = {};

    if (data.lines && data.lines.length > 0) {
      let subtotal = 0;
      let taxAmount = 0;

      const linesData = data.lines.map((line: any, index: number) => {
        const lineSubtotal = line.quantity * line.unitPrice;
        const lineTaxAmount = lineSubtotal * (line.taxRate / 100);
        const lineTotal = lineSubtotal + lineTaxAmount;

        subtotal += lineSubtotal;
        taxAmount += lineTaxAmount;

        return {
          lineNumber: index + 1,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          taxAmount: lineTaxAmount,
          subtotal: lineSubtotal,
          total: lineTotal,
        };
      });

      const total = subtotal + taxAmount;

      // Borrar líneas anteriores y crear nuevas
      await db.invoiceLine.deleteMany({
        where: { invoiceId },
      });

      updateData = {
        subtotal,
        taxAmount,
        total,
        lines: {
          create: linesData,
        },
      };
    }

    // Actualizar otros campos
    if (data.seriesId) updateData.seriesId = data.seriesId;
    if (data.customerId !== undefined) updateData.customerId = data.customerId;
    if (data.issueDate !== undefined) {
      updateData.issueDate = data.issueDate ? new Date(data.issueDate) : null;
    }
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Actualizar factura
    const updatedInvoice = await db.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        lines: {
          orderBy: { lineNumber: 'asc' },
        },
        series: true,
        customer: true,
      },
    });

    // AUDITORÍA: Registrar edición de factura borrador
    await auditLog({
      userId: user.id,
      eventType: AuditEventTypes.INVOICE_UPDATE,
      action: `Factura borrador editada - ID: ${invoiceId}`,
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: {
        tenantId: invoice.tenantId,
        changedFields: Object.keys(updateData),
        newTotal: updatedInvoice.total,
        linesCount: updatedInvoice.lines.length,
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    return NextResponse.json(
      { error: 'Error al actualizar factura' },
      { status: 500 }
    );
  }
}

// ❌ DELETE PROHIBIDO - Según FACTURACION_LA_LLAVE_OBLIGATORIO.md
// Las facturas NO se pueden eliminar. Solo se rectifican.
// Punto 9: "❌ Prohibido borrar facturas"
// Punto 15: "Prohibiciones absolutas: Borrar facturas"
