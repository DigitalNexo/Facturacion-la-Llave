import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { createCheckoutSession, STRIPE_PRICE_IDS } from '@fll/core';

const db = new PrismaClient();

/**
 * POST /api/stripe/create-checkout-session
 * 
 * Crea una sesión de checkout de Stripe para iniciar una suscripción.
 * 
 * Body:
 * {
 *   "planType": "AUTONOMO" | "EMPRESA_BASIC" | "EMPRESA_PRO" | "ASESORIA"
 * }
 * 
 * Returns:
 * {
 *   "url": "https://checkout.stripe.com/..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // 2. Obtener usuario y cuenta
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        account: true,
      },
    });
    
    if (!user || !user.account) {
      return NextResponse.json({ error: 'Usuario o cuenta no encontrada' }, { status: 404 });
    }
    
    // 3. Verificar que la cuenta no tenga ya una suscripción activa
    if (user.account.status === 'active' && user.account.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Ya tienes una suscripción activa' },
        { status: 400 }
      );
    }
    
    // 4. Validar que no sea cuenta de advisor (gestores no pagan)
    if (user.account.accountType === 'advisor') {
      return NextResponse.json(
        { error: 'Las cuentas de gestor no requieren suscripción' },
        { status: 400 }
      );
    }
    
    // 5. Obtener plan solicitado
    const body = await req.json();
    const { planType } = body;
    
    if (!planType || !['AUTONOMO', 'EMPRESA_BASIC', 'EMPRESA_PRO', 'ASESORIA'].includes(planType)) {
      return NextResponse.json(
        { error: 'Plan inválido. Debe ser: AUTONOMO, EMPRESA_BASIC, EMPRESA_PRO o ASESORIA' },
        { status: 400 }
      );
    }
    
    // 6. Obtener priceId de Stripe
    const priceId = STRIPE_PRICE_IDS[planType as keyof typeof STRIPE_PRICE_IDS];
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Plan no configurado. Contacta con soporte.' },
        { status: 500 }
      );
    }
    
    // 7. Crear sesión de checkout
    const baseUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const checkoutSession = await createCheckoutSession(
      user.account.id,
      priceId,
      planType, // Enviar el plan elegido
      `${baseUrl}/dashboard?payment=success`,
      `${baseUrl}/pricing?payment=cancelled`,
      user.email
    );
    
    return NextResponse.json({ url: checkoutSession.url });
    
  } catch (error: unknown) {
    console.error('Error al crear checkout session:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
}
