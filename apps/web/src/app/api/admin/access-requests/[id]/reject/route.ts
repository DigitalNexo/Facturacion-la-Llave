/**
 * API ADMIN - RECHAZAR ACCESS REQUEST
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

interface RejectBody {
  reason?: string;
}

/**
 * POST /api/admin/access-requests/:id/reject
 * Rechazar una solicitud de acceso (solo superadmin)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    
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
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const body: RejectBody = await request.json().catch(() => ({}));

    // Buscar la solicitud
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
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

    // Obtener reason del body
    const { reason } = await request.json();

    // Rechazar solicitud
    
    const updated = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
        respondedBy: session.user.email,
        responseMessage: reason || 'Rechazado',
      },
    });

    return NextResponse.json({
      message: 'Solicitud rechazada',
      requestId,
      respondedAt: updated.respondedAt,
      respondedBy: updated.respondedBy,
      responseMessage: updated.responseMessage,
    });
  } catch (error: any) {
    console.error('Error al rechazar solicitud:', error);
    return NextResponse.json(
      { error: error.message || 'Error al rechazar solicitud' },
      { status: 500 }
    );
  }
}
