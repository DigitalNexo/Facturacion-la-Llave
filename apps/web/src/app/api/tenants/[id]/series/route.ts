import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { z } from 'zod';

const db = new PrismaClient();

// Schema de validación para crear serie
const createSeriesSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(20, 'Máximo 20 caracteres'),
  name: z.string().optional(),
  prefix: z.string().max(10, 'Máximo 10 caracteres').optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/tenants/[id]/series - Listar series del tenant
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

    // Verificar que el usuario tiene acceso al tenant
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

    // Verificar acceso: debe ser owner del tenant o tener acceso a través de tenantAccesses
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

    // Obtener series del tenant
    const series = await db.invoiceSeries.findMany({
      where: { tenantId },
      orderBy: [
        { isDefault: 'desc' },
        { code: 'asc' },
      ],
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error al obtener series:', error);
    return NextResponse.json(
      { error: 'Error al obtener series' },
      { status: 500 }
    );
  }
}

// POST /api/tenants/[id]/series - Crear nueva serie
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
    const validation = createSeriesSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar que el usuario tiene acceso al tenant
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

    // Verificar acceso
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

    // Si se marca como default, desmarcar otras series
    if (data.isDefault) {
      await db.invoiceSeries.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Crear serie
    const series = await db.invoiceSeries.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        prefix: data.prefix,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
        currentNumber: 0,
      },
    });

    return NextResponse.json({ series }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error al crear serie:', error);
    
    // Manejar error de unicidad
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una serie con ese código en este tenant' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear serie' },
      { status: 500 }
    );
  }
}
