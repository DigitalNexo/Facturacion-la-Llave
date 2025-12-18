import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { z } from 'zod';

const db = new PrismaClient();

// Schema de validación para actualizar serie
const updateSeriesSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio').max(20, 'Máximo 20 caracteres').optional(),
  name: z.string().optional(),
  prefix: z.string().max(10, 'Máximo 10 caracteres').optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/series/[id] - Obtener una serie específica
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
    const seriesId = resolvedParams.id;

    // Obtener la serie
    const series = await db.invoiceSeries.findUnique({
      where: { id: seriesId },
      include: {
        tenant: true,
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    // Verificar acceso al tenant de la serie
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId: series.tenantId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const hasAccess = 
      series.tenant.accountId === user.accountId || 
      user.tenantAccesses.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a esta serie' }, { status: 403 });
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error al obtener serie:', error);
    return NextResponse.json(
      { error: 'Error al obtener serie' },
      { status: 500 }
    );
  }
}

// PUT /api/series/[id] - Actualizar serie
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
    const seriesId = resolvedParams.id;

    // Validar body
    const body = await req.json();
    const validation = updateSeriesSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Obtener la serie
    const series = await db.invoiceSeries.findUnique({
      where: { id: seriesId },
      include: {
        tenant: true,
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId: series.tenantId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const hasAccess = 
      series.tenant.accountId === user.accountId || 
      user.tenantAccesses.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a esta serie' }, { status: 403 });
    }

    // No permitir cambiar código si ya tiene facturas
    if (data.code && data.code !== series.code && series._count.invoices > 0) {
      return NextResponse.json(
        { error: 'No se puede cambiar el código de una serie con facturas' },
        { status: 400 }
      );
    }

    // Si se marca como default, desmarcar otras series del mismo tenant
    if (data.isDefault && !series.isDefault) {
      await db.invoiceSeries.updateMany({
        where: { tenantId: series.tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Actualizar serie
    const updatedSeries = await db.invoiceSeries.update({
      where: { id: seriesId },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.prefix !== undefined && { prefix: data.prefix }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ series: updatedSeries });
  } catch (error: unknown) {
    console.error('Error al actualizar serie:', error);
    
    // Manejar error de unicidad
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una serie con ese código en este tenant' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar serie' },
      { status: 500 }
    );
  }
}

// DELETE /api/series/[id] - Eliminar serie
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const seriesId = resolvedParams.id;

    // Obtener la serie
    const series = await db.invoiceSeries.findUnique({
      where: { id: seriesId },
      include: {
        tenant: true,
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!series) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    // Verificar acceso
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        tenantAccesses: {
          where: { tenantId: series.tenantId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 403 });
    }

    const hasAccess = 
      series.tenant.accountId === user.accountId || 
      user.tenantAccesses.length > 0;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Sin acceso a esta serie' }, { status: 403 });
    }

    // No permitir borrar si tiene facturas
    if (series._count.invoices > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una serie con facturas asociadas' },
        { status: 400 }
      );
    }

    // Eliminar serie
    await db.invoiceSeries.delete({
      where: { id: seriesId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar serie:', error);
    return NextResponse.json(
      { error: 'Error al eliminar serie' },
      { status: 500 }
    );
  }
}
