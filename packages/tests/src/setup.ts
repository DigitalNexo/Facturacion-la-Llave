/**
 * SETUP GLOBAL DE TESTS
 * Se ejecuta antes de cada suite de tests
 */

import { PrismaClient } from '@fll/db';

// Timeout extendido para operaciones de BD
jest.setTimeout(30000);

// Cliente Prisma global para tests
let prisma: PrismaClient;

beforeAll(async () => {
  // Advertencia si no estamos usando BD de test
  if (!process.env.DATABASE_URL?.includes('test')) {
    console.warn(
      '\n⚠️  ADVERTENCIA: No estás usando una base de datos de test.\n' +
      '   Para tests de modificación, usa DATABASE_URL con "test" en el nombre.\n' +
      '   Smoke tests (solo lectura) pueden ejecutarse en cualquier BD.\n'
    );
  }

  prisma = new PrismaClient();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

// Export para uso en tests
export { prisma };
