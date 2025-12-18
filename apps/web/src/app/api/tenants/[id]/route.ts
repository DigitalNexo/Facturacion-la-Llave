/**
 * API: OBTENER Y ACTUALIZAR TENANT
 * GET/PUT /api/tenants/[id]
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * GET - Obtener tenant
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que el tenant pertenece al usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        account: {
          users: {
            some: { email: session.user.email },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('Error al obtener tenant:', error);
    return NextResponse.json({ error: 'Error al obtener tenant' }, { status: 500 });
  }
}

/**
 * PUT - Actualizar tenant
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await request.json();

    // Verificar que el tenant pertenece al usuario
    const tenant = await prisma.tenant.findFirst({
      where: {
        id,
        account: {
          users: {
            some: { email: session.user.email },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    // Actualizar (taxId no se puede cambiar)
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        businessName: data.businessName,
        tradeName: data.tradeName,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        province: data.province,
        country: data.country,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar tenant:', error);
    return NextResponse.json({ error: 'Error al actualizar tenant' }, { status: 500 });
  }
}
