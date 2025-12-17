/**
 * UTILIDADES PARA BASE DE DATOS DE TEST
 * Helpers para limpiar y preparar BD entre tests
 */

import { PrismaClient } from '@fll/db';

const prisma = new PrismaClient();

/**
 * Limpia todas las tablas de la BD de test
 * ADVERTENCIA: Solo usar en BD de test
 */
export async function cleanDatabase() {
  // Verificar que es BD de test
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('cleanDatabase solo puede usarse en BD de test');
  }

  // Orden de eliminación respetando foreign keys
  // Orden de eliminación respetando foreign keys
  await prisma.auditEvent.deleteMany();
  await prisma.verifactuSubmission.deleteMany();
  await prisma.invoiceRecord.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.invoiceSeries.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.accessRequest.deleteMany();
  await prisma.tenantAccess.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.advisorProfile.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.usageCounter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.account.deleteMany();
  // No limpiamos plans ni permission_sets (son seeds)
}

/**
 * Resetea la BD a estado inicial (solo seeds)
 */
export async function resetDatabase() {
  await cleanDatabase();
  // Los seeds se mantienen (plans y permission_sets)
}

/**
 * Crea una cuenta de test con datos mínimos
 */
export async function createTestAccount(overrides?: {
  accountType?: 'self_employed' | 'company' | 'advisor';
  status?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'blocked';
}) {
  const account = await prisma.account.create({
    data: {
      accountType: overrides?.accountType || 'company',
      status: overrides?.status || 'active',
      isBillingEnabled: true,
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 días
    },
  });

  return account;
}

/**
 * Crea un usuario de test
 */
export async function createTestUser(accountId: string, overrides?: {
  email?: string;
  name?: string;
  isSuperAdmin?: boolean;
}) {
  const user = await prisma.user.create({
    data: {
      accountId,
      email: overrides?.email || `test-${Date.now()}@example.com`,
      passwordHash: 'hashed_password_for_testing',
      name: overrides?.name || 'Test User',
      isActive: true,
      isSuperAdmin: overrides?.isSuperAdmin || false,
    },
  });

  return user;
}

/**
 * Crea un tenant de test
 */
export async function createTestTenant(accountId: string, overrides?: {
  taxId?: string;
  businessName?: string;
}) {
  const tenant = await prisma.tenant.create({
    data: {
      accountId,
      taxId: overrides?.taxId || `B${Date.now().toString().slice(-8)}`,
      businessName: overrides?.businessName || 'Test Company S.L.',
      country: 'ES',
      verifactuMode: 'disabled',
      isActive: true,
    },
  });

  return tenant;
}

export { prisma };
