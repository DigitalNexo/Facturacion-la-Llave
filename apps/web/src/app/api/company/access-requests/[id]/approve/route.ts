/**
 * API COMPANY - APROBAR SOLICITUD DE ACCESO
 * POST /api/company/access-requests/:id/approve
 * Empresa aprueba solicitud de gestor
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * POST /api/company/access-requests/:id/approve
 * Aprobar solicitud de acceso de gestor
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener la solicitud
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        tenant: true,
      },
    });

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (accessRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta solicitud ya fue procesada' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene acceso al tenant
    const userAccess = await prisma.tenantAccess.findFirst({
      where: {
        userId: session.user.id,
        tenantId: accessRequest.tenantId,
        isActive: true,
      },
    });

    if (!userAccess) {
      return NextResponse.json(
        { error: 'No tienes permiso para aprobar esta solicitud' },
        { status: 403 }
      );
    }

    // Crear acceso y actualizar solicitud en transacción
    await prisma.$transaction([
      // Crear TenantAccess
      prisma.tenantAccess.create({
        data: {
          userId: accessRequest.requesterId,
          tenantId: accessRequest.tenantId,
          grantedBy: session.user.id,
          isActive: true,
        },
      }),
      // Actualizar solicitud
      prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          respondedBy: session.user.id,
          respondedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Solicitud aprobada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al aprobar solicitud:', error);
    return NextResponse.json(
      { error: error.message || 'Error al aprobar solicitud' },
      { status: 500 }
    );
  }
}
