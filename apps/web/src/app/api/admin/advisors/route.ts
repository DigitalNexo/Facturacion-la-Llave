/**
 * API ADMIN - GESTIÓN DE ADVISORS
 * Solo accesible para superadmins
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { isSuperAdmin } from '@fll/core';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface CreateAdvisorBody {
  email: string;
  password: string;
  name: string;
  companyName?: string;
  taxId?: string;
  professionalNumber?: string;
}

/**
 * POST /api/admin/advisors
 * Crear un nuevo advisor (solo superadmin)
 */
export async function POST(request: Request) {
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
        { error: 'Acceso denegado. Solo superadmins pueden crear advisors.' },
        { status: 403 }
      );
    }

    const body: CreateAdvisorBody = await request.json();

    // Validaciones
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: 'Email, password y name son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar que el email no existe
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Crear advisor en transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Crear Account tipo advisor
      const account = await tx.account.create({
        data: {
          accountType: 'advisor',
          status: 'active', // Advisors empiezan activos (no pagan)
          isBillingEnabled: false, // Advisors NO pagan
        },
      });

      // 2. Crear User
      const user = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          accountId: account.id,
          mustChangePassword: true, // Forzar cambio en primer login
        },
      });

      // 3. Crear AdvisorProfile
      const advisorProfile = await tx.advisorProfile.create({
        data: {
          accountId: account.id,
          companyName: body.companyName,
          taxId: body.taxId,
          professionalNumber: body.professionalNumber,
          isVerified: false, // Requiere verificación manual
        },
      });

      return { account, user, advisorProfile };
    });

    return NextResponse.json(
      {
        message: 'Advisor creado exitosamente',
        userId: result.user.id,
        accountId: result.account.id,
        advisorProfileId: result.advisorProfile.id,
        isVerified: false,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear advisor:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear advisor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/advisors
 * Listar todos los advisors (solo superadmin)
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

    // Obtener todos los advisors
    const advisors = await prisma.account.findMany({
      where: { accountType: 'advisor' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true,
          },
        },
        advisorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      advisors,
      total: advisors.length,
    });
  } catch (error: any) {
    console.error('Error al listar advisors:', error);
    return NextResponse.json(
      { error: error.message || 'Error al listar advisors' },
      { status: 500 }
    );
  }
}
