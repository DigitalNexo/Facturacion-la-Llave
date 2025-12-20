import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@fll/db';
import { verifyWebhookSignature, processWebhookEvent } from '@fll/core';

const db = new PrismaClient();

/**
 * POST /api/stripe/webhook
 * 
 * Recibe eventos de Stripe (webhooks).
 * 
 * IMPORTANTE:
 * - Stripe envía eventos cuando algo cambia (pago exitoso, suscripción cancelada, etc.)
 * - SIEMPRE verificar la firma del webhook (seguridad crítica)
 * - Los webhooks son la ÚNICA fuente de verdad del estado de pago
 * 
 * Este endpoint NO requiere autenticación (viene de Stripe)
 * pero SÍ verifica la firma criptográfica.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Obtener el body raw (necesario para verificar firma)
    const body = await req.text();
    
    // 2. Obtener la firma del header
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No stripe-signature header' },
        { status: 400 }
      );
    }
    
    // 3. Obtener el webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET no configurado');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    // 4. Verificar firma (CRÍTICO DE SEGURIDAD)
    let event;
    try {
      event = await verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Error verificando firma del webhook:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // 5. Log del evento recibido
    console.log(`✅ Webhook recibido: ${event.type} (${event.id})`);
    
    // 6. Procesar evento
    try {
      await processWebhookEvent(db, event);
      console.log(`✅ Webhook procesado: ${event.type}`);
    } catch (err: any) {
      console.error(`❌ Error procesando webhook ${event.type}:`, err.message);
      // Retornar 200 igualmente para que Stripe no reintente
      // (evitar loops infinitos si hay un error en nuestra lógica)
      return NextResponse.json(
        { received: true, error: err.message },
        { status: 200 }
      );
    }
    
    // 7. Confirmar recepción a Stripe
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error: unknown) {
    console.error('Error en webhook de Stripe:', error);
    
    // Retornar 500 para que Stripe reintente
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
