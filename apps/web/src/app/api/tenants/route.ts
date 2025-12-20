/**
 * API: CREAR TENANT
 * POST /api/tenants
 */

import { NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * POST - Crear nuevo tenant
 * 
 * VALIDACIONES OBLIGATORIAS:
 * - Autónomo: máximo 1 tenant
 * - Empresa: según límites del plan
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const data = await request.json();
    const { businessName, tradeName, taxId, address, postalCode, city, province, country } = data;

    // Validar campos obligatorios
    if (!businessName || !taxId) {
      return NextResponse.json(
        { error: 'Razón social y NIF son obligatorios' },
        { status: 400 }
      );
    }

    // Obtener usuario y su cuenta
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        account: {
          include: {
            tenants: true,
          },
        },
      },
    });

    if (!user || !user.account) {
      return NextResponse.json({ error: 'Usuario sin cuenta' }, { status: 403 });
    }

    const account = user.account;

    // VALIDACIÓN: Autónomo solo puede tener 1 tenant
    if (account.accountType === 'self_employed') {
      const existingTenantsCount = account.tenants.length;
      
      if (existingTenantsCount >= 1) {
        return NextResponse.json(
          { error: 'Los autónomos solo pueden tener 1 empresa' },
          { status: 400 }
        );
      }
    }

    // VALIDACIÓN: Empresa según límites del plan
    if (account.accountType === 'company') {
      // Obtener límite según plan actual
      let maxTenants = 3; // EMPRESA_BASIC default

      if (account.currentPlan === 'EMPRESA_PRO') {
        maxTenants = 10;
      } else if (account.currentPlan === 'EMPRESA_BASIC') {
        maxTenants = 3;
      }

      const existingTenantsCount = account.tenants.length;

      if (existingTenantsCount >= maxTenants) {
        return NextResponse.json(
          { error: `Has alcanzado el límite de ${maxTenants} empresas para tu plan` },
          { status: 400 }
        );
      }
    }

    // Verificar que no exista otro tenant con el mismo taxId
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        taxId,
        accountId: account.id,
      },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con este NIF' },
        { status: 400 }
      );
    }

    // Crear tenant
    const tenant = await prisma.tenant.create({
      data: {
        accountId: account.id,
        businessName,
        tradeName: tradeName || businessName,
        taxId,
        address: address || '',
        postalCode: postalCode || '',
        city: city || '',
        province: province || '',
        country: country || 'España',
        isActive: true,
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear tenant:', error);
    return NextResponse.json({ error: 'Error al crear tenant' }, { status: 500 });
  }
}
