/**
 * API ADMIN - VERIFICAR ADVISOR
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

/**
 * PUT /api/admin/advisors/:id/verify
 * Verificar un advisor (solo superadmin)
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
        { error: 'Acceso denegado. Solo superadmins pueden verificar advisors.' },
        { status: 403 }
      );
    }

    // Buscar el advisor profile
    const advisorProfile = await prisma.advisorProfile.findUnique({
      where: { accountId: advisorId },
      include: {
        account: {
          include: {
            users: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!advisorProfile) {
      return NextResponse.json(
        { error: 'Advisor no encontrado' },
        { status: 404 }
      );
    }

    if (advisorProfile.isVerified) {
      return NextResponse.json(
        { error: 'Advisor ya está verificado' },
        { status: 400 }
      );
    }

    // Verificar advisor
    const updated = await prisma.advisorProfile.update({
      where: { accountId: advisorId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: session.user.email,
      },
    });

    return NextResponse.json({
      message: 'Advisor verificado exitosamente',
      advisorId: advisorId,
      verifiedAt: updated.verifiedAt,
      verifiedBy: updated.verifiedBy,
    });
  } catch (error: any) {
    console.error('Error al verificar advisor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al verificar advisor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/advisors/:id/verify
 * Revocar verificación de un advisor (solo superadmin)
 */
export async function DELETE(
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
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Revocar verificación
    await prisma.advisorProfile.update({
      where: { accountId: advisorId },
      data: {
        isVerified: false,
        verifiedAt: null,
        verifiedBy: null,
      },
    });

    return NextResponse.json({
      message: 'Verificación revocada exitosamente',
      advisorId: advisorId,
    });
  } catch (error: any) {
    console.error('Error al revocar verificación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al revocar verificación' },
      { status: 500 }
    );
  }
}
