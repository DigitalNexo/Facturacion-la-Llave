# 🎯 CÓMO SE COMUNICA EL PLAN ELEGIDO EN STRIPE

---

## 📋 FLUJO COMPLETO

### **1️⃣ Usuario elige plan en el frontend**

```typescript
// En tu página de pricing (ej: /pricing)
<button onClick={() => suscribirPlan('AUTONOMO')}>
  Plan Autónomo - 29€/mes
</button>

<button onClick={() => suscribirPlan('EMPRESA_BASIC')}>
  Plan Empresa Basic - 49€/mes
</button>

async function suscribirPlan(planType: string) {
  // Llamada al API con el plan elegido
  const response = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planType })
  });
  
  const { url } = await response.json();
  window.location.href = url; // Redirige a Stripe Checkout
}
```

---

### **2️⃣ Backend recibe el planType**

```typescript
// apps/web/src/app/api/stripe/create-checkout-session/route.ts

export async function POST(req: NextRequest) {
  // 1. Obtener plan del body
  const { planType } = await req.json();
  // planType = "AUTONOMO" | "EMPRESA_BASIC" | "EMPRESA_PRO" | "ASESORIA"
  
  // 2. Validar plan
  if (!['AUTONOMO', 'EMPRESA_BASIC', 'EMPRESA_PRO', 'ASESORIA'].includes(planType)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
  }
  
  // 3. Obtener Price ID de Stripe según el plan
  const priceId = STRIPE_PRICE_IDS[planType];
  // Ejemplo:
  //   planType = "AUTONOMO" → priceId = "price_1Hh1234..."
  //   planType = "EMPRESA_BASIC" → priceId = "price_1Hh5678..."
  
  // 4. Crear sesión de checkout con metadata
  const checkoutSession = await createCheckoutSession(
    accountId,
    priceId,      // ← Stripe sabe qué plan es por este ID
    successUrl,
    cancelUrl,
    userEmail
  );
  
  return NextResponse.json({ url: checkoutSession.url });
}
```

---

### **3️⃣ Stripe Checkout incluye metadata**

```typescript
// packages/core/src/stripe.ts

export async function createCheckoutSession(...) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,  // ← Price ID del plan elegido
        quantity: 1,
      },
    ],
    metadata: {
      accountId,        // ← ID de la cuenta
      planType,         // ← AÑADIREMOS ESTO
    },
    subscription_data: {
      metadata: {
        accountId,
        planType,       // ← También en subscription metadata
      },
      trial_period_days: 15,
    },
  });
  
  return session;
}
```

**Metadata = datos extra que Stripe guarda y te devuelve en los webhooks**

---

### **4️⃣ Usuario paga en Stripe**

El usuario introduce su tarjeta y completa el pago en Stripe Checkout.

---

### **5️⃣ Stripe envía webhook con el plan**

```typescript
// Stripe → Tu servidor: POST /api/stripe/webhook

// Webhook: checkout.session.completed
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_123...",
      "metadata": {
        "accountId": "clu123...",
        "planType": "AUTONOMO"  // ← Aquí está el plan elegido
      },
      "subscription": "sub_123..."
    }
  }
}

// Webhook: customer.subscription.created
{
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_123...",
      "metadata": {
        "accountId": "clu123...",
        "planType": "AUTONOMO"  // ← También aquí
      },
      "items": {
        "data": [{
          "price": {
            "id": "price_1Hh1234..."  // ← Price ID del plan
          }
        }]
      }
    }
  }
}
```

---

### **6️⃣ Webhook handler guarda el plan en BD**

```typescript
// packages/core/src/stripe.ts

export async function handleCheckoutCompleted(
  db: PrismaClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const accountId = session.metadata?.accountId;
  const planType = session.metadata?.planType;  // ← Leer metadata
  
  await db.account.update({
    where: { id: accountId },
    data: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: session.line_items?.data[0]?.price?.id,  // ← Guardar Price ID
      currentPlan: planType,  // ← Guardar plan elegido
    },
  });
}

export async function handleSubscriptionCreated(
  db: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const accountId = subscription.metadata?.accountId;
  const planType = subscription.metadata?.planType;
  
  const priceId = subscription.items.data[0]?.price.id;
  
  await db.account.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
      stripePriceId: priceId,
      currentPlan: planType,
      trialEndsAt: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000) 
        : null,
    },
  });
}
```

---

## 🔄 MAPEO DE PLANES

| planType (Frontend) | Price ID (Stripe) | accountType (BD) | currentPlan (BD) |
|---------------------|-------------------|------------------|------------------|
| `AUTONOMO` | `price_1Hh1234...` | `self_employed` | `AUTONOMO` |
| `EMPRESA_BASIC` | `price_1Hh5678...` | `company` | `EMPRESA_BASIC` |
| `EMPRESA_PRO` | `price_1Hh9012...` | `company` | `EMPRESA_PRO` |
| `ASESORIA` | `price_1Hh3456...` | `company` | `ASESORIA` |

---

## 📊 NUEVOS CAMPOS EN LA BASE DE DATOS

Necesitamos añadir 2 campos al modelo `Account`:

```prisma
model Account {
  id                   String         @id @default(uuid())
  accountType          AccountType    @map("account_type")
  
  // ✨ NUEVO: Plan actual de Stripe
  currentPlan          String?        @map("current_plan")
  // Valores: "AUTONOMO", "EMPRESA_BASIC", "EMPRESA_PRO", "ASESORIA"
  
  // ✨ NUEVO: Price ID actual de Stripe
  stripePriceId        String?        @map("stripe_price_id")
  // Ejemplo: "price_1Hh1234..."
  
  // Stripe IDs (ya existen)
  stripeCustomerId     String?        @unique @map("stripe_customer_id")
  stripeSubscriptionId String?        @unique @map("stripe_subscription_id")
  
  status               AccountStatus  @default(trialing)
  trialEndsAt          DateTime?      @map("trial_ends_at")
  // ...
}
```

---

## 🎯 VENTAJAS DE GUARDAR EL PLAN

### **1. Mostrar plan en el dashboard**
```typescript
// En el frontend
const { account } = await getSession();

<div>
  Plan actual: {account.currentPlan}
  {/* Muestra: "AUTONOMO" o "EMPRESA_BASIC" */}
</div>
```

### **2. Limitar funcionalidades por plan**
```typescript
// Verificar límites
if (account.currentPlan === 'AUTONOMO') {
  maxFacturas = 100;
} else if (account.currentPlan === 'EMPRESA_PRO') {
  maxFacturas = 1000;
}
```

### **3. Cambiar de plan**
```typescript
// Usuario quiere upgrade
async function cambiarPlan(nuevoPlan: string) {
  // Obtener nuevo Price ID
  const newPriceId = STRIPE_PRICE_IDS[nuevoPlan];
  
  // Actualizar suscripción en Stripe
  await stripe.subscriptions.update(account.stripeSubscriptionId, {
    items: [{
      id: subscription.items.data[0].id,
      price: newPriceId,
    }],
    proration_behavior: 'create_prorations', // Prorrateo
  });
  
  // Webhook actualizará currentPlan automáticamente
}
```

### **4. Verificar plan en Stripe Dashboard**
Puedes hacer reverse lookup: dado un `stripePriceId`, saber qué plan es.

---

## 🔍 RECUPERAR EL PLAN SI NO TIENES METADATA

Si por alguna razón no guardaste metadata, puedes **derivar el plan del Price ID**:

```typescript
function getPlanFromPriceId(priceId: string): string {
  switch (priceId) {
    case process.env.STRIPE_PRICE_AUTONOMO:
      return 'AUTONOMO';
    case process.env.STRIPE_PRICE_EMPRESA_BASIC:
      return 'EMPRESA_BASIC';
    case process.env.STRIPE_PRICE_EMPRESA_PRO:
      return 'EMPRESA_PRO';
    case process.env.STRIPE_PRICE_ASESORIA:
      return 'ASESORIA';
    default:
      throw new Error('Plan desconocido');
  }
}

// En el webhook
const priceId = subscription.items.data[0].price.id;
const planType = getPlanFromPriceId(priceId);
```

---

## ✅ RESUMEN

**Flujo completo de comunicación**:

1. **Frontend** → Envía `planType` al API
2. **Backend** → Convierte `planType` → `priceId` 
3. **Stripe Checkout** → Guarda `priceId` y `metadata.planType`
4. **Usuario paga** → Stripe crea suscripción
5. **Webhook** → Envía `priceId` y `metadata.planType` de vuelta
6. **Backend** → Guarda en BD: `currentPlan` y `stripePriceId`
7. **BD actualizada** → La app sabe qué plan tiene el usuario

**TODO automático vía webhooks** 🎉

---

## 🚀 IMPLEMENTACIÓN

Ahora voy a:
1. Añadir campos `currentPlan` y `stripePriceId` a la BD
2. Actualizar funciones de Stripe para guardar el plan
3. Modificar API de checkout para enviar metadata
4. Actualizar webhooks para leer y guardar el plan

¿Seguimos? 🚀
