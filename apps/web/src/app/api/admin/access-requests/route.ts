/**
 * API ADMIN - GESTIÓN DE ACCESS REQUESTS
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';

const prisma = new PrismaClient();

/**
 * GET /api/admin/access-requests
 * Listar todas las solicitudes de acceso (solo superadmin)
 */
export async function GET(request: Request) {
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
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected

    // Construir filtros
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // Obtener solicitudes
    const requests = await prisma.accessRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            businessName: true,
            taxId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      requests,
      total: requests.length,
    });
  } catch (error: any) {
    console.error('Error al listar solicitudes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar solicitudes' },
      { status: 500 }
    );
  }
}
