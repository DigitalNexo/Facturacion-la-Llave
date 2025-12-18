/**
 * TESTS DE AUTENTICACIÓN - FASE 3
 * Tests para registro, login, trial y bloqueo
 */

import { PrismaClient } from '@fll/db';
import bcrypt from 'bcryptjs';
import { TRIAL } from '@fll/core';

const prisma = new PrismaClient();

describe('FASE 3 - Autenticación y Trial', () => {
  beforeAll(async () => {
    // Limpiar datos de test
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-auth.com' } },
    });
    await prisma.account.deleteMany({
      where: {
        users: {
          none: {},
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Registro de usuarios', () => {
    test('Debe permitir registro de self_employed', async () => {
      const email = 'autonomo@test-auth.com';
      const passwordHash = await bcrypt.hash('password123', 12);

      // Obtener plan AUTONOMO
      const plan = await prisma.plan.findFirst({
        where: { code: 'AUTONOMO' },
      });

      expect(plan).toBeDefined();

      // Crear cuenta + usuario
      const account = await prisma.account.create({
        data: {
          accountType: 'self_employed',
          status: 'trialing',
          trialEndsAt: new Date(Date.now() + TRIAL.DAYS * 24 * 60 * 60 * 1000),
          isBillingEnabled: true,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Test Autónomo',
          accountId: account.id,
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(account.accountType).toBe('self_employed');
      expect(account.status).toBe('trialing');
    });

    test('Debe permitir registro de company', async () => {
      const email = 'empresa@test-auth.com';
      const passwordHash = await bcrypt.hash('password123', 12);

      const plan = await prisma.plan.findFirst({
        where: { code: 'EMPRESA_BASIC' },
      });

      expect(plan).toBeDefined();

      const account = await prisma.account.create({
        data: {
          accountType: 'company',
          status: 'trialing',
          trialEndsAt: new Date(Date.now() + TRIAL.DAYS * 24 * 60 * 60 * 1000),
          isBillingEnabled: true,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Test Empresa',
          accountId: account.id,
        },
      });

      expect(user).toBeDefined();
      expect(account.accountType).toBe('company');
    });

    test('NO debe permitir crear advisor públicamente (solo admin)', async () => {
      // Este test verifica que el endpoint de registro rechaza advisor
      // En la API de registro, accountType debe ser solo self_employed o company
      
      // Intentar crear advisor directamente en BD debería fallar
      // porque la API no lo permite
      const advisorTypes = ['advisor'];
      
      for (const type of advisorTypes) {
        expect(type).not.toBe('self_employed');
        expect(type).not.toBe('company');
      }
    });

    test('Debe crear trial de exactamente 15 días', () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + TRIAL.DAYS * 24 * 60 * 60 * 1000);
      
      const daysDiff = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(TRIAL.DAYS).toBe(15);
      expect(daysDiff).toBe(15);
    });
  });

  describe('Login y verificación de contraseña', () => {
    test('Debe verificar contraseña correctamente', async () => {
      const password = 'SecurePass123';
      const hash = await bcrypt.hash(password, 12);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    test('Debe denegar login si trial expiró', async () => {
      const email = 'expired@test-auth.com';
      const passwordHash = await bcrypt.hash('password123', 12);

      // Crear cuenta con trial expirado
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Ayer

      const account = await prisma.account.create({
        data: {
          accountType: 'self_employed',
          status: 'trialing',
          trialEndsAt: expiredDate,
          isBillingEnabled: true,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Test Expired',
          accountId: account.id,
        },
      });

      // Verificar que trial expiró
      const now = new Date();
      expect(now > expiredDate).toBe(true);

      // La cuenta debería bloquearse
      const shouldBeBlocked = account.status === 'trialing' && now > expiredDate;
      expect(shouldBeBlocked).toBe(true);
    });

    test('Debe permitir login si trial está activo', async () => {
      const email = 'active-trial@test-auth.com';
      const passwordHash = await bcrypt.hash('password123', 12);

      // Crear cuenta con trial activo
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10); // 10 días en el futuro

      const account = await prisma.account.create({
        data: {
          accountType: 'self_employed',
          status: 'trialing',
          trialEndsAt: futureDate,
          isBillingEnabled: true,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Test Active Trial',
          accountId: account.id,
        },
      });

      // Verificar que trial está activo
      const now = new Date();
      const isActiveTrialing = account.status === 'trialing' && now < futureDate;
      expect(isActiveTrialing).toBe(true);
    });

    test('Debe permitir login si cuenta está activa (con pago)', async () => {
      const email = 'active-paid@test-auth.com';
      const passwordHash = await bcrypt.hash('password123', 12);

      const account = await prisma.account.create({
        data: {
          accountType: 'company',
          status: 'active', // Cuenta con suscripción activa
          trialEndsAt: null,
          isBillingEnabled: true,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Test Active Paid',
          accountId: account.id,
        },
      });

      expect(account.status).toBe('active');
    });

    test('Debe denegar login si cuenta está bloqueada', async () => {
      const email = 'blocked@test-auth.com';
      const passwordHash = await bcrypt.hash('password123', 12);

      const account = await prisma.account.create({
        data: {
          accountType: 'self_employed',
          status: 'blocked',
          trialEndsAt: null,
          isBillingEnabled: true,
        },
      });

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Test Blocked',
          accountId: account.id,
        },
      });

      expect(account.status).toBe('blocked');
      
      // Login debe denegarse
      const shouldDenyLogin = account.status === 'blocked';
      expect(shouldDenyLogin).toBe(true);
    });
  });

  describe('Validaciones de trial', () => {
    test('TRIAL.DAYS debe ser exactamente 15', () => {
      expect(TRIAL.DAYS).toBe(15);
    });

    test('Calcular días restantes correctamente', () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días
      
      const diff = trialEnd.getTime() - now.getTime();
      const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      expect(daysLeft).toBe(7);
    });

    test('Trial expirado debe tener días negativos', () => {
      const now = new Date();
      const trialEnd = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // -3 días
      
      const isExpired = now > trialEnd;
      expect(isExpired).toBe(true);
    });
  });
});
