import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const db = new PrismaClient();

// GET /api/tenants/[id]/customers - Listar clientes del tenant
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

    // Obtener clientes
    const customers = await db.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST /api/tenants/[id]/customers - Crear nuevo cliente
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
      return NextResponse.json({ error: 'Sin permisos para crear clientes' }, { status: 403 });
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

    // Verificar que no exista otro cliente con el mismo taxId en este tenant
    const existingCustomer = await db.customer.findFirst({
      where: {
        tenantId,
        taxId,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este NIF/CIF' },
        { status: 400 }
      );
    }

    // Crear cliente
    const customer = await db.customer.create({
      data: {
        tenantId,
        name,
        taxId,
        email: email || null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
