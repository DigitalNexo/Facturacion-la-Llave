/**
 * API ADMIN - CAMBIAR CONTRASEÑA DE ADVISOR
 * POST /api/admin/advisors/:id/password
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * POST /api/admin/advisors/:id/password
 * Cambiar contraseña de un advisor (solo superadmin)
 */
export async function POST(
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
        { error: 'Acceso denegado. Solo superadmins pueden cambiar contraseñas.' },
        { status: 403 }
      );
    }

    const { newPassword, mustChangePassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar el advisor
    const advisor = await prisma.account.findUnique({
      where: { id: advisorId },
      include: { users: true },
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

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : false,
      },
    });

    return NextResponse.json({
      message: 'Contraseña actualizada exitosamente',
      mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : false,
    });
  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cambiar contraseña' },
      { status: 500 }
    );
  }
}
