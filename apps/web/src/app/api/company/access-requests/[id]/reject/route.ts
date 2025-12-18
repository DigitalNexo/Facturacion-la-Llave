/**
 * API COMPANY - RECHAZAR SOLICITUD DE ACCESO
 * POST /api/company/access-requests/:id/reject
 * Empresa rechaza solicitud de gestor
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * POST /api/company/access-requests/:id/reject
 * Rechazar solicitud de acceso de gestor
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

    const body = await request.json();
    const { reason } = body;

    // Obtener la solicitud
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
        { error: 'No tienes permiso para rechazar esta solicitud' },
        { status: 403 }
      );
    }

    // Actualizar solicitud
    await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        respondedBy: session.user.id,
        respondedAt: new Date(),
        responseMessage: reason || null,
      },
    });

    return NextResponse.json({
      message: 'Solicitud rechazada',
    });
  } catch (error: any) {
    console.error('Error al rechazar solicitud:', error);
    return NextResponse.json(
      { error: error.message || 'Error al rechazar solicitud' },
      { status: 500 }
    );
  }
}
