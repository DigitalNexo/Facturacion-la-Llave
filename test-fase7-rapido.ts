#!/usr/bin/env tsx

/**
 * VERIFICACIÓN RÁPIDA FASE 7
 * Prueba básica de hash sin BD
 */

import { calculateHash, generateInvoiceRecordPayload } from '@fll/core';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

console.log('');
console.log(`${colors.bold}${colors.blue}=== TEST RÁPIDO FASE 7: Hash Encadenado ===${colors.reset}`);
console.log('');

try {
  // Test 1: Generar payload
  const payload1 = generateInvoiceRecordPayload(
    {
      number: 1,
      issuedAt: new Date('2024-01-01'),
      type: 'ordinary',
      subtotal: 100,
      taxAmount: 21,
      total: 121,
      tenant: {
        taxId: 'B12345678',
        businessName: 'Test S.L.',
      },
      series: {
        code: 'TEST',
      },
      customer: {
        taxId: 'B87654321',
        name: 'Cliente Test',
      },
      lines: [{ description: 'Producto 1' }],
    },
    'creation',
    'user-test'
  );
  
  console.log(`${colors.green}✅ Payload generado correctamente${colors.reset}`);
  console.log(`   Sistema: ${payload1.systemId}`);
  console.log(`   Productor: ${payload1.producerTaxId}`);
  console.log(`   Factura: ${payload1.invoiceNumber}`);
  
  // Test 2: Calcular hash sin previo
  const hash1 = calculateHash(payload1, null);
  console.log(`${colors.green}✅ Hash 1 calculado: ${hash1.substring(0, 16)}...${colors.reset}`);
  
  // Test 3: Verificar determinismo
  const hash1bis = calculateHash(payload1, null);
  if (hash1 === hash1bis) {
    console.log(`${colors.green}✅ Hash determinista (mismo input = mismo hash)${colors.reset}`);
  } else {
    throw new Error('Hash NO determinista');
  }
  
  // Test 4: Calcular hash encadenado
  const payload2 = { ...payload1, invoiceNumber: 'TEST-000002' };
  const hash2 = calculateHash(payload2, hash1);
  console.log(`${colors.green}✅ Hash 2 calculado: ${hash2.substring(0, 16)}...${colors.reset}`);
  
  // Test 5: Verificar que son diferentes
  if (hash1 !== hash2) {
    console.log(`${colors.green}✅ Hashes encadenados correctamente (diferente con prevHash)${colors.reset}`);
  } else {
    throw new Error('Hashes son iguales (error en encadenamiento)');
  }
  
  console.log('');
  console.log(`${colors.bold}${colors.green}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║ ✅ TODOS LOS TESTS BÁSICOS PASADOS ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}════════════════════════════════════════${colors.reset}`);
  console.log('');
  
  process.exit(0);
} catch (error) {
  console.error(`${colors.red}❌ Error: ${error}${colors.reset}`);
  process.exit(1);
}
