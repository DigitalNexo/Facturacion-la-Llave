import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../../auth';
import { PrismaClient } from '@fll/db';
import { createPortalSession } from '@fll/core';

const db = new PrismaClient();

/**
 * POST /api/stripe/create-portal-session
 * 
 * Crea una sesión del portal del cliente de Stripe.
 * 
 * El portal permite al cliente:
 * - Ver sus facturas de Stripe
 * - Actualizar método de pago
 * - Cancelar su suscripción
 * 
 * Returns:
 * {
 *   "url": "https://billing.stripe.com/..."
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
    
    // 3. Verificar que tenga stripeCustomerId
    if (!user.account.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No tienes una suscripción activa' },
        { status: 400 }
      );
    }
    
    // 4. Crear sesión del portal
    const baseUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const portalSession = await createPortalSession(
      user.account.stripeCustomerId,
      `${baseUrl}/dashboard`
    );
    
    return NextResponse.json({ url: portalSession.url });
    
  } catch (error: unknown) {
    console.error('Error al crear portal session:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear sesión del portal' },
      { status: 500 }
    );
  }
}
