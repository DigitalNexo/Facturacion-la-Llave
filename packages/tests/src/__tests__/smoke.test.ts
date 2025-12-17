/**
 * SMOKE TEST
 * Test básico para verificar que el sistema funciona
 */

import { PrismaClient } from '@fll/db';
import { SYSTEM, TRIAL } from '@fll/core';

describe('Smoke Tests - Sistema básico', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Conexión a base de datos funciona', async () => {
    // Verificar que podemos conectar a la BD
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    expect(result).toBeDefined();
  });

  test('Constantes del sistema están definidas', () => {
    expect(SYSTEM.ID).toBe('FLL-SIF');
    expect(SYSTEM.PRODUCER_TAX_ID).toBe('B86634235');
    expect(TRIAL.DAYS).toBe(15);
  });

  test('Planes de suscripción existen en BD', async () => {
    const plans = await prisma.plan.findMany();
    
    // Debe haber al menos 4 planes (seeds)
    expect(plans.length).toBeGreaterThanOrEqual(4);
    
    // Verificar que existen los planes principales
    const planCodes: string[] = plans.map((p: any) => p.code);
    expect(planCodes).toContain('AUTONOMO');
    expect(planCodes).toContain('EMPRESA_BASIC');
    expect(planCodes).toContain('EMPRESA_PRO');
    expect(planCodes).toContain('ASESORIAS');
  });

  test('Permission sets existen en BD', async () => {
    const permissionSets = await prisma.permissionSet.findMany();
    
    // Debe haber al menos 3 permission sets (seeds)
    expect(permissionSets.length).toBeGreaterThanOrEqual(3);
    
    // Verificar que existen los sets principales
    const setIds: string[] = permissionSets.map((ps: any) => ps.id);
    expect(setIds).toContain('readonly-default');
    expect(setIds).toContain('facturador-default');
    expect(setIds).toContain('completo-default');
  });

  test('Todas las tablas críticas existen', async () => {
    // Verificar que podemos consultar todas las tablas principales
    const tables = [
      prisma.account.findMany({ take: 1 }),
      prisma.user.findMany({ take: 1 }),
      prisma.plan.findMany({ take: 1 }),
      prisma.subscription.findMany({ take: 1 }),
      prisma.tenant.findMany({ take: 1 }),
      prisma.customer.findMany({ take: 1 }),
      prisma.invoice.findMany({ take: 1 }),
      prisma.invoiceRecord.findMany({ take: 1 }),
      prisma.verifactuSubmission.findMany({ take: 1 }),
      prisma.auditEvent.findMany({ take: 1 }),
      prisma.permissionSet.findMany({ take: 1 }),
      prisma.tenantAccess.findMany({ take: 1 }),
      prisma.accessRequest.findMany({ take: 1 }),
      prisma.advisorProfile.findMany({ take: 1 }),
    ];

    // No debe lanzar error al consultar ninguna tabla
    await expect(Promise.all(tables)).resolves.toBeDefined();
  });
});
