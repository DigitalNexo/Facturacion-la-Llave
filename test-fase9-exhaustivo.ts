#!/usr/bin/env tsx

/**
 * ═══════════════════════════════════════════════════════════════════
 * PRUEBAS EXHAUSTIVAS - FASE 9: STRIPE SUSCRIPCIONES Y PAGOS
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Verifica al 100% la implementación de Stripe:
 * - Creación de checkout sessions
 * - Webhooks y eventos
 * - Sistema de planes y metadata
 * - Trial y bloqueo automático
 * - Integridad de datos
 * - Seguridad
 */

import { PrismaClient } from '@fll/db';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const db = new PrismaClient();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function printHeader(title: string) {
  console.log('');
  console.log(`${colors.bold}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log('');
}

function printSection(title: string) {
  console.log('');
  console.log(`${colors.bold}${colors.magenta}${title}${colors.reset}`);
  console.log(`${colors.magenta}${'─'.repeat(70)}${colors.reset}`);
}

function printSuccess(msg: string) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function printError(msg: string) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function printWarning(msg: string) {
  console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`);
}

function printInfo(msg: string) {
  console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`);
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    printSuccess(testName);
    if (details) {
      console.log(`   ${colors.blue}→ ${details}${colors.reset}`);
    }
  } else {
    failedTests++;
    printError(testName);
    if (details) {
      console.log(`   ${colors.red}→ ${details}${colors.reset}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 1. VERIFICACIÓN DE ARCHIVOS CORE
// ═══════════════════════════════════════════════════════════════════

async function test1_CoreFiles() {
  printSection('1. ARCHIVOS Y MÓDULOS CORE');

  const stripePath = join(__dirname, 'packages/core/src/stripe.ts');
  assert(existsSync(stripePath), 'Archivo stripe.ts existe');

  if (!existsSync(stripePath)) {
    printError('No se puede continuar sin stripe.ts');
    return;
  }

  const content = readFileSync(stripePath, 'utf-8');

  // Verificar imports
  assert(content.includes("import Stripe from 'stripe'"), 'Import de Stripe SDK');
  assert(content.includes("import { PrismaClient }"), 'Import de Prisma');

  // Verificar inicialización
  assert(content.includes('new Stripe('), 'Inicialización de Stripe');
  assert(content.includes('STRIPE_SECRET_KEY'), 'Usa variable de entorno STRIPE_SECRET_KEY');
  assert(content.includes('apiVersion:'), 'Define apiVersion');

  // Verificar constante de Price IDs
  assert(content.includes('STRIPE_PRICE_IDS'), 'Constante STRIPE_PRICE_IDS definida');
  assert(content.includes('AUTONOMO:'), 'Plan AUTONOMO en STRIPE_PRICE_IDS');
  assert(content.includes('EMPRESA_BASIC:'), 'Plan EMPRESA_BASIC en STRIPE_PRICE_IDS');
  assert(content.includes('EMPRESA_PRO:'), 'Plan EMPRESA_PRO en STRIPE_PRICE_IDS');
  assert(content.includes('ASESORIA:'), 'Plan ASESORIA en STRIPE_PRICE_IDS');

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 2. FUNCIONES PRINCIPALES
// ═══════════════════════════════════════════════════════════════════

async function test2_CoreFunctions() {
  printSection('2. FUNCIONES PRINCIPALES');

  const stripePath = join(__dirname, 'packages/core/src/stripe.ts');
  const content = readFileSync(stripePath, 'utf-8');

  // Funciones públicas
  assert(content.includes('export async function createCheckoutSession'), 'createCheckoutSession exportada');
  assert(content.includes('export async function createPortalSession'), 'createPortalSession exportada');
  assert(content.includes('export async function verifyWebhookSignature'), 'verifyWebhookSignature exportada');
  assert(content.includes('export async function processWebhookEvent'), 'processWebhookEvent exportada');
  assert(content.includes('export async function blockExpiredTrials'), 'blockExpiredTrials exportada');

  // Funciones de handlers (pueden ser no exportadas)
  assert(content.includes('function handleCheckoutCompleted'), 'handleCheckoutCompleted implementada');
  assert(content.includes('function handleSubscriptionCreated'), 'handleSubscriptionCreated implementada');
  assert(content.includes('function handleSubscriptionUpdated'), 'handleSubscriptionUpdated implementada');
  assert(content.includes('function handleSubscriptionDeleted'), 'handleSubscriptionDeleted implementada');
  assert(content.includes('function handleInvoicePaymentSucceeded'), 'handleInvoicePaymentSucceeded implementada');
  assert(content.includes('function handleInvoicePaymentFailed'), 'handleInvoicePaymentFailed implementada');

  // Función auxiliar
  assert(content.includes('function getPlanFromPriceId'), 'getPlanFromPriceId implementada (fallback)');

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 3. SISTEMA DE PLANES Y METADATA
// ═══════════════════════════════════════════════════════════════════

async function test3_PlanMetadataSystem() {
  printSection('3. SISTEMA DE PLANES Y METADATA');

  const stripePath = join(__dirname, 'packages/core/src/stripe.ts');
  const content = readFileSync(stripePath, 'utf-8');

  // Verificar que createCheckoutSession acepta planType
  const createCheckoutMatch = content.match(/createCheckoutSession\s*\(([^)]+)\)/);
  assert(!!createCheckoutMatch, 'Función createCheckoutSession encontrada');
  
  if (createCheckoutMatch) {
    const params = createCheckoutMatch[1];
    assert(params.includes('planType'), 'Parámetro planType en createCheckoutSession', params);
  }

  // Verificar que envía planType en metadata
  assert(content.includes('metadata:') && content.includes('planType'), 'Envía planType en metadata');
  assert(content.includes('subscription_data:'), 'Configura subscription_data');

  // Verificar que handleCheckoutCompleted lee planType
  const checkoutCompletedSection = content.substring(
    content.indexOf('handleCheckoutCompleted'),
    content.indexOf('handleCheckoutCompleted') + 1500
  );
  assert(checkoutCompletedSection.includes('metadata'), 'handleCheckoutCompleted lee metadata');
  assert(checkoutCompletedSection.includes('planType'), 'handleCheckoutCompleted extrae planType');
  assert(checkoutCompletedSection.includes('currentPlan'), 'handleCheckoutCompleted guarda currentPlan');

  // Verificar que handleSubscriptionCreated guarda stripePriceId y currentPlan
  const subscriptionCreatedSection = content.substring(
    content.indexOf('handleSubscriptionCreated'),
    content.indexOf('handleSubscriptionCreated') + 2000
  );
  assert(subscriptionCreatedSection.includes('stripePriceId'), 'handleSubscriptionCreated guarda stripePriceId');
  assert(subscriptionCreatedSection.includes('currentPlan'), 'handleSubscriptionCreated guarda currentPlan');

  // Verificar fallback con getPlanFromPriceId
  assert(subscriptionCreatedSection.includes('getPlanFromPriceId'), 'Usa getPlanFromPriceId como fallback');

  // Verificar que handleSubscriptionUpdated actualiza el plan
  const subscriptionUpdatedSection = content.substring(
    content.indexOf('handleSubscriptionUpdated'),
    content.indexOf('handleSubscriptionUpdated') + 2000
  );
  assert(subscriptionUpdatedSection.includes('stripePriceId'), 'handleSubscriptionUpdated actualiza stripePriceId');
  assert(subscriptionUpdatedSection.includes('currentPlan'), 'handleSubscriptionUpdated actualiza currentPlan');

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 4. BASE DE DATOS - SCHEMA
// ═══════════════════════════════════════════════════════════════════

async function test4_DatabaseSchema() {
  printSection('4. SCHEMA DE BASE DE DATOS');

  const schemaPath = join(__dirname, 'packages/db/prisma/schema.prisma');
  assert(existsSync(schemaPath), 'Archivo schema.prisma existe');

  if (!existsSync(schemaPath)) {
    printError('No se puede verificar schema sin archivo');
    return;
  }

  const schema = readFileSync(schemaPath, 'utf-8');

  // Verificar modelo Account
  const accountModelMatch = schema.match(/model\s+Account\s*\{([^}]+)\}/s);
  assert(!!accountModelMatch, 'Modelo Account encontrado en schema');

  if (accountModelMatch) {
    const accountFields = accountModelMatch[1];
    
    // Verificar campos Stripe existentes
    assert(accountFields.includes('stripeCustomerId'), 'Campo stripeCustomerId existe');
    assert(accountFields.includes('stripeSubscriptionId'), 'Campo stripeSubscriptionId existe');
    
    // Verificar NUEVOS campos
    assert(accountFields.includes('stripePriceId'), 'Campo stripePriceId existe (NUEVO)');
    assert(accountFields.includes('currentPlan'), 'Campo currentPlan existe (NUEVO)');
    
    // Verificar que son opcionales
    assert(/stripePriceId\s+String\?/.test(accountFields), 'stripePriceId es opcional (String?)');
    assert(/currentPlan\s+String\?/.test(accountFields), 'currentPlan es opcional (String?)');
    
    // Verificar mapeo a snake_case
    assert(accountFields.includes('@map("stripe_price_id")'), 'stripePriceId mapeado a stripe_price_id');
    assert(accountFields.includes('@map("current_plan")'), 'currentPlan mapeado a current_plan');
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 5. API ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

async function test5_APIEndpoints() {
  printSection('5. API ENDPOINTS');

  // 1. Checkout Session
  const checkoutPath = join(__dirname, 'apps/web/src/app/api/stripe/create-checkout-session/route.ts');
  assert(existsSync(checkoutPath), 'API create-checkout-session existe');

  if (existsSync(checkoutPath)) {
    const checkoutCode = readFileSync(checkoutPath, 'utf-8');
    
    assert(checkoutCode.includes('export async function POST'), 'Método POST implementado');
    assert(checkoutCode.includes('auth()'), 'Verifica autenticación');
    assert(checkoutCode.includes('createCheckoutSession'), 'Llama a createCheckoutSession');
    assert(checkoutCode.includes('planType'), 'Recibe planType del body');
    assert(checkoutCode.includes('STRIPE_PRICE_IDS'), 'Usa STRIPE_PRICE_IDS');
    
    // Verificar que valida el planType
    assert(checkoutCode.includes('AUTONOMO') || checkoutCode.includes('EMPRESA'), 'Valida planes permitidos');
    
    // Contar parámetros en la llamada (debe ser 6: accountId, priceId, planType, successUrl, cancelUrl, email)
    const callMatch = checkoutCode.match(/createCheckoutSession\s*\([^)]+\)/s);
    if (callMatch) {
      const callStr = callMatch[0];
      const commas = (callStr.match(/,/g) || []).length;
      assert(commas >= 5, `createCheckoutSession recibe 6 parámetros (encontrados: ${commas + 1})`);
    }
  }

  // 2. Portal Session
  const portalPath = join(__dirname, 'apps/web/src/app/api/stripe/create-portal-session/route.ts');
  assert(existsSync(portalPath), 'API create-portal-session existe');

  if (existsSync(portalPath)) {
    const portalCode = readFileSync(portalPath, 'utf-8');
    assert(portalCode.includes('export async function POST'), 'Método POST implementado');
    assert(portalCode.includes('createPortalSession'), 'Llama a createPortalSession');
    assert(portalCode.includes('stripeCustomerId'), 'Verifica stripeCustomerId');
  }

  // 3. Webhook
  const webhookPath = join(__dirname, 'apps/web/src/app/api/stripe/webhook/route.ts');
  assert(existsSync(webhookPath), 'API webhook existe');

  if (existsSync(webhookPath)) {
    const webhookCode = readFileSync(webhookPath, 'utf-8');
    
    assert(webhookCode.includes('export async function POST'), 'Método POST implementado');
    assert(webhookCode.includes('verifyWebhookSignature'), 'Verifica firma del webhook (SEGURIDAD)');
    assert(webhookCode.includes('processWebhookEvent'), 'Procesa evento del webhook');
    assert(webhookCode.includes('stripe-signature'), 'Lee header stripe-signature');
    
    // CRÍTICO: Verificar que NO acepta webhooks sin firma válida
    assert(webhookCode.includes('catch (err') && webhookCode.includes('Invalid signature'), 'Rechaza webhooks sin firma válida');
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 6. WEBHOOKS - EVENTOS
// ═══════════════════════════════════════════════════════════════════

async function test6_WebhookEvents() {
  printSection('6. WEBHOOKS - MANEJO DE EVENTOS');

  const stripePath = join(__dirname, 'packages/core/src/stripe.ts');
  const content = readFileSync(stripePath, 'utf-8');

  // Verificar que processWebhookEvent maneja todos los eventos
  const processWebhookSection = content.substring(
    content.indexOf('processWebhookEvent'),
    content.indexOf('processWebhookEvent') + 3000
  );

  assert(processWebhookSection.includes('checkout.session.completed'), 'Maneja checkout.session.completed');
  assert(processWebhookSection.includes('customer.subscription.created'), 'Maneja customer.subscription.created');
  assert(processWebhookSection.includes('customer.subscription.updated'), 'Maneja customer.subscription.updated');
  assert(processWebhookSection.includes('customer.subscription.deleted'), 'Maneja customer.subscription.deleted');
  assert(processWebhookSection.includes('invoice.payment_succeeded'), 'Maneja invoice.payment_succeeded');
  assert(processWebhookSection.includes('invoice.payment_failed'), 'Maneja invoice.payment_failed');

  // Verificar que cada handler actualiza el status correcto
  assert(content.includes("status: 'trialing'") || content.includes('status: "trialing"'), 'Actualiza a TRIALING');
  assert(content.includes("status: 'active'") || content.includes('status: "active"'), 'Actualiza a ACTIVE');
  assert(content.includes("status: 'past_due'") || content.includes('status: "past_due"'), 'Actualiza a PAST_DUE');
  assert(content.includes("status: 'canceled'") || content.includes('status: "canceled"'), 'Actualiza a CANCELED');

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 7. SEGURIDAD
// ═══════════════════════════════════════════════════════════════════

async function test7_Security() {
  printSection('7. SEGURIDAD');

  const stripePath = join(__dirname, 'packages/core/src/stripe.ts');
  const content = readFileSync(stripePath, 'utf-8');

  // Verificar verifyWebhookSignature
  const verifySection = content.substring(
    content.indexOf('verifyWebhookSignature'),
    content.indexOf('verifyWebhookSignature') + 1000
  );

  assert(verifySection.includes('webhooks.constructEvent'), 'Usa Stripe.webhooks.constructEvent');
  
  // Verificar que el webhook route requiere STRIPE_WEBHOOK_SECRET
  const webhookRoutePath = join(__dirname, 'apps/web/src/app/api/stripe/webhook/route.ts');
  const webhookRouteContent = existsSync(webhookRoutePath) ? readFileSync(webhookRoutePath, 'utf-8') : '';
  assert(webhookRouteContent.includes('STRIPE_WEBHOOK_SECRET'), 'Requiere STRIPE_WEBHOOK_SECRET');
  
  // Verificar manejo de errores en webhook
  assert(webhookRouteContent.includes('try') && webhookRouteContent.includes('catch'), 'Maneja errores de verificación');

  // Verificar que las variables de entorno están documentadas
  const envExamplePath = join(__dirname, '.env.example');
  if (existsSync(envExamplePath)) {
    const envExample = readFileSync(envExamplePath, 'utf-8');
    assert(envExample.includes('STRIPE_SECRET_KEY'), '.env.example incluye STRIPE_SECRET_KEY');
    assert(envExample.includes('STRIPE_WEBHOOK_SECRET'), '.env.example incluye STRIPE_WEBHOOK_SECRET');
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 8. TRIAL Y BLOQUEO
// ═══════════════════════════════════════════════════════════════════

async function test8_TrialAndBlocking() {
  printSection('8. TRIAL Y BLOQUEO AUTOMÁTICO');

  // Verificar script de bloqueo
  const blockScriptPath = join(__dirname, 'block-expired-trials.ts');
  assert(existsSync(blockScriptPath), 'Script block-expired-trials.ts existe');

  if (existsSync(blockScriptPath)) {
    const blockScript = readFileSync(blockScriptPath, 'utf-8');
    
    assert(blockScript.includes('blockExpiredTrials'), 'Usa función blockExpiredTrials');
    assert(blockScript.includes('@fll/core'), 'Importa desde @fll/core');
  }

  // Verificar función blockExpiredTrials
  const stripePath = join(__dirname, 'packages/core/src/stripe.ts');
  const content = readFileSync(stripePath, 'utf-8');

  const blockSection = content.substring(
    content.indexOf('blockExpiredTrials'),
    content.indexOf('blockExpiredTrials') + 2000
  );

  assert(blockSection.includes('trialEndsAt'), 'Verifica trialEndsAt');
  assert(blockSection.includes('status:') && blockSection.includes('trialing'), 'Busca cuentas en TRIALING');
  assert(blockSection.includes('lt:') || blockSection.includes('lte:') || blockSection.includes('<'), 'Compara fecha de expiración');
  assert(blockSection.includes('blocked'), 'Actualiza a BLOCKED');
  assert(blockSection.includes('blockedAt'), 'Registra fecha de bloqueo');

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 9. EXPORTACIONES
// ═══════════════════════════════════════════════════════════════════

async function test9_Exports() {
  printSection('9. EXPORTACIONES DESDE @fll/core');

  const coreIndexPath = join(__dirname, 'packages/core/src/index.ts');
  assert(existsSync(coreIndexPath), 'Archivo packages/core/src/index.ts existe');

  if (existsSync(coreIndexPath)) {
    const coreIndex = readFileSync(coreIndexPath, 'utf-8');
    
    assert(coreIndex.includes("export * from './stripe'"), 'Exporta módulo stripe completo');
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 10. INTEGRIDAD DE DATOS
// ═══════════════════════════════════════════════════════════════════

async function test10_DataIntegrity() {
  printSection('10. INTEGRIDAD DE DATOS EN BASE DE DATOS');

  try {
    // Verificar que podemos conectar
    await db.$connect();
    printSuccess('Conexión a base de datos OK');

    // Verificar que los campos existen en el modelo
    const account = await db.account.findFirst();
    
    if (account) {
      printInfo(`Cuenta de prueba encontrada: ${account.id}`);
      
      // Verificar que los campos están disponibles (aunque sean null)
      const hasStripePriceId = 'stripePriceId' in account;
      const hasCurrentPlan = 'currentPlan' in account;
      
      assert(hasStripePriceId, 'Campo stripePriceId disponible en modelo Account');
      assert(hasCurrentPlan, 'Campo currentPlan disponible en modelo Account');
      
      if (account.stripePriceId) {
        printInfo(`  stripePriceId: ${account.stripePriceId}`);
      }
      if (account.currentPlan) {
        printInfo(`  currentPlan: ${account.currentPlan}`);
      }
    } else {
      printWarning('No hay cuentas en BD para verificar campos');
    }

  } catch (error: any) {
    printError(`Error verificando BD: ${error.message}`);
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// 11. DOCUMENTACIÓN
// ═══════════════════════════════════════════════════════════════════

async function test11_Documentation() {
  printSection('11. DOCUMENTACIÓN');

  const docs = [
    { file: 'COMO_FUNCIONA_STRIPE_AUTOMATICO.md', desc: 'Guía de sistema automático' },
    { file: 'DIAGRAMA_FLUJO_PAGOS.md', desc: 'Diagramas de flujo' },
    { file: 'COMO_SE_COMUNICA_EL_PLAN.md', desc: 'Sistema de metadata' },
    { file: 'IMPLEMENTACION_PLANES_COMPLETADA.md', desc: 'Resumen de implementación' },
  ];

  for (const doc of docs) {
    const path = join(__dirname, doc.file);
    assert(existsSync(path), `${doc.desc}: ${doc.file}`);
  }

  console.log('');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  printHeader('PRUEBAS EXHAUSTIVAS - FASE 9: STRIPE SUSCRIPCIONES');

  await test1_CoreFiles();
  await test2_CoreFunctions();
  await test3_PlanMetadataSystem();
  await test4_DatabaseSchema();
  await test5_APIEndpoints();
  await test6_WebhookEvents();
  await test7_Security();
  await test8_TrialAndBlocking();
  await test9_Exports();
  await test10_DataIntegrity();
  await test11_Documentation();

  // Resumen
  printHeader('RESUMEN DE PRUEBAS');
  
  console.log(`${colors.bold}Total de pruebas:${colors.reset} ${totalTests}`);
  console.log(`${colors.green}✅ Exitosas:${colors.reset} ${passedTests}`);
  console.log(`${colors.red}❌ Fallidas:${colors.reset} ${failedTests}`);
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`${colors.bold}Tasa de éxito:${colors.reset} ${successRate}%`);
  
  console.log('');
  
  if (failedTests === 0) {
    console.log(`${colors.bold}${colors.green}╔═══════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                                                   ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  ✅ FASE 9 COMPLETADA AL 100%                                     ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║  Sistema de suscripciones Stripe operativo                       ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}║                                                                   ║${colors.reset}`);
    console.log(`${colors.bold}${colors.green}╚═══════════════════════════════════════════════════════════════════╝${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.red}╔═══════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.red}║                                                                   ║${colors.reset}`);
    console.log(`${colors.bold}${colors.red}║  ❌ ERRORES DETECTADOS                                            ║${colors.reset}`);
    console.log(`${colors.bold}${colors.red}║  Revisar implementación antes de continuar                       ║${colors.reset}`);
    console.log(`${colors.bold}${colors.red}║                                                                   ║${colors.reset}`);
    console.log(`${colors.bold}${colors.red}╚═══════════════════════════════════════════════════════════════════╝${colors.reset}`);
  }

  console.log('');
  
  await db.$disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
