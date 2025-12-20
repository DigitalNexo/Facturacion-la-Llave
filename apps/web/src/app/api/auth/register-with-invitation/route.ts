/**
 * API DE REGISTRO CON INVITACIÓN
 * Registro para empresas invitadas por gestores
 * Sin período de prueba - activación inmediata
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@fll/db';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface RegisterWithInvitationBody {
  token: string;
  password: string;
  name: string;
  tenantName: string;
  tenantTaxId: string;
  phone?: string;
  address?: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterWithInvitationBody = await request.json();

    // Validaciones básicas
    if (!body.token || !body.password || !body.name || !body.tenantName || !body.tenantTaxId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // Buscar y validar invitación
    const invitation = await prisma.invitation.findUnique({
      where: { token: body.token },
      include: { inviter: { include: { account: true } } },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue utilizada' },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }

    // Validar que no exista el email
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Validar que no exista el NIF/CIF
    const existingTenant = await prisma.tenant.findUnique({
      where: { taxId: body.tenantTaxId },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'El NIF/CIF ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Crear en transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Crear Account (tipo company, SIN trial - activación inmediata)
      const account = await tx.account.create({
        data: {
          accountType: 'company',
          status: 'active', // Activación inmediata
          isBillingEnabled: true, // Habilitado para facturación
          trialEndsAt: null, // Sin período de prueba
        },
      });

      // 2. Crear User
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          name: body.name,
          accountId: account.id,
        },
      });

      // 3. Crear Tenant (empresa del usuario)
      const tenant = await tx.tenant.create({
        data: {
          accountId: account.id,
          businessName: body.tenantName,
          taxId: body.tenantTaxId,
        },
      });

      // 4. Crear TenantAccess (usuario tiene acceso a su propia empresa)
      await tx.tenantAccess.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          grantedBy: 'system',
        },
      });

      // 5. Crear TenantAccess para el gestor que invitó
      await tx.tenantAccess.create({
        data: {
          userId: invitation.invitedBy,
          tenantId: tenant.id,
          grantedBy: user.email,
        },
      });

      // 6. Marcar invitación como aceptada
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      });

      return { account, user, tenant };
    });

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      account: {
        id: result.account.id,
        type: result.account.accountType,
        status: result.account.status,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tenant: {
        id: result.tenant.id,
        businessName: result.tenant.businessName,
      },
    });
  } catch (error: any) {
    console.error('Error en registro con invitación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear cuenta' },
      { status: 500 }
    );
  }
}
