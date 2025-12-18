/**
 * API COMPANY - REVOCAR ACCESO DE GESTOR
 * DELETE /api/company/advisors/:id/revoke
 * Empresa revoca acceso de gestor
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * DELETE /api/company/advisors/:id/revoke
 * Empresa revoca acceso de un gestor
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accessId } = await params;
    
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el acceso existe y pertenece al tenant del usuario
    const access = await prisma.tenantAccess.findUnique({
      where: { id: accessId },
      include: {
        tenant: {
          include: {
            account: true,
          },
        },
        user: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: 'Acceso no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tiene acceso a ese tenant
    const userAccess = await prisma.tenantAccess.findFirst({
      where: {
        userId: session.user.id,
        tenantId: access.tenantId,
        isActive: true,
      },
    });

    if (!userAccess) {
      return NextResponse.json(
        { error: 'No tienes permiso para revocar este acceso' },
        { status: 403 }
      );
    }

    // Verificar que es un gestor el que se está revocando
    if (access.user.account.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Solo puedes revocar acceso de gestores' },
        { status: 400 }
      );
    }

    // Revocar acceso
    await prisma.tenantAccess.update({
      where: { id: accessId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Acceso revocado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al revocar acceso:', error);
    return NextResponse.json(
      { error: error.message || 'Error al revocar acceso' },
      { status: 500 }
    );
  }
}
