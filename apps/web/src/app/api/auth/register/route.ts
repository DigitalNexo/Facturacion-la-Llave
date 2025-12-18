/**
 * API DE REGISTRO
 * REGLA OBLIGATORIA: Solo se permite registro de self_employed y company
 * ❌ advisor NO se puede registrar públicamente
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@fll/db';
import bcrypt from 'bcryptjs';
import { TRIAL } from '@fll/core';
import { canCreateTenant } from '@fll/core';

const prisma = new PrismaClient();

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  accountType: 'self_employed' | 'company';
  planId?: string;
  // Datos del primer tenant (empresa del usuario)
  tenantName: string;
  tenantTaxId: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterBody = await request.json();

    // Validaciones básicas
    if (!body.email || !body.password || !body.name || !body.accountType) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // REGLA OBLIGATORIA: Solo self_employed y company
    if (body.accountType !== 'self_employed' && body.accountType !== 'company') {
      return NextResponse.json(
        { error: 'Tipo de cuenta no permitido. Solo puedes registrarte como autónomo o empresa.' },
        { status: 403 }
      );
    }

    // Validar que no exista el email
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Validar que no exista el NIF/CIF del tenant
    if (body.tenantTaxId) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { taxId: body.tenantTaxId },
      });

      if (existingTenant) {
        return NextResponse.json(
          { error: 'El NIF/CIF ya está registrado en el sistema' },
          { status: 400 }
        );
      }
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Obtener plan por defecto según accountType
    let defaultPlan = await prisma.plan.findFirst({
      where: {
        code: body.accountType === 'self_employed' ? 'AUTONOMO' : 'EMPRESA_BASIC',
      },
    });

    // Si se especificó un planId, usarlo
    if (body.planId) {
      const requestedPlan = await prisma.plan.findUnique({
        where: { id: body.planId },
      });
      if (requestedPlan) {
        defaultPlan = requestedPlan;
      }
    }

    if (!defaultPlan) {
      return NextResponse.json(
        { error: 'No se encontró un plan disponible' },
        { status: 500 }
      );
    }

    // REGLA OBLIGATORIA: Trial de 15 días
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL.DAYS);

    // Crear cuenta, usuario, suscripción y tenant en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Generar código de invitación único
      const { generateInvitationCode } = await import('@fll/core');
      let invitationCode = generateInvitationCode();
      
      // Asegurar que es único
      let codeExists = await tx.account.findUnique({ where: { invitationCode } });
      while (codeExists) {
        invitationCode = generateInvitationCode();
        codeExists = await tx.account.findUnique({ where: { invitationCode } });
      }
      
      // 1. Crear Account
      const account = await tx.account.create({
        data: {
          accountType: body.accountType,
          status: 'trialing',
          trialEndsAt,
          isBillingEnabled: true, // autónomo y empresa SÍ pagan
          invitationCode, // Código para que gestores soliciten acceso
        },
      });

      // 2. Crear User (owner)
      const user = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          accountId: account.id,
          mustChangePassword: false,
        },
      });

      // 3. Crear Subscription
      const subscription = await tx.subscription.create({
        data: {
          accountId: account.id,
          planId: defaultPlan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEndsAt,
        },
      });

      // 4. Crear primer Tenant (si se proporcionó)
      let tenant = null;
      if (body.tenantName && body.tenantTaxId) {
        // Contar tenants actuales
        const currentTenantsCount = await tx.tenant.count({
          where: { accountId: account.id },
        });

        // Validar que puede crear tenant
        const canCreate = canCreateTenant(account.accountType as any, currentTenantsCount, null);
        if (!canCreate.allowed) {
          throw new Error(canCreate.reason || 'No se puede crear el tenant');
        }

        tenant = await tx.tenant.create({
          data: {
            accountId: account.id,
            businessName: body.tenantName,
            taxId: body.tenantTaxId,
            isActive: true,
          },
        });

        // 5. Obtener permission set "completo-default"
        const completoPermSet = await tx.permissionSet.findUnique({
          where: { id: 'completo-default' },
        });

        // 6. Crear TenantAccess (owner tiene acceso completo)
        if (completoPermSet) {
          await tx.tenantAccess.create({
            data: {
              userId: user.id,
              tenantId: tenant.id,
              permissionSetId: completoPermSet.id,
              // isOwner se marca implícitamente por ser el primer acceso
            },
          });
        }
      }

      return { account, user, subscription, tenant };
    });

    return NextResponse.json(
      {
        message: 'Registro exitoso',
        userId: result.user.id,
        accountId: result.account.id,
        trialEndsAt: result.account.trialEndsAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: error.message || 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
