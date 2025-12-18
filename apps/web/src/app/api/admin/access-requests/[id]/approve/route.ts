/**
 * API ADMIN - APROBAR/RECHAZAR ACCESS REQUEST
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

/**
 * POST /api/admin/access-requests/:id/approve
 * Aprobar una solicitud de acceso (solo superadmin)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es superadmin
    if (!isSuperAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo superadmins pueden aprobar solicitudes.' },
        { status: 403 }
      );
    }

    const { id: requestId } = await params;

    // Buscar la solicitud
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
        { error: `Solicitud ya fue ${accessRequest.status}` },
        { status: 400 }
      );
    }

    // Aprobar solicitud en transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear TenantAccess
      const tenantAccess = await tx.tenantAccess.create({
        data: {
          userId: accessRequest.requesterId,
          tenantId: accessRequest.tenantId,
          grantedBy: session.user.email!,
        },
      });

      // 2. Actualizar AccessRequest
      const updated = await tx.accessRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          respondedAt: new Date(),
          respondedBy: session.user.email!,
          responseMessage: 'Aprobado',
        },
      });

      return { tenantAccess, updated };
    });

    return NextResponse.json({
      message: 'Solicitud aprobada exitosamente',
      requestId,
      tenantAccessId: result.tenantAccess.id,
      respondedAt: result.updated.respondedAt,
      respondedBy: result.updated.respondedBy,
    });
  } catch (error: any) {
    console.error('Error al aprobar solicitud:', error);
    return NextResponse.json(
      { error: error.message || 'Error al aprobar solicitud' },
      { status: 500 }
    );
  }
}
