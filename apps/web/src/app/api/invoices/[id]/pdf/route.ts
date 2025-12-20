import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import jsPDF from 'jspdf';
import { auditLog, AuditEventTypes } from '@fll/core';

const db = new PrismaClient();

// GET /api/invoices/[id]/pdf - Generar PDF de factura emitida
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

    // Solo se puede descargar PDF de facturas emitidas
    if (invoice.status !== 'issued') {
      return NextResponse.json(
        { error: 'Solo se puede generar PDF de facturas emitidas' },
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

    // Generar PDF
    const doc = new jsPDF();
    let yPos = 20;

    // Título
    doc.setFontSize(20);
    doc.text('FACTURA', 105, yPos, { align: 'center' });
    yPos += 15;

    // Número de factura
    doc.setFontSize(14);
    doc.text(`Nº: ${invoice.fullNumber}`, 20, yPos);
    yPos += 10;

    // Datos del emisor (tenant)
    doc.setFontSize(12);
    doc.text('DATOS DEL EMISOR', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.text(`Empresa: ${invoice.tenant.tradeName || invoice.tenant.businessName}`, 20, yPos);
    yPos += 5;
    doc.text(`NIF/CIF: ${invoice.tenant.taxId}`, 20, yPos);
    yPos += 5;
    if (invoice.tenant.address) {
      doc.text(`Dirección: ${invoice.tenant.address}`, 20, yPos);
      yPos += 5;
    }
    yPos += 5;

    // Datos del cliente
    doc.setFontSize(12);
    doc.text('DATOS DEL CLIENTE', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    if (invoice.customer) {
      doc.text(`Cliente: ${invoice.customer.name}`, 20, yPos);
      yPos += 5;
      doc.text(`NIF/CIF: ${invoice.customer.taxId}`, 20, yPos);
      yPos += 5;
      if (invoice.customer.address) {
        doc.text(`Dirección: ${invoice.customer.address}`, 20, yPos);
        yPos += 5;
      }
    } else {
      doc.text('Cliente: Sin especificar', 20, yPos);
      yPos += 5;
    }
    yPos += 5;

    // Fechas
    doc.setFontSize(10);
    const issueDate = invoice.issueDate 
      ? new Date(invoice.issueDate).toLocaleDateString('es-ES')
      : '-';
    doc.text(`Fecha de emisión: ${issueDate}`, 20, yPos);
    yPos += 5;
    
    if (invoice.dueDate) {
      const dueDate = new Date(invoice.dueDate).toLocaleDateString('es-ES');
      doc.text(`Fecha de vencimiento: ${dueDate}`, 20, yPos);
      yPos += 5;
    }
    yPos += 10;

    // Líneas de factura
    doc.setFontSize(12);
    doc.text('DETALLE', 20, yPos);
    yPos += 7;

    // Cabecera de tabla
    doc.setFontSize(9);
    doc.text('Descripción', 20, yPos);
    doc.text('Cant.', 120, yPos);
    doc.text('P.Unit.', 140, yPos);
    doc.text('IVA%', 160, yPos);
    doc.text('Total', 180, yPos);
    yPos += 5;
    doc.line(20, yPos, 200, yPos); // Línea horizontal
    yPos += 5;

    // Líneas
    invoice.lines.forEach((line: any) => {
      const lineTotal = Number(line.total);
      doc.text(line.description.substring(0, 40), 20, yPos);
      doc.text(String(line.quantity), 120, yPos);
      doc.text(`${Number(line.unitPrice).toFixed(2)}€`, 140, yPos);
      doc.text(`${Number(line.taxRate)}%`, 160, yPos);
      doc.text(`${lineTotal.toFixed(2)}€`, 180, yPos);
      yPos += 5;

      // Nueva página si es necesario
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    yPos += 5;
    doc.line(20, yPos, 200, yPos); // Línea horizontal
    yPos += 10;

    // Totales
    doc.setFontSize(11);
    const subtotal = Number(invoice.subtotal);
    const taxAmount = Number(invoice.taxAmount);
    const total = Number(invoice.total);

    doc.text(`Subtotal:`, 140, yPos);
    doc.text(`${subtotal.toFixed(2)}€`, 180, yPos);
    yPos += 6;

    doc.text(`IVA:`, 140, yPos);
    doc.text(`${taxAmount.toFixed(2)}€`, 180, yPos);
    yPos += 8;

    doc.setFontSize(13);
    doc.text(`TOTAL:`, 140, yPos);
    doc.text(`${total.toFixed(2)}€`, 180, yPos);

    // Pie de página
    doc.setFontSize(8);
    doc.text(
      'Este documento es una factura válida. Conservar para justificación fiscal.',
      105,
      280,
      { align: 'center' }
    );

    // Generar buffer del PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // AUDITORÍA: Registrar descarga de PDF
    await auditLog({
      userId: user.id,
      eventType: AuditEventTypes.INVOICE_PDF_DOWNLOAD,
      action: `PDF descargado - Factura: ${invoice.fullNumber}`,
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: {
        tenantId: invoice.tenantId,
        invoiceNumber: invoice.fullNumber,
        total: invoice.total,
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    });

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Factura-${invoice.fullNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar PDF' },
      { status: 500 }
    );
  }
}
