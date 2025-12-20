# ✅ IMPLEMENTACIÓN COMPLETADA: COMUNICACIÓN DE PLANES

---

## 🎉 CAMBIOS REALIZADOS

### **1. Base de Datos** (schema.prisma)

Añadidos 2 campos nuevos al modelo `Account`:

```prisma
model Account {
  // ... campos existentes
  
  // ✨ NUEVO: Plan actual elegido por el usuario
  currentPlan          String?        @map("current_plan")
  // Valores posibles: "AUTONOMO", "EMPRESA_BASIC", "EMPRESA_PRO", "ASESORIA"
  
  // ✨ NUEVO: Price ID de Stripe del plan actual
  stripePriceId        String?        @map("stripe_price_id")
  // Ejemplo: "price_1Hh1234AbCdEf567"
}
```

### **2. Función createCheckoutSession** (stripe.ts)

Añadido parámetro `planType` y enviado en metadata:

```typescript
export async function createCheckoutSession(
  accountId: string,
  priceId: string,
  planType: string, // ← NUEVO parámetro
  successUrl: string,
  cancelUrl: string,
  customerEmail: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    // ...
    metadata: {
      accountId,
      planType, // ← Enviado a Stripe
    },
    subscription_data: {
      metadata: {
        accountId,
        planType, // ← También en subscription
      },
      // ...
    },
  });
}
```

### **3. Webhook Handlers** (stripe.ts)

#### handleCheckoutCompleted
```typescript
export async function handleCheckoutCompleted(
  db: PrismaClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const accountId = session.metadata?.accountId;
  const planType = session.metadata?.planType; // ← Leer metadata
  
  await db.account.update({
    where: { id: accountId },
    data: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      currentPlan: planType, // ← Guardar plan
    },
  });
}
```

#### handleSubscriptionCreated
```typescript
export async function handleSubscriptionCreated(
  db: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const stripePriceId = subscription.items.data[0]?.price.id;
  const planType = subscription.metadata?.planType || 
                   (stripePriceId ? getPlanFromPriceId(stripePriceId) : null);
  // ↑ Intenta obtener de metadata, o deriva del Price ID
  
  await db.account.update({
    where: { id: accountId },
    data: {
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      stripePriceId,     // ← Guardar Price ID
      currentPlan: planType, // ← Guardar plan
    },
  });
}
```

#### handleSubscriptionUpdated
```typescript
export async function handleSubscriptionUpdated(
  db: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const stripePriceId = subscription.items.data[0]?.price.id;
  const planType = subscription.metadata?.planType || 
                   (stripePriceId ? getPlanFromPriceId(stripePriceId) : null);
  
  await db.account.update({
    where: { id: account.id },
    data: {
      status: newStatus,
      stripePriceId,     // ← Actualizar si cambió (upgrade/downgrade)
      currentPlan: planType || account.currentPlan, // ← Actualizar o mantener
    },
  });
}
```

### **4. Función Auxiliar** (stripe.ts)

Nueva función para derivar plan del Price ID:

```typescript
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
```

### **5. API Endpoint** (create-checkout-session/route.ts)

Ahora pasa el `planType` a `createCheckoutSession`:

```typescript
export async function POST(req: NextRequest) {
  const { planType } = await req.json();
  
  // Validar plan
  if (!['AUTONOMO', 'EMPRESA_BASIC', 'EMPRESA_PRO', 'ASESORIA'].includes(planType)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
  }
  
  // Obtener Price ID
  const priceId = STRIPE_PRICE_IDS[planType as keyof typeof STRIPE_PRICE_IDS];
  
  // Crear checkout con planType
  const checkoutSession = await createCheckoutSession(
    user.account.id,
    priceId,
    planType, // ← Enviado aquí
    successUrl,
    cancelUrl,
    user.email
  );
  
  return NextResponse.json({ url: checkoutSession.url });
}
```

---

## 🔄 FLUJO COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend: Usuario click "Plan Autónomo"                 │
│    → POST /api/stripe/create-checkout-session              │
│    → Body: { planType: "AUTONOMO" }                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend: Recibe planType                                │
│    → planType = "AUTONOMO"                                 │
│    → priceId = STRIPE_PRICE_IDS.AUTONOMO                   │
│    → priceId = "price_1Hh1234..."                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Stripe Checkout creado con:                             │
│    → line_items: [{ price: "price_1Hh1234...", qty: 1 }]  │
│    → metadata: { accountId, planType: "AUTONOMO" }         │
│    → subscription_data.metadata: { planType: "AUTONOMO" }  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Usuario paga en Stripe                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Webhook: checkout.session.completed                     │
│    → session.metadata.planType = "AUTONOMO"                │
│    → handleCheckoutCompleted()                             │
│    → DB: currentPlan = "AUTONOMO"                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Webhook: customer.subscription.created                  │
│    → subscription.metadata.planType = "AUTONOMO"           │
│    → subscription.items[0].price.id = "price_1Hh1234..."  │
│    → handleSubscriptionCreated()                           │
│    → DB: stripePriceId = "price_1Hh1234..."               │
│    → DB: currentPlan = "AUTONOMO"                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Base de datos actualizada                               │
│    Account:                                                 │
│      - currentPlan = "AUTONOMO"                            │
│      - stripePriceId = "price_1Hh1234..."                  │
│      - stripeCustomerId = "cus_xxx"                        │
│      - stripeSubscriptionId = "sub_xxx"                    │
│      - status = "trialing"                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 CASOS DE USO

### **1. Mostrar plan actual en el dashboard**

```typescript
// apps/web/src/app/dashboard/page.tsx
const account = await db.account.findUnique({
  where: { id: user.accountId }
});

return (
  <div>
    <h2>Plan actual: {account.currentPlan}</h2>
    <p>Estado: {account.status}</p>
  </div>
);
```

### **2. Limitar funcionalidades por plan**

```typescript
// Middleware o función de verificación
function canCreateMoreInvoices(account: Account, currentCount: number): boolean {
  const limits = {
    AUTONOMO: 100,
    EMPRESA_BASIC: 500,
    EMPRESA_PRO: 1000,
    ASESORIA: 5000,
  };
  
  const limit = limits[account.currentPlan as keyof typeof limits] || 0;
  return currentCount < limit;
}
```

### **3. Upgrade/Downgrade de plan**

```typescript
// API endpoint para cambiar plan
export async function POST(req: NextRequest) {
  const { newPlan } = await req.json();
  const newPriceId = STRIPE_PRICE_IDS[newPlan];
  
  // Actualizar suscripción en Stripe
  await stripe.subscriptions.update(account.stripeSubscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations', // Prorrateo automático
  });
  
  // Webhook subscription.updated actualizará currentPlan automáticamente
}
```

### **4. Verificar si puede usar feature premium**

```typescript
function canUseAdvancedFeatures(account: Account): boolean {
  return ['EMPRESA_PRO', 'ASESORIA'].includes(account.currentPlan || '');
}
```

---

## 🔐 REDUNDANCIA: Plan derivable del Price ID

Incluso si por alguna razón no se guarda el metadata `planType`, el sistema puede derivarlo del `stripePriceId`:

```typescript
const account = await db.account.findUnique({ where: { id } });

let plan = account.currentPlan;

// Si no hay plan guardado, derivar del Price ID
if (!plan && account.stripePriceId) {
  plan = getPlanFromPriceId(account.stripePriceId);
}

console.log(`Plan del usuario: ${plan}`);
```

---

## 📊 EJEMPLO EN BD

Después de que un usuario se suscriba:

```sql
SELECT 
  id,
  accountType,
  currentPlan,
  stripePriceId,
  stripeCustomerId,
  stripeSubscriptionId,
  status,
  trialEndsAt
FROM "accounts"
WHERE id = 'clu123xyz';

-- Resultado:
┌────────────┬──────────────┬───────────────┬──────────────────┬────────────────┬─────────────────┬──────────┬─────────────┐
│ id         │ accountType  │ currentPlan   │ stripePriceId    │ stripeCustomer │ stripeSubscrip  │ status   │ trialEndsAt │
├────────────┼──────────────┼───────────────┼──────────────────┼────────────────┼─────────────────┼──────────┼─────────────┤
│ clu123xyz  │ self_employed│ AUTONOMO      │ price_1Hh1234... │ cus_abc123     │ sub_xyz789      │ trialing │ 2025-02-01  │
└────────────┴──────────────┴───────────────┴──────────────────┴────────────────┴─────────────────┴──────────┴─────────────┘
```

---

## ✅ PRÓXIMOS PASOS

1. **Migrar base de datos**:
   ```bash
   npx prisma migrate dev --name add_current_plan_and_price_id
   ```

2. **Generar cliente Prisma**:
   ```bash
   npx prisma generate
   ```

3. **Actualizar tests** (test-fase9.ts) para verificar que se guarda el plan

4. **Crear página de pricing** en el frontend para que usuarios elijan planes

---

## 🎯 RESUMEN

**ANTES**:
- ❌ No se sabía qué plan eligió el usuario
- ❌ No se guardaba el Price ID
- ❌ Imposible mostrar plan actual en dashboard
- ❌ Difícil limitar features por plan

**AHORA**:
- ✅ Plan guardado en `currentPlan`
- ✅ Price ID guardado en `stripePriceId`
- ✅ Comunicación automática vía metadata de Stripe
- ✅ Derivable del Price ID como backup
- ✅ Actualización automática en upgrades/downgrades
- ✅ Fácil mostrar y limitar features por plan

**TODO es automático gracias a webhooks** 🚀
