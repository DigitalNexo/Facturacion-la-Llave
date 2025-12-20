import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const db = new PrismaClient();

// PUT /api/tenants/[id]/customers/[customerId] - Actualizar cliente
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const tenantId = resolvedParams.id;
    const customerId = resolvedParams.customerId;

    // Verificar acceso
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
      user.tenantAccesses.some((ta: any) => ta.canCreateInvoices);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin permisos para editar clientes' }, { status: 403 });
    }

    // Verificar que el cliente pertenece a este tenant
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer || existingCustomer.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Obtener datos del body
    const body = await req.json();
    const { name, taxId, email, phone, address, city, postalCode } = body;

    if (!name || !taxId) {
      return NextResponse.json(
        { error: 'Nombre y NIF/CIF son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que no exista otro cliente con el mismo taxId (excepto este)
    const duplicateCustomer = await db.customer.findFirst({
      where: {
        tenantId,
        taxId,
        id: { not: customerId },
      },
    });

    if (duplicateCustomer) {
      return NextResponse.json(
        { error: 'Ya existe otro cliente con este NIF/CIF' },
        { status: 400 }
      );
    }

    // Actualizar cliente
    const customer = await db.customer.update({
      where: { id: customerId },
      data: {
        name,
        taxId,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE /api/tenants/[id]/customers/[customerId] - Eliminar cliente
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const tenantId = resolvedParams.id;
    const customerId = resolvedParams.customerId;

    // Verificar acceso
    const user = await db.user.findUnique({
      where: { email: session.user.email },
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

    // Solo el dueño puede eliminar clientes
    if (tenant.accountId !== user.accountId) {
      return NextResponse.json({ error: 'Sin permisos para eliminar clientes' }, { status: 403 });
    }

    // Verificar que el cliente pertenece a este tenant
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer || existingCustomer.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Verificar que no tenga facturas
    const invoicesCount = await db.invoice.count({
      where: { customerId },
    });

    if (invoicesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente con facturas asociadas' },
        { status: 400 }
      );
    }

    // Eliminar cliente
    await db.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
