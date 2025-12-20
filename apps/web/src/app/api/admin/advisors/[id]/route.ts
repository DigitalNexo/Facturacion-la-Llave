/**
 * API ADMIN - EDITAR ADVISOR
 * PUT /api/admin/advisors/:id
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

/**
 * PUT /api/admin/advisors/:id
 * Actualizar datos de un advisor (solo superadmin)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: advisorId } = await params;
    
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
        { error: 'Acceso denegado. Solo superadmins pueden editar advisors.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, companyName, taxId, professionalNumber } = body;

    // Buscar el advisor
    const advisor = await prisma.account.findUnique({
      where: { id: advisorId },
      include: {
        users: true,
        advisorProfile: true,
      },
    });

    if (!advisor || advisor.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Advisor no encontrado' },
        { status: 404 }
      );
    }

    const user = advisor.users[0];
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario del advisor no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar en transacción
    const updated = await prisma.$transaction(async (tx: any) => {
      // Actualizar User
      if (name !== undefined || email !== undefined) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email }),
          },
        });
      }

      // Actualizar AdvisorProfile
      if (companyName !== undefined || taxId !== undefined || professionalNumber !== undefined) {
        await tx.advisorProfile.update({
          where: { accountId: advisorId },
          data: {
            ...(companyName !== undefined && { companyName }),
            ...(taxId !== undefined && { taxId }),
            ...(professionalNumber !== undefined && { professionalNumber }),
          },
        });
      }

      // Retornar advisor actualizado
      return await tx.account.findUnique({
        where: { id: advisorId },
        include: {
          users: true,
          advisorProfile: true,
        },
      });
    });

    return NextResponse.json({
      message: 'Advisor actualizado exitosamente',
      advisor: updated,
    });
  } catch (error: any) {
    console.error('Error al actualizar advisor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar advisor' },
      { status: 500 }
    );
  }
}
