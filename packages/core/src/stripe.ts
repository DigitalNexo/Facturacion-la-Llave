/**
 * STRIPE - MÓDULO DE SUSCRIPCIONES
 * Gestión completa de pagos y suscripciones
 * 
 * Conforme a:
 * - Plan de Trabajo Maestro FASE 9
 * - FACTURACION_LA_LLAVE_OBLIGATORIO.md
 * - Mejores prácticas de Stripe
 * 
 * IMPORTANTE:
 * Este módulo gestiona el ciclo completo de suscripciones:
 * - Trial 15 días → Active → Blocked
 * - Webhooks de Stripe (fuente única de verdad)
 * - Portal del cliente para gestionar suscripción
 */

import Stripe from 'stripe';
import { PrismaClient } from '@fll/db';

// Lazy init para evitar fallo en build cuando no hay STRIPE_SECRET_KEY
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (stripe) return stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
  stripe = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
  return stripe;
}

/**
 * IDs de productos en Stripe
 * IMPORTANTE: Estos IDs se obtienen de Stripe Dashboard después de crear los productos
 * Ver GUIA_CONFIGURACION_STRIPE.md para instrucciones
 */
export const STRIPE_PRICE_IDS = {
  AUTONOMO: process.env.STRIPE_PRICE_AUTONOMO || '',
  EMPRESA_BASIC: process.env.STRIPE_PRICE_EMPRESA_BASIC || '',
  EMPRESA_PRO: process.env.STRIPE_PRICE_EMPRESA_PRO || '',
  ASESORIA: process.env.STRIPE_PRICE_ASESORIA || '',
};

/**
 * Obtener planType a partir del Price ID de Stripe
 * Útil cuando no hay metadata disponible
 */
export function getPlanFromPriceId(priceId: string): string | null {
  switch (priceId) {
    case STRIPE_PRICE_IDS.AUTONOMO:
      return 'AUTONOMO';
    case STRIPE_PRICE_IDS.EMPRESA_BASIC:
      return 'EMPRESA_BASIC';
    case STRIPE_PRICE_IDS.EMPRESA_PRO:
      return 'EMPRESA_PRO';
    case STRIPE_PRICE_IDS.ASESORIA:
      return 'ASESORIA';
    default:
      return null;
  }
}

/**
 * Crea una sesión de checkout de Stripe
 * 
 * El usuario selecciona un plan y se le redirige a Stripe Checkout
 * para completar el pago.
 * 
 * @param accountId - ID de la cuenta
 * @param priceId - ID del precio en Stripe (ej: price_1234...)
 * @param successUrl - URL de retorno tras éxito
 * @param cancelUrl - URL de retorno si cancela
 * @param customerEmail - Email del cliente
 * @returns Sesión de checkout con URL
 */
export async function createCheckoutSession(
  accountId: string,
  priceId: string,
  planType: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail: string
): Promise<Stripe.Checkout.Session> {
  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      accountId, // Para identificar la cuenta en el webhook
      planType,  // Para saber qué plan eligió
    },
    subscription_data: {
      metadata: {
        accountId,
        planType, // También en subscription metadata
      },
      trial_period_days: 15, // Trial de 15 días
    },
    allow_promotion_codes: true, // Permite códigos de descuento
  });
  
  return session;
}

/**
 * Crea una sesión de portal del cliente
 * 
 * Permite al cliente gestionar su suscripción:
 * - Ver facturas
 * - Actualizar método de pago
 * - Cancelar suscripción
 * 
 * @param stripeCustomerId - ID del cliente en Stripe
 * @param returnUrl - URL de retorno
 * @returns Sesión del portal con URL
 */
export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });
  
  return session;
}

/**
 * Maneja el evento checkout.session.completed
 * 
 * Se ejecuta cuando el usuario completa el checkout.
 * Guarda el stripeCustomerId y stripeSubscriptionId.
 * 
 * @param db - Cliente de Prisma
 * @param session - Sesión de checkout de Stripe
 */
export async function handleCheckoutCompleted(
  db: PrismaClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const accountId = session.metadata?.accountId;
  const planType = session.metadata?.planType;
  
  if (!accountId) {
    throw new Error('No accountId en metadata de checkout session');
  }
  
  // Actualizar cuenta con IDs de Stripe y plan
  await db.account.update({
    where: { id: accountId },
    data: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      currentPlan: planType,
    },
  });
}

/**
 * Maneja el evento customer.subscription.created
 * 
 * Se ejecuta cuando se crea una suscripción.
 * Durante trial, el estado se mantiene como 'trialing'.
 * 
 * @param db - Cliente de Prisma
 * @param subscription - Suscripción de Stripe
 */
export async function handleSubscriptionCreated(
  db: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const accountId = subscription.metadata?.accountId;
  
  // Obtener plan y Price ID
  const stripePriceId = subscription.items.data[0]?.price.id;
  const planType = subscription.metadata?.planType || (stripePriceId ? getPlanFromPriceId(stripePriceId) : null);
  
  if (!accountId) {
    // Buscar por stripeSubscriptionId
    const account = await db.account.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    
    if (!account) {
      throw new Error('No se encontró cuenta para esta suscripción');
    }
    
    // Actualizar estado según Stripe
    await db.account.update({
      where: { id: account.id },
      data: {
        status: subscription.status === 'trialing' ? 'trialing' : 'active',
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        stripePriceId,
        currentPlan: planType,
      },
    });
    
    return;
  }
  
  // Actualizar estado y plan
  await db.account.update({
    where: { id: accountId },
    data: {
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      stripePriceId,
      currentPlan: planType,
    },
  });
}

/**
 * Maneja el evento customer.subscription.updated
 * 
 * Se ejecuta cuando cambia el estado de la suscripción.
 * Ejemplos: trial → active, active → past_due, etc.
 * 
 * @param db - Cliente de Prisma
 * @param subscription - Suscripción de Stripe
 */
export async function handleSubscriptionUpdated(
  db: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const account = await db.account.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  
  if (!account) {
    throw new Error('No se encontró cuenta para esta suscripción');
  }
  
  // Mapear estado de Stripe a estado de Account
  let newStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'blocked' = 'active';
  
  switch (subscription.status) {
    case 'trialing':
      newStatus = 'trialing';
      break;
    case 'active':
      newStatus = 'active';
      break;
    case 'past_due':
      newStatus = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      newStatus = 'canceled';
      break;
    case 'incomplete':
    case 'incomplete_expired':
      newStatus = 'blocked';
      break;
  }
  
  // Actualizar plan si cambió (upgrade/downgrade)
  const stripePriceId = subscription.items.data[0]?.price.id;
  const planType = subscription.metadata?.planType || (stripePriceId ? getPlanFromPriceId(stripePriceId) : null);
  
  await db.account.update({
    where: { id: account.id },
    data: {
      status: newStatus,
      stripePriceId,
      currentPlan: planType || account.currentPlan, // Mantener actual si no viene metadata
    },
  });
}

/**
 * Maneja el evento customer.subscription.deleted
 * 
 * Se ejecuta cuando se cancela la suscripción.
 * Bloquea la cuenta inmediatamente.
 * 
 * @param db - Cliente de Prisma
 * @param subscription - Suscripción de Stripe
 */
export async function handleSubscriptionDeleted(
  db: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const account = await db.account.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });
  
  if (!account) {
    throw new Error('No se encontró cuenta para esta suscripción');
  }
  
  // Cancelar cuenta (marcar como cancelada)
  await db.account.update({
    where: { id: account.id },
    data: {
      status: 'canceled',
      blockedReason: 'Suscripción cancelada',
      blockedAt: new Date(),
    },
  });
}

/**
 * Maneja el evento invoice.payment_succeeded
 * 
 * Se ejecuta cuando se cobra exitosamente una factura.
 * Activa la cuenta si estaba bloqueada por falta de pago.
 * 
 * @param db - Cliente de Prisma
 * @param invoice - Factura de Stripe
 */
export async function handleInvoicePaymentSucceeded(
  db: PrismaClient,
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) {
    return; // No es una factura de suscripción
  }
  
  const account = await db.account.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });
  
  if (!account) {
    return;
  }
  
  // Si estaba bloqueada por falta de pago, reactivar
  if (account.status === 'past_due' || account.status === 'blocked') {
    await db.account.update({
      where: { id: account.id },
      data: {
        status: 'active',
        blockedReason: null,
        blockedAt: null,
      },
    });
  }
}

/**
 * Maneja el evento invoice.payment_failed
 * 
 * Se ejecuta cuando falla el pago de una factura.
 * Marca la cuenta como past_due.
 * 
 * @param db - Cliente de Prisma
 * @param invoice - Factura de Stripe
 */
export async function handleInvoicePaymentFailed(
  db: PrismaClient,
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) {
    return;
  }
  
  const account = await db.account.findFirst({
    where: { stripeSubscriptionId: invoice.subscription as string },
  });
  
  if (!account) {
    return;
  }
  
  // Marcar como atrasado
  await db.account.update({
    where: { id: account.id },
    data: {
      status: 'past_due',
    },
  });
}

/**
 * Verifica la firma del webhook de Stripe
 * 
 * CRÍTICO DE SEGURIDAD: Siempre verificar que el webhook
 * proviene realmente de Stripe.
 * 
 * @param payload - Cuerpo del request
 * @param signature - Header stripe-signature
 * @param secret - Webhook secret de Stripe
 * @returns Evento verificado de Stripe
 */
export async function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Procesa un evento de webhook de Stripe
 * 
 * Recibe el evento y llama al handler correspondiente.
 * 
 * @param db - Cliente de Prisma
 * @param event - Evento de Stripe
 */
export async function processWebhookEvent(
  db: PrismaClient,
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session);
      break;
      
    case 'customer.subscription.created':
      await handleSubscriptionCreated(db, event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription);
      break;
      
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(db, event.data.object as Stripe.Invoice);
      break;
      
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(db, event.data.object as Stripe.Invoice);
      break;
      
    default:
      console.log(`Evento no manejado: ${event.type}`);
  }
}

/**
 * Bloquea cuentas con trial expirado
 * 
 * Job que debe ejecutarse diariamente para bloquear cuentas
 * cuyo trial haya expirado y no tengan suscripción activa.
 * 
 * @param db - Cliente de Prisma
 * @returns Número de cuentas bloqueadas
 */
export async function blockExpiredTrials(
  db: PrismaClient
): Promise<number> {
  const now = new Date();
  
  const result = await db.account.updateMany({
    where: {
      status: 'trialing',
      trialEndsAt: {
        lt: now,
      },
    },
    data: {
      status: 'blocked',
      blockedReason: 'Trial expirado sin pago',
      blockedAt: now,
    },
  });
  
  return result.count;
}
