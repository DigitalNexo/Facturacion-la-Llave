import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { z } from 'zod';
import { auditLog, AuditEventTypes } from '@fll/core';

const db = new PrismaClient();

// Schema para crear factura (borrador)
const createInvoiceSchema = z.object({
  seriesId: z.string().uuid('ID de serie inválido'),
  customerId: z.string().uuid('ID de cliente inválido').optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().min(1, 'La descripción es obligatoria'),
    quantity: z.number().positive('La cantidad debe ser positiva'),
    unitPrice: z.number().nonnegative('El precio no puede ser negativo'),
    taxRate: z.number().min(0).max(100, 'Tasa de impuesto inválida'),
  })).min(1, 'Debe haber al menos una línea'),
});

// GET /api/tenants/[id]/invoices - Listar facturas del tenant
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
    const tenantId = resolvedParams.id;

    // Verificar acceso al tenant
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const hasAccess = 
      tenant.accountId === user.accountId || 
      user.tenantAccesses.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a este tenant' }, { status: 403 });
    }

    // Obtener parámetros de filtro
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    // Construir query
    const where: any = { tenantId };
    if (statusParam) {
      where.status = statusParam;
    }

    // Obtener facturas
    const invoices = await db.invoice.findMany({
      where,
      include: {
        series: true,
        customer: true,
        lines: true,
      },
      orderBy: [
        { issueDate: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

// POST /api/tenants/[id]/invoices - Crear factura borrador
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
    const tenantId = resolvedParams.id;

    // Validar body
    const body = await req.json();
    const validation = createInvoiceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar acceso al tenant
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const hasAccess = 
      tenant.accountId === user.accountId || 
      user.tenantAccesses.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a este tenant' }, { status: 403 });
    }

    // Verificar que la serie existe y pertenece al tenant
    const series = await db.invoiceSeries.findUnique({
      where: { id: data.seriesId },
    });

    if (!series || series.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Serie no válida para este tenant' },
        { status: 400 }
      );
    }

    // Si hay customerId, verificar que existe
    if (data.customerId) {
      const customer = await db.customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer || customer.tenantId !== tenantId) {
        return NextResponse.json(
          { error: 'Cliente no válido para este tenant' },
          { status: 400 }
        );
      }
    }

    // Calcular totales
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

    // Crear factura en estado draft
    const invoice = await db.invoice.create({
      data: {
        tenantId,
        seriesId: data.seriesId,
        customerId: data.customerId,
        number: 0, // Se asignará al emitir
        fullNumber: 'BORRADOR',
        status: 'draft',
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal,
        taxAmount,
        total,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: true,
        series: true,
        customer: true,
      },
    });

    // AUDITORÍA: Registrar creación de factura
    await auditLog({
      userId: user.id,
      eventType: AuditEventTypes.INVOICE_CREATE,
      action: `Factura borrador creada - Serie: ${series.code}, Total: ${total}€`,
      entityType: 'invoice',
      entityId: invoice.id,
      metadata: {
        tenantId,
        seriesId: data.seriesId,
        customerId: data.customerId,
        subtotal,
        taxAmount,
        total,
        linesCount: data.lines.length,
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Error al crear factura:', error);
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    );
  }
}
