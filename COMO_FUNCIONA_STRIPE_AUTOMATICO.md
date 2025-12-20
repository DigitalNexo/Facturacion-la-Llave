# 🤖 CÓMO FUNCIONA EL SISTEMA DE PAGOS AUTOMÁTICO
## Todo es automático gracias a Webhooks de Stripe

---

## 🎯 RESPUESTA RÁPIDA

**SÍ, ES 100% AUTOMÁTICO**. No tienes que hacer NADA manualmente.

Stripe te envía **webhooks** (notificaciones) cada vez que algo cambia:
- ✅ Alguien paga → Se activa su cuenta automáticamente
- ❌ Falla un pago → Se marca como "pago pendiente" automáticamente
- 🗑️ Cancela suscripción → Se bloquea su cuenta automáticamente
- ⏰ Trial expira → Script cron la bloquea automáticamente

---

## 📊 CAMPOS EN LA BASE DE DATOS

El modelo `Account` tiene estos campos que se actualizan **automáticamente**:

```prisma
model Account {
  id                   String         @id @default(cuid())
  
  // 🎯 ESTADO DE LA CUENTA (se actualiza automáticamente)
  status               AccountStatus  @default(trialing)
  // Posibles valores:
  //   - trialing: En prueba (15 días gratis)
  //   - active: Pagando y todo OK
  //   - past_due: Pago fallido (Stripe reintenta automáticamente)
  //   - blocked: Bloqueado (no puede acceder)
  
  // 💳 STRIPE IDS (se guardan automáticamente al pagar)
  stripeCustomerId     String?        // ID del cliente en Stripe
  stripeSubscriptionId String?        // ID de la suscripción
  
  // ⏰ TRIAL
  trialEndsAt          DateTime?      // Cuándo expira el trial
  
  // 🔒 BLOQUEO
  blockedAt            DateTime?      // Cuándo se bloqueó
  blockedReason        String?        // Por qué se bloqueó
}
```

---

## 🔄 FLUJO COMPLETO AUTOMÁTICO

### **ESCENARIO 1: Usuario se registra y paga**

```
1. Usuario se registra
   └─> Account creado con:
       - status = "trialing"
       - trialEndsAt = now + 15 días
       - stripeCustomerId = null
       - stripeSubscriptionId = null

2. Usuario click "Suscribirse"
   └─> Redirige a Stripe Checkout (con trial de 15 días)

3. Usuario completa el pago en Stripe
   └─> Stripe envía webhook: checkout.session.completed
   └─> Tu servidor recibe el webhook
   └─> handleCheckoutCompleted() se ejecuta AUTOMÁTICAMENTE
   └─> Actualiza Account:
       ✅ stripeCustomerId = "cus_xxxxx"
       ✅ stripeSubscriptionId = "sub_xxxxx"

4. Stripe crea la suscripción
   └─> Stripe envía webhook: customer.subscription.created
   └─> handleSubscriptionCreated() se ejecuta AUTOMÁTICAMENTE
   └─> Actualiza Account:
       ✅ status = "trialing" (15 días gratis)
       ✅ trialEndsAt = now + 15 días

5. Trial expira (15 días después)
   └─> Stripe cobra automáticamente
   └─> Stripe envía webhook: invoice.payment_succeeded
   └─> handleInvoicePaymentSucceeded() se ejecuta AUTOMÁTICAMENTE
   └─> Actualiza Account:
       ✅ status = "active"
       ✅ blockedAt = null
       ✅ blockedReason = null

✅ RESULTADO: Usuario tiene acceso completo automáticamente
```

---

### **ESCENARIO 2: Pago mensual exitoso**

```
Cada mes, Stripe cobra automáticamente:

1. Stripe intenta cobrar
   └─> Pago exitoso
   └─> Stripe envía webhook: invoice.payment_succeeded
   └─> handleInvoicePaymentSucceeded() se ejecuta
   └─> Actualiza Account:
       ✅ status = "active"

✅ RESULTADO: Usuario sigue teniendo acceso
```

---

### **ESCENARIO 3: Pago mensual FALLA**

```
1. Stripe intenta cobrar
   └─> Pago falla (tarjeta expirada, sin fondos, etc.)
   └─> Stripe envía webhook: invoice.payment_failed
   └─> handleInvoicePaymentFailed() se ejecuta AUTOMÁTICAMENTE
   └─> Actualiza Account:
       ⚠️ status = "past_due"

2. Stripe REINTENTA automáticamente (varios días)
   └─> Si pago exitoso:
       └─> webhook: invoice.payment_succeeded
       └─> ✅ status = "active" (reactivado)
   
   └─> Si sigue fallando:
       └─> Después de varios reintentos, Stripe cancela la suscripción
       └─> webhook: customer.subscription.deleted
       └─> ❌ status = "blocked"
       └─> blockedReason = "Suscripción cancelada por falta de pago"

✅ RESULTADO: Usuario bloqueado automáticamente si no paga
```

---

### **ESCENARIO 4: Usuario cancela suscripción**

```
1. Usuario va al Portal del Cliente
   └─> Click "Cancelar suscripción"

2. Stripe cancela la suscripción
   └─> Stripe envía webhook: customer.subscription.deleted
   └─> handleSubscriptionDeleted() se ejecuta AUTOMÁTICAMENTE
   └─> Actualiza Account:
       ❌ status = "blocked"
       ❌ blockedAt = now
       ❌ blockedReason = "Suscripción cancelada"

✅ RESULTADO: Usuario bloqueado inmediatamente
```

---

### **ESCENARIO 5: Trial expira sin pagar**

```
1. Usuario en trial (15 días gratis)
   └─> Account:
       - status = "trialing"
       - trialEndsAt = 2025-01-01
       - stripeSubscriptionId = null (nunca pagó)

2. Pasa el tiempo... trial expira

3. Script CRON ejecuta diariamente:
   └─> npx tsx block-expired-trials.ts
   └─> Busca cuentas con:
       - status = "trialing"
       - trialEndsAt < now (expirado)
   └─> Actualiza Account:
       ❌ status = "blocked"
       ❌ blockedAt = now
       ❌ blockedReason = "Trial expirado sin pago"

✅ RESULTADO: Usuario bloqueado automáticamente al expirar trial
```

---

## 🛡️ MIDDLEWARE DE PROTECCIÓN

En **TODAS** las rutas protegidas, el sistema verifica automáticamente:

```typescript
// auth.ts (NextAuth)
callbacks: {
  async signIn({ user }) {
    // Buscar cuenta del usuario
    const account = await db.account.findUnique({
      where: { id: user.accountId }
    });
    
    // ❌ Si está bloqueado → NO PUEDE ENTRAR
    if (account.status === 'blocked') {
      return false; // Redirige a página de error
    }
    
    // ✅ Si está activo o en trial → PUEDE ENTRAR
    return true;
  }
}
```

**Resultado**: Si el webhook bloqueó la cuenta, el usuario NO puede acceder en su próximo login.

---

## 🔧 RESUMEN: QUÉ TIENES QUE HACER

### **CONFIGURACIÓN INICIAL** (una sola vez)

1. **Crear productos en Stripe** (seguir [GUIA_CONFIGURACION_STRIPE.md](GUIA_CONFIGURACION_STRIPE.md))
2. **Configurar webhook** en Stripe Dashboard
3. **Copiar claves** a `.env`

### **MANTENIMIENTO** (automático)

**NADA**. Todo funciona solo.

El único script que debes ejecutar diariamente (con cron):

```bash
# Crontab (cada día a la 1 AM)
0 1 * * * cd /path/to/app && npx tsx block-expired-trials.ts
```

Esto bloquea trials expirados que nunca pagaron.

---

## 📋 TABLA DE ESTADOS

| Estado | Descripción | ¿Puede acceder? | Cómo llegó aquí |
|--------|-------------|-----------------|-----------------|
| `trialing` | En prueba (15 días gratis) | ✅ SÍ | Registro inicial |
| `active` | Pagando mensualmente | ✅ SÍ | Pago exitoso |
| `past_due` | Pago falló, Stripe reintentando | ✅ SÍ (por ahora) | Pago fallido |
| `blocked` | Bloqueado | ❌ NO | Trial expirado, pago falló mucho, canceló |

---

## 🎯 EJEMPLOS REALES

### **Ejemplo 1: Usuario paga religiosamente**
```
Día 1:  Registro → status = "trialing"
Día 15: Trial expira, Stripe cobra → status = "active"
Día 45: Stripe cobra mes 2 → status = "active"
Día 75: Stripe cobra mes 3 → status = "active"
...
✅ Siempre tiene acceso
```

### **Ejemplo 2: Usuario no paga nunca**
```
Día 1:  Registro → status = "trialing"
Día 16: Cron detecta trial expirado → status = "blocked"
❌ Bloqueado automáticamente
```

### **Ejemplo 3: Usuario paga pero luego su tarjeta expira**
```
Día 1:  Registro → status = "trialing"
Día 15: Paga → status = "active"
Día 45: Paga → status = "active"
Día 75: Pago FALLA → status = "past_due"
Día 76: Stripe reintenta → FALLA → sigue "past_due"
Día 78: Stripe reintenta → FALLA → sigue "past_due"
Día 80: Stripe reintenta → FALLA → Stripe cancela
        → webhook: subscription.deleted
        → status = "blocked"
❌ Bloqueado automáticamente después de varios reintentos
```

### **Ejemplo 4: Usuario cancela su suscripción**
```
Día 1:  Registro → status = "trialing"
Día 15: Paga → status = "active"
Día 45: Paga → status = "active"
Día 60: Usuario click "Cancelar" en Portal
        → webhook: subscription.deleted
        → status = "blocked"
❌ Bloqueado inmediatamente
```

---

## 🔍 CÓMO VER EL ESTADO DE UN USUARIO

### **Opción 1: Base de datos**
```sql
SELECT 
  id,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
  trialEndsAt,
  blockedAt,
  blockedReason
FROM "Account"
WHERE id = 'clu1234567890';
```

### **Opción 2: Panel admin interno**
```
/admin
→ Ver usuarios
→ Ver estado de cada cuenta
```

### **Opción 3: Stripe Dashboard**
```
https://dashboard.stripe.com/customers
→ Buscar cliente por email
→ Ver historial de pagos
→ Ver estado de suscripción
```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### **Problema: "Usuario dice que pagó pero sigue bloqueado"**

**Causa posible**: Webhook no llegó o falló.

**Solución**:
1. Ve a Stripe Dashboard → Developers → Webhooks
2. Click en tu webhook
3. Pestaña "Recent events"
4. Busca el evento (invoice.payment_succeeded)
5. Verifica que status sea **200 OK**
6. Si falló (500/400), reenvía el webhook manualmente

**O ejecuta manualmente**:
```sql
-- Activar cuenta manualmente
UPDATE "Account"
SET status = 'active', blockedAt = NULL, blockedReason = NULL
WHERE id = 'clu1234567890';
```

### **Problema: "Webhook no llega"**

**Causa**: URL incorrecta o firewall bloqueando.

**Solución**:
1. Verifica URL en Stripe Dashboard: `https://tu-dominio.com/api/stripe/webhook`
2. Verifica que tu servidor esté corriendo
3. Verifica que SSL/HTTPS funcione
4. Prueba con Stripe CLI local:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### **Problema: "Trials no se bloquean"**

**Causa**: Cron no está ejecutándose.

**Solución**:
1. Ejecuta manualmente:
   ```bash
   npx tsx block-expired-trials.ts
   ```
2. Configura cron:
   ```bash
   crontab -e
   # Añade:
   0 1 * * * cd /path/to/app && npx tsx block-expired-trials.ts
   ```

---

## ✅ CHECKLIST DE AUTOMATIZACIÓN

Verifica que todo esté configurado:

```
[ ] Webhook configurado en Stripe Dashboard
[ ] Webhook apunta a: https://tu-dominio.com/api/stripe/webhook
[ ] 6 eventos configurados (checkout.completed, subscription.created/updated/deleted, invoice.succeeded/failed)
[ ] STRIPE_WEBHOOK_SECRET en .env
[ ] Script cron configurado para block-expired-trials.ts
[ ] Middleware de auth verifica account.status
[ ] Tests pasados (npx tsx test-fase9.ts)
```

---

## 🎉 CONCLUSIÓN

**EL SISTEMA ES 100% AUTOMÁTICO**.

Tú solo:
1. Configuras Stripe (una vez)
2. Configuras el cron (una vez)
3. **Ya está**

Stripe hace TODO el resto:
- ✅ Cobra automáticamente cada mes
- ✅ Te envía webhooks cuando algo cambia
- ✅ Tu servidor actualiza la base de datos automáticamente
- ✅ El middleware bloquea el acceso automáticamente
- ✅ El cron bloquea trials expirados automáticamente

**No tienes que tocar NADA manualmente** 🚀
