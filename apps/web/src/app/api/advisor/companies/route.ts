/**
 * API ADVISOR - LISTAR EMPRESAS
 * GET /api/advisor/companies
 * Devuelve las empresas donde el gestor tiene acceso activo
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * GET /api/advisor/companies
 * Lista las empresas donde el gestor tiene acceso
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener la cuenta del usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { account: true },
    });

    if (!user || user.account?.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para gestores.' },
        { status: 403 }
      );
    }

    // Obtener accesos activos del gestor
    const tenantAccesses = await prisma.tenantAccess.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formatear respuesta
    const companies = tenantAccesses.map((access) => ({
      id: access.tenant.id,
      name: access.tenant.businessName,
      taxId: access.tenant.taxId,
      accountType: access.tenant.account.accountType,
      grantedAt: access.grantedAt,
      isActive: access.isActive,
    }));

    return NextResponse.json({ companies });
  } catch (error: any) {
    console.error('Error al obtener empresas del gestor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener empresas' },
      { status: 500 }
    );
  }
}
