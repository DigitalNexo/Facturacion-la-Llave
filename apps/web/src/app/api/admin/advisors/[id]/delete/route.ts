/**
 * API ADMIN - ELIMINAR ADVISOR
 * DELETE /api/admin/advisors/:id
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

/**
 * DELETE /api/admin/advisors/:id
 * Eliminar un advisor (solo superadmin)
 * Nota: Eliminación en cascada borra User, AdvisorProfile, TenantAccess, AccessRequest
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
        { error: 'Acceso denegado. Solo superadmins pueden eliminar advisors.' },
        { status: 403 }
      );
    }

    // Buscar el advisor
    const advisor = await prisma.account.findUnique({
      where: { id: advisorId },
    });

    if (!advisor || advisor.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Advisor no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar account (cascada elimina users, advisorProfile, etc.)
    await prisma.account.delete({
      where: { id: advisorId },
    });

    return NextResponse.json({
      message: 'Advisor eliminado exitosamente',
      deletedId: advisorId,
    });
  } catch (error: any) {
    console.error('Error al eliminar advisor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar advisor' },
      { status: 500 }
    );
  }
}
