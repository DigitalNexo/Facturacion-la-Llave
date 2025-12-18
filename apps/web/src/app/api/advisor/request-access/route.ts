/**
 * API ADVISOR - SOLICITAR ACCESO CON CÓDIGO
 * POST /api/advisor/request-access
 * Gestor introduce código de empresa para solicitar acceso
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * POST /api/advisor/request-access
 * Gestor solicita acceso usando código de invitación de empresa
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es advisor
    const advisorAccount = await prisma.account.findUnique({
      where: { id: session.user.accountId },
      select: { accountType: true },
    });

    if (advisorAccount?.accountType !== 'advisor') {
      return NextResponse.json(
        { error: 'Solo gestores pueden solicitar acceso' },
        { status: 403 }
      );
    }

    const { invitationCode, message } = await request.json();

    if (!invitationCode || invitationCode.length !== 8) {
      return NextResponse.json(
        { error: 'Código de invitación inválido' },
        { status: 400 }
      );
    }

    // Buscar cuenta con ese código
    const targetAccount = await prisma.account.findFirst({
      where: { invitationCode: invitationCode.toUpperCase() },
      include: {
        tenants: {
          take: 1,
        },
      },
    });

    if (!targetAccount || targetAccount.accountType === 'advisor') {
      return NextResponse.json(
        { error: 'Código de invitación no válido' },
        { status: 404 }
      );
    }

    if (!targetAccount.tenants[0]) {
      return NextResponse.json(
        { error: 'Empresa no configurada' },
        { status: 404 }
      );
    }

    const tenant = targetAccount.tenants[0];

    // Verificar si ya tiene acceso
    const existingAccess = await prisma.tenantAccess.findFirst({
      where: {
        userId: session.user.id,
        tenantId: tenant.id,
      },
    });

    if (existingAccess && existingAccess.isActive) {
      return NextResponse.json(
        { error: 'Ya tienes acceso a esta empresa' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene una solicitud pendiente
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        requesterId: session.user.id,
        tenantId: tenant.id,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Ya tienes una solicitud pendiente para esta empresa' },
        { status: 400 }
      );
    }

    // Crear solicitud de acceso
    const accessRequest = await prisma.accessRequest.create({
      data: {
        requesterId: session.user.id,
        tenantId: tenant.id,
        status: 'pending',
        message: message || null,
      },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Solicitud de acceso enviada',
      request: {
        id: accessRequest.id,
        companyName: accessRequest.tenant.businessName,
        status: accessRequest.status,
      },
    });
  } catch (error: any) {
    console.error('Error al solicitar acceso:', error);
    return NextResponse.json(
      { error: error.message || 'Error al solicitar acceso' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advisor/request-access
 * Obtener solicitudes de acceso del gestor
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

    const requests = await prisma.accessRequest.findMany({
      where: {
        requesterId: session.user.id,
      },
      include: {
        tenant: {
          select: {
            businessName: true,
            taxId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error al obtener solicitudes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}
