#!/usr/bin/env tsx

/**
 * TEST DE REGISTRO LEGAL - FASE 7
 * Verificar cadena hash y registro de facturas
 */

import { PrismaClient } from '@fll/db';
import {
  createInvoiceRecord,
  verifyChainIntegrity,
  exportChain,
  calculateHash,
  generateInvoiceRecordPayload,
} from '@fll/core';

const db = new PrismaClient();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function printSuccess(msg: string) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function printError(msg: string) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function printInfo(msg: string) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

function printSection(title: string) {
  console.log('');
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log('');
}

async function createTestData() {
  printSection('1. CREAR DATOS DE PRUEBA');
  
  // Crear account, user, tenant, customer, series
  const account = await db.account.upsert({
    where: { id: 'test-fase7-account' },
    update: {},
    create: {
      id: 'test-fase7-account',
      accountType: 'company',
      status: 'active',
    },
  });
  printSuccess('Account creado');

  const user = await db.user.upsert({
    where: { email: 'test-fase7@example.com' },
    update: {},
    create: {
      email: 'test-fase7@example.com',
      passwordHash: 'test',
      accountId: account.id,
    },
  });
  printSuccess('Usuario creado');

  const tenant = await db.tenant.upsert({
    where: { taxId: 'B12345678' },
    update: {},
    create: {
      taxId: 'B12345678',
      businessName: 'Empresa Test Fase 7 S.L.',
      accountId: account.id,
    },
  });
  printSuccess('Tenant creado');

  const customer = await db.customer.upsert({
    where: { id: 'test-fase7-customer' },
    update: {},
    create: {
      id: 'test-fase7-customer',
      tenantId: tenant.id,
      taxId: 'B87654321',
      name: 'Cliente Test',
      email: 'cliente@test.com',
    },
  });
  printSuccess('Cliente creado');

  const series = await db.invoiceSeries.upsert({
    where: { id: 'test-fase7-series' },
    update: {},
    create: {
      id: 'test-fase7-series',
      tenantId: tenant.id,
      code: 'F7',
      currentNumber: 0,
      isActive: true,
    },
  });
  printSuccess('Serie creada');

  return { account, user, tenant, customer, series };
}

async function testHashCalculation() {
  printSection('2. TEST DE CÁLCULO DE HASH');

  const payload1 = generateInvoiceRecordPayload(
    {
      number: 1,
      issuedAt: new Date('2024-01-01'),
      type: 'F1',
      subtotal: 100,
      taxAmount: 21,
      total: 121,
      tenant: {
        taxId: 'B12345678',
        businessName: 'Test',
      },
      series: {
        code: 'F7',
      },
      customer: {
        taxId: 'B87654321',
        name: 'Cliente',
      },
      lines: [{ description: 'Producto test' }],
    },
    'creation',
    'user-test'
  );

  const hash1 = calculateHash(payload1, null);
  printInfo(`Hash 1 (sin previo): ${hash1.substring(0, 16)}...`);

  const hash2 = calculateHash(payload1, null);
  if (hash1 === hash2) {
    printSuccess('Hash determinista: mismo payload = mismo hash');
  } else {
    printError('Hash NO determinista');
    throw new Error('Hash calculation failed');
  }

  const hash3 = calculateHash(payload1, hash1);
  printInfo(`Hash 2 (con previo): ${hash3.substring(0, 16)}...`);

  if (hash1 !== hash3) {
    printSuccess('Hash encadenado: diferente con prevHash');
  } else {
    printError('Hash NO encadena correctamente');
    throw new Error('Chain calculation failed');
  }
}

async function testInvoiceRecordCreation(data: Awaited<ReturnType<typeof createTestData>>) {
  printSection('3. TEST DE CREACIÓN DE REGISTROS');

  const { user, tenant, customer, series } = data;

  // Crear 3 facturas y verificar cadena
  const invoiceIds: string[] = [];

  for (let i = 1; i <= 3; i++) {
    printInfo(`Creando factura ${i}...`);

    const result = await db.$transaction(async (tx: any) => {
      // Incrementar número de serie
      await tx.invoiceSeries.update({
        where: { id: series.id },
        data: { currentNumber: { increment: 1 } },
      });

      // Crear factura
      const invoice = await tx.invoice.create({
        data: {
          tenantId: tenant.id,
          seriesId: series.id,
          customerId: customer.id,
          type: 'simplified',
          number: i,
          fullNumber: `F7-${String(i).padStart(6, '0')}`,
          status: 'issued',
          issueDate: new Date(),
          subtotal: 100 * i,
          taxAmount: 21 * i,
          total: 121 * i,
          lockedAt: new Date(),
          lockedBy: user.id,
        },
        include: {
          tenant: true,
          series: true,
          customer: true,
          lines: true,
        },
      });

      // Crear línea
      await tx.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          lineNumber: 1,
          description: `Producto ${i}`,
          quantity: 1,
          unitPrice: 100 * i,
          taxRate: 21,
          taxAmount: 21 * i,
          subtotal: 100 * i,
          total: 121 * i,
        },
      });

      // Recargar con líneas
      const invoiceWithLines = await tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          tenant: true,
          series: true,
          customer: true,
          lines: true,
        },
      });

      // Crear registro legal
      const record = await createInvoiceRecord(
        tx,
        invoice.id,
        tenant.id,
        {
          number: invoiceWithLines!.number!,
          issuedAt: invoiceWithLines!.issueDate!,
          type: invoiceWithLines!.type,
          subtotal: invoiceWithLines!.subtotal.toNumber(),
          taxAmount: invoiceWithLines!.taxAmount.toNumber(),
          total: invoiceWithLines!.total.toNumber(),
          tenant: {
            taxId: invoiceWithLines!.tenant.taxId,
            businessName: invoiceWithLines!.tenant.businessName,
          },
          series: {
            code: invoiceWithLines!.series.code,
          },
          customer: {
            taxId: (invoiceWithLines!.customer!.taxId || 'N/A') as string,
            name: (invoiceWithLines!.customer!.name || 'Cliente genérico') as string,
          },
          lines: invoiceWithLines!.lines.map((line: any) => ({
            description: line.description,
          })),
        },
        'creation',
        user.id
      );

      return { invoice, record };
    });

    invoiceIds.push(result.invoice.id);
    printSuccess(`Factura ${i} creada con hash: ${result.record.hash.substring(0, 16)}...`);
  }

  return invoiceIds;
}

async function testChainVerification(tenantId: string) {
  printSection('4. TEST DE VERIFICACIÓN DE CADENA');

  const verification = await verifyChainIntegrity(db, tenantId);

  printInfo(`Total de registros: ${verification.totalRecords}`);
  
  if (verification.valid) {
    printSuccess('✅ Cadena íntegra - Todos los hashes coinciden');
  } else {
    printError('❌ Cadena comprometida:');
    verification.errors.forEach((err: string) => printError(`  - ${err}`));
    throw new Error('Chain integrity compromised');
  }

  // Exportar cadena
  const chain = await exportChain(db, tenantId);
  
  printInfo('Cadena exportada:');
  chain.forEach((record: any, i: number) => {
    console.log(`  ${i + 1}. Hash: ${record.hash.substring(0, 16)}... | PrevHash: ${record.prevHash?.substring(0, 16) || 'null'}...`);
  });
}

async function testTampering(tenantId: string) {
  printSection('5. TEST DE DETECCIÓN DE ALTERACIÓN');

  printInfo('Alterando payload de un registro en BD...');

  // Obtener primer registro
  const firstRecord = await db.invoiceRecord.findFirst({
    where: {
      invoice: {
        tenantId,
      },
    },
    orderBy: {
      recordedAt: 'asc',
    },
  });

  if (!firstRecord) {
    printError('No se encontró registro');
    return;
  }

  // Alterar payload (cambiar el total)
  const alteredPayload = { ...(firstRecord.recordPayload as any) };
  alteredPayload.total = 999999;

  await db.invoiceRecord.update({
    where: { id: firstRecord.id },
    data: {
      recordPayload: alteredPayload as any,
    },
  });

  printInfo('Payload alterado. Verificando cadena...');

  // Verificar
  const verification = await verifyChainIntegrity(db, tenantId);

  if (!verification.valid) {
    printSuccess('✅ Alteración detectada correctamente');
    printInfo('Errores detectados:');
    verification.errors.forEach((err: string) => printInfo(`  - ${err}`));
  } else {
    printError('❌ NO se detectó la alteración');
    throw new Error('Tampering detection failed');
  }

  // Restaurar
  await db.invoiceRecord.update({
    where: { id: firstRecord.id },
    data: {
      recordPayload: firstRecord.recordPayload as any,
    },
  });

  printSuccess('Payload restaurado');
}

async function cleanup() {
  printSection('6. LIMPIEZA DE DATOS DE PRUEBA');

  await db.invoiceLine.deleteMany({
    where: {
      invoice: {
        tenant: {
          taxId: 'B12345678',
        },
      },
    },
  });

  await db.invoiceRecord.deleteMany({
    where: {
      invoice: {
        tenant: {
          taxId: 'B12345678',
        },
      },
    },
  });

  await db.invoice.deleteMany({
    where: {
      tenant: {
        taxId: 'B12345678',
      },
    },
  });

  await db.invoiceSeries.deleteMany({
    where: {
      tenant: {
        taxId: 'B12345678',
      },
    },
  });

  await db.customer.deleteMany({
    where: {
      tenant: {
        taxId: 'B12345678',
      },
    },
  });

  await db.tenant.deleteMany({
    where: {
      taxId: 'B12345678',
    },
  });

  await db.user.deleteMany({
    where: {
      email: 'test-fase7@example.com',
    },
  });

  await db.account.deleteMany({
    where: {
      id: 'test-fase7-account',
    },
  });

  printSuccess('Datos de prueba eliminados');
}

async function main() {
  console.log('');
  console.log(`${colors.bold}${colors.cyan}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║                                                                    ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║  TEST DE REGISTRO LEGAL - FASE 7                                   ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║  Hash encadenado y verificación de integridad                      ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}║                                                                    ║${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  try {
    // 1. Crear datos
    const testData = await createTestData();

    // 2. Test de hash
    await testHashCalculation();

    // 3. Crear registros
    await testInvoiceRecordCreation(testData);

    // 4. Verificar cadena
    await testChainVerification(testData.tenant.id);

    // 5. Test de alteración
    await testTampering(testData.tenant.id);

    // 6. Limpiar
    await cleanup();

    console.log('');
    console.log(`${colors.bold}${colors.green}════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                                                  ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  🎉 TODOS LOS TESTS DE FASE 7 PASARON CORRECTAMENTE 🎉          ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                                                  ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  ✅ Hash determinista                                            ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  ✅ Cadena encadenada correctamente                              ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  ✅ Verificación de integridad funcional                         ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  ✅ Detección de alteraciones funcional                          ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                                                  ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Error en tests:${colors.reset}`, error);
    await cleanup().catch(console.error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
